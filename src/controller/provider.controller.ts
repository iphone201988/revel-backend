import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";
import Provider from "../models/provider.model.js";
import {
  SystemRoles,
  User_Status,
  VerficationType,
} from "../utils/enums/enums.js";
import bcrypt from "bcrypt";
import {
  defaultAdminPermissions,
  defaultUserPermissions,
  generateOtp,
  generateRandomString,
  sendMail,
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
    if (clientUpdated || providerUpdated || clientProfileUpdated) {
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
    const goals = await GoalBank.find({ organizationId: user?.organizationId });
    if (!goals.length) {
      return next(new ErrorHandler("Goals not found", 400));
    }
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
  getClientProfie,
  addItpGoalsToClient,
  logOut,
  updateProviderPermissions,
  getAssignedClients,
  updateClientItpGoal,
};
