const mongoose = require("mongoose");

// Vendor Order Schema - Orders assigned to specific vendors
const vendorOrderSchema = mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    // Items from this vendor in the order
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String },
        sku: { type: String },
      },
    ],

    // Vendor-specific order details
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    netAmount: { type: Number, required: true }, // subtotal - commission

    // Status tracking
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    // Shipping info
    trackingNumber: { type: String },
    shippingCarrier: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    shiprocketOrderId: { type: String },
    shipmentId: { type: String },

    // Customer info (copied for vendor reference)
    shippingAddress: {
      name: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phone: { type: String },
    },

    // Notes
    vendorNotes: { type: String },
    customerNotes: { type: String },

    // Payout
    payoutStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },
    payoutDate: { type: Date },
    payoutReference: { type: String },

    // Return tracking
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
  },
  {
    timestamps: true,
  },
);

// ==================== INDEXES ====================
// Indexes aligned with ACTUAL query patterns

// 1. CRITICAL: Vendor orders list (vendorRoutes.js line 667)
// Query: { vendor: ObjectId, status? }
// Sort: createdAt: -1
vendorOrderSchema.index({ vendor: 1, status: 1, createdAt: -1 });

// 2. Vendor single order (vendorRoutes.js line 692)
// Query: { _id: ObjectId, vendor: ObjectId }
vendorOrderSchema.index({ vendor: 1, _id: 1 });

// 3. Order reference lookup (paymentRoutes.js line 64)
// Query: { order: ObjectId }
vendorOrderSchema.index({ order: 1 });

// 4. Vendor returns (vendorRoutes.js line 1209)
// Query: { vendor: ObjectId, returnStatus }
// Sort: createdAt: -1
vendorOrderSchema.index({ vendor: 1, returnStatus: 1, createdAt: -1 });

// 5. Payout queries (vendorRoutes.js line 1557)
// Query: { vendor: ObjectId, payoutStatus: 'pending' }
vendorOrderSchema.index({ vendor: 1, payoutStatus: 1 });

// 6. Admin vendor orders (adminRoutes.js line 658)
// Query: { vendor?, status? }
// Sort: createdAt: -1
vendorOrderSchema.index({ status: 1, createdAt: -1 });

// 7. Shipping tracking
vendorOrderSchema.index({ trackingNumber: 1 }, { sparse: true });
vendorOrderSchema.index({ shiprocketOrderId: 1 }, { sparse: true });

// 8. Date-based queries
vendorOrderSchema.index({ createdAt: -1 });
vendorOrderSchema.index({ deliveredAt: 1 }, { sparse: true });

module.exports = mongoose.model("VendorOrder", vendorOrderSchema);
