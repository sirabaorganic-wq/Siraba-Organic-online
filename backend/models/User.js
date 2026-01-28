const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    phone: { type: String },
    altPhone: { type: String }, // Alternate phone number
    dob: { type: Date }, // Date of birth
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' }, // Gender
    addresses: [
      {
        address: String,
        city: String,
        postalCode: String,
        country: String,
        state: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        image: String,
        price: Number,
        quantity: { type: Number, default: 1 },
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // Security fields for OWASP A07:2021 – Identification and Authentication Failures
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockUntil: { type: Date },
    isBlocked: { type: Boolean, default: false },
    lastLogin: { type: Date },
    lastPasswordChange: { type: Date },
    // Wallet
    walletBalance: { type: Number, default: 0 },
    walletTransactions: [
      {
        type: { type: String, enum: ["refund", "credit", "debit"] },
        amount: Number,
        description: String,
        date: { type: Date, default: Date.now },
      },
    ],
    // GST Claim Feature
    claim_gst: {
      type: Boolean,
      default: false,
      required: true
    },
    gst_claimed_at: {
      type: Date
    },
    user_gst_number: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          // GST number format: 22AAAAA0000A1Z5 (15 characters)
          if (!v) return true; // Allow empty
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: props => `${props.value} is not a valid GST number format!`
      }
    }
  },
  {
    timestamps: true,
  },
);

// ==================== INDEXES ====================
// Indexes for user queries

// NOTE: email index created automatically by unique: true - no duplicate needed

// 1. Reset password token lookups
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

// 2. Admin users filter
userSchema.index({ isAdmin: 1 });

// 3. Text search for admin user search
userSchema.index({ name: "text", email: "text" });

module.exports = mongoose.model("User", userSchema);
