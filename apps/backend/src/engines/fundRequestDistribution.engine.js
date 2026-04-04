import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";
import CommissionEarningService from "../services/commission.service.js";

export default class FundRequestDistributionEngine {
  static async distribute(
    tx,
    { transactionId, userId, serviceProviderMappingId, createdBy, pricing }
  ) {
    const { surcharge, txnAmount, gstProvider, gstSurcharge, providerCost } =
      pricing;

    const mapping = await tx.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });

    if (!mapping) throw ApiError.notFound("Service mapping not found");

    if (mapping.commissionStartLevel === "NONE") {
      throw ApiError.badRequest("Surcharge disabled for this service");
    }

    // ================= USER =================
    let currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, parentId: true, roleId: true },
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

    const totalSurcharge = BigInt(surcharge);

    // ================= STEP 1: PROVIDER COST =================
    if (providerCost > 0n) {
      await LedgerEngine.create(tx, {
        walletId: userWallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "PROVIDER_COST",
        serviceProviderMappingId,
        amount: BigInt(providerCost),
        narration: "Provider cost charged",
        createdBy,
      });

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
        amount: BigInt(providerCost),
        narration: "Provider service cost",
        createdBy,
      });
    }

    // ================= STEP 2: PROVIDER GST =================
    if (gstProvider > 0n) {
      await LedgerEngine.create(tx, {
        walletId: userWallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "PROVIDER_GST",
        serviceProviderMappingId,
        amount: BigInt(gstProvider),
        narration: "Provider GST charged",
        createdBy,
      });

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
        amount: BigInt(gstProvider),
        narration: "Provider GST (Input)",
        createdBy,
      });
    }

    // ================= STEP 3: SURCHARGE =================

    // USER DEBIT FULL
    await LedgerEngine.create(tx, {
      walletId: userWallet.id,
      transactionId,
      entryType: "DEBIT",
      referenceType: "SURCHARGE",
      serviceProviderMappingId,
      amount: totalSurcharge,
      narration: "Surcharge charged",
      createdBy,
    });

    // ================= USER COMMISSION =================
    const userCommission =
      (await tx.commissionPaymentMethod.findFirst({
        where: {
          commissionSetting: {
            serviceProviderMappingId,
            isActive: true,
            targetUserId: userId,
          },
        },
      })) ||
      (await tx.commissionPaymentMethod.findFirst({
        where: {
          commissionSetting: {
            serviceProviderMappingId,
            isActive: true,
            roleId: currentUser.roleId,
          },
        },
      }));

    if (!userCommission) {
      throw ApiError.badRequest("User commission not configured");
    }

    let previousRate = BigInt(userCommission.value);

    const earningsMap = new Map();

    // ================= LOOP =================
    while (currentUser?.parentId) {
      const parent = await tx.user.findUnique({
        where: { id: currentUser.parentId },
        select: { id: true, parentId: true, roleId: true },
      });

      if (!parent) break;

      const parentCommission =
        (await tx.commissionPaymentMethod.findFirst({
          where: {
            commissionSetting: {
              serviceProviderMappingId,
              isActive: true,
              targetUserId: parent.id,
            },
          },
        })) ||
        (await tx.commissionPaymentMethod.findFirst({
          where: {
            commissionSetting: {
              serviceProviderMappingId,
              isActive: true,
              roleId: parent.roleId,
            },
          },
        }));

      const parentRate = parentCommission ? BigInt(parentCommission.value) : 0n;

      let diffRate = previousRate - parentRate;
      if (diffRate < 0n) diffRate = 0n;

      let profit = (totalSurcharge * diffRate) / 10000n;

      if (profit > 0n) {
        earningsMap.set(parent.id, (earningsMap.get(parent.id) || 0n) + profit);
      }

      previousRate = parentRate;
      currentUser = parent;
    }

    // ================= ADMIN =================
    const distributed = [...earningsMap.values()].reduce((a, b) => a + b, 0n);

    const adminProfit = totalSurcharge - distributed;

    if (adminProfit > 0n) {
      earningsMap.set(
        admin.id,
        (earningsMap.get(admin.id) || 0n) + adminProfit
      );
    }

    // ================= FINAL LEDGER (SINGLE ENTRY PER USER) =================
    const distribution = [];

    for (const [uid, amount] of earningsMap.entries()) {
      if (amount <= 0n) continue;

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: uid,
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
        narration: "Surcharge earning (combined)",
        createdBy,
      });

      await CommissionEarningService.create(tx, {
        transactionId,
        userId: uid,
        fromUserId: userId,
        serviceProviderMappingId,
        amount: BigInt(txnAmount),
        mode: "SURCHARGE",
        type: "PERCENTAGE",
        netAmount: amount,
        createdBy,
      });

      distribution.push({
        userId: uid,
        profit: amount,
      });
    }

    // ================= GST =================
    if (gstSurcharge > 0n) {
      await LedgerEngine.create(tx, {
        walletId: userWallet.id,
        transactionId,
        entryType: "DEBIT",
        referenceType: "SURCHARGE_GST",
        serviceProviderMappingId,
        amount: BigInt(gstSurcharge),
        narration: "GST on surcharge",
        createdBy,
      });

      const gstWallet = await WalletEngine.getWallet({
        tx,
        userId: admin.id,
        walletType: "GST",
      });

      await WalletEngine.credit(tx, gstWallet, BigInt(gstSurcharge));

      await LedgerEngine.create(tx, {
        walletId: gstWallet.id,
        transactionId,
        entryType: "CREDIT",
        referenceType: "SURCHARGE_GST",
        serviceProviderMappingId,
        amount: BigInt(gstSurcharge),
        narration: "GST collected",
        createdBy,
      });
    }

    return {
      distribution,
      summary: {
        totalSurcharge: surcharge,
        totalUsers: distribution.length,
      },
    };
  }
}
