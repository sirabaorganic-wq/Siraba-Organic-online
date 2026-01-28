const mongoose = require("mongoose");

// Compliance Document Schema
const complianceDocSchema = mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "business_license",
      "gst_certificate",
      "fssai_license",
      "organic_certification",
      "pan_card",
      "bank_details",
      "other",
    ],
    required: true,
  },
  fileUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "expired"],
    default: "pending",
  },
  expiryDate: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

// Wallet Transaction Schema
const walletTransactionSchema = mongoose.Schema({
  type: {
    type: String,
    enum: [
      "credit",
      "debit",
      "commission",
      "payout",
      "refund",
      "adjustment",
      "order_earning",
      "refund_debit",
      "pending_cancelled",
      "admin_refund_debit",
    ],
    required: true,
  },
  amount: { type: Number, required: true },
  description: { type: String },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "completed",
  },
  balanceAfter: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

// Shop Settings Schema
const shopSettingsSchema = mongoose.Schema({
  shopName: { type: String },
  shopSlug: { type: String, unique: true, sparse: true },
  tagline: { type: String },
  shopDescription: { type: String },
  shopBanner: { type: String },
  shopLogo: { type: String },
  returnPolicy: { type: String },
  shippingPolicy: { type: String },
  minOrderValue: { type: Number, default: 0 },
  processingTime: { type: String, default: "2-3 business days" },
  socialLinks: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    youtube: { type: String },
    website: { type: String },
  },
  isPublished: { type: Boolean, default: false },
});

// Subscription Plan Schema
const subscriptionSchema = mongoose.Schema({
  plan: {
    type: String,
    enum: ["starter", "professional", "enterprise"],
    default: "starter",
  },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: false },
  autoRenew: { type: Boolean, default: true },
  paymentHistory: [
    {
      amount: { type: Number },
      paymentDate: { type: Date },
      paymentMethod: { type: String },
      transactionId: { type: String },
      status: { type: String, enum: ["pending", "completed", "failed"] },
    },
  ],
  upcomingPlan: {
    type: String,
    enum: ["starter", "professional", "enterprise"],
  },
  upcomingPlanDate: { type: Date },
});

// Vendor Product/Inventory Schema
const vendorProductSchema = mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    sku: { type: String, required: true },
    stockQuantity: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    lastRestocked: { type: Date },
    batchNumber: { type: String },
    expiryDate: { type: Date },
  },
  { timestamps: true },
);

// Bank Details Schema
const bankDetailsSchema = mongoose.Schema({
  accountHolderName: { type: String },
  accountNumber: { type: String },
  bankName: { type: String },
  ifscCode: { type: String },
  branchName: { type: String },
  upiId: { type: String },
});

// Vendor Schema
const vendorSchema = mongoose.Schema(
  {
    // Account Info
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Business Info
    businessName: { type: String, required: true },
    businessType: {
      type: String,
      enum: [
        "manufacturer",
        "distributor",
        "farmer",
        "processor",
        "wholesaler",
      ],
      required: true,
    },
    businessDescription: { type: String },
    logo: { type: String },

    // Contact Info
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    website: { type: String },

    // Address
    address: {
      street: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    // Legal Info
    gstNumber: { type: String },
    panNumber: { type: String },
    fssaiNumber: { type: String },

    // GST Claim Feature
    claim_gst: {
      type: Boolean,
      default: false,
      required: true
    },
    gst_claimed_at: {
      type: Date
    },

    // Compliance Documents
    complianceDocuments: [complianceDocSchema],

    // Inventory
    inventory: [vendorProductSchema],

    // Bank Details
    bankDetails: bankDetailsSchema,

    // Vendor Status
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "suspended", "rejected"],
      default: "pending",
    },
    onboardingStep: { type: Number, default: 1 }, // Track onboarding progress (1-5)
    onboardingComplete: { type: Boolean, default: false },

    // Performance Metrics
    metrics: {
      totalOrders: { type: Number, default: 0 },
      completedOrders: { type: Number, default: 0 },
      cancelledOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      onTimeDeliveryRate: { type: Number, default: 100 },
    },

    // Commission & Pricing
    commissionRate: { type: Number, default: 10 }, // Percentage commission
    pricingTier: {
      type: String,
      enum: ["standard", "premium", "enterprise"],
      default: "standard",
    },

    // Subscription Plan
    subscription: subscriptionSchema,

    // Wallet
    wallet: {
      balance: { type: Number, default: 0 },
      pendingBalance: { type: Number, default: 0 }, // Earnings pending clearance
      totalEarnings: { type: Number, default: 0 },
      totalCommissionPaid: { type: Number, default: 0 },
      totalPayouts: { type: Number, default: 0 },
      lastPayoutDate: { type: Date },
      transactions: [walletTransactionSchema],
    },

    // Shop Settings
    shopSettings: shopSettingsSchema,

    // Categories vendor can sell in
    allowedCategories: [{ type: String }],

    // Admin Notes
    adminNotes: [
      {
        note: { type: String },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Approval Info
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String },

    // Password Reset
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    // Activity
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// ==================== INDEXES ====================
// Indexes aligned with ACTUAL query patterns

// NOTE: email index created automatically by unique: true - no duplicate needed

// 1. Public vendor shop (vendorRoutes.js line 2043)
// Query: { "shopSettings.shopSlug": slug, status: "approved", "shopSettings.isPublished": true }
vendorSchema.index(
  {
    "shopSettings.shopSlug": 1,
    status: 1,
    "shopSettings.isPublished": 1,
  },
  { sparse: true },
);

// 2. Admin vendor list (adminRoutes.js line 17)
// Query: { status?, search in businessName/email/contactPerson }
// Sort: createdAt: -1
vendorSchema.index({ status: 1, createdAt: -1 });

// 3. Text search for admin vendor search
vendorSchema.index({
  businessName: "text",
  email: "text",
  contactPerson: "text",
});

// 4. Reset password token
vendorSchema.index({ resetPasswordToken: 1 }, { sparse: true });

// 5. Active vendors
vendorSchema.index({ isActive: 1 });

// 6. Onboarding tracking
vendorSchema.index({ onboardingComplete: 1 });

// 7. Subscription queries
vendorSchema.index({ "subscription.isActive": 1 });

module.exports = mongoose.model("Vendor", vendorSchema);
