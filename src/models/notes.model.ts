import mongoose from "mongoose";

const reportsModel = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
  },
  subjective: {
    type: String,
  },
  objective: {
    session_context: { type: String },
    observations:{type:String},
    
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
});

const Report = mongoose.model("Report", reportsModel);
export default Report;
