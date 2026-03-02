import { z } from "zod";

class AadhaarValidationSchemas {
  static get SendOtpSchema() {
    return z.object({
      aadhaarNumber: z
        .string()
        .trim()
        .regex(/^[0-9]{12}$/, "Aadhaar must be exactly 12 digits"),

      serviceId: z.string().uuid("Invalid serviceId"),

      idempotencyKey: z.string().uuid("Invalid idempotency key"),
    });
  }

  static get VerifyOtpSchema() {
    return z.object({
      transactionId: z.string().uuid("Invalid transaction ID format"),

      referenceId: z.string().trim().min(5, "Invalid reference ID"),

      otp: z
        .string()
        .trim()
        .regex(/^[0-9]{4,6}$/, "OTP must be 4 to 6 digits"),
    });
  }
}

export default AadhaarValidationSchemas;
