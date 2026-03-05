import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";

export default class CommissionEngine {
  static async distribute(
    tx,
    { transactionId, userId, serviceProviderMappingId, amount, createdBy }
  ) {
    let currentUser = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    let previousRate = 0;
    const baseAmount = Number(amount);

    while (currentUser) {
      const rule = await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          isActive: true,
          OR: [
            { targetUserId: currentUser.id },
            { roleId: currentUser.roleId },
          ],
        },
        orderBy: {
          scope: "desc",
        },
      });

      if (!rule) {
        if (!currentUser.parentId) break;

        currentUser = await tx.user.findUnique({
          where: { id: currentUser.parentId },
        });

        continue;
      }

      let commission = 0;

      if (rule.type === "PERCENTAGE") {
        commission = (baseAmount * Number(rule.value)) / 100;
      } else {
        commission = Number(rule.value);
      }

      commission = commission - previousRate;

      if (commission <= 0) {
        previousRate += commission;
        currentUser = await tx.user.findUnique({
          where: { id: currentUser.parentId },
        });
        continue;
      }

      let tdsAmount = 0;
      let gstAmount = 0;

      if (rule.applyTDS && rule.tdsPercent) {
        tdsAmount = (commission * Number(rule.tdsPercent)) / 100;
      }

      if (rule.applyGST && rule.gstPercent) {
        gstAmount = (commission * Number(rule.gstPercent)) / 100;
      }

      const netAmount = commission - tdsAmount - gstAmount;

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: currentUser.id,
        walletType: "COMMISSION",
      });

      await WalletEngine.credit(tx, wallet, Math.floor(netAmount));

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "COMMISSION",
        serviceProviderMappingId,
        amount: Math.floor(netAmount),
        narration: "Commission earned",
        createdBy,
      });

      await tx.commissionEarning.create({
        data: {
          transactionId,
          userId: currentUser.id,
          fromUserId: userId,
          serviceProviderMappingId,
          amount: baseAmount,
          mode: rule.mode,
          type: rule.type,
          commissionAmount: Math.floor(commission),
          tdsAmount: Math.floor(tdsAmount),
          gstAmount: Math.floor(gstAmount),
          netAmount: Math.floor(netAmount),
          createdBy,
        },
      });

      previousRate += commission;

      if (!currentUser.parentId) break;

      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }
  }
}
