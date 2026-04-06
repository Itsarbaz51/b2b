import { z } from "zod";

class CommissionValidationSchemas {
  static get createOrUpdateCommissionSettingSchema() {
    return z
      .object({
        scope: z.enum(["ROLE", "USER"]),
        roleId: z.string().uuid().optional(),
        targetUserId: z.string().uuid().optional(),
        serviceProviderMappingId: z.string().uuid().optional(),

        mode: z.enum(["COMMISSION", "SURCHARGE"]),
        type: z.enum(["FLAT", "PERCENTAGE"]),

        value: z.coerce.bigint().optional(),

        applyTDS: z.boolean().optional(),
        tdsPercent: z.coerce.bigint().min(0).max(100).optional(),

        applyGST: z.boolean().optional(),
        gstPercent: z.coerce.bigint().min(0).max(100).optional(),
        supportsSlab: z.boolean().optional(),
        supportPaymentMethod: z.boolean().optional(),
      })
      .refine(
        (data) => {
          if (!data.supportsSlab && !data.supportPaymentMethod) {
            return data.value && data.value > 0n;
          }
          return true;
        },
        {
          message:
            "Value must be greater than 0 when slab/payment method disabled",
          path: ["value"],
        }
      );
  }
}

export default CommissionValidationSchemas;
