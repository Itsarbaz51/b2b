import { z } from "zod";

class WallletValidationSchemas {
  static get transferCommissionSchema() {
    return z.object({
      amount: z.number().positive("Amount must be greater than 0"),
      idempotencyKey: z.uuid("Invalid idempotency key"),
    });
  }
}

export default WallletValidationSchemas;