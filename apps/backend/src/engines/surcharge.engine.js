import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";
import CommissionEarningService from "../services/commission.service.js";

export default class SurchargeEngine {
  static async distribute(
    tx,
    { transactionId, userId, serviceProviderMappingId, createdBy, pricing }
  ) {
    const mapping = await tx.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });

    if (!mapping) throw ApiError.notFound("Service mapping not found");

    if (mapping.commissionStartLevel === "NONE") {
      throw ApiError.badRequest("Surcharge disabled for this service");
    }

    //  LOAD RULES
    const rules = await tx.commissionSetting.findMany({
      where: {
        serviceProviderMappingId,
        mode: "SURCHARGE",
        isActive: true,
      },
    });

    //  GET USER
    let currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true, parentId: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    const admin = await tx.user.findFirst({
      where: { parentId: null },
      select: { id: true },
    });

    const userWallet = await WalletEngine.getWallet({
      tx,
      userId,
      walletType: "PRIMARY",
    });

    //  MAP RULES
    const userRules = new Map();
    const roleRules = new Map();

    for (const r of rules) {
      if (r.targetUserId) userRules.set(r.targetUserId, r);
      if (r.roleId) roleRules.set(r.roleId, r);
    }

    const resolveRule = (user) =>
      userRules.get(user.id) || roleRules.get(user.roleId);

    //  CALCULATE RULE AMOUNT
    const calculateRuleAmount = async (rule, txnAmount) => {
      let value = BigInt(rule.value);

      if (rule.supportsSlab) {
        const slab = await tx.commissionSlab.findFirst({
          where: {
            commissionSettingId: rule.id,
            minAmount: { lte: txnAmount },
            maxAmount: { gte: txnAmount },
          },
        });

        if (!slab) {
          throw ApiError.badRequest("Surcharge slab not configured");
        }

        value = BigInt(slab.value);
      }

      if (rule.type === "PERCENTAGE") {
        return (txnAmount * value) / 10000n;
      }

      return value;
    };

    const baseAmount = BigInt(pricing.txnAmount);

    //  STEP 1: PROVIDER COST
    const providerCost = BigInt(pricing?.providerCost || 0n);

    if (providerCost > 0n) {
      // USER DEBIT
      await LedgerEngine.create(tx, {
        walletId: userWallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "PROVIDER_COST",
        serviceProviderMappingId,
        amount: providerCost,
        narration: "Provider cost charged",
        createdBy,
      });

      // ADMIN DEBIT (expense)
      const adminWallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "COMMISSION",
      });

      await LedgerEngine.create(tx, {
        walletId: adminWallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "PROVIDER_COST",
        serviceProviderMappingId,
        amount: providerCost,
        narration: "Provider service cost",
        createdBy,
      });
    }

    //  STEP 2: PROVIDER GST (INPUT)
    const providerGST = BigInt(pricing?.gstProvider || 0n);

    if (providerGST > 0n) {
      // USER DEBIT
      await LedgerEngine.create(tx, {
        walletId: userWallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "PROVIDER_GST",
        serviceProviderMappingId,
        amount: providerGST,
        narration: "Provider GST charged",
        createdBy,
      });

      // ADMIN DEBIT (input tax)
      const gstWallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "GST",
      });

      await LedgerEngine.create(tx, {
        walletId: gstWallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "PROVIDER_GST",
        serviceProviderMappingId,
        amount: providerGST,
        narration: "Provider GST (Input)",
        createdBy,
      });
    }

    //  STEP 3: SURCHARGE DISTRIBUTION
    let previousRate = BigInt(pricing.surcharge);
    const distribution = [];

    while (currentUser) {
      const rule = resolveRule(currentUser);

      let ruleValue = 0n;

      if (rule) {
        ruleValue = await calculateRuleAmount(rule, baseAmount);
      }

      const profit = previousRate > ruleValue ? previousRate - ruleValue : 0n;

      if (profit > 0n && currentUser.id !== userId) {
        // USER DEBIT
        await LedgerEngine.create(tx, {
          walletId: userWallet.id,
          transactionId,
          entryType: "DEBIT",
          referenceType: "SURCHARGE",
          serviceProviderMappingId,
          amount: profit,
          narration: "Surcharge charged",
          createdBy,
        });

        // ADMIN / PARENT CREDIT
        const wallet = await WalletEngine.getWallet({
          tx,
          userId: currentUser.id,
          walletType: "COMMISSION",
        });

        await WalletEngine.credit(tx, wallet, profit);

        await LedgerEngine.create(tx, {
          walletId: wallet.id,
          transactionId,
          entryType: "CREDIT",
          referenceType: "SURCHARGE",
          serviceProviderMappingId,
          amount: profit,
          narration: "Surcharge earning",
          createdBy,
        });

        await CommissionEarningService.create(tx, {
          transactionId,
          userId: currentUser.id,
          fromUserId: userId,
          serviceProviderMappingId,
          amount: baseAmount,
          mode: "SURCHARGE",
          type: rule ? rule.type : "FLAT",
          netAmount: profit,
          createdBy,
        });

        distribution.push({
          userId: currentUser.id,
          profit,
        });
      }

      previousRate = ruleValue;

      if (!currentUser.parentId) break;

      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
        select: { id: true, roleId: true, parentId: true },
      });
    }

    //  STEP 4: SURCHARGE GST (OUTPUT)
    const surchargeGST = BigInt(pricing?.gstSurcharge || 0n);

    if (surchargeGST > 0n) {
      // USER DEBIT
      await LedgerEngine.create(tx, {
        walletId: userWallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "SURCHARGE_GST",
        serviceProviderMappingId,
        amount: surchargeGST,
        narration: "GST on surcharge",
        createdBy,
      });

      // ADMIN CREDIT
      const gstWallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "GST",
      });

      await WalletEngine.credit(tx, gstWallet, surchargeGST);

      await LedgerEngine.create(tx, {
        walletId: gstWallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "SURCHARGE_GST",
        serviceProviderMappingId,
        amount: surchargeGST,
        narration: "GST collected",
        createdBy,
      });
    }

    //  FINAL RETURN
    return {
      distribution,
      summary: {
        totalSurcharge: pricing.surcharge,
        totalUsers: distribution.length,
      },
    };
  }
}
