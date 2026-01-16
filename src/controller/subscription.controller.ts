import { NextFunction, Request, response, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";
import {
  attachPaymentMethod,
  cancelSubscription,
  createCustomer,
  createSubscription,
  paymentMethodList,
  retriveSubscription,
} from "../stripe/stripe.js";
import Provider from "../models/provider.model.js";
import Subscription from "../models/subscription.model.js";

const createCustomerApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const Email = user.email;
    const Name = user.name;
    if (user?.stripeCustomerId) {
      return next(new ErrorHandler("Customer is already created", 400));
    }
    const customerId = await createCustomer(Name, Email);
    user.stripeCustomerId = customerId;
    await user.save();
    const updatedUser = await Provider.findById(user?._id);
    return res.status(200).json({
      success: true,
      message: "Customer created  successfully",
      data: { ...updatedUser.toObject() },
    });
  } catch (error) {
    console.log(error, "error----");
    next(new ErrorHandler(error.message, error.statusCode));
  }
};

const attachPaymentMethodToCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { paymentMethodId } = req.body;

    const reponse = await attachPaymentMethod(
      user?.stripeCustomerId,
      paymentMethodId
    );
    return res.status(200).json({
      success: true,
      message: "Payment method attached successfully..",
      data: reponse,
    });
  } catch (error) {
    console.log(error, "error----");
    next(new ErrorHandler(error.message, error.statusCode));
  }
};

const listPaymentMethods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const customerId = user?.stripeCustomerId;

    const paymentMethods = await paymentMethodList(customerId);

    return res.status(200).json({
      success: true,
      message: "Payment methods fetched successfully.",
      data: paymentMethods,
    });
  } catch (error) {
    console.log(error, "error----");
    next(new ErrorHandler(error.message, error.statusCode));
  }
};
const createSubscriptionApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { paymentMethodId, priceId } = req.body;

    const findSubscription = await Subscription.findOne({
      userId: user?._id,
      status: "active",
    });
    if (findSubscription) {
      return next(new ErrorHandler("User have already subscribed", 400));
    }
    const response = await createSubscription(
      user?.stripeCustomerId,
      priceId,
      paymentMethodId
    );
    const item = response.items.data[0];
    const currentPeriodStart = item?.current_period_start
      ? new Date(Number(item.current_period_start) * 1000)
      : null;

    const currentPeriodEnd = item?.current_period_end
      ? new Date(Number(item.current_period_end) * 1000)
      : null;

    await Subscription.create({
      userId: user._id,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: response.id,
      priceId,
      status: response.status,
      currentPeriodStart,
      currentPeriodEnd,
    });
    return res.status(200).json({
      success: true,
      message: "Subscription  created successfully..",
      data: response,
    });
  } catch (error) {
    console.log(error, "error----");
    next(new ErrorHandler(error.message, error.statusCode));
  }
};

const retriveSubscriptionApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;

    const subscription = await Subscription.findOne({ userId: user?._id });
    const subscriptionId = subscription.stripeSubscriptionId;

    const response = await retriveSubscription(subscriptionId);
    return res.status(200).json({
      success: true,
      message: "Here is your current subscription",
      data: response,
    });
  } catch (error) {
    console.log(error, "error----");
    next(new ErrorHandler(error.message, error.statusCode));
  }
};
const cancelSubscriptionApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;

    const subscription = await Subscription.findOne({ userId: user?._id , status:"active"});
    const subscriptionId = subscription.stripeSubscriptionId;

    const response = await cancelSubscription(subscriptionId);

    subscription.status = response.status;
    await subscription.save();
    return res.status(200).json({
      success: true,
      message: "Subscription canceled successfully.",
      data: response,
    });
  } catch (error) {
    console.log(error, "error----");
    next(new ErrorHandler(error.message, error.statusCode));
  }
};

export const subscriptionController = {
  createCustomerApi,
  attachPaymentMethodToCustomer,
  listPaymentMethods,
  createSubscriptionApi,
  retriveSubscriptionApi,
  cancelSubscriptionApi,
};
