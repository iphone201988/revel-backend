import mongoose from "mongoose";
import nodemailer from "nodemailer";
import randomstring from "randomstring";
import { Permission } from "./enums/enums.js";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
export const sendMail = async (to, subject, text, html) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: text,
    html: html,
  });
  console.log("Message sent:", info.messageId);
};

export const generateOtp = (length: number = 6): number => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const connectDb = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URL);
    return connection;
  } catch (error) {
    console.log("Connection Error", error);
  }
};

export const generateRandomString = () => {
  return randomstring.generate({
    length: 20,
    charset: "alphabetic",
  });
};

export const defaultAdminPermissions = [
  Permission.ViewAssignedClients,
  Permission.ViewAllClients,
  Permission.AddEditClients,
  Permission.ViewSessionData,
  Permission.ViewAllSessions,
  Permission.EnterSessionData,
  Permission.CollectFEDCData,
  Permission.AddClientGoals,
  Permission.EditMasteryCriteria,
  Permission.ViewGoalBank,
  Permission.EditGoalBank,
  Permission.ScheduleSessions,
  Permission.ViewProgressReports,
  Permission.ExportData,
  Permission.AccessAdmin,
];

export const defaultUserPermissions = [
    Permission.ViewAssignedClients,
        Permission.ViewSessionData,
        Permission.EnterSessionData,
        Permission.CollectFEDCData,
        Permission.ViewGoalBank,
        Permission.ScheduleSessions,
]



// auditRouteMap.ts
import { AuditAction, AuditResource } from './enums/enums.js'

export const auditRouteMap: Record<string, {
  action: AuditAction;
  resource: AuditResource;
}> = {

  // AUTH
  "POST /api/provider/login": {
    action: AuditAction.PROVIDER_LOGIN,
    resource: AuditResource.AUTH,
  },
  "PUT /api/provider/logout": {
    action: AuditAction.PROVIDER_LOGOUT,
    resource: AuditResource.AUTH,
  },
  "PUT /api/provider/send": {
    action: AuditAction.SEND_OTP,
    resource: AuditResource.AUTH,
  },
  "PUT /api/provider/verify": {
    action: AuditAction.VERIFY_OTP,
    resource: AuditResource.AUTH,
  },

  // PROVIDER
  "GET /api/provider/profile": {
    action: AuditAction.VIEW_PROVIDER_PROFILE,
    resource: AuditResource.PROVIDER,
  },
  "GET /api/provider/getProviders": {
    action: AuditAction.VIEW_PROVIDERS,
    resource: AuditResource.PROVIDER,
  },
  "POST /api/provider/addProvider": {
    action: AuditAction.CREATE_PROVIDER,
    resource: AuditResource.PROVIDER,
  },

  // CLIENT
  "GET /api/provider/getClients": {
    action: AuditAction.VIEW_CLIENTS,
    resource: AuditResource.CLIENT,
  },
  "POST /api/provider/addClient": {
    action: AuditAction.CREATE_CLIENT,
    resource: AuditResource.CLIENT,
  },
  "PUT /api/provider/updateClient": {
    action: AuditAction.UPDATE_CLIENT,
    resource: AuditResource.CLIENT,
  },

  // GOAL
  "POST /api/provider/addGoal": {
    action: AuditAction.ADD_GOAL_BANK,
    resource: AuditResource.GOAL,
  },
  //LOGS
  "GET /api/logs/view":{
    action: AuditAction.VIEW_LOGS,
    resource : AuditResource.AUDIT
  },
  "GET /api/logs/statistics":{
    action: AuditAction.VIEw_STATS,
    resource : AuditResource.AUDIT
  },

//Session
  "POST /api/session/start":{
    action : AuditAction.START_SESSION,
    resource: AuditResource.SESSION
  },
  "GET /api/session/view":{
      action : AuditAction.VIEW_SESSIONS,
    resource: AuditResource.SESSION
  },
  "POST /api/session//notes":{
      action : AuditAction.GENERATE_NOTES,
    resource: AuditResource.SESSION
  },

};

import { Request } from "express";

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];

  // Case 1 → array of IPs
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }

  // Case 2 → string "ip1, ip2"
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  
  // Case 3 → fallback
  return req.socket.remoteAddress || req.ip || "Unknown";
};
