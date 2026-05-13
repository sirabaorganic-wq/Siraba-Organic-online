const mongoose = require("mongoose");

const webhookLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    // The system that generated the webhook
    source: {
      type: String,
      enum: ["shiprocket", "razorpay", "other"],
      default: "other",
    },
    // The specific event name (e.g., payment.captured, order.paid)
    event_type: {
      type: String,
    },
    status: {
      type: String,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WebhookLog", webhookLogSchema);
