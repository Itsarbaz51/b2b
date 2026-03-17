import { ApiError } from "../utils/ApiError.js";

export default class WalletEngine {
  // ✅ Get Wallet
  static async getWallet({ tx, userId, walletType = "PRIMARY" }) {
    const wallet = await tx.wallet.findUnique({
      where: {
        userId_walletType: {
          userId,
          walletType,
        },
      },
    });

    if (!wallet) throw ApiError.notFound("Wallet not found");
    if (!wallet.isActive) throw ApiError.notFound("Wallet not Active");

    return wallet;
  }

  // ➕ CREDIT
  static async credit(tx, walletId, amount) {
    const amt = BigInt(amount);

    await tx.$executeRaw`
      UPDATE "Wallet"
      SET 
        "balance" = "balance" + ${amt},
        "version" = "version" + 1
      WHERE id = ${walletId}
    `;
  }

  // 🔒 HOLD (Atomic + Race Condition Safe)
  static async hold(tx, walletId, amount) {
    const amt = BigInt(amount);

    const result = await tx.$executeRaw`
      UPDATE "Wallet"
      SET 
        "holdBalance" = "holdBalance" + ${amt},
        "version" = "version" + 1
      WHERE id = ${walletId}
      AND ("balance" - "holdBalance") >= ${amt}
    `;

    if (result === 0) {
      throw ApiError.badRequest("Insufficient available balance");
    }
  }

  // 🔓 RELEASE HOLD
  static async releaseHold(tx, walletId, amount) {
    const amt = BigInt(amount);

    const result = await tx.$executeRaw`
      UPDATE "Wallet"
      SET 
        "holdBalance" = "holdBalance" - ${amt},
        "version" = "version" + 1
      WHERE id = ${walletId}
      AND "holdBalance" >= ${amt}
    `;

    if (result === 0) {
      throw ApiError.badRequest("Invalid hold release");
    }
  }

  // ✅ CAPTURE HOLD → FINAL DEBIT
  static async captureHold(tx, walletId, amount) {
    const amt = BigInt(amount);

    const result = await tx.$executeRaw`
      UPDATE "Wallet"
      SET 
        "holdBalance" = "holdBalance" - ${amt},
        "balance" = "balance" - ${amt},
        "version" = "version" + 1
      WHERE id = ${walletId}
      AND "holdBalance" >= ${amt}
    `;

    if (result === 0) {
      throw ApiError.badRequest("Invalid hold capture");
    }
  }

  // ➖ DIRECT DEBIT (rare use)
  static async debit(tx, walletId, amount) {
    const amt = BigInt(amount);

    const result = await tx.$executeRaw`
      UPDATE "Wallet"
      SET 
        "balance" = "balance" - ${amt},
        "version" = "version" + 1
      WHERE id = ${walletId}
      AND "balance" >= ${amt}
    `;

    if (result === 0) {
      throw ApiError.badRequest("Insufficient balance");
    }
  }
}
