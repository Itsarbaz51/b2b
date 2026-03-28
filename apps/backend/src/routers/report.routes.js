import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import ReportController from "../controllers/report.controller.js";

const router = Router();

router.get(
  "/transactions",
  AuthMiddleware.isAuthenticated,
  ReportController.getTransactions
);

router.get(
  "/transactions/export",
  AuthMiddleware.isAuthenticated,
  ReportController.exportCSV
);

router.get(
  "/settlements",
  AuthMiddleware.isAuthenticated,
  ReportController.getSettlements
);

router.get(
  "/commissions",
  AuthMiddleware.isAuthenticated,
  ReportController.getCommissions
);

export default router;
