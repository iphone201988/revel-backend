// src/models/Organization.ts
import mongoose from "mongoose";
import { Status, SystemRoles } from "../utils/enums/enums.js";
import bcrypt from "bcrypt";
const orgModel = new mongoose.Schema(
  {
    clinicName: {
      type: String,
    },
    ownerFirstName: {
      type: String,
    },
    ownerLastName: {
      type: String,
    },
    ownerEmail: {
      type: String,
      lowercase: true,
    },
    ownerPhone: {
      type: String,
    },
    countryCode:{
      type:String
    },
    clinicAddress: {
      type: String,
    },
    clinicCity: {
      type: String,
    },
    clinicState: {
      type: String,
    },
    clinicZip: {
      type: String,
    },
    password: {
      type: String,
    },
    systemRole: {
      type: String,
      enum: [SystemRoles.SuperAdmin],
      default: SystemRoles.SuperAdmin,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [Status.Active, Status.Closed],
      default: Status.Active,
    },
  
  },
  { timestamps: true }
);
orgModel.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

const Organization = mongoose.model("Organization", orgModel);
export default Organization;
