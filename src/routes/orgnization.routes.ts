import express from "express";
import { orgController } from "../controller/organization.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { orgSchema } from "../schema/organization.schema.js";
import auditLogs from "../middleware/auditLogs.middleware.js";
import { auth } from "../middleware/auth.middleware.js";
import { submitSupportTicket } from "../controller/supportTicket.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post(
  "/register",
  validate(orgSchema.orgRegisterSchema),

  orgController.registerOrganization
);

router.get(
  "/overview",
  auth,
  validate(orgSchema.getReportsOverviewSchema),
  orgController.getReportsOverview
);
router.get(
  "/client-progress",
  auth,
  validate(orgSchema.getClientProgressReportsSchema),
  orgController.getClientProgressReports
);
router.get(
  "/provider-activity",
  auth,
  validate(orgSchema.getProviderActivityReportsSchema),
  orgController.getProviderActivityReports
);

router.post('/submit', 
    auth,
    upload.single('image'),
    validate(orgSchema.submitSupportTicketSchema),
    submitSupportTicket
)

export default router;
