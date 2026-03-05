import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";

export default class CommissionEngine {
  static async distribute(
    tx,
    { transactionId, userId, serviceProviderMappingId, amount, createdBy }
  ) {
    const mapping = await tx.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });

    if (!mapping) throw ApiError.notFound("Service mapping not found");

    if (mapping.commissionStartLevel === "NONE") return;

    const txnUser = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!txnUser) throw ApiError.notFound("User not found");

    let currentUser;

    // ---------------- ADMIN ONLY ----------------
    if (mapping.commissionStartLevel === "ADMIN_ONLY") {
      const adminUser = await tx.user.findFirst({
        where: {
          role: { name: "ADMIN" },
        },
      });

      if (!adminUser) throw ApiError.notFound("Admin not found");

      // rule resolve txn user se
      const rule = await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          isActive: true,
          OR: [{ targetUserId: txnUser.id }, { roleId: txnUser.roleId }],
        },
        orderBy: {
          scope: "asc", // USER > ROLE
        },
      });

      if (!rule) return;

      let commission = 0;

      if (rule.type === "PERCENTAGE") {
        commission = (Number(amount) * Number(rule.value)) / 100;
      } else {
        commission = Number(rule.value);
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
        userId: adminUser.id,
        walletType: "COMMISSION",
      });

      if (!wallet) throw ApiError.notFound("Commission wallet not found");

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
          userId: adminUser.id,
          fromUserId: userId,
          serviceProviderMappingId,
          amount: Number(amount),
          mode: rule.mode,
          type: rule.type,
          commissionAmount: Math.floor(commission),
          tdsAmount: Math.floor(tdsAmount),
          gstAmount: Math.floor(gstAmount),
          netAmount: Math.floor(netAmount),
          createdBy,
        },
      });

      return;
    }

    // ---------------- HIERARCHY ----------------

    currentUser = txnUser.parentId
      ? await tx.user.findUnique({ where: { id: txnUser.parentId } })
      : null;

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
          scope: "asc",
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
        if (!currentUser.parentId) break;

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

      if (!wallet) throw ApiError.notFound("Commission wallet not found");

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
