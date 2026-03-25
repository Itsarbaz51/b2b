import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import SurchargeEngine from "./surcharge.engine.js";
import TransactionService from "../services/transaction.service.js";
import PricingEngine from "./pricing.engine.js";
import { ApiError } from "../utils/ApiError.js";

export default class SettlementEngine {
  static async execute({ tx, actor, payload, serviceProviderMapping }) {
    const userId = actor.id;

    const wallet = await WalletEngine.getWallet({
      tx,
      userId,
      walletType: "PRIMARY",
    });

    const pricing = await PricingEngine.calculateSurcharge(tx, {
      userId,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: payload.amount || 0,
    });

    const existingTxn = await tx.transaction.findFirst({
      where: {
        idempotencyKey: payload.idempotencyKey,
        userId,
      },
    });

    if (existingTxn) {
      return {
        transaction: existingTxn,
        wallet: null,
        pricing: existingTxn.pricing,
        isDuplicate: true,
      };
    }

    const holdWallet = await WalletEngine.hold(tx, wallet, pricing.totalDebit);

    const { transaction } = await TransactionService.create(tx, {
      userId,
      txnId: payload.txnId,
      walletId: wallet.id,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: pricing.totalDebit,
      pricing,
      idempotencyKey: payload.idempotencyKey,
      requestPayload: payload,
    });

    return { transaction, wallet: holdWallet, pricing };
  }

  // ✅ SUCCESS
  static async success({
    tx,
    actor,
    transaction,
    wallet,
    pricing,
    serviceProviderMapping,
  }) {
    const walletId = transaction.walletId;

    await WalletEngine.captureHold(tx, wallet, pricing.totalDebit);

    await LedgerEngine.create(tx, {
      walletId,
      transactionId: transaction.id,
      entryType: "DEBIT",
      referenceType: "TRANSACTION",
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: pricing.totalDebit,
      narration: "Payout debit",
      createdBy: actor.id,
    });

    await SurchargeEngine.distribute(tx, {
      transactionId: transaction.id,
      userId: actor.id,
      serviceProviderMappingId: serviceProviderMapping.id,
      createdBy: actor.id,
      pricing,
    });
  }

  // ❌ FAILED
  static async failed({ tx, wallet, pricing }) {
    await WalletEngine.releaseHold(tx, wallet, pricing.totalDebit);
  }
}
