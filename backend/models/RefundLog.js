const mongoose = require('mongoose');

const refundLogSchema = mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    vendorOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    initiatedBy: {
        type: String,
        enum: ['User', 'Vendor', 'Admin'],
        required: true
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, required: true },

    amount: { type: Number, required: true },        // Refunded amount in INR
    deliveryCharge: { type: Number, required: true, default: 0 },
    totalRefundableAmount: { type: Number, required: true },

    reason: { type: String },

    // ── Razorpay Refund Fields ─────────────────────────────────────────────
    // Populated after calling razorpay.payments.refund()
    razorpay_refund_id: {
        type: String,
        unique: true,
        sparse: true, // null until refund is initiated on Razorpay
        index: true,
    },
    razorpay_payment_id: {
        type: String,
        index: true,
    },
    // Refund speed: 'normal' (5-7 days) or 'optimum' (instant if eligible)
    speed: {
        type: String,
        enum: ['normal', 'optimum'],
        default: 'normal',
    },

    // Status lifecycle:
    // initiated  → Razorpay refund API called, awaiting processing
    // Processed  → Webhook refund.processed received
    // Failed     → Refund failed on Razorpay side
    // Completed  → Legacy status (wallet refunds)
    // Pending    → Legacy status
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'initiated', 'Processed'],
        default: 'Completed'
    },

    // Automatic expiry after 45 days
    expireAt: { type: Date, default: Date.now, index: { expires: '45d' } }
}, {
    timestamps: true
});

module.exports = mongoose.model('RefundLog', refundLogSchema);
