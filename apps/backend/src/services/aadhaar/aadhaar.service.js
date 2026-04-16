import Prisma from "../../db/db.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import TransactionService from "../transaction.service.js";
import { ApiError } from "../../utils/ApiError.js";
import ProviderResolver from "../../resolvers/provider.resolver.js";
import { CommissionSettingService } from "../commission.service.js";
import SettlementEngine from "../../engines/settlement.engine.js";
import Helper from "../../utils/helper.js";
import WalletEngine from "../../engines/wallet.engine.js";
import { CryptoService } from "../../utils/cryptoService.js";
import { getAadhaarPlugin } from "../../plugin_registry/aadhaar/pluginRegistry.js";

export default class AadhaarService {
  // STEP 1 — SEND OTP
  static async sendOtp(payload, actor) {
    const { aadhaarNumber, serviceProviderMappingId, idempotencyKey } = payload;
    const userId = actor.id;

    await TransactionService.checkDuplicate(idempotencyKey);

    await ServicePermissionResolver.validateByMappingId(
      userId,
      serviceProviderMappingId
    );

    const { provider, serviceProviderMapping } =
      await ProviderResolver.resolveByMappingId(serviceProviderMappingId);

    if (serviceProviderMapping.commissionStartLevel === "NONE") {
      throw ApiError.badRequest("Surcharge disabled for this service");
    }

    if (serviceProviderMapping.mode !== "SURCHARGE") {
      throw ApiError.badRequest("AADHAAR service only supports SURCHARGE mode");
    }

    await CommissionSettingService.checkUserPricingRule(
      userId,
      serviceProviderMapping.id
    );
    const txnId = Helper.generateTxnId("AAdHAAR");

    return Prisma.$transaction(async (tx) => {
      const { transaction, wallet, pricing } = await SettlementEngine.execute({
        tx,
        actor,
        payload: { ...payload, txnId },
        serviceProviderMapping,
      });
      let parsedConfig = {};

      try {
        parsedConfig =
          typeof serviceProviderMapping.config === "string"
            ? JSON.parse(CryptoService.decrypt(serviceProviderMapping.config))
            : serviceProviderMapping.config;
      } catch (err) {
        throw ApiError.internal("Invalid provider config", err?.message);
      }

      const plugin = getAadhaarPlugin(provider.code, parsedConfig);

      let providerResponse;

      try {
        providerResponse = await plugin.sendOtp({ aadhaarNumber });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "PENDING",
          providerReference: providerResponse?.data?.ref_id,
          providerResponse,
        });

        return {
          transactionId: transaction.id,
          referenceId: providerResponse?.data?.ref_id,
        };
      } catch (error) {
        await SettlementEngine.failed({ tx, actor, wallet, pricing });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerResponse: error?.message,
        });

        throw error;
      }
    });
  }

  //  STEP 2 — VERIFY OTP
  static async verifyOtp(payload, actor) {
    const { transactionId, referenceId, otp } = payload;

    return Prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          serviceProviderMapping: {
            include: { provider: true, service: true },
          },
        },
      });

      if (!transaction) throw ApiError.notFound("Transaction not found");

      if (transaction.status !== "PENDING") {
        throw ApiError.badRequest("Invalid transaction state");
      }

      const { service, provider, serviceProviderMapping } = transaction;
      let parsedConfig = {};

      try {
        parsedConfig =
          typeof serviceProviderMapping.config === "string"
            ? JSON.parse(CryptoService.decrypt(serviceProviderMapping.config))
            : serviceProviderMapping.config;
      } catch (err) {
        throw ApiError.internal("Invalid provider config", err?.message);
      }
      const plugin = getAadhaarPlugin(
        serviceProviderMapping.provider.code,
        parsedConfig
      );

      let providerResponse;

      try {
        providerResponse = await plugin.verifyOtp({ referenceId, otp });

        if (!providerResponse?.status) {
          throw ApiError.badRequest("OTP verification failed");
        }

        const wallet = await WalletEngine.getWallet({
          tx,
          userId: actor.id,
          walletType: "PRIMARY",
        });

        await SettlementEngine.success({
          tx,
          actor,
          transaction,
          wallet,
          pricing: transaction.pricing,
          serviceProviderMapping,
          service,
          provider,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerReference: referenceId,
          providerResponse: {
            ...providerResponse,
            name: providerResponse?.data?.name,
          },
        });

        return providerResponse.data;
      } catch (error) {
        await SettlementEngine.failed({
          tx,
          actor,
          wallet: null,
          pricing: transaction.pricing,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerReference: referenceId,
          providerResponse: error?.message,
        });

        throw error;
      }
    });
  }
}
