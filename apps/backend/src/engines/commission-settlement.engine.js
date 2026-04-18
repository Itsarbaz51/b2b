import WalletEngine from "./wallet.engine.js";
import LedgerEngine from "./ledger.engine.js";
import TransactionService from "../services/transaction.service.js";
import PricingEngine from "./pricing.engine.js";
import CommissionEngine from "./commission.engine.js";

export default class CommissionSettlementEngine {
  static async execute({ tx, actor, payload, serviceProviderMapping }) {
    const userId = actor.id;

    const wallet = await WalletEngine.getWallet({
      tx,
      userId,
      walletType: "PRIMARY",
    });

    const txnAmount = BigInt(payload.amount);

    const pricing = {
      txnAmount,
      totalDebit: txnAmount,
      fetchId: payload.fetchId,
    };

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

    return {
      transaction,
      wallet: holdWallet,
      pricing,
      isDuplicate: false,
    };
  }

  static async success({
    tx,
    actor,
    transaction,
    wallet,
    pricing,
    serviceProviderMapping,
    service,
    category,
  }) {
    if (transaction.status === "SUCCESS") return;

    await WalletEngine.captureHold(tx, wallet, pricing.totalDebit);

    await LedgerEngine.create(tx, {
      walletId: transaction.walletId,
      transactionId: transaction.id,
      entryType: "DEBIT",
      referenceType: service.code,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: pricing.totalDebit,
      narration: `${service.code} pay`,
      createdBy: actor.id,
    });

    const commission = await PricingEngine.calculateCommission(tx, {
      userId: actor.id,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: pricing.txnAmount,
      category,
    });

    if (commission.providerTDS > 0n) {
      const admin = await tx.user.findFirst({
        where: { parentId: null },
        select: { id: true },
      });

      if (admin) {
        const adminWallet = await WalletEngine.getWallet({
          tx,
          userId: admin.id,
          walletType: "TDS",
        });

        await WalletEngine.credit(tx, adminWallet, commission.providerTDS);

        await LedgerEngine.create(tx, {
          walletId: adminWallet.id,
          transactionId: transaction.id,
          entryType: "CREDIT",
          referenceType: "PROVIDER_TDS",
          serviceProviderMappingId: serviceProviderMapping.id,
          amount: commission.providerTDS,
          narration: "Provider TDS",
          createdBy: actor.id,
        });
      }
    }

    await CommissionEngine.distribute(tx, {
      transactionId: transaction.id,
      userId: actor.id,
      serviceProviderMappingId: serviceProviderMapping.id,
      commission,
      createdBy: actor.id,
      service,
      category,
    });
  }

  static async failed({ tx, wallet, pricing }) {
    await WalletEngine.releaseHold(tx, wallet, pricing.totalDebit);
  }
}
