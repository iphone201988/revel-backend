import joi, { object } from "joi";
import { SessionType } from "../utils/enums/enums.js";

const startSessionSchema = {
  body: joi
    .object({
      clientId: joi.string().length(24).hex().required().messages({
        "any.required": "Client ID is required.",
        "string.length":
          "Client ID must be a valid 24-character MongoDB ObjectId.",
        "string.hex": "Client ID must be a valid hexadecimal value.",
      }),

      sessionType: joi
        .string()
        .valid(...Object.values(SessionType))
        .required()
        .messages({
          "any.required": "Session type is required.",
          "string.base": "Session type must be a valid string.",
          "string.empty": "Session type cannot be empty.",
          "any.only": "Session type must be one of the allowed values.",
        }),

      dateOfSession: joi.date().required().messages({
        "any.required": "Session date is required.",
        "date.base": "Session date must be a valid date.",
      }),

      startTime: joi.date().required().messages({
        "any.required": "Start time is required.",
        "string.empty": "Start time cannot be empty.",
      }),

      endTime: joi.date().greater("now").required().messages({
        "any.required": "End time is required.",
        "string.empty": "End time cannot be empty.",
      }),

      clientVariables: joi.string().allow("").optional().messages({
        "string.base": "Client variables must be text.",
      }),

      present: joi.string().trim().max(255).optional().messages({
        "string.base": "Presence information must be a text value.",
        "string.max": "Presence information must not exceed 255 characters.",
      }),
    })
    .messages({
      "object.base": "Invalid session payload.",
    }),
};

const collectSessionDataSchema = {
  body: joi.object({
    sessionId: joi.string().required().hex().length(24).messages({
      "string.length": "Must be a valid ObjectId.",
      "string.hex": "Must be a valid hexadecimal ObjectId.",
      "any.required": "Session ID is required.",
    }),
    duration: joi.number().integer().strict().positive().required().messages({
      "number.base": "Duration must be a number.",
      "number.integer": "Duration must be an integer (in seconds).",
      "number.positive": "Duration must be greater than 0 seconds.",
      "any.required": "Duration is required.",
    }),

    providerObservation: joi.string().optional().messages({}), // add messagess....
    clientId: joi.string().required().hex().length(24).messages({
      "any.required": "Client ID is required.",
      "string.length": "Must be a valid ObjectId.",
      "string.hex": "Must be a valid hexadecimal ObjectId.",
    }),
    activityEngaged: joi
      .array()
      .items(
        joi.string().trim().min(1).max(100).messages({
          "string.base": "Each activity must be a text value.",
          "string.empty": "Activity keyword cannot be empty.",
          "string.min": "Activity keyword must contain at least 1 character.",
          "string.max": "Activity keyword must not exceed 100 characters.",
        })
      )
      .optional()
      .messages({
        "array.base": "Activity Engaged must be an array of strings.",
      }),
    supportsObserved: joi
      .array()
      .items(
        joi.string().trim().min(1).max(100).messages({
          "string.base": "Each Support must be a text value.",
          "string.empty": "Support keyword cannot be empty.",
          "string.min": "Support keyword must contain at least 1 character.",
          "string.max": "Support keyword must not exceed 100 characters.",
        })
      )
      .optional()
      .messages({
        "array.base": "Activity Engaged must be an array of strings.",
      }),

    goals_dataCollection: joi
      .array()
      .items(
        joi.object({
          goalId: joi.string().hex().length(24).required().messages({
            "any.required": "Goal ID is required.",
            "string.length": "Must be a valid ObjectId.",
            "string.hex": "Must be a valid hexadecimal ObjectId.",
          }),

          accuracy: joi.number().min(0).max(100).optional().messages({
            "number.base": "Accuracy must be a number.",
            "number.min": "Accuracy cannot be less than 0.",
            "number.max": "Accuracy cannot exceed 100.",
          }),

          supportLevel: joi
            .array()
            .items(
              joi
                .object({
                  independent: joi.number().min(0).optional().messages({
                    "number.base": "Independent support must be a number.",
                    "number.min": "Independent support cannot be negative.",
                  }),

                  minimal: joi.number().min(0).optional().messages({
                    "number.base": "Minimal support must be a number.",
                    "number.min": "Minimal support cannot be negative.",
                  }),

                  modrate: joi.number().min(0).optional().messages({
                    "number.base": "Moderate support must be a number.",
                    "number.min": "Moderate support cannot be negative.",
                  }),
                })
                .min(1)
            )
            .optional()
            .messages({
              "array.base": "Support level must be an array.",
            }),

          counter: joi.number().min(0).optional().messages({
            "number.base": "Counter must be a number.",
            "number.min": "Counter cannot be negative.",
          }),

          time: joi.date().max("now").optional().messages({
            "date.base": "Time must be a valid date.",
            "date.max": "Time cannot be in the future.",
          }),
        })
      )
      .min(1)
      .required()
      .messages({
        "any.required": "Goals data collection is required.",
        "array.min": "At least one goal data entry is required.",
        "array.base": "Goals data collection must be an array.",
      }),
  }),
};
const viewClientSessionsSchema = {
  query: joi.object({
    clientId: joi.string().required().hex().length(24).messages({
      "any.required": "Client ID is required.",
      "string.length": "Must be a valid ObjectId.",
      "string.hex": "Must be a valid hexadecimal ObjectId.",
    }),
  }),
};
const buildAIRequestSchema = {
  query: joi.object({
    sessionId: joi.string().required().hex().length(24).messages({
      "any.required": "Session ID is required.",
      "string.length": "Must be a valid ObjectId.",
      "string.hex": "Must be a valid hexadecimal ObjectId.",
    }),
  }),
};
const saveSignatureToReportSchema = {
  body: joi.object({
    reportId: joi.string().required().hex().length(24).messages({
      "any.required": "Report ID is required.",
      "string.length": "Must be a valid ObjectId.",
      "string.hex": "Must be a valid hexadecimal ObjectId.",
    }),
    signature: joi.string().required().messages({})
  }),
};
export const sessionSchema = {
  startSessionSchema,
  collectSessionDataSchema,
  viewClientSessionsSchema,
  buildAIRequestSchema,
  saveSignatureToReportSchema
};
