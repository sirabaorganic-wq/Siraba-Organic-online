const mongoose = require('mongoose');

/**
 * Payment Model — Production-Grade Payment State Machine
 *
 * This model is the single source of truth for all payment records.
 * Every Razorpay order creates ONE Payment document. The Order model's
 * isPaid / status fields are derived from this.
 *
 * State Machine:
 *   created → authorized → captured → refunded / partially_refunded
 *   created → failed
 *
 * Idempotency: `receipt` field is unique — prevents duplicate Razorpay orders.
 * Fraud Prevention: `razorpay_payment_id` is unique (sparse) — prevents duplicate payment processing.
 */

const paymentSchema = new mongoose.Schema(
  {
    // ── Razorpay identifiers ─────────────────────────────────────────────────
    razorpay_order_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpay_payment_id: {
      type: String,
      unique: true,
      sparse: true, // null until payment is made
      index: true,
    },
    razorpay_signature: {
      type: String,
    },

    // ── Amount ───────────────────────────────────────────────────────────────
    amount: {
      type: Number,
      required: true,
      comment: 'Amount in paise (INR smallest unit)',
    },
    amount_refunded: {
      type: Number,
      default: 0,
      comment: 'Total refunded in paise',
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },

    // ── State Machine ────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        'created',          // Razorpay order created, awaiting payment
        'authorized',       // Payment authorized but not yet captured
        'captured',         // Payment captured & confirmed
        'failed',           // Payment failed
        'refunded',         // Fully refunded
        'partially_refunded', // Partially refunded
      ],
      default: 'created',
      index: true,
    },

    // ── Relations ────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    // ── Idempotency ──────────────────────────────────────────────────────────
    receipt: {
      type: String,
      required: true,
      unique: true,
      index: true,
      comment: 'Used as idempotency key — maps to orderId stringified',
    },

    // ── Snapshot ─────────────────────────────────────────────────────────────
    cartSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      comment: 'Frozen copy of cart at payment time for audit trail',
    },

    // ── Metadata ─────────────────────────────────────────────────────────────
    notes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paymentMethod: {
      type: String,
      comment: 'e.g. card, upi, netbanking — set after capture',
    },
    bank: { type: String },
    wallet: { type: String },
    vpa: { type: String, comment: 'UPI VPA if paid via UPI' },

    // ── Order Expiry ─────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // TTL index — MongoDB auto-deletes expired docs
      comment: 'Unpaid orders auto-expire after 30 minutes',
    },

    // ── Reconciliation ───────────────────────────────────────────────────────
    reconciledAt: { type: Date },
    reconciliationStatus: {
      type: String,
      enum: ['matched', 'fixed', 'flagged', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound Indexes ──────────────────────────────────────────────────────────

// Admin payment list: filter by status + date
paymentSchema.index({ status: 1, createdAt: -1 });

// User payment history
paymentSchema.index({ userId: 1, createdAt: -1 });

// Reconciliation: find uncaptured recent payments
paymentSchema.index({ status: 1, reconciledAt: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
