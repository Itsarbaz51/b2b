import { z } from "zod";

export class ServiceValidationSchemas {
  static get createServiceProvider() {
    return z.object({
      code: z
        .string()
        .min(2, {
          message: "Service Provider code must be at least 2 characters",
        })
        .max(50, {
          message: "Service Provider code must not exceed 50 characters",
        }),
      name: z.string().min(1, "Name is required").max(255),
      description: z
        .string()
        .min(5, "Description must be at least 5 characters long")
        .max(150, "Description must be at most 30 characters long")
        .optional(),
      isActive: z.boolean().optional().default(true),
      parentId: z.string().uuid().optional().nullable(),
    });
  }

  static get toggleStatus() {
    return z.object({
      isActive: z.boolean(),
    });
  }

  static get updateServiceProvider() {
    return z.object({
      type: z
        .enum(["BULKPAY", "CC_PAYOUT", "AEPS", "BBPS", "DMT", "RECHARGE"])
        .optional(),
      code: z
        .string()
        .min(2)
        .max(50)
        .regex(/^[A-Z0-9_]+$/)
        .optional(),
      name: z.string().min(1).max(255).optional(),
      config: z.any().optional(),
      isActive: z.boolean().optional(),
      parentId: z.string().uuid().optional().nullable(),
    });
  }

  static get updateCredentials() {
    return z.object({
      credentials: z.object({}).passthrough(), // Allows any object structure
    });
  }
}
