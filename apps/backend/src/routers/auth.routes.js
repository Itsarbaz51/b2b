import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import AuthValidationSchemas from "../validations/authValidation.schemas.js";

const authRoutes = Router();

// Public routes

authRoutes.get(
  "/me",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "business"]),
  AuthController.getCurrentUser
);

authRoutes.post(
  "/login",
  validateRequest(AuthValidationSchemas.login),
  AuthController.login
);

authRoutes.post(
  "/password-reset",
  validateRequest(AuthValidationSchemas.forgotPassword),
  AuthController.requestPasswordReset
);

authRoutes.get("/verify-password-reset", AuthController.confirmPasswordReset);
authRoutes.get("/verify-email", AuthController.verifyEmail);

// Protected routes
authRoutes.post(
  "/logout",
  AuthMiddleware.isAuthenticated,
  AuthController.logout
);

authRoutes.post(
  "/refresh",
  AuthController.refreshToken // Note: Refresh doesn't require full authentication
);

authRoutes.put(
  "/:userId/credentials",
  AuthMiddleware.isAuthenticated,
  validateRequest(AuthValidationSchemas.updateCredentials),
  AuthController.updateCredentials
);

export default authRoutes;
