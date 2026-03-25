import ProviderResolver from "../../resolvers/provider.resolver.js";
import BankFundRequestService from "./fundRequest.bank.service.js";
import RazorpayFundRequestService from "./fundRequest.razorpay.service.js";
import { ApiError } from "../../utils/ApiError.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import { CommissionSettingService } from "../commission.service.js";

export default class FundRequestService {
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

  // ---------------- CREATE ----------------
  static async create(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkRule(actor.id, serviceProviderMappingId);

    await this.checkPermission(actor.id, serviceProviderMappingId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    switch (providerData.code) {
      case "BANK_TRANSFER":
        return BankFundRequestService.create(
          payload,
          actor,
          serviceProviderMapping,
          providerData
        );

      case "RAZORPAY":
        return RazorpayFundRequestService.create(
          payload,
          actor,
          serviceProviderMapping,
          providerData
        );

      default:
        throw ApiError.badRequest("Unsupported provider");
    }
  }

  // ---------------- VERIFY ----------------
  static async verify(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkPermission(actor.id, serviceProviderMappingId);

    await this.checkRule(actor.id, serviceProviderMappingId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    switch (providerData.code) {
      case "BANK_TRANSFER":
        return BankFundRequestService.verifyRequest(payload, actor);

      case "RAZORPAY":
        return RazorpayFundRequestService.verifyRequest(
          payload,
          actor,
          providerData,
          serviceProviderMapping
        );

      default:
        throw ApiError.badRequest("Unsupported provider");
    }
  }
}
