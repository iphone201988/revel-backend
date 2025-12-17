import mongoose, { mongo } from "mongoose";
import { SessionStatus, SessionType } from "../utils/enums/enums.js";

const sessionModel = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provider",
  },
  sessionType: {
    type: String,
    enum: [
      SessionType.Baseline_Data_Collection,
      SessionType.Progress_Monitoring,
    ],
  },
  dateOfSession: {
    type: Date,
  },
  startTime: {
    type:Date
  },
  endTime:{
    type:Date
  },
  clientVariables:{
    type:String
  },
  present:{
    type:String
  },
  organizationId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Organization"
  },
  status:{
    type :String,
    enum: [SessionStatus.Active, SessionStatus.Deleted,SessionStatus.Abandon],
    default: SessionStatus.Active
  }

});

const Session = mongoose.model("Session", sessionModel)
export default Session 
