const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel",
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ["User", "Vendor"],
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // Optional link to redirect
  },
  {
    timestamps: true,
  },
);

// ==================== INDEXES ====================
// Indexes for notification queries

// 1. Recipient + read status (most common query for user notifications)
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// 2. Recipient model type queries
notificationSchema.index({ recipientModel: 1, recipient: 1 });

// 3. Unread notifications count
notificationSchema.index({ recipient: 1, isRead: 1 });

// 4. Date-based queries for cleanup/archival
notificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
