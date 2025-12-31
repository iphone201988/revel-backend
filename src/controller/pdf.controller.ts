import { Request, Response, NextFunction } from "express";
import { generatePdfBuffer } from "../utils/pdf/genratePdf.js";
import archiver from "archiver";
import ErrorHandler from "../utils/ErrorHandler.js";
import {
  buildPieGradient,
  buildSessionStats,
  normalizeSessionTrends,
  prepareDiagnosisData,
  buildDiagnosisStats,
  generateAuditCSV,
} from "../utils/helper.js";
import Client from "../models/client.model.js";
import DataCollection from "../models/sessionData.model.js";
import { GoalStatus } from "../utils/enums/enums.js";
import moment from "moment";
import AuditLogs from "../models/auditLogs.model.js";

const downloadFedcDistributionPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fedcDistribution } = req.body;

    const buffer = await generatePdfBuffer("fedc-distribution.html", {
      fedcDistribution,
      pieGradient: buildPieGradient(fedcDistribution),
      withChart: true,
    });

    res
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=fedc-distribution.pdf",
      })
      .send(buffer);
  } catch (error) {
    console.log(error, "error---");
    next(new ErrorHandler());
  }
};

const downloadSessionTrendsPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionTrends } = req.body;

    // sanitize
    const sanitized = sessionTrends.map((i: any) => ({
      ...i,
      hours: Number(i.hours),
    }));

    const stats = buildSessionStats(sanitized);
    const normalizedTrends = normalizeSessionTrends(sanitized);

    const buffer = await generatePdfBuffer("sessionTrends.html", {
      sessionTrends: normalizedTrends,
      stats,
    });

    return res
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=session-trends.pdf",
      })
      .send(buffer);
  } catch (error) {
    console.log(error, "error---");
    next(new ErrorHandler());
  }
};

const downloadDiagnosisBreakdownPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { diagnosisBreakdown } = req.body;

    if (!diagnosisBreakdown || !diagnosisBreakdown.length) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis data is required",
      });
    }

    // 1️⃣ Prepare data
    const enrichedData = prepareDiagnosisData(diagnosisBreakdown);
    const stats = buildDiagnosisStats(enrichedData);
    const pieGradient = buildPieGradient(enrichedData);

    // 2️⃣ Generate PDF
    const pdfBuffer = await generatePdfBuffer("diagnosis-breakdown.html", {
      diagnosisBreakdown: enrichedData,
      stats,
      pieGradient,
    });

    // 3️⃣ Send PDF (IMPORTANT: NO JSON)
    return res
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=diagnosis-breakdown.pdf",
        "Content-Length": pdfBuffer.length,
      })
      .send(pdfBuffer);
  } catch (error) {
    console.log(error, "error---");
    next(new ErrorHandler());
  }
};

const downloadGoalReviewReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId } = req.body;

    const { user } = req;
    const client = await Client.findById(clientId)
      .select("name itpGoals")
      .populate({
        path: "itpGoals.goal",
        model: "GoalBank",
        select: "category discription criteriaForMastry masteryBaseline",
      })
      .lean();

    if (!client) {
      return next(new ErrorHandler("Client not found", 404));
    }

    /* Last 30 days */
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dataCollections = await DataCollection.find({
      clientId,
      createdAt: { $gte: startDate, $lte: endDate },
      organizationId: user?.organizationId,
    })
      .populate({
        path: "goals_dataCollection.goalId",
        model: "GoalBank",
        select: "_id",
      })
      .lean();

    /* Group by goalId */
    const goalMap = new Map<
      string,
      { total: number; accuracySum: number; count: number }
    >();

    dataCollections.forEach((dc: any) => {
      dc.goals_dataCollection.forEach((g: any) => {
        const id = g.goalId._id.toString();

        if (!goalMap.has(id)) {
          goalMap.set(id, { total: 0, accuracySum: 0, count: 0 });
        }

        const item = goalMap.get(id)!;
        item.total += 1;
        item.accuracySum += g.accuracy || 0;
        item.count += 1;
      });
    });

    /* Build PDF-safe goals array */
    const goalsProgress = client.itpGoals.map((itpGoal: any) => {
      const goalId = itpGoal.goal._id.toString();
      const stats = goalMap.get(goalId);

      const avg =
        stats && stats.count > 0
          ? Math.round(stats.accuracySum / stats.count)
          : 0;

      const mastery = itpGoal.goal.criteriaForMastry?.masteryPercentage || 80;
      let currentStatus = itpGoal.goalStatus;

      return {
        _id: goalId,
        category: itpGoal.goal.category,
        goal: itpGoal.goal.discription,
        averageOverall: avg,
        trend: "stable", // optional: compute later----
        currentStatus,
        totalSessions: stats?.count || 0,
      };
    });

    const masteredGoals = goalsProgress.filter(
      (g) => g?.currentStatus === GoalStatus.Mastered
    ).length;

    const avgOverall =
      goalsProgress.length > 0
        ? Math.round(
            goalsProgress.reduce((sum, g) => sum + g.averageOverall, 0) /
              goalsProgress.length
          )
        : 0;

    const pdfData = {
      clientInfo: {
        name: client.name,
        reportGanrated: moment(new Date()).format("DD-MM-YYYY"),
      },
      summary: {
        averageOverallPerformance: avgOverall,
        totalGoals: goalsProgress.length,
        masteredGoals,
      },
      goalsProgress,
    };

    const pdfBuffer = await generatePdfBuffer("goalReviewReport.html", pdfData);

    // 3️⃣ Send PDF (IMPORTANT: NO JSON)
    return res
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=goalReviewReport.pdf",
        "Content-Length": pdfBuffer.length,
      })
      .send(pdfBuffer);
  } catch (error) {
    console.log(error, "error---");
    next(new ErrorHandler());
  }
};

const downloadSessionNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionData } = req.body;
    console.log(sessionData);
    if (!sessionData) {
      return next(new ErrorHandler("Session data is  Reruired", 400));
    }
    const buffer = await generatePdfBuffer("sessionData.html", sessionData);

    res
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=sessionData.pdf",
      })
      .send(buffer);
  } catch (error) {
    console.log(error, "error---");
    next(new ErrorHandler());
  }
};

const downloadAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const logs = await AuditLogs.find({ organizationId: user?.organizationId })
      .sort({ timestamp: -1 })
      .lean();

    const csv = generateAuditCSV(logs);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");

    return res.status(200).send(csv);
  } catch (error) {
    console.log(error, "error---");
    next(new ErrorHandler());
  }
};

const downloadSessionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { goalBankId }: any = req.query;
    const collectedData = await DataCollection.findById(goalBankId)
      .populate("sessionId")
      .populate("clientId");

    if (!collectedData) {
      return next(new ErrorHandler("Session Not Found", 400));
    }

    const pdfData: any = {
      client: {
        name: (collectedData?.clientId as any)?.name,
      },

      session: {
        dateOfSession: moment(
          (collectedData?.sessionId as any)?.dateOfSession
        ).format("DD-MM-YYYY"),
        sessionType: (collectedData?.sessionId as any)?.sessionType,
        startTime: moment((collectedData.sessionId as any)?.startTime).format(
          "hh:mm A"
        ),
        endTime: moment((collectedData.sessionId as any)?.endTime).format(
          "hh:mm A"
        ),
        status: (collectedData.sessionId as any)?.status,
        durationMinutes: Math.round(collectedData.duration / 60),
      },

      goals: collectedData.goals_dataCollection.map((goal: any) => ({
        accuracy: goal.accuracy,
        total: goal.total,
        counter: goal.counter,
        supportLevel: {
          independent: {
            success: goal.supportLevel?.independent?.success || 0,
            count: goal.supportLevel?.independent?.count || 0,
          },
          minimal: {
            success: goal.supportLevel?.minimal?.success || 0,
            count: goal.supportLevel?.minimal?.count || 0,
          },
          moderate: {
            success: goal.supportLevel?.modrate?.success || 0,
            count: goal.supportLevel?.modrate?.count || 0,
          },
        },
      })),

      activityEngaged: collectedData.activityEngaged || [],
      supportsObserved: collectedData.supportsObserved || [],
      providerObservation: collectedData.providerObservation || "",
    };
    const pdfBuffer = await generatePdfBuffer("sessionHistory.html", pdfData);

    console.log("PDF Data----", pdfData, "PDF Data----");

    // 3️⃣ Send PDF (IMPORTANT: NO JSON)
    return res
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=sessionHistory.pdf",
        "Content-Length": pdfBuffer.length,
      })
      .send(pdfBuffer);
  } catch (error) {
    console.error(error);
    next(new ErrorHandler());
  }
};

const downloadSelectedSessionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionIds } = req.body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return next(new ErrorHandler("No sessions selected", 400));
    }

    const sessions = await DataCollection.find({
      _id: { $in: sessionIds },
    })
      .populate("sessionId")
      .populate("clientId");

    if (!sessions.length) {
      return next(new ErrorHandler("Sessions not found", 404));
    }

    // ZIP headers
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=session-history.zip",
    });

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    let count = 1;

    for (const collectedData of sessions) {
      const pdfData = {
        client: {
          name: (collectedData.clientId as any)?.name,
        },
        session: {
          dateOfSession: moment(
            (collectedData.sessionId as any)?.dateOfSession
          ).format("DD-MM-YYYY"),
          sessionType: (collectedData.sessionId as any)?.sessionType,
          startTime: moment(
            (collectedData.sessionId as any)?.startTime
          ).format("hh:mm A"),
          endTime: moment(
            (collectedData.sessionId as any)?.endTime
          ).format("hh:mm A"),
          status: (collectedData.sessionId as any)?.status,
          durationMinutes: Math.round(collectedData.duration / 60),
        },
        goals: collectedData.goals_dataCollection.map((goal: any) => ({
          accuracy: goal.accuracy,
          total: goal.total,
          counter: goal.counter,
          supportLevel: {
            independent: goal.supportLevel?.independent || { success: 0, count: 0 },
            minimal: goal.supportLevel?.minimal || { success: 0, count: 0 },
            moderate: goal.supportLevel?.modrate || { success: 0, count: 0 },
          },
        })),
        activityEngaged: collectedData.activityEngaged || [],
        supportsObserved: collectedData.supportsObserved || [],
        providerObservation: collectedData.providerObservation || "",
      };

      const pdfBuffer = await generatePdfBuffer(
        "sessionHistory.html",
        pdfData
      );

      const safeName =
        pdfData.client.name?.replace(/\s+/g, "_") || "Client";

      const fileName = `Session-${count}-${safeName}-${pdfData.session.dateOfSession}.pdf`;

      archive.append(pdfBuffer, { name: fileName });

      count++;
    }

    await archive.finalize();
  } catch (error) {
    console.error(error);
    next(new ErrorHandler());
  }
};


export const pdfController = {
  downloadFedcDistributionPdf,
  downloadSessionTrendsPdf,
  downloadDiagnosisBreakdownPdf,
  downloadSessionNote,
  downloadAuditLogs,
  downloadGoalReviewReport,
  downloadSessionHistory,
  downloadSelectedSessionHistory,
};
