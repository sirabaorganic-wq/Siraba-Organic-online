const express = require("express");
const router = express.Router();
const VendorOrder = require("../models/VendorOrder");
const Order = require("../models/Order");
const WebhookLog = require("../models/WebhookLog");
const { invalidateCache } = require("../config/cache");

// Priority order for shipment status hierarchy (prevent regression)
const STATUS_PRIORITY = {
  pending: 1,
  processing: 2,
  pickup_pending: 2.5,
  pickup_scheduled: 3,
  pickup_failed: 3.1,
  in_transit: 4,
  out_for_delivery: 5,
  delivery_failed: 5.1,
  delivered: 6,
  cancelled: 7,
  rto: 7,
};

const mapShiprocketStatus = (srStatus) => {
  if (!srStatus) return "processing";
  const s = String(srStatus).trim().toUpperCase();

  // 1. RTO statuses
  if (
    s === "RTO DELIVERED" ||
    s === "RTO INITIATED" ||
    s === "RTO ACKNOWLEDGED" ||
    s === "RTO OFD" ||
    s === "RTO IN TRANSIT" ||
    s === "RTO" ||
    s.startsWith("RTO")
  ) {
    return "rto";
  }

  // 2. Cancellation
  if (s === "CANCELLED" || s === "CANCELED" || s.includes("CANCEL")) {
    return "cancelled";
  }

  // 3. Delivered
  if (
    s === "DELIVERED" ||
    (s.includes("DELIVERED") && !s.includes("RTO") && !s.includes("UNDELIVERED") && !s.includes("FAILED"))
  ) {
    return "delivered";
  }

  // 4. Delivery Failures & Undelivered
  if (
    s === "DELIVERY FAILED" ||
    s === "UNDELIVERED" ||
    s.includes("DELIVERY FAILED") ||
    s.includes("UNDELIVERED")
  ) {
    return "delivery_failed";
  }

  // 5. Out For Delivery
  if (s === "OUT FOR DELIVERY" || s.includes("OUT FOR DELIVERY")) {
    return "out_for_delivery";
  }

  // 6. In Transit / Picked up
  if (
    s === "IN TRANSIT" ||
    s === "PICKED UP" ||
    s.includes("IN TRANSIT") ||
    s.includes("PICKED UP") ||
    s.includes("REACHED")
  ) {
    return "in_transit";
  }

  // 7. Pickup Failures & Exceptions (MUST NOT be treated as pickup_scheduled!)
  if (
    s === "PICKUP FAILED" ||
    s === "PICKUP EXCEPTION" ||
    s.includes("PICKUP FAILED") ||
    s.includes("PICKUP EXCEPTION")
  ) {
    return "pickup_failed";
  }

  // 8. Pickup Pending / Rescheduled
  if (
    s === "PICKUP PENDING" ||
    s === "PICKUP RESCHEDULED" ||
    s.includes("PICKUP PENDING") ||
    s.includes("PICKUP RESCHEDULED")
  ) {
    return "pickup_pending";
  }

  // 9. Pickup Scheduled / Manifest Generated
  if (
    s === "PICKUP SCHEDULED" ||
    s === "MANIFEST GENERATED" ||
    s.includes("MANIFEST") ||
    s.includes("PICKUP SCHEDULED")
  ) {
    return "pickup_scheduled";
  }

  return "processing";
};

// Explicit status transition rules (terminal state protection & retry handling)
const isTransitionAllowed = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true;

  // 1. Terminal State: DELIVERED cannot be reverted to pre-delivery statuses
  if (currentStatus === "delivered") {
    if (newStatus === "rto" || newStatus === "returned") return true;
    return false;
  }

  // 2. Terminal State: RTO cannot revert to pre-RTO or active transit statuses
  if (currentStatus === "rto" || currentStatus === "returned") {
    return false;
  }

  // 3. Terminal State: CANCELLED cannot revert to active transit
  if (currentStatus === "cancelled") {
    return false;
  }

  // 4. Retry flows & Exception states:
  // If delivery failed, courier can attempt again: out_for_delivery, in_transit, delivered, rto, cancelled
  if (currentStatus === "delivery_failed") {
    if (["out_for_delivery", "in_transit", "delivered", "rto", "cancelled"].includes(newStatus)) {
      return true;
    }
  }

  // If pickup failed or pickup pending, pickup can be rescheduled or succeed: pickup_scheduled, in_transit, cancelled
  if (currentStatus === "pickup_failed" || currentStatus === "pickup_pending") {
    if (["pickup_scheduled", "in_transit", "cancelled", "pickup_pending", "pickup_failed"].includes(newStatus)) {
      return true;
    }
  }

  // If pickup_scheduled, it can transition to in_transit, or exception states like pickup_failed, pickup_pending, cancelled
  if (currentStatus === "pickup_scheduled") {
    if (["in_transit", "out_for_delivery", "delivered", "pickup_failed", "pickup_pending", "cancelled", "rto"].includes(newStatus)) {
      return true;
    }
  }

  // 5. Priority hierarchy protection
  const currentPriority = STATUS_PRIORITY[currentStatus] || 0;
  const newPriority = STATUS_PRIORITY[newStatus] || 0;
  return newPriority >= currentPriority;
};

// Sanitize payload before logging (PII / security)
const sanitizePayload = (body) => {
  if (!body || typeof body !== "object") return body;
  const clean = { ...body };
  delete clean.password;
  delete clean.token;
  delete clean.jwt;
  delete clean.secret;
  return clean;
};

// @desc    Shiprocket / Fulfillment Status Webhook Endpoint
// @route   POST /api/fulfillment/status (Public Production Endpoint)
// @route   POST /api/shiprocket/webhook (Legacy Compatibility Endpoint)
// @access  Public (x-api-key header verified)
router.post("/", async (req, res) => {
  try {
    // 1. Authentication Header Check (FAIL-CLOSED: MUST be configured & match)
    const incomingToken =
      req.headers["x-api-key"] ||
      req.headers["x-shiprocket-secret"] ||
      req.headers["shiprocket-secret"];
    const expectedSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error("Shiprocket Webhook blocked: SHIPROCKET_WEBHOOK_SECRET is not configured on server.");
      return res.status(500).json({ message: "Webhook endpoint unavailable: secret not configured" });
    }

    if (!incomingToken || incomingToken !== expectedSecret) {
      console.warn("Shiprocket Webhook blocked: Invalid or missing secret token");
      return res.status(401).json({ message: "Invalid webhook secret" });
    }

    const payload = req.body || {};
    const { order_id, shipment_id, awb, current_status, courier_name } = payload;
    const statusTimestamp = payload.status_date_time || payload.current_timestamp || payload.updated_at || "";

    // 2. Deterministic Idempotency Key (No Date.now()!)
    const rawId = payload.event_id || payload.id || `${shipment_id || awb || order_id || "evt"}_${current_status || "update"}_${statusTimestamp}`;
    const eventId = `sr_wh_${rawId}`.replace(/[^a-zA-Z0-9_.-]/g, "_");

    // 3. Atomic Idempotency Check & Logging
    const sanitizedPayload = sanitizePayload(payload);

    try {
      await WebhookLog.create({
        eventId,
        source: "shiprocket",
        event_type: current_status || "shipment_update",
        status: "processed",
        payload: sanitizedPayload,
      });
    } catch (dupErr) {
      // Duplicate event (already processed)
      return res.status(200).json({ message: "Event already processed" });
    }

    // Handle dummy / test payload without order identifiers gracefully
    if (!order_id && !awb && !shipment_id) {
      return res.status(200).json({ message: "Payload missing identifier, accepted" });
    }

    // 4. Locate VendorOrder by shipmentId, awbCode, or ObjectId/ShiprocketOrderId
    let query = {};
    if (shipment_id) query.shipmentId = String(shipment_id);
    else if (awb) query.awbCode = String(awb);
    else if (order_id) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(order_id)) {
        query._id = order_id;
      } else {
        query.shiprocketOrderId = String(order_id);
      }
    }

    const vendorOrder = await VendorOrder.findOne(query);
    if (!vendorOrder) {
      console.log(`Shiprocket webhook: No matching VendorOrder found for query:`, query);
      return res.status(200).json({ message: "VendorOrder not found, logged" });
    }

    // 5. Map & Validate Status Transition
    const newInternalStatus = mapShiprocketStatus(current_status);

    if (isTransitionAllowed(vendorOrder.status, newInternalStatus)) {
      vendorOrder.status = newInternalStatus;
      if (awb && !vendorOrder.awbCode) vendorOrder.awbCode = awb;
      if (courier_name && !vendorOrder.courierName) vendorOrder.courierName = courier_name;

      if (newInternalStatus === "delivered" && !vendorOrder.deliveredAt) {
        vendorOrder.deliveredAt = new Date();
      }
      if (newInternalStatus === "in_transit") {
        if (!vendorOrder.shippedAt) vendorOrder.shippedAt = new Date();
        if (!vendorOrder.pickedUpAt) vendorOrder.pickedUpAt = new Date();
      }
      if (newInternalStatus === "pickup_scheduled" && !vendorOrder.pickupScheduledAt) {
        vendorOrder.pickupScheduledAt = new Date();
      }
      if (newInternalStatus === "pickup_failed") {
        vendorOrder.shipmentError = {
          code: "PICKUP_FAILED",
          message: typeof payload.activity === "string" ? payload.activity : "Pickup failed by courier",
          timestamp: new Date(),
        };
      } else if (newInternalStatus === "delivery_failed") {
        vendorOrder.shipmentError = {
          code: "DELIVERY_FAILED",
          message: typeof payload.activity === "string" ? payload.activity : "Delivery attempt failed",
          timestamp: new Date(),
        };
      } else if (["in_transit", "out_for_delivery", "delivered"].includes(newInternalStatus)) {
        if (vendorOrder.shipmentError && vendorOrder.shipmentError.code) {
          vendorOrder.shipmentError = undefined;
        }
      }

      await vendorOrder.save();

      // Aggregate Parent Order Status
      const parentOrder = await Order.findById(vendorOrder.order);
      if (parentOrder) {
        const allVendorOrders = await VendorOrder.find({ order: parentOrder._id });
        const statuses = allVendorOrders.map((vo) => vo.status);

        if (statuses.every((st) => st === "delivered")) {
          parentOrder.status = "Delivered";
          parentOrder.isDelivered = true;
          parentOrder.deliveredAt = new Date();
        } else if (statuses.some((st) => ["in_transit", "out_for_delivery", "pickup_scheduled"].includes(st))) {
          parentOrder.status = "Shipped";
        } else if (statuses.some((st) => st === "cancelled")) {
          parentOrder.status = "Partially Cancelled";
        }
        await parentOrder.save();
      }

      invalidateCache.orders();

      // Emit Realtime Socket.IO Events & System Notifications
      if (req.io) {
        req.io.emit("order-status-updated", parentOrder || { _id: vendorOrder.order, status: vendorOrder.status });
        req.io.emit(`vendor-order-updated-${vendorOrder.vendor}`, vendorOrder);
        if (parentOrder && parentOrder.user) {
          req.io.emit(`customer-order-updated-${parentOrder.user}`, parentOrder);
        }
      }

      // Create System Notification for Vendor & Customer on Terminal / Major Transitions
      const Notification = require("../models/Notification");
      if (["delivered", "in_transit", "rto", "cancelled"].includes(newInternalStatus)) {
        try {
          await Notification.create({
            recipient: vendorOrder.vendor,
            recipientModel: "Vendor",
            type: newInternalStatus === "delivered" ? "success" : (newInternalStatus === "rto" ? "error" : "info"),
            title: `Shipment Status: ${newInternalStatus.toUpperCase()}`,
            message: `Shipment for Order #${vendorOrder._id.toString().slice(-8)} (AWB: ${vendorOrder.awbCode || 'N/A'}) is now ${newInternalStatus.replace('_', ' ')}.`,
          });
        } catch (nErr) {
          console.error("Failed to create webhook status notification:", nErr.message);
        }
      }
    } else {
      console.log(`Shiprocket webhook: Ignored stale status transition from '${vendorOrder.status}' to '${newInternalStatus}' for VendorOrder: ${vendorOrder._id}`);
    }

    // Fast HTTP 200 response
    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Shiprocket webhook error:", error);
    res.status(500).json({ message: "Internal Error" });
  }
});

module.exports = router;
