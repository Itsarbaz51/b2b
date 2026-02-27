import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export default class CommissionEarningService {
  static async processEarning({
    transactionId,
    userId,
    fromUserId,
    serviceId,
    amount, // BigInt (paise)
    createdBy,
  }) {
    if (!transactionId || !userId || !amount) {
      throw ApiError.badRequest("transactionId, userId and amount required");
    }

    // 🔎 1. Find active commission setting
    const setting = await Prisma.commissionSetting.findFirst({
      where: {
        serviceId,
        isActive: true,
        OR: [{ scope: "USER", targetUserId: userId }, { scope: "ROLE" }],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!setting) {
      throw ApiError.notFound("Commission setting not found");
    }

    const amountBig = BigInt(amount);

    let commissionAmount = 0n;
    let surchargeAmount = 0n;
    let tdsAmount = 0n;
    let gstAmount = 0n;
    let netAmount = 0n;

    const value = Number(setting.value); // Decimal to number
    const percentMultiplier = BigInt(Math.round(value * 100));

    // 🧮 2. Calculate Base Commission / Surcharge
    if (setting.type === "PERCENTAGE") {
      const calculated = (amountBig * percentMultiplier) / 10000n;
      if (setting.mode === "COMMISSION") {
        commissionAmount = calculated;
      } else {
        surchargeAmount = calculated;
      }
    } else {
      if (setting.mode === "COMMISSION") {
        commissionAmount = BigInt(Math.round(value * 100));
      } else {
        surchargeAmount = BigInt(Math.round(value * 100));
      }
    }

    // 🧾 3. Apply TDS (only for commission)
    if (setting.mode === "COMMISSION" && setting.applyTDS) {
      const tdsPercent = Number(setting.tdsPercent);
      tdsAmount =
        (commissionAmount * BigInt(Math.round(tdsPercent * 100))) / 10000n;
    }

    // 🧾 4. Apply GST (only for surcharge)
    if (setting.mode === "SURCHARGE" && setting.applyGST) {
      const gstPercent = Number(setting.gstPercent);
      gstAmount =
        (surchargeAmount * BigInt(Math.round(gstPercent * 100))) / 10000n;
    }

    // 💰 5. Net Calculation
    if (setting.mode === "COMMISSION") {
      netAmount = commissionAmount - tdsAmount;
    } else {
      netAmount = surchargeAmount + gstAmount;
    }

    // 📝 6. Create Earning Record
    const earning = await Prisma.commissionEarning.create({
      data: {
        transactionId,
        userId,
        fromUserId,
        serviceId,

        amount: amountBig,
        mode: setting.mode,
        type: setting.type,

        commissionAmount,
        surchargeAmount,
        tdsAmount,
        gstAmount,
        netAmount,

        metadata: {
          settingId: setting.id,
          calculatedAt: new Date(),
        },

        createdBy,
      },
    });

    return earning;
  }
}
