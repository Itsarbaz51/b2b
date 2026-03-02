import Prisma from "../db/db.js";
import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";

export default class CommissionEngine {
  static async distribute(
    tx,
    {
      transactionId,
      userId,
      serviceId,
      amount, // BigInt (paise)
      createdBy,
    }
  ) {
    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
    });

    let previousRate = 0n;

    while (currentUser) {
      // Find Commission Setting (User override → Role fallback)
      let setting = await Prisma.commissionSetting.findFirst({
        where: {
          serviceId,
          targetUserId: currentUser.id,
          isActive: true,
        },
      });

      if (!setting) {
        setting = await Prisma.commissionSetting.findFirst({
          where: {
            serviceId,
            roleId: currentUser.roleId,
            isActive: true,
          },
        });
      }

      if (!setting) {
        currentUser = await Prisma.user.findUnique({
          where: { id: currentUser.parentId },
        });
        continue;
      }

      const baseAmount = BigInt(amount);
      const value = Number(setting.value);

      let rate = 0n;

      // Calculate Rate
      if (setting.type === "PERCENTAGE") {
        rate = (baseAmount * BigInt(Math.round(value * 100))) / 10000n;
      } else {
        rate = BigInt(Math.round(value * 100));
      }

      // Difference Based Margin
      const margin = rate - previousRate;

      if (margin > 0n) {
        let tdsAmount = 0n;
        let gstAmount = 0n;
        let netAmount = margin;

        // Apply TDS (Commission Only)
        if (setting.mode === "COMMISSION" && setting.applyTDS) {
          const tdsPercent = Number(setting.tdsPercent);
          tdsAmount = (margin * BigInt(Math.round(tdsPercent * 100))) / 10000n;

          netAmount = margin - tdsAmount;
        }

        // Apply GST (Surcharge Only)
        if (setting.mode === "SURCHARGE" && setting.applyGST) {
          const gstPercent = Number(setting.gstPercent);
          gstAmount = (margin * BigInt(Math.round(gstPercent * 100))) / 10000n;

          netAmount = margin + gstAmount;
        }

        // Credit Wallet
        const wallet = await tx.wallet.findFirst({
          where: { userId: currentUser.id },
        });

        await WalletEngine.credit(tx, wallet, netAmount);

        const updatedWallet = await tx.wallet.findUnique({
          where: { id: wallet.id },
        });

        // Ledger Entry
        await LedgerEngine.create(tx, {
          walletId: wallet.id,
          transactionId,
          entryType: "CREDIT",
          amount: netAmount,
          runningBalance: updatedWallet.balance,
          narration: "Commission Earned",
          createdBy,
        });

        // Save CommissionEarning Record
        await tx.commissionEarning.create({
          data: {
            transactionId,
            userId: currentUser.id,
            fromUserId: userId,
            serviceId,
            amount: baseAmount,
            mode: setting.mode,
            type: setting.type,
            commissionAmount: setting.mode === "COMMISSION" ? margin : 0n,
            surchargeAmount: setting.mode === "SURCHARGE" ? margin : 0n,
            tdsAmount,
            gstAmount,
            netAmount,
            createdBy,
          },
        });
      }

      previousRate = rate;

      // Move to Parent
      if (!currentUser.parentId) break;

      currentUser = await Prisma.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }
  }

  static async calculate({ userId, serviceId, amount = 0n }) {
    const baseAmount = BigInt(amount);

    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
    });

    const breakdown = [];

    while (currentUser) {
      // USER override
      let setting = await Prisma.commissionSetting.findFirst({
        where: {
          serviceId,
          targetUserId: currentUser.id,
          isActive: true,
        },
      });

      // ROLE fallback
      if (!setting) {
        setting = await Prisma.commissionSetting.findFirst({
          where: {
            serviceId,
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
        // FLAT (already in rupees convert to paise)
        gross = BigInt(Math.round(value * 100));
      }

      let tdsAmount = 0n;
      let gstAmount = 0n;
      let netAmount = gross;

      if (setting.mode === "COMMISSION" && setting.applyTDS) {
        const tdsPercent = Number(setting.tdsPercent);
        tdsAmount = (gross * BigInt(Math.round(tdsPercent * 100))) / 10000n;
        netAmount = gross - tdsAmount;
      }

      if (setting.mode === "SURCHARGE" && setting.applyGST) {
        const gstPercent = Number(setting.gstPercent);
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

      if (!currentUser.parentId) break;

      currentUser = await Prisma.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }

    return {
      baseAmount,
      breakdown,
    };
  }
}
