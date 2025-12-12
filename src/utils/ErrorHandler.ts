

class ErrorHandler extends Error{
    statusCode:number
    constructor(error?:any, statusCode?:number){
        super(error)
         this.statusCode = statusCode
    }
}
export default ErrorHandler