import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";

export default class CommissionEngine {
  static async distribute(
    tx,
    {
      transactionId,
      userId,
      serviceProviderMappingId,
      sellingPrice,
      providerCost,
      createdBy,
    }
  ) {
    const margin = Number(sellingPrice) - Number(providerCost);

    if (margin <= 0) return;

    let previousRate = 0;

    let currentUser = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    // start from parent
    if (currentUser.parentId) {
      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }

    while (currentUser) {
      const rule = await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          mode: "COMMISSION",
          isActive: true,
          OR: [
            { targetUserId: currentUser.id },
            { roleId: currentUser.roleId },
          ],
        },
        orderBy: { scope: "asc" },
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
        commission = (margin * Number(rule.value)) / 100;
      } else {
        commission = Number(rule.value);
      }

      commission = commission - previousRate;

      if (commission <= 0) {
        if (!currentUser.parentId) break;

        currentUser = await tx.user.findUnique({
          where: { id: currentUser.parentId },
        });

        continue;
      }

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: currentUser.id,
        walletType: "COMMISSION",
      });

      await WalletEngine.credit(tx, wallet, Math.floor(commission));

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "COMMISSION",
        serviceProviderMappingId,
        amount: Math.floor(commission),
        narration: "Recharge commission",
        createdBy,
      });

      previousRate += commission;

      if (!currentUser.parentId) break;

      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }
  }
}
