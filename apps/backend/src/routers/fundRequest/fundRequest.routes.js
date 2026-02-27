import { Router } from "express";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import FundRequestController from "../../controllers/fundRequest/fundRequest.controller.js";
import FundRequestValidationSchemas from "../../validations/fundRequest/fundRequestValidation.schema.js";
import upload from "../../middlewares/multer.middleware.js";

const fundRequestRoutes = Router();

// Fund request routes

// List fund requests (Business users - hierarchy access)
fundRequestRoutes.post(
  "/list",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ]),
  validateRequest(FundRequestValidationSchemas.ListFundRequests),
  FundRequestController.index
);

// Get fund request by ID (Business users - hierarchy access)
fundRequestRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ]),
  FundRequestController.show
);

// Create fund request (Business users only)
fundRequestRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  upload.fields([{ name: "paymentImage", maxCount: 1 }]),
  validateRequest(FundRequestValidationSchemas.CreateFundRequest),
  FundRequestController.store
);

// Update fund request (ADMIN only)
fundRequestRoutes.put(
  "/:id/update",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(FundRequestValidationSchemas.UpdateFundRequest),
  FundRequestController.update
);

// Verify payment (ADMIN only)
fundRequestRoutes.post(
  "/verify-payment",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(FundRequestValidationSchemas.VerifyPayment),
  FundRequestController.verification
);

// Create Razorpay order (Business users only)
fundRequestRoutes.post(
  "/create-order",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(FundRequestValidationSchemas.CreateOrder),
  FundRequestController.createRazorpayOrder
);

// Get wallet balance (Business users only)
fundRequestRoutes.get(
  "/wallet/balance",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  FundRequestController.getWalletBalance
);

// Get fund request stats (Business users - hierarchy access)
fundRequestRoutes.get(
  "/stats/summary",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ]),
  FundRequestController.getStats
);

// Delete fund request (ADMIN only)
fundRequestRoutes.delete(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  FundRequestController.destroy
);

export default fundRequestRoutes;
