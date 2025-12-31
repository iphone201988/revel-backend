import express, { Router } from "express";
import { providerController } from "../controller/provider.controller.js";
import { providerSchema } from "../schema/provider.schema.js";
import { validate } from "../middleware/validate.middleware.js";
import { auth } from "../middleware/auth.middleware.js";
import authorization from "../middleware/permission.middleware.js";
import { Permission } from "../utils/enums/enums.js";
import auditLogs from "../middleware/auditLogs.middleware.js";

const router = express.Router();

router.post(
  "/login",
  validate(providerSchema.loginSchema),
  auditLogs,
  providerController.login,
  auditLogs
);
router.get("/profile", auth, auditLogs, providerController.getUserProfile);
router.put(
  "/verify",
  validate(providerSchema.verifyOtpSchema),
  providerController.verifyOtp
);

router.put(
  "/send",
  validate(providerSchema.sendOtpSchema),
  providerController.sendOtp
);

router.get(
  "/getClients",
  auth,
  authorization(Permission?.ViewAllClients),
  auditLogs,
  providerController.getClients
);

router.post(
  "/addClient",
  auth,
  authorization(Permission.AddEditClients),
  validate(providerSchema.addClientSchema),
  auditLogs,
  providerController.addClient
);
router.put(
  "/updateClient",
  auth,
  authorization(Permission.AddEditClients),
  validate(providerSchema.updateClientSchema),
  auditLogs,
  providerController.updateClient
);
router.get(
  "/getProviders",
  auth,
  authorization(Permission?.ViewAllClients),
  auditLogs,
  providerController?.getProviders
);

router.post(
  "/addProvider",
  auth,
  authorization(Permission.ManageProviders),
  validate(providerSchema.createProviderSchema),
  auditLogs,
  providerController.addProvider
);
router.post(
  "/set-password",
  validate(providerSchema.setUpProviderAccountSchema),
  providerController.setUpProviderAccount
);

router.put(
  "/updatePro",
  auth,
  authorization(Permission.ManagePermissions),
  validate(providerSchema.updateProviderSchema),
  auditLogs,
  providerController.updateProvider
);

router.get(
  "/viewPermission",
  auth,
  authorization(Permission.ManagePermissions),
  validate(providerSchema.viewPermissionSchema),
  auditLogs,
  providerController.viewPermission
);

router.put(
  "/update-permissions",
  auth,
  authorization(Permission.ManagePermissions),
  validate(providerSchema.updatePermissionsSchema),
  providerController.updateProviderPermissions
 
);


router.post(
  "/addGoal",
  auth,
  authorization(Permission.AddClientGoals),
  validate(providerSchema.addGoalBankSchema),
  auditLogs,
  providerController.addGoalBank
);

router.get(
  "/goal",
  auth,
  authorization(Permission.ViewGoalBank),
  auditLogs,
  providerController.viewGoalBank
);
router.put(
  "/editGoalBank",
  auth,
  authorization(Permission.EditGoalBank),
  validate(providerSchema.editGoalBankSchema),
  auditLogs,
  providerController.editGoalBank
);
router.delete(
  '/deleteGoal',
  auth,
  authorization(Permission.EditGoalBank),
  validate(providerSchema.deleteGoalSchema),
  providerController.deleteGoal
)
router.get(
  "/clientProfile",
  auth,
  validate(providerSchema.getClientProfileSchema),
  auditLogs,
  providerController.getClientProfie
);

router.post(
  "/addClientGoal",
  auth,
  authorization(Permission.AddClientGoals),
  validate(providerSchema.addItpGoalsToClientSchema),
  auditLogs,
  providerController.addItpGoalsToClient
); 

router.put("/logout", auth, auditLogs, providerController.logOut);

router.get("/assigned", auth, providerController.getAssignedClients);


router.put('/update-itp', 
  auth,
   authorization(Permission.AddEditClients),
  validate(providerSchema.updateClientItpGoalSchema),
  auditLogs,
  providerController.updateClientItpGoal
 )

 router.get('/archived',
  auth,
  validate(providerSchema.getArchivedGoalSchema),
  providerController.getArchivedGoals
 )

 router.get('/progressReport', 
  auth,
  authorization(Permission.ViewProgressReports),
  validate(providerSchema.getArchivedGoalSchema),
  providerController.progressReport
 )
router.get('/goalProgress',
  auth,
  validate(providerSchema.getArchivedGoalSchema),
  providerController.progressReport
 )
 

 router.put('/updateStatus', 
  auth,
  validate(providerSchema.updateGoalStatusSchema),
  providerController.updateGoalStatus
 )

export default router;
