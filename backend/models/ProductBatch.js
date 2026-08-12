const mongoose = require("mongoose");

const batchStatusEnum = ["active", "expired", "recalled", "suspended"];
const verificationStatusEnum = ["verified", "pending", "rejected", "not_available"];
const labStatusEnum = ["verified", "pending", "expired", "rejected", "not_available"];
const paramCategoryEnum = ["identity", "quality", "contaminant", "safety"];
const paramStatusEnum = ["pass", "fail", "pending"];

const productBatchSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
      index: true,
    },
    compliance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCompliance",
    },

    // Batch Identification
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: batchStatusEnum,
      default: "active",
      index: true,
    },
    manufacturedAt: { type: Date },
    bestBefore: { type: Date },

    // Quality Verification
    qualityVerification: {
      status: { type: String, enum: verificationStatusEnum, default: "pending" },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastReviewedAt: { type: Date },
    },

    // Laboratory Evidence (Batch-specific)
    laboratoryEvidence: [
      {
        status: { type: String, enum: labStatusEnum, default: "pending" },
        laboratory: { type: String, default: "" },
        accreditation: { type: String, default: "" },
        reportNumber: { type: String, default: "" },
        testDate: { type: Date },
        sampleBatch: { type: String, default: "" },
        parameters: [
          {
            name: { type: String, required: true },
            category: { type: String, enum: paramCategoryEnum, default: "quality" },
            status: { type: String, enum: paramStatusEnum, default: "pending" },
          },
        ],
        evidenceDocId: { type: mongoose.Schema.Types.ObjectId },
        expiresAt: { type: Date },
        verifiedAt: { type: Date },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // Traceability
    traceability: {
      status: { type: String, enum: verificationStatusEnum, default: "pending" },
      origin: { type: String, default: "" },
      region: { type: String, default: "" },
      producer: { type: String, default: "" },
      processing: { type: String, default: "" },
      packaging: { type: String, default: "" },
      distribution: { type: String, default: "" },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastReviewedAt: { type: Date },
    },

    // Trace ID (Server-generated, immutable, unique)
    traceId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    traceIdGeneratedAt: { type: Date },

    // QR Code Metadata (Verification URL string ONLY, no base64 image)
    qrVerificationUrl: { type: String, default: "" },

    // Internal Notes
    adminNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
productBatchSchema.index({ product: 1, status: 1, createdAt: -1 });
productBatchSchema.index({ product: 1, batchNumber: 1 }, { unique: true });

const ProductBatch = mongoose.model("ProductBatch", productBatchSchema);
module.exports = ProductBatch;
