const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

// Protect vendor routes
const protectVendor = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

      // Check if it's a vendor token (has vendorId)
      if (decoded.vendorId) {
        req.vendor = await Vendor.findById(decoded.vendorId).select(
          "-password"
        );

        if (!req.vendor) {
          return res
            .status(401)
            .json({ message: "Not authorized, vendor not found" });
        }

        if (!req.vendor.isActive) {
          return res
            .status(401)
            .json({ message: "Vendor account is inactive" });
        }

        if (req.vendor.status === "suspended") {
          return res
            .status(401)
            .json({ message: "Vendor account is suspended" });
        }

        next();
      } else {
        return res.status(401).json({ message: "Not authorized as vendor" });
      }
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Check if vendor is approved
const approvedVendor = (req, res, next) => {
  if (req.vendor && req.vendor.status === "approved") {
    next();
  } else {
    res.status(403).json({
      message: "Vendor account not yet approved",
      status: req.vendor?.status || "unknown",
    });
  }
};

// Check if vendor onboarding is complete
const onboardingComplete = (req, res, next) => {
  if (req.vendor && req.vendor.onboardingComplete) {
    next();
  } else {
    res.status(403).json({
      message: "Please complete onboarding first",
      onboardingStep: req.vendor?.onboardingStep || 1,
    });
  }
};

module.exports = { protectVendor, approvedVendor, onboardingComplete };
