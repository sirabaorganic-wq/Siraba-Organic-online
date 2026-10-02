const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

const User = require("../models/User");

// Protect vendor routes
const protectVendor = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && (req.query.token || req.query.vendorToken)) {
    token = req.query.token || req.query.vendorToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

      const vendorId = decoded.vendorId || decoded.id || decoded._id;

      if (vendorId) {
        req.vendor = await Vendor.findById(vendorId).select("-password");

        if (!req.vendor) {
          // Check if this token belongs to an Admin/Staff
          const user = await User.findById(vendorId).select("-password");
          if (user && (user.role === "admin" || user.isAdmin)) {
            req.user = user;
            req.isAdmin = true;
            return next();
          }
          return res
            .status(401)
            .json({ message: "Not authorized, vendor not found" });
        }

        if (req.vendor.isActive === false) {
          return res
            .status(401)
            .json({ message: "Vendor account is inactive" });
        }

        if (req.vendor.status === "suspended") {
          return res
            .status(401)
            .json({ message: "Vendor account is suspended" });
        }

        return next();
      } else {
        return res.status(401).json({ message: "Not authorized as vendor" });
      }
    } catch (error) {
      console.error("Vendor auth token error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
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

// Check if vendor has at least one organic certification
const certifiedVendor = (req, res, next) => {
  if (
    req.vendor &&
    req.vendor.certifications &&
    req.vendor.certifications.length > 0
  ) {
    next();
  } else {
    res.status(403).json({
      message:
        "Vendor must have at least one organic certification (USDA Organic, EU Organic, or NPOP) to list products",
      certifications: req.vendor?.certifications || [],
    });
  }
};

module.exports = { protectVendor, approvedVendor, onboardingComplete, certifiedVendor };
