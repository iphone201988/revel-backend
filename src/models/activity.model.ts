import mongoose from "mongoose";

const activitiesSchema = new mongoose.Schema(
  {
    activities: {
      type: [String],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  { timestamps: true }
);

export const Activities = mongoose.model("Activities", activitiesSchema);
