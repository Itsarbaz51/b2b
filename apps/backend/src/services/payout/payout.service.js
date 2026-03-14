import ProviderResolver from "../../resolvers/Provider.resolver.js";
import WonderpayPayoutService from "./payout.wonderpay.service.js";
import { ApiError } from "../../utils/ApiError.js";

export default class PayoutService {
  static async checkBalance(payload) {
    const { serviceId, provider } = payload;

    const { provider: providerData, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId, provider);

    switch (providerData.code) {
      case "WONDERPAY":
        return WonderpayPayoutService.checkBalance(
          serviceProviderMapping,
          providerData
        );

      default:
        throw ApiError.badRequest("Unsupported payout provider");
    }
  }

  static async verifyAccount(payload) {
    const { serviceId, provider } = payload;

    const { provider: providerData, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId, provider);

    switch (providerData.code) {
      case "WONDERPAY":
        return WonderpayPayoutService.verifyAccount(
          payload,
          serviceProviderMapping,
          providerData
        );

      default:
        throw ApiError.badRequest("Unsupported payout provider");
    }
  }

  static async transfer(payload, actor) {
    const { serviceId, provider } = payload;

    const { provider: providerData, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId, provider);

    switch (providerData.code) {
      case "WONDERPAY":
        return WonderpayPayoutService.transfer(
          payload,
          actor,
          serviceProviderMapping,
          providerData
        );

      default:
        throw ApiError.badRequest("Unsupported payout provider");
    }
  }

  static async checkStatus(payload) {
    const { serviceId, provider } = payload;

    const { provider: providerData, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId, provider);

    switch (providerData.code) {
      case "WONDERPAY":
        return WonderpayPayoutService.checkStatus(
          payload,
          serviceProviderMapping,
          providerData
        );

      default:
        throw ApiError.badRequest("Unsupported payout provider");
    }
  }
}
