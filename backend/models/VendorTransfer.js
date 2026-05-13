const mongoose = require('mongoose');

/**
 * VendorTransfer Model — Razorpay Route Split Payment Records
 *
 * Each entry tracks one transfer to a vendor via Razorpay Route.
 * One Payment can have multiple VendorTransfers (one per vendor).
 *
 * Prerequisite: Each vendor must be registered as a Razorpay Route
 * Linked Account and their razorpay_linked_account_id stored in Vendor model.
 *
 * Transfer Status Flow:
 *   pending → initiated → processed
 *             initiated → failed (→ retry → processed / permanently_failed)
 */

const vendorTransferSchema = new mongoose.Schema(
  {
    // ── Razorpay identifiers ─────────────────────────────────────────────────
    razorpay_transfer_id: {
      type: String,
      unique: true,
      sparse: true, // null until transfer is initiated
      index: true,
    },

    // ── Relations ────────────────────────────────────────────────────────────
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    razorpay_payment_id: {
      type: String,
      required: true,
      comment: 'Razorpay payment ID needed to call transfer API',
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    vendor_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorOrder',
      required: true,
    },
    razorpay_linked_account_id: {
      type: String,
      required: true,
      comment: 'Vendor Razorpay Route linked account ID (acc_xxxxx)',
    },

    // ── Amounts ──────────────────────────────────────────────────────────────
    amount: {
      type: Number,
      required: true,
      comment: 'Transfer amount in paise after commission deduction',
    },
    gross_amount: {
      type: Number,
      required: true,
      comment: 'Vendor subtotal in paise before commission',
    },
    commission_rate: {
      type: Number,
      required: true,
      comment: 'Commission percentage applied',
    },
    commission_amount: {
      type: Number,
      required: true,
      comment: 'Commission deducted in paise',
    },
    currency: {
      type: String,
      default: 'INR',
    },

    // ── Status ───────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'initiated', 'processed', 'failed', 'permanently_failed', 'reversed'],
      default: 'pending',
      index: true,
    },

    // ── Retry Logic ──────────────────────────────────────────────────────────
    attempts: {
      type: Number,
      default: 0,
    },
    last_error: {
      type: String,
    },
    last_attempted_at: {
      type: Date,
    },
    processed_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────

// Vendor transfer history
vendorTransferSchema.index({ vendor_id: 1, status: 1, createdAt: -1 });

// Payment → transfers lookup
vendorTransferSchema.index({ payment_id: 1 });

// Failed transfers for retry
vendorTransferSchema.index({ status: 1, attempts: 1 });

module.exports = mongoose.model('VendorTransfer', vendorTransferSchema);
