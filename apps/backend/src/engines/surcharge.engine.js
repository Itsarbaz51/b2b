import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";
import CommissionEarningService from "../services/commission.service.js";

export default class SurchargeEngine {
  static async calculate(
    tx,
    { userId, serviceProviderMappingId, amount = 0n }
  ) {
    let currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    let rule = await tx.commissionSetting.findFirst({
      where: {
        serviceProviderMappingId,
        mode: "SURCHARGE",
        isActive: true,
        targetUserId: currentUser.id,
      },
    });

    rule = await tx.commissionSetting.findFirst({
      where: {
        serviceProviderMappingId,
        mode: "SURCHARGE",
        isActive: true,
        roleId: currentUser.roleId,
      },
    });

    if (!rule) return 0n;

    const value = BigInt(rule.value);
    const txnAmount = BigInt(amount);

    if (rule.type === "PERCENTAGE") {
      return (txnAmount * value) / 10000n;
    }

    return value;
  }

  static async distribute(
    tx,
    { transactionId, userId, serviceProviderMappingId, createdBy }
  ) {
    const mapping = await tx.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });

    if (!mapping) throw ApiError.notFound("Service mapping not found");

    if (mapping.commissionStartLevel === "NONE") {
      throw ApiError.badRequest("Surcharge disabled for this service (NONE)");
    }

    // preload rules (ONLY ONE QUERY)
    const rules = await tx.commissionSetting.findMany({
      where: {
        serviceProviderMappingId,
        mode: "SURCHARGE",
        isActive: true,
      },
    });

    // preload admin
    const admin = await tx.user.findFirst({
      where: { parentId: null },
      select: { id: true },
    });

    if (!admin) throw ApiError.notFound("Admin user not found");

    // load txn user
    let currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true, parentId: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    // helper rule resolver
    const userRules = new Map();
    const roleRules = new Map();

    for (const r of rules) {
      if (r.targetUserId) userRules.set(r.targetUserId, r);
      if (r.roleId) roleRules.set(r.roleId, r);
    }

    const resolveRule = (user) => {
      return userRules.get(user.id) || roleRules.get(user.roleId);
    };

    // ADMIN_ONLY
    if (mapping.commissionStartLevel === "ADMIN_ONLY") {
      const txnRule = resolveRule(currentUser);

      if (!txnRule) throw ApiError.badRequest("Surcharge rule not configured");

      const amount = BigInt(txnRule.value);

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "COMMISSION",
      });

      await WalletEngine.credit(tx, wallet, amount);

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "SURCHARGE",
        serviceProviderMappingId,
        amount,
        narration: "Admin surcharge",
        createdBy,
      });

      await CommissionEarningService.create(tx, {
        transactionId,
        userId: admin.id,
        fromUserId: userId,
        serviceProviderMappingId,
        amount,
        mode: "SURCHARGE",
        type: txnRule.type,
        commissionAmount: 0n,
        surchargeAmount: amount,
        netAmount: amount,
        createdBy,
      });

      return;
    }

    if (mapping.commissionStartLevel === "HIERARCHY") {
      // hierarchy start
      const txnRule = resolveRule(currentUser);

      if (!txnRule) throw ApiError.badRequest("Txn surcharge not configured");

      const txnAmount = BigInt(txnRule.value);
      let previousRate = txnAmount;

      // move to parent
      if (currentUser.parentId) {
        currentUser = await tx.user.findUnique({
          where: { id: currentUser.parentId },
          select: { id: true, roleId: true, parentId: true },
        });
      } else {
        currentUser = null;
      }

      while (currentUser) {
        const rule = resolveRule(currentUser);

        if (rule) {
          const ruleValue = BigInt(rule.value);

          const commission =
            previousRate > ruleValue ? previousRate - ruleValue : 0n;

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

            await CommissionEarningService.create(tx, {
              transactionId,
              userId: currentUser.id,
              fromUserId: userId,
              serviceProviderMappingId,
              amount: txnAmount,
              mode: "SURCHARGE",
              type: rule.type,
              commissionAmount: 0n,
              surchargeAmount: commission,
              netAmount: commission,
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

      // remaining → admin
      if (previousRate > 0n) {
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

        await CommissionEarningService.create(tx, {
          transactionId,
          userId: admin.id,
          fromUserId: userId,
          serviceProviderMappingId,
          amount: previousRate,
          mode: "SURCHARGE",
          type: "FLAT",
          commissionAmount: 0n,
          surchargeAmount: previousRate,
          netAmount: previousRate,
          createdBy,
        });
      }
    }

    // provider cost
    if (mapping.providerCost) {
      const providerCost = BigInt(mapping.providerCost);

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "COMMISSION",
      });

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "PROVIDER_COST",
        serviceProviderMappingId,
        amount: providerCost,
        narration: "Provider service cost",
        createdBy,
      });
    }
  }
}
