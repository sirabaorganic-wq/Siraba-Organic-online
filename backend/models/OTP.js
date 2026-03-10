const mongoose = require("mongoose");

// OTP schema used for both email and phone verification
// identifier: email address or phone number to which OTP was sent
const otpSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      // Hashed OTP value (bcrypt)
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["email", "phone"],
      required: true,
      index: true,
    },
    attempts: {
      // Number of verification attempts for this OTP
      type: Number,
      default: 0,
    },
    expiresAt: {
      // Absolute expiry time for this OTP
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// TTL index: automatically removes documents once expiresAt is in the past
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Helpful compound index for lookups
otpSchema.index({ identifier: 1, type: 1 });

module.exports = mongoose.model("OTP", otpSchema);

