import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";
import Session from "../models/session.model.js";
import DataCollection from "../models/sessionData.model.js";
import Client from "../models/client.model.js";
import { generateNotesWithAi } from "../aiSetup/genrateNotes.js";
import GoalBank from "../models/goalbank.model.js";
import Report from "../models/notes.model.js";

const startSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      clientId,
      sessionType,
      dateOfSession,
      startTime,
      endTime,
      clientVariables,
      present,
    } = req.body;
    const { userId, user } = req;

    const session = await Session.create({
      client: clientId,
      provider: userId,
      sessionType,
      dateOfSession,
      startTime,
      endTime,
      present,
      clientVariables,
      organizationId: user?.organizationId,
    });
    return res.status(200).json({
      success: true,
      message: "Session started successfully..",
      data: session,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const collectSessionData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      sessionId,
      goals_dataCollection,
      clientId,
      duration,
      providerObservation,
    } = req.body;
    const { user } = req;

    const collectedData = await DataCollection.create({
      sessionId,
      goals_dataCollection,
      clientId,
      duration,
      organizationId: user?.organizationId,
      providerObservation,
    });

    const sessionData = await Session.findById(sessionId)
      .populate("provider")
      .populate("client");
    return res.status(200).json({
      success: true,
      message: "Data Collected successfully..",
      data: collectedData,
      sessionData,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const viewAllSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;

    const allSession = await DataCollection.find({
      organizationId: user?.organizationId,
    })
      .populate("clientId")
      .populate("sessionId");
    //   .populate({
    //     path: "sessionId",
    //     populate: { path: "provider" },
    //   });
    if (!allSession.length) {
      return next(new ErrorHandler("No session found", 400));
    }
    return res.status(200).json({
      success: true,
      message: "All session found successfully..",
      data: allSession,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const viewClientSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId } = req.query;
    const { user } = req;

    const sessionHistory = await DataCollection.find({
      organizationId: user?.organizationId,
      clientId: clientId,
    })
      .populate("clientId")
      .populate("sessionId");
    //   .populate({
    //     path: "sessionId",
    //     populate: { path: "provider" },
    //   });
    if (!sessionHistory.length) {
      return next(new ErrorHandler("No session found", 400));
    }
    return res.status(200).json({
      success: true,
      message: "Client's Session found successfully",
      data: sessionHistory,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

// Utility to get highest FEDC level
export const getFEDCLevelFromGoals = (goals: any[]) => {
  if (!goals || goals.length === 0) return null;

  const fedcCategories = goals.map((g) => g.goalId?.category).filter(Boolean);

  if (fedcCategories.length === 0) return null;

  const sorted = fedcCategories.sort((a, b) => {
    const numA = parseInt(a.split("_")[1]);
    const numB = parseInt(b.split("_")[1]);
    return numB - numA;
  });

  return sorted[0];
};

export const formatClinicalNote = ({
  client,
  provider,
  session,
  aiNote,
  goals,
}: any) => {
  const date = session.dateOfSession
    ? new Date(session.dateOfSession).toLocaleDateString()
    : "N/A";

  const start = session.startTime
    ? new Date(session.startTime).toLocaleTimeString()
    : "N/A";

  const end = session.endTime
    ? new Date(session.endTime).toLocaleTimeString()
    : "N/A";

  const duration =
    session.startTime && session.endTime
      ? Math.round(
          (new Date(session.endTime).getTime() -
            new Date(session.startTime).getTime()) /
            60000
        )
      : 0;

  return `
${client.name}

${new Date(client.dob).toLocaleDateString()}

${provider?.name || "Provider Name"}
${provider?.credential || "Credential"}

${date}

${start}
${end}

Session Details
${duration} minutes

Client Only
${session.clientVariables || "No specific concerns noted."}

Summary of Progress and Response to Treatment
${aiNote.presentationAndEngagement}

Multiple FEDC levels observed and addressed during session

${goals
  .map(
    (g: any, i: number) => `
ITP Goal ${i + 1}
${g.accuracy}% Accuracy
${g.goalText}

${g.accuracy}% accuracy across ${g.counter} opportunities

Independent
Progress observed toward mastery with continued support.
`
  )
  .join("\n")}

Therapeutic Supports and Strategies
Standard DIRFloortime techniques employed

Detailed Clinical Observations
${aiNote.interactionsAndAffect}

Plan
• ${aiNote.plan?.replace(/\./g, "\n• ")}

Provider Certification
This note was AI-assisted and reviewed by provider.

${provider?.name || "Provider"}
${provider?.credential || "Credential"}

[Pending Signature]
`;
};
const buildAIRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId)
      return res.status(400).json({ message: "sessionId is required" });

    // 1️⃣ Get Session
    const session = await Session.findById(sessionId).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });

    // 2️⃣ Get Data Collection with populated goalId
    const dataCollection = await DataCollection.findOne({ sessionId })
      .populate("goals_dataCollection.goalId") // This populates the full GoalBank document
      .lean();

    console.log(dataCollection?.goals_dataCollection, "data collection");

    const client = await Client.findById(session.client).lean();

    const fedcLevel = getFEDCLevelFromGoals(
      dataCollection?.goals_dataCollection || []
    );
    console.log(fedcLevel, "fedc level");

    const aiRequest = {
      therapistNotes: dataCollection?.providerObservation || "",
      sessionData: {
        date: session.dateOfSession,
        duration: dataCollection?.duration
          ? Math.round(dataCollection.duration / 60)
          : 0,
        fedcLevel: fedcLevel,
        goals:
          dataCollection?.goals_dataCollection?.map((g: any) => ({
            // goal: g.goalId?.discription || "",
            goal: g.goalId?.category || "", // ✅ Access category from populated goalId
            performance: g.accuracy || 0,
            supportLevel: g.supportLevel || [],
            counter: g.counter || 0,
            criteriaForMastery: g.goalId?.criteriaForMastry || {}, // ✅ Include mastery criteria
            observations: [],
          })) || [],
        clientVariables: session.clientVariables
          ? [
              {
                variable: "clientVariables",
                description: session.clientVariables,
              },
            ]
          : [],
        activities: dataCollection?.activityEngaged || [],
        supportsObserved: dataCollection?.supportsObserved || [],
        providerObservation: dataCollection?.providerObservation || "",
      },
      clientProfile: {
        name: client?.name || "",
        age: client?.dob
          ? new Date().getFullYear() - new Date(client.dob).getFullYear()
          : null,
        diagnosis: client?.diagnosis || "",
        currentFEDCLevel: client?.itpGoals || [],
      },
    };

    console.log(aiRequest?.sessionData, "AI Request Data");

    // 6️⃣ Generate AI notes
    const aiResponse = await generateNotesWithAi(aiRequest);

    const itpGoalsData = await DataCollection.findOne({ sessionId }).populate({
      path: "goals_dataCollection.goalId",
    });
  const report =   await Report.create({
      sessionId,
      plan: aiResponse?.clinicalNote?.plan,
      fedcObservation: aiResponse?.clinicalNote?.fedcObservations,
      interactionsAndAffect: aiResponse?.clinicalNote?.interactionsAndAffect,
      presentationAndEngagement:
        aiResponse?.clinicalNote?.presentationAndEngagement,
      goalProgress: aiResponse?.clinicalNote?.goalProgress?.map((goal) => ({
        masteryCriteria: goal.masteryCriteria,
        progressReport: goal.clinicalInterpretation,
      })),
    });
    // 8️⃣ Respond to client
    return res.status(200).json({
      success: true,
      message: "Notes created successfully..",
      data:{
        aiResponse,itpGoalsData,reportId: report._id
      } 
      
    });
  } catch (error) {
    next(error);
  }
};


const saveSignatureToReport = async( req: Request,
  res: Response,
  next: NextFunction)=>{
  try {
    const {reportId, signature} =  req.body;
    const updatedReport =  await Report.findByIdAndUpdate(reportId, {$set: {signature:signature}});

    return res.status(200).json({success:true, message:"Signature added to the report", data: updatedReport})
  } catch (error) {
    console.log("error__", error);
        next(new ErrorHandler());
  }
}
export const sessionController = {
  startSession,
  collectSessionData,
  viewAllSessions,
  viewClientSessions,
  buildAIRequest,
  saveSignatureToReport
};
