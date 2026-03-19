import Prisma from "../../db/db.js";
import { getFundRequestPlugin } from "../../plugin_registry/fundRequest/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import SurchargeEngine from "../../engines/surcharge.engine.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import PricingEngine from "../../engines/pricing.engine.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";

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
    const receiptId = Helper.generateTxnId("RAZ");

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: actor.id,
        walletType: "PRIMARY",
      });

      // ✅ CREATE TXN FIRST (PENDING)
      const { transaction } = await TransactionService.create(tx, {
        txnId: receiptId,
        userId: actor.id,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount,
        pricing,
        idempotencyKey: payload.idempotencyKey,
        requestPayload: payload,
      });

      // ✅ CREATE RAZORPAY ORDER
      const providerResponse = await plugin.createRequest({
        amount: Number(finalAmount),
        userId: actor.id,
        notes: {
          actualAmount: amount.toString(),
          idempotencyKey: payload.idempotencyKey,
        },
        receiptId,
      });

      // ✅ SAVE ORDER ID
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          providerReference: providerResponse.orderId,
        },
      });

      return {
        transactionId: transaction.id,
        orderId: providerResponse.orderId,
        amount: Number(finalAmount) / 100,
        key: serviceProviderMapping.config.keyId,
      };
    });
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
    const totalAmount = BigInt(verifyResponse.raw.amount);

    // ✅ FIND EXISTING TXN (BY ORDER ID)
    const transaction = await Prisma.transaction.findFirst({
      where: {
        providerReference: payload.razorpay_order_id,
      },
    });

    if (!transaction) {
      throw ApiError.badRequest("Transaction not found");
    }

    // ✅ DUPLICATE SAFE
    if (transaction.status === "SUCCESS") {
      return { status: "SUCCESS" };
    }

    const actualAmount = verifyResponse.raw.notes?.actualAmount
      ? BigInt(verifyResponse.raw.notes.actualAmount)
      : totalAmount;

    if (actualAmount <= 0n) {
      throw ApiError.badRequest("Invalid amount");
    }

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: transaction.userId,
        walletType: "PRIMARY",
      });

      const pricing = await PricingEngine.calculateSurcharge(tx, {
        userId: transaction.userId,
        serviceProviderMappingId: transaction.serviceProviderMappingId,
        amount: actualAmount,
      });

      if (pricing.totalDebit !== totalAmount) {
        throw ApiError.badRequest("Amount mismatch");
      }

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
          message: "Authorized but not captured",
        };
      }

      // ✅ SUCCESS
      if (paymentStatus === "captured") {
        await WalletEngine.credit(tx, wallet, actualAmount);

        await LedgerEngine.create(tx, {
          walletId: wallet.id,
          transactionId: transaction.id,
          entryType: "CREDIT",
          referenceType: "FUND_REQUEST",
          serviceProviderMappingId: transaction.serviceProviderMappingId,
          amount: actualAmount,
          narration: "Fund added via Razorpay",
          createdBy: actor.id,
        });

        await SurchargeEngine.distribute(tx, {
          transactionId: transaction.id,
          userId: transaction.userId,
          serviceProviderMappingId: transaction.serviceProviderMappingId,
          createdBy: actor.id,
          pricing,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerReference: verifyResponse.paymentId,
          providerResponse: verifyResponse,
        });

        return {
          status: "SUCCESS",
          transactionId: transaction.id,
          paymentId: verifyResponse.paymentId,
          amount: actualAmount,
        };
      }

      throw ApiError.badRequest("Unhandled payment status");
    });
  }
}
