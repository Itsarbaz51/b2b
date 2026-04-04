import { ApiError } from "../utils/ApiError.js";

export default class FundRequestPricingEngine {
  static calc(amount, value, type) {
    if (!value) return 0n;
    const val = BigInt(value);

    return type === "PERCENTAGE" ? (amount * val) / 10000n : val;
  }

  static async calculate(
    tx,
    { userId, serviceProviderMappingId, amount, paymentMethod, cardNetwork }
  ) {
    const txnAmount = BigInt(amount);

    // USER
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true },
    });
    if (!user) throw ApiError.notFound("User not found");

    // MAPPING
    const mapping = await tx.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });
    if (!mapping) throw ApiError.notFound("Mapping not found");

    // ================= PROVIDER (STRICT) =================
    const providerMethod = await tx.paymentMethodChargeProvider.findFirst({
      where: {
        serviceProviderMappingId,
        paymentMethod,
        network: cardNetwork,
      },
    });

    if (!providerMethod) {
      throw ApiError.badRequest(
        "Provider pricing not configured for this payment method"
      );
    }

    const providerCost = this.calc(
      txnAmount,
      providerMethod.value,
      providerMethod.type
    );

    // ================= COMMISSION (STRICT) =================
    const commissionMethod = await tx.commissionPaymentMethod.findFirst({
      where: {
        commissionSetting: {
          serviceProviderMappingId,
          isActive: true,
        },
        paymentMethod,
        network: cardNetwork,
      },
      include: {
        commissionSetting: true,
      },
    });

    if (!commissionMethod) {
      throw ApiError.badRequest(
        "Commission not configured for this payment method"
      );
    }

    const surcharge = this.calc(
      txnAmount,
      commissionMethod.value,
      commissionMethod.type
    );

    // ================= GST =================
    const gstProvider =
      mapping.applyGST && mapping.gstPercent
        ? (providerCost * BigInt(mapping.gstPercent)) / 100n
        : 0n;

    let gstSurcharge = 0n;

    if (commissionMethod.commissionSetting?.applyGST) {
      const percent = BigInt(
        commissionMethod.commissionSetting.gstPercent || 18
      );
      gstSurcharge = (surcharge * percent) / 100n;
    }

    // ================= FINAL =================
    const totalCharges = providerCost + surcharge + gstProvider + gstSurcharge;

    const netCredit = txnAmount - totalCharges;

    if (netCredit <= 0n) {
      throw ApiError.badRequest("Amount too low after charges");
    }

    return {
      txnAmount,
      providerCost,
      surcharge,
      gstProvider,
      gstSurcharge,
      totalCharges,
      netCredit,
      surchageType: commissionMethod.type || "FLAT",
    };
  }
}
