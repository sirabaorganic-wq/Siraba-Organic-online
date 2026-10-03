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
    readAt: { type: Date },
    link: { type: String }, // Optional link to redirect

    // Phase 2: Vendor Logistics & Operational Notification Fields
    eventId: {
      type: String,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    vendorOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorOrder",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    eventType: {
      type: String,
    },
    category: {
      type: String,
      enum: ["order", "shipment", "delivery", "rto", "exception", "general"],
      default: "general",
    },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    emailClaimedAt: {
      type: Date,
    },
    socketEmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ==================== INDEXES ====================
// Indexes for notification queries and deduplication

// 1. Unique sparse index for event idempotency (prevents duplicate notification records)
notificationSchema.index({ eventId: 1 }, { unique: true, sparse: true });

// 2. Recipient + read status (most common query for user and vendor notifications)
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// 3. Vendor-specific fast query and unread count
notificationSchema.index({ vendor: 1, isRead: 1, createdAt: -1 });

// 4. VendorOrder specific queries for tracking timeline
notificationSchema.index({ vendorOrder: 1, createdAt: -1 });

// 5. Recipient model type queries
notificationSchema.index({ recipientModel: 1, recipient: 1 });

// 6. Date-based queries for cleanup/archival
notificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
