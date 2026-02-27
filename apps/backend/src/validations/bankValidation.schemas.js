import { z } from "zod";

class BankValidationSchemas {
  static get BankDetailSchema() {
    return z.object({
      bankName: z.string().min(2, "Bank name is required"),
      accountHolder: z.string().min(3, "Account holder name is required"),
      accountNumber: z
        .string()
        .min(9, "Account number must be at least 9 digits")
        .max(18, "Account number can't exceed 18 digits"),
      phoneNumber: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number can't exceed 15 digits"),
      ifscCode: z
        .string()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
      accountType: z.enum(["PERSONAL", "BUSINESS"]),
      isPrimary: z.coerce.boolean().optional().default(false),
    });
  }

  static get VerificationBankSchema() {
    return z
      .object({
        id: z.string().uuid(),
        status: z.enum(["VERIFIED", "REJECT"]),
        bankRejectionReason: z.string(),
      })
      .refine(
        (data) => {
          if (data.status === "REJECT") {
            return !!data.bankRejectionReason?.trim();
          }
          return true;
        },
        {
          message: "Rejection reason is required when status is REJECT",
          path: ["bankRejectionReason"],
        }
      );
  }

  static get BankDetailUpdateSchema() {
    return this.BankDetailSchema.partial();
  }
}

export default BankValidationSchemas;
