import { Router } from "express";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import PayoutController from "../../controllers/payout/payout.controller.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import PayoutValidationSchemas from "../../validations/payout/payout.validation.js";

const router = Router();

// TRANSFER
router.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business"]),
  validateRequest({
    body: PayoutValidationSchemas.TransferSchema,
  }),
  PayoutController.transfer
);

// STATUS
router.post(
  "/status",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  validateRequest({
    body: PayoutValidationSchemas.StatusSchema,
  }),
  PayoutController.checkStatus
);

// BALANCE
// router.post(
//   "/balance",
//   AuthMiddleware.isAuthenticated,
//   AuthMiddleware.authorize(["ADMIN", "employee"]),
//   validateRequest({
//     body: PayoutValidationSchemas.BalanceSchema,
//   }),
//   PayoutController.checkBalance
// );

export default router;
