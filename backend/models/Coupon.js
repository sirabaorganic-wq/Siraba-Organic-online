const mongoose = require('mongoose');

const couponSchema = mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // If null, applicable to anyone
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: 1 }, // Default 1 use per coupon if not specified
    usedCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
