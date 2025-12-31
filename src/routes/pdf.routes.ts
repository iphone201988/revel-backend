import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import auditLogs from "../middleware/auditLogs.middleware.js";
import { pdfController } from "../controller/pdf.controller.js";

import { pdfSchema } from "../schema/pdf.schema.js";
import { validate } from "../middleware/validate.middleware.js";
import authorization from "../middleware/permission.middleware.js";
import { Permission } from "../utils/enums/enums.js";

const router = express.Router();

router.post(
  "/fedec",
  auth,
  authorization(Permission.ExportData),
  auditLogs,
  pdfController.downloadFedcDistributionPdf
);

router.post(
  "/sessionTrends",
  auth,
  authorization(Permission.ExportData),
  auditLogs,
  pdfController.downloadSessionTrendsPdf
);

router.post(
  "/breakDown",
  auth,
  authorization(Permission.ExportData),
  auditLogs,
  pdfController.downloadDiagnosisBreakdownPdf
);
router.post("/sessionNote", auth, auditLogs, pdfController.downloadSessionNote);

router.post(
  "/goalReview",
  auth,
  authorization(Permission.ExportData),
  auditLogs,
  validate(pdfSchema.goalReviewReportSchema),
  pdfController.downloadGoalReviewReport
);

router.post(
  "/audits",
  auth,
  authorization(Permission.ExportData),
  auditLogs,
  pdfController.downloadAuditLogs
);

router.post(
  '/session',
  auth,
  authorization(Permission.ExportData),
  auditLogs,
  validate(pdfSchema.sessionDownloadSchema),
  pdfController.downloadSessionHistory
)

router.post(
  '/selectedSession',
  auth,
  authorization(Permission.ExportData),
  auditLogs,
  validate(pdfSchema.downloadSelectedSessionsSchema),
  pdfController.downloadSelectedSessionHistory
)

export default router;
