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


export const pdfSchema = {
    goalReviewReportSchema,
    sessionDownloadSchema
}