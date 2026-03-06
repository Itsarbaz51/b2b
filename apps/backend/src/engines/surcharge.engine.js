import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";

export default class SurchargeEngine {
  static async calculate(
    tx,
    { userId, serviceProviderMappingId, amount = 0n }
  ) {
    const txnAmount = BigInt(amount);
    let totalSurcharge = 0n;

    let currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true, parentId: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    while (currentUser) {
      const rule = await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          mode: "SURCHARGE",
          isActive: true,
          OR: [
            { targetUserId: currentUser.id },
            { roleId: currentUser.roleId },
          ],
        },
      });

      if (rule) {
        let surcharge = 0n;
        const value = BigInt(Math.floor(Number(rule.value)));

        if (rule.type === "PERCENTAGE") {
          surcharge = (txnAmount * value) / 100n;
        } else {
          surcharge = value;
        }

        totalSurcharge += surcharge;
      }

      if (!currentUser.parentId) break;

      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
        select: { id: true, roleId: true, parentId: true },
      });
    }

    return totalSurcharge;
  }

  static async distribute(
    tx,
    { transactionId, userId, serviceProviderMappingId, createdBy }
  ) {
    let currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true, parentId: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    // 1️⃣ get txn user surcharge
    const txnRule = await tx.commissionSetting.findFirst({
      where: {
        serviceProviderMappingId,
        mode: "SURCHARGE",
        isActive: true,
        roleId: currentUser.roleId,
      },
    });

    if (!txnRule)
      throw ApiError.badRequest("Txn user surcharge not configured");

    let previousRate = BigInt(txnRule.value);

    // parent start
    currentUser = await tx.user.findUnique({
      where: { id: currentUser.parentId },
      select: { id: true, roleId: true, parentId: true },
    });

    while (currentUser) {
      const rule = await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          mode: "SURCHARGE",
          isActive: true,
          roleId: currentUser.roleId,
        },
      });

      if (rule) {
        const ruleValue = BigInt(rule.value);

        const commission = previousRate - ruleValue;

        if (commission > 0n) {
          const wallet = await WalletEngine.getWallet({
            tx,
            userId: currentUser.id,
            walletType: "COMMISSION",
          });

          await WalletEngine.credit(tx, wallet, commission);

          await LedgerEngine.create(tx, {
            walletId: wallet.id,
            transactionId,
            entryType: "CREDIT",
            referenceType: "SURCHARGE",
            serviceProviderMappingId,
            amount: commission,
            narration: "Surcharge earning",
            createdBy,
          });
        }

        previousRate = ruleValue;
      }

      if (!currentUser.parentId) break;

      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
        select: { id: true, roleId: true, parentId: true },
      });
    }

    // last remaining → ADMIN
    if (previousRate > 0n) {
      const admin = await tx.user.findFirst({
        where: { parentId: null },
        select: { id: true },
      });

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "COMMISSION",
      });

      await WalletEngine.credit(tx, wallet, previousRate);

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "SURCHARGE",
        serviceProviderMappingId,
        amount: previousRate,
        narration: "Admin surcharge",
        createdBy,
      });
    }
  }
}
