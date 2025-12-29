import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId: any;
      jti:any
      useragent?: any;
      file?:any
    }
  }
}