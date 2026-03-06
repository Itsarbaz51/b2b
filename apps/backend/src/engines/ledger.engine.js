import { ApiError } from "../utils/ApiError.js";

export default class LedgerEngine {
  static async create(
    tx,
    {
      walletId,
      transactionId,
      entryType, // "DEBIT" | "CREDIT"
      referenceType = "TRANSACTION",
      serviceProviderMappingId,
      amount,
      narration,
      createdBy,
      idempotencyKey,
      metadata,
    }
  ) {
    if (!walletId) throw ApiError.badRequest("Wallet ID required");
    if (!entryType) throw ApiError.badRequest("Entry type required");

    const amt = BigInt(amount);

    // 🔒 Idempotency Check
    if (idempotencyKey) {
      const existing = await tx.ledgerEntry.findUnique({
        where: { idempotencyKey },
      });

      if (existing) return existing;
    }

    // 🔎 Fetch Wallet
    const wallet = await tx.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) throw ApiError.notFound("Wallet not found");

    console.log(wallet);

    // Calculate running balance
    const balanceAfter =
      entryType === "CREDIT" ? wallet.balance + amt : wallet.balance;

    // 🚨 Optional Safety Check
    if (entryType === "DEBIT" && wallet.balance < amt) {
      throw ApiError.badRequest("Insufficient wallet balance");
    }

    return await tx.ledgerEntry.create({
      data: {
        walletId,
        transactionId,
        entryType,
        referenceType,
        serviceProviderMappingId,
        amount: amt,
        runningBalance: balanceAfter,
        narration,
        metadata,
        idempotencyKey,
        createdBy,
      },
    });
  }
}
