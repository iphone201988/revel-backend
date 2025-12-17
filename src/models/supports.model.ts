import mongoose from "mongoose";

const supportsSchema = new mongoose.Schema(
  {
    supports: {
      type: [String],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  { timestamps: true }
);

export const Supports = mongoose.model("Supports", supportsSchema);
