import { z } from "zod";
export class ServiceValidationSchemas {
  static get create() {
    return z.object({
      type: z.enum(["service", "provider", "mapping"]),

      name: z.string().optional(),
      code: z.string().optional(),

      serviceId: z.string().uuid().optional(),
      providerId: z.string().uuid().optional(),

      config: z.any().optional(),
      priority: z.number().optional(),
      isActive: z.boolean().optional(),
    });
  }
}
