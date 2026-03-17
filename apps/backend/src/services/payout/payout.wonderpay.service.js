import Prisma from "../../db/db.js";
import { getPayoutPlugin } from "../../plugin_registry/payout/pluginRegistry.js";
import TransactionService from "../transaction.service.js";
import SettlementEngine from "../../engines/settlement.engine.js";
import Helper from "../../utils/helper.js";
import { ApiError } from "../../utils/ApiError.js";

export default class WonderpayPayoutService {
  static getPlugin(provider, mapping) {
    return getPayoutPlugin(provider.code, mapping.config);
  }

  static async transfer(serviceProviderMapping, provider, payload, actor) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);

    return Prisma.$transaction(async (tx) => {
      const { transaction, wallet, pricing, isDuplicate } =
        await SettlementEngine.execute({
          tx,
          actor,
          payload,
          serviceProviderMapping,
        });

      if (isDuplicate) {
        return {
          transactionId: transaction.id,
          status: transaction.status,
          clientOrderId: transaction.providerReference,
        };
      }

      if (["SUCCESS", "FAILED"].includes(transaction.status)) {
        return {
          transactionId: transaction.id,
          status: transaction.status,
        };
      }

      const clientOrderId = Helper.generateTxnId("PAYOUT");

      try {
        const response = await plugin.payout({
          ...payload,
          amount: pricing.totalDebit,
          clientOrderId,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "PENDING",
          providerReference: clientOrderId,
          providerResponse: response,
          requestPayload: { ...payload, clientOrderId },
        });

        return {
          transactionId: transaction.id,
          status: "PENDING",
          clientOrderId,
        };
      } catch (err) {
        await SettlementEngine.failed({
          tx,
          walletId: wallet.id,
          pricing,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerResponse: err.message,
        });

        throw err;
      }
    });
  }

  static async checkBalance(serviceProviderMapping, provider) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);

    try {
      const balance = await plugin.checkBalance();

      return {
        provider: provider.code,
        balance,
      };
    } catch (err) {
      throw err;
    }
  }

  static async checkStatus(serviceProviderMapping, provider, payload, actor) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);

    const { clientOrderId } = payload;

    return Prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: {
          providerReference: clientOrderId,
        },
      });

      if (!transaction) {
        throw ApiError.notFound("Transaction not found");
      }

      if (["SUCCESS", "FAILED"].includes(transaction.status)) {
        return {
          status: transaction.status,
          message: "Already processed",
        };
      }

      const response = await plugin.checkStatus({ clientOrderId });

      const status = response.status;

      // SUCCESS
      if (status === 1) {
        await SettlementEngine.success({
          tx,
          actor,
          transaction,
          pricing: transaction.pricing,
          serviceProviderMapping,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerResponse: response,
        });
      } else if (status === 0) {
        await SettlementEngine.failed({
          tx,
          walletId: transaction.walletId,
          pricing: transaction.pricing,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerResponse: response,
        });
      } else {
        await TransactionService.update(tx, {
          transactionId: transaction.id,
          providerResponse: response,
        });
      }

      return {
        transactionId: transaction.id,
        status: status || "PENDING",
        providerResponse: response,
      };
    });
  }
}
