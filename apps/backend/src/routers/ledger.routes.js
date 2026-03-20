import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import LedgerController from "../controllers/ledger.controller.js";

const ledgerRoutes = Router();

ledgerRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "business"]),
  LedgerController.getLedger
);

export default ledgerRoutes;
