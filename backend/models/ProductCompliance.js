const mongoose = require("mongoose");

const statusEnum = ["verified", "pending", "expired", "rejected", "not_available"];
const scientificStatusEnum = ["verified", "pending", "expired", "rejected", "not_available", "not_applicable"];
const claimStatusEnum = ["verified", "pending", "rejected"];

const productComplianceSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
      index: true,
    },

    // 01 Certification
    certification: {
      status: { type: String, enum: statusEnum, default: "pending" },
      standard: { type: String, default: "" },
      certificationBody: { type: String, default: "" },
      certificateNumber: { type: String, default: "" },
      validFrom: { type: Date },
      validUntil: { type: Date },
      productScope: { type: String, default: "" },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastReviewedAt: { type: Date },
      expiresAt: { type: Date },
      evidenceDocId: { type: mongoose.Schema.Types.ObjectId },
    },

    // 02 Regulatory
    regulatory: {
      fssai: {
        status: { type: String, enum: statusEnum, default: "pending" },
        licenseNumber: { type: String, default: "" },
        validUntil: { type: Date },
        verifiedAt: { type: Date },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        lastReviewedAt: { type: Date },
        expiresAt: { type: Date },
      },
    },

    // 03 Product Verification
    productVerification: {
      status: { type: String, enum: statusEnum, default: "pending" },
      labelVerified: { type: Boolean, default: false },
      ingredientsVerified: { type: Boolean, default: false },
      specificationVerified: { type: Boolean, default: false },
      claimsReviewed: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastReviewedAt: { type: Date },
    },

    // 04 Scientific Verification
    scientificVerification: {
      status: { type: String, enum: scientificStatusEnum, default: "pending" },
      summary: { type: String, default: "" },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastReviewedAt: { type: Date },
    },

    // 05 SIRABA Qualification
    sirabaQualification: {
      status: { type: String, enum: statusEnum, default: "pending" },
      vendorQualified: { type: Boolean, default: false },
      marketplaceApproved: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastReviewedAt: { type: Date },
    },

    // Verified Product Claims
    verifiedClaims: [
      {
        claim: { type: String, required: true },
        status: { type: String, enum: claimStatusEnum, default: "pending" },
        reviewedAt: { type: Date },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        evidenceReference: { type: String, default: "" },
      },
    ],

    // Computed Trust Status (Safety fallback calculation via pre('save'))
    trustStatus: {
      isCertified: { type: Boolean, default: false },
      isVerified: { type: Boolean, default: false },
      isQualified: { type: Boolean, default: false },
      isTripleVerified: { type: Boolean, default: false },
      computedAt: { type: Date },
    },

    // Internal Notes (Never exposed in public DTO)
    adminNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    internalRiskScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound / Sparse Indexes for expiry detection
productComplianceSchema.index({ "certification.expiresAt": 1 }, { sparse: true });
productComplianceSchema.index({ "regulatory.fssai.expiresAt": 1 }, { sparse: true });

// Pre-save safety fallback to compute trustStatus
productComplianceSchema.pre("save", function () {
  const isCertified = this.certification?.status === "verified";

  const isVerified =
    this.regulatory?.fssai?.status === "verified" &&
    this.productVerification?.status === "verified" &&
    (this.scientificVerification?.status === "verified" ||
      this.scientificVerification?.status === "not_applicable");

  const isQualified = this.sirabaQualification?.status === "verified";

  const isTripleVerified = isCertified && isVerified && isQualified;

  this.trustStatus = {
    isCertified,
    isVerified,
    isQualified,
    isTripleVerified,
    computedAt: new Date(),
  };
});

const ProductCompliance = mongoose.model("ProductCompliance", productComplianceSchema);
module.exports = ProductCompliance;
