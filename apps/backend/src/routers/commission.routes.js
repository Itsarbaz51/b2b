import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import CommissionValidationSchemas from "../validations/commissionValidation.schemas.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  CommissionEarningController,
  CommissionSettingController,
} from "../controllers/commission.controller.js";

const commissionRoutes = Router();

// Get commission settings by role or user (ADMIN only)
commissionRoutes.get(
  "/setting",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),

  CommissionSettingController.getByRoleOrUser
);

// Get commission settings created by current user (Business users)
commissionRoutes.get(
  "/setting/created-by-me",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  CommissionSettingController.getAll
);

// Create or update commission setting (ADMIN only)
commissionRoutes.post(
  "/setting",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),

  validateRequest(
    CommissionValidationSchemas.createOrUpdateCommissionSettingSchema
  ),
  CommissionSettingController.createOrUpdate
);

// Commission Earning Routes (ADMIN only)
commissionRoutes.post(
  "/earn",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),

  validateRequest(CommissionValidationSchemas.createCommissionEarningSchema),
  CommissionEarningController.create
);

commissionRoutes.get(
  "/earnings",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),

  CommissionEarningController.getAll
);

export default commissionRoutes;
