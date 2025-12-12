import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler.js";

export const validate = (schema:any)=>{

    return (req: Request, res: Response, next: NextFunction)=>{
       try {
           if (schema.body) {
        const { error } = schema.body.validate(req.body, { abortEarly: false });
        if (!req.body) {
          return next(new ErrorHandler("Request body is undifined", 400));
        }
        if (error) {
          console.log("error---", error.details[0].message);

          return next(new ErrorHandler(error.details[0].message, 400));
        }
      }
          if (schema.query) {
                const { error } = schema.query.validate(req.query, { abortEarly: false })
                 if (!req.query) {
          return next(new ErrorHandler("Request query is undifined", 400));
        }
                if (error) {
                    console.log(error?.details[0].message, "error---");
                    return next( new ErrorHandler(
                      error?.details[0].message, 400
                    ))
                }
            }

        if(schema.params){
          const {error} = schema.params.validate(req.params, {abortEarly:false})
          if (!req.params) {
            return next(new ErrorHandler("Request params is undifined", 400));
          }
          if (error) {
            console.log(error?.details[0].message, "error---");
                    return next( new ErrorHandler(
                      error?.details[0].message, 400
                    ))
          }
        }

        next()
       } catch (error) {
        console.log("error", error);
       next(new ErrorHandler());
       }
    }

}