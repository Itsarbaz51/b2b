import Prisma from "../db/db.js";
import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import { ApiError } from "../utils/ApiError.js";

export default class CommissionEngine {
  // static async distribute(
  //   tx,
  //   { transactionId, userId, serviceProviderMappingId, amount, createdBy }
  // ) {
  //   let currentUser = await tx.user.findUnique({
  //     where: { id: userId },
  //   });

  //   let previousRate = 0n;
  //   let totalDistributed = 0n;
  //   const baseAmount = BigInt(amount);

  //   while (currentUser) {
  //     // Find Commission Setting (User → Role fallback)
  //     let setting = await tx.commissionSetting.findFirst({
  //       where: {
  //         serviceProviderMappingId: serviceProviderMappingId,
  //         targetUserId: currentUser.id,
  //         isActive: true,
  //       },
  //     });

  //     if (!setting) {
  //       setting = await tx.commissionSetting.findFirst({
  //         where: {
  //           serviceProviderMappingId: serviceProviderMappingId,
  //           roleId: currentUser.roleId,
  //           isActive: true,
  //         },
  //       });
  //     }

  //     if (!setting) {
  //       if (!currentUser.parentId) break;

  //       currentUser = await tx.user.findUnique({
  //         where: { id: currentUser.parentId },
  //       });
  //       continue;
  //     }

  //     const value = Number(setting.value);
  //     let rate = 0n;

  //     if (setting.type === "PERCENTAGE") {
  //       rate = (baseAmount * BigInt(Math.round(value * 100))) / 10000n;
  //     } else {
  //       rate = BigInt(Math.round(value * 100));
  //     }

  //     const margin = rate - previousRate;

  //     if (margin > 0n) {
  //       let tdsAmount = 0n;
  //       let gstAmount = 0n;
  //       let netAmount = margin;

  //       if (setting.mode === "COMMISSION" && setting.applyTDS) {
  //         const tdsPercent = Number(setting.tdsPercent);
  //         tdsAmount = (margin * BigInt(Math.round(tdsPercent * 100))) / 10000n;
  //         netAmount -= tdsAmount;
  //       }

  //       if (setting.mode === "SURCHARGE" && setting.applyGST) {
  //         const gstPercent = Number(setting.gstPercent);
  //         gstAmount = (margin * BigInt(Math.round(gstPercent * 100))) / 10000n;
  //         netAmount += gstAmount;
  //       }

  //       // Safety: prevent overflow
  //       totalDistributed += margin;
  //       if (totalDistributed > baseAmount) {
  //         throw new Error("Commission exceeds margin pool");
  //       }

  //       // Get COMMISSION wallet
  //       const wallet = await WalletEngine.getWallet({
  //         tx,
  //         userId,
  //         walletType: "PRIMARY",
  //       });

  //       if (!wallet) {
  //         throw new Error(`wallet missing for user ${currentUser.id}`);
  //       }

  //       // Credit wallet
  //       await WalletEngine.credit(tx, wallet, netAmount);

  //       // Ledger Entry
  //       await LedgerEngine.create(tx, {
  //         walletId: wallet.id,
  //         transactionId,
  //         entryType: "CREDIT",
  //         referenceType: "COMMISSION",
  //         serviceProviderMappingId,
  //         amount: netAmount,
  //         narration: "Commission Earned",
  //         createdBy,
  //       });

  //       // Save CommissionEarning
  //       await CommissionEarningService.create(tx, {
  //         transactionId,
  //         userId: currentUser.id,
  //         fromUserId: rootUserId,
  //         serviceProviderMappingId,
  //         amount: baseAmount,
  //         mode: setting.mode,
  //         type: setting.type,
  //         commissionAmount,
  //         surchargeAmount,
  //         tdsAmount,
  //         gstAmount,
  //         netAmount,
  //         createdBy,
  //       });
  //     }

  //     previousRate = rate;

  //     if (!currentUser.parentId) break;

  //     currentUser = await tx.user.findUnique({
  //       where: { id: currentUser.parentId },
  //     });
  //   }
  // }

  static async distribute(
    tx,
    { transactionId, userId, serviceProviderMappingId, amount, createdBy }
  ) {
    let currentUser = await tx.user.findUnique({
      where: { id: userId },
    });

    const rootUserId = userId; // original transaction user
    const baseAmount = BigInt(amount);

    let previousRate = 0n;
    let totalDistributed = 0n;

    while (currentUser) {
      // 🔎 Find Commission Setting (User → Role fallback)
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

      // 📌 Calculate Rate
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
        }

        if (setting.mode === "SURCHARGE") {
          surchargeAmount = margin;
        }

        // 🧾 Apply TDS
        if (setting.mode === "COMMISSION" && setting.applyTDS) {
          const tdsPercent = Number(setting.tdsPercent);
          tdsAmount = (margin * BigInt(Math.round(tdsPercent * 100))) / 10000n;
          netAmount -= tdsAmount;
        }

        // 🧾 Apply GST
        if (setting.mode === "SURCHARGE" && setting.applyGST) {
          const gstPercent = Number(setting.gstPercent);
          gstAmount = (margin * BigInt(Math.round(gstPercent * 100))) / 10000n;
          netAmount += gstAmount;
        }

        // 🚨 Safety Check
        totalDistributed += margin;
        if (totalDistributed > baseAmount) {
          throw new Error("Commission exceeds margin pool");
        }

        // 💰 Get CURRENT USER Wallet
        const wallet = await WalletEngine.getWallet({
          tx,
          userId: currentUser.id,
          walletType: "PRIMARY",
        });

        if (!wallet) {
          throw new Error(`Wallet missing for user ${currentUser.id}`);
        }

        // Credit wallet
        await WalletEngine.credit(tx, wallet, netAmount);

        // 📒 Ledger Entry
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

        // 💾 Save CommissionEarning
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

  static async calculate({ userId, serviceProviderMappingId, amount = 0n }) {
    const baseAmount = BigInt(amount); // margin pool

    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
    });

    const breakdown = [];
    let totalNetDistributed = 0n;

    while (currentUser) {
      // 1️⃣ USER override
      let setting = await Prisma.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          targetUserId: currentUser.id,
          isActive: true,
        },
      });

      // 2️⃣ ROLE fallback
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

      // 3️⃣ % or FLAT support
      if (setting.type === "PERCENTAGE") {
        gross = (baseAmount * BigInt(Math.round(value * 100))) / 10000n;
      } else {
        // FLAT (₹ to paise)
        gross = BigInt(Math.round(value * 100));
      }

      let tdsAmount = 0n;
      let gstAmount = 0n;
      let netAmount = gross;

      // 4️⃣ COMMISSION → TDS cut
      if (setting.mode === "COMMISSION" && setting.applyTDS) {
        const tdsPercent = Number(setting.tdsPercent || 0);
        tdsAmount = (gross * BigInt(Math.round(tdsPercent * 100))) / 10000n;

        netAmount = gross - tdsAmount;
      }

      // 5️⃣ SURCHARGE → GST add
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

    if (totalNetDistributed > baseAmount)
      throw ApiError.notFound("Commission exceeds margin pool");

    return {
      baseAmount,
      totalNetDistributed,
      breakdown,
    };
  }
}
