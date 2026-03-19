import { ApiError } from "../utils/ApiError.js";

export default class PricingEngine {
  static async calculateSurcharge(
    tx,
    { userId, serviceProviderMappingId, amount = 0 }
  ) {
    const txnAmount = BigInt(amount);

    const mapping = await tx.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });

    if (!mapping) throw ApiError.notFound("Service mapping not found");

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true },
    });

    if (!user) throw ApiError.notFound("User not found");

    //  PROVIDER COST
    let providerCost = 0n;

    if (mapping.supportsSlab) {
      const slab = await tx.providerSlab.findFirst({
        where: {
          serviceProviderMappingId,
          minAmount: { lte: txnAmount },
          maxAmount: { gte: txnAmount },
        },
      });

      if (!slab) {
        throw ApiError.badRequest("Provider slab not configured");
      }

      providerCost = BigInt(slab.providerCost);
    } else {
      providerCost = BigInt(mapping.providerCost);
    }

    //  SURCHARGE RULE
    let rule =
      (await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          mode: "SURCHARGE",
          isActive: true,
          targetUserId: user.id,
        },
      })) ||
      (await tx.commissionSetting.findFirst({
        where: {
          serviceProviderMappingId,
          mode: "SURCHARGE",
          isActive: true,
          roleId: user.roleId,
        },
      }));

    let surcharge = 0n;

    if (rule) {
      let value = BigInt(rule.value);

      //   SLAB CHECK
      if (rule.supportsSlab) {
        const slab = await tx.userPricingSlab.findFirst({
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

      surcharge =
        rule.type === "PERCENTAGE" ? (txnAmount * value) / 10000n : value;
    }

    //  GST (Only on surcharge)
    let gst = 0n;

    if (rule?.applyGST && rule.gstPercent) {
      const percent = BigInt(rule.gstPercent);
      gst = (surcharge * percent) / 10000n;
    }

    //  FINAL AMOUNT
    const totalDebit = providerCost + surcharge + gst + txnAmount;

    return {
      txnAmount,
      providerCost,
      surcharge,
      gst,
      totalDebit,
    };
  }
}
