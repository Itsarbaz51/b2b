import Prisma from "../../db/db.js";
import WalletEngine from "../../engines/wallet.engine.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import TransactionService from "../transaction.service.js";
import ProviderResolver from "../../resolvers/Provider.resolver.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import SurchargeEngine from "../../engines/surcharge.engine.js";
import { getPanPlugin } from "../../plugin_registry/pan/pluginRegistry.js";
import { CommissionSettingService } from "../commission.service.js";

export default class PanService {
  static async verifyPan(payload, actor) {
    const { panNumber, serviceId, idempotencyKey } = payload;
    const userId = actor.id;

    await TransactionService.checkDuplicate(idempotencyKey);

    await ServicePermissionResolver.validateHierarchyServiceAccess(
      userId,
      serviceId
    );

    const { provider, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId);

    await CommissionSettingService.checkUserPricingRule(
      userId,
      serviceProviderMapping.id
    );

    const plugin = getPanPlugin(provider.code, serviceProviderMapping.config);

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId,
        walletType: "PRIMARY",
      });

      const providerCost = BigInt(serviceProviderMapping.providerCost);

      const surcharge = await SurchargeEngine.calculate(tx, {
        userId,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: providerCost,
      });

      const finalAmount = providerCost + surcharge;

      await WalletEngine.hold(tx, wallet, finalAmount);

      const pricing = {
        providerCost,
        surcharge,
        total: finalAmount,
      };

      const { transaction } = await TransactionService.create(tx, {
        userId,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: finalAmount,
        pricing,
        idempotencyKey,
        requestPayload: payload,
      });

      let providerResponse = {
        status: true,
        statusCode: 200,
        data: {
          pan: "HFIPM21790",
          type: "Individual",
          registered_name: "SOHAIL AHMED MANIYAR",
          valid: true,
          message: "PAN verified successfully",
          aadhaar_seeding_status: "Y",
          name_pan_card: "SOHAIL AHMED MANIYAR",
          pan_status: "VALID",
          aadhaar_seeding_status_desc: "Aadhaar is linked to PAN",
        },
      };
      const updatedWallet = await WalletEngine.getWallet({
        tx,
        userId,
        walletType: "PRIMARY",
      });

      try {
        // const providerResponse = await plugin.verifyPan({ panNumber });

        await WalletEngine.captureHold(tx, updatedWallet, finalAmount);

        await LedgerEngine.create(tx, {
          walletId: updatedWallet.id,
          transactionId: transaction.id,
          entryType: "DEBIT",
          referenceType: "TRANSACTION",
          serviceProviderMappingId: serviceProviderMapping.id,
          amount: finalAmount,
          narration: "PAN Verification Charge",
          createdBy: actor.id,
        });

        await SurchargeEngine.distribute(tx, {
          transactionId: transaction.id,
          userId,
          serviceProviderMappingId: serviceProviderMapping.id,
          createdBy: actor.id,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerResponse: {
            ...providerResponse,
            name: providerResponse?.data?.name_pan_card || null,
          },
        });

        return providerResponse;
      } catch (error) {
        await WalletEngine.releaseHold(tx, updatedWallet, finalAmount);

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
