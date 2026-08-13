const mongoose = require("mongoose");

// Enterprise Monthly Platform Commitment Settlement Schema
const enterpriseSettlementSchema = mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    plan: {
      type: String,
      default: "enterprise",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number, // 1 to 12
      required: true,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
    },

    // GMV & Economics Accounting
    eligibleGMV: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: 6, // 6% for Enterprise
    },
    baseCommission: {
      type: Number,
      default: 0,
    },
    minimumCommitment: {
      type: Number,
      default: 20000, // ₹20,000 minimum
    },
    commitmentAdjustment: {
      type: Number,
      default: 0, // MAX(minimumCommitment - baseCommission, 0)
    },
    totalPlatformCommitment: {
      type: Number,
      default: 20000, // MAX(baseCommission, minimumCommitment)
    },
    subscriptionAmount: {
      type: Number,
      default: 14999, // ₹14,999/month
    },
    totalPlatformRevenue: {
      type: Number,
      default: 34999, // subscriptionAmount + totalPlatformCommitment
    },

    // Lifecycle Status
    // COMMITMENT_PENDING -> COMMITMENT_INVOICED -> COMMITMENT_PAYMENT_PENDING -> COMMITMENT_PAID / COMMITMENT_FAILED / COMMITMENT_OVERDUE
    status: {
      type: String,
      enum: [
        "COMMITMENT_PENDING",
        "COMMITMENT_INVOICED",
        "COMMITMENT_PAYMENT_PENDING",
        "COMMITMENT_PAID",
        "COMMITMENT_FAILED",
        "COMMITMENT_OVERDUE",
      ],
      default: "COMMITMENT_PENDING",
    },

    // Financial & Invoice References
    invoiceId: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    paymentReference: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
    },

    // Audit locks
    isFinalized: {
      type: Boolean,
      default: false,
    },
    finalizedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index to guarantee single settlement per vendor per billing month (Idempotency)
enterpriseSettlementSchema.index({ vendor: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("EnterpriseSettlement", enterpriseSettlementSchema);
