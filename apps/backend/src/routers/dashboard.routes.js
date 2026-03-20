import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import DashboardController from "../controllers/dashboard.controller.js";

const dashboardRoutes = Router();

dashboardRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "business"]),
  DashboardController.getDashboard
);

export default dashboardRoutes;
