import Prisma from "../db/db.js";
import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";
import CommissionEarningService from "../services/commission.service.js";

export default class CommissionEngine {
  // DISTRIBUTE COMMISSION
  static async distribute(
    tx,
    { transactionId, pricing, serviceProviderMappingId, createdBy }
  ) {
    const { commissions, adminUserId, amount, gst } = pricing;

    for (const c of commissions) {
      const netAmount = c.commissionAmount - (c.tdsAmount || 0n);

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: c.userId,
        walletType: "COMMISSION",
      });

      await WalletEngine.credit(tx, wallet, netAmount);

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "COMMISSION",
        serviceProviderMappingId,
        amount: netAmount,
        narration: "Commission Earned",
        createdBy,
      });

      // ✅ COMMISSION EARNING SAVE
      await CommissionEarningService.create(tx, {
        transactionId,
        userId: c.userId,
        fromUserId: createdBy,
        serviceProviderMappingId,

        amount,

        mode: c.mode,
        type: c.type,

        commissionAmount: c.commissionAmount,
        surchargeAmount: null,
        tdsAmount: c.tdsAmount || null,
        gstAmount: null,

        netAmount,
        createdBy,
      });

      // TDS → ADMIN
      if (c.tdsAmount && c.tdsAmount > 0n) {
        const tdsWallet = await WalletEngine.getWallet({
          tx,
          userId: adminUserId,
          walletType: "TDS",
        });

        await WalletEngine.credit(tx, tdsWallet, c.tdsAmount);
      }
    }

    // GST → ADMIN
    if (gst > 0n) {
      const gstWallet = await WalletEngine.getWallet({
        tx,
        userId: adminUserId,
        walletType: "GST",
      });

      await WalletEngine.credit(tx, gstWallet, gst);
    }
  }

  static async calculate(tx, { userId, serviceProviderMappingId, amount = 0 }) {
    const txnAmount = BigInt(amount);

    const mapping = await tx.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });

    const providerCost = BigInt(mapping.providerCost);

    // USER CHAIN BUILD
    const userChain = [];
    let currentUser = await tx.user.findUnique({ where: { id: userId } });

    while (currentUser) {
      userChain.push(currentUser);

      if (!currentUser.parentId) break;

      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }

    const adminUser = userChain[userChain.length - 1];

    const roleIds = userChain.map((u) => u.roleId);
    const userIds = userChain.map((u) => u.id);

    // SETTINGS FETCH (WITH TXN SLAB)
    const settings = await tx.commissionSetting.findMany({
      where: {
        serviceProviderMappingId,
        isActive: true,
        minAmount: { lte: txnAmount },
        maxAmount: { gte: txnAmount },
        OR: [{ targetUserId: { in: userIds } }, { roleId: { in: roleIds } }],
      },
    });

    let previousRate = 0n;

    let surchargeTotal = 0n;
    let gstTotal = 0n;

    const commissions = [];

    for (const user of userChain) {
      const setting =
        settings.find((s) => s.targetUserId === user.id) ||
        settings.find((s) => s.roleId === user.roleId);

      if (!setting) continue;

      const value = Number(setting.value);

      let rate = 0n;

      if (setting.type === "PERCENTAGE") {
        rate = (txnAmount * BigInt(Math.round(value * 100))) / 10000n;
      } else {
        rate = BigInt(Math.round(value * 100));
      }

      if (rate < previousRate) rate = previousRate;

      const margin = rate - previousRate;

      if (margin <= 0n) continue;

      let commissionAmount = 0n;
      let surchargeAmount = 0n;
      let gstAmount = 0n;
      let tdsAmount = 0n;

      // SURCHARGE MODE
      if (setting.mode === "SURCHARGE") {
        surchargeAmount = margin;
        surchargeTotal += margin;

        if (setting.applyGST) {
          const gstPercent = Number(setting.gstPercent || 0);

          gstAmount = (margin * BigInt(Math.round(gstPercent * 100))) / 10000n;

          gstTotal += gstAmount;
        }
      }

      // COMMISSION MODE
      if (setting.mode === "COMMISSION") {
        commissionAmount = margin;

        if (setting.applyTDS) {
          const tdsPercent = Number(setting.tdsPercent || 0);

          tdsAmount = (margin * BigInt(Math.round(tdsPercent * 100))) / 10000n;
        }

        commissions.push({
          userId: user.id,
          commissionAmount,
          tdsAmount,
          mode: setting.mode,
          type: setting.type,
        });
      }

      previousRate = rate;
    }

    const finalPrice = txnAmount + providerCost + surchargeTotal + gstTotal;

    return {
      providerCost,
      amount: txnAmount,
      surcharge: surchargeTotal,
      gst: gstTotal,
      finalPrice,
      commissions,
      adminUserId: adminUser.id,
    };
  }
}
