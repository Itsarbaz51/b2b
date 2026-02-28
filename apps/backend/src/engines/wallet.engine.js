import { ApiError } from "../utils/ApiError.js";

export default class WalletEngine {
  // 🔎 Get Wallet
  static async getWallet(tx, userId, walletType = "PRIMARY") {
    const wallet = await tx.wallet.findUnique({
      where: {
        userId_walletType: {
          userId,
          walletType,
        },
      },
    });

    if (!wallet || !wallet.isActive)
      throw ApiError.notFound("Wallet not found");

    return wallet;
  }

  // ➖ Debit
  static async debit(tx, wallet, amount) {
    const amt = BigInt(amount);

    const available = wallet.balance - wallet.holdBalance;

    if (available < amt) throw ApiError.badRequest("Insufficient balance");

    const updated = await tx.wallet.updateMany({
      where: {
        id: wallet.id,
        version: wallet.version,
      },
      data: {
        balance: wallet.balance - amt,
        version: { increment: 1 },
      },
    });

    if (!updated.count) throw ApiError.conflict("Wallet concurrency conflict");
  }

  // ➕ Credit
  static async credit(tx, wallet, amount) {
    const amt = BigInt(amount);

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + amt,
        version: { increment: 1 },
      },
    });
  }

  // 🔒 Hold
  static async hold(tx, wallet, amount) {
    const amt = BigInt(amount);

    const available = wallet.balance - wallet.holdBalance;

    if (available < amt)
      throw ApiError.badRequest("Insufficient balance to hold");

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        holdBalance: wallet.holdBalance + amt,
        version: { increment: 1 },
      },
    });
  }

  // 🔓 Release Hold
  static async releaseHold(tx, wallet, amount) {
    const amt = BigInt(amount);

    if (wallet.holdBalance < amt)
      throw ApiError.badRequest("Invalid hold release");

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        holdBalance: wallet.holdBalance - amt,
        version: { increment: 1 },
      },
    });
  }

  // 🔄 Move Hold → Debit (On Success)
  static async captureHold(tx, wallet, amount) {
    const amt = BigInt(amount);

    if (wallet.holdBalance < amt)
      throw ApiError.badRequest("Invalid hold capture");

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        holdBalance: wallet.holdBalance - amt,
        balance: wallet.balance - amt,
        version: { increment: 1 },
      },
    });
  }
}
