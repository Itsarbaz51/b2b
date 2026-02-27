import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { TransactionValidationSchemas } from "../validations/transactionValidation.schemas.js";
import { TransactionController } from "../controllers/transaction.controller.js";
import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";

const transactionRoutes = Router();

// Create transaction with idempotency (Business users only)
transactionRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(TransactionValidationSchemas.createTransactionSchema),
  TransactionController.createTransaction
);

// Refund transaction (ADMIN only)
transactionRoutes.post(
  "/refund",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN"]),
  validateRequest(TransactionValidationSchemas.refundTransactionSchema),
  TransactionController.refundTransaction
);

// Get transactions (with query params) - Business users see their own, ADMIN sees all
transactionRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "business", "employee"]),
  TransactionController.getTransactions
);

// Get transaction by ID - Business users see their own, ADMIN sees all
transactionRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "business", "employee"]),
  TransactionController.getTransactionById
);

// Update transaction status (ADMIN only)
transactionRoutes.patch(
  "/status",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN"]),
  validateRequest(TransactionValidationSchemas.updateTransactionStatusSchema),
  TransactionController.updateTransactionStatus
);

export default transactionRoutes;
