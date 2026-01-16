import { Router } from "express";
import { stripeRawBody } from "../middleware/stripeRaw.middleware.js";
import { stripeWebhookHandler } from "../controller/webhook.controller.js";

const router = Router();

router.post("/webhook", stripeRawBody, stripeWebhookHandler);

export default router;
