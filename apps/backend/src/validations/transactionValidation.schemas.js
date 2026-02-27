import { z } from "zod";

export class TransactionValidationSchemas {
  static get createTransactionSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      walletId: z.string().uuid({ message: "Valid wallet ID is required" }),
      serviceId: z
        .string()
        .uuid({ message: "Valid service ID is required" })
        .optional(),
      apiEntityId: z
        .string()
        .uuid({ message: "Valid API entity ID is required" })
        .optional(),
      amount: z.number().positive({ message: "Amount must be positive" }),
      currency: z.string().default("INR"),
      paymentType: z.string().min(1, { message: "Payment type is required" }),
      commissionAmount: z
        .number()
        .nonnegative({ message: "Commission amount must be non-negative" })
        .default(0),
      taxAmount: z
        .number()
        .nonnegative({ message: "Tax amount must be non-negative" })
        .default(0),
      feeAmount: z
        .number()
        .nonnegative({ message: "Fee amount must be non-negative" })
        .default(0),
      cashbackAmount: z
        .number()
        .nonnegative({ message: "Cashback amount must be non-negative" })
        .default(0),
      idempotencyKey: z
        .string()
        .min(1, { message: "Idempotency key must not be empty" })
        .optional(),
      referenceId: z.string().optional(),
      externalRefId: z.string().optional(),
      requestPayload: z.record(z.any()).optional(),
      metadata: z.record(z.any()).optional(),
    });
  }

  static get refundTransactionSchema() {
    return z.object({
      transactionId: z
        .string()
        .uuid({ message: "Valid transaction ID is required" }),
      initiatedBy: z.string().uuid({ message: "Valid user ID is required" }),
      amount: z.number().positive({ message: "Amount must be positive" }),
      reason: z.string().min(1, { message: "Reason is required" }).optional(),
      metadata: z.record(z.any()).optional(),
    });
  }

  static get getTransactionsSchema() {
    return z.object({
      userId: z.string().uuid().optional(),
      status: z.string().optional(),
      serviceId: z.string().uuid().optional(),
      apiEntityId: z.string().uuid().optional(),
      paymentType: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
    });
  }

  static get updateTransactionStatusSchema() {
    return z.object({
      transactionId: z
        .string()
        .uuid({ message: "Valid transaction ID is required" }),
      status: z.enum(
        ["PENDING", "SUCCESS", "FAILED", "REVERSED", "REFUNDED", "CANCELLED"],
        {
          message: "Status must be a valid transaction status",
        }
      ),
      providerReference: z.string().optional(),
      providerResponse: z.record(z.any()).optional(),
      responsePayload: z.record(z.any()).optional(),
    });
  }
}