import { z } from "zod";

class PayoutValidationSchemas {
  static get TransferSchema() {
    return z
      .object({
        serviceProviderMappingId: z.string().uuid("Invalid serviceProviderMappingId"),
        provider: z.string().optional(),

        number: z.string().min(10, "Invalid mobile number"),

        amount: z.number().positive("Amount must be greater than 0"),

        transferMode: z.enum(["IMPS", "NEFT", "RTGS", "UPI"]),

        accountNo: z.string().optional(),
        ifscCode: z.string().optional(),
        beneficiaryName: z.string().min(2),

        vpa: z.string().optional(),

        idempotencyKey: z.string().uuid("Invalid idempotency key"),
      })
      .superRefine((data, ctx) => {
        // 🔥 Conditional validation
        if (data.transferMode === "UPI") {
          if (!data.vpa) {
            ctx.addIssue({
              code: "custom",
              message: "VPA is required for UPI",
              path: ["vpa"],
            });
          }
        } else {
          if (!data.accountNo || !data.ifscCode) {
            ctx.addIssue({
              code: "custom",
              message: "Account number & IFSC required",
              path: ["accountNo"],
            });
          }
        }
      });
  }

  static get StatusSchema() {
    return z.object({
      serviceId: z.string().uuid("Invalid serviceId"),
      provider: z.string(),
      clientOrderId: z.string().min(5, "clientOrderId required"),
    });
  }

  static get BalanceSchema() {
    return z.object({
      serviceId: z.string().uuid("Invalid serviceId"),
      provider: z.string(),
    });
  }
}

export default PayoutValidationSchemas;
