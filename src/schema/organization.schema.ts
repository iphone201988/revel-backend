 import Joi from "joi";
import { SupportPriority, TicketSupportCategory } from "../utils/enums/enums.js";

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




const dateRange = Joi.string()
  .pattern(/^\d+$/)
  .optional()
  .default("30")
  .messages({
    "string.pattern.base": "dateRange must be a number in string format",
  });


 const getReportsOverviewSchema = {
  query: Joi.object({
    dateRange,
  }),
};


 const getClientProgressReportsSchema = {
  query: Joi.object({
    dateRange,
    selectedClient: Joi.string()
      .optional()
      .default("all")
      .messages({
        "string.base": "selectedClient must be a string",
      }),
  }),
};


 const getProviderActivityReportsSchema = {
  query: Joi.object({
    dateRange,
    selectedProvider: Joi.string()
      .optional()
      .default("all")
      .messages({
        "string.base": "selectedProvider must be a string",
      }),
  }),
};
 const submitSupportTicketSchema = {
  body: Joi.object({
    subject: Joi.string().trim().required().messages({
      "string.base": "Subject must be a string",
      "any.required": "Subject is required",
    }),

    category: Joi.string()
      .valid(...Object.values(TicketSupportCategory))
      .required()
      .messages({
        "any.only": "Invalid support category",
        "any.required": "Category is required",
      }),

    priority: Joi.string()
      .valid(...Object.values(SupportPriority))
      .required()
      .messages({
        "any.only": "Invalid priority",
        "any.required": "Priority is required",
      }),

    discription: Joi.string().trim().required().messages({
      "any.required": "Description is required",
    }),
  }).unknown(true),
};


export const  orgSchema= {
    orgRegisterSchema,
    getReportsOverviewSchema,
getClientProgressReportsSchema,
getProviderActivityReportsSchema,
submitSupportTicketSchema
}
