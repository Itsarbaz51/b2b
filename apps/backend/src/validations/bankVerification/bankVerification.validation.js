import { z } from "zod";

export const VerifyBankSchema = z.object({
  accountNo: z.string().min(6),
  ifsc: z.string().length(11),
  serviceId: z.string(),
  idempotencyKey: z.string(),
});
