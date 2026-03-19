// services/bankVerification/bankVerification.service.js

import Prisma from "../../db/db.js";
import ProviderResolver from "../../resolvers/Provider.resolver.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import TransactionService from "../transaction.service.js";
import SettlementEngine from "../../engines/settlement.engine.js";
import { CommissionSettingService } from "../commission.service.js";
import { getBankVerificationPlugin } from "../../plugin_registry/bankVerification/pluginRegistry.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";

export default class BankVerificationService {
  static async verifyAccount(payload, actor) {
    const { accountNo, ifsc, serviceId, idempotencyKey } = payload;
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
      throw ApiError.badRequest(
        "Bank Verification service configured as SURCHARGE mode only"
      );
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

      let providerResponse;

      try {
        const plugin = getBankVerificationPlugin(
          provider.code,
          serviceProviderMapping.config
        );

        providerResponse = await plugin.verifyAccount({
          accountNo,
          ifsc,
          requestId: Helper.generateTxnId("BANK_VERIFICATION"),
        });

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
          providerResponse,
        });

        return providerResponse;
      } catch (error) {
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
