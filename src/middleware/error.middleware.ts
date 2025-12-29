import { NextFunction, Request, Response } from "express"

export const errorMiddleware = (error:any, req:Request, res:Response, next:NextFunction)=>{
    console.log(error,"error");
    console.log(error.statusCode,"status code");
    
    (error.message = error.message || "Internal Server Error"),
    (error.statusCode = error.statusCode || 500)

    return res.status(error.statusCode).json({
        success:false,
        message: error.message
    })
}