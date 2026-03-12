import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import ServiceProviderController from "../controllers/service.controller.js";
import { ServiceValidationSchemas } from "../validations/serviceValidation.schemas.js";

const serviceRoutes = Router();

serviceRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(ServiceValidationSchemas.create), // ✅ FIXED
  ServiceProviderController.create
);

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

serviceRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "business", "employee"]),
  ServiceProviderController.getServices
);

export default serviceRoutes;
