import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import authorization from "../middleware/permission.middleware.js";
import { Permission } from "../utils/enums/enums.js";
import { validate } from "../middleware/validate.middleware.js";
import { sessionController } from "../controller/session.controller.js";
import { sessionSchema } from "../schema/session.schema.js";
import auditLogs from "../middleware/auditLogs.middleware.js";

const router = express.Router();

router.post(
  "/start",
  auth,
  authorization(Permission?.EnterSessionData),
  auditLogs,
  validate(sessionSchema.startSessionSchema),
  sessionController.startSession
);

router.post(
  "/collect",
  auth,
  authorization(Permission?.CollectFEDCData),
  auditLogs,
  validate(sessionSchema.collectSessionDataSchema),
  sessionController.collectSessionData
);

router.get(
  "/view",
  auth,
  authorization(Permission.ViewAllSessions),
  auditLogs,
  sessionController.viewAllSessions
);
router.get(
  "/client",
  auth,
  authorization(Permission.ViewSessionData),
  validate(sessionSchema.viewClientSessionsSchema),
  sessionController.viewClientSessions
);

router.post(
  "/notes",
  auth,
  authorization(Permission?.GenerateAINotes),
  auditLogs,
  validate(sessionSchema?.buildAIRequestSchema),
  sessionController.buildAIRequest
);

router.put(
  "/report",
  auth,
  authorization(Permission?.GenerateAINotes),
  validate(sessionSchema?.saveSignatureToReportSchema),
  sessionController?.saveSignatureToReport
);

router.delete(
  "/abandon",
  auth,
  validate(sessionSchema.abandonSessionschema),
  sessionController.abandonSession
);

router.post(
  "/addActivity",
  auth,
  validate(sessionSchema?.addActivitySchema),
  sessionController.addActivity
);
router.post(
  "/addSupport",
  auth,
  validate(sessionSchema?.addSupportSchema),
  sessionController.addSupport
);
router.get("/activity", auth, sessionController.getActivities);
router.get("/support", auth, sessionController.getSupports);

router.post(
  "/saveReport",
  auth,
  validate(sessionSchema.createReportSchema),
  sessionController.createReport
);

export default router;
