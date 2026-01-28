const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get("/", protect, async (req, res) => {
  // User is already attached to req by protect middleware
  // but we might want to fetch fresh
  const user = await User.findById(req.user._id);
  if (user) {
    res.json(user.cart);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// @desc    Update/Sync cart
// @route   PUT /api/cart
// @access  Private
router.put("/", protect, async (req, res) => {
  const { cartItems } = req.body;
  try {
    // Use findByIdAndUpdate to avoid version conflicts
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { cart: cartItems },
      { new: true }
    );
    if (user) {
      res.json(user.cart);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Cart update error:", error);
    res.status(500).json({ message: "Failed to update cart" });
  }
});

module.exports = router;
