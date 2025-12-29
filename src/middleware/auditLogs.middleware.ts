import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";
import AuditLogs from "../models/auditLogs.model.js";
import { auditRouteMap, getClientIp } from "../utils/helper.js";

const auditLogs = async (req: Request, res: Response, next: NextFunction) => {


  console.log('');
  
  res.on("finish", async () => {
    try {
      if (res?.statusCode >= 400) return;

  
const ipAddress = getClientIp(req);
      const { user } = req;
      console.log(user, "user");

      const key = `${req.method} ${req.originalUrl}`;
      const auditMeta = auditRouteMap[key];
      if (!auditMeta) return;
      await AuditLogs.create({
        organizationId: user?.organizationId || null,
        user: user?._id || null,
        userName: user?.name || null,
        userEmail: user?.email || null,
        action: auditMeta.action,
        resource: auditMeta.resource,
        clientId: req?.query?.clientId ? req?.query?.clientId : undefined,
        ipAddress,

        details: {
          params: req.params,
          query: req.query,
        },
      });
    } catch (error) {
      console.log(error, "error__");
      next(new ErrorHandler());
    }
  });
  next();
};

export default auditLogs;
