import mongoose from "mongoose";
import { User_Status } from "../utils/enums/enums.js";

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
    },
  ],
  criteria: {
    masteryPercentage: {
      type: Number,
    },
    sessionCount: {
      type: Number,
    },
  },
  userStatus:{
    type:String,
    enum:[User_Status.Active, User_Status.Deleted],
    default :User_Status.Active
  }

  //Every client has an ITP Review Date → the date when their Individual Treatment Plan must be reviewed by the provider/QSP (usually required every 90 days
});

const Client = mongoose.model("Client", clientModel);
export default Client;
