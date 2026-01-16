import Stripe from "stripe";
import { Request, Response } from "express";
import 'dotenv/config'
import { stripe } from "../stripe/stripe.js";


export const stripeWebhookHandler = (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.WEBHOOK_SIGNING_SECRET
    );

    console.log("✅ Stripe Event:", event.type);

    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Payment succeeded");
        break;

      case "subscription_schedule.created":
        console.log("Subscription created");
        break;

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error("❌ Stripe webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
