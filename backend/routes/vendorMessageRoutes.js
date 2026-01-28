const express = require("express");
const router = express.Router();
const VendorMessage = require("../models/VendorMessage");
const { protect, admin } = require("../middleware/authMiddleware");
const { protectVendor } = require("../middleware/vendorMiddleware");

// @desc    Get messages for logged in vendor
// @route   GET /api/vendor-messages/vendor
// @access  Private/Vendor
router.get("/vendor", protectVendor, async (req, res) => {
  try {
    const messages = await VendorMessage.find({ vendor: req.vendor._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send message from vendor
// @route   POST /api/vendor-messages/vendor
// @access  Private/Vendor
router.post("/vendor", protectVendor, async (req, res) => {
  const { message } = req.body;
  try {
    const newMessage = await VendorMessage.create({
      vendor: req.vendor._id,
      sender: "vendor",
      message,
    });

    // Emit real-time update
    if (req.io) {
      req.io.to(`vendor_${req.vendor._id}`).emit("receive_message", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get messages for admin with a specific vendor
// @route   GET /api/vendor-messages/admin/:vendorId
// @access  Private/Admin
router.get("/admin/:vendorId", protect, admin, async (req, res) => {
  try {
    const messages = await VendorMessage.find({ vendor: req.params.vendorId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send message from admin to vendor
// @route   POST /api/vendor-messages/admin/:vendorId
// @access  Private/Admin
router.post("/admin/:vendorId", protect, admin, async (req, res) => {
  const { message } = req.body;
  try {
    const newMessage = await VendorMessage.create({
      vendor: req.params.vendorId,
      sender: "admin",
      message,
    });

    // Emit real-time update
    if (req.io) {
      req.io.to(`vendor_${req.params.vendorId}`).emit("receive_message", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
