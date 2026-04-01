import express from "express";
import BeneficiaryController from "../controllers/beneficiary.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import BeneficiaryValidationSchemas from "../validations/beneficiary.validation.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = express.Router();

router.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business"]),
  validateRequest({ query: BeneficiaryValidationSchemas.list }),
  BeneficiaryController.list
);

export default router;
