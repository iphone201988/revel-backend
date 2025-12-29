import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";
import SubmitTicket from "../models/supportTicket.model.js";

export const submitSupportTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subject, category, priority, discription } = req.body;
    const image = req.file ? req.file.path : null;
    const { user, userId } = req;
    const ticket = await SubmitTicket.create({
      subject,
      category,
      priority,
      discription,
      image,
      userId,
      organizationId: user?.organizationId,
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket submitted successfully",
      data: ticket,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Something went wrong", 500));
  }
};
