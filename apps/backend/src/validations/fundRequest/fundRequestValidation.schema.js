import { z } from "zod";

const CreateFundRequest = z
  .object({
    serviceId: z.string().uuid(),

    provider: z.enum(["BANK_TRANSFER", "RAZORPAY"]),

    amount: z.coerce.number().positive("Amount must be greater than 0"),

    rrn: z
      .string()
      .min(10, "RRN must be minimum 10 characters")
      .max(30, "RRN too long")
      .optional(),

    paymentImage: z.any().optional(),

    idempotencyKey: z.string().uuid("Invalid idempotency key"),

    transactionDate: z.string().optional(),

    notes: z.string().max(200).optional(),
  })

  .refine(
    (data) => {
      if (data.provider === "BANK_TRANSFER") {
        return !!data.rrn;
      }
      return true;
    },
    {
      message: "RRN is required for bank transfer",
      path: ["rrn"],
    }
  );

const FundRequestValidationSchemas = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "REJECT" && !data.reason) {
      ctx.addIssue({
        path: ["reason"],
        code: z.ZodIssueCode.custom,
        message: "Reason is required when rejecting",
      });
    }
  });

export { CreateFundRequest, FundRequestValidationSchemas };
