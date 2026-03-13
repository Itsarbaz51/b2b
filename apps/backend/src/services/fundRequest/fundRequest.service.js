import ProviderResolver from "../../resolvers/Provider.resolver.js";
import BankFundRequestService from "./fundRequest.bank.service.js";
import RazorpayFundRequestService from "./fundRequest.razorpay.service.js";
import { ApiError } from "../../utils/ApiError.js";
import Prisma from "../../db/db.js";

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

  static async verify(payload, actor) {
    const transaction = await Prisma.transaction.findUnique({
      where: { id: payload.transactionId },
      include: {
        serviceProviderMapping: {
          include: { provider: true },
        },
      },
    });

    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }

    const providerCode = transaction.serviceProviderMapping.provider.code;

    switch (providerCode) {
      case "BANK_TRANSFER":
        return BankFundRequestService.verifyRequest(payload, actor);

      case "RAZORPAY":
        return RazorpayFundRequestService.verifyRequest(payload, actor);

      default:
        throw ApiError.badRequest("Unsupported provider");
    }
  }
}
