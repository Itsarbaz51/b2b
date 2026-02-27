import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export class LedgerService {
  static async createEntry(data) {
    const {
      walletId,
      transactionId,
      entryType,
      referenceType = "TRANSACTION",
      amount = 0n,
      runningBalance,
      narration,
      createdBy,
      metadata,
    } = data;

    if (!walletId || !transactionId) {
      throw ApiError.badRequest("Wallet ID and Transaction ID are required");
    }

    const entry = await Prisma.ledgerEntry.create({
      data: {
        walletId,
        transactionId,
        entryType,
        referenceType,
        amount: BigInt(amount),
        runningBalance:
          runningBalance !== undefined ? BigInt(runningBalance) : undefined,
        narration,
        createdBy,
        metadata,
      },
    });

    return entry;
  }
}
