import Prisma from "../../db/db.js";
import { getPayoutPlugin } from "../../plugin_registry/payout/pluginRegistry.js";
import TransactionService from "../transaction.service.js";
import SettlementEngine from "../../engines/settlement.engine.js";
import Helper from "../../utils/helper.js";
import { ApiError } from "../../utils/ApiError.js";
import BeneficiaryService from "../beneficiary.service.js";
import { CryptoService } from "../../utils/cryptoService.js";

export default class WonderpayPayoutService {
  static getPlugin(provider, mapping) {
    let parsedConfig = {};

    try {
      parsedConfig =
        typeof mapping.config === "string"
          ? JSON.parse(CryptoService.decrypt(mapping.config))
          : mapping.config;
    } catch (err) {
      throw ApiError.internal("Invalid provider config", err?.message);
    }
    return getPayoutPlugin(provider.code, parsedConfig);
  }

  static async transfer(serviceProviderMapping, provider, payload, actor) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);

    const clientOrderId = Helper.generateTxnId("PAYOUT");
    return Prisma.$transaction(async (tx) => {
      let beneficiary;

      if (payload.beneficiaryId) {
        beneficiary = await BeneficiaryService.findById({
          id: payload.beneficiaryId,
          userId: actor.id,
        });
      } else {
        beneficiary = await BeneficiaryService.getOrCreate(tx, {
          userId: actor.id,
          payload,
        });
      }

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

      let response;
      try {
        response = await plugin.payout({
          ...payload,
          amount: (Number(pricing.txnAmount) / 100).toString(),
          clientOrderId,
        });

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
    const plugin = this.getPlugin(provider, serviceProviderMapping);

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

      const response = await plugin.checkStatus({ txnId });

      const status = response.status;

      // SUCCESS
      if (status === 1) {
        await SettlementEngine.success({
          tx,
          actor,
          transaction,
          referenceType: "PAYOUT",
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
