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
    // const plugin = this.getPlugin(provider, serviceProviderMapping);

    const clientOrderId = Helper.generateTxnId("PAYOUT");
    return Prisma.$transaction(async (tx) => {
      const { transaction, wallet, pricing, isDuplicate } =
        await SettlementEngine.execute({
          tx,
          actor,
          payload: { ...payload, txnId: clientOrderId },
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

      let response = {
        utr: null,
        amount: (Number(pricing.txnAmount) / 100).toString(),
        status: 5,
        addBene: false,
        message: "Request accepted successfully",
        orderId: "WOPAY17746499",
        statusCode: 1,
        clientOrderId,
        beneficiaryName: "Arbaz khan",
      };
      try {
        // const response = await plugin.payout({
        //   ...payload,
        //   amount: (Number(pricing.txnAmount) / 100).toString(),
        //   clientOrderId,
        // });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "PENDING",
          providerReference: response.orderId,
          requestPayload: { ...payload, clientOrderId },
          providerInitData: response,
        });

        return {
          transactionId: transaction.id,
          status: "PENDING",
          clientOrderId,
        };
      } catch (err) {
        await SettlementEngine.failed({
          tx,
          wallet,
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

  static async checkStatus(
    serviceProviderMapping,
    provider,
    service,
    payload,
    actor
  ) {
    // const plugin = this.getPlugin(provider, serviceProviderMapping);

    const { txnId } = payload;

    return Prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: {
          txnId,
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

      const wallet = await tx.wallet.findUnique({
        where: {
          id: transaction.walletId,
        },
      });

      if (!wallet) {
        throw ApiError.badRequest("Wallet not found");
      }

      // const response = await plugin.checkStatus({ txnId });
      const response = {
        statusCode: 1,
        message: "Completed",
        clientOrderId: "260314173248957F3F",
        orderId: "WOPAY17746499",
        beneficiaryName: "Arbaz khan",
        utr: "607317443437",
        status: 1,
        addBene: false,
        amount: "100.0000",
      };

      const status = response.status;

      // SUCCESS
      if (status === 1) {
        await SettlementEngine.success({
          tx,
          actor,
          transaction,
          wallet,
          pricing: transaction.pricing,
          serviceProviderMapping,
          provider,
          service,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerResponse: response,
          lastCheckedAt: new Date(),
        });
      } else if (status === 0) {
        await SettlementEngine.failed({
          tx,
          wallet,
          pricing: transaction.pricing,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerResponse: response,
          lastCheckedAt: new Date(),
        });
      } else {
        await TransactionService.update(tx, {
          transactionId: transaction.id,
          providerResponse: response,
          retryCount: { increment: 1 },
          lastCheckedAt: new Date(),
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
