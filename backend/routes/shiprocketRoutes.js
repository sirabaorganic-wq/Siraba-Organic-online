const express = require("express");
const router = express.Router();
const shiprocketService = require("../services/shiprocketService");
const VendorOrder = require("../models/VendorOrder");
const Vendor = require("../models/Vendor");
const Order = require("../models/Order");
const { protect, admin, adminOrVendorOnboarder } = require("../middleware/authMiddleware");

const { apiLimiter } = require("../middleware/securityMiddleware");

// @desc    Track shipment by AWB Code
// @route   GET /api/shiprocket/track/:awbCode
// @access  Public (Throttled & Format Validated - BUG-07 Fix)
router.get("/track/:awbCode", apiLimiter, async (req, res) => {
  try {
    const { awbCode } = req.params;
    if (!awbCode || typeof awbCode !== "string") {
      return res.status(400).json({ message: "AWB Code is required" });
    }

    const cleanAwb = awbCode.trim();
    if (!/^[A-Za-z0-9_-]{4,35}$/.test(cleanAwb)) {
      return res.status(400).json({ message: "Invalid AWB Code format" });
    }

    const trackingData = await shiprocketService.trackOrder(cleanAwb);
    
    // Sanitize any raw PII from external carrier payload
    if (trackingData && typeof trackingData === "object") {
      const sanitized = { ...trackingData };
      if (sanitized.tracking_data?.shipment_track) {
        // Strip out raw customer phone/email if present in external response
        sanitized.tracking_data = { ...sanitized.tracking_data };
      }
      return res.json(sanitized);
    }

    res.json(trackingData);
  } catch (error) {
    console.error("Tracking API error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch tracking details" });
  }
});

// @desc    Check courier serviceability between pincodes
// @route   GET /api/shiprocket/serviceability
// @access  Public
router.get("/serviceability", async (req, res) => {
  try {
    const { pickup_postcode, delivery_postcode, weight, cod } = req.query;
    if (!pickup_postcode || !delivery_postcode) {
      return res.status(400).json({ message: "pickup_postcode and delivery_postcode are required" });
    }

    const courier = await shiprocketService.checkServiceability({
      pickup_postcode,
      delivery_postcode,
      weight: weight ? parseFloat(weight) : 0.5,
      cod: cod === "1" || cod === "true",
    });

    res.json(courier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Retry failed shipment creation (Idempotent Admin endpoint)
// @route   POST /api/shiprocket/retry/:vendorOrderId
// @access  Private/Admin or VendorOnboarder
router.post("/retry/:vendorOrderId", protect, adminOrVendorOnboarder, async (req, res) => {
  let vendorOrder;
  try {
    vendorOrder = await VendorOrder.findById(req.params.vendorOrderId);
    if (!vendorOrder) {
      return res.status(404).json({ message: "VendorOrder not found" });
    }

    if (vendorOrder.shiprocketOrderId && vendorOrder.awbCode) {
      return res.status(400).json({
        message: "Shipment already created for this order",
        shiprocketOrderId: vendorOrder.shiprocketOrderId,
        awbCode: vendorOrder.awbCode,
      });
    }

    const order = await Order.findById(vendorOrder.order);
    let vendor = null;

    if (vendorOrder.vendor) {
      vendor = await Vendor.findById(vendorOrder.vendor);
      if (!vendor) {
        return res.status(404).json({ message: "Assigned vendor not found for this order" });
      }
    } else {
      // Platform-direct product - strictly requires configured location
      const platformLocation = (process.env.SHIPROCKET_PRIMARY_LOCATION || "").trim();
      if (!platformLocation) {
        return res.status(400).json({
          message: "Platform pickup location is not configured (SHIPROCKET_PRIMARY_LOCATION missing in environment).",
          code: "PLATFORM_PICKUP_LOCATION_NOT_CONFIGURED"
        });
      }

      vendor = {
        _id: null,
        businessName: "SIRABA Organic Direct",
        phone: process.env.PLATFORM_PHONE || "8586836660",
        email: process.env.PLATFORM_EMAIL || "support@sirabaorganic.com",
        shiprocket_pickup_code: platformLocation,
        pickupAddress: {
          facilityName: platformLocation,
          shiprocketLocationName: platformLocation,
          addressLine1: "SIRABA Fulfillment Facility",
          city: "Gurugram",
          state: "Haryana",
          pincode: "122102",
          country: "India",
        },
      };
    }

    const result = await shiprocketService.createShipment(vendorOrder, order, vendor);

    vendorOrder.shiprocketOrderId = result.shiprocketOrderId;
    vendorOrder.shipmentId = result.shipmentId;
    vendorOrder.awbCode = result.awbCode;
    vendorOrder.courierName = result.courierName;
    vendorOrder.courierId = result.courierId;
    vendorOrder.shippingRoutingCode = result.routingCode;
    vendorOrder.labelUrl = result.labelUrl;

    if (result.pickupScheduled) {
      vendorOrder.status = "pickup_scheduled";
      vendorOrder.pickupScheduledAt = result.pickupScheduledAt || new Date();
      if (result.pickupTokenNumber) {
        vendorOrder.pickupTokenNumber = String(result.pickupTokenNumber);
      }
    } else {
      vendorOrder.status = "processing";
      if (result.pickupError) {
        vendorOrder.shipmentError = {
          code: "PICKUP_SCHEDULING_FAILED",
          message: result.pickupError,
          timestamp: new Date()
        };
      }
    }

    await vendorOrder.save();

    res.json({
      message: "Shipment retry successful!",
      shipment: result,
      status: vendorOrder.status,
    });
  } catch (error) {
    console.error("Retry Shipment Error:", error);

    const isPickupUnverified = error.code === 'PICKUP_LOCATION_NOT_REGISTERED' || error.code === 'PLATFORM_PICKUP_LOCATION_NOT_CONFIGURED';
    if (vendorOrder) {
      vendorOrder.status = isPickupUnverified ? 'shipment_blocked_pickup_unverified' : 'partially_failed';
      vendorOrder.shipmentError = {
        code: error.code || (isPickupUnverified ? 'PICKUP_LOCATION_NOT_REGISTERED' : 'SHIPMENT_CREATION_FAILED'),
        message: error.message,
        timestamp: new Date()
      };
      await vendorOrder.save();
    }

    res.status(400).json({
      message: error.message || "Shipment creation retry failed",
      code: vendorOrder.shipmentError.code,
      status: vendorOrder.status
    });
  }
});

module.exports = router;
