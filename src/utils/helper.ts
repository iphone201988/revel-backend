import mongoose from "mongoose";
import nodemailer from "nodemailer";
import randomstring from "randomstring";
import puppeteer from "puppeteer";
import handlebars from "handlebars";
import { readFile } from "fs/promises";
import path from "path";

import { GoalStatus, Permission } from "./enums/enums.js";
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
  Permission.QspSignatureRequired
]



// auditRouteMap.ts
import { AuditAction, AuditResource } from './enums/enums.js'

export const auditRouteMap: Record<string, {
  action: AuditAction;
  resource: AuditResource;
}> = {

  // AUTH
 
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
  "POST /api/provider/sendLink": {
    action: AuditAction.UPDATE_PROVIDER,
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
  "DELETE /api/provider/deleteGoal": {
    action: AuditAction.EDIT_GOAL_BANK,
    resource: AuditResource.GOAL,
  },
  "EDIT /api/provider/editGoalBank": {
    action: AuditAction.EDIT_GOAL_BANK,
    resource: AuditResource.GOAL,
  },
  //LOGS
  "GET /api/logs/view": {
    action: AuditAction.VIEW_LOGS,
    resource: AuditResource.AUDIT
  },
  "GET /api/logs/statistics": {
    action: AuditAction.VIEw_STATS,
    resource: AuditResource.AUDIT
  },


  //Session
  "POST /api/session/start": {
    action: AuditAction.START_SESSION,
    resource: AuditResource.SESSION
  },
  "GET /api/session/view": {
    action: AuditAction.VIEW_SESSIONS,
    resource: AuditResource.SESSION
  },
  "POST /api/session//notes": {
    action: AuditAction.GENERATE_NOTES,
    resource: AuditResource.SESSION
  },

  //Export
  'POST /api/download/fedec': {
    action: AuditAction.EXPORT,
    resource: AuditResource.EXPORT
  },
  'POST /api/download/sessionTrends': {
    action: AuditAction.EXPORT,
    resource: AuditResource.EXPORT
  },
  'POST /api/download/breakDown': {
    action: AuditAction.EXPORT,
    resource: AuditResource.EXPORT
  },
  'POST /api/download/sessionNote': {
    action: AuditAction.EXPORT,
    resource: AuditResource.EXPORT
  },
  'POST /api/download/goalReview': {
    action: AuditAction.EXPORT,
    resource: AuditResource.EXPORT
  },
  'POST /api/download/audits': {
    action: AuditAction.EXPORT,
    resource: AuditResource.EXPORT
  },

};

import { Request } from "express";
import GoalBank from "../models/goalbank.model.js";
import DataCollection from "../models/sessionData.model.js";
import Client from "../models/client.model.js";

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

export const checkAndUpdateGoalMastery = async (
  clientId: string,
  goalId: string
) => {
  // 1. Get mastery criteria
  const goalBank = await GoalBank.findById(goalId);
  if (!goalBank?.criteriaForMastry) return;

  const { masteryPercentage, acrossSession, supportLevel } =
    goalBank.criteriaForMastry;

  // Determine which support level key to look for in usage data
  // Schema uses: independent, minimal, modrate (typo in schema)
  let supportKey = "independent";
  if (supportLevel === "Moderate") supportKey = "modrate";
  else if (supportLevel === "Minimal") supportKey = "minimal";

  // 2. Get last N session records for this goal
  const sessions = await DataCollection.aggregate([
    { $match: { clientId: new mongoose.Types.ObjectId(clientId) } },
    { $unwind: "$goals_dataCollection" },
    {
      $match: {
        "goals_dataCollection.goalId": new mongoose.Types.ObjectId(goalId),
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: acrossSession || 3 }, // Default to 3 if not set
    {
      $project: {
        // Get the specific support level data
        data: `$goals_dataCollection.supportLevel.${supportKey}`,
      },
    },
  ]);

  // 3. Check session count
  // If we don't have enough sessions to check 'acrossSession' criteria, we can't master it yet
  if (sessions.length < (acrossSession || 3)) return;

  // 4. Calculate average accuracy for the REQUIRED support level
  // Each session doc acts as one data point
  const sessionAccuracies = sessions
    .map((s) => {
      const d = s.data;
      if (!d || !d.count || d.count === 0) return null; // No data for this support level in this session
      return (d.success / d.count) * 100;
    })
    .filter((acc) => acc !== null) as number[];

  // If we filtered out sessions (e.g. goal was attempted but not at this support level), 
  // do we still count it? Strict mastery usually requires N consecutive sessions meeting criteria.
  // If a session didn't have data, it breaks the streak or doesn't count. 
  // For now assuming we need valid data in all N sessions.
  if (sessionAccuracies.length < (acrossSession || 3)) return;

  const avgAccuracy =
    sessionAccuracies.reduce((sum, acc) => sum + acc, 0) /
    sessionAccuracies.length;

  // 5. Mastery check
  if (avgAccuracy >= masteryPercentage) {
    await Client.updateOne(
      {
        _id: clientId,
        "itpGoals.goal": goalId,
      },
      {
        $set: {
          "itpGoals.$.goalStatus": GoalStatus.Mastered,
          "itpGoals.$.successRate": Math.round(avgAccuracy),
          "itpGoals.$.date": new Date(),
        },
      }
    );
  }
};




interface SupportLevelData {
  count: number;
  success: number;
  missed?: number;
  miss?: number;
}

interface SupportLevels {
  independent: SupportLevelData;
  minimal: SupportLevelData;
  modrate: SupportLevelData;
}

/**
 * Calculate percentage for a specific support level
 */
export const calculateSupportLevelPercentage = (
  supportLevel: SupportLevels,
  type: "independent" | "minimal" | "modrate"
): number => {
  const data = supportLevel[type];
  if (!data || data.count === 0) return 0;
  return Math.round((data.success / data.count) * 100);
};

/**
 * Calculate all support level percentages
 */
export const calculateAllSupportLevels = (
  supportLevel: SupportLevels
): {
  independent: number;
  minimal: number;
  moderate: number;
} => {
  return {
    independent: calculateSupportLevelPercentage(supportLevel, "independent"),
    minimal: calculateSupportLevelPercentage(supportLevel, "minimal"),
    moderate: calculateSupportLevelPercentage(supportLevel, "modrate"),
  };
};

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / values.length);
};

/**
 * Determine goal status based on performance and criteria
 */
export const determineGoalStatus = (
  currentPerformance: number,
  targetPercentage: number,
  sessionCount: number,
  requiredSessions: number = 3,
  existingStatus?: string
): string => {
  if (existingStatus === GoalStatus.Discontinued) return GoalStatus.Discontinued;
  if (existingStatus === GoalStatus.Mastered) return GoalStatus.Mastered;

  if (
    currentPerformance >= targetPercentage &&
    sessionCount >= requiredSessions
  ) {
    return GoalStatus.Mastered;
  }

  return GoalStatus.InProgress;
};

/**
 * Format date for display
 */
export const formatSessionDate = (date: Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Sort FEDC observations by level
 */
export const sortFEDCObservations = (
  observations: Array<{ fedc: string; observations: number; percentage: number }>
): Array<{ fedc: string; observations: number; percentage: number }> => {
  return observations.sort((a, b) => {
    const aNum = parseInt(a.fedc.replace(/\D/g, ""));
    const bNum = parseInt(b.fedc.replace(/\D/g, ""));
    return aNum - bNum;
  });
};

/**
 * Get goal color based on index
 */
export const getGoalColor = (index: number): string => {
  const colors = ["#395159", "#6B8E95", "#9BBBC1", "#4A7C88", "#2E4A52", "#5A9AAA"];
  return colors[index % colors.length];
};

/**
 * Calculate trend direction (improving, declining, stable)
 */
export const calculateTrend = (
  sessionData: Array<{ accuracy: number }>
): "improving" | "declining" | "stable" => {
  if (sessionData.length < 2) return "stable";

  const recentSessions = sessionData.slice(-3);
  const olderSessions = sessionData.slice(0, Math.min(3, sessionData.length - 3));

  if (olderSessions.length === 0) return "stable";

  const recentAvg = calculateAverage(recentSessions.map((s) => s.accuracy));
  const olderAvg = calculateAverage(olderSessions.map((s) => s.accuracy));

  const difference = recentAvg - olderAvg;

  if (difference > 5) return "improving";
  if (difference < -5) return "declining";
  return "stable";
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: Date,
  endDate: Date
): { valid: boolean; error?: string } => {
  if (startDate > endDate) {
    return { valid: false, error: "Start date must be before end date" };
  }

  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 365) {
    return {
      valid: false,
      error: "Date range cannot exceed 365 days",
    };
  }

  return { valid: true };
};

/**
 * Check if session has client variables (for marking with red dots)
 */
export const hasClientVariables = (observation: string): boolean => {
  if (!observation) return false;

  const keywords = [
    "illness",
    "sick",
    "cold",
    "medication",
    "sleep",
    "tired",
    "meltdown",
    "disruption",
    "behavioral",
    "challenge",
  ];

  const lowerObs = observation.toLowerCase();
  return keywords.some((keyword) => lowerObs.includes(keyword));
};

/**
 * Aggregate support level data across multiple sessions
 */
export const aggregateSupportLevels = (
  sessions: Array<{ supportLevel: SupportLevels }>
): {
  independent: { total: number; success: number };
  minimal: { total: number; success: number };
  moderate: { total: number; success: number };
} => {
  const aggregated = {
    independent: { total: 0, success: 0 },
    minimal: { total: 0, success: 0 },
    moderate: { total: 0, success: 0 },
  };

  sessions.forEach((session) => {
    if (session.supportLevel) {
      aggregated.independent.total += session.supportLevel.independent.count || 0;
      aggregated.independent.success += session.supportLevel.independent.success || 0;

      aggregated.minimal.total += session.supportLevel.minimal.count || 0;
      aggregated.minimal.success += session.supportLevel.minimal.success || 0;

      aggregated.moderate.total += session.supportLevel.modrate.count || 0;
      aggregated.moderate.success += session.supportLevel.modrate.success || 0;
    }
  });

  return aggregated;
};




export function buildPieGradient(fedcDistribution: any[]) {
  let start = 0;

  return fedcDistribution
    .map(item => {
      const end = start + item.value;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    })
    .join(", ");
}

export function buildSessionStats(data: any[]) {
  const totalSessions = data.reduce((s, d) => s + d.sessions, 0);
  const totalHours = data.reduce((s, d) => s + d.hours, 0);

  const avgSessions = Math.round(totalSessions / data.length);
  const peak = data.reduce((a, b) => (b.sessions > a.sessions ? b : a));

  return {
    totalSessions,
    totalHours: totalHours.toFixed(1),
    averageSessions: avgSessions,
    peakMonth: peak.month,
    peakSessions: peak.sessions
  };
}

export function normalizeSessionTrends(data: any[]) {
  const maxSessions = Math.max(...data.map(d => d.sessions));
  const maxHours = Math.max(...data.map(d => d.hours));

  return data.map(d => ({
    ...d,
    sessions: Math.round((d.sessions / maxSessions) * 100),
    hours: Math.round((d.hours / maxHours) * 100)
  }));
}
const COLORS = ["#395159", "#5a7a85", "#8ba3ad", "#b7c7cf"];

export function prepareDiagnosisData(data: any[]) {
  return data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }));
}


export function buildDiagnosisStats(data: any[]) {
  const totalCases = data.reduce((s, d) => s + d.count, 0);
  const primary = data.reduce((a, b) =>
    b.count > a.count ? b : a
  );

  return {
    totalCases,
    uniqueDiagnoses: data.length,
    primaryDiagnosis: primary.diagnosis,
    primaryPercentage: primary.percentage
  };
}



export function generateAuditCSV(logs) {
  if (!logs.length) return "";

  const headers = [
    "Timestamp",
    "User Name",
    "User Email",
    "Action",
    "Resource",
    "Status",
    "IP Address"
  ];

  const rows = logs.map(log => [
    log.timestamp,
    log.userName,
    log.userEmail,
    log.action,
    log.resource,
    log.status,
    log.ipAddress
  ].map(value =>
    `"${String(value ?? "").replace(/"/g, '""')}"`
  ).join(","));

  return [headers.join(","), ...rows].join("\n");
}