import mongoose from "mongoose";
import { GoalStatus, SupportLevel, User_Status } from "../utils/enums/enums.js";

const clientModel = new mongoose.Schema({
  name: {
    type: String,
  },
  dob: {
    type: Date,
  },
  diagnosis: {
    type: String,
  },
  parentName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  countryCode: {
    type: String,
  },
  assignedProvider: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },
  ],
  qsp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provider",
  },
  clinicalSupervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provider",
  },
  reviewDate: {
    type: Date,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
  },
  age:{
    type:Number
  },
  itpGoals: [
    {
      goal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GoalBank",
      },

      targetDate: {
        type: Date,
      },

      baselinePercentage: {
        type: Number,
      },
      goalStatus:{
        type:String,
        enum:[GoalStatus.Discontinued,GoalStatus.Mastered, GoalStatus.InProgress],
        default:GoalStatus.InProgress
      },
      reason:{
        type:String
      },
      successRate:{
        type:Number
      },
      date:{
        type:Date
      }, 
      masteryPercentage: {
        type: Number,    
      },
      sessionCount: {
        type: Number,
      },
      supportLevel:{
        type:String,
        enum:[SupportLevel.Independent, SupportLevel.Minimal,SupportLevel.Moderate]
      }
    },
  ],
  
  userStatus:{
    type:String,
    enum:[User_Status.Active, User_Status.Deleted],
    default :User_Status.Active
  },
   clientProfile: {
      interests: {
        type: String,
        default: "",
      },
      strengths: {
        type: String,
        default: "",
      },
      challenges: {
        type: String,
        default: "",
      },
      familyContext: {
        type: String,
        default: "",
      },
      preferredActivities: {
        type: String,
        default: "",
      },
      sensoryProcessing: {
        type: String,
        default: "",
      },
      communication: {
        type: String,
        default: "",
      },
      safetyConsiderations: {
        type: String,
        default: "",
      },
    },

  //Every client has an ITP Review Date → the date when their Individual Treatment Plan must be reviewed by the provider/QSP (usually required every 90 days
});

const Client = mongoose.model("Client", clientModel);
export default Client;
