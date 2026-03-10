import { z } from "zod";
export class ServiceValidationSchemas {
  static get create() {
    return z.object({
      type: z.enum(["service", "provider", "mapping", "slab"]),

      name: z.string().optional(),
      code: z.string().optional(),

      serviceId: z.string().uuid().optional(),
      providerId: z.string().uuid().optional(),

      providerCost: z.coerce.number().positive().optional(),
      sellingPrice: z.coerce.number().positive().optional(),
      serviceProviderMappingId: z.uuid().optional(),

      minAmount: z.coerce.number().positive().optional(),
      maxAmount: z.coerce.number().positive().optional(),
      config: z.any().optional(),
      mode: z.enum(["SURCHARGE", "COMMISSION"]).optional(),
      pricingValueType: z.enum(["PERCENTAGE", "FLAT"]).optional(),
      supportsSlab: z.boolean().optional(),
      commissionStartLevel: z
        .enum(["NONE", "ADMIN_ONLY", "HIERARCHY"])
        .optional(),
      priority: z.number().optional(),
      isActive: z.boolean().optional(),
    });
  }
}
