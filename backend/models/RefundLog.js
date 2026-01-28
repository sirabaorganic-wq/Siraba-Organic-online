const mongoose = require('mongoose');

const refundLogSchema = mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    vendorOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder' }, // Optional if full order refund
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    initiatedBy: {
        type: String,
        enum: ['User', 'Vendor', 'Admin'],
        required: true
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of User/Vendor/Admin

    amount: { type: Number, required: true }, // Product + Tax (Refunded Amount)
    deliveryCharge: { type: Number, required: true, default: 0 }, // Non-refundable Delivery Charge
    totalRefundableAmount: { type: Number, required: true }, // Should match amount

    reason: { type: String },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed'
    },

    // Automatic expiry after 45 days
    expireAt: { type: Date, default: Date.now, index: { expires: '45d' } }
}, {
    timestamps: true
});

module.exports = mongoose.model('RefundLog', refundLogSchema);
