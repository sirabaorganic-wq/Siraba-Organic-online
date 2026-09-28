const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

/**
 * Validation helper for address payloads
 */
const validateAddressInput = (data) => {
  const errors = [];
  const { name, phone, address, city, state, postalCode } = data;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Full name is required (minimum 2 characters)");
  }

  // Validate 10-digit Indian phone number
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length < 10) {
    errors.push("A valid 10-digit phone number is required");
  }

  if (!address || typeof address !== "string" || address.trim().length < 5) {
    errors.push("Street address is required (minimum 5 characters)");
  }

  if (!city || typeof city !== "string" || city.trim().length < 2) {
    errors.push("City is required");
  }

  if (!state || typeof state !== "string" || state.trim().length < 2) {
    errors.push("State is required");
  }

  const cleanPostalCode = String(postalCode || "").trim();
  if (!/^[0-9]{6}$/.test(cleanPostalCode)) {
    errors.push("A valid 6-digit postal/PIN code is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// @desc    Get all saved addresses for authenticated consumer
// @route   GET /api/addresses
// @access  Private (Consumer)
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses name phone");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addresses = (user.addresses || []).slice().sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Failed to retrieve addresses" });
  }
});

// @desc    Add a new address for authenticated consumer
// @route   POST /api/addresses
// @access  Private (Consumer)
router.post("/", protect, async (req, res) => {
  try {
    const validation = validateAddressInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFirstAddress = !user.addresses || user.addresses.length === 0;
    const shouldBeDefault = isFirstAddress || req.body.isDefault === true || req.body.isDefault === "true";

    // If setting as default, unset existing default addresses
    if (shouldBeDefault && user.addresses && user.addresses.length > 0) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const cleanPhone = String(req.body.phone || "").replace(/\D/g, "");
    const formattedPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    const newAddressData = {
      name: req.body.name.trim(),
      phone: formattedPhone,
      address: req.body.address.trim(),
      addressLine2: req.body.addressLine2 ? req.body.addressLine2.trim() : "",
      landmark: req.body.landmark ? req.body.landmark.trim() : "",
      city: req.body.city.trim(),
      state: req.body.state.trim(),
      postalCode: String(req.body.postalCode).trim(),
      country: req.body.country ? req.body.country.trim() : "India",
      addressType: ["Home", "Work", "Other"].includes(req.body.addressType) ? req.body.addressType : "Home",
      isDefault: shouldBeDefault,
    };

    user.addresses.push(newAddressData);
    await user.save();

    const createdAddress = user.addresses[user.addresses.length - 1];

    res.status(201).json(createdAddress);
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ message: "Failed to create address: " + error.message });
  }
});

// @desc    Update an existing address
// @route   PUT /api/addresses/:id
// @access  Private (Consumer)
router.put("/:id", protect, async (req, res) => {
  try {
    const validation = validateAddressInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetAddress = user.addresses.id(req.params.id);
    if (!targetAddress) {
      return res.status(404).json({ message: "Address not found or unauthorized" });
    }

    const cleanPhone = String(req.body.phone || "").replace(/\D/g, "");
    const formattedPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
    const shouldBeDefault = req.body.isDefault === true || req.body.isDefault === "true";

    // If making this address default, clear others
    if (shouldBeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    targetAddress.name = req.body.name.trim();
    targetAddress.phone = formattedPhone;
    targetAddress.address = req.body.address.trim();
    targetAddress.addressLine2 = req.body.addressLine2 ? req.body.addressLine2.trim() : "";
    targetAddress.landmark = req.body.landmark ? req.body.landmark.trim() : "";
    targetAddress.city = req.body.city.trim();
    targetAddress.state = req.body.state.trim();
    targetAddress.postalCode = String(req.body.postalCode).trim();
    targetAddress.country = req.body.country ? req.body.country.trim() : "India";
    targetAddress.addressType = ["Home", "Work", "Other"].includes(req.body.addressType) ? req.body.addressType : targetAddress.addressType || "Home";
    
    if (shouldBeDefault) {
      targetAddress.isDefault = true;
    }

    await user.save();

    res.json(targetAddress);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Failed to update address: " + error.message });
  }
});

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private (Consumer)
router.delete("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetAddress = user.addresses.id(req.params.id);
    if (!targetAddress) {
      return res.status(404).json({ message: "Address not found or unauthorized" });
    }

    const wasDefault = targetAddress.isDefault;

    // Remove subdocument
    targetAddress.deleteOne();

    // If the deleted address was default and remaining addresses exist, assign first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Failed to delete address: " + error.message });
  }
});

// @desc    Set an address as default
// @route   PATCH /api/addresses/:id/default
// @route   PUT /api/addresses/:id/default
// @access  Private (Consumer)
const handleSetDefault = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetAddress = user.addresses.id(req.params.id);
    if (!targetAddress) {
      return res.status(404).json({ message: "Address not found or unauthorized" });
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === req.params.id;
    });

    await user.save();

    res.json({
      message: "Default address updated",
      defaultAddress: targetAddress,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};

router.patch("/:id/default", protect, handleSetDefault);
router.put("/:id/default", protect, handleSetDefault);

module.exports = router;
