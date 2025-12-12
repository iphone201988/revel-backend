import joi from "joi";
import {
  ClinicRole,
  GoalBankCategory,
  Permission,
  SupportLevel,
  SystemRoles,
} from "../utils/enums/enums.js";

const loginSchema = {
  body: joi.object({
    email: joi.string().trim().lowercase().email().required().messages({
      "string.base": "Email must be a text value.",
      "string.empty": "Email is required.",
      "string.email": "Please enter a valid email address.",
      "any.required": "Email is required.",
    }),
    password: joi.string().min(6).max(128).required().messages({
      "string.base": "Password must be a text value.",
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must be at most 128 characters long.",
      "any.required": "Password is required.",
    }),
  }),
};

const verifyOtpSchema = {
  body: joi.object({
    email: joi.string().email().required(),
    otp: joi
      .number()
      .integer()
      .min(100000)
      .max(999999)
      .strict()
      .required()
      .messages({
        "number.base": "OTP must be a number",
        "number.integer": "OTP must be an integer number",
        "number.min": "OTP must be a 6-digit number",
        "number.max": "OTP must be a 6-digit number",
        "any.required": "OTP is required",
      }),
  }),
};

const sendOtpSchema = {
  body: joi.object({
    email: joi.string().trim().email().required().messages({
      "string.base": "Email must be a text value.",
      "string.empty": "Email is required.",
      "string.email": "Please enter a valid email address.",
      "any.required": "Email is required.",
    }),
  }),
};

const addClientSchema = {
  body: joi.object({
    name: joi.string().trim().min(2).max(100).required().messages({
      "string.base": "Name must be a text value.",
      "string.empty": "Name is required.",
      "string.min": "Name must be at least 2 characters long.",
      "string.max": "Name must be at most 100 characters long.",
      "any.required": "Name is required.",
    }),

    dob: joi.date().iso().less("now").required().messages({
      "date.base": "Date of birth must be a valid date.",
      "date.less": "Date of birth must be in the past.",
      "any.required": "Date of birth is required.",
    }),

    diagnosis: joi.string().trim().allow("", null).messages({
      "string.base": "Diagnosis must be a text value.",
    }),

    parentName: joi.string().trim().min(2).max(100).required().messages({
      "string.base": "Parent name must be a text value.",
      "string.empty": "Parent name is required.",
      "string.min": "Parent name must be at least 2 characters long.",
      "string.max": "Parent name must be at most 100 characters long.",
      "any.required": "Parent name is required.",
    }),

    email: joi.string().trim().lowercase().email().required().messages({
      "string.base": "Email must be a text value.",
      "string.email": "Email must be a valid email address.",
      "string.empty": "Email is required.",
      "any.required": "Email is required.",
    }),

    phone: joi.string().trim().min(6).max(20).required().messages({
      "string.base": "Phone must be a text value.",
      "string.empty": "Phone number is required.",
      "string.min": "Phone number must be at least 6 digits.",
      "string.max": "Phone number must be at most 20 digits.",
      "any.required": "Phone number is required.",
    }),

    countryCode: joi.string().trim().min(1).max(10).required().messages({
      "string.base": "Country code must be a text value.",
      "string.empty": "Country code is required.",
      "any.required": "Country code is required.",
    }),

   assignedProvider: joi.array()
      .items(
        joi.string().length(24).hex().messages({
          "string.length": "Provider Id must be 24 characters",
          "string.hex": "Provider Id must be a valid ObjectId",
        })
      )
      .min(1)
      .required()
      .messages({
        "array.base": "Assigned provider must be an array",
        "array.min": "At least one provider must be assigned",
        "any.required": "Assigned provider is required",
      }),

   qsp:joi.string().required().length(24).hex().messages({
      "any.required": "assigned QSP Id is required",
      "string.empty": "assigned QSP Id cannot be empty",
      "string.length": "assigned QSP Id must be exactly 24 characters",
      "string.hex": "assigned QSP Id must be a valid hex string",
    }),

  clinicalSupervisor: joi.string().required().length(24).hex().messages({
      "any.required": "assigned Supervisor Id is required",
      "string.empty": "assigned Supervisor Id cannot be empty",
      "string.length": "assigned Supervisor Id must be exactly 24 characters",
      "string.hex": "assigned Supervisor Id must be a valid hex string",
    }),

    reviewDate: joi.date().iso().allow(null).messages({
      "date.base": "Review date must be a valid date.",
    }),
  }),
};

const createProviderSchema = {
  body: joi.object({
    name: joi
      .string()

      .min(2)
      .max(100)
      .required()
      .messages({
        "string.base": "Name must be a text value.",
        "string.empty": "Name is required.",
        "string.min": "Name must be at least 2 characters long.",
        "string.max": "Name must be at most 100 characters long.",
        "any.required": "Name is required.",
      }),

    credential: joi.string().trim().allow("", null).messages({
      "string.base": "Credential must be a text value.",
    }),

    clinicRole: joi
      .string()
      // .valid(...Object.values(ClinicRole))
      .required()
      .messages({
        "string.base": "Clinic role must be a text value.",
        "string.empty": "Clinic role is required.",
        "any.required": "Clinic role is required.",
      }),

    systemRole: joi
      .string()
      .trim()
      .valid(...Object.values(SystemRoles))
      .required()
      .messages({
        "string.base": "System role must be a text value.",
        "string.empty": "System role is required.",
        "any.required": "System role is required.",
      }),

    email: joi
      .string()
      .trim()

      .email()
      .required()
      .messages({
        "string.base": "Email must be a text value.",
        "string.empty": "Email is required.",
        "string.email": "Please enter a valid email address.",
        "any.required": "Email is required.",
      }),

    phone: joi.string().trim().min(6).max(20).required().messages({
      "string.base": "Phone must be a text value.",
      "string.empty": "Phone number is required.",
      "string.min": "Phone number must be at least 6 digits.",
      "string.max": "Phone number must be at most 20 digits.",
      "any.required": "Phone number is required.",
    }),

    countryCode: joi.string().trim().min(1).max(10).required().messages({
      "string.base": "Country code must be a text value.",
      "string.empty": "Country code is required.",
      "any.required": "Country code is required.",
    }),

    licenseNumber: joi.string().trim().allow("", null).messages({
      "string.base": "License number must be a text value.",
    }),
  }),
};

const updateProviderSchema = {
  query: joi.object({
    providerId: joi.string().required().length(24).hex().messages({
      "any.required": "Provider Id is required",
      "string.length": "Provider Id must be 24 characters long",
      "string.hex": "Provider Id must be a valid MongoDB ObjectId",
      "string.empty": "Provider Id cannot be empty",
    }),
  }),

  body: joi
    .object({
      name: joi.string().optional().trim().messages({
        "string.base": "Name must be a string",
      }),

      credential: joi.string().optional().trim().messages({
        "string.base": "Credential must be a string",
      }),

      clinicRole: joi
        .string()
        .optional()
        // .valid(...Object.values(ClinicRole))
        .messages({
          "any.only": "Clinic role must be one of: qsp, Level 1, Level 2",
        }),

      systemRole: joi
        .string()
        .optional()
        .valid(...Object.values(SystemRoles))
        .messages({
          "any.only": "Invalid system role",
        }),

      email: joi
        .string()
        .optional()
        .email({ tlds: { allow: false } })
        .messages({
          "string.email": "Email must be valid",
        }),

      phone: joi
        .string()
        .optional()
        .pattern(/^[0-9]{5,15}$/)
        .messages({
          "string.pattern.base": "Phone must be 5–15 digits",
        }),

      countryCode: joi.string().optional().messages({
        "string.base": "Country code must be a string",
      }),

      licenseNumber: joi.string().optional().trim().messages({
        "string.base": "License number must be a string",
      }),

      permissions: joi
        .array()
        .optional()
        .items(joi.string().valid(...Object.values(Permission)))
        .messages({
          "array.base": "Permissions must be an array",
          "any.only": "One or more permissions are invalid",
        }),
    })
    .min(1)
    .messages({
      "object.min": "At least one field is required to update",
    }),
};

const updateClientSchema = {
  query: joi.object({
    clientId: joi.string().length(24).hex().required().messages({
      "any.required": "clientId is required",
      "string.length": "clientId must be 24 characters long",
      "string.hex": "clientId must be a valid MongoDB ObjectId",
      "string.empty": "clientId cannot be empty",
    }),
  }),

  body: joi.object({
    name: joi.string().messages({
      "string.base": "Name must be a string",
    }),

    dob: joi.date().messages({
      "date.base": "Invalid date format for dob",
    }),

    diagnosis: joi.string().messages({
      "string.base": "Diagnosis must be a string",
    }),

    parentName: joi.string().messages({
      "string.base": "Parent name must be a string",
    }),

    email: joi.string().email().messages({
      "string.email": "Email must be valid",
    }),

    phone: joi.string().messages({
      "string.base": "Phone must be a string",
    }),

    countryCode: joi.string().messages({
      "string.base": "Country code must be a string",
    }),

    assignedProvider: joi
      .array()
      .items(
        joi.string().length(24).hex().messages({
          "string.length": "Each assigned provider must be 24 characters long",
          "string.hex": "Each assigned provider must be a valid ObjectId",
        })
      )
      .messages({
        "array.base": "Assigned providers must be an array of ObjectIds",
      }),

    qsp: joi.string().length(24).hex().messages({
      "string.length": "QSP must be 24 characters long",
      "string.hex": "QSP must be a valid ObjectId",
    }),

    clinicalSupervisor: joi.string().length(24).hex().messages({
      "string.length": "Clinical Supervisor must be 24 characters long",
      "string.hex": "Clinical Supervisor must be a valid ObjectId",
    }),

    reviewDate: joi.date().messages({
      "date.base": "Review date must be a valid date",
    }),

    organizationId: joi.string().length(24).hex().messages({
      "string.length": "OrganizationId must be 24 characters long",
      "string.hex": "OrganizationId must be a valid ObjectId",
    }),
  }),
};

const setUpProviderAccountSchema = {
  body: joi.object({
    token: joi.string().required(),
    password: joi.string().required(),
  }),
};

const addGoalBankSchema = {
  body: joi.object({
    category: joi
      .string()
      .valid(...Object.values(GoalBankCategory))
      .required()
      .messages({
        "string.base": "Category must be a string.",
        "any.only": "Invalid category value.",
        "any.required": "Category is required.",
      }),

    discription: joi.string().trim().min(2).optional().messages({
      "string.base": "Description must be a string.",
      "string.empty": "Description cannot be empty.",
      "string.min": "Description must be at least 2 characters.",
      "any.required": "Description is required.",
    }),
    masteryBaseline: joi
          .number()
          .min(0)
          .max(100)
          .required()
          .messages({
            "number.base": "Mastery Baseline must be a number.",
            "number.min": "Mastery Baseline must be at least 1.",
            "number.max": "Mastery Baseline cannot exceed 100.",
            "any.required": "Mastery Baseline is required.",
          }),

   criteriaForMastry: joi
      .object({
        masteryPercentage: joi
          .number()
          .min(1)
          .max(100)
          .required()
          .messages({
            "number.base": "Mastery percentage must be a number.",
            "number.min": "Mastery percentage must be at least 1.",
            "number.max": "Mastery percentage cannot exceed 100.",
            "any.required": "Mastery percentage is required.",
          }),

        acrossSession: joi
          .number()
          .min(1)
          .required()
          .messages({
            "number.base": "Across session must be a number.",
            "number.min": "Across session must be at least 1.",
            "any.required": "Across session is required.",
          }),

        supportLevel: joi
          .string()
          .valid(
            SupportLevel.Independent,
            SupportLevel.Minimal,
            SupportLevel.Moderate
          )
          .required()
          .messages({
            "any.only": "Invalid support level.",
            "any.required": "Support level is required.",
          }),
      })
      .required()
      .messages({
        "object.base": "criteriaForMastry must be an object.",
        "any.required": "criteriaForMastry is required.",
      }),
  }),
};

 const editGoalBankSchema = {
  query: joi.object({
    goalId: joi
      .string()
      .hex()
      .length(24)
      .required()
      .messages({
        "string.base": "goalId must be a string.",
        "string.hex": "goalId must contain only valid hexadecimal characters.",
        "string.length": "goalId must be exactly 24 characters long (MongoDB ObjectId).",
        "any.required": "goalId is required.",
      }),
  }),

  body: joi.object({
    category: joi
      .string()
      .valid(...Object.values(GoalBankCategory))
      .messages({
        "string.base": "Category must be a string.",
        "any.only": "Invalid category value.",
      }),

    discription: joi
      .string()
      .trim()
      .min(2)
      .messages({
        "string.base": "Description must be a string.",
        "string.empty": "Description cannot be empty.",
        "string.min": "Description must be at least 2 characters long.",
      }),

    criteriaForMastry: joi
      .object({
        masteryPercentage: joi
          .number()
          .min(1)
          .max(100)
          .messages({
            "number.base": "Mastery percentage must be a number.",
            "number.min": "Mastery percentage must be at least 1.",
            "number.max": "Mastery percentage cannot exceed 100.",
          }),

        acrossSession: joi
          .number()
          .min(1)
          .messages({
            "number.base": "Across session must be a number.",
            "number.min": "Across session must be at least 1.",
          }),

        supportLevel: joi
          .string()
          .valid(
            SupportLevel.Independent,
            SupportLevel.Minimal,
            SupportLevel.Moderate
          )
          .messages({
            "string.base": "Support level must be a string.",
            "any.only": "Invalid support level.",
          }),
      })
      .messages({
        "object.base": "criteriaForMastry must be an object.",
      }),
  }),
};

const  getClientProfileSchema = {
  query: joi.object({
     clientId : joi.string().required().length(24).hex().messages({
        "string.base": "Client Id must be a string.",
        "string.hex": "Client Id must contain only valid hexadecimal characters.",
        "string.length": "Client Id must be exactly 24 characters long (MongoDB ObjectId).",
        "any.required": "Client Id is required.",
        "string.empty":"Client Id cannot be empty"
      }),
  })
}

const addItpGoalsToClientSchema = {
  body: joi.object({
     goalId: joi.string().required().length(24).hex().messages({
        "string.base": "goal Id must be a string.",
        "string.hex": "goal Id must contain only valid hexadecimal characters.",
        "string.length": "goal Id must be exactly 24 characters long (MongoDB ObjectId).",
        "any.required": "goal Id is required.",
        "string.empty":"goal Id cannot be empty"
      }), 
       clientId:joi.string().required().length(24).hex().messages({
        "string.base": "client Id must be a string.",
        "string.hex": "client Id must contain only valid hexadecimal characters.",
        "string.length": "client Id must be exactly 24 characters long (MongoDB ObjectId).",
        "any.required": "client Id is required.",
        "string.empty":"client Id cannot be empty"
      }),
      targetDate:joi.date().iso().greater("now").required().messages({
      "date.base": "Target Date must be a valid date.",
      "date.less": "Target Date must be in the future.",
      "any.required": "Target Date is required.",
    }),
    baselinePercentage: joi.number()
  .strict()
  .min(1)
  .max(100)
  .required()
  .messages({
    "number.base": "Baseline percentage must be a valid number.",
    "number.min": "Baseline percentage must be at least 1.",
    "number.max": "Baseline percentage must not exceed 100.",
    "any.required": "Baseline percentage is required.",
  })

  })
}
const viewPermissionSchema = {
   query: joi.object({
     providerId : joi.string().required().length(24).hex().messages({
        "string.base": "Provider Id must be a string.",
        "string.hex": "Provider Id must contain only valid hexadecimal characters.",
        "string.length": "Provider Id must be exactly 24 characters long (MongoDB ObjectId).",
        "any.required": "Provider Id is required.",
        "string.empty":"Provider Id cannot be empty"
      }),
  })
}

export const providerSchema = {
  loginSchema,
  verifyOtpSchema,
  sendOtpSchema,
  addClientSchema,
  createProviderSchema,
  updateProviderSchema,
  updateClientSchema,
  setUpProviderAccountSchema,
  addGoalBankSchema,
  editGoalBankSchema,
  getClientProfileSchema,
  addItpGoalsToClientSchema,
  viewPermissionSchema
};
