import { timeStamp } from "console";
import mongoose from "mongoose";
import { ref } from "process";
import { SupportLevel } from "../utils/enums/enums.js";

const sessionDataModel = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    goals_dataCollection: [
      {
        goalId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "GoalBank",
        },
        mastryPercentage:{
          type:Number
        },
        sessionCount:{
          type:Number
        },
        mastrySupportLevel:{
          type:String,
          enum:[SupportLevel.Independent, SupportLevel.Moderate, SupportLevel.Minimal]
        },
        
        accuracy: {
          type: Number,
    
        },
        total: {
          type: Number,
        },
        supportLevel: {
          independent: {
            count: { type: Number },
            miss: { type: Number },
            success: { type: Number },
          },
          minimal: {
            count: { type: Number },
            miss: { type: Number },
            success: { type: Number },
          },
          modrate: {
            count: { type: Number },
            miss: { type: Number },
            success: { type: Number },
          },
        },

        counter: {
          type: Number,
        },
        time: {
          type: Date,
        },
      },
    ],
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    activityEngaged: {
      type: [String],
    },
    supportsObserved: {
      type: [String],
    },
    duration: {
      type: Number, // in seconds
    },
    providerObservation: {
      type: String,
    },
  },

  { timestamps: true }
);
const DataCollection = mongoose.model("GoalDataCollection", sessionDataModel);
export default DataCollection;
