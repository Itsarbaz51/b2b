import Prisma from "../../db/db.js";
import { getFundRequestPlugin } from "../../plugin_registry/fundRequest/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import SurchargeEngine from "../../engines/surcharge.engine.js";

export default class RazorpayFundRequestService {
  static async create(payload, actor, serviceProviderMapping) {
    const plugin = getFundRequestPlugin(
      "RAZORPAY",
      serviceProviderMapping.config
    );

    const surcharge = await SurchargeEngine.calculate(null, {
      userId: actor.id,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount: payload.amount,
    });

    const finalAmount = payload.amount + surcharge;

    const providerResponse = await plugin.createRequest({
      amount: finalAmount,
      userId: actor.id,
    });

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: actor.id,
        walletType: "PRIMARY",
      });

      const { transaction } = await TransactionService.create(tx, {
        userId: actor.id,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: finalAmount,
        requestPayload: payload,
      });

      return {
        transactionId: transaction.id,
        orderId: providerResponse.orderId,
        amount: finalAmount,
      };
    });
  }
}
