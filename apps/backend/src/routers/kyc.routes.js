import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { UserKycController } from "../controllers/kyc.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import KycValidationSchemas from "../validations/kycValidation.schemas.js";
import upload from "../middlewares/multer.middleware.js";

const kycRoutes = Router();

// List KYC applications (Business users - hierarchy access)
kycRoutes.post(
  "/list-kyc",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  validateRequest(KycValidationSchemas.ListkycSchema),
  UserKycController.index
);

// Get KYC by ID (Users can see their own, business users can see their hierarchy)
kycRoutes.get(
  "/user-kyc-show/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  UserKycController.show
);

// Submit KYC (Business users only)
kycRoutes.post(
  "/user-kyc-store",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "addressProofFile", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  validateRequest(KycValidationSchemas.UserKyc),
  UserKycController.store
);

// Verify KYC (ADMIN only)
kycRoutes.put(
  "/user-verify",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(KycValidationSchemas.VerificationKycSchema),
  UserKycController.verification
);

// Update KYC (Business users can update their own)
kycRoutes.put(
  "/user-kyc-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "addressProofFile", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  UserKycController.update
);

export default kycRoutes;
