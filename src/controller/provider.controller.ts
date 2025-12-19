import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";
import Provider from "../models/provider.model.js";
import {
  GoalBankStatus,
  GoalStatus,
  SessionStatus,
  SupportLevel,
  SystemRoles,
  User_Status,
  VerficationType,
} from "../utils/enums/enums.js";
import bcrypt from "bcrypt";
import {
  calculateTrend,
  defaultAdminPermissions,
  defaultUserPermissions,
  determineGoalStatus,
  formatSessionDate,
  generateOtp,
  generateRandomString,
  getGoalColor,
  hasClientVariables,
  sendMail,
  sortFEDCObservations,
} from "../utils/helper.js";
import {
  sendOtpToEmail,
  setPasswordLink,
  subjectForSendingMail,
  textForVerifyMail,
} from "../utils/MailTemplate.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import Client from "../models/client.model.js";
import GoalBank from "../models/goalbank.model.js";
import mongoose, { Types } from "mongoose";
import {
  FEDCObservation,
  GoalProgressData,
  SupportLevelData,
} from "../types/types.js";
import DataCollection from "../models/sessionData.model.js";

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const Email = email.toLowerCase();
    console.log(Email);

    const provider = await Provider.findOne({
      email: Email,
      userStatus: User_Status.Active,
    });
    if (!provider) {
      return next(new ErrorHandler("User is not found", 400));
    }
    const isMatch = await bcrypt.compare(password, provider.password);
    if (!isMatch) {
      return next(new ErrorHandler("Password  didn't match."));
    }
    const otp = generateOtp();
    const html = sendOtpToEmail(otp);
    await sendMail(Email, subjectForSendingMail(), textForVerifyMail(), html);
    provider.otp = otp;

    provider.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await provider.save();

    return res.status(200).json({
      success: true,
      message: "Login successfully. Please verify Otp.",
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};

const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    const findUser = await Provider.findById(userId).populate("organizationId");
    return res.status(200).json({
      success: true,
      message: "User found successfully",
      data: findUser,
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};
const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { otp, email } = req.body;
    console.log(email);

    const Email = email.toLowerCase();
    const provider = await Provider.findOne({
      email: Email,
      userStatus: User_Status.Active,
    });
    if (!provider) {
      return next(new ErrorHandler("User not found", 400));
    }
    if (provider?.otp !== otp) {
      return next(new ErrorHandler("Otp is not matched", 400));
    }
    if (provider?.otpExpiry < new Date()) {
      return next(new ErrorHandler("Otp is expired", 400));
    }

    const jti = generateRandomString();
    provider.otp = null;
    provider.otpExpiry = null;
    provider.isVerified = true;
    provider.jti = jti;
    await provider.save();
    const token = jwt.sign(
      { userId: provider?._id, jti: jti },
      process.env.JWT_SECRET_KEY
    );
    return res.status(200).json({
      success: true,
      message: "Account verifued successfully..",
      data: { token: token, provider: provider },
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};
const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const Email = email.toLowerCase();
    const provider = await Provider.findOne({
      email,
      userStatus: User_Status.Active,
    });
    if (!provider) {
      return next(new ErrorHandler("User not  found", 400));
    }
    const otp = generateOtp();
    const html = sendOtpToEmail(otp);
    await sendMail(Email, subjectForSendingMail(), textForVerifyMail(), html);
    provider.otp = otp;
    provider.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await provider.save();
    return res
      .status(200)
      .json({ success: true, message: "Otp send successfully." });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};
const getClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const clients = await Client.find({
      organizationId: user?.organizationId,
    }).populate("qsp");
    if (!clients.length) {
      return next(new ErrorHandler("Clients not found", 400));
    }
    return res.status(200).json({
      success: true,
      message: "Clients found successfully.",
      data: clients,
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};
const getClientProfie = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId } = req.query;
    const client = await Client.findById(clientId)
      .populate("assignedProvider")
      .populate("clinicalSupervisor")
      .populate({
        path: "itpGoals.goal",
        model: "GoalBank",
      });

    if (!client) {
      return next(new ErrorHandler("Client not found", 400));
    }
    const today = new Date();
    let hasUpdates = false;

    // 🔥 DISCONTINUE LOGIC
    client.itpGoals.forEach((g) => {
      if (
        g.goalStatus === GoalStatus.InProgress &&
        g.targetDate &&
        new Date(g.targetDate) <= today
      ) {
        g.goalStatus = GoalStatus.Discontinued;
        g.date = today; // archived date
        hasUpdates = true;
      }
    });

    // Save only if something changed
    if (hasUpdates) {
      await client.save();
    }

    if (client) {
      const filteredGoals = client.itpGoals.filter(
        (g) => g.goalStatus === GoalStatus.InProgress
      );

      client.itpGoals.splice(0, client.itpGoals.length, ...filteredGoals);
    }
    return res.status(200).json({
      success: true,
      message: "Client found successfully",
      data: client,
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};
const addClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const {
      name,
      dob,
      diagnosis,
      parentName,
      email,
      phone,
      countryCode,
      assignedProvider,
      qsp,
      clinicalSupervisor,
      reviewDate,
    } = req.body;
    const providerIds = Array.isArray(assignedProvider)
      ? [...new Set(assignedProvider)]
      : [assignedProvider];

    function calculateAge(dob) {
      const birthDate = new Date(dob);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      // If birthday not reached yet this year → subtract 1
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      return age;
    }
    const client = new Client({
      name,
      diagnosis,
      dob,
      parentName,
      email: email.toLowerCase(),
      phone,
      assignedProvider: providerIds,
      age: calculateAge(dob),
      qsp,
      clinicalSupervisor,
      reviewDate,
      countryCode,
      organizationId: user?.organizationId,
    });

    await client.save();
    return res.status(200).json({
      success: true,
      message: "Client added successfully",
      data: client,
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};

const updateClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId } = req.query;
    const updateData = req.body;

    if (!clientId) {
      return next(new ErrorHandler("ClientId is required", 400));
    }

    const client: any = await Client.findById(clientId);
    console.log("client...", client);
    if (!client) {
      return next(new ErrorHandler("Client not found", 404));
    }

    let providerUpdated = false;
    let clientUpdated = false;

    // 🔹 Assigned Provider (REPLACE ARRAY – your original logic)
    if (Array.isArray(updateData.assignedProvider)) {
      client.assignedProvider = [
        ...new Set(
          updateData.assignedProvider.map(
            (id: string) => new Types.ObjectId(id)
          )
        ),
      ];
      providerUpdated = true;
      delete updateData.assignedProvider;
    }
    // 🔹 Client Profile fields update
    let clientProfileUpdated = false;
    if (
      updateData.clientProfile &&
      typeof updateData.clientProfile === "object"
    ) {
      client.clientProfile = client.clientProfile || {};
      for (const key of Object.keys(updateData.clientProfile)) {
        if (updateData.clientProfile[key] !== undefined) {
          client.clientProfile[key] = updateData.clientProfile[key];
          clientProfileUpdated = true;
        }
      }
      delete updateData.clientProfile;
    }

    // 🔹 Allowed client fields
    const allowedFields = [
      "name",
      "dob",
      "diagnosis",
      "parentName",
      "email",
      "phone",
      "countryCode",
      "qsp",
      "clinicalSupervisor",
      "reviewDate",
      "criteria",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        client.set(field, updateData[field]);
        clientUpdated = true;
      }
    });

    // ✅ SAVE if any changes
    // console.log("3333.....", client);
    if (clientUpdated || providerUpdated || clientProfileUpdated) {
      // console.log("33555.....", client);

      await client.save();
    }

    const updatedClient = await Client.findById(clientId);

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: updatedClient,
    });
  } catch (error) {
    console.log(error);
    next(new ErrorHandler("Failed to update client", 500));
  }
};

const updateClientItpGoal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId, itpGoalId }: any = req.query;
    const { targetDate, baselinePercentage } = req.body;

    const result = await Client.updateOne(
      {
        _id: new mongoose.Types.ObjectId(clientId),
        "itpGoals._id": new mongoose.Types.ObjectId(itpGoalId),
      },
      {
        $set: {
          "itpGoals.$.targetDate": targetDate,
          "itpGoals.$.baselinePercentage": baselinePercentage,
        },
      }
    );

    if (result.matchedCount === 0) {
      return next(new ErrorHandler("ITP goal not found for this client", 404));
    }

    res.status(200).json({
      success: true,
      message: "ITP goal updated successfully",
    });
  } catch (error) {
    console.error(error);
    next(new ErrorHandler("Failed to update ITP goal", 500));
  }
};

const getProviders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;

    const providers: any = await Provider.find({
      organizationId: user?.organizationId,
    }).lean(); // lean for faster JSON objects

    if (!providers.length) {
      return next(new ErrorHandler("Providers Not found", 400));
    }

    // Loop through providers and count clients
    for (let provider of providers) {
      const providerId = provider._id;

      const totalClients = await Client.countDocuments({
        $or: [
          { assignedProvider: providerId },
          { qsp: providerId },
          { clinicalSupervisor: providerId },
        ],
      });

      provider.totalClients = totalClients; // add count to provider
    }

    return res.status(200).json({
      success: true,
      message: "Here is your providers",
      data: providers,
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};

const addProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;

    const {
      name,
      credential,
      clinicRole,
      systemRole,
      email,
      phone,
      countryCode,
      licenseNumber,
    } = req.body;
    const Email = email.toLowerCase();
    const findPrvoder = await Provider.findOne({
      email: Email,
      userStatus: User_Status.Active,
    });
    const sendSetPasswordEmail = async () => {
      const setPasswordToken = jwt.sign(
        { email: Email, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
      );
      const passwordLink = `${process.env.FRONTEND_URL}/set-account?token=${setPasswordToken}`;
      const subject = "Set Your Account Password";

      const text = `Click the link below to set your password:-\n\nThis link is valid for 1h minutes.`;

      const html = setPasswordLink(passwordLink);

      await sendMail(Email, subject, text, html);
    };
    if (findPrvoder) {
      await sendSetPasswordEmail();
      return res.status(200).json({
        success: true,
        message: "Invitation has been sent  to email.",
      });
    }
    let deafultpermissions;
    if (systemRole === SystemRoles.Admin) {
      deafultpermissions = defaultAdminPermissions;
    }
    if (systemRole === SystemRoles.User) {
      deafultpermissions = defaultUserPermissions;
    }
    // can he create
    const newProvider = new Provider({
      name,
      credential,
      clinicRole,
      systemRole,
      email: Email,
      phone,
      countryCode,
      licenseNumber,
      organizationId: user?.organizationId,
      permissions: deafultpermissions,
    });
    await newProvider.save();
    await sendSetPasswordEmail();
    return res.status(200).json({
      success: true,
      message: "Email has been send to user to set password",
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};

const setUpProviderAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY) as JwtPayload;
    const provider = await Provider.findOne({ email: decode?.email });
    if (!provider) {
      return next(new ErrorHandler(" Provider not found"));
    }
    if (decode.tokenVersion !== provider?.tokenVersion) {
      return next(new ErrorHandler("Token is expired", 400));
    }
    provider.password = password;
    provider.tokenVersion = provider.tokenVersion + 1;
    await provider.save();

    return res.status(200).json({
      success: true,
      message: "Password has been set for your account",
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};
const updateProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const updateData = req.body;

    const { providerId } = req.query;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return next(new ErrorHandler(" Provider not found", 400));
    }
    // if (provider?.systemRole ===SystemRoles?.SuperAdmin) {

    // }
    if (updateData.permissions) {
      updateData.permissions.forEach((perm) => {
        if (provider.permissions.includes(perm)) {
          provider.permissions = provider.permissions.filter((p) => p !== perm);
        } else {
          provider.permissions.push(perm);
        }
      });
      delete updateData.permissions;
    }

    Object.keys(updateData).forEach((key) => {
      provider.set(key, updateData[key]);
    });

    await provider.save();
    return res
      .status(200)
      .json({ success: true, message: "Provider Updated successfully" });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};

const viewPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { providerId } = req.query;
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return next(new ErrorHandler("Provider  not found"));
    }

    const permissions = provider?.permissions;
    return res.status(200).json({
      success: true,
      message: "Here is Permission of Provider",
      data: permissions,
    });
  } catch (error) {
    console.log(error, "error__");
    next(new ErrorHandler());
  }
};
const updateProviderPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { providerId, permissions } = req.body;

    if (!providerId) {
      return next(new ErrorHandler("providerId is required", 400));
    }

    if (!Array.isArray(permissions)) {
      return next(new ErrorHandler("permissions must be an array", 400));
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return next(new ErrorHandler("Provider not found", 404));
    }

    // 🔒 Super Admin protection
    if (provider.systemRole === SystemRoles.SuperAdmin) {
      return next(
        new ErrorHandler("Super Admin permissions cannot be modified", 403)
      );
    }

    // ✅ REPLACE permissions (idempotent)
    provider.permissions = permissions;

    await provider.save();

    return res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      data: provider.permissions,
    });
  } catch (error) {
    next(error);
  }
};

const addGoalBank = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const { category, discription, criteriaForMastry, masteryBaseline } =
      req.body;

    const duplicateGoal = await GoalBank.findOne({
      category,
      discription,
      organizationId: user.organizationId,
    });

    if (duplicateGoal) {
      return res.status(409).json({
        success: false,
        message: "This Goal  already exists in Goal Bank.",
      });
    }

    const newGoal = await GoalBank.create({
      category,
      discription,
      criteriaForMastry,
      organizationId: user.organizationId,
      masteryBaseline,
    });

    return res.status(201).json({
      success: true,
      message: "Goal Bank entry created successfully.",
      data: newGoal,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const viewGoalBank = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const goals = await GoalBank.find({
      organizationId: user?.organizationId,
      status: GoalBankStatus.Active,
    });

    return res.status(200).json({
      success: true,
      message: "Here  is  your organizations Goals",
      data: goals,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const editGoalBank = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { goalId } = req.query;
    const updateData = req.body;

    // Check if goal exists
    const existingGoal = await GoalBank.findOne({
      _id: goalId,
      organizationId: user.organizationId,
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found.",
      });
    }

    // DUPLICATE CHECK (category + description must be unique)
    if (updateData.category || updateData.discription) {
      const duplicate = await GoalBank.findOne({
        _id: { $ne: goalId },
        category: updateData.category ?? existingGoal.category,
        discription: updateData.discription ?? existingGoal.discription,
        organizationId: user.organizationId,
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Another goal with same category and description already exists.",
        });
      }
    }

    // Update record
    const updatedGoal = await GoalBank.findByIdAndUpdate(
      goalId,
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Goal Bank entry updated successfully.",
      data: updatedGoal,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const { goalId } = req.query;
    const goal = await GoalBank.findOneAndUpdate(
      { _id: goalId, organizationId: user?.organizationId },
      { $set: { status: GoalBankStatus.Deleted } }
    );
    return res
      .status(200)
      .json({ success: true, message: "Gaol deleted successfully." });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const addItpGoalsToClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const {
      clientId,
      goalId,
      targetDate,
      baselinePercentage,
      category,
      discription,
      criteriaForMastry,
    } = req.body;

    let finalGoalId = goalId;

    // 🔹 Create GoalBank goal if goalId not provided
    if (!goalId) {
      const newGoal = await GoalBank.create({
        category,
        discription,
        criteriaForMastry,
        organizationId: user?.organizationId,
      });

      finalGoalId = newGoal._id;
    }
    // 🔹 Validate existing GoalBank goal
    else {
      const goal = await GoalBank.findOne({
        _id: goalId,
        organizationId: user?.organizationId,
      });

      if (!goal) {
        return next(new ErrorHandler("Goal not found", 404));
      }
    }

    // 🔹 Prevent duplicate assignment
    const alreadyAssigned = await Client.findOne({
      _id: clientId,
      "itpGoals.goal": finalGoalId,
    });

    if (alreadyAssigned) {
      return next(
        new ErrorHandler("Goal already assigned to this client", 400)
      );
    }

    // 🔹 Assign goal to client
    const client = await Client.findOneAndUpdate(
      { _id: clientId },
      {
        $push: {
          itpGoals: {
            goal: finalGoalId,
            targetDate,
            baselinePercentage,
          },
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Goal assigned to client successfully",
      data: client,
    });
  } catch (error) {
    console.error(error);
    next(new ErrorHandler("Failed to assign goal to client", 500));
  }
};

const logOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    user.jti = null;

    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Logout successfully." });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const getAssignedClients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    const assignedClients = await Client.find({
      $or: [
        { qsp: userId },
        { clinicalSupervisor: userId },
        { assignedProvider: { $in: [userId] } }, // check in array
      ],
    });

    if (!assignedClients.length) {
      return next(new ErrorHandler("Assigned Clients not found.", 400));
    }

    return res.json({
      success: true,
      message: "Assigned Clients found successfully.",
      data: assignedClients,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const getArchivedGoals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { clientId } = req.query;

    const client = await Client.findOne({
      _id: clientId,
      organizationId: user?.organizationId,
    }).populate("itpGoals.goal");

    const archivedGoals = client.itpGoals.filter((g) =>
      [GoalStatus.Mastered, GoalStatus.Discontinued].includes(g.goalStatus)
    );
    return res.status(200).json({
      success: true,
      message: "Archived Goals found scuccessfully",
      data: archivedGoals,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};

const progressReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { clientId } = req.query;

    // Fetch client details with populated goals
    const client = await Client.findById(clientId)
      .populate({
        path: "itpGoals.goal",
        model: "GoalBank",
        select: "category discription criteriaForMastry masteryBaseline",
      })
      .lean();

    // console.log("::::::::Client", client, "::::::::Client");

    if (!client) {
      return next(new ErrorHandler("Client not found", 404));
    }

    // Calculate date range - last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Fetch all session data collections for this client in the last 30 days
    const sessionDataCollections = await DataCollection.find({
      clientId: clientId,
      createdAt: { $gte: startDate, $lte: endDate },
      organizationId: user?.organizationId,
    })
      .populate({
        path: "sessionId",
        model: "Session",
        select: "dateOfSession startTime endTime sessionType status",
      })
      .populate({
        path: "goals_dataCollection.goalId",
        model: "GoalBank",
        select: "category discription criteriaForMastry",
      })
      .sort({ createdAt: 1 })
      .lean();
    // console.log("::::::::Client", sessionDataCollections, "::::::::Client");
    // Process goals progress data
    const goalsProgressData: GoalProgressData[] = [];
    const fedcObservationMap = new Map<string, number>();

    // Group session data by goal
    const goalSessionMap = new Map<
      string,
      Array<{
        date: Date;
        accuracy: number;
        supportLevel: SupportLevelData;
        total: number;
        clientVariables?: string;
      }>
    >();

    sessionDataCollections.forEach((sessionData: any) => {
      const sessionDate =
        sessionData.sessionId?.dateOfSession || sessionData.createdAt;
      const clientVariables = sessionData.providerObservation || "";

      sessionData.goals_dataCollection.forEach((goalData: any) => {
        const goalId = goalData.goalId._id.toString();

        if (!goalSessionMap.has(goalId)) {
          goalSessionMap.set(goalId, []);
        }

        goalSessionMap.get(goalId)!.push({
          date: new Date(sessionDate),
          accuracy: goalData.accuracy || 0,
          supportLevel: goalData.supportLevel || {
            independent: { count: 0, success: 0, miss: 0 },
            minimal: { count: 0, success: 0, miss: 0 },
            modrate: { count: 0, success: 0, miss: 0 },
          },
          total: goalData.total || 0,
          clientVariables: clientVariables,
        });

        // Track FEDC observations
        const category = goalData.goalId.category;
        if (category) {
          fedcObservationMap.set(
            category,
            (fedcObservationMap.get(category) || 0) + 1
          );
        }
      });
    });

    // Build goal progress data for each ITP goal
    client.itpGoals.forEach((itpGoal: any, index: number) => {
      const goalId = itpGoal.goal._id.toString();
      const goalSessions = goalSessionMap.get(goalId) || [];

      // Calculate support level percentages
      const calculateSupportLevelPercentage = (
        supportLevel: SupportLevelData,
        type: "independent" | "minimal" | "modrate"
      ): number => {
        const data = supportLevel[type];
        if (data.count === 0) return 0;
        return Math.round((data.success / data.count) * 100);
      };

      // Process session data
      const sessionData = goalSessions.map((session) => {
        const independentPercentage = calculateSupportLevelPercentage(
          session.supportLevel,
          "independent"
        );
        const minimalPercentage = calculateSupportLevelPercentage(
          session.supportLevel,
          "minimal"
        );
        const moderatePercentage = calculateSupportLevelPercentage(
          session.supportLevel,
          "modrate"
        );

        return {
          date: formatSessionDate(session.date),
          fullDate: session.date,
          accuracy: session.accuracy,
          independent: independentPercentage,
          minimal: minimalPercentage,
          moderate: moderatePercentage,
          total: session.total,
          clientVariables: session.clientVariables,
          hasVariables: hasClientVariables(session.clientVariables || ""),
        };
      });

      // Calculate averages
      const calculateAverage = (key: keyof (typeof sessionData)[0]): number => {
        if (sessionData.length === 0) return 0;
        const sum = sessionData.reduce(
          (acc, session) => acc + (session[key] as number),
          0
        );
        return Math.round(sum / sessionData.length);
      };

      const averages = {
        overall: calculateAverage("accuracy"),
        independent: calculateAverage("independent"),
        minimal: calculateAverage("minimal"),
        moderate: calculateAverage("moderate"),
      };

      // Determine goal colors based on index
      const color = getGoalColor(index);

      // Determine current status
      const masteryPercentage =
        itpGoal.goal.criteriaForMastry?.masteryPercentage || 80;
      const requiredSessions =
        itpGoal.goal.criteriaForMastry?.acrossSession ||
        client.criteria?.sessionCount ||
        3;

      const currentStatus = determineGoalStatus(
        averages.overall,
        masteryPercentage,
        sessionData.length,
        requiredSessions,
        itpGoal.goalStatus
      );

      // Calculate trend
      const trend = calculateTrend(sessionData);

      goalsProgressData.push({
        goalId: goalId,
        category: itpGoal.goal.category,
        goal: itpGoal.goal.discription,
        baseline:
          itpGoal.baselinePercentage || itpGoal.goal.masteryBaseline || 0,
        target: masteryPercentage,
        dataKey: `goal${index + 1}`,
        color: color,
        sessionData: sessionData,
        averages: averages,
        currentStatus: currentStatus,
        trend: trend,
        totalSessions: sessionData.length,
      });
    });

    // Build FEDC observation data
    const totalSessions = sessionDataCollections.length;
    const fedcObservationData: FEDCObservation[] = sortFEDCObservations(
      Array.from(fedcObservationMap.entries()).map(([fedc, count]) => ({
        fedc: fedc,
        observations: count,
        percentage:
          totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      }))
    );

    // Prepare response
    const progressReport = {
      clientInfo: {
        id: client._id,
        name: client.name,
        age: client.age,
        diagnosis: client.diagnosis,
      },
      dateRange: {
        startDate: startDate,
        endDate: endDate,
      },
      totalSessions: totalSessions,
      goalsProgress: goalsProgressData,
      fedcObservations: fedcObservationData,
      summary: {
        averageOverallPerformance:
          goalsProgressData.length > 0
            ? Math.round(
                goalsProgressData.reduce(
                  (sum, goal) => sum + goal.averages.overall,
                  0
                ) / goalsProgressData.length
              )
            : 0,
        goalsInProgress: goalsProgressData.filter(
          (g) => g.currentStatus === "In Progress"
        ).length,
        goalsMastered: goalsProgressData.filter(
          (g) => g.currentStatus === "Mastered"
        ).length,
        goalsDiscontinued: goalsProgressData.filter(
          (g) => g.currentStatus === "Discontinued"
        ).length,
      },
    };

    return res.status(200).json({
      success: true,
      data: progressReport,
      message: "Progress report retrieved successfully",
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler("Failed to fetch progress report", 500));
  }
};

// const goalProgressReview = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { user } = req;
//     const { clientId } = req.query;
//     const reviewData = await DataCollection.find({
//       clientId,
//       organizationId: user.organizationId,
//     }) .populate({
//         path: "sessionId",
//         model: "Session",
//         select: "dateOfSession startTime endTime sessionType status",
//       })
//       .populate("clientId")
//       .populate({
//         path: "goals_dataCollection.goalId",
//         model: "GoalBank",
//         select: "category discription criteriaForMastry",
//       })
//   } catch (error) {
//     console.log("error__", error);
//     next(new ErrorHandler());
//   }
// };

const goalProgressReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { clientId } = req.query;
    const { days = 30 } = req.query; // Default to 30 days

    if (!clientId) {
      return next(new ErrorHandler("Client ID is required", 400));
    }

    // Calculate date range (last 30 days by default)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Get client data with ITP goals
    const client = await Client.findOne({
      _id: clientId,
      organizationId: user.organizationId,
      userStatus: User_Status.Active,
    }).populate({
      path: "itpGoals.goal",
      model: "GoalBank",
      match: { status: GoalBankStatus.Active },
      select: "category discription criteriaForMastry",
    });

    if (!client) {
      return next(new ErrorHandler("Client not found", 404));
    }

    // Get all data collection records for this client in the date range
    const dataCollections = await DataCollection.find({
      clientId,
      organizationId: user.organizationId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate({
        path: "sessionId",
        model: "Session",
        match: { status: { $ne: SessionStatus.Abandon } },
        select: "dateOfSession startTime endTime sessionType status",
      })
      .populate({
        path: "goals_dataCollection.goalId",
        model: "GoalBank",
        select: "category discription criteriaForMastry status",
      })
      .lean();

    // Filter out records where session was not populated (deleted sessions)
    const validDataCollections = dataCollections.filter(
      (dc) => dc.sessionId !== null
    );

    // Process goals data
    const goalsMap = new Map();

    client.itpGoals.forEach((itpGoal: any) => {
      if (itpGoal.goal) {
        const goalId = itpGoal.goal._id.toString();
        goalsMap.set(goalId, {
          goalId: itpGoal.goal._id,
          category: itpGoal.goal.category,
          description: itpGoal.goal.discription,
          targetDate: itpGoal.targetDate,
          baselinePercentage: itpGoal.baselinePercentage,
          goalStatus: itpGoal.goalStatus, // This will be Mastered, Discontinued, or InProgress
          masteryPercentage:
            itpGoal.goal.criteriaForMastry?.masteryPercentage || 80,
          masterySessionCount:
            itpGoal.goal.criteriaForMastry?.acrossSession || 3,
          supportLevel:
            itpGoal.goal.criteriaForMastry?.supportLevel ||
            SupportLevel.Independent,
          sessionsData: [],
          totalSessions: 0,
          performanceByDate: [],
        });
      }
    });

    // Aggregate performance data for each goal
    validDataCollections.forEach((dataCollection: any) => {
      dataCollection.goals_dataCollection.forEach((goalData: any) => {
        const goalId = goalData.goalId._id.toString();

        if (goalsMap.has(goalId)) {
          const goal = goalsMap.get(goalId);
          const masteryLevel = goal.supportLevel.toLowerCase();

          // Get performance at the required support level for mastery
          let performance = null;
          if (
            masteryLevel === SupportLevel.Independent &&
            goalData.supportLevel?.independent
          ) {
            const { success = 0, count = 0 } =
              goalData.supportLevel.independent;
            performance = count > 0 ? (success / count) * 100 : 0;
          } else if (
            masteryLevel === SupportLevel.Minimal &&
            goalData.supportLevel?.minimal
          ) {
            const { success = 0, count = 0 } = goalData.supportLevel.minimal;
            performance = count > 0 ? (success / count) * 100 : 0;
          } else if (
            masteryLevel === SupportLevel.Moderate &&
            goalData.supportLevel?.modrate
          ) {
            const { success = 0, count = 0 } = goalData.supportLevel.modrate;
            performance = count > 0 ? (success / count) * 100 : 0;
          }

          if (performance !== null) {
            goal.sessionsData.push({
              sessionDate: (dataCollection.sessionId as any)?.dateOfSession,
              performance: Math.round(performance),
              accuracy: goalData.accuracy,
            });
            goal.uniqueSessionIds = goal.uniqueSessionIds || new Set();
            goal.uniqueSessionIds.add(dataCollection.sessionId._id.toString());
            goal.performanceByDate.push({
              date: (dataCollection.sessionId as any)?.dateOfSession,
              percentage: Math.round(performance),
            });
          }
        }
      });
    });

    // Calculate statistics for each goal
    const goalsReview = Array.from(goalsMap.values()).map((goal) => {
      // Calculate average performance
      const performances = goal.sessionsData.map((s) => s.performance);
      const avgPercentage =
        performances.length > 0
          ? Math.round(
              performances.reduce((a, b) => a + b, 0) / performances.length
            )
          : 0;

      // Calculate trend (compare first half vs second half)
      let trend = "stable";
      if (performances.length >= 4) {
        const midPoint = Math.floor(performances.length / 2);
        const firstHalf = performances.slice(0, midPoint);
        const secondHalf = performances.slice(midPoint);

        const firstAvg =
          firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg =
          secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondAvg > firstAvg + 5) trend = "up";
        else if (secondAvg < firstAvg - 5) trend = "down";
      }

      return {
        id: goal.goalId,
        category: goal.category,
        goal: goal.description,
        avgPercentage,
        trend,
        sessionsTracked: goal.uniqueSessionIds ? goal.uniqueSessionIds.size : 0,
        goalStatus: goal.goalStatus, // Mastered, Discontinued, or InProgress
        masteryPercentage: goal.masteryPercentage.toString(),
        masterySessionCount: goal.masterySessionCount.toString(),
        supportLevel: goal.supportLevel.toLowerCase(),
        targetDate: goal.targetDate,
        baselinePercentage: goal.baselinePercentage,
        performanceHistory: goal.performanceByDate.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      };
    });

    // Sort goals by category
    goalsReview.sort((a, b) => a.category.localeCompare(b.category));

    return res.status(200).json({
      success: true,
      message: "Goal Review Progress report found successfully. ",
      data: {
        client: {
          id: client._id,
          name: client.name,
          age: client.age,
        },
        dateRange: {
          start: startDate,
          end: endDate,
          days: Number(days),
        },
        goals: goalsReview,
        summary: {
          totalGoals: goalsReview.length,
          mastered: goalsReview.filter(
            (g) => g.goalStatus === GoalStatus.Mastered
          ).length,
          inProgress: goalsReview.filter(
            (g) => g.goalStatus === GoalStatus.InProgress
          ).length,
          discontinued: goalsReview.filter(
            (g) => g.goalStatus === GoalStatus.Discontinued
          ).length,
        },
      },
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler("Failed to fetch goal progress review", 500));
  }
};

export const providerController = {
  addProvider,
  updateProvider,
  login,
  getUserProfile,
  verifyOtp,
  sendOtp,
  getClients,
  addClient,
  getProviders,
  viewPermission,
  updateClient,
  setUpProviderAccount,
  addGoalBank,
  viewGoalBank,
  editGoalBank,
  deleteGoal,
  getClientProfie,
  addItpGoalsToClient,
  logOut,
  updateProviderPermissions,
  getAssignedClients,
  updateClientItpGoal,
  getArchivedGoals,
  goalProgressReview,
  progressReport,
};
