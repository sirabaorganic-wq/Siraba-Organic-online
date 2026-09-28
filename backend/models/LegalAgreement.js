const mongoose = require("mongoose");

const legalAgreementSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["VENDOR_MARKETPLACE_AGREEMENT", "MUTUAL_NDA"],
      required: true,
      index: true,
    },
    template: {
      version: {
        type: String,
        required: true,
        default: "1.0",
      },
      templateIdentifier: {
        type: String,
        required: true,
      },
      templateHash: {
        type: String,
        required: true, // SHA-256 of master template file content
      },
    },
    // Explicit legal data snapshot: minimal rendered fields only
    vendorDataSnapshot: {
      legalName: { type: String, required: true },
      tradeName: { type: String },
      businessType: { type: String },
      address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
      pan: { type: String },
      gstin: { type: String },
      fssai: { type: String },
      organicCertification: {
        route: String,
        body: String,
        certificateNumber: String,
        validUntil: Date,
      },
      authorizedRepresentative: { type: String },
      designation: { type: String },
      commercialTerms: {
        commissionRate: Number,
        pricingTier: String,
      },
      approvedCategories: [{ type: String }],
    },
    execution: {
      status: {
        type: String,
        enum: ["draft", "pending_acceptance", "executed", "superseded"],
        default: "pending_acceptance",
        index: true,
      },
      signatoryName: {
        type: String,
        required: function () {
          return this.execution?.status === "executed";
        },
      },
      signatoryDesignation: {
        type: String,
        required: function () {
          return this.execution?.status === "executed";
        },
      },
      agreed: {
        type: Boolean,
        default: false,
      },
      acceptedAt: {
        type: Date,
      },
      effectiveDate: {
        type: Date,
      },
      ipAddress: {
        type: String,
      },
      userAgent: {
        type: String,
      },
    },
    artifact: {
      documentUrl: {
        type: String, // Cloudinary or secure storage URL
      },
      mimeType: {
        type: String,
        default: "application/pdf",
      },
      documentHash: {
        type: String, // SHA-256 of final persisted PDF bytes
      },
      htmlHash: {
        type: String, // SHA-256 of rendered HTML
      },
      size: {
        type: Number,
      },
    },
    audit: {
      auditLogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ComplianceAuditLog",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for querying and version lookups
legalAgreementSchema.index({ vendor: 1, documentType: 1, "execution.status": 1 });
legalAgreementSchema.index({ vendor: 1, documentType: 1, "template.version": 1 });

// =========================================================================
// IMMUTABILITY ENFORCEMENT HOOKS
// Once status is 'executed', prevent any mutation of the legal agreement
// =========================================================================
legalAgreementSchema.pre("save", async function () {
  if (!this.isNew) {
    // Check if the document was previously executed
    const original = await this.constructor.findById(this._id).lean();
    if (original && original.execution?.status === "executed") {
      // If already executed, disallow any content, snapshot, artifact or execution metadata changes
      const isStatusTransitionToSuperseded =
        this.isModified("execution.status") &&
        this.execution?.status === "superseded";

      // If anything other than marking as superseded is modified, reject
      if (
        this.isModified("vendorDataSnapshot") ||
        this.isModified("template") ||
        this.isModified("artifact") ||
        this.isModified("execution.signatoryName") ||
        this.isModified("execution.signatoryDesignation") ||
        this.isModified("execution.acceptedAt") ||
        this.isModified("execution.effectiveDate") ||
        this.isModified("execution.ipAddress") ||
        this.isModified("execution.userAgent")
      ) {
        throw new Error(
          "IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be mutated."
        );
      }

      if (!isStatusTransitionToSuperseded && this.isModified("execution.status")) {
        throw new Error(
          "IMMUTABILITY VIOLATION: Executed LegalAgreement status can only transition to superseded."
        );
      }
    }
  }
});

// Guard against direct query updates that bypass document save
legalAgreementSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate", "findByIdAndUpdate"],
  async function () {
    const docToUpdate = await this.model.findOne(this.getQuery()).lean();
    if (docToUpdate && docToUpdate.execution?.status === "executed") {
      const update = this.getUpdate();
      const allowedUpdateKeys = ["$set", "execution.status", "status"];
      
      // If trying to modify protected fields on executed document
      const updateData = update.$set || update;
      const modifiedKeys = Object.keys(updateData);
      
      const isOnlySuperseded =
        modifiedKeys.length === 1 &&
        (modifiedKeys[0] === "execution.status" || modifiedKeys[0] === "status") &&
        (updateData["execution.status"] === "superseded" || updateData.status === "superseded");

      if (!isOnlySuperseded) {
        throw new Error(
          "IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be mutated via update operations."
        );
      }
    }
  }
);

// Guard against delete operations
legalAgreementSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete", "findByIdAndDelete"], async function () {
  const docToDelete = await this.model.findOne(this.getQuery()).lean();
  if (docToDelete && docToDelete.execution?.status === "executed") {
    throw new Error(
      "IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be deleted."
    );
  }
});

module.exports = mongoose.model("LegalAgreement", legalAgreementSchema);
