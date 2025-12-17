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
  Permission,
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
    const allPermissions = Object.values(Permission);
    const provider = new Provider({
      name: ownerFirstName + ownerLastName,

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

const reportsOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const toatlSession = await Session.countDocuments({
      organizationId: user?.organizationId,
    });
    const totalTimeResult = await DataCollection.aggregate([
      {
        $match: { organizationId: user.organizationId }, // optional filter
      },
      {
        $group: {
          _id: null,
          totalTime: { $sum: "$duration" }, // replace "duration" with your field name
        },
      },
    ]);

    const totalTime = totalTimeResult[0]?.totalTime || 0;

    const totalClients = await Client.countDocuments({
      organizationId: user?.organizationId,
      userStatus: User_Status.Active,
    });
    const totalProviders = await Provider.countDocuments({
      organizationId: user?.organizationId,
      userStatus: User_Status.Active,
    });
  } catch (error) {
    console.log("error__", error);
    next(new ErrorHandler());
  }
};


export const orgController = {
  registerOrganization,
};
