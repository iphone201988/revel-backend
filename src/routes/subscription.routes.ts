import express from "express";
import { subscriptionController } from "../controller/subscription.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { subscriptionSchema } from "../schema/subscription.schema.js";

const router = express.Router();

router.post("/customer", auth, subscriptionController.createCustomerApi);
router.get("/paymentMethods", auth, subscriptionController.listPaymentMethods);
router.post(
  "/attach",
  auth,
  validate(subscriptionSchema.attachPaymentMethodToCustomer),
  subscriptionController.attachPaymentMethodToCustomer
);

router.post(
  "/subscribe",
  auth,
  validate(subscriptionSchema.createSubscriptionApiSchema),
  subscriptionController.createSubscriptionApi
);

router.get('/getSubscription', auth, subscriptionController.retriveSubscriptionApi)
router.post('/cancel', auth, subscriptionController.cancelSubscriptionApi)
export default router;
