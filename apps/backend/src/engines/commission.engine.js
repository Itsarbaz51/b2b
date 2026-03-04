import Prisma from "../db/db.js";
import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";
import CommissionEarningService from "../services/commission.service.js";

export default class CommissionEngine {
  // DISTRIBUTE COMMISSION
  static async distribute(
    tx,
    { transactionId, userId, serviceProviderMappingId, amount, createdBy }
  ) {
    let currentUser = await tx.user.findUnique({
      where: { id: userId },
    });

    const rootUserId = userId;
    const baseAmount = BigInt(amount);

    let previousRate = 0n;
    let totalDistributed = 0n;

    // FIND ADMIN USER
    let adminUser = currentUser;
    while (adminUser.parentId) {
      adminUser = await tx.user.findUnique({
        where: { id: adminUser.parentId },
      });
    }

    while (currentUser) {
      let setting = await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          targetUserId: currentUser.id,
          isActive: true,
        },
      });

      if (!setting) {
        setting = await tx.commissionSetting.findFirst({
          where: {
            serviceProviderMappingId,
            roleId: currentUser.roleId,
            isActive: true,
          },
        });
      }

      if (!setting) {
        if (!currentUser.parentId) break;

        currentUser = await tx.user.findUnique({
          where: { id: currentUser.parentId },
        });

        continue;
      }

      const value = Number(setting.value);

      let rate = 0n;

      if (setting.type === "PERCENTAGE") {
        rate = (baseAmount * BigInt(Math.round(value * 100))) / 10000n;
      } else {
        rate = BigInt(Math.round(value * 100));
      }

      const margin = rate - previousRate;

      if (margin > 0n) {
        let tdsAmount = 0n;
        let gstAmount = 0n;
        let netAmount = margin;

        let commissionAmount = 0n;
        let surchargeAmount = 0n;

        if (setting.mode === "COMMISSION") {
          commissionAmount = margin;

          if (setting.applyTDS) {
            const tdsPercent = Number(setting.tdsPercent || 0);

            tdsAmount =
              (margin * BigInt(Math.round(tdsPercent * 100))) / 10000n;

            netAmount -= tdsAmount;
          }
        }

        if (setting.mode === "SURCHARGE") {
          surchargeAmount = margin;

          if (setting.applyGST) {
            const gstPercent = Number(setting.gstPercent || 0);

            gstAmount =
              (margin * BigInt(Math.round(gstPercent * 100))) / 10000n;
          }
        }

        totalDistributed += margin;

        if (totalDistributed > baseAmount) {
          throw ApiError.internal("Commission exceeds margin pool");
        }

        // ❗ ROOT USER KO COMMISSION NA DO
        if (currentUser.id !== rootUserId) {
          const wallet = await WalletEngine.getWallet({
            tx,
            userId: currentUser.id,
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
        }

        // ✅ GST → ADMIN WALLET
        if (gstAmount > 0n) {
          const gstWallet = await WalletEngine.getWallet({
            tx,
            userId: adminUser.id,
            walletType: "GST",
          });

          await WalletEngine.credit(tx, gstWallet, gstAmount);
        }

        // ✅ TDS → ADMIN WALLET
        if (tdsAmount > 0n) {
          const tdsWallet = await WalletEngine.getWallet({
            tx,
            userId: adminUser.id,
            walletType: "TDS",
          });

          await WalletEngine.credit(tx, tdsWallet, tdsAmount);
        }

        await CommissionEarningService.create(tx, {
          transactionId,
          userId: currentUser.id,
          fromUserId: rootUserId,
          serviceProviderMappingId,
          amount: baseAmount,
          mode: setting.mode,
          type: setting.type,
          commissionAmount,
          surchargeAmount,
          tdsAmount,
          gstAmount,
          netAmount,
          createdBy,
        });
      }

      previousRate = rate;

      if (!currentUser.parentId) break;

      currentUser = await tx.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }
  }

  // COMMISSION PREVIEW
  static async calculate({ userId, serviceProviderMappingId, amount = 0n }) {
    const baseAmount = BigInt(amount);

    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
    });

    const breakdown = [];
    let totalNetDistributed = 0n;

    while (currentUser) {
      let setting = await Prisma.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          targetUserId: currentUser.id,
          isActive: true,
        },
      });

      if (!setting) {
        setting = await Prisma.commissionSetting.findFirst({
          where: {
            serviceProviderMappingId,
            roleId: currentUser.roleId,
            isActive: true,
          },
        });
      }

      if (!setting) {
        if (!currentUser.parentId) break;

        currentUser = await Prisma.user.findUnique({
          where: { id: currentUser.parentId },
        });

        continue;
      }

      const value = Number(setting.value);

      let gross = 0n;

      if (setting.type === "PERCENTAGE") {
        gross = (baseAmount * BigInt(Math.round(value * 100))) / 10000n;
      } else {
        gross = BigInt(Math.round(value * 100));
      }

      let tdsAmount = 0n;
      let gstAmount = 0n;
      let netAmount = gross;

      if (setting.mode === "COMMISSION" && setting.applyTDS) {
        const tdsPercent = Number(setting.tdsPercent || 0);

        tdsAmount = (gross * BigInt(Math.round(tdsPercent * 100))) / 10000n;

        netAmount = gross - tdsAmount;
      }

      if (setting.mode === "SURCHARGE" && setting.applyGST) {
        const gstPercent = Number(setting.gstPercent || 0);

        gstAmount = (gross * BigInt(Math.round(gstPercent * 100))) / 10000n;

        netAmount = gross + gstAmount;
      }

      breakdown.push({
        userId: currentUser.id,
        roleId: currentUser.roleId,
        mode: setting.mode,
        type: setting.type,
        gross,
        tdsAmount,
        gstAmount,
        netAmount,
      });

      totalNetDistributed += netAmount;

      if (!currentUser.parentId) break;

      currentUser = await Prisma.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }

    if (totalNetDistributed > baseAmount) {
      throw ApiError.internal("Commission exceeds margin pool");
    }

    return {
      baseAmount,
      totalNetDistributed,
      breakdown,
    };
  }

  // SURCHARGE PRICE CALCULATION
  static async calculatePrice({ userId, serviceProviderMappingId }) {
    const mapping = await Prisma.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });

    const providerCost = BigInt(mapping.providerCost);

    let totalSurcharge = 0n;
    let totalGST = 0n;

    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
    });

    while (currentUser) {
      let setting = await Prisma.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          targetUserId: currentUser.id,
          isActive: true,
        },
      });

      if (!setting) {
        setting = await Prisma.commissionSetting.findFirst({
          where: {
            serviceProviderMappingId,
            roleId: currentUser.roleId,
            isActive: true,
          },
        });
      }

      if (setting && setting.mode === "SURCHARGE") {
        const value = Number(setting.value);

        let surcharge = 0n;

        if (setting.type === "PERCENTAGE") {
          surcharge = (providerCost * BigInt(Math.round(value * 100))) / 10000n;
        } else {
          surcharge = BigInt(Math.round(value * 100));
        }

        totalSurcharge += surcharge;

        // GST calculation
        if (setting.applyGST) {
          const gstPercent = Number(setting.gstPercent || 0);

          const gst =
            (surcharge * BigInt(Math.round(gstPercent * 100))) / 10000n;

          totalGST += gst;
        }
      }

      if (!currentUser.parentId) break;

      currentUser = await Prisma.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }

    const finalPrice = providerCost + totalSurcharge + totalGST;

    return {
      providerCost,
      surcharge: totalSurcharge,
      gst: totalGST,
      finalPrice,
      margin: totalSurcharge,
    };
  }
}
