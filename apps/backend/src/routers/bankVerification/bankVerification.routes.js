import { Router } from "express";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import BankVerificationController from "../../controllers/bankVerification/bankVerification.controller.js";

const router = Router();

router.post(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business"]),
  BankVerificationController.verify
);

export default router;
