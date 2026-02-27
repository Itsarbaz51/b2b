import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import SystemSettingController from "../controllers/systemSetting.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import upload from "../middlewares/multer.middleware.js";
import SystemSettingValidationSchemas from "../validations/systemSettingValidation.schemas.js";

const systemSettingRoutes = Router();

// Get system setting by ID (ADMIN only)
systemSettingRoutes.get(
  "/show",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  SystemSettingController.show
);

// List all system settings with pagination (ADMIN only)
systemSettingRoutes.get(
  "/list",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN"]),
  SystemSettingController.index
);

// Delete system setting (ADMIN only)
systemSettingRoutes.delete(
  "/delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN"]),
  SystemSettingController.delete
);

// Upsert system setting (ADMIN only)
systemSettingRoutes.post(
  "/upsert",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "favIcon", maxCount: 1 },
  ]),
  validateRequest(SystemSettingValidationSchemas.upsertSchema),
  SystemSettingController.upsert
);

export default systemSettingRoutes;
