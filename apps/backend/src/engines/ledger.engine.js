import { ApiError } from "../utils/ApiError.js";

export default class LedgerEngine {
  static async create(
    tx,
    {
      walletId,
      transactionId,
      entryType, // DEBIT | CREDIT
      referenceType = "TRANSACTION",
      serviceId,
      amount,
      narration,
      createdBy,
      idempotencyKey,
      metadata,
    }
  ) {
    const amt = BigInt(amount);

    if (!walletId) throw ApiError.badRequest("Wallet ID required");

    // 🔒 Idempotency check
    if (idempotencyKey) {
      const existing = await tx.ledgerEntry.findUnique({
        where: { idempotencyKey },
      });

      if (existing) return existing;
    }

    // 🔎 Fetch current balance
    const wallet = await tx.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) throw ApiError.notFound("Wallet not found");

    const runningBalance =
      entryType === "CREDIT" ? wallet.balance + amt : wallet.balance - amt;

    return tx.ledgerEntry.create({
      data: {
        walletId,
        transactionId,
        entryType,
        referenceType,
        serviceId,
        amount: amt,
        runningBalance,
        narration,
        metadata,
        idempotencyKey,
        createdBy,
      },
    });
  }
}
