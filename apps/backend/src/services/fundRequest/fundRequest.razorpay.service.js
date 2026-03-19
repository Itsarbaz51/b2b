import Prisma from "../../db/db.js";
import { getFundRequestPlugin } from "../../plugin_registry/fundRequest/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import SurchargeEngine from "../../engines/surcharge.engine.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import PricingEngine from "../../engines/pricing.engine.js";
import { ApiError } from "../../utils/ApiError.js";

export default class RazorpayFundRequestService {
  static async create(payload, actor, serviceProviderMapping, provider) {
    await TransactionService.checkDuplicate(payload.idempotencyKey);

    const plugin = getFundRequestPlugin(
      provider.code,
      serviceProviderMapping.config
    );

    const amount = BigInt(payload.amount);

    const pricing = await PricingEngine.calculateSurcharge(Prisma, {
      userId: actor.id,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount,
    });

    const finalAmount = pricing.totalDebit;

    const providerResponse = await plugin.createRequest({
      amount: Number(finalAmount),
      userId: actor.id,
      notes: {},
    });

    return {
      orderId: providerResponse.orderId,
      amount: Number(finalAmount) / 100,
      key: serviceProviderMapping.config.keyId,
      notes: {
        actualAmount: amount.toString(),
      },
    };
  }

  static async verifyRequest(
    payload,
    actor,
    providerData,
    serviceProviderMapping
  ) {
    const plugin = getFundRequestPlugin(
      providerData.code,
      serviceProviderMapping.config
    );

    const verifyResponse = await plugin.verify({
      orderId: payload.razorpay_order_id,
      paymentId: payload.razorpay_payment_id,
      signature: payload.razorpay_signature,
    });

    const paymentStatus = verifyResponse.status;

    const existing = await Prisma.transaction.findFirst({
      where: {
        providerReference: verifyResponse.paymentId,
      },
    });

    if (existing && existing.status === "SUCCESS") {
      return { status: "SUCCESS" };
    }

    const actualAmount = BigInt(verifyResponse.raw.notes?.actualAmount || 0);

    if (actualAmount <= 0n) {
      throw ApiError.badRequest("Invalid amount from provider");
    }

    if (verifyResponse.orderId !== payload.razorpay_order_id) {
      throw ApiError.badRequest("Order mismatch");
    }

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: actor.id,
        walletType: "PRIMARY",
      });

      const pricing = await PricingEngine.calculateSurcharge(tx, {
        userId: actor.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: actualAmount,
      });

      if (pricing.totalDebit !== totalAmount) {
        throw ApiError.badRequest("Amount mismatch");
      }

      const { transaction } = await TransactionService.create(tx, {
        userId: actor.id,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: actualAmount,
        providerReference: verifyResponse.paymentId,
        pricing,
        idempotencyKey: verifyResponse.paymentId,
        requestPayload: payload,
      });

      if (paymentStatus === "failed") {
        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerReference: verifyResponse.paymentId,
          providerResponse: verifyResponse,
        });

        return { status: "FAILED" };
      }

      if (paymentStatus === "authorized") {
        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "PENDING",
          providerReference: verifyResponse.paymentId,
          providerResponse: verifyResponse,
        });

        return {
          status: "PENDING",
          message: "Payment authorized but not captured",
        };
      }

      if (paymentStatus === "captured") {
        await WalletEngine.credit(tx, wallet, actualAmount);

        await LedgerEngine.create(tx, {
          walletId: wallet.id,
          transactionId: transaction.id,
          entryType: "CREDIT",
          referenceType: "FUND_REQUEST",
          serviceProviderMappingId: serviceProviderMapping.id,
          amount: actualAmount,
          narration: "Fund added via Razorpay",
          createdBy: actor.id,
        });

        await SurchargeEngine.distribute(tx, {
          transactionId: transaction.id,
          userId: actor.id,
          serviceProviderMappingId: serviceProviderMapping.id,
          createdBy: actor.id,
          pricing,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerReference: verifyResponse.paymentId,
          providerResponse: verifyResponse,
        });
      }
    });
  }
}
