import Prisma from "../../db/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { getFundRequestPlugin } from "../../plugin_registry/fundRequest/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import ApiEntityService from "../apiEntity.service.js";
import S3Service from "../../utils/S3Service.js";
import Helper from "../../utils/Helper.js";

export default class BankFundRequestService {
  static async create(payload, actor, serviceProviderMapping, provider) {
    try {
      await TransactionService.checkDuplicate(payload.idempotencyKey);

      if (provider.code === "BANK_TRANSFER") {
        if (!payload.rrn) {
          throw ApiError.badRequest("RRN required");
        }

        if (!payload?.paymentImage) {
          throw ApiError.badRequest("Payment screenshot required");
        }
      }

      if (serviceProviderMapping.mode !== "NONE") {
        throw ApiError.badRequest(
          "This Bank Transfer service only supports NONE mode. Surcharge and hierarchy commission must be disabled."
        );
      }

      const plugin = getFundRequestPlugin(
        provider.code,
        serviceProviderMapping.config
      );

      const providerResponse = await plugin.createRequest(payload);

      let paymentImageUrl = null;

      if (payload?.paymentImage) {
        paymentImageUrl = await S3Service.upload(
          payload.paymentImage.path,
          "bank-transfer-fund-request"
        );
      }

      const result = await Prisma.$transaction(async (tx) => {
        const wallet = await WalletEngine.getWallet({
          tx,
          userId: actor.id,
          walletType: "PRIMARY",
        });

        const pricing = {
          amount: payload.amount,
          providerCost: serviceProviderMapping.providerCost,
        };

        const { transaction, apiEntity } = await TransactionService.create(tx, {
          userId: actor.id,
          walletId: wallet.id,
          serviceProviderMappingId: serviceProviderMapping.id,
          amount: providerResponse.amount,
          requestPayload: payload,
          pricing,
          idempotencyKey: payload.idempotencyKey,
        });

        await ApiEntityService.updateProviderInit(tx, {
          apiEntityId: apiEntity.id,
          providerResponse: {
            ...providerResponse,
            paymentImageUrl,
            rrn: payload.rrn,
          },
        });

        return {
          transactionId: transaction.id,
          status: "PENDING",
          paymentImageUrl,
        };
      });

      return result;
    } catch (error) {
      throw error;
    } finally {
      if (payload?.paymentImage?.path) {
        await Helper.deleteOldImage(payload.paymentImage.path);
      }
    }
  }
}
