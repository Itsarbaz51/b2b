import express from "express";
import AuditLogsController from "../controllers/auditLog.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business", "employee"]),
  AuditLogsController.getAuditLogs
);

export default router;
