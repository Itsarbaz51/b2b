import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { TransactionValidationSchemas } from "../validations/transactionValidation.schemas.js";
import { TransactionController } from "../controllers/transcation.controller.js";

const transactionRoutes = Router();

transactionRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "business"]),
  validateRequest({
    query: TransactionValidationSchemas.getTransactionsSchema,
  }),
  TransactionController.getTransactions
);

export default transactionRoutes;
