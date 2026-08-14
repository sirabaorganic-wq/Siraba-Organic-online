const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const ProductCompliance = require("../models/ProductCompliance");
const ProductBatch = require("../models/ProductBatch");
const complianceService = require("../services/complianceService");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protectVendor } = require("../middleware/vendorMiddleware");
const { productCache, complianceCache, invalidateCache } = require("../config/cache");
const {
  cacheListMiddleware,
  cacheByIdMiddleware,
} = require("../middleware/cacheMiddleware");

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get(
  "/",
  cacheListMiddleware(productCache, "products:list"),
  async (req, res) => {
    try {
      const keyword = req.query.keyword
        ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
        : {};

      const category = req.query.category
        ? { category: req.query.category }
        : {};

      let priceFilter = {};
      if (req.query.minPrice || req.query.maxPrice) {
        priceFilter.price = {};
        if (req.query.minPrice)
          priceFilter.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice)
          priceFilter.price.$lte = Number(req.query.maxPrice);
      }

      // Certification filter
      let certFilter = {};
      if (req.query.certified === "true") {
        // Show only products that have at least one certification
        certFilter.certifications = { $exists: true, $ne: [] };
      } else if (req.query.certification) {
        // Filter by specific certification (e.g., "USDA Organic")
        certFilter.certifications = req.query.certification;
      }

      // Simplified query using computed isPublic field (fast with index)
      const query = {
        isPublic: true,
        ...keyword,
        ...category,
        ...priceFilter,
        ...certFilter,
      };

      let sort = {};
      if (req.query.sort) {
        if (req.query.sort === "price-asc") sort = { price: 1 };
        else if (req.query.sort === "price-desc") sort = { price: -1 };
        else if (req.query.sort === "newest") sort = { createdAt: -1 };
      }

      const products = await Product.find(query)
        .sort(sort)
        .populate("vendor", "businessName")
        .lean();
      res.json(products);
    } catch (error) {
      console.error("Product query error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Fetch product compliance record (Public DTO)
// @route   GET /api/products/:id/compliance
// @access  Public
router.get("/:id/compliance", async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

    let compliance = await ProductCompliance.findOne(query).lean();
    if (!compliance && isObjectId) {
      compliance = await ProductCompliance.findOne({ product: req.params.id }).lean();
    }

    if (!compliance) {
      const product = await Product.findOne(query).populate("vendor").lean();
      if (!product) {
        return res.json({ compliance: null });
      }

      const Vendor = require("../models/Vendor");
      let vendor = product.vendor;
      if (vendor && (typeof vendor === "string" || !vendor.businessName)) {
        const vId = typeof vendor === "string" ? vendor : vendor._id;
        vendor = await Vendor.findById(vId).lean();
      }

      const certNumber = vendor?.organicCertification?.certificationsByRoute?.usda?.certificateNumber || vendor?.organicCertification?.certificateNumber || "";
      const certBody = vendor?.organicCertification?.certificationsByRoute?.usda?.certificationBody || vendor?.organicCertification?.certificationBody || "";
      const certValidUntil = vendor?.organicCertification?.certificateValidUntil || null;
      const isCertVerified = Boolean(certNumber && vendor?.status === "approved");

      const labDocTypes = [
        "nabl_certificate",
        "laboratory_report_coa",
        "certificate_of_analysis",
        "pesticide_residue_report",
        "heavy_metal_report",
        "microbiological_report",
        "product_quality_report",
      ];
      const hasLabCert = Boolean(
        vendor?.complianceDocuments?.some(
          (doc) => doc.status === "approved" && labDocTypes.includes(doc.type)
        )
      );

      const isFssaiVerified = Boolean(vendor?.fssaiNumber);
      const isProductVerified = vendor?.status === "approved";
      const isSciVerified = hasLabCert;
      const isOverallVerified = isFssaiVerified && isProductVerified && isSciVerified;

      const syntheticCompliance = {
        product: product._id,
        vendor: vendor?._id || null,
        certification: {
          status: isCertVerified ? "verified" : "pending",
          standard: vendor?.organicCertification?.certificationRoute ? vendor.organicCertification.certificationRoute.toUpperCase() : "Organic Certification",
          certificationBody: certBody,
          certificateNumber: certNumber,
          validUntil: certValidUntil,
        },
        regulatory: {
          fssai: {
            status: isFssaiVerified ? "verified" : "pending",
            licenseNumber: vendor?.fssaiNumber || "",
          },
        },
        productVerification: {
          status: isProductVerified ? "verified" : "pending",
          labelVerified: isProductVerified,
          ingredientsVerified: isProductVerified,
          specificationVerified: isProductVerified,
          claimsReviewed: isProductVerified,
        },
        scientificVerification: {
          status: isSciVerified ? "verified" : "pending",
          summary: isSciVerified
            ? "Accredited Lab Evidence validated."
            : "Accredited Lab Evidence pending review.",
        },
        sirabaQualification: {
          status: vendor?.status === "approved" ? "verified" : "pending",
          vendorQualified: vendor?.status === "approved",
          marketplaceApproved: vendor?.status === "approved",
        },
        trustStatus: {
          isCertified: isCertVerified,
          isVerified: isOverallVerified,
          isQualified: vendor?.status === "approved",
          isTripleVerified: isCertVerified && isOverallVerified && vendor?.status === "approved",
        },
      };

      const publicDTO = complianceService.buildPublicDTO(syntheticCompliance);
      return res.json({ compliance: publicDTO });
    }

    const publicDTO = complianceService.buildPublicDTO(compliance);
    res.json({ compliance: publicDTO });
  } catch (error) {
    console.error("Error fetching product compliance:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Fetch latest active batch for product (Public DTO)
// @route   GET /api/products/:id/batches/latest
// @access  Public
router.get("/:id/batches/latest", async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { product: req.params.id, status: "active" } : {};

    let latestBatch = null;
    if (isObjectId) {
      latestBatch = await ProductBatch.findOne(query)
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!latestBatch) {
      const product = await Product.findOne(isObjectId ? { _id: req.params.id } : { slug: req.params.id }).lean();
      if (product) {
        latestBatch = await ProductBatch.findOne({ product: product._id, status: "active" }).sort({ createdAt: -1 }).lean();
      }
    }

    if (!latestBatch) {
      return res.json({ batch: null, reason: "no_active_batch" });
    }

    const publicBatchDTO = complianceService.buildPublicBatchDTO(latestBatch);
    res.json({ batch: publicBatchDTO });
  } catch (error) {
    console.error("Error fetching latest product batch:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Fetch Trust Passport Cards DTO for product (Public)
// @route   GET /api/products/:id/trust-passport
// @access  Public
router.get("/:id/trust-passport", async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

    const product = await Product.findOne(query).populate("vendor").lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const Vendor = require("../models/Vendor");
    let vendor = product.vendor;
    if (!vendor || typeof vendor === "string" || !vendor.businessName) {
      if (vendor && (typeof vendor === "string" || vendor._id)) {
        const vId = typeof vendor === "string" ? vendor : vendor._id;
        vendor = await Vendor.findById(vId).lean();
      }
    }

    if (!vendor) {
      vendor = {
        businessName: "SIRABA Organic Direct",
        businessType: "processor",
        status: "approved",
        isBusinessRegistered: "yes",
        maintainsTraceabilityRecords: "yes",
        address: { state: "Haryana", country: "India" },
      };
    }

    const [compliance, batch] = await Promise.all([
      ProductCompliance.findOne({ product: product._id }).lean(),
      ProductBatch.findOne({ product: product._id, status: "active" }).sort({ createdAt: -1 }).lean(),
    ]);

    const trustPassport = complianceService.buildTrustPassportDTO({
      product,
      vendor,
      compliance,
      batch,
    });

    res.json({ trustPassport });
  } catch (error) {
    console.error("Error generating Trust Passport DTO:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
router.get(
  "/:id",
  cacheByIdMiddleware(productCache, "products:detail"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).lean();
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post("/", protect, admin, async (req, res) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();

    if (createdProduct.batchNumber) {
      await complianceService.upsertProductBatch(createdProduct._id, {
        batchNumber: createdProduct.batchNumber,
        batchInfo: createdProduct.batchInfo,
        vendorId: createdProduct.vendor,
      });
    }

    // Clear product cache when new product is created
    invalidateCache.products();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      Object.assign(product, req.body);
      const updatedProduct = await product.save();

      if (updatedProduct.batchNumber) {
        await complianceService.upsertProductBatch(updatedProduct._id, {
          batchNumber: updatedProduct.batchNumber,
          batchInfo: updatedProduct.batchInfo,
          vendorId: updatedProduct.vendor,
        });
      }

      // Clear product cache when product is updated
      invalidateCache.products();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      // Clear product cache when product is deleted
      invalidateCache.products();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Check if user can review product
// @route   GET /api/products/:id/can-review
// @access  Private
router.get("/:id/can-review", protect, async (req, res) => {
  try {
    const { checkPurchaseStatus } = require("../middleware/reviewMiddleware");
    const productId = req.params.id;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString(),
    );

    // Check if purchased
    const purchaseStatus = await checkPurchaseStatus(userId, productId);

    res.json({
      canReview: purchaseStatus.canReview && !alreadyReviewed,
      isPurchased: purchaseStatus.isPurchased,
      alreadyReviewed: !!alreadyReviewed,
      purchaseStatus,
      existingReview: alreadyReviewed || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new review (Verified Buyers Only)
// @route   POST /api/products/:id/reviews
// @access  Private
router.post("/:id/reviews", protect, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    // Import middleware function
    const { verifyPurchase, checkPurchaseStatus } = require("../middleware/reviewMiddleware");

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this product. You can update your existing review.",
        existingReview: alreadyReviewed
      });
    }

    // CRITICAL: Verify purchase
    const purchaseStatus = await checkPurchaseStatus(req.user._id, req.params.id);

    if (!purchaseStatus.canReview) {
      return res.status(403).json({
        message: "You can only review products you have purchased and received",
        canReview: false,
        reason: "NOT_PURCHASED",
      });
    }

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ message: "Review must be at least 10 characters long" });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment: comment.trim(),
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    // Clear product cache when review is added
    invalidateCache.products();

    // Get the newly added review with its _id
    const newReview = product.reviews[product.reviews.length - 1];

    // Emit real-time event
    if (req.io) {
      req.io.emit("new_review", {
        productId: product._id,
        review: newReview,
        rating: product.rating,
      });
    }

    res.status(201).json({
      message: "Review added successfully",
      review: newReview,
      rating: product.rating,
      numReviews: product.numReviews,
      verifiedPurchase: true,
    });
  } catch (error) {
    console.error("Review creation error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user's own review
// @route   PUT /api/products/:id/reviews/:reviewId
// @access  Private
router.put("/:id/reviews/:reviewId", protect, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Only review owner can update
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own reviews" });
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (comment && comment.trim().length < 10) {
      return res.status(400).json({ message: "Review must be at least 10 characters long" });
    }

    // Update review
    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment.trim();

    // Recalculate product rating
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    invalidateCache.products();

    // Emit real-time event
    if (req.io) {
      req.io.emit("review_updated", {
        productId: product._id,
        reviewId: review._id,
        rating: product.rating,
      });
    }

    res.json({
      message: "Review updated successfully",
      review,
      rating: product.rating,
    });
  } catch (error) {
    console.error("Review update error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private (User can delete own review, Admin can delete any)
router.delete("/:id/reviews/:reviewId", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Only review owner or admin can delete
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You can only delete your own reviews"
      });
    }

    // Remove review using pull
    product.reviews.pull(req.params.reviewId);

    // Recalculate ratings
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length
        : 0;

    await product.save();
    invalidateCache.products();

    // Emit real-time event
    if (req.io) {
      req.io.emit("review_deleted", {
        productId: product._id,
        reviewId: req.params.reviewId,
        rating: product.rating,
      });
    }

    res.json({
      message: "Review deleted successfully",
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    console.error("Review deletion error:", error);
    res.status(500).json({ message: error.message });
  }
});
// @desc    Reply to review (Vendor)
// @route   PUT /api/products/:id/reviews/:reviewId/reply
// @access  Private/Vendor
router.put("/:id/reviews/:reviewId/reply", protectVendor, async (req, res) => {
  const { reply } = req.body;
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      if (
        product.vendor &&
        product.vendor.toString() !== req.vendor._id.toString()
      ) {
        return res.status(401).json({
          message: "Not authorized to reply to this product's reviews",
        });
      }

      const review = product.reviews.id(req.params.reviewId);
      if (review) {
        review.vendorReply = reply;
        review.vendorReplyDate = Date.now();
        await product.save();
        // Clear product cache when vendor replies to review
        invalidateCache.products();

        // Emit real-time event
        if (req.io) {
          req.io.emit("review_reply", {
            productId: product._id,
            reviewId: review._id,
            reply: reply,
            replyDate: review.vendorReplyDate,
          });
        }

        res.json({ message: "Reply added" });
      } else {
        res.status(404).json({ message: "Review not found" });
      }
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
