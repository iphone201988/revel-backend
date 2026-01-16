import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    stripeCustomerId: {
      type: String,
      required: true,
    },

    stripeSubscriptionId: {
      type: String,
      required: true,
    },

    priceId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
    //   enum: [
    //     "incomplete",
    //     "active",
    //     "past_due",
    //     "canceled",
    //     "unpaid",
    //   ],
      default: "incomplete",
    },

    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  },
  { timestamps: true }
);
const Subscription = mongoose.model('Subscription', subscriptionSchema)
export default Subscription

