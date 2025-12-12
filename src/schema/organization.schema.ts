 import Joi from "joi";

 const orgRegisterSchema = {
  body: Joi.object({
    clinicName: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Clinic name is required",
        "any.required": "Clinic name is required",
      }),

    ownerFirstName: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Owner first name is required",
        "any.required": "Owner first name is required",
      }),

    ownerLastName: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Owner last name is required",
        "any.required": "Owner last name is required",
      }),

    email: Joi.string()
      .trim()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.email": "Valid email is required",
        "string.empty": "Email is required",
        "any.required": "Email is required",
      }),

    phone: Joi.string()
      .trim()
      .pattern(/^[0-9]{5,15}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be 5–15 digits",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
      }),

    countryCode: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Country code is required",
        "any.required": "Country code is required",
      }),

    clinicAddress: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Clinic address is required",
        "any.required": "Clinic address is required",
      }),

    clinicCity: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Clinic city is required",
        "any.required": "Clinic city is required",
      }),

    clinicState: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Clinic state is required",
        "any.required": "Clinic state is required",
      }),

    clinicZip: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Clinic ZIP code is required",
        "any.required": "Clinic ZIP code is required",
      }),

    password: Joi.string()
      .min(8)
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters",
        "string.empty": "Password is required",
        "any.required": "Password is required",
      }),
  }),
};

export const  orgSchema= {
    orgRegisterSchema
}
