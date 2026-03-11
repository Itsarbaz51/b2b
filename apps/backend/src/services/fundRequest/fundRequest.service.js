import ProviderResolver from "../../resolvers/Provider.resolver.js";
import BankFundRequestService from "./fundRequest.bank.service.js";
import RazorpayFundRequestService from "./fundRequest.razorpay.service.js";
import { ApiError } from "../../utils/ApiError.js";

export default class FundRequestService {
  static async create(payload, actor) {
    const { serviceId, provider } = payload;

    const { provider: providerData, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId, provider);

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
}
