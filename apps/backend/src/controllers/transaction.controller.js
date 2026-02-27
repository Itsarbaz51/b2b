import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TransactionService } from "../services/transaction.service.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

export class TransactionController {
  static createTransaction = asyncHandler(
    async (req, res) => {
      const idempotencyKey = req.idempotencyKey;

      const transactionData = {
        ...req.body,
        idempotencyKey: idempotencyKey || req.body.idempotencyKey,
      };

      const transaction =
        await TransactionService.createTransaction(transactionData);

      const safeTransaction = Helper.serializeUser(transaction);
      return res
        .status(201)
        .json(
          ApiResponse.success(
            safeTransaction,
            "Transaction created successfully",
            201
          )
        );
    }
  );

  static refundTransaction = asyncHandler(
    async (req, res) => {
      const refund = await TransactionService.refundTransaction(req.body);
      const safeRefund = Helper.serializeUser(refund);

      return res
        .status(200)
        .json(
          ApiResponse.success(safeRefund, "Refund processed successfully", 200)
        );
    }
  );

  static getTransactions = asyncHandler(async (req, res) => {
    const { userId, status, serviceId, apiEntityId, paymentType, page, limit } =
      req.query;

    const filters = {
      userId: userId ,
      status: status ,
      serviceId: serviceId ,
      apiEntityId: apiEntityId ,
      paymentType: paymentType ,
      page: parseInt(page ) || 1,
      limit: parseInt(limit ) || 10,
    };

    const transactions = await TransactionService.getTransactions(filters);
    const safeTransaction = Helper.serializeUser(transactions);
    return res
      .status(200)
      .json(
        ApiResponse.success(
          safeTransaction,
          "Transactions fetched successfully",
          200
        )
      );
  });

  static updateTransactionStatus = asyncHandler(
    async (req, res) => {
      const updated = await TransactionService.updateTransactionStatus(
        req.body
      );

      const safeUpdated = Helper.serializeUser(updated);

      return res
        .status(200)
        .json(
          ApiResponse.success(
            safeUpdated,
            "Transaction status updated successfully",
            200
          )
        );
    }
  );

  static getTransactionById = asyncHandler(
    async (req, res) => {
      const { id } = req.params;

      if (!id) {
        throw ApiError.badRequest("Transaction ID is required");
      }

      const transaction = await TransactionService.getTransactionById(id);

      const safeTransaction = Helper.serializeUser(transaction);

      return res
        .status(200)
        .json(
          ApiResponse.success(
            safeTransaction,
            "Transaction fetched successfully",
            200
          )
        );
    }
  );
}
