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

    let providerCost = 0n;
    const type = mapping.pricingValueType;

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

      const value = BigInt(slab.providerCost);

      if (type === "PERCENTAGE") {
        providerCost = (txnAmount * value) / 10000n;
      } else {
        providerCost = value;
      }
    } else {
      const value = BigInt(mapping.providerCost || 0);

      if (type === "PERCENTAGE") {
        providerCost = (txnAmount * value) / 10000n;
      } else {
        providerCost = value;
      }
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
        surcharge = (txnAmount * value) / 10000n;
      } else {
        surcharge = value;
      }
    }

    //  GST (Only on surcharge)
    let gstSurcharge = 0n;

    if (rule?.applyGST && rule.gstPercent) {
      const percent = BigInt(rule.gstPercent);
      gstSurcharge = (surcharge * percent) / 100n;
    }

    //  GST (Only on provider mapping )
    let gstProvider = 0n;

    if (mapping?.applyGST && mapping.gstPercent) {
      const percent = BigInt(mapping.gstPercent);
      gstProvider = (providerCost * percent) / 100n;
    }

    //  FINAL AMOUNT
    const totalDebit =
      providerCost + surcharge + gstProvider + gstSurcharge + txnAmount;

    return {
      txnAmount,
      providerCost,
      surcharge,
      gstProvider,
      gstSurcharge,
      totalDebit,
    };
  }

  static async calculateCommission(
    tx,
    { userId, serviceProviderMappingId, amount = 0, category }
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

    const rule =
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
      }));

    let type = rule.type;
    let value = BigInt(rule.value);

    if (rule.supportPaymentMethod) {
      const payment = await tx.commissionPaymentMethod.findFirst({
        where: {
          commissionSettingId: rule.id,
          category,
        },
      });

      if (payment) {
        value = BigInt(payment.value);
        type = payment.type || rule.type;
      }
    } else if (rule.supportsSlab) {
      const slab = await tx.commissionSlab.findFirst({
        where: {
          commissionSettingId: rule.id,
          minAmount: { lte: txnAmount },
          maxAmount: { gte: txnAmount },
        },
      });

      if (slab) {
        value = BigInt(slab.value);
        type = slab.type || rule.type;
      }
    }

    //  FINAL
    let commission =
      type === "PERCENTAGE" ? (txnAmount * value) / 10000n : value;

    let providerTDS = 0n;
    if (mapping?.applyTDS && mapping.tdsPercent) {
      const percent = BigInt(mapping.tdsPercent);
      providerTDS = (commission * percent) / 100n;
    }

    return {
      txnAmount,
      commission,
      providerTDS,
      ruleId: rule?.id || null,
    };
  }
}
