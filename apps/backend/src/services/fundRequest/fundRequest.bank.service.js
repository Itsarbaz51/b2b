import Prisma from "../../db/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { getFundRequestPlugin } from "../../plugin_registry/fundRequest/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import ApiEntityService from "../apiEntity.service.js";
import S3Service from "../../utils/S3Service.js";
import Helper from "../../utils/helper.js";
import LedgerEngine from "../../engines/ledger.engine.js";

export default class BankFundRequestService {
  static async create(payload, actor, serviceProviderMapping, provider) {
    try {
      await TransactionService.checkDuplicate(payload.idempotencyKey);

      if (provider.code === "BANK_TRANSFER") {
        if (!payload.rrn) {
          throw ApiError.badRequest("RRN required");
        }

        if (!payload?.paymentImage) {
          throw ApiError.badRequest("Payment screenshot required");
        }
      }

      if (serviceProviderMapping.commissionStartLevel !== "NONE") {
        throw ApiError.badRequest(
          "This Bank Transfer service only supports NONE mode. Surcharge and hierarchy commission must be disabled."
        );
      }

      const plugin = getFundRequestPlugin(
        provider.code,
        serviceProviderMapping.config
      );

      const providerResponse = await plugin.createRequest(payload);

      let paymentImageUrl = null;

      if (payload?.paymentImage) {
        paymentImageUrl = await S3Service.upload(
          payload.paymentImage.path,
          "bank-transfer-fund-request"
        );
      }

      const result = await Prisma.$transaction(async (tx) => {
        const wallet = await WalletEngine.getWallet({
          tx,
          userId: actor.id,
          walletType: "PRIMARY",
        });

        const pricing = {
          amount: payload.amount,
        };

        const txnId = Helper.generateTxnId("BT");
        const { transaction, apiEntity } = await TransactionService.create(tx, {
          txnId,
          userId: actor.id,
          walletId: wallet.id,
          serviceProviderMappingId: serviceProviderMapping.id,
          amount: providerResponse.amount,
          providerReference: payload.rrn,
          requestPayload: payload,
          pricing,
          idempotencyKey: payload.idempotencyKey,
        });

        await ApiEntityService.updateProviderInit(tx, {
          apiEntityId: apiEntity.id,
          providerResponse: {
            ...providerResponse,
            paymentImageUrl,
            rrn: payload.rrn,
          },
        });

        return {
          transactionId: transaction.id,
          status: "PENDING",
          paymentImageUrl,
        };
      });

      return result;
    } catch (error) {
      throw error;
    } finally {
      if (payload?.paymentImage?.path) {
        await Helper.deleteOldImage(payload.paymentImage.path);
      }
    }
  }

  static async verifyRequest(payload, actor) {
    if (actor.role !== "ADMIN" && actor.roleType !== "employee") {
      throw ApiError.badRequest("Only admin/employee can verify");
    }

    const { transactionId, action, reason } = payload;

    if (!["APPROVE", "REJECT"].includes(action)) {
      throw ApiError.badRequest("Invalid action");
    }

    return await Prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { apiEntity: true },
      });

      if (!transaction) {
        throw ApiError.notFound("Transaction not found");
      }

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: transaction.userId,
        walletType: "PRIMARY",
      });

      // ===============================
      // APPROVE
      // ===============================

      if (action === "APPROVE") {
        // PENDING → SUCCESS

        if (transaction.status === "PENDING") {
          await WalletEngine.credit(tx, wallet, transaction.amount);

          await LedgerEngine.create(tx, {
            walletId: wallet.id,
            transactionId: transaction.id,
            entryType: "CREDIT",
            referenceType: "TRANSACTION",
            serviceProviderMappingId: transaction.serviceProviderMappingId,
            amount: transaction.amount,
            narration: "Bank Fund Request Approved",
            createdBy: actor.id,
          });
        }

        // FAILED → SUCCESS (correction)
        if (transaction.status === "FAILED") {
          await WalletEngine.credit(tx, wallet, transaction.amount);

          await LedgerEngine.create(tx, {
            walletId: wallet.id,
            transactionId: transaction.id,
            entryType: "CREDIT",
            referenceType: "TRANSACTION",
            serviceProviderMappingId: transaction.serviceProviderMappingId,
            amount: transaction.amount,
            narration: "Bank Fund Request Approved (Correction)",
            createdBy: actor.id,
          });
        }

        if (transaction.status === "SUCCESS") {
          throw ApiError.badRequest("Transaction already approved");
        }

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
        });

        await ApiEntityService.markSuccess(tx, {
          apiEntityId: transaction.apiEntityId,
          providerResponse: {
            approvedBy: actor.id,
          },
        });

        return { status: "SUCCESS" };
      }

      // ===============================
      // REJECT
      // ===============================

      if (action === "REJECT") {
        if (!reason) {
          throw ApiError.badRequest("Reject reason required");
        }

        // SUCCESS → FAILED (reverse wallet)
        if (transaction.status === "SUCCESS") {
          await WalletEngine.debit(tx, wallet, transaction.amount);

          await LedgerEngine.create(tx, {
            walletId: wallet.id,
            transactionId: transaction.id,
            entryType: "DEBIT",
            referenceType: "TRANSACTION",
            serviceProviderMappingId: transaction.serviceProviderMappingId,
            amount: transaction.amount,
            narration: "Bank Fund Request Reversed",
            createdBy: actor.id,
          });
        }

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerResponse: {
            rejectedBy: actor.id,
            reason,
          },
        });

        await ApiEntityService.markFailed(tx, {
          apiEntityId: transaction.apiEntityId,
          errorData: {
            rejectedBy: actor.id,
            reason,
          },
        });

        return {
          status: "FAILED",
          reason,
        };
      }
    });
  }
}
