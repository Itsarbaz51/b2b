import { ApiError } from "../utils/ApiError.js";

export class WalletService {
  static async getWallet(tx, userId, walletType) {
    const wallet = await tx.wallet.findUnique({
      where: { userId_walletType: { userId, walletType } },
    });

    if (!wallet || !wallet.isActive)
      throw ApiError.notFound("Wallet not found");

    return wallet;
  }

  static async debit(tx, wallet, amount) {
    const available = wallet.balance - wallet.holdBalance;
    if (available < amount) throw ApiError.badRequest("Insufficient balance");

    const updated = await tx.wallet.updateMany({
      where: {
        id: wallet.id,
        version: wallet.version,
      },
      data: {
        balance: wallet.balance - amount,
        version: { increment: 1 },
      },
    });

    if (updated.count === 0)
      throw ApiError.conflict("Wallet concurrency conflict");
  }

  static async credit(tx, wallet, amount) {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + amount,
        version: { increment: 1 },
      },
    });
  }

  static async hold(tx, wallet, amount) {
    const available = wallet.balance - wallet.holdBalance;
    if (available < amount) throw ApiError.badRequest("Insufficient balance");

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        holdBalance: wallet.holdBalance + amount,
        version: { increment: 1 },
      },
    });
  }

  static async releaseHold(tx, wallet, amount) {
    if (wallet.holdBalance < amount)
      throw ApiError.badRequest("Invalid hold release");

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        holdBalance: wallet.holdBalance - amount,
        version: { increment: 1 },
      },
    });
  }
}
