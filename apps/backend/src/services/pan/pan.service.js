import Prisma from "../../db/db.js";
import ProviderResolver from "../../resolvers/provider.resolver.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import TransactionService from "../transaction.service.js";
import SettlementEngine from "../../engines/settlement.engine.js";
import { CommissionSettingService } from "../commission.service.js";
import { getPanPlugin } from "../../plugin_registry/pan/pluginRegistry.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";

export default class PanService {
  static async verifyPan(payload, actor) {
    const { panNumber, serviceProviderMappingId, idempotencyKey } = payload;
    const userId = actor.id;

    await TransactionService.checkDuplicate(idempotencyKey);

    await ServicePermissionResolver.validateByMappingId(
      userId,
      serviceProviderMappingId
    );

    const { service, provider, serviceProviderMapping } =
      await ProviderResolver.resolveByMappingId(serviceProviderMappingId);

    await CommissionSettingService.checkUserPricingRule(
      userId,
      serviceProviderMapping.id
    );

    if (serviceProviderMapping.commissionStartLevel === "NONE") {
      throw ApiError.badRequest("Surcharge disabled for this service");
    }

    if (serviceProviderMapping.mode !== "SURCHARGE") {
      throw ApiError.badRequest(
        "PAN service configured as SURCHARGE mode only"
      );
    }

    await CommissionSettingService.checkUserPricingRule(
      userId,
      serviceProviderMapping.id
    );
    const txnId = Helper.generateTxnId("PAN");
    return Prisma.$transaction(async (tx) => {
      // START SETTLEMENT
      const { transaction, wallet, pricing } = await SettlementEngine.execute({
        tx,
        actor,
        payload: { ...payload, txnId },
        serviceProviderMapping,
      });

      // CALL PROVIDER
      const plugin = getPanPlugin(provider.code, serviceProviderMapping.config);

      const providerResponse = await plugin.verifyPan({ panNumber });

      try {
        // SUCCESS SETTLEMENT

        await SettlementEngine.success({
          tx,
          actor,
          transaction,
          wallet,
          pricing,
          serviceProviderMapping,
          service,
          provider,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerResponse: {
            ...providerResponse,
            name: providerResponse?.data?.registered_name,
          },
        });

        return providerResponse;
      } catch (error) {
        // FAILED SETTLEMENT
        await SettlementEngine.failed({
          tx,
          actor,
          wallet,
          pricing,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerResponse: error?.message,
        });

        throw error;
      }
    });
  }
}
