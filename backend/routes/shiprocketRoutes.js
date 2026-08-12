const express = require("express");
const router = express.Router();
const shiprocketService = require("../services/shiprocketService");
const VendorOrder = require("../models/VendorOrder");
const Vendor = require("../models/Vendor");
const Order = require("../models/Order");
const { protect, admin, adminOrVendorOnboarder } = require("../middleware/authMiddleware");

// @desc    Track shipment by AWB Code
// @route   GET /api/shiprocket/track/:awbCode
// @access  Public / User
router.get("/track/:awbCode", async (req, res) => {
  try {
    const { awbCode } = req.params;
    if (!awbCode) {
      return res.status(400).json({ message: "AWB Code is required" });
    }

    const trackingData = await shiprocketService.trackOrder(awbCode);
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
  try {
    const vendorOrder = await VendorOrder.findById(req.params.vendorOrderId);
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
    const vendor = vendorOrder.vendor
      ? await Vendor.findById(vendorOrder.vendor)
      : {
          _id: null,
          businessName: "SIRABA Organic Direct",
          phone: process.env.PLATFORM_PHONE || "9876543210",
          email: process.env.PLATFORM_EMAIL || "support@sirabaorganic.com",
          shiprocket_pickup_code: process.env.SHIPROCKET_PRIMARY_LOCATION || "Primary",
          pickupAddress: {
            facilityName: "Primary",
            shiprocketLocationName: process.env.SHIPROCKET_PRIMARY_LOCATION || "Primary",
            addressLine1: "SIRABA Organic Fulfillment Center",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302001",
            country: "India",
          },
        };

    const result = await shiprocketService.createShipment(vendorOrder, order, vendor);

    vendorOrder.shiprocketOrderId = result.shiprocketOrderId;
    vendorOrder.shipmentId = result.shipmentId;
    vendorOrder.awbCode = result.awbCode;
    vendorOrder.courierName = result.courierName;
    vendorOrder.courierId = result.courierId;
    vendorOrder.shippingRoutingCode = result.routingCode;
    vendorOrder.labelUrl = result.labelUrl;
    vendorOrder.status = "processing";

    await vendorOrder.save();

    res.json({
      message: "Shipment retry successful!",
      shipment: result,
    });
  } catch (error) {
    console.error("Retry Shipment Error:", error);

    const isPickupUnverified = error.code === 'PICKUP_LOCATION_NOT_REGISTERED';
    vendorOrder.status = isPickupUnverified ? 'shipment_blocked_pickup_unverified' : 'partially_failed';
    vendorOrder.shipmentError = {
      code: error.code || (isPickupUnverified ? 'PICKUP_LOCATION_NOT_REGISTERED' : 'SHIPMENT_CREATION_FAILED'),
      message: error.message,
      timestamp: new Date()
    };
    await vendorOrder.save();

    res.status(400).json({
      message: error.message || "Shipment creation retry failed",
      code: vendorOrder.shipmentError.code,
      status: vendorOrder.status
    });
  }
});

module.exports = router;
