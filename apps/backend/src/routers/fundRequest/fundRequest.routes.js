import { Router } from "express";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import FundRequestController from "../../controllers/fundRequest/fundRequest.controller.js";
import { FundRequestValidationSchemas } from "../../validations/fundRequest/fundRequestValidation.schema.js";
import upload from "../../middlewares/multer.middleware.js";

const fundRequestRoutes = Router();

//  CREATE FUND REQUEST
fundRequestRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  upload.fields([{ name: "paymentImage", maxCount: 1 }]),
  validateRequest({ body: FundRequestValidationSchemas.CreateFundRequest }),
  FundRequestController.create
);

// VERIFY (ADMIN / EMPLOYEE)
fundRequestRoutes.patch(
  "/verify/:transactionId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["ADMIN", "employee", "business"]),
  validateRequest({ body: FundRequestValidationSchemas.VerifyFundRequest }),
  FundRequestController.verify
);

export default fundRequestRoutes;
