export const SystemRoles = {
  SuperAdmin: "1",
  Admin:'2',
  User: "3",
};

export const Status = {
  Active: "active",
  Closed: "closed",
};
export const ClinicRole = {
  QSP: "QSP",
  Level1:"Level 1",
  Level2: "Level 2"
}
export const User_Status = {
  Active: "active",
  Deleted: "deleted",
};

export const VerficationType = {
  Login: "login",
  Register: "register",
};
export const Permission = {
  // Client Management
  ViewAssignedClients: "ViewAssignedClients",
  ViewAllClients: "ViewAllClients",
  AddEditClients: "AddEditClients",
  DeleteClients: "DeleteClients",

  // Session Data
  ViewSessionData: "ViewSessionData",
  ViewAllSessions: "ViewAllSessions",
  EnterSessionData: "EnterSessionData",
  CollectFEDCData: "CollectFEDCData",

  // Notes & Reports
  GenerateAINotes: "GenerateAINotes",
  EditSignedNotes: "EditSignedNotes",
  EditNarrativeReports: "EditNarrativeReports",

  // Goal Management
  AddClientGoals: "AddClientGoals",
  EditClientGoals: "EditClientGoals",
  EditMasteryCriteria: "EditMasteryCriteria",
  ViewGoalBank: "ViewGoalBank",
  EditGoalBank: "EditGoalBank",

  // Scheduling & Reports
  ScheduleSessions: "ScheduleSessions",
  ViewProgressReports: "ViewProgressReports",
  ExportData: "ExportData",

  // Administration
  AccessAdmin: "AccessAdmin",
  ManageProviders: "ManageProviders",
  ManagePermissions: "ManagePermissions",
};


export const GoalBankCategory =  {
    FEDC_9: "FEDC 9 - Reflective Thinking",
    FEDC_8:"FEDC 8 - Gray Area Thinking",
    FEDC_7:"FEDC 7 - Multi-Causal Thinking",
    FEDC_6:"FEDC 6 - Emotional Thinking",
    FEDC_5:"FEDC 5 - Emotional Ideas",
    FEDC_4:"FEDC 4 - Complex Communication",
    FEDC_3:"FEDC 3 - Two-Way Communication",
    FEDC_2:"FEDC 2 - Engagement & Relating",
    FEDC_1:"FEDC 1 - Shared Attention & Regulation"
}

export const SupportLevel={
   Independent: "Independent",
   Minimal: "Minimal Support",
   Moderate:"Moderate Support"

}

export const SessionType = {
  Progress_Monitoring:"Progress Monitoring",
Baseline_Data_Collection:"Baseline Data Collection"
}





// audit.enums.ts
export enum AuditAction {
  // AUTH
  PROVIDER_LOGIN = "Provider Login",
  PROVIDER_LOGOUT = "Provider Logout",
  SEND_OTP = "Send Otp",
  VERIFY_OTP = "Verify Otp",
  SET_PASSWORD = "Set Password",

  // PROVIDER 
  VIEW_PROVIDER_PROFILE = "View Provider Profile",
  VIEW_PROVIDERS = "View Providers",
  CREATE_PROVIDER = "Create Provider",
  UPDATE_PROVIDER = "Update Provider",
  VIEW_PERMISSION = "View Permission",

  // CLIENT
  VIEW_CLIENTS = "View Clients",
  CREATE_CLIENT = "Create Client",
  UPDATE_CLIENT = "Update Client",
  VIEW_CLIENT_PROFILE = "View Client Profile",

  // GOALS
  ADD_GOAL_BANK = "Add Goal Bank",
  EDIT_GOAL_BANK = "Edit Goal Bank",
  VIEW_GOAL_BANK = "View Goal Bank",
  ADD_CLIENT_GOAL = "Add Client Goal",

  // LOGS
  VIEW_LOGS = "View Audit Logs",
  VIEw_STATS = "View Statistics",

  // SESSION
  START_SESSION = "Start Session",
  VIEW_SESSIONS = "View Sessions",
  GENERATE_NOTES = "Generate Notes",

}

export enum AuditResource {
  AUTH = "Auth",
  PROVIDER = "Provider",
  CLIENT = "Client",
  GOAL = "Goal",
  AUDIT = "Audit Logs",
  SESSION = "Session",
}

