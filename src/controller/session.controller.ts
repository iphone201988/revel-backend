import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";
import Session from "../models/session.model.js";
import DataCollection from "../models/sessionData.model.js";
import Client from "../models/client.model.js";
import { generateNotesWithAi } from "../aiSetup/genrateNotes.js";
import GoalBank from "../models/goalbank.model.js";
import Report from "../models/notes.model.js";
import { REPORT_STATUS, SessionStatus } from "../utils/enums/enums.js";
import { Activities } from "../models/activity.model.js";
import { Supports } from "../models/supports.model.js";
import { checkAndUpdateGoalMastery } from "../utils/helper.js";
import Provider from "../models/provider.model.js";

const addActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activity } = req.body;
    const { user } = req;

    if (!user.organizationId || !activity) {
      return res.status(400).json({
        message: "organizationId and activity are required",
      });
    }

    const updatedActivities = await Activities.findOneAndUpdate(
      { organizationId: user?.organizationId },
      {
        // $addToSet avoids duplicates
        $addToSet: { activities: activity },
      },
      { new: true }
    );

    if (!updatedActivities) {
      return res.status(404).json({
        message: "Activities record not found for this organization",
      });
    }

    res.status(200).json({
      message: "Activity added successfully",
      data: updatedActivities,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const addSupport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { support } = req.body;
    const { user } = req;
    if (!user.organizationId || !support) {
      return res.status(400).json({
        message: "organizationId and support are required",
      });
    }
    const updatedSupports = await Supports.findOneAndUpdate(
      { organizationId: user.organizationId },
      {
        // Prevent duplicates
        $addToSet: { supports: support },
      },
      { new: true }
    );

    if (!updatedSupports) {
      return res.status(404).json({
        message: "Supports record not found for this organization",
      });
    }

    res.status(200).json({
      message: "Support added successfully",
      data: updatedSupports,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const getActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;

    if (!user?.organizationId) {
      return next(new ErrorHandler("Organization Id is required", 400))
     
    }
    const activities = await Activities.findOne(
      { organizationId: user?.organizationId },
      { activities: 1, _id: 0 }
    );

    if (!activities) {
      return res.status(404).json({
        message: "Activities record not found for this organization",
      });
    }

    return res.status(200).json({
      message: "Activities fetched successfully",
      data: activities.activities,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const getSupports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;

    if (!user.organizationId) {
      return res.status(400).json({
        message: "organizationId is required",
      });
    }

    const supports = await Supports.findOne(
      { organizationId: user?.organizationId },
      { supports: 1, _id: 0 }
    );

    if (!supports) {
      return res.status(404).json({
        message: "Supports record not found for this organization",
      });
    }

    res.status(200).json({
      message: "Supports fetched successfully",
      data: supports.supports,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

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
/*** this ------------------ */
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
      activityEngaged,
      supportsObserved,
    } = req.body;
    const { user } = req;

    const collectedData = await DataCollection.create({
      sessionId,
      goals_dataCollection,
      clientId,
      duration,
      organizationId: user?.organizationId,
      supportsObserved,
      activityEngaged,
      providerObservation,
      
    });
    for (const goal of goals_dataCollection) {
  await checkAndUpdateGoalMastery(clientId, goal.goalId);
}

    const sessionData = await Session.findById(sessionId)
      .populate("provider")
      .populate("client");
    return res.status(200).json({
      success: true,
      message: "Data Collected successfully..",
      data: { collectedData, sessionData },
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
      .populate("sessionId")
      .sort({createdAt:-1});
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
// Helper function to get FEDC level
export const getFEDCLevelFromGoals = (goals: any[] = []) => {
  const fedcNumbers = goals
    .map((g) => g.goalId?.category)
    .filter(Boolean)
    .map((c) => Number(c.split("_")[1]))
    .filter((n) => !isNaN(n));

  if (!fedcNumbers.length) return null;
  return `FEDC ${Math.max(...fedcNumbers)}`;
};

// SOURCE 1: Client Profile
const buildClientProfile = (client: any) => {
  const age = client?.dob
    ? Math.floor((Date.now() - new Date(client.dob).getTime()) / 31557600000)
    : null;

  return {
    name: client?.name || "",
    age: age,
    diagnosis: client?.diagnosis || "",
    interests: client?.clientProfile?.interests || "Not discussed",
    strengths: client?.clientProfile?.strengths || "Not discussed",
    learning_style: "Visual-spatial learning", // You may want to add this field to your model
    areas_of_challenge: client?.clientProfile?.challenges || "Not discussed",
    family_context: client?.clientProfile?.familyContext || "Not discussed",
    sensory_processing: client?.clientProfile?.sensoryProcessing || "Not discussed",
    communication: client?.clientProfile?.communication || "Not discussed",
    safety_considerations: client?.clientProfile?.safetyConsiderations || "Not discussed",
    fedc_level: getFEDCLevelFromGoals(client?.itpGoals || []),
    preferred_activities: client?.clientProfile?.preferredActivities || "Not discussed",
  };
};


const buildSessionData = (session: any, dataCollection: any, provider: any) => {
  const goals =
    dataCollection?.goals_dataCollection?.map((g: any) => {
      const independent = g.supportLevel?.independent || { count: 0, success: 0, miss: 0 };
      const minimal = g.supportLevel?.minimal || { count: 0, success: 0, miss: 0 };
      const moderate = g.supportLevel?.modrate || { count: 0, success: 0, miss: 0 };

      const totalTrials =
        independent.count + minimal.count + moderate.count;

      const calcPercent = (value: number, total: number) =>
        total > 0 ? Math.round((value / total) * 100) : 0;

      const normalizeLevel = (level: any) => {
        const miss =
          typeof level.miss === "number"
            ? level.miss
            : Math.max(level.count - level.success, 0);

        return {
          count: level.count,
          success: level.success,
          miss,
          success_percent: calcPercent(level.success, level.count),
          miss_percent: calcPercent(miss, level.count),
        };
      };

      return {
        goal_id: g.goalId?._id || null,
        goal_name: g.goalId?.discription || "Unnamed goal",
        fedc_category: g.goalId?.category?.replace(/_/g, " ") || "",

        circles_or_opportunities: totalTrials,

        performance: {
          independent: normalizeLevel(independent),
          minimal_support: normalizeLevel(minimal),
          moderate_support: normalizeLevel(moderate),
        },

        totals: {
          total_trials: totalTrials,
          total_success:
            independent.success + minimal.success + moderate.success,
          total_miss:
            normalizeLevel(independent).miss +
            normalizeLevel(minimal).miss +
            normalizeLevel(moderate).miss,
          accuracy_percent: g.accuracy || 0,
        },

        raw_support_level_data: g.supportLevel,
      };
    }) || [];

  return {
    session_metadata: {
      date_of_session: session?.dateOfSession
        ? new Date(session.dateOfSession).toLocaleDateString()
        : "N/A",
      start_time: session?.startTime
        ? new Date(session.startTime).toLocaleTimeString()
        : "N/A",
      end_time: session?.endTime
        ? new Date(session.endTime).toLocaleTimeString()
        : "N/A",
      duration_minutes: dataCollection?.duration
        ? Math.round(dataCollection.duration / 60)
        : 0,
      session_type: session?.sessionType || "Not specified",
    },

    participants: {
      client: session?.client || "",
      session_provider: provider?.name || "Provider Name",
      provider_credentials: provider?.credential || "Credentials",
      individuals_present: session?.present || "Client and Provider",
    },

    intervention_details: {
      activities_engaged_in: dataCollection?.activityEngaged || [],
      strategies_used: dataCollection?.supportsObserved || [],
    },

    goals_progress: goals,

    raw_data_collection: dataCollection,
  };
};


// SOURCE 3: Provider Observations
const buildProviderObservations = (session: any, dataCollection: any) => ({
  client_variables: session?.clientVariables || "Not discussed this session",
  provider_observations: dataCollection?.providerObservation || "No observations recorded",
});


// Main API Handler

/**this */
 const buildAIRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.query;
    const {user} =  req
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    // 1️⃣ Fetch Session
    const session = await Session.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // 2️⃣ Fetch Data Collection
    const dataCollection = await DataCollection.findOne({ sessionId })
      .populate("goals_dataCollection.goalId")
      .lean();

    if (!dataCollection) {
      return res.status(404).json({ message: "Data collection not found" });
    }

    // 3️⃣ Fetch Client
    const client = await Client.findById(session.client).lean();
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // 4️⃣ Fetch Provider (assuming you have a Provider model)
    const provider = user;

    // 5️⃣ Build AI Request Payload
    const aiRequest = {
      SOURCE_1_CLIENT_PROFILE: buildClientProfile(client),
      SOURCE_2_SESSION_DATA: buildSessionData(session, dataCollection, provider),
      SOURCE_3_PROVIDER_OBSERVATIONS: buildProviderObservations(session, dataCollection),
    };

    // 6️⃣ Call AI
    const aiResponse = await generateNotesWithAi(aiRequest);
    

    // 7️⃣ Parse JSON response
    let parsedResponse;
    // try {  
      // Remove markdown code blocks if present
      const cleanedText = aiResponse.soapNoteText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      parsedResponse = JSON.parse(cleanedText);
    // } catch (parseError) {
    //   console.error("Failed to parse AI response:", parseError);
    //   return res.status(500).json({
    //     success: false,
    //     message: "Failed to parse AI response",
    //     rawResponse: aiResponse.soapNoteText,
    //   });
    // }

    

    return res.status(200).json({
      success: true,
      message: "AI clinical note generated successfully",
      data: {
        aiRequest,
        soapNote: parsedResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**this */
 const createReport = async (req: Request, res: Response, next:NextFunction) => {
  const {user} = req;
  const report =  req.body
  const saveReport = await Report.create(report);

 return  res.status(201).json({
    success: true,
    message:"Report saved successfully..",
    data: saveReport,
  });
};

/**this */

const saveSignatureToReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reportId, signature } = req.body;
    const updatedReport = await Report.findByIdAndUpdate(reportId, {
      $set: { signature: signature , status: REPORT_STATUS.SIGNED},
    });

    return res.status(200).json({
      success: true,
      message: "Signature added to the report",
      data: updatedReport,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};



const abandonSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.query;
    const { user } = req;

    const session = await Session.findOneAndUpdate(
      { _id: sessionId, organizationId: user?.organizationId },
      { $set: { status: SessionStatus.Abandon } }
    );

    return res.status(200).json({
      success: true,
      message: "Session Abandoned Sucessfully..",
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};


export const sessionController = {
  startSession,
  collectSessionData,
  viewAllSessions,
  viewClientSessions,
  buildAIRequest,
  saveSignatureToReport,
  abandonSession,
  addActivity,
  addSupport,
  getActivities,
  createReport,
  getSupports,
};
