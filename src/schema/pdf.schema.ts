import joi from 'joi'


const goalReviewReportSchema = { 
    body:joi.object({
        clientId: joi.string().required().length(24).hex().messages({
          "string.base": "Client Id must be a string.",
          "string.hex":
            "Client Id must contain only valid hexadecimal characters.",
          "string.length":
            "Client Id must be exactly 24 characters long (MongoDB ObjectId).",
          "any.required": "Client Id is required.",
          "string.empty": "Client Id cannot be empty",
        }),
      }),
}
const sessionDownloadSchema = { 
    query:joi.object({
        goalBankId: joi.string().required().length(24).hex().messages({
          "string.base": "Client Id must be a string.",
          "string.hex":
            "Client Id must contain only valid hexadecimal characters.",
          "string.length":
            "Client Id must be exactly 24 characters long (MongoDB ObjectId).",
          "any.required": "Client Id is required.",
          "string.empty": "Client Id cannot be empty",
        }),
      }),
}


 const downloadSelectedSessionsSchema = joi.object({
  sessionIds: joi.array()
    .items(
      joi.string()
        .trim()
        .length(24)
        .hex()
        .required()
        .messages({
          "string.base": "Each session ID must be a string",
          "string.empty": "Session ID cannot be empty",
          "string.length": "Session ID must be exactly 24 characters",
          "string.hex": "Session ID must be a valid MongoDB ObjectId",
          "any.required": "Session ID is required",
        })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Session IDs must be sent as an array",
      "array.min": "At least one session must be selected",
      "any.required": "Session IDs are required",
    }),
})
  .required()
  .messages({
    "object.base": "Invalid request payload",
    "any.required": "Request body is required",
  });


export const pdfSchema = {
    goalReviewReportSchema,
    sessionDownloadSchema,
    downloadSelectedSessionsSchema
}