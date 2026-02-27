import { z } from "zod";

export const optionalStringUrl = z
  .string()
  .url("Invalid URL format")
  .optional()
  .nullable();

class ApiKeyValidationSchemas {
  static get CreateApiKey() {
    return z.object({
      userId: z.string().uuid("Invalid userId"),
      label: z.string().optional(),
      expiresAt: z
        .string()
        .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date")
        .optional(),
    });
  }

  static get AddService() {
    return z.object({
      apiKeyId: z.string().uuid("Invalid apiKeyId"),
      serviceId: z.string().uuid("Invalid serviceId"),
      rateLimit: z.number().int().positive().optional(),
      callbackUrl: optionalStringUrl,
    });
  }

  static get AddIpWhitelist() {
    return z.object({
      apiKeyId: z.string().uuid("Invalid apiKeyId"),
      ip: z
        .string()
        .regex(
          /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
          "Invalid IP or CIDR format"
        ),
      note: z.string().optional(),
    });
  }

  static get ApiKeyIdParam() {
    return z.object({
      id: z.string().uuid("Invalid API key id"),
    });
  }

  static get FilterParams() {
    return z.object({
      userId: z.string().uuid("Invalid userId"),
      isActive: z.boolean().optional(),
      page: z.number().int().optional().default(1),
      limit: z.number().int().optional().default(10),
      sort: z.enum(["asc", "desc"]).optional().default("desc"),
    });
  }
}

export default ApiKeyValidationSchemas;