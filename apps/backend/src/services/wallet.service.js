import WalletEngine from "../engines/wallet.engine.js";
import LedgerEngine from "../engines/ledger.engine.js";
import TransactionService from "./transaction.service.js";
import { ApiError } from "../utils/ApiError.js";
import Prisma from "../db/db.js";

export default class WalletService {
  static async transferCommissionToPrimary(payload, userId) {
    const { amount, idempotencyKey } = payload;
    const amt = BigInt(amount);

    if (amt <= 0n) {
      throw ApiError.badRequest("Invalid amount");
    }

    return await Prisma.$transaction(async (tx) => {
      // 🔹 wallets fetch
      const commissionWallet = await WalletEngine.getWallet({
        tx,
        userId,
        walletType: "COMMISSION",
      });

      const primaryWallet = await WalletEngine.getWallet({
        tx,
        userId,
        walletType: "PRIMARY",
      });

      // 🔹 create transaction
      const { transaction } = await TransactionService.create(tx, {
        userId,
        walletId: commissionWallet.id,
        serviceProviderMappingId: null,
        amount: amt,
        idempotencyKey,
        requestPayload: { type: "COMMISSION_TRANSFER" },
      });

      await WalletEngine.debit(tx, commissionWallet, amt);

      await WalletEngine.credit(tx, primaryWallet, amt);

      await LedgerEngine.create(tx, {
        walletId: commissionWallet.id,
        entryType: "DEBIT",
        amount: amt,
        narration: "Commission → Primary transfer",
        referenceType: "WALLET_TRANSFER",
        transactionId: transaction.id,
        createdBy: userId,
        idempotencyKey: `${transaction.id}-DEBIT`,
      });

      await LedgerEngine.create(tx, {
        walletId: primaryWallet.id,
        entryType: "CREDIT",
        amount: amt,
        narration: "Commission → Primary transfer",
        referenceType: "WALLET_TRANSFER",
        transactionId: transaction.id,
        createdBy: userId,
        idempotencyKey: `${transaction.id}-CREDIT`,
      });

      await TransactionService.update(tx, {
        transactionId: transaction.id,
        status: "SUCCESS",
      });

      return {
        success: true,
        transactionId: transaction.txnId,
      };
    });
  }
}
