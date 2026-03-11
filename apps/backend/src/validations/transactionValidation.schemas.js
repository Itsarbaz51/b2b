import { z } from "zod";

export class TransactionValidationSchemas {
  static get getTransactionsSchema() {
    return z.object({
      status: z.string().optional(),

      type: z.string().optional(),

      search: z.string().optional(),

      date: z.string().optional(),

      page: z.coerce.number().min(1).default(1),

      limit: z.coerce.number().min(1).max(100).default(10),
    });
  }
}
