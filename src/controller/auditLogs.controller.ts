import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";
import AuditLogs from "../models/auditLogs.model.js";

const viewAllAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;

    const {
      search,
      action,
      resource,
      startDate,
      endDate
    } = req.query;
console.log(req.query, "query");

const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 10;
const skip = (page - 1) * limit;

let filters: any = {
  organizationId: user?.organizationId
};

// 🔍 Search filter
if (search) {
  filters.$or = [
    { action: { $regex: search, $options: "i" } },
    { resource: { $regex: search, $options: "i" } },
    { details: { $regex: search, $options: "i" } },
    { ipAddress: { $regex: search, $options: "i" } },
    { userName: { $regex: search, $options: "i" } },
    { userEmail: { $regex: search, $options: "i" } },
  ];
}

console.log(filters, "filters....");
    // 🎯 Action filter (matches enum values)
    if (action && action !== "") {
      filters.action = action;
    }

    // 📁 Resource filter (matches enum values)
    if (resource && resource !== "") {
      filters.resource = resource;
    }

    // 📅 Date filters
    if (startDate || endDate) {
      filters.createdAt = {};

      if (startDate) {
        filters.createdAt.$gte = new Date(startDate as string);
      }

      if (endDate) {
        filters.createdAt.$lte = new Date(endDate as string + "T23:59:59");
      }
    }
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const exportThisWeek = await AuditLogs.countDocuments({action:"Export" , resource:"Export" , createdAt :  { $gte: sevenDaysAgo }})

    const total = await AuditLogs.countDocuments(filters);

    const auditLogs = await AuditLogs.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Logs found successfully.",
      data: {
        auditLogs,
        page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        exportThisWeek
      }
    });

  } catch (error) {
    console.log(error);
    next(new ErrorHandler());
  }
};


const statistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;

    const topActions = await AuditLogs.aggregate([
      {
        $match: {
          organizationId: user?.organizationId,
        },
      },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const topResources = await AuditLogs.aggregate([
      {
        $match: {
          organizationId: user?.organizationId,
        },
      },
      {
        $group: {
          _id: "$resource",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);
    const activityTimeline = await AuditLogs.aggregate([
      {
        $match: {
          organizationId: user.organizationId,
          createdAt: {
            $gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);
    const mostActiveUsers = await AuditLogs.aggregate([
      {
        $match: {
          organizationId: user.organizationId,
          user: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$user",
          userEmail: { $first: "$userEmail" },
          userName: { $first: "$userName" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return res
      .status(200)
      .json({
        success: true,
        message: "Here is statistics",
        data: { topActions, topResources, activityTimeline, mostActiveUsers },
      });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

export const auditLogController = {
  viewAllAuditLogs,
  statistics,
};
