import Prisma from "../../db/db.js";
import WalletEngine from "../../engines/wallet.engine.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import CommissionEngine from "../../engines/commission.engine.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import ApiEntityService from "../common/api-entity.service.js";
import TransactionService from "../common/transaction.service.js";
import { getAadhaarPlugin } from "../../plugin_registry/aadhaar.registry.js";
import { ApiError } from "../../utils/ApiError.js";
import ProviderResolver from "../../resolvers/Provider.resolver.js";

export default class AadhaarService {
  // STEP 1 — SEND OTP
  static async sendOtp(payload, actor) {
    const { aadhaarNumber, serviceId } = payload;

    await ServicePermissionResolver.validateHierarchyServiceAccess(
      actor.id,
      serviceId
    );

    const providerCode = await ProviderResolver.resolveProviderCode(serviceId);

    const plugin = getAadhaarPlugin(providerCode, {
      bulkpeBaseUrl: process.env.BULKPE_URL,
      apiKey: process.env.BULKPE_KEY,
    });

    return await Prisma.$transaction(async (tx) => {
      // 1️⃣ Calculate Commission (Only base amount for hold)
      const commissionData = await CommissionEngine.calculate({
        retailerId: userId,
        serviceId,
        amount: 10000n, // ₹100 example
      });

      const amount = commissionData.baseAmount;

      // 2️⃣ Create Transaction + ApiEntity
      const { transaction, apiEntity } = await TransactionService.create(tx, {
        userId,
        serviceId,
        amount,
        entityType: "AADHAAR_OTP",
        idempotencyKey,
      });

      // 3️⃣ Hold Wallet
      const wallet = await WalletEngine.getWallet(tx, userId);
      await WalletEngine.hold(tx, wallet, amount);

      // 4️⃣ Call Provider
      const providerResponse = await plugin.sendOtp({ aadhaarNumber });

      // 5️⃣ Save Provider Reference
      await ApiEntityService.attachProviderReference(tx, {
        apiEntityId: apiEntity.id,
        providerReference: providerResponse.referenceId,
      });

      return {
        transactionId: transaction.id,
        referenceId: providerResponse.referenceId,
      };
    });
  }

  // 🔹 STEP 2 — VERIFY OTP
  static async verifyOtp({ userId, transactionId, referenceId, otp }) {
    const providerCode = "BULKPE";
    const plugin = getAadhaarPlugin(providerCode, {
      bulkpeBaseUrl: process.env.BULKPE_URL,
      apiKey: process.env.BULKPE_KEY,
    });

    return await Prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) throw ApiError.notFound("Transaction not found");

      const wallet = await WalletEngine.getWallet(tx, userId);

      // 1️⃣ Call Provider Verify
      const result = await plugin.verifyOtp({ referenceId, otp });

      if (result.data?.status === true) {
        // 2️⃣ Capture Hold
        await WalletEngine.captureHold(tx, wallet, transaction.amount);

        // 3️⃣ Ledger Entry
        await LedgerEngine.create(tx, {
          walletId: wallet.id,
          transactionId,
          entryType: "DEBIT",
          serviceId: transaction.serviceId,
          amount: transaction.amount,
          narration: "Aadhaar Verification Charge",
          createdBy: userId,
        });

        // 4️⃣ Commission Distribution
        await CommissionEngine.distribute(tx, {
          transactionId,
          userId,
          serviceId: transaction.serviceId,
          amount: transaction.amount,
          createdBy: userId,
        });

        // 5️⃣ Update Transaction
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
          },
        });

        return { status: "SUCCESS" };
      } else {
        // ❌ Release Hold
        await WalletEngine.releaseHold(tx, wallet, transaction.amount);

        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: "FAILED" },
        });

        return { status: "FAILED" };
      }
    });
  }
}
