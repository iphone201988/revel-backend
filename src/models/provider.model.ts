import mongoose from "mongoose";
import { ClinicRole, Permission, SystemRoles, User_Status } from "../utils/enums/enums.js";
import bcrypt from "bcrypt";

const providerModel = new mongoose.Schema({
  name: {
    type: String,
  },
  credential: {
    type: String,
  },
  clinicRole: {
    type: String,
    // enum: [ClinicRole.Level1,  ClinicRole.Level2,  ClinicRole.QSP], // qsp , level 1 , level 2
  },
  systemRole: {
    type: String,
    enum: [SystemRoles.SuperAdmin, SystemRoles.Admin, SystemRoles.User],
  },
  email: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
  },
  countryCode: {
    type: String,
  },
  licenseNumber: {
    type: String,
  },
  password: {
    type: String,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
  },
  otp: {
    type: Number,
  },
  otpExpiry: {
    type: Date,
  },
  userStatus: {
    type: String,
    enum: [User_Status.Active, User_Status.Deleted],
    default: User_Status.Active,
  },
  jti: {
    type: String,
  },
  permissions: [
    {
      type: String,
      enum: [
        Permission.ViewAssignedClients,
        Permission.ViewAllClients,
        Permission.AddEditClients,
        Permission.DeleteClients,

        Permission.ViewSessionData,
        Permission.ViewAllSessions,
        Permission.EnterSessionData,
        Permission.CollectFEDCData,

        Permission.GenerateAINotes,
        Permission.EditSignedNotes,
        Permission.EditNarrativeReports,

        Permission.AddClientGoals,
        Permission.EditClientGoals,
        Permission.EditMasteryCriteria,
        Permission.ViewGoalBank,
        Permission.EditGoalBank,

        Permission.ScheduleSessions,
        Permission.ViewProgressReports,
        Permission.ExportData,

        Permission.AccessAdmin,
        Permission.ManageProviders,
        Permission.ManagePermissions,
        Permission.QspSignatureRequired
      ],
      default: [
        Permission.ViewAssignedClients,
        Permission.ViewSessionData,
        Permission.EnterSessionData,
        Permission.CollectFEDCData,
        Permission.ViewGoalBank,
        Permission.ScheduleSessions,
      ],
    },
  ],
  tokenVersion:{
    type:Number,
    default: 0
  },
  stripeCustomerId:{
    type:String
  },
  
});
providerModel.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

const Provider = mongoose.model("Provider", providerModel);
export default Provider;
