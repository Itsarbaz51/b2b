import { z } from "zod";

const WalletTypeEnum = z.enum([
  "PRIMARY",
  "COMMISSION",
  "ESCROW",
  "TAX",
  "BONUS",
  "HOLDING",
]);
const ReferenceTypeEnum = z.enum([
  "TRANSACTION",
  "COMMISSION",
  "REFUND",
  "ADJUSTMENT",
  "BONUS",
  "CHARGE",
  "FEE",
  "TAX",
  "PAYOUT",
  "COLLECTION",
]);

class WallletValidationSchemas {
  static get walletCreditSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      amount: z.number().positive({ message: "Amount must be positive" }),
      narration: z
        .string()
        .min(1, { message: "Narration is required" })
        .optional(),
      walletType: WalletTypeEnum.default("PRIMARY"),
      referenceType: ReferenceTypeEnum.default("ADJUSTMENT"),
      serviceId: z.string().uuid().optional(),
    });
  }

  static get walletDebitSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      amount: z.number().positive({ message: "Amount must be positive" }),
      narration: z
        .string()
        .min(1, { message: "Narration is required" })
        .optional(),
      walletType: WalletTypeEnum.default("PRIMARY"),
      referenceType: ReferenceTypeEnum.default("ADJUSTMENT"),
      serviceId: z.string().uuid().optional(),
    });
  }

  static get holdAmountSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      amount: z.number().positive({ message: "Amount must be positive" }),
      narration: z
        .string()
        .min(1, { message: "Narration is required" })
        .optional(),
      walletType: WalletTypeEnum.default("PRIMARY"),
    });
  }

  static get releaseHoldAmountSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      amount: z.number().positive({ message: "Amount must be positive" }),
      narration: z
        .string()
        .min(1, { message: "Narration is required" })
        .optional(),
      walletType: WalletTypeEnum.default("PRIMARY"),
    });
  }

  static get getWalletSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      walletType: WalletTypeEnum.optional(),
    });
  }

  static get walletTransactionsSchema() {
    return z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      walletType: WalletTypeEnum.optional(),
    });
  }

  static get getWalletBalanceSchema() {
    return z.object({
      walletType: WalletTypeEnum.optional(),
    });
  }
}

export default WallletValidationSchemas;