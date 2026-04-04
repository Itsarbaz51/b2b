import Prisma from "../../db/db.js";
import { getFundRequestPlugin } from "../../plugin_registry/fundRequest/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import FundRequestDistributionEngine from "../../engines/fundRequestDistribution.engine.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import FundRequestPricingEngine from "../../engines/fundRequestPricing.engine.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";

export default class RazorpayFundRequestService {
  static async create(payload, actor, serviceProviderMapping, provider) {
    await TransactionService.checkDuplicate(payload.idempotencyKey);

    let parsedConfig = {};

    try {
      parsedConfig =
        typeof serviceProviderMapping.config === "string"
          ? JSON.parse(CryptoService.decrypt(serviceProviderMapping.config))
          : serviceProviderMapping.config;
    } catch (err) {
      throw ApiError.internal("Invalid provider config", err?.message);
    }

    const plugin = getFundRequestPlugin(provider.code, parsedConfig);

    const amount = BigInt(payload.amount);

    return Prisma.$transaction(async (tx) => {
      const finalAmount = amount;

      const receiptId = Helper.generateTxnId("RAZ");
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: actor.id,
        walletType: "PRIMARY",
      });

      //  CREATE TXN FIRST (PENDING)
      const { transaction } = await TransactionService.create(tx, {
        txnId: receiptId,
        userId: actor.id,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount,
        idempotencyKey: payload.idempotencyKey,
        requestPayload: payload,
      });

      //  CREATE RAZORPAY ORDER
      const providerResponse = await plugin.createRequest({
        amount: Number(finalAmount),
        userId: actor.id,
        notes: {
          actualAmount: amount.toString(),
          idempotencyKey: payload.idempotencyKey,
        },
        receiptId,
      });

      //  SAVE ORDER ID
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
        key: parsedConfig.keyId,
      };
    });
  }

  static async verifyRequest(
    payload,
    actor,
    providerData,
    serviceProviderMapping
  ) {
    let parsedConfig = {};

    try {
      parsedConfig =
        typeof serviceProviderMapping.config === "string"
          ? JSON.parse(CryptoService.decrypt(serviceProviderMapping.config))
          : serviceProviderMapping.config;
    } catch (err) {
      throw ApiError.internal("Invalid provider config", err?.message);
    }
    const plugin = getFundRequestPlugin(providerData.code, parsedConfig);

    //  STEP 1: FIND TRANSACTION
    const transaction = await Prisma.transaction.findFirst({
      where: payload.transactionId
        ? { id: payload.transactionId }
        : { providerReference: payload.razorpay_order_id },
    });

    if (!transaction) {
      throw ApiError.badRequest("Transaction not found");
    }

    //  DUPLICATE SAFE
    if (transaction.status === "SUCCESS") {
      return { status: "SUCCESS" };
    }

    //  STEP 2: HANDLE FAILED (NO VERIFY)
    if (payload.action === "FAILED") {
      await Prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          providerResponse: {
            reason: payload.reason || "User cancelled",
          },
        },
      });

      await TransactionService.update(Prisma, {
        transactionId: transaction.id,
        status: "FAILED",
        providerResponse: {
          reason: payload.reason || "User cancelled",
        },
      });

      return { status: "FAILED" };
    }

    //  STEP 3: VERIFY ONLY FOR SUCCESS FLOW
    if (
      !payload.razorpay_order_id ||
      !payload.razorpay_payment_id ||
      !payload.razorpay_signature
    ) {
      throw ApiError.badRequest("Missing Razorpay params");
    }

    const verifyResponse = await plugin.verify({
      orderId: payload.razorpay_order_id,
      paymentId: payload.razorpay_payment_id,
      signature: payload.razorpay_signature,
    });

    const paymentStatus = verifyResponse.status;
    const totalAmount = BigInt(verifyResponse.raw.amount);

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

      if (actualAmount !== totalAmount) {
        throw ApiError.badRequest("Payment amount mismatch");
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

      // SUCCESS
      if (paymentStatus === "captured") {
        const method = verifyResponse.raw.method;
        const cardNetwork = verifyResponse.raw.card?.network || null;

        const pricing = await FundRequestPricingEngine.calculate(tx, {
          userId: transaction.userId,
          serviceProviderMappingId: transaction.serviceProviderMappingId,
          amount: actualAmount,
          paymentMethod: method.toUpperCase(),
          cardNetwork: cardNetwork.toUpperCase(),
        });

        const wallet = await WalletEngine.getWallet({
          tx,
          userId: transaction.userId,
          walletType: "PRIMARY",
        });

        // CREDIT NET AMOUNT ONLY
        await WalletEngine.credit(tx, wallet, pricing.netCredit);

        await LedgerEngine.create(tx, {
          walletId: wallet.id,
          transactionId: transaction.id,
          entryType: "CREDIT",
          referenceType: "FUND_REQUEST",
          serviceProviderMappingId: transaction.serviceProviderMappingId,
          amount: pricing.netCredit,
          narration: "Full fund request amount",
          createdBy: actor.id,
        });

        // ✅ DISTRIBUTION (NO USER DEBIT)
        await FundRequestDistributionEngine.distribute(tx, {
          transactionId: transaction.id,
          userId: transaction.userId,
          serviceProviderMappingId: transaction.serviceProviderMappingId,
          pricing,
          createdBy: actor.id,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          pricing,
          providerReference: verifyResponse.paymentId,
          providerResponse: verifyResponse,
        });

        return {
          status: "SUCCESS",
          transactionId: transaction.id,
          paymentId: verifyResponse.paymentId,
          amount: pricing.netCredit,
        };
      }

      throw ApiError.badRequest("Unhandled payment status");
    });
  }
}
