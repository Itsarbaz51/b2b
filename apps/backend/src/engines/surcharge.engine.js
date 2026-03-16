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

    // LOAD RULES

    const rules = await tx.commissionSetting.findMany({
      where: {
        serviceProviderMappingId,
        mode: "SURCHARGE",
        isActive: true,
      },
    });

    const admin = await tx.user.findFirst({
      where: { parentId: null },
      select: { id: true },
    });

    if (!admin) throw ApiError.notFound("Admin user not found");

    let currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true, parentId: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    const userRules = new Map();
    const roleRules = new Map();

    for (const r of rules) {
      if (r.targetUserId) userRules.set(r.targetUserId, r);
      if (r.roleId) roleRules.set(r.roleId, r);
    }

    const resolveRule = (user) =>
      userRules.get(user.id) || roleRules.get(user.roleId);

    // ADMIN ONLY MODE

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

    // HIERARCHY MODE

    if (mapping.commissionStartLevel === "HIERARCHY") {
      const txnRule = resolveRule(currentUser);
      if (!txnRule) throw ApiError.badRequest("Txn surcharge not configured");

      const txnAmount = BigInt(txnRule.value);
      let previousRate = txnAmount;

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
      }
    }

    // PROVIDER COST
    const providerCost = BigInt(pricing?.providerCost || 0n);

    if (providerCost > 0n) {
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

    // USER GST (OUTPUT)

    const userGST = BigInt(pricing?.gst || 0n);

    if (userGST > 0n) {
      const gstWallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "GST",
      });

      await WalletEngine.credit(tx, gstWallet, userGST);

      await LedgerEngine.create(tx, {
        walletId: gstWallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "USER_GST",
        serviceProviderMappingId,
        amount: userGST,
        narration: "GST collected from user",
        createdBy,
      });
    }

    // PROVIDER GST (INPUT TAX)
    if (providerCost > 0n && mapping.applyGST && mapping.gstPercent) {
      const providerGST = (providerCost * BigInt(mapping.gstPercent)) / 100n;

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
        narration: "Provider GST (Input Tax)",
        createdBy,
      });
    }
  }
}
