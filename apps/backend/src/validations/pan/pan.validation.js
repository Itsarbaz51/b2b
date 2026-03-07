import { z } from "zod";

class PanValidationSchemas {
  static get VerifyPanSchema() {
    return z.object({
      panNumber: z
        .string()
        .trim()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),

      serviceId: z.string().uuid("Invalid serviceId"),

      idempotencyKey: z.string().uuid("Invalid idempotency key"),
    });
  }
}

export default PanValidationSchemas;
