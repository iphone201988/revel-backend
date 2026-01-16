import joi, { object } from "joi";
import { SessionType, SupportLevel } from "../utils/enums/enums.js";

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

      endTime: joi.date().required().messages({
        "any.required": "End time is required.",
        "string.empty": "End time cannot be empty.",
      }),

      clientVariables: joi.string().allow("").optional().messages({
        "string.base": "Client variables must be text.",
      }),

      present: joi.string().trim().max(255).optional().allow("").messages({
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

    providerObservation: joi.string().allow("").optional().messages({}), // add messagess....
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
        "array.base": "Supports Observed must be an array of strings.",
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
          total: joi.number().min(1).required().messages({
            "number.base": "Total must be a number.",
            "number.min":
              "Please attempt all Goals, or remove the ones you are not attempting.",
          }),

          //updated code--------
          masteryPercentage: joi.number().min(1).max(100).optional().messages({
            "number.base": "Mastery percentage must be a number.",
            "number.min": "Mastery percentage must be at least 1.",
            "number.max": "Mastery percentage cannot be more than 100.",
          }),

          sessionCount: joi.number().min(1).max(100).optional().messages({
            "number.base": "Session count must be a number.",
            "number.min": "Session count must be at least 1.",
            "number.max": "Session count cannot be more than 100.",
          }),

          masterySupportLevel: joi
            .string()
            .valid(...Object.values(SupportLevel))
            .required()
            .messages({
              "any.required": "Mastery support level is required.",
              "string.base": "Mastery support level must be a string.",
              "any.only": "Mastery support level must be a valid value.",
            }),
//updated code--------
          supportLevel: joi
            .object({
              independent: joi
                .object({
                  count: joi.number().min(0).required().messages({
                    "number.base": "Independent count must be a number.",
                    "number.min": "Independent count cannot be negative.",
                  }),
                  success: joi.number().min(0).required().messages({
                    "number.base": "Independent success must be a number.",
                    "number.min": "Independent success cannot be negative.",
                  }),
                  miss: joi.number().min(0).required().messages({
                    "number.base": "Independent missed must be a number.",
                    "number.min": "Independent missed cannot be negative.",
                  }),
                })
                .optional(),

              minimal: joi
                .object({
                  count: joi.number().min(0).required().messages({
                    "number.base": "Minimal count must be a number.",
                    "number.min": "Minimal count cannot be negative.",
                  }),
                  success: joi.number().min(0).required().messages({
                    "number.base": "Minimal success must be a number.",
                    "number.min": "Minimal success cannot be negative.",
                  }),
                  miss: joi.number().min(0).required().messages({
                    "number.base": "Minimal missed must be a number.",
                    "number.min": "Minimal missed cannot be negative.",
                  }),
                })
                .optional(),

              modrate: joi // ⚠️ matches Mongo schema
                .object({
                  count: joi.number().min(0).required().messages({
                    "number.base": "Moderate count must be a number.",
                    "number.min": "Moderate count cannot be negative.",
                  }),
                  success: joi.number().min(0).required().messages({
                    "number.base": "Moderate success must be a number.",
                    "number.min": "Moderate success cannot be negative.",
                  }),
                  miss: joi.number().min(0).required().messages({
                    "number.base": "Moderate missed must be a number.",
                    "number.min": "Moderate missed cannot be negative.",
                  }),
                })
                .optional(),
            })
            .min(1) // ✅ at least one support level object must exist
            .optional()
            .messages({
              "object.base": "Support level must be an object.",
              "object.min": "At least one support level must be provided.",
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
      // .required()
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
    signature: joi.string().required().messages({}),
  }),
};
const abandonSessionschema = {
  query: joi.object({
    sessionId: joi.string().required().hex().length(24).messages({
      "any.required": "Session ID is required.",
      "string.length": "Must be a valid ObjectId.",
      "string.hex": "Must be a valid hexadecimal ObjectId.",
    }),
  }),
};

const addActivitySchema = joi.object({
  activity: joi.string().trim().min(2).required().messages({
    "string.base": "Activity must be a string",
    "string.empty": "Activity cannot be empty",
    "string.min": "Activity must be at least 2 characters long",
    "any.required": "Activity is required",
  }),
});

const addSupportSchema = joi.object({
  support: joi.string().trim().min(2).required().messages({
    "string.base": "Activity must be a string",
    "string.empty": "Activity cannot be empty",
    "string.min": "Activity must be at least 2 characters long",
    "any.required": "Activity is required",
  }),
});

const createReportSchema = joi.object({
  subjective: joi.string().allow("").messages({
    "string.base": "Subjective note must be a text value",
  }),

  client: joi
    .object({
      name: joi.string().required().messages({
        "string.base": "Client name must be a text value",
        "any.required": "Client name is required",
      }),

      dob: joi.date().required().messages({
        "date.base": "Client date of birth must be a valid date",
        "any.required": "Client date of birth is required",
      }),
    })
    .required(),

  provider: joi
    .object({
      name: joi.string().required().messages({
        "string.base": "Provider name must be a text value",
        "any.required": "Provider name is required",
      }),

      credentail: joi.string().allow("").messages({
        "string.base": "Provider credential must be a text value",
      }),
    })
    .required(),

  session: joi
    .object({
      startTime: joi.date().required().messages({
        "date.base": "Session start time must be a valid date",
        "any.required": "Session start time is required",
      }),

      endTime: joi.date().required().greater(joi.ref("startTime")).messages({
        "date.base": "Session end time must be a valid date",
        "date.greater": "Session end time must be after start time",
        "any.required": "Session end time is required",
      }),
    })
    .required(),

  date: joi.date().required().messages({
    "date.base": "Report date must be a valid date",
    "any.required": "Report date is required",
  }),

  totalDuration: joi.number().min(0).required().messages({
    "number.base": "Total duration must be a number",
    "number.min": "Total duration cannot be negative",
    "any.required": "Total duration is required",
  }),

  clientVariables: joi.string().allow("").messages({
    "string.base": "Client variables must be text",
  }),

  session_context: joi.string().allow("").messages({
    "string.base": "Session context must be text",
  }),

  observations: joi.string().allow("").messages({
    "string.base": "Observations must be text",
  }),

  supportObserved: joi.array().items(joi.string()).messages({
    "array.base": "Support observed must be a list of FEDC levels",
  }),

  activities: joi.array().items(joi.string()).messages({
    "array.base": "Activities must be a list of strings",
  }),

  assessment: joi.string().allow("").messages({
    "string.base": "Assessment must be text",
  }),

  plan: joi.string().allow("").messages({
    "string.base": "Plan must be text",
  }),

  //provider signature
  signature: joi.string().required().messages({
    "string.base": "Signature must be text",
  }),

  status: joi
    .string()
    .valid("DRAFT", "SIGNED", "QSP_REVIEW")
    .required()
    .messages({
      "any.only": "Status must be DRAFT, SIGNED, or QSP_REVIEW",
      "any.required": "Report status is required",
    }),

  orgnaizationId: joi.string().required().hex().length(24).messages({
    "any.required": "Orgnaization ID is required.",
    "string.length": "Must be a valid ObjectId.",
    "string.hex": "Must be a valid hexadecimal ObjectId.",
  }),

  goals: joi
    .array()
    .items(
      joi.object({
        description: joi.string().optional().messages({
          "string.base": "Goal description must be text",
          "any.required": "Goal description is required",
        }),

        accuracy: joi.number().min(0).max(100).required().messages({
          "number.base": "Goal accuracy must be a number",
          "number.min": "Goal accuracy cannot be less than 0",
          "number.max": "Goal accuracy cannot exceed 100",
          "any.required": "Goal accuracy is required",
        }),

        performance: joi.string().allow("").messages({
          "string.base": "Performance must be text",
        }),

        supportLevel: joi.string().allow("").messages({
          "string.base": "Support level must be text",
        }),

        progressSummery: joi.string().allow("").messages({
          "string.base": "Progress summary must be text",
        }),

        successfull: joi.number().min(0).required().messages({
          "number.base": "Successful count must be a number",
          "number.min": "Successful count cannot be negative",
          "any.required": "Successful count is required",
        }),

        missed: joi.number().min(0).required().messages({
          "number.base": "Missed count must be a number",
          "number.min": "Missed count cannot be negative",
          "any.required": "Missed count is required",
        }),
      })
    )
    .required()
    .messages({
      "array.base": "Goals must be an array",
      "any.required": "At least one goal is required",
    }),
});

export const sessionSchema = {
  startSessionSchema,
  collectSessionDataSchema,
  viewClientSessionsSchema,
  buildAIRequestSchema,
  saveSignatureToReportSchema,
  abandonSessionschema,
  addActivitySchema,
  addSupportSchema,
  createReportSchema,
};
