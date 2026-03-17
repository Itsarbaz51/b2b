import { z } from "zod";

class CommissionValidationSchemas {
  static get createOrUpdateCommissionSettingSchema() {
    return z.object({
      scope: z.enum(["ROLE", "USER"]),
      roleId: z.string().uuid().optional(),
      targetUserId: z.string().uuid().optional(),
      serviceProviderMappingId: z.string().uuid().optional(),

      mode: z.enum(["COMMISSION", "SURCHARGE"]),
      type: z.enum(["FLAT", "PERCENTAGE"]),

      value: z.coerce.bigint().positive(),

      applyTDS: z.boolean().optional(),
      tdsPercent: z.coerce.bigint().min(0).max(100).optional(),

      applyGST: z.boolean().optional(),
      gstPercent: z.coerce.bigint().min(0).max(100).optional(),
      supportsSlab: z.boolean().optional(),
    });
  }

  static get createCommissionEarningSchema() {
    return z.object({
      userId: z.string().uuid({ message: "userId must be a valid UUID" }),
      fromUserId: z
        .string()
        .uuid({ message: "fromUserId must be a valid UUID" })
        .optional(),

      serviceId: z
        .string()
        .uuid({ message: "serviceId must be a valid UUID" })
        .optional(),

      transactionId: z
        .string()
        .uuid({ message: "transactionId must be a valid UUID" }),

      amount: z.coerce.bigint().positive(),
      commissionAmount: z.coerce.bigint().positive(),

      commissionType: z.enum(["FLAT", "PERCENTAGE"]),

      tdsAmount: z.coerce.bigint().nonnegative().optional().default(0),
      gstAmount: z.coerce.bigint().nonnegative().optional().default(0),

      netAmount: z.coerce.bigint().positive(),

      metadata: z.any().optional(),
    });
  }
}

export default CommissionValidationSchemas;
