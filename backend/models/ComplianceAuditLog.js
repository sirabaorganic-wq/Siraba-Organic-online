const mongoose = require("mongoose");

const complianceAuditLogSchema = mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["product_compliance", "product_batch"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    action: {
      type: String,
      enum: [
        "created",
        "status_changed",
        "dimension_verified",
        "dimension_rejected",
        "dimension_expired",
        "trust_status_recomputed",
        "claim_verified",
        "claim_rejected",
        "batch_created",
        "trace_id_generated",
        "revoked",
      ],
      required: true,
    },
    dimension: { type: String, default: "" },
    previousStatus: { type: String, default: "" },
    newStatus: { type: String, default: "" },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedAt: { type: Date, default: Date.now },
    reason: { type: String, default: "" },
    evidenceReference: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

complianceAuditLogSchema.index({ entityId: 1, performedAt: -1 });
complianceAuditLogSchema.index({ productId: 1, performedAt: -1 });

const ComplianceAuditLog = mongoose.model("ComplianceAuditLog", complianceAuditLogSchema);
module.exports = ComplianceAuditLog;
