import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import WalletController from "../controllers/wallet.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import WallletValidationSchemas from "../validations/walletValidation.schemas.js";
const walletRoutes = Router();

walletRoutes.post(
  "/transfer/commission-to-primary",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(WallletValidationSchemas.transferCommissionSchema),
  WalletController.transferCommissionToPrimary
);

export default walletRoutes;
