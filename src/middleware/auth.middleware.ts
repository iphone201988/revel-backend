import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import ErrorHandler from '../utils/ErrorHandler.js';
import Provider from '../models/provider.model.js';
import { User_Status } from '../utils/enums/enums.js';



export const auth = async(req: Request, res: Response, next: NextFunction)=>{
    try {
    if (!req.headers.authorization) {
      return next(new ErrorHandler("Invalid Headers", 401));
    }

    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return next(new ErrorHandler("Token Required", 401));
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY) as JwtPayload;
    if (!decode) {
      return next(new ErrorHandler("Invalid Token", 401));
    }
    
    req.userId = decode.userId;
    req.jti = decode.jti;
    req.user = await Provider.findById(decode.userId);
    // console.log('====================================');
    
    if (!req.user) {
      return next(new ErrorHandler("Invalid Token", 401));
    }
    
    
    if (req.user.userStatus === User_Status.Deleted) {
      return next(new ErrorHandler("User account is deleted", 400));
    }
    if (req.user.jti !== decode.jti) {
  return next(new ErrorHandler("Old token. Please login again.", 401));
}
    next();
  } catch (error: any) {
    console.log("error---eeee", error);
    if (error.message === "invalid signature" ) {
        return next(new ErrorHandler("Invalid authentication token", 401));
    }
     if (error.message == "jwt expired") {
        return next(new ErrorHandler("Invalid authentication token", 401));
     }
    if (error.message == "invalid token" ||error.message =="jwt malformed") {
        return next(new ErrorHandler("Invalid authentication token", 401));
     }
    return next(new ErrorHandler());
  }
    
}