import mongoose from "mongoose";
import { REPORT_STATUS } from "../utils/enums/enums.js";

const reportsModel = new mongoose.Schema({
  subjective: {
    type: String,
  },
  client: {
    name: { type: String },
    dob: { type: Date },
  },
  provider: {
    name: { type: String },
    credentail: { type: String },
  },
  session: {
    startTime: { type: Date },
    endTime: { type: Date },
  },
  date: {
    type: Date,
  },
  totalDuration: { type: Number },
  clientVariables: { type: String },

  session_context: { type: String },
  observations: { type: String },
  supportObserved: {
    type: [String],
  },
  activities: {
    type: [String],
  },
  assessment: {
    type: String,
  },
  plan: {
    type: String,
  },
  signature: {
    type: String,
  },
  orgnaizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
  },
  goals: [
    {
      description: { type: String },
      accuracy: { type: Number },
      performance: { type: String },
      supportLevel: { type: String },
      progressSummery: { type: String },
      successfull: { type: Number },
      missed: { type: Number },
    },
  ],
  status: {
    type: String,
    enum: [REPORT_STATUS.DRAFT, REPORT_STATUS.PENDING_QSP_SIGNATURE, REPORT_STATUS.SIGNED],
    default: REPORT_STATUS?.DRAFT,
  },
  qspSignature: {
    type: String,
  },
});

const Report = mongoose.model("Report", reportsModel);
export default Report;
