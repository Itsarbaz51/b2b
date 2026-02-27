import { z } from "zod";

// File validation schemas
export const requiredFileSchema = z
  .any()
  .refine((file) => !!file, "File is required")
  .refine(
    (file) =>
      ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype),
    "Only PDF or image files are allowed"
  );

export const optionalFileSchema = z
  .any()
  .optional()
  .refine(
    (file) =>
      !file ||
      ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
        file.mimetype
      ),
    "Only PDF or image files are allowed"
  );

class FundRequestValidationSchemas {
  static get ListFundRequests() {
    return z.object({
      status: z
        .enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED", "ALL"])
        .optional()
        .default("ALL"),
      paymentType: z
        .enum(["FUND_REQ_BANK", "FUND_REQ_RAZORPAY", "ALL"])
        .optional(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(10),
      sort: z.enum(["asc", "desc"]).optional().default("desc"),
      search: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    });
  }

  static get CreateFundRequest() {
    return z
      .object({
        amount: z
          .string()
          .min(1, "Amount is required")
          .refine(
            (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
            "Amount must be a valid number greater than 0"
          ),
        provider: z.enum(["BANK_TRANSFER", "RAZORPAY"], {
          required_error: "Provider is required",
        }),
        paymentId: z.string().optional(),
        orderId: z.string().optional(),
        rrn: z.string().optional(),
        transactionDate: z.string().optional(),
        notes: z.string().optional(),
      })
      .refine(
        (data) => {
          if (data.provider === "BANK_TRANSFER") {
            return !!(data.paymentId || data.rrn);
          }
          if (data.provider === "RAZORPAY") {
            return !!data.orderId;
          }
          return true;
        },
        {
          message:
            "Payment ID/RRN is required for bank transfer, Order ID for Razorpay",
          path: ["paymentId"],
        }
      );
  }

  static get UpdateFundRequest() {
    return z
      .object({
        status: z.enum(["SUCCESS", "FAILED"], {
          required_error: "Status is required",
        }),
        rejectionReason: z.string().optional(),
      })
      .refine(
        (data) => {
          if (data.status === "FAILED" && !data.rejectionReason) {
            return false;
          }
          return true;
        },
        {
          message: "Rejection reason is required when status is FAILED",
          path: ["rejectionReason"],
        }
      );
  }

  static get VerifyPayment() {
    return z.object({
      razorpay_order_id: z.string({
        required_error: "Order ID is required",
      }),
      razorpay_payment_id: z.string({
        required_error: "Payment ID is required",
      }),
      razorpay_signature: z.string({
        required_error: "Signature is required",
      }),
    });
  }

  static get CreateOrder() {
    return z.object({
      amount: z
        .string()
        .min(1, "Amount is required")
        .refine(
          (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
          "Amount must be a valid number greater than 0"
        ),
    });
  }
}

export default FundRequestValidationSchemas;
