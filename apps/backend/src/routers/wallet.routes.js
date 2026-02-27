import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { WalletController } from "../controllers/wallet.controller.js";
import WallletValidationSchemas from "../validations/walletValidation.schemas.js";
import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";

const walletRoutes = Router();

// Credit wallet with idempotency (ADMIN only)
walletRoutes.post(
  "/credit",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.walletCreditSchema),
  WalletController.creditWallet
);

// Debit wallet with idempotency (ADMIN only)
walletRoutes.post(
  "/debit",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.walletDebitSchema),
  WalletController.debitWallet
);

// Hold amount (Business users only)
walletRoutes.post(
  "/hold",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.holdAmountSchema),
  WalletController.holdAmount
);

// Release hold amount (Business users only)
walletRoutes.post(
  "/release-hold",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.releaseHoldAmountSchema),
  WalletController.releaseHoldAmount
);

// Get wallet by user ID (Business users only)
walletRoutes.get(
  "/user/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",

    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
    "business",
    "employee",
  ]),
  validateRequest(WallletValidationSchemas.getWalletSchema),
  WalletController.getWallet
);

// Get all user wallets (Business users only)
walletRoutes.get(
  "/user/:userId/all",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",

    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
    "business",
    "employee",
  ]),
  WalletController.getUserWallets
);

// Get wallet balance (Business users only)
walletRoutes.get(
  "/balance/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",

    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
    "business",
    "employee",
  ]),
  validateRequest(WallletValidationSchemas.getWalletBalanceSchema),
  WalletController.getWalletBalance
);

// Get wallet transactions (Business users only)
walletRoutes.get(
  "/transactions/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",

    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
    "business",
    "employee",
  ]),
  validateRequest(WallletValidationSchemas.walletTransactionsSchema),
  WalletController.getWalletTransactions
);

export default walletRoutes;
