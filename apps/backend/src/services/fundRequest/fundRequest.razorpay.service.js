import Prisma from "../../db/db.js";
import { getFundRequestPlugin } from "../../plugin_registry/fundRequest/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import SurchargeEngine from "../../engines/surcharge.engine.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import PricingEngine from "../../engines/pricing.engine.js";
import { ApiError } from "../../utils/ApiError.js";
import ApiEntityService from "../apiEntity.service.js";

export default class RazorpayFundRequestService {
  // CREATE FUND REQUEST
  static async create(payload, actor, serviceProviderMapping, provider) {
    const existing = await Prisma.transaction.findFirst({
      where: {
        userId: actor.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        status: "PENDING",
      },
    });

    // invalidate old pending order
    if (existing) {
      await Prisma.transaction.update({
        where: { id: existing.id },
        data: {
          status: "FAILED",
          providerResponse: "Recreated order",
        },
      });

      if (existing.apiEntityId) {
        await ApiEntityService.markFailed(Prisma, {
          apiEntityId: existing.apiEntityId,
          errorData: { message: "Recreated order" },
        });
      }
    }

    const plugin = getFundRequestPlugin(
      provider.code,
      serviceProviderMapping.config
    );

    const amount = BigInt(payload.amount);

    // PRICING ENGINE
    const pricing = await PricingEngine.calculateSurcharge(Prisma, {
      userId: actor.id,
      serviceProviderMappingId: serviceProviderMapping.id,
      amount,
    });

    const finalAmount = pricing.totalDebit;

    // CREATE RAZORPAY ORDER
    const providerResponse = await plugin.createRequest({
      amount: Number(finalAmount),
      userId: actor.id,
    });
    console.log("init", providerResponse);

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
        providerReference: providerResponse.orderId,
        pricing: {
          amount,
          surcharge: pricing.surcharge,
          providerCost: pricing.providerCost,
          gst: pricing.gst,
          total: finalAmount,
        },
        idempotencyKey: payload.idempotencyKey,
        requestPayload: payload,
      });

      return {
        transactionId: transaction.id,
        orderId: providerResponse.orderId,
        amount: Number(finalAmount) / 100,
        key: serviceProviderMapping.config.keyId,
      };
    });
  }

  // VERIFY PAYMENT
  static async verifyRequest(payload, actor) {
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

    // duplicate protection
    if (transaction.status === "SUCCESS") {
      return { status: "SUCCESS" };
    }

    if (transaction.status !== "PENDING") {
      throw ApiError.badRequest("Transaction already processed");
    }

    if (
      transaction.providerReference &&
      transaction.providerReference !== payload.razorpay_order_id
    ) {
      throw ApiError.badRequest("Order mismatch");
    }

    const plugin = getFundRequestPlugin(
      transaction.serviceProviderMapping.provider.code,
      transaction.serviceProviderMapping.config
    );

    const verifyResponse = await plugin.verify({
      orderId: payload.razorpay_order_id,
      paymentId: payload.razorpay_payment_id,
      signature: payload.razorpay_signature,
    });

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: transaction.userId,
        walletType: "PRIMARY",
      });

      if (verifyResponse.status === "failed") {
        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerResponse: verifyResponse,
        });

        return { status: "FAILED" };
      }

      if (verifyResponse.status === "authorized") {
        return {
          status: "PENDING",
          message: "Payment authorized but not captured",
        };
      }

      if (verifyResponse.status !== "captured") {
        throw ApiError.badRequest("Payment not captured");
      }

      // CREDIT USER WALLET
      await WalletEngine.credit(tx, wallet, transaction.pricing.amount);

      // LEDGER ENTRY
      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId: transaction.id,
        entryType: "CREDIT",
        referenceType: "FUND_REQUEST",
        serviceProviderMappingId: transaction.serviceProviderMapping.id,
        amount: transaction.pricing.amount,
        narration: "Fund added via Razorpay",
        createdBy: actor.id,
      });

      // DISTRIBUTE SURCHARGE / GST / PROVIDER COST
      await SurchargeEngine.distribute(tx, {
        transactionId: transaction.id,
        userId: transaction.userId,
        serviceProviderMappingId: transaction.serviceProviderMappingId,
        createdBy: actor.id,
        pricing: transaction.pricing,
      });

      // UPDATE TRANSACTION
      await TransactionService.update(tx, {
        transactionId: transaction.id,
        status: "SUCCESS",
        providerReference: verifyResponse.paymentId,
        providerResponse: verifyResponse,
      });

      return {
        status: "SUCCESS",
        amount: transaction.pricing.amount,
        paymentId: verifyResponse.paymentId,
      };
    });
  }
}
