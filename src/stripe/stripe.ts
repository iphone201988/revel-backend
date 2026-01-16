import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCustomer = async (Name, Email) => {
  try {
    const customer = await stripe.customers.create({
      name: Name,
      email: Email,
    });
    return customer?.id;
  } catch (error) {
    console.log("error----", error.message);
    throw error;
  }
};
export const attachPaymentMethod = async (
  stripeCustomerId,
  paymentMethodId
) => {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  } catch (error) {
    console.log("error----", error.message);
    throw error;
  }
};
export const paymentMethodList = async (customerId) => {
  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(
      customerId,
      {
        limit: 5,
      }
    );
    return paymentMethods;
  } catch (error) {
    console.log("error----", error.message);
    throw error;
  }
};

export const createSubscription = async (
  customerId: string,
  priceId: string,
  paymentMethodId: string
) => {
  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"],
    });
    return subscription;
  } catch (error) {
    console.log("error----", error.message);
    throw error;
  }
};

export const retriveSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.log("error----", error.message);
    throw error;
  }
};
export const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.log("error----", error.message);
    throw error;
  }
};
