import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";

export default class CommissionEngine {
  static async getRule(tx, user, serviceProviderMappingId) {
    return (
      (await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          mode: "COMMISSION",
          isActive: true,
          targetUserId: user.id,
        },
      })) ||
      (await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          mode: "COMMISSION",
          isActive: true,
          roleId: user.roleId,
        },
      }))
    );
  }

  static async calculateRule(tx, rule, amount, category) {
    let value = 0n;
    let type = rule.type; // default type

    //  CATEGORY BASED
    if (rule.supportPaymentMethod) {
      const payment = await tx.commissionPaymentMethod.findFirst({
        where: {
          commissionSettingId: rule.id,
          category,
        },
      });

      if (payment) {
        value = BigInt(payment.value);
        type = payment.type || rule.type; //  IMPORTANT
      } else {
        //  fallback to default rule
        value = BigInt(rule.value);
      }
    }

    //  SLAB BASED
    else if (rule.supportsSlab) {
      const slab = await tx.commissionSlab.findFirst({
        where: {
          commissionSettingId: rule.id,
          minAmount: { lte: amount },
          maxAmount: { gte: amount },
        },
      });

      if (slab) {
        value = BigInt(slab.value);
        type = slab.type || rule.type; //  IMPORTANT
      } else {
        value = BigInt(rule.value);
      }
    }

    //  DEFAULT
    else {
      value = BigInt(rule.value);
    }

    //  FINAL CALCULATION
    if (type === "PERCENTAGE") {
      return (amount * value) / 10000n;
    }

    return value;
  }

  static async distribute(tx, params) {
    const {
      transactionId,
      userId,
      serviceProviderMappingId,
      commission,
      createdBy,
      service,
      category,
    } = params;

    const baseAmount = BigInt(commission.txnAmount);

    let currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true, parentId: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    const distribution = [];

    //  STEP 1: RETAILER DIRECT
    const retailerRule = await this.getRule(
      tx,
      currentUser,
      serviceProviderMappingId
    );

    let previousRate = 0n;

    if (retailerRule) {
      const value = await this.calculateRule(
        tx,
        retailerRule,
        baseAmount,
        category
      );

      previousRate = value;

      const tdsPercent = BigInt(retailerRule?.tdsPercent || 0);
      const tds = (value * tdsPercent) / 100n;
      const net = value - tds;

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: currentUser.id,
        walletType: "COMMISSION",
      });

      await WalletEngine.credit(tx, wallet, net);

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "COMMISSION",
        serviceProviderMappingId,
        amount: net,
        narration: `${service.code} Commission`,
        createdBy,
      });

      distribution.push({
        userId: currentUser.id,
        gross: value,
        tds,
        net,
      });
    }

    //  STEP 2: UPLINE MARGIN
    while (currentUser.parentId) {
      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
        select: { id: true, roleId: true, parentId: true },
      });

      const rule = await this.getRule(
        tx,
        currentUser,
        serviceProviderMappingId
      );

      let ruleValue = 0n;

      if (rule) {
        ruleValue = await this.calculateRule(tx, rule, baseAmount, category);
      }

      const profit = ruleValue > previousRate ? ruleValue - previousRate : 0n;

      if (profit > 0n) {
        const tdsPercent = BigInt(rule?.tdsPercent || 0);
        const tds = (profit * tdsPercent) / 100n;
        const net = profit - tds;

        const wallet = await WalletEngine.getWallet({
          tx,
          userId: currentUser.id,
          walletType: "COMMISSION",
        });

        await WalletEngine.credit(tx, wallet, net);

        await LedgerEngine.create(tx, {
          walletId: wallet.id,
          transactionId,
          entryType: "CREDIT",
          referenceType: "COMMISSION",
          serviceProviderMappingId,
          amount: net,
          narration: `${service.code} Commission`,
          createdBy,
        });

        //  TDS → ADMIN
        if (tds > 0n) {
          const admin = await tx.user.findFirst({
            where: { parentId: null },
            select: { id: true },
          });

          const adminWallet = await WalletEngine.getWallet({
            tx,
            userId: admin.id,
            walletType: "TDS",
          });

          await WalletEngine.credit(tx, adminWallet, tds);
        }

        distribution.push({
          userId: currentUser.id,
          gross: profit,
          tds,
          net,
        });
      }

      previousRate = ruleValue;
    }

    //  STEP 3: ADMIN REMAINING
    const admin = await tx.user.findFirst({
      where: { parentId: null },
      select: { id: true },
    });

    const adminProfit = commission.commission - previousRate;

    if (adminProfit > 0n) {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "COMMISSION",
      });

      await WalletEngine.credit(tx, wallet, adminProfit);

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "COMMISSION",
        serviceProviderMappingId,
        amount: adminProfit,
        narration: "Admin Commission",
        createdBy,
      });
    }

    return { distribution };
  }
}
