const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    vendorReply: { type: String },
    vendorReplyDate: { type: Date },
  },
  {
    timestamps: true,
  },
);

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // unique creates index - don't duplicate
    description: { type: String, required: true },
    fullDescription: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, default: "₹" },
    image: { type: String }, // Main image (kept for backward compatibility, syncs with images[0])
    image2: { type: String }, // kept for backward compatibility
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length <= 5;
        },
        message: "Maximum 5 images allowed.",
      },
    },
    category: { type: String, required: true },
    tag: { type: String },
    hsn: { type: String, default: "0909" }, // HSN code for GST (default: spices/saffron)
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
    features: [String],
    ingredients: { type: String },

    // Vendor fields
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null, // null means it's a platform/admin product
    },
    vendorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // Default approved for admin products
    },
    vendorRejectionReason: { type: String },
    isVendorProduct: { type: Boolean, default: false },
    costPrice: { type: Number }, // Vendor's cost price
    stockQuantity: { type: Number, default: 0 },
    sku: { type: String },
    isActive: { type: Boolean, default: true },

    // Computed field for fast public visibility queries
    // Replaces complex $or query with simple equality check
    isPublic: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

// Middleware to automatically set isPublic field
productSchema.pre("save", function () {
  if (this.isVendorProduct) {
    // Vendor products: public only if approved AND active
    this.isPublic = this.vendorStatus === "approved" && this.isActive === true;
  } else {
    // Admin products: always public
    this.isPublic = true;
  }
});

// ==================== INDEXES ====================
// Indexes optimized for actual query patterns

// 1. CRITICAL: Main product listing (productRoutes.js)
// OLD SLOW QUERY: { $or: [{ isVendorProduct: {$ne: true} }, { isVendorProduct: true, vendorStatus: "approved", isActive: true }] }
// NEW FAST QUERY: { isPublic: true, category?, price? }
// This single index replaces the complex $or and enables IXSCAN
productSchema.index({
  isPublic: 1,
  category: 1,
  price: 1,
});

// 2. Vendor's own products (vendorRoutes.js line 305)
// Query: { vendor: ObjectId, isVendorProduct: true, vendorStatus? }
productSchema.index({
  vendor: 1,
  isVendorProduct: 1,
  vendorStatus: 1,
  createdAt: -1,
});

// 3. Public vendor shop (vendorRoutes.js line 2084)
// Query: { vendor: ObjectId, isPublic: true }
productSchema.index({
  vendor: 1,
  isPublic: 1,
});

// 4. Admin vendor products approval (adminRoutes.js line 731)
// Query: { isVendorProduct: true, vendorStatus, vendor? }
productSchema.index({
  isVendorProduct: 1,
  vendorStatus: 1,
  vendor: 1,
});

// 5. Text search
productSchema.index({
  name: "text",
  description: "text",
  fullDescription: "text",
});

// 6. Price sorting
productSchema.index({ price: 1 });

// 7. Newest products
productSchema.index({ createdAt: -1 });

// NOTE:
// - slug index created by unique: true (no duplicate)
// - isPublic index created by index: true in schema

module.exports = mongoose.model("Product", productSchema);
