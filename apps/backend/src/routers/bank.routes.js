import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { AddBankController } from "../controllers/bank.controller.js";
import BankValidationSchemas from "../validations/bankValidation.schemas.js";

const bankRoutes = Router();

// ===================== BANK ROUTES =====================

// List banks (Business users only)
bankRoutes.post(
  "/bank-list",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  AddBankController.index
);

// Get all my banks (Business users only)
bankRoutes.get(
  "/get-all-my",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  AddBankController.getAllMyBanks
);

// Show specific bank (Business users only)
bankRoutes.get(
  "/bank-show/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  AddBankController.show
);

// Add new bank detail (Business users only)
bankRoutes.post(
  "/store-bank",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  upload.single("bankProofFile"),
  validateRequest(BankValidationSchemas.BankDetailSchema),
  AddBankController.store
);

// Update bank detail (Business users only)
bankRoutes.put(
  "/bank-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  upload.single("bankProofFile"),
  validateRequest(BankValidationSchemas.BankDetailUpdateSchema),
  AddBankController.update
);

// Delete bank (Business users only)
bankRoutes.delete(
  "/bank-delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  AddBankController.destroy
);

// ================= BANK Admin manage =================
// Verify bank (ADMIN only)
bankRoutes.put(
  "/bank-verify",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(BankValidationSchemas.VerificationBankSchema),
  AddBankController.verify
);

export default bankRoutes;
