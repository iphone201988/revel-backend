import { NextFunction, Request, Response } from "express";

import ErrorHandler from "../utils/ErrorHandler.js";

  const authorization = (permission: string) => {
      // console.log(permission,"permisssion")
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      
      if (!user.permissions.includes(permission)) {
        return next(new ErrorHandler("User does not have permission.", 400));
      }     
      next();
    } catch (error) {
      return next(new ErrorHandler());
    }
  };
};

export default authorization;
