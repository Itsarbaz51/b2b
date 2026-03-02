import Prisma from "../../db/db.js";
import WalletEngine from "../../engines/wallet.engine.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import CommissionEngine from "../../engines/commission.engine.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import ApiEntityService from "../apiEntity.service.js";
import TransactionService from "../transaction.service.js";
import { getAadhaarPlugin } from "../../plugin_registry/aadhaar/pluginRegistry.js";
import { ApiError } from "../../utils/ApiError.js";
import ProviderResolver from "../../resolvers/Provider.resolver.js";

export default class AadhaarService {
  // STEP 1 — SEND OTP
  static async sendOtp(payload, actor) {
    const { aadhaarNumber, serviceId, idempotencyKey } = payload;
    const userId = actor.id;

    await ServicePermissionResolver.validateHierarchyServiceAccess(
      userId,
      serviceId
    );

    const { provider, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId);

    const plugin = getAadhaarPlugin(
      provider.code,
      serviceProviderMapping.config
    );

    return await Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId,
        walletType: "PRIMARY",
      });

      // Hold full selling price
      await WalletEngine.hold(tx, wallet, sellingPrice);

      const sellingPrice = BigInt(serviceProviderMapping.sellingPrice);

      const providerCost = BigInt(serviceProviderMapping.providerCost);

      if (sellingPrice <= providerCost)
        throw ApiError.notFound("Invalid pricing config");

      const marginPool = sellingPrice - providerCost;

      // Commission calculate on margin only
      const commissionData = await CommissionEngine.calculate({
        userId,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: marginPool,
      });

      // Create transaction for full selling price
      const { transaction, apiEntity } = await TransactionService.create(tx, {
        userId,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: sellingPrice,
        idempotencyKey,
        requestPayload: payload,
      });

      let providerResponse;

      try {
        providerResponse = await plugin.sendOtp({ aadhaarNumber });

        await ApiEntityService.updateProviderInit(tx, {
          apiEntityId: apiEntity.id,
          providerResponse,
        });

        return {
          transactionId: transaction.id,
          referenceId: providerResponse.referenceId,
          commissionPreview: commissionData.breakdown,
        };
      } catch (error) {
        // Release hold if provider fails
        await WalletEngine.releaseHold(tx, wallet, sellingPrice);

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "FAILED" },
        });

        throw error;
      }
    });
  }

  //  STEP 2 — VERIFY OTP
  static async verifyOtp(payload, actor) {
    const { transactionId, referenceId, otp } = payload;
    const userId = actor.id;

    return await Prisma.$transaction(async (tx) => {
      // Fetch Transaction with mapping
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          serviceProviderMapping: {
            include: { provider: true },
          },
          apiEntity: true,
        },
      });

      if (!transaction) throw ApiError.notFound("Transaction not found");

      if (transaction.status !== "PENDING")
        throw ApiError.badRequest("Invalid transaction state");

      const { serviceProviderMapping } = transaction;

      const plugin = getAadhaarPlugin(
        serviceProviderMapping.provider.code,
        serviceProviderMapping.config
      );

      const wallet = await WalletEngine.getWallet(tx, userId);

      let providerResponse;

      try {
        // Call Provider Verify
        providerResponse = await plugin.verifyOtp({
          referenceId,
          otp,
        });

        if (providerResponse?.status === true) {
          // Capture Hold
          await WalletEngine.captureHold(tx, wallet, transaction.amount);

          // Ledger Entry
          await LedgerEngine.create(tx, {
            walletId: wallet.id,
            transactionId: transaction.id,
            entryType: "DEBIT",
            referenceType: "TRANSACTION",
            serviceProviderMappingId: serviceProviderMapping.id,
            amount: transaction.amount,
            narration: "Aadhaar Verification Charge",
            createdBy: userId,
          });

          // Commission Distribution (margin only)
          const marginPool =
            BigInt(serviceProviderMapping.sellingPrice) -
            BigInt(serviceProviderMapping.providerCost);

          await CommissionEngine.distribute(tx, {
            transactionId: transaction.id,
            userId,
            serviceProviderMappingId: serviceProviderMapping.id,
            amount: marginPool,
            createdBy: userId,
          });

          // Update Transaction + ApiEntity
          await TransactionService.update(tx, {
            transactionId: transaction.id,
            status: "SUCCESS",
            providerReference: referenceId,
            providerResponse,
          });

          return { status: "SUCCESS" };
        } else {
          throw new Error("OTP verification failed");
        }
      } catch (error) {
        // Release Hold
        await WalletEngine.releaseHold(tx, wallet, transaction.amount);

        // Update Transaction + ApiEntity
        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerReference: referenceId,
          providerResponse: error.response || error.message,
        });

        throw error;
      }
    });
  }
}
