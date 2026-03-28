import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import ReportController from "../controllers/report.controller.js";

const router = Router();

// 🔥 Profit breakdown
router.get(
  "/profit-breakdown",
  AuthMiddleware.isAuthenticated,
  ReportController.getProfitBreakdown
);

// 🔥 CA Report (admin only ideally)
router.get(
  "/ca-report",
  AuthMiddleware.isAuthenticated,
  ReportController.getCAReport
);

export default router;
