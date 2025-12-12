import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userEmail: String,
    userName:String,
    action: String,
    resource: String,
    // resourceId: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    status: { type: String, default: "success" },
  },
  { timestamps: true }
);

AuditLogSchema.index({ organizationId: 1 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ createdAt: 1 });

const AuditLogs = mongoose.model('AuditLog', AuditLogSchema)

export default AuditLogs