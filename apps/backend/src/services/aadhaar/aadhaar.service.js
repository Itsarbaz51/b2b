import Prisma from "../../db/db.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import TransactionService from "../transaction.service.js";
import { ApiError } from "../../utils/ApiError.js";
import ProviderResolver from "../../resolvers/provider.resolver.js";
import { CommissionSettingService } from "../commission.service.js";
import SettlementEngine from "../../engines/settlement.engine.js";

export default class AadhaarService {
  // STEP 1 — SEND OTP
  static async sendOtp(payload, actor) {
    const { aadhaarNumber, serviceId, idempotencyKey } = payload;
    const userId = actor.id;

    await TransactionService.checkDuplicate(idempotencyKey);

    await ServicePermissionResolver.validateHierarchyServiceAccess(
      userId,
      serviceId
    );

    const { provider, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId);

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

    return Prisma.$transaction(async (tx) => {
      const { transaction, wallet, pricing } = await SettlementEngine.execute({
        tx,
        actor,
        payload,
        serviceProviderMapping,
      });

      // const plugin = getAadhaarPlugin(provider.code, serviceProviderMapping.config);

      let providerResponse;

      try {
        providerResponse = {
          status: true,
          statusCode: 200,
          data: {
            ref_id: "71708161",
            status: "SUCCESS",
          },
        };

        // providerResponse = await plugin.sendOtp({ aadhaarNumber });

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
          serviceProviderMapping: { include: { provider: true } },
        },
      });

      if (!transaction) throw ApiError.notFound("Transaction not found");

      if (transaction.status !== "PENDING") {
        throw ApiError.badRequest("Invalid transaction state");
      }

      const { serviceProviderMapping } = transaction;

      // const plugin = getAadhaarPlugin(
      //   serviceProviderMapping.provider.code,
      //   serviceProviderMapping.config
      // );

      let providerResponse;

      try {
        providerResponse = {
          status: true,
          statusCode: 200,
          data: {
            ref_id: "71464459",
            status: "VALID",
            name: "Sohail Ahmed Maniyar",
          },
        };

        // providerResponse = await plugin.verifyOtp({ referenceId, otp });

        if (!providerResponse?.status) {
          throw ApiError.badRequest("OTP verification failed");
        }

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
          providerReference: referenceId,
          providerResponse,
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
