import { Router } from "express";
import { PanController } from "../../controllers/pan/pan.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const panRoutes = Router();

panRoutes.post(
  "/verify",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business"]),
  PanController.verify
);

export default panRoutes;
