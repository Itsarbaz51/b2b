import { ApiError } from "../../utils/ApiError.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import WonderpayPayoutService from "./payout.wonderpay.service.js";
import ProviderResolver from "../../resolvers/Provider.resolver.js";
import { CommissionSettingService } from "../commission.service.js";

export default class PayoutService {
  static async checkRule(userId, mappingId) {
    await CommissionSettingService.checkUserPricingRule(userId, mappingId);
  }
  static async checkPermission(userId, mappingId) {
    await ServicePermissionResolver.validateByMappingId(userId, mappingId);
  }

  static async resolveProvider(mappingId) {
    const { provider: providerData, serviceProviderMapping } =
      await ProviderResolver.resolveByMappingId(mappingId);

    if (serviceProviderMapping.commissionStartLevel === "NONE") {
      throw ApiError.badRequest("Surcharge disabled for this service (NONE)");
    }

    return { providerData, serviceProviderMapping };
  }

  static async checkBalance(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkRule(actor.id, serviceProviderMappingId);

    await this.checkPermission(actor.id, serviceProviderMappingId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    switch (providerData.code) {
      case "WONDERPAY":
        return WonderpayPayoutService.checkBalance(
          serviceProviderMapping,
          providerData,
          actor,
          payload
        );

      default:
        throw ApiError.badRequest("Unsupported payout provider");
    }
  }

  static async transfer(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkRule(actor.id, serviceProviderMappingId);

    await this.checkPermission(actor.id, serviceProviderMappingId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    switch (providerData.code) {
      case "WONDERPAY":
        return WonderpayPayoutService.transfer(
          serviceProviderMapping,
          providerData,
          payload,
          actor
        );

      default:
        throw ApiError.badRequest("Unsupported payout provider");
    }
  }

  static async checkStatus(payload, actor) {
    const { serviceId, provider } = payload;

    await this.checkPermission(actor.id, serviceId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceId,
      provider
    );

    switch (providerData.code) {
      case "WONDERPAY":
        return WonderpayPayoutService.checkStatus(
          serviceProviderMapping,
          providerData,
          payload,
          actor
        );

      default:
        throw ApiError.badRequest("Unsupported payout provider");
    }
  }
}
