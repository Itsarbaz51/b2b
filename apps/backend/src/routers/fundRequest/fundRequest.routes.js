import { Router } from "express";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import FundRequestController from "../../controllers/fundRequest/fundRequest.controller.js";
import FundRequestValidationSchemas from "../../validations/fundRequest/fundRequestValidation.schema.js";
import upload from "../../middlewares/multer.middleware.js";

const fundRequestRoutes = Router();

//  CREATE FUND REQUEST

fundRequestRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  upload.fields([{ name: "paymentImage", maxCount: 1 }]),
  validateRequest(FundRequestValidationSchemas.CreateFundRequest),
  FundRequestController.create
);

// //  VERIFY RAZORPAY PAYMENT

// fundRequestRoutes.post(
//   "/verify",
//   AuthMiddleware.isAuthenticated,
//   AuthMiddleware.authorizeRoleTypes(["business"]),
//   validateRequest(FundRequestValidationSchemas.VerifyPayment),
//   FundRequestController.verifyPayment
// );

// //  LIST FUND REQUESTS

// fundRequestRoutes.get(
//   "/",
//   AuthMiddleware.isAuthenticated,
//   AuthMiddleware.authorizeBusinessRoles([
//     "ADMIN",
//     "STATE HEAD",
//     "MASTER DISTRIBUTOR",
//     "DISTRIBUTOR",
//     "RETAILER",
//   ]),
//   FundRequestController.list
// );

// //  GET SINGLE FUND REQUEST

// fundRequestRoutes.get(
//   "/:id",
//   AuthMiddleware.isAuthenticated,
//   AuthMiddleware.authorizeBusinessRoles([
//     "ADMIN",
//     "STATE HEAD",
//     "MASTER DISTRIBUTOR",
//     "DISTRIBUTOR",
//     "RETAILER",
//   ]),
//   FundRequestController.show
// );

// //  ADMIN APPROVE FUND REQUEST

// fundRequestRoutes.patch(
//   "/approve/:transactionId",
//   AuthMiddleware.isAuthenticated,
//   AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
//   FundRequestController.approve
// );

// //  ADMIN REJECT FUND REQUEST

// fundRequestRoutes.patch(
//   "/reject/:transactionId",
//   AuthMiddleware.isAuthenticated,
//   AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
//   FundRequestController.reject
// );

export default fundRequestRoutes;
