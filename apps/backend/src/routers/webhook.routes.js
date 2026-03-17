import { Router } from "express";
import WebhookController from "../controllers/webhook.controller.js";

const router = Router();

router.post("/:provider", WebhookController.handle);

export default router;
