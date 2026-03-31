import Prisma from "../../db/db.js";
import { getBankVerificationPlugin } from "../../plugin_registry/bankVerification/pluginRegistry.js";
import TransactionService from "../transaction.service.js";
import SettlementEngine from "../../engines/settlement.engine.js";
import Helper from "../../utils/helper.js";
import { ApiError } from "../../utils/ApiError.js";

export default class AUBankVerificationService {
  static getPlugin(provider, mapping) {
    return getBankVerificationPlugin(provider.code, mapping.config);
  }

  static async verifyAccount(
    serviceProviderMapping,
    provider,
    service,
    payload,
    actor
  ) {
    const plugin = this.getPlugin(provider, serviceProviderMapping);

    const txnId = Helper.generateTxnId("BANK_VERIFY");

    return Prisma.$transaction(async (tx) => {
      const { transaction, wallet, pricing, isDuplicate } =
        await SettlementEngine.execute({
          tx,
          actor,
          payload: { ...payload, txnId },
          serviceProviderMapping,
        });

      // 🔁 DUPLICATE
      if (isDuplicate) {
        return {
          transactionId: transaction.id,
          status: transaction.status,
        };
      }
      console.log(isDuplicate);

      // 🔁 ALREADY PROCESSED
      if (["SUCCESS", "FAILED"].includes(transaction.status)) {
        return {
          transactionId: transaction.id,
          status: transaction.status,
        };
      }

      try {
        console.log("init api");

        const response = await plugin.verifyAccount({
          ...payload,
          requestId: txnId,
        });
        console.log(response);

        if (!response.status) {
          throw new Error(response.message || "Verification failed");
        }

        await SettlementEngine.success({
          tx,
          actor,
          transaction,
          wallet,
          pricing,
          serviceProviderMapping,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerResponse: response,
        });

        return {
          transactionId: transaction.id,
          status: "SUCCESS",
          data: response,
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

        throw ApiError.internal(err.message || "Verification failed");
      }
    });
  }
}
