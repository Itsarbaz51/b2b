import { z } from "zod";

class AadhaarValidationSchemas {
  static get SendOtpSchema() {
    return z.object({
      aadhaarNumber: z
        .string()
        .trim()
        .regex(/^[0-9]{12}$/, "Aadhaar must be exactly 12 digits"),
    });
  }

  static get VerifyOtpSchema() {
    return z.object({
      transactionId: z.string().uuid("Invalid transaction ID format"),
      otp: z
        .string()
        .trim()
        .regex(/^[0-9]{4,6}$/, "OTP must be 4 to 6 digits"),
    });
  }
}

export default AadhaarValidationSchemas;
