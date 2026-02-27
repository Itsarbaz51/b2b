import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import LoginLogController from "../controllers/loginLog.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import LoginLogsValidationSchemas from "../validations/loginLogValidation.schemas.js";

const loginLogRoutes = Router();

loginLogRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business", "employee"]),
  validateRequest(LoginLogsValidationSchemas.ListLoginLogsSchema),
  LoginLogController.index
);

export default loginLogRoutes;
