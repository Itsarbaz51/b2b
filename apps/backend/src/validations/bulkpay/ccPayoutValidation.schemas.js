import { z } from "zod";

class CCPayoutValidationSchemas {
  static get CreateSender() {
    return z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
      aadhar: z
        .union([
          z.string().regex(/^\d{12}$/, "Invalid Aadhar format"),
          z.string().length(0),
        ])
        .optional()
        .transform((val) => (val === "" ? undefined : val)),
      phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
      cardNo: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
      cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
      expiry: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, "Expiry must be in MM/YYYY format")
        .refine(
          (val) => {
            const [monthStr, yearStr] = val.split("/");
            if (!monthStr || !yearStr) return false;

            const month = parseInt(monthStr, 10);
            const year = parseInt(yearStr, 10);
            const expiryDate = new Date(year, month - 1);
            return expiryDate > new Date();
          },
          { message: "Card has expired" }
        ),
    });
  }

  static get UploadCardImage() {
    return z.object({
      senderId: z.string().min(1, "Sender ID is required"),
      cardImageType: z.enum(["front", "back"]),
    });
  }

  static get ListSenders() {
    return z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(10),
      referenceId: z.string().optional(),
      senderId: z.string().optional(),
    });
  }

  static get CreateBeneficiary() {
    return z.object({
      reference: z.string().min(1, "Reference is required"),
      name: z.string().min(2, "Name must be at least 2 characters"),
      accountNumber: z
        .string()
        .min(9, "Account number must be at least 9 digits")
        .max(18, "Account number must be at most 18 digits")
        .regex(/^\d+$/, "Account number must contain only digits"),
      ifsc: z
        .string()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
    });
  }

  static get ListBeneficiaries() {
    return z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(10),
      status: z.enum(["PENDING", "ACTIVE", "FAILED", "SUCCESS"]).optional(),
      reference: z.string().optional(),
      beneficiaryId: z.string().optional(),
    });
  }

  static get CreateCollection() {
    return z.object({
      reference: z.string().min(1, "Reference is required"),
      beneficiaryId: z.string().min(1, "Beneficiary ID is required"),
      senderId: z.string().min(1, "Sender ID is required"),
      amount: z.coerce
        .number()
        .positive("Amount must be positive")
        .min(1, "Minimum amount is 1")
        .max(100000, "Maximum amount is 100,000"),
      type: z.coerce
        .number()
        .int()
        .min(1, "Type must be 1 (instant) or 2 (T+1)")
        .max(2, "Type must be 1 (instant) or 2 (T+1)"),
      redirectUrl: z.string().url("Invalid redirect URL"),
      cardType: z.enum(["VISA", "MASTERCARD", "RUPAY", "AMEX"]),
      additionalCharge: z.coerce
        .number()
        .nonnegative("Additional charge must be non-negative")
        .optional()
        .default(0),
    });
  }

  static get ListCollections() {
    return z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(10),
      beneficiaryId: z.string().optional(),
      reference: z.string().optional(),
      collectionId: z.string().optional(),
    });
  }

  static get Webhook() {
    return z.object({
      collectionId: z.string().min(1, "Collection ID is required"),
      status: z.enum(["PENDING", "SUCCESS", "FAILED", "PROCESSING"]),
      message: z.string().optional(),
      utr: z.string().optional(),
      payouts: z
        .array(
          z.object({
            transactionId: z.string(),
            amount: z.number(),
            accountNumber: z.string(),
            ifsc: z.string(),
            beneficiaryName: z.string(),
            status: z.string(),
            message: z.string().optional(),
            paymentMode: z.string(),
            utr: z.string().optional(),
            holderName: z.string().optional(),
          })
        )
        .optional()
        .default([]),
      timestamp: z.string().datetime().optional(),
    });
  }
}

export default CCPayoutValidationSchemas;