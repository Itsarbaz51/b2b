import { Router } from "express";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import { BankVerificationController } from "../../controllers/controllers/bankVerification.controller.js";

const router = Router();

router.post(
  "/verify",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business"]),
  BankVerificationController.verify
);

export default router;
