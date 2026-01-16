import joi from 'joi'


const attachPaymentMethodToCustomer = {
  body: joi.object({
    paymentMethodId: joi.string().trim().required().messages({
      "any.required": "Payment method ID is required.",
      "string.base": "Payment method ID must be a valid string.",
      "string.empty": "Payment method ID cannot be empty.",
    }),
  }),
};

const createSubscriptionApiSchema = {
  body: joi.object({
    paymentMethodId: joi.string().trim().required().messages({
      "any.required": "Payment method ID is required.",
      "string.base": "Payment method ID must be a valid string.",
      "string.empty": "Payment method ID cannot be empty.",
    }),

    priceId: joi.string().trim().required().messages({
      "any.required": "Price ID is required.",
      "string.base": "Price ID must be a valid string.",
      "string.empty": "Price ID cannot be empty.",
    }),
  }),
};


export const subscriptionSchema = {
    attachPaymentMethodToCustomer,
    createSubscriptionApiSchema
}