import { z } from "zod";

const CreateFundRequest = z
  .object({
    serviceProviderMappingId: z.string().uuid(),

    provider: z.enum(["BANK_TRANSFER", "RAZORPAY"]),

    amount: z.coerce.number().min(100, "Amount must be at least 100"),

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
    action: z.enum(["APPROVE", "REJECT", "VERIFY"]),
    reason: z.string().trim().optional(),

    razorpay_payment_id: z.string().optional(),
    razorpay_order_id: z.string().optional(),
    razorpay_signature: z.string().optional(),
  })

  .superRefine((data, ctx) => {
    // BANK TRANSFER → REJECT reason required
    if (
      data.action === "REJECT" &&
      (!data.reason || data.reason.trim() === "")
    ) {
      ctx.addIssue({
        path: ["reason"],
        code: z.ZodIssueCode.custom,
        message: "Reason is required when rejecting",
      });
    }

    // RAZORPAY → VERIFY fields required
    if (data.action === "VERIFY") {
      if (!data.razorpay_payment_id) {
        ctx.addIssue({
          path: ["razorpay_payment_id"],
          code: z.ZodIssueCode.custom,
          message: "razorpay_payment_id required",
        });
      }

      if (!data.razorpay_order_id) {
        ctx.addIssue({
          path: ["razorpay_order_id"],
          code: z.ZodIssueCode.custom,
          message: "razorpay_order_id required",
        });
      }

      if (!data.razorpay_signature) {
        ctx.addIssue({
          path: ["razorpay_signature"],
          code: z.ZodIssueCode.custom,
          message: "razorpay_signature required",
        });
      }
    }
  });

export { CreateFundRequest, FundRequestValidationSchemas };
