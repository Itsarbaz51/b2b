import PricingEngine from "./pricing.engine.js";
import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import SurchargeEngine from "./surcharge.engine.js";
import TransactionService from "../services/transaction.service.js";
import { ApiError } from "../utils/ApiError.js";

export default class SettlementEngine {
  static async execute({ tx, actor, payload, serviceProviderMapping }) {
    const userId = actor.id;

    // GET WALLET
    const wallet = await WalletEngine.getWallet({
      tx,
      userId,
      walletType: "PRIMARY",
    });

    // PRICING
    const pricing = await PricingEngine.calculateSurcharge(tx, {
      userId,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: payload.amount || 0,
    });

    const { providerCost, surcharge, gst, totalDebit } = pricing;

    if (wallet.balance < totalDebit) {
      throw ApiError.badRequest("Insufficient wallet balance");
    }

    // HOLD USER BALANCE
    await WalletEngine.hold(tx, wallet, totalDebit);

    // CREATE TRANSACTION
    const { transaction } = await TransactionService.create(tx, {
      userId,
      walletId: wallet.id,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: totalDebit,
      pricing,
      idempotencyKey: payload.idempotencyKey,
      requestPayload: payload,
    });

    return {
      transaction,
      wallet,
      pricing,
    };
  }

  //   SUCCESS SETTLEMENT
  static async success({
    tx,
    actor,
    transaction,
    wallet,
    pricing,
    serviceProviderMapping,
  }) {
    const userId = actor.id;

    // CAPTURE HOLD
    const updatedWallet = await WalletEngine.getWallet({
      tx,
      userId,
      walletType: "PRIMARY",
    });

    await WalletEngine.captureHold(tx, updatedWallet, pricing.totalDebit);

    // USER DEBIT LEDGER
    await LedgerEngine.create(tx, {
      walletId: updatedWallet.id,
      transactionId: transaction.id,
      entryType: "DEBIT",
      referenceType: "TRANSACTION",
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: pricing.totalDebit,
      narration: "Service charge",
      createdBy: actor.id,
    });

    // SURCHARGE DISTRIBUTION
    await SurchargeEngine.distribute(tx, {
      transactionId: transaction.id,
      userId,
      serviceProviderMappingId: serviceProviderMapping.id,
      createdBy: actor.id,
      pricing,
    });
  }

  //   FAILED SETTLEMENT
  static async failed({ tx, actor, wallet, pricing }) {
    const userId = actor.id;

    const updatedWallet = await WalletEngine.getWallet({
      tx,
      userId,
      walletType: "PRIMARY",
    });

    await WalletEngine.releaseHold(tx, updatedWallet, pricing.totalDebit);
  }
}
