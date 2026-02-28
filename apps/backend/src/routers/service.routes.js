import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import ServiceProviderController from "../controllers/service.controller.js";
import { ServiceValidationSchemas } from "../validations/serviceValidation.schemas.js";

const serviceRoutes = Router();

// Create service provider (ADMIN only)
serviceRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN"]),
  validateRequest(ServiceValidationSchemas.createServiceProvider),
  ServiceProviderController.create
);

// Get all service providers (ADMIN sees all, business users see assigned)
serviceRoutes.post(
  "/lists",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "business", "employee"]),
  ServiceProviderController.getAll
);

serviceRoutes.put(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  ServiceProviderController.update
);

serviceRoutes.delete(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  ServiceProviderController.delete
);

export default serviceRoutes;
