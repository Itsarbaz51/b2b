import Prisma from "../../db/db.js";
import { getPayoutPlugin } from "../../plugin_registry/payout/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import { ApiError } from "../../utils/ApiError.js";
import { CommissionSettingService } from "../commission.service.js";

export default class WonderpayPayoutService {
  static getPlugin(provider, mapping) {
    return getPayoutPlugin(provider.code, mapping.config);
  }

  static async checkBalance(serviceProviderMapping, provider, actor, payload) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);
    return plugin.checkBalance();
  }

  static async verifyAccount(serviceProviderMapping, provider, payload, actor) {
    const { number, accountNo, ifscCode, clientOrderId } = payload;
    const plugin = this.getPlugin(provider, serviceProviderMapping);

    await CommissionSettingService.checkUserPricingRule(
      userId,
      serviceProviderMapping.id
    );

    return plugin.verifyAccount({
      number,
      accountNo,
      ifscCode,
      clientOrderId,
    });
  }

  static async transfer(serviceProviderMapping, provider, payload, actor) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);
    const {
      number,
      amount,
      transferMode,
      accountNo,
      ifscCode,
      beneficiaryName,
      clientOrderId,
    } = payload;

    const amountBigint = BigInt(amount);

    await CommissionSettingService.checkUserPricingRule(
      userId,
      serviceProviderMapping.id
    );

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: actor.id,
        walletType: "PRIMARY",
      });

      if (wallet.balance < amountBigint) {
        throw ApiError.badRequest("Insufficient wallet balance");
      }

      await WalletEngine.debit(tx, wallet, amountBigint);

      const { transaction } = await TransactionService.create(tx, {
        userId: actor.id,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amountBigint,
        requestPayload: payload,
      });

      const providerResponse = await plugin.payout({
        number,
        amountBigint,
        transferMode,
        accountNo,
        ifscCode,
        beneficiaryName,
        clientOrderId,
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
