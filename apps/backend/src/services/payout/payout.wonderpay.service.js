import Prisma from "../../db/db.js";
import { getPayoutPlugin } from "../../plugin_registry/payout/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import { ApiError } from "../../utils/ApiError.js";

export default class WonderpayPayoutService {
  static getPlugin(provider, mapping) {
    return getPayoutPlugin(provider.code, mapping.config);
  }

  static async checkBalance(serviceProviderMapping, provider) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);
    return plugin.checkBalance();
  }

  static async verifyAccount(payload, serviceProviderMapping, provider) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);

    return plugin.verifyAccount({
      number: payload.mobile,
      accountNo: payload.accountNo,
      ifscCode: payload.ifscCode,
      clientOrderId: payload.clientOrderId,
    });
  }

  static async transfer(payload, actor, serviceProviderMapping, provider) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);
    const amount = BigInt(payload.amount);

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: actor.id,
        walletType: "PRIMARY",
      });

      if (wallet.balance < amount) {
        throw ApiError.badRequest("Insufficient wallet balance");
      }

      await WalletEngine.debit(tx, wallet, amount);

      const { transaction } = await TransactionService.create(tx, {
        userId: actor.id,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount,
        requestPayload: payload,
      });

      const providerResponse = await plugin.payout({
        number: payload.mobile,
        amount: Number(amount),
        transferMode: payload.transferMode,
        accountNo: payload.accountNo,
        ifscCode: payload.ifscCode,
        beneficiaryName: payload.beneficiaryName,
        clientOrderId: transaction.id,
      });

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId: transaction.id,
        entryType: "DEBIT",
        referenceType: "PAYOUT",
        serviceProviderMappingId: serviceProviderMapping.id,
        amount,
        narration: "Payout initiated via Wonderpay",
        createdBy: actor.id,
      });

      await TransactionService.update(tx, {
        transactionId: transaction.id,
        status: "PENDING",
        providerReference: providerResponse.orderId,
        providerResponse,
      });

      return {
        transactionId: transaction.id,
        status: "PENDING",
        providerReference: providerResponse.orderId,
      };
    });
  }

  static async checkStatus(payload, serviceProviderMapping, provider) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);

    return plugin.checkStatus({
      clientOrderId: payload.clientOrderId,
    });
  }
}
