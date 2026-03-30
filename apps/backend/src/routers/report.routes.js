import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import ReportController from "../controllers/report.controller.js";

const router = Router();

router.get(
  "/",
  AuthMiddleware.isAuthenticated,
  ReportController.getReports
);

export default router;
