import { Router } from "express";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import BbpsController from "../../controllers/bbps/bbps.controller.js";
import { BbpsValidationSchemas } from "../../validations/bbps/bbpsValidation.schema.js";

const bbpsRoutes = Router();

bbpsRoutes.post(
  "/categories",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest({ body: BbpsValidationSchemas.ListCategories }),
  BbpsController.listCategories
);

bbpsRoutes.post(
  "/biller",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest({ body: BbpsValidationSchemas.SelectBiller }),
  BbpsController.selectBiller
);

bbpsRoutes.post(
  "/fetch",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest({ body: BbpsValidationSchemas.FetchBill }),
  BbpsController.fetchBill
);

bbpsRoutes.post(
  "/pay",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest({ body: BbpsValidationSchemas.PayBill }),
  BbpsController.payBill
);

bbpsRoutes.post(
  "/status",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business", "employee"]),
  validateRequest({ body: BbpsValidationSchemas.CheckStatus }),
  BbpsController.checkStatus
);

bbpsRoutes.post(
  "/transactions",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business", "employee"]),
  validateRequest({ body: BbpsValidationSchemas.ListTransactions }),
  BbpsController.listTransactions
);

bbpsRoutes.get(
  "/pending",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest({ query: BbpsValidationSchemas.PendingBills }),
  BbpsController.listPendingBills
);

export default bbpsRoutes;
