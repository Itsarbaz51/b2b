import Prisma from "../db/db.js";
import SettlementEngine from "../engines/settlement.engine.js";
import TransactionService from "../services/transaction.service.js";
import WebhookService from "../services/webhook.service.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyWebhookSignature } from "../utils/webhookSignature.js";

export default class WebhookController {
  static handle = async (req, res, next) => {
    const provider = req.params.provider?.toUpperCase();

    try {
      const payload = req.body;
      const headers = req.headers;

      const normalized = this.normalize(provider, payload);

      if (!normalized.clientOrderId) {
        throw ApiError.badRequest("Invalid webhook payload");
      }

      // 🔐 Verify signature
      verifyWebhookSignature(provider, payload, headers);

      await Prisma.$transaction(async (tx) => {
        const txn = await tx.transaction.findFirst({
          where: {
            requestPayload: {
              path: ["clientOrderId"],
              equals: normalized.clientOrderId,
            },
          },
        });

        if (!txn) return;

        // ✅ Prevent duplicate settlement
        if (["SUCCESS", "FAILED"].includes(txn.status)) return;

        // ✅ Prevent duplicate webhook (same provider + event + reference)
        const existingWebhook = await tx.apiWebhook.findFirst({
          where: {
            transactionId: txn.id,
            provider,
            eventType: normalized.status,
            apiEntityId: normalized.apiEntityId || normalized.clientOrderId,
          },
        });

        if (existingWebhook) return;

        const webhook = await WebhookService.store(tx, {
          transactionId: txn.id,
          apiEntityId: normalized.apiEntityId || normalized.clientOrderId,
          provider,
          eventType: normalized.status,
          payload,
          headers,
          signature: headers["x-razorpay-signature"] || null,
        });

        try {
          if (normalized.status === "SUCCESS") {
            await SettlementEngine.success({
              tx,
              actor: { id: txn.userId },
              transaction: txn,
              pricing: txn.pricing,
              serviceProviderMapping: {
                id: txn.serviceProviderMappingId,
              },
            });

            await TransactionService.update(tx, {
              transactionId: txn.id,
              status: "SUCCESS",
              providerResponse: payload,
            });
          } else if (normalized.status === "FAILED") {
            await SettlementEngine.failed({
              tx,
              walletId: txn.walletId,
              pricing: txn.pricing,
            });

            await TransactionService.update(tx, {
              transactionId: txn.id,
              status: "FAILED",
              providerResponse: payload,
            });
          } else {
            await TransactionService.update(tx, {
              transactionId: txn.id,
              providerResponse: payload,
            });
          }

          await WebhookService.markProcessed(tx, webhook.id, payload);
        } catch (err) {
          await WebhookService.markFailed(tx, webhook.id, err.message);
          throw err;
        }
      });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  };

  // NORMALIZER (EXTENDED)
  static normalize(provider, payload) {
    switch (provider) {
      case "WONDERPAY":
        return {
          clientOrderId: payload.clientOrderId,
          apiEntityId: payload.txnId,
          status: payload.status,
        };

      case "RAZORPAY":
        return {
          clientOrderId: payload.payload?.payout?.entity?.reference_id,
          apiEntityId: payload.payload?.payout?.entity?.id,
          status:
            payload.event === "payout.processed"
              ? "SUCCESS"
              : payload.event === "payout.failed"
                ? "FAILED"
                : "PENDING",
        };

      case "PAYROUTE":
        return {
          clientOrderId: payload.orderId,
          apiEntityId: payload.txnId,
          status:
            payload.status === "SUCCESS"
              ? "SUCCESS"
              : payload.status === "FAILED"
                ? "FAILED"
                : "PENDING",
        };

      default:
        throw ApiError.badRequest("Unsupported provider");
    }
  }
}
