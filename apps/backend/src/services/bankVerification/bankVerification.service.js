import { ApiError } from "../../utils/ApiError.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import ProviderResolver from "../../resolvers/provider.resolver.js";
import { CommissionSettingService } from "../commission.service.js";
import AUBankVerificationService from "./bankVerification.au.service.js";

export default class BankVerificationService {
  static async checkRule(userId, mappingId) {
    await CommissionSettingService.checkUserPricingRule(userId, mappingId);
  }

  static async checkPermission(userId, mappingId) {
    await ServicePermissionResolver.validateHierarchyServiceAccess(
      userId,
      mappingId
    );
  }

  static async resolveProvider(mappingId) {
    const { provider, serviceProviderMapping } =
      await ProviderResolver.resolveByMappingId(mappingId);

    if (serviceProviderMapping.commissionStartLevel === "NONE") {
      throw ApiError.badRequest("Surcharge disabled for this service");
    }

    if (serviceProviderMapping.mode !== "SURCHARGE") {
      throw ApiError.badRequest(
        "Bank Verification supports SURCHARGE mode only"
      );
    }

    return { provider, serviceProviderMapping };
  }

  static async verifyAccount(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkRule(actor.id, serviceProviderMappingId);
    await this.checkPermission(actor.id, serviceProviderMappingId);

    const { provider, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    switch (provider.code) {
      case "AU":
        return AUBankVerificationService.verifyAccount(
          serviceProviderMapping,
          provider,
          payload,
          actor
        );

      default:
        throw ApiError.badRequest("Unsupported bank verification provider");
    }
  }
}
