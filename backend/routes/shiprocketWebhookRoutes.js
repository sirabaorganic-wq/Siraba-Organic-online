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
  pickup_scheduled: 3,
  in_transit: 4,
  out_for_delivery: 5,
  delivered: 6,
  cancelled: 7,
  rto: 7,
};

const mapShiprocketStatus = (srStatus) => {
  if (!srStatus) return "processing";
  const s = String(srStatus).trim().toUpperCase();

  if (s === "RTO DELIVERED" || s === "RTO INITIATED" || s === "RTO ACKNOWLEDGED" || s === "RTO OFD" || s === "RTO") return "rto";
  if (s === "DELIVERED" || (s.includes("DELIVERED") && !s.includes("RTO"))) return "delivered";
  if (s === "OUT FOR DELIVERY" || s.includes("OUT FOR DELIVERY")) return "out_for_delivery";
  if (s === "IN TRANSIT" || s === "PICKED UP" || s.includes("IN TRANSIT") || s.includes("PICKED UP") || s.includes("REACHED")) return "in_transit";
  if (s === "PICKUP SCHEDULED" || s === "MANIFEST GENERATED" || s.includes("MANIFEST") || s.includes("PICKUP")) return "pickup_scheduled";
  if (s === "CANCELLED" || s === "CANCELED" || s.includes("CANCEL")) return "cancelled";

  return "processing";
};

// Explicit status transition rules (terminal state protection)
const isTransitionAllowed = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true;

  // 1. Terminal State: DELIVERED cannot be reverted to pre-delivery statuses
  if (currentStatus === "delivered") {
    if (["pending", "processing", "pickup_scheduled", "in_transit", "out_for_delivery"].includes(newStatus)) {
      return false;
    }
    if (newStatus === "rto" || newStatus === "returned") return true;
    return false;
  }

  // 2. Terminal State: RTO cannot revert to pre-RTO or active transit statuses
  if (currentStatus === "rto" || currentStatus === "returned") {
    if (["pending", "processing", "pickup_scheduled", "in_transit", "out_for_delivery"].includes(newStatus)) {
      return false;
    }
  }

  // 3. Terminal State: CANCELLED cannot revert to active transit
  if (currentStatus === "cancelled") {
    if (["pending", "processing", "pickup_scheduled", "in_transit", "out_for_delivery"].includes(newStatus)) {
      return false;
    }
  }

  // 4. Priority hierarchy protection
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
    // 1. Authentication Header Check (Prioritizes x-api-key configured in Shiprocket Panel)
    const incomingToken =
      req.headers["x-api-key"] ||
      req.headers["x-shiprocket-secret"] ||
      req.headers["shiprocket-secret"];
    const expectedSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;

    if (expectedSecret && incomingToken !== expectedSecret) {
      console.warn("Shiprocket Webhook blocked: Invalid secret token");
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
      if (newInternalStatus === "in_transit" && !vendorOrder.shippedAt) {
        vendorOrder.shippedAt = new Date();
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
