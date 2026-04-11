import ProviderResolver from "../../resolvers/provider.resolver.js";
import { ApiError } from "../../utils/ApiError.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import { CommissionSettingService } from "../commission.service.js";

import BulkpeBbpsService from "./bbps.bulkpe.service.js";

export default class BbpsService {
  // COMMON
  static async checkRule(userId, mappingId) {
    await CommissionSettingService.checkUserPricingRule(userId, mappingId);
  }

  static async checkPermission(userId, mappingId) {
    await ServicePermissionResolver.validateByMappingId(userId, mappingId);
  }

  static async resolveProvider(mappingId) {
    const { provider: providerData, serviceProviderMapping } =
      await ProviderResolver.resolveByMappingId(mappingId);

    if (!providerData) {
      throw ApiError.badRequest("Provider not found");
    }

    return { providerData, serviceProviderMapping };
  }

  // CORE ROUTER (IMPORTANT)
  static getService(providerCode) {
    switch (providerCode) {
      case "BULKPE":
        return BulkpeBbpsService;

      default:
        throw ApiError.badRequest("Unsupported BBPS provider");
    }
  }

  // ---------------- LIST CATEGORIES ----------------
  static async listCategories(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkPermission(actor.id, serviceProviderMappingId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    const Service = this.getService(providerData.code);

    return Service.listCategories(serviceProviderMapping);
  }

  // ---------------- SELECT BILLER ----------------
  static async selectBiller(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkPermission(actor.id, serviceProviderMappingId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    const Service = this.getService(providerData.code);

    return Service.selectBiller(payload, serviceProviderMapping);
  }

  // ---------------- FETCH BILL ----------------
  static async fetchBill(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkPermission(actor.id, serviceProviderMappingId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    const Service = this.getService(providerData.code);

    return Service.fetchBill(payload, serviceProviderMapping);
  }

  // ---------------- PAY BILL ----------------
  static async payBill(payload, actor) {
    const { serviceProviderMappingId } = payload;

    await this.checkPermission(actor.id, serviceProviderMappingId);
    await this.checkRule(actor.id, serviceProviderMappingId);

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    const Service = this.getService(providerData.code);

    return Service.payBill(payload, actor, serviceProviderMapping);
  }

  // ---------------- STATUS ----------------
  static async checkStatus(payload, actor, isCron = false) {
    const { serviceProviderMappingId } = payload;

    if (!isCron) {
      await this.checkPermission(actor.id, serviceProviderMappingId);
    }

    const { providerData, serviceProviderMapping } = await this.resolveProvider(
      serviceProviderMappingId
    );

    const Service = this.getService(providerData.code);

    return Service.checkStatus(payload, serviceProviderMapping);
  }
}
