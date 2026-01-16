import { NextFunction, Request, Response } from "express";
import Organization from "../models/organization.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { generateOtp, sendMail } from "../utils/helper.js";
import {
  sendOtpToEmail,
  subjectForSendingMail,
  textForVerifyMail,
} from "../utils/MailTemplate.js";
import {
  activityOptions,
  ClinicRole,
  GoalStatus,
  Permission,
  REPORT_STATUS,
  SessionStatus,
  Status,
  supportsOptions,
  SystemRoles,
  User_Status,
} from "../utils/enums/enums.js";
import Client from "../models/client.model.js";
import Provider from "../models/provider.model.js";
import Session from "../models/session.model.js";
import DataCollection from "../models/sessionData.model.js";
import { Activities } from "../models/activity.model.js";
import { Supports } from "../models/supports.model.js";
import mongoose from "mongoose";
import Report from "../models/notes.model.js";

const registerOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      clinicName,
      ownerFirstName,
      ownerLastName,
      email,
      phone,
      countryCode,
      clinicAddress,
      clinicCity,
      clinicState,
      clinicZip,
      password,
    } = req.body;
    const EMail = email.toLowerCase();
    // find by multiple like same  adddress and same name
    const findOrg = await Organization.findOne({
      ownerEmail: EMail,
      status: Status.Active,
    });
    if (findOrg) {
      return next(new ErrorHandler("Email is already Exist", 400));
    }

    const otp = generateOtp();
    console.log(otp, "otp");

    const html = sendOtpToEmail(otp);
    await sendMail(EMail, subjectForSendingMail(), textForVerifyMail, html);
    const newClinic = new Organization({
      clinicName,
      ownerFirstName,
      ownerLastName,
      ownerEmail: EMail,
      ownerPhone: phone,
      countryCode,
      clinicAddress,
      clinicCity,
      clinicState,
      clinicZip,
      password,
    });
    await newClinic.save();
    const allPermissions = Object.values(Permission).filter(
  (permission) => permission !== Permission.QspSignatureRequired
);
    const provider = new Provider({
      name: ownerFirstName + ' ' + ownerLastName,

      // credential,
      clinicRole: ClinicRole.QSP,
      systemRole: SystemRoles.SuperAdmin,
      email: EMail,
      isVerified: true,
      phone: phone,
      countryCode,
      // licenseNumber,

      password: password,
      otp: otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      organizationId: newClinic._id,
      permissions: allPermissions,
    });
    await provider.save();
    await Activities.create({
      organizationId: newClinic._id,
      activities: activityOptions,
    });

    await Supports.create({
      organizationId: newClinic._id,
      supports: supportsOptions,
    });

    return res.status(200).json({
      success: true,
      message: "Clinic Register Successfully..",
      data: newClinic,
      provider,
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};

/**this */
const getFEDCNumber = (category: string): number => {
  const match = category.match(/FEDC[_\s](\d+)/i);
  return match ? parseInt(match[1]) : 0;
};

/**this */

/**this */
// Get Overview Statistics
const getReportsOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { dateRange } = req.query;

    // Calculate date range
    const daysAgo = parseInt(dateRange as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Total Sessions
    const totalSessions = await Session.countDocuments({
      organizationId: user?.organizationId,
      status: SessionStatus.Active,
      dateOfSession: { $gte: startDate },
    });

    // Total Hours
    const totalTimeResult = await DataCollection.aggregate([
      {
        $match: {
          organizationId: user.organizationId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalTime: { $sum: "$duration" },
        },
      },
    ]);

    const totalTime = totalTimeResult[0]?.totalTime || 0;
    const totalHours = (totalTime / 3600).toFixed(1);

    // Active Clients
    const activeClients = await Client.countDocuments({
      organizationId: user?.organizationId,
      userStatus: User_Status.Active,
    });

    // Active Providers
    const activeProviders = await Provider.countDocuments({
      organizationId: user?.organizationId,
      userStatus: User_Status.Active,
    });

    // FEDC Distribution - Get all active clients with their goals
    const clientsWithGoals = await Client.find({
      organizationId: user.organizationId,
      userStatus: User_Status.Active,
      itpGoals: {
        $elemMatch: { goalStatus: GoalStatus.InProgress },
      },
    }).populate({
      path: "itpGoals.goal",
      select: "category",
    });

    // Count FEDC levels
   const fedcCounts: Record<"1-3" | "4-6" | "7-9", number> = {
  "1-3": 0,
  "4-6": 0,
  "7-9": 0,
};

clientsWithGoals.forEach((client: any) => {
  client.itpGoals?.forEach((itpGoal: any) => {
    if (
      itpGoal.goalStatus === GoalStatus.InProgress &&
      itpGoal.goal?.category
    ) {
      const fedcNum = getFEDCNumber(itpGoal.goal.category);

      if (!fedcNum) return;

      if (fedcNum <= 3) fedcCounts["1-3"]++;
      else if (fedcNum <= 6) fedcCounts["4-6"]++;
      else if (fedcNum <= 9) fedcCounts["7-9"]++;
    }
  });
});

const totalFEDC =
  fedcCounts["1-3"] + fedcCounts["4-6"] + fedcCounts["7-9"];

const fedcData = [
  {
    name: "FEDC 1-3",
    value: totalFEDC ? Math.round((fedcCounts["1-3"] / totalFEDC) * 100) : 0,
    color: "#395159",
  },
  {
    name: "FEDC 4-6",
    value: totalFEDC ? Math.round((fedcCounts["4-6"] / totalFEDC) * 100) : 0,
    color: "#5a7a85",
  },
  {
    name: "FEDC 7-9",
    value: totalFEDC ? Math.round((fedcCounts["7-9"] / totalFEDC) * 100) : 0,
    color: "#8ba3ad",
  },
];


    // Session Trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sessionTrends = await Session.aggregate([
      {
        $match: {
          organizationId: user.organizationId,
          status: SessionStatus.Active,
          dateOfSession: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$dateOfSession" },
            month: { $month: "$dateOfSession" },
          },
          sessions: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get duration data for each month
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formattedTrends = await Promise.all(
      sessionTrends.map(async (item) => {
        const monthStart = new Date(item._id.year, item._id.month - 1, 1);
        const monthEnd = new Date(item._id.year, item._id.month, 0, 23, 59, 59);

        const durationResult = await DataCollection.aggregate([
          {
            $match: {
              organizationId: user.organizationId,
              createdAt: { $gte: monthStart, $lte: monthEnd },
            },
          },
          {
            $group: {
              _id: null,
              totalDuration: { $sum: "$duration" },
            },
          },
        ]);

        return {
          month: monthNames[item._id.month - 1],
          sessions: item.sessions,
          hours: ((durationResult[0]?.totalDuration || 0) / 3600).toFixed(1),
        };
      })
    );

    // Diagnosis Breakdown
    const diagnosisBreakdown = await Client.aggregate([
      {
        $match: {
          organizationId: user.organizationId,
          userStatus: User_Status.Active,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$diagnosis",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalClientsCount = diagnosisBreakdown.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const formattedDiagnosis = diagnosisBreakdown.map((item) => ({
      diagnosis: item._id || "Not Specified",
      count: item.count,
      percentage:
        totalClientsCount > 0
          ? Math.round((item.count / totalClientsCount) * 100)
          : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        keyMetrics: {
          totalSessions,
          totalHours,
          activeClients,
          activeProviders,
        },
        fedcDistribution: fedcData,
        sessionTrends: formattedTrends,
        diagnosisBreakdown: formattedDiagnosis,
      },
    });
  } catch (error) {
    console.log("error__", error);
    next(error);
  }
  
/**this */
};

/**this */

/**this */
// Get Client Progress Reports
const getClientProgressReports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { dateRange, selectedClient = "all" } = req.query;

    const daysAgo = parseInt(dateRange as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const matchQuery: any = {
      organizationId: user.organizationId,
      userStatus: User_Status.Active,
    };

    if (selectedClient !== "all") {
      matchQuery._id = new mongoose.Types.ObjectId(selectedClient as string);
    }

    // Get clients with populated goals
    const clients = await Client.find(matchQuery).populate("itpGoals.goal");

    // Get sessions for date range
    const sessions = await Session.find({
      organizationId: user.organizationId,
      status: SessionStatus.Active,
      dateOfSession: { $gte: startDate },
    });

    const clientProgress = clients.map((client: any) => {
      // Count active and completed goals
      const activeGoals = client.itpGoals.filter(
        (goal: any) => goal.goalStatus === GoalStatus.InProgress
      ).length;

      const completedGoals = client.itpGoals.filter(
        (goal: any) => goal.goalStatus === GoalStatus.Mastered
      ).length;

      // Count sessions for this client
      const clientSessions = sessions.filter(
        (session: any) => session.client.toString() === client._id.toString()
      ).length;

      // Calculate average FEDC level from active goals
      const activeGoalsFEDC = client.itpGoals
        .filter(
          (itpGoal: any) =>
            itpGoal.goalStatus === GoalStatus.InProgress && itpGoal.goal
        )
        .map((itpGoal: any) => getFEDCNumber(itpGoal.goal.category));

      const avgFEDC =
        activeGoalsFEDC.length > 0
          ? activeGoalsFEDC.reduce((sum: number, val: number) => sum + val, 0) /
            activeGoalsFEDC.length
          : 0;

      return {
        client: client.name,
        clientId: client._id,
        activeGoals,
        completedGoals,
        sessionsThisMonth: clientSessions,
        avgFEDC: avgFEDC > 0 ? parseFloat(avgFEDC.toFixed(1)) : null,
      };
    });

    res.status(200).json({
      success: true,
      data: clientProgress,
    });
  } catch (error) {
    console.log("error__", error);
    next(error);
  }
};

/**this */
// Get Provider Activity Reports
const getProviderActivityReports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { dateRange, selectedProvider = "all" } = req.query;

    const daysAgo = parseInt(dateRange as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const matchQuery: any = {
      organizationId: user.organizationId,
      userStatus: User_Status.Active,
    };

    if (selectedProvider !== "all") {
      matchQuery._id = new mongoose.Types.ObjectId(selectedProvider as string);
    }

    const providers = await Provider.find(matchQuery);

    const providerActivity = await Promise.all(
      providers.map(async (provider) => {
        // Count assigned clients
        const clientCount = await Client.countDocuments({
          organizationId: user.organizationId,
          userStatus: User_Status.Active,
          assignedProvider: provider._id,
        });

        // Get sessions for this provider in date range
        const providerSessions = await Session.find({
          organizationId: user.organizationId,
          provider: provider._id,
          status: SessionStatus.Active,
          dateOfSession: { $gte: startDate },
        });

        const sessionIds = providerSessions.map((s) => s._id);

        // Get total duration from data collection
        const durationResult = await DataCollection.aggregate([
          {
            $match: {
              sessionId: { $in: sessionIds },
            },
          },
          {
            $group: {
              _id: null,
              totalDuration: { $sum: "$duration" },
            },
          },
        ]);

        const totalDuration = durationResult[0]?.totalDuration || 0;
        const totalHours = totalDuration / 3600;
        const avgSessionLength =
          providerSessions.length > 0
            ? Math.round(totalDuration / 60 / providerSessions.length)
            : 0;

        return {
          provider: provider.name,
          clients: clientCount,
          sessionsThisMonth: providerSessions.length,
          totalHours: parseFloat(totalHours.toFixed(1)),
          avgSessionLength,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: providerActivity,
    });
  } catch (error) {
    console.log("error__", error);
    next(error);
  }
};

const getOrgnaization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;

    const organization = await Organization.findOne({
      _id: user?.organizationId,
    });
    if (!organization) {
      return next(new ErrorHandler("Orgnaization not found", 400));
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Orgnaization found successfully",
        data: organization,
      });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};

const getDraftNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const reports = await Report.find({
      orgnaizationId: user?.organizationId,
      status: REPORT_STATUS.PENDING_QSP_SIGNATURE,
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Reports found successfully...",
        data: reports,
      });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};

const saveSignatureToPendingNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reportIds, qspSignature } = req.body;

    // ✅ Validation
    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return next(new ErrorHandler("Report IDs are required", 400));
    }

    if (!qspSignature || !qspSignature.trim()) {
      return next(new ErrorHandler("Signature is required", 400));
    }

    // ✅ Bulk update
    const result = await Report.updateMany(
      { _id: { $in: reportIds } },
      {
        $set: {
          qspSignature,
          status: REPORT_STATUS.SIGNED,
          signedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Signature added to reports successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("saveSignatureToReport error:", error);
    next(new ErrorHandler());
  }
};

export const orgController = {
  registerOrganization,
  getReportsOverview,
  getClientProgressReports,
  getProviderActivityReports,
  getOrgnaization,
  getDraftNotes,
  saveSignatureToPendingNotes,
};
