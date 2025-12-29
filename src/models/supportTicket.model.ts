import mongoose from "mongoose";
import {
  SupportPriority,
  TicketSupportCategory,
} from "../utils/enums/enums.js";

const supportTicketModel = new mongoose.Schema(
  {
    subject: {
      type: String,
    },
    category: {
      type: String,
      enum: Object.values(TicketSupportCategory),
    },
    priority: {
      type: String,
      enum: Object.values(SupportPriority),
    },
    discription: {
      type: String,
    },
    image: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  {
    timestamps: true,
  }
);

const SubmitTicket = mongoose.model("SubmitTicket", supportTicketModel);
export default SubmitTicket;
