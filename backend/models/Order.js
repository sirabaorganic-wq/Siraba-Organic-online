const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    shippingAddress: {
      address: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    paymentMethod: { type: String, default: "COD" }, // Default for now
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    status: { type: String, default: "Pending" }, // Pending, Approved, Shipped, Delivered
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0.0 },
    returnStatus: {
      type: String,
      enum: [
        "None",
        "Requested",
        "Approved",
        "Rejected",
        "Returned",
        "Refunded",
        "Pending",
        "Processing",
        "Completed",
      ],
      default: "None",
    },
    returnReason: { type: String },
    returnRequestedAt: { type: Date },
    isRefunded: { type: Boolean, default: false },
    refundAmount: { type: Number, default: 0 },
    refundDate: { type: Date },
    gstClaimed: { type: Boolean, default: false },
    buyerGstNumber: { type: String },
    sellerGstNumber: { type: String },
  },
  {
    timestamps: true,
  },
);

// ==================== INDEXES ====================
// Indexes aligned with ACTUAL query patterns

// 1. CRITICAL: User order history (orderRoutes.js line 220)
// Query: { user: ObjectId }
// Sort: createdAt: -1 (implicit)
orderSchema.index({ user: 1, createdAt: -1 });

// 2. Admin all orders (orderRoutes.js line 228)
// Query: {} with populate
// Sort: createdAt: -1 (implicit)
orderSchema.index({ createdAt: -1 });

// 3. Order status filtering
// Query: { status: 'Pending'|'Shipped'|etc }
orderSchema.index({ status: 1, createdAt: -1 });

// 4. User + status combined
orderSchema.index({ user: 1, status: 1 });

// 5. Return/refund management
orderSchema.index({ returnStatus: 1 });
orderSchema.index({ user: 1, returnStatus: 1 });

// 6. Payment status
orderSchema.index({ isPaid: 1 });

// 7. Delivery status
orderSchema.index({ isDelivered: 1 });

// 8. Refund status
orderSchema.index({ isRefunded: 1 });

module.exports = mongoose.model("Order", orderSchema);
