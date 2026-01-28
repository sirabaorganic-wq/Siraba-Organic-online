const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Vendor = require("../models/Vendor");
const VendorOrder = require("../models/VendorOrder");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  protectVendor,
  approvedVendor,
  onboardingComplete,
} = require("../middleware/vendorMiddleware");
const {
  vendorCache,
  productCache,
  invalidateCache,
} = require("../config/cache");
const { cacheByIdMiddleware } = require("../middleware/cacheMiddleware");

// Generate Vendor JWT
const generateVendorToken = (vendorId) => {
  return jwt.sign({ vendorId }, process.env.JWT_SECRET || "secret123", {
    expiresIn: "30d",
  });
};

// ================== AUTH ROUTES ==================

// @desc    Register new vendor
// @route   POST /api/vendors/register
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      businessName,
      businessType,
      contactPerson,
      phone,
      city,
      state,
      postalCode,
    } = req.body;

    // Check if vendor exists
    const vendorExists = await Vendor.findOne({ email: email.toLowerCase() });
    if (vendorExists) {
      return res
        .status(400)
        .json({ message: "Vendor with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create vendor
    const vendor = await Vendor.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      businessName,
      businessType,
      contactPerson,
      phone,
      address: { city, state, postalCode },
      onboardingStep: 2, // Move to step 2 after registration
    });

    res.status(201).json({
      _id: vendor._id,
      email: vendor.email,
      businessName: vendor.businessName,
      status: vendor.status,
      onboardingStep: vendor.onboardingStep,
      token: generateVendorToken(vendor._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Vendor login
// @route   POST /api/vendors/login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const vendor = await Vendor.findOne({ email: email.toLowerCase() });

    if (vendor && (await bcrypt.compare(password, vendor.password))) {
      // Update last login
      vendor.lastLogin = new Date();
      await vendor.save();

      res.json({
        _id: vendor._id,
        email: vendor.email,
        businessName: vendor.businessName,
        businessType: vendor.businessType,
        contactPerson: vendor.contactPerson,
        logo: vendor.logo,
        status: vendor.status,
        onboardingStep: vendor.onboardingStep,
        onboardingComplete: vendor.onboardingComplete,
        metrics: vendor.metrics,
        token: generateVendorToken(vendor._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get vendor profile
// @route   GET /api/vendors/profile
// @access  Private/Vendor
router.get("/profile", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id)
      .select("-password")
      .lean();
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private/Vendor
router.put("/profile", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id);

    if (vendor) {
      vendor.businessName = req.body.businessName || vendor.businessName;
      vendor.businessDescription =
        req.body.businessDescription || vendor.businessDescription;
      vendor.contactPerson = req.body.contactPerson || vendor.contactPerson;
      vendor.phone = req.body.phone || vendor.phone;
      vendor.alternatePhone = req.body.alternatePhone || vendor.alternatePhone;
      vendor.website = req.body.website || vendor.website;
      vendor.logo = req.body.logo || vendor.logo;

      if (req.body.address) {
        vendor.address = { ...vendor.address, ...req.body.address };
      }

      // Update Legal Info
      vendor.gstNumber = req.body.gstNumber || vendor.gstNumber;
      vendor.panNumber = req.body.panNumber || vendor.panNumber;
      vendor.fssaiNumber = req.body.fssaiNumber || vendor.fssaiNumber;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        vendor.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedVendor = await vendor.save();
      // Clear vendor cache when profile is updated
      invalidateCache.vendors();
      res.json({
        _id: updatedVendor._id,
        email: updatedVendor.email,
        businessName: updatedVendor.businessName,
        status: updatedVendor.status,
        token: generateVendorToken(updatedVendor._id),
      });
    } else {
      res.status(404).json({ message: "Vendor not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== ONBOARDING ROUTES ==================

// @desc    Update onboarding step
// @route   PUT /api/vendors/onboarding
// @access  Private/Vendor
router.put("/onboarding", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id);
    const { step, data } = req.body;

    switch (step) {
      case 1: // Business Details
        vendor.businessDescription = data.businessDescription;
        vendor.website = data.website;
        vendor.gstNumber = data.gstNumber;
        vendor.panNumber = data.panNumber;
        vendor.fssaiNumber = data.fssaiNumber;
        vendor.onboardingStep = 2;
        break;

      case 2: // Address
        if (data.address) {
          vendor.address = { ...vendor.address, ...data.address };
        }
        vendor.onboardingStep = 3;
        break;

      case 3: // Bank Details
        vendor.bankDetails = data.bankDetails;
        vendor.onboardingStep = 4;
        break;

      case 4: // Plan Selection (handled by /subscription route but mark step complete)
        vendor.onboardingStep = 5;
        break;

      case 5: // Documents Upload - Final step
        vendor.onboardingComplete = true;
        vendor.status = "under_review";
        vendor.onboardingStep = 5;
        break;

      default:
        return res.status(400).json({ message: "Invalid onboarding step" });
    }

    await vendor.save();
    // Clear vendor cache when onboarding is updated
    invalidateCache.vendors();
    res.json({
      onboardingStep: vendor.onboardingStep,
      onboardingComplete: vendor.onboardingComplete,
      status: vendor.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== COMPLIANCE ROUTES ==================

// @desc    Upload compliance document
// @route   POST /api/vendors/compliance
// @access  Private/Vendor
router.post("/compliance", protectVendor, async (req, res) => {
  try {
    const { name, type, fileUrl, expiryDate } = req.body;
    const vendor = await Vendor.findById(req.vendor._id);

    vendor.complianceDocuments.push({
      name,
      type,
      fileUrl,
      expiryDate,
      status: "pending",
    });

    await vendor.save();
    res.status(201).json(vendor.complianceDocuments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get compliance documents
// @route   GET /api/vendors/compliance
// @access  Private/Vendor
router.get("/compliance", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id);
    res.json(vendor.complianceDocuments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete compliance document
// @route   DELETE /api/vendors/compliance/:docId
// @access  Private/Vendor
router.delete("/compliance/:docId", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id);
    vendor.complianceDocuments = vendor.complianceDocuments.filter(
      (doc) => doc._id.toString() !== req.params.docId,
    );
    await vendor.save();
    res.json({ message: "Document removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== VENDOR PRODUCTS ROUTES ==================

// @desc    Get vendor's products (products they created)
// @route   GET /api/vendors/products
// @access  Private/Vendor
router.get("/products", protectVendor, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { vendor: req.vendor._id, isVendorProduct: true };
    if (status) query.vendorStatus = status;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new product
// @route   POST /api/vendors/products
// @access  Private/Vendor (Approved only)
router.post("/products", protectVendor, approvedVendor, async (req, res) => {
  try {
    const {
      name,
      description,
      fullDescription,
      price,
      costPrice,
      category,
      tag,
      images,
      features,
      ingredients,
      stockQuantity,
      sku,
      hsn,
    } = req.body;

    // Generate slug
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    const product = await Product.create({
      name,
      slug,
      description,
      fullDescription,
      price,
      costPrice,
      category,
      tag,
      image: images?.[0] || "",
      images: images || [],
      features: features || [],
      ingredients,
      stockQuantity: stockQuantity || 0,
      sku: sku || `VND-${req.vendor._id.toString().slice(-6)}-${Date.now()}`,
      hsn: hsn || "0909",
      vendor: req.vendor._id,
      isVendorProduct: true,
      vendorStatus: "pending", // Requires admin approval
      isActive: true,
    });

    // Clear caches when vendor creates a product
    invalidateCache.products();
    invalidateCache.vendors();

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update vendor product
// @route   PUT /api/vendors/products/:productId
// @access  Private/Vendor (Approved only)
router.put(
  "/products/:productId",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const product = await Product.findOne({
        _id: req.params.productId,
        vendor: req.vendor._id,
        isVendorProduct: true,
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const {
        name,
        description,
        fullDescription,
        price,
        costPrice,
        category,
        tag,
        images,
        features,
        ingredients,
        stockQuantity,
        sku,
        hsn,
        isActive,
      } = req.body;

      if (name) {
        product.name = name;
        product.slug =
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") +
          "-" +
          product._id;
      }
      if (description) product.description = description;
      if (fullDescription) product.fullDescription = fullDescription;
      if (price) product.price = price;
      if (costPrice) product.costPrice = costPrice;
      if (category) product.category = category;
      if (tag !== undefined) product.tag = tag;
      if (images) {
        product.images = images;
        product.image = images[0] || "";
      }
      if (features) product.features = features;
      if (ingredients) product.ingredients = ingredients;
      if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
      if (sku) product.sku = sku;
      if (hsn) product.hsn = hsn;
      if (isActive !== undefined) product.isActive = isActive;

      // If product was rejected and updated, set back to pending for re-review
      if (product.vendorStatus === "rejected") {
        product.vendorStatus = "pending";
        product.vendorRejectionReason = "";
      }

      await product.save();
      // Clear caches when vendor updates a product
      invalidateCache.products();
      invalidateCache.vendors();
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Delete vendor product
// @route   DELETE /api/vendors/products/:productId
// @access  Private/Vendor (Approved only)
router.delete(
  "/products/:productId",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const product = await Product.findOne({
        _id: req.params.productId,
        vendor: req.vendor._id,
        isVendorProduct: true,
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await product.deleteOne();
      // Clear caches when vendor deletes a product
      invalidateCache.products();
      invalidateCache.vendors();
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ================== INVENTORY ROUTES ==================

// @desc    Get vendor inventory
// @route   GET /api/vendors/inventory
// @access  Private/Vendor
router.get("/inventory", protectVendor, approvedVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id).populate(
      "inventory.product",
    );
    res.json(vendor.inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add product to inventory
// @route   POST /api/vendors/inventory
// @access  Private/Vendor
router.post("/inventory", protectVendor, approvedVendor, async (req, res) => {
  try {
    const {
      productId,
      sku,
      stockQuantity,
      costPrice,
      sellingPrice,
      reorderLevel,
      batchNumber,
      expiryDate,
    } = req.body;
    const vendor = await Vendor.findById(req.vendor._id);

    // Check if product already in inventory
    const existingItem = vendor.inventory.find(
      (item) => item.product?.toString() === productId,
    );
    if (existingItem) {
      return res.status(400).json({ message: "Product already in inventory" });
    }

    vendor.inventory.push({
      product: productId,
      sku,
      stockQuantity,
      costPrice,
      sellingPrice,
      reorderLevel,
      batchNumber,
      expiryDate,
      lastRestocked: new Date(),
    });

    await vendor.save();
    const updatedVendor = await Vendor.findById(req.vendor._id).populate(
      "inventory.product",
    );
    res.status(201).json(updatedVendor.inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update inventory item
// @route   PUT /api/vendors/inventory/:itemId
// @access  Private/Vendor
router.put(
  "/inventory/:itemId",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const vendor = await Vendor.findById(req.vendor._id);
      const inventoryItem = vendor.inventory.id(req.params.itemId);

      if (!inventoryItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      const {
        stockQuantity,
        costPrice,
        sellingPrice,
        reorderLevel,
        batchNumber,
        expiryDate,
        isActive,
      } = req.body;

      if (stockQuantity !== undefined) {
        inventoryItem.stockQuantity = stockQuantity;
        inventoryItem.lastRestocked = new Date();
      }
      if (costPrice !== undefined) inventoryItem.costPrice = costPrice;
      if (sellingPrice !== undefined) inventoryItem.sellingPrice = sellingPrice;
      if (reorderLevel !== undefined) inventoryItem.reorderLevel = reorderLevel;
      if (batchNumber !== undefined) inventoryItem.batchNumber = batchNumber;
      if (expiryDate !== undefined) inventoryItem.expiryDate = expiryDate;
      if (isActive !== undefined) inventoryItem.isActive = isActive;

      await vendor.save();
      res.json(inventoryItem);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Remove inventory item
// @route   DELETE /api/vendors/inventory/:itemId
// @access  Private/Vendor
router.delete(
  "/inventory/:itemId",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const vendor = await Vendor.findById(req.vendor._id);
      vendor.inventory = vendor.inventory.filter(
        (item) => item._id.toString() !== req.params.itemId,
      );
      await vendor.save();
      res.json({ message: "Inventory item removed" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Bulk update stock
// @route   PUT /api/vendors/inventory/bulk-update
// @access  Private/Vendor
router.put(
  "/inventory/bulk-update",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const { updates } = req.body; // Array of { itemId, stockQuantity }
      const vendor = await Vendor.findById(req.vendor._id);

      updates.forEach((update) => {
        const item = vendor.inventory.id(update.itemId);
        if (item) {
          item.stockQuantity = update.stockQuantity;
          item.lastRestocked = new Date();
        }
      });

      await vendor.save();
      res.json({
        message: "Inventory updated successfully",
        count: updates.length,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ================== ORDER ROUTES ==================

// @desc    Get vendor orders
// @route   GET /api/vendors/orders
// @access  Private/Vendor
router.get("/orders", protectVendor, approvedVendor, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { vendor: req.vendor._id };

    if (status) query.status = status;

    const orders = await VendorOrder.find(query)
      .populate("order")
      .populate("items.product")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await VendorOrder.countDocuments(query);

    res.json({
      orders,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single vendor order
// @route   GET /api/vendors/orders/:id
// @access  Private/Vendor
router.get("/orders/:id", protectVendor, approvedVendor, async (req, res) => {
  try {
    const order = await VendorOrder.findOne({
      _id: req.params.id,
      vendor: req.vendor._id,
    })
      .populate("order")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update vendor order status
// @route   PUT /api/vendors/orders/:id/status
// @access  Private/Vendor
router.put(
  "/orders/:id/status",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const vendorOrder = await VendorOrder.findOne({
        _id: req.params.id,
        vendor: req.vendor._id,
      });

      if (!vendorOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      const { status, trackingNumber, shippingCarrier, vendorNotes } = req.body;
      const previousStatus = vendorOrder.status;

      vendorOrder.status = status;
      if (trackingNumber) vendorOrder.trackingNumber = trackingNumber;
      if (shippingCarrier) vendorOrder.shippingCarrier = shippingCarrier;
      if (vendorNotes) vendorOrder.vendorNotes = vendorNotes;

      // SHIPROCKET INTEGRATION
      const shiprocketService = require("../services/shiprocketService");

      if (status === "confirmed" && previousStatus !== "confirmed") {
        try {
          const srOrder = await shiprocketService.createOrder({
            order_id: vendorOrder._id,
            order_date: vendorOrder.createdAt,
            pickup_location: "Primary",
            billing_customer_name:
              vendorOrder.shippingAddress?.name || "Customer",
            billing_address: vendorOrder.shippingAddress?.address || "Address",
            billing_city: vendorOrder.shippingAddress?.city || "City",
            billing_pincode:
              vendorOrder.shippingAddress?.postalCode || "000000",
            billing_state: vendorOrder.shippingAddress?.state || "State",
            billing_country: "India",
            billing_email: "user@example.com", // Should get from user if possible
            billing_phone: vendorOrder.shippingAddress?.phone || "9999999999",
            payment_method: "Prepaid",
            sub_total: vendorOrder.subtotal,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5,
          });

          if (srOrder) {
            vendorOrder.shiprocketOrderId = srOrder.order_id;
            vendorOrder.shipmentId = srOrder.shipment_id;
            vendorOrder.trackingNumber = srOrder.awb_code;
            vendorOrder.shippingCarrier = srOrder.courier_name;
          }
        } catch (err) {
          console.error("Shiprocket Create Order Failed", err);
        }
      }

      if (status === "shipped") {
        vendorOrder.shippedAt = new Date();
      } else if (status === "cancelled" && previousStatus !== "cancelled") {
        vendorOrder.cancelledAt = new Date();

        // 1. Cancel in Shiprocket if exists
        if (vendorOrder.trackingNumber) {
          try {
            await shiprocketService.cancelOrder(vendorOrder.trackingNumber);
          } catch (err) {
            console.error("Shiprocket Cancel Failed", err);
          }
        }

        // 2. Deduct from Vendor Pending Balance
        const Vendor = require("../models/Vendor");
        const vendor = await Vendor.findById(req.vendor._id);
        if (vendor && vendor.wallet) {
          vendor.wallet.pendingBalance = Math.max(
            0,
            (vendor.wallet.pendingBalance || 0) - vendorOrder.netAmount,
          );

          // Update metrics
          vendor.metrics = vendor.metrics || {};
          vendor.metrics.pendingOrders = Math.max(
            0,
            (vendor.metrics.pendingOrders || 0) - 1,
          );

          // Add transaction record for "Lost Revenue" (negative) or just info?
          // If we use 'adjustment', positive amount might be confusing if it wasn't added to balance.
          // Since we are REMOVING it from pending, maybe we shouldn't log it in 'transactions' list
          // if that list is for REALIZED balance transactions.
          // However, to show history, let's log it with 0 amount or indicating it was 'Cancelled'.
          // Better: Log it as 0 change to main balance, but description says Cancelled.
          // OR: Don't log to realized transactions at all.

          // Based on user feedback, they saw "+1520" which is confusing.
          // Let's log it as a negative adjustment to PENDING (but this schema is for wallet transactions).
          // If we want to show it, let's make amount 0 so balance remains same.

          //  if (!vendor.wallet.transactions) vendor.wallet.transactions = [];
          //  vendor.wallet.transactions.push({
          //   type: 'adjustment',
          //   amount: 0, // Zero because it didn't affect realized balance
          //   description: `Cancelled Pending Order #${vendorOrder._id.toString().slice(-8)}`,
          //   orderId: vendorOrder._id,
          //   status: 'completed',
          //   balanceAfter: vendor.wallet.balance
          // });

          // ACTUALLY: The user screenshot showed "+1520" which implies the previous code put positive amount.
          // To fix "why is it positive", we should probably NOT push to .transactions if it only affects PENDING.
          // PENDING balance is usually a separate bucket.
          // I will COMMENT OUT the transaction push for cancellation to avoid confusing the "Available Balance" history.

          await vendor.save();
        }

        // 3. Refund User Wallet (Fetch Order & User properly)
        const Order = require("../models/Order");
        const User = require("../models/User");

        const mainOrder = await Order.findById(vendorOrder.order);
        if (mainOrder && mainOrder.user) {
          const user = await User.findById(mainOrder.user);
          if (user) {
            const refundAmount =
              (vendorOrder.subtotal || 0) + (vendorOrder.tax || 0);
            user.walletBalance = (user.walletBalance || 0) + refundAmount;
            if (!user.walletTransactions) user.walletTransactions = [];
            user.walletTransactions.push({
              type: "refund",
              amount: refundAmount,
              description: `Refund for Cancelled Order Item #${vendorOrder._id.toString().slice(-8)} (Inc. Tax)`,
              date: new Date(),
            });
            await user.save();
          }
        }
      } else if (status === "delivered" && previousStatus !== "delivered") {
        vendorOrder.deliveredAt = new Date();

        // Credit vendor wallet when order is delivered
        const vendor = await Vendor.findById(req.vendor._id);
        if (vendor) {
          if (!vendor.wallet) {
            vendor.wallet = {
              balance: 0,
              pendingBalance: 0,
              totalEarnings: 0,
              totalCommissionPaid: 0,
              totalPayouts: 0,
              transactions: [],
            };
          }

          // Move from pending to available balance
          // Note: Net Amount is (Subtotal - Commission)

          vendor.wallet.pendingBalance = Math.max(
            0,
            (vendor.wallet.pendingBalance || 0) - vendorOrder.netAmount,
          );

          // Credit only the Net Amount? Or Credit Subtotal and Debit Commission?
          // To make history clear:
          // 1. Credit Subtotal (Order Earning)
          // 2. Debit Commission (Commission)
          // This matches the user's screenshot showing "Commission -120" and "Earning +2280".
          // If Net is 2280, Subtotal must be 2400 (if 5% comm=120).
          // Checking `vendorOrder.netAmount`: it is stored as one value.
          // We can reconstruct if needed or if logic assumes netAmount is passed.
          // Let's rely on stored fields: `vendorOrder.subtotal` and `vendorOrder.commission`.

          // The previous code was `vendor.wallet.balance += vendorOrder.netAmount;`.
          // If we want "Commission" entry in history, it must be purely cosmetic OR we change logic to Logic 1.

          // Let's switch to Logic 1 for clearer history if user wants to see commission splits.
          // Recalculate balance update:
          // Remove old Logic 2 line above.

          // New Logic:
          // Balance = Balance + Subtotal - Commission
          vendor.wallet.balance =
            (vendor.wallet.balance || 0) +
            (vendorOrder.subtotal || 0) -
            (vendorOrder.commission || 0);

          vendor.wallet.totalEarnings =
            (vendor.wallet.totalEarnings || 0) + vendorOrder.netAmount;
          vendor.wallet.totalCommissionPaid =
            (vendor.wallet.totalCommissionPaid || 0) + vendorOrder.commission;

          // Add transaction record 1: Order Earning (Credit Subtotal)
          if (!vendor.wallet.transactions) vendor.wallet.transactions = [];

          vendor.wallet.transactions.push({
            type: "order_earning",
            amount: vendorOrder.subtotal,
            description: `Order #${vendorOrder._id.toString().slice(-8)} delivered`,
            orderId: vendorOrder._id,
            status: "completed",
            balanceAfter:
              (vendor.wallet.balance || 0) + (vendorOrder.commission || 0), // Balance before commission deduction
          });

          // Add transaction record 2: Commission (Debit)
          vendor.wallet.transactions.push({
            type: "commission",
            amount: -vendorOrder.commission, // Negative for deduction
            description: `Commission for Order #${vendorOrder._id.toString().slice(-8)}`,
            orderId: vendorOrder._id,
            status: "completed",
            balanceAfter: vendor.wallet.balance,
          });

          // Update metrics
          vendor.metrics = vendor.metrics || {};
          vendor.metrics.completedOrders =
            (vendor.metrics.completedOrders || 0) + 1;
          vendor.metrics.pendingOrders = Math.max(
            0,
            (vendor.metrics.pendingOrders || 0) - 1,
          );
          vendor.metrics.totalRevenue =
            (vendor.metrics.totalRevenue || 0) + vendorOrder.subtotal;

          await vendor.save();
        }

        // Update payout status
        vendorOrder.payoutStatus = "completed";
      }

      await vendorOrder.save();

      // Sync status back to main Order
      // Check if all vendor orders for this order have the same status
      const allVendorOrders = await VendorOrder.find({
        order: vendorOrder.order,
      });
      const allSameStatus = allVendorOrders.every((vo) => vo.status === status);

      if (allSameStatus && allVendorOrders.length > 0) {
        const Order = require("../models/Order");
        const mainOrder = await Order.findById(vendorOrder.order);

        if (mainOrder) {
          // Map vendor status to main order status
          const reverseStatusMap = {
            processing: "Processing",
            shipped: "Shipped",
            delivered: "Delivered",
            cancelled: "Cancelled",
          };

          const newMainStatus = reverseStatusMap[status];
          if (newMainStatus && mainOrder.status !== newMainStatus) {
            mainOrder.status = newMainStatus;

            if (status === "delivered") {
              mainOrder.isDelivered = true;
              mainOrder.deliveredAt = new Date();
            }

            await mainOrder.save();
          }
        }
      }

      res.json(vendorOrder);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Update vendor return status
// @route   PUT /api/vendors/orders/:id/return-status
// @access  Private/Vendor
router.put(
  "/orders/:id/return-status",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const { status } = req.body; // 'Approved', 'Rejected', 'Returned'
      const vendorOrder = await VendorOrder.findOne({
        _id: req.params.id,
        vendor: req.vendor._id,
      });

      if (!vendorOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      vendorOrder.returnStatus = status;
      await vendorOrder.save();

      // Sync specific main order return status if needed
      // For now, simpler to leave main order as 'Requested' or implement a check to see if all are Approved

      res.json(vendorOrder);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Process Refund for Vendor Order
// @route   POST /api/vendors/orders/:id/refund
// @access  Private/Vendor
router.post(
  "/orders/:id/refund",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const vendorOrder = await VendorOrder.findOne({
        _id: req.params.id,
        vendor: req.vendor._id,
      }).populate("order");

      if (!vendorOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (vendorOrder.returnStatus === "Completed") {
        return res.status(400).json({ message: "Already completed" });
      }

      // 1. Refund the User (Wallet or Razorpay)
      const User = require("../models/User");
      const user = await User.findById(vendorOrder.order.user);
      const paymentService = require("../services/paymentService");

      let refundType = "wallet";

      if (user) {
        // Check for Razorpay Refund
        // Ensure paymentMethod checks 'Online' or specific provider tag used in paymentRoutes
        const isOnlinePayment =
          vendorOrder.order.paymentMethod === "Online" ||
          vendorOrder.order.paymentMethod === "Razorpay";

        if (isOnlinePayment && vendorOrder.order.paymentResult?.id) {
          try {
            // Attempt Razorpay Refund
            await paymentService.refundPayment(
              vendorOrder.order.paymentResult.id,
              (vendorOrder.subtotal || 0) + (vendorOrder.tax || 0),
            );
            refundType = "razorpay";

            // Optional: Log this action if User model supports non-balance transactions
            // For now, we only update wallet if refundType is 'wallet'
          } catch (err) {
            console.error(
              "Razorpay Refund Failed, falling back to Wallet:",
              err,
            );
            refundType = "wallet";
          }
        }

        if (refundType === "wallet") {
          const refundAmount =
            (vendorOrder.subtotal || 0) + (vendorOrder.tax || 0);
          user.walletBalance = (user.walletBalance || 0) + refundAmount;
          user.walletTransactions.push({
            type: "refund",
            amount: refundAmount,
            description: `Refund for Order #${vendorOrder.order._id.toString().slice(-8)} (Inc. Tax)`,
            date: new Date(),
          });
          await user.save();
        }
      }

      // 2. Debit the Vendor (based on payment status)
      const vendor = await Vendor.findById(req.vendor._id);
      if (vendor) {
        // Initialize wallet if needed
        if (!vendor.wallet) {
          vendor.wallet = {
            balance: 0,
            pendingBalance: 0,
            totalEarnings: 0,
            totalCommissionPaid: 0,
            totalPayouts: 0,
            transactions: [],
          };
        }

        if (vendorOrder.payoutStatus === "completed") {
          // Order was already delivered and credited - deduct from balance
          // Allow negative balance
          vendor.wallet.balance =
            (vendor.wallet.balance || 0) - vendorOrder.netAmount;
          vendor.wallet.totalEarnings = Math.max(
            0,
            (vendor.wallet.totalEarnings || 0) - vendorOrder.netAmount,
          );
          // Refund commission as well
          vendor.wallet.totalCommissionPaid = Math.max(
            0,
            (vendor.wallet.totalCommissionPaid || 0) - vendorOrder.commission,
          );

          // Add refund debit transaction
          vendor.wallet.transactions.push({
            type: "refund_debit",
            amount: -vendorOrder.netAmount,
            description: `Refund Deduction for Order #${vendorOrder._id.toString().slice(-8)}`,
            orderId: vendorOrder._id,
            status: "completed",
            balanceAfter: vendor.wallet.balance,
          });
        } else {
          // Order was in pending - deduct from pending balance
          vendor.wallet.pendingBalance = Math.max(
            0,
            (vendor.wallet.pendingBalance || 0) - vendorOrder.netAmount,
          );

          // Add pending refund transaction
          vendor.wallet.transactions.push({
            type: "pending_cancelled",
            amount: -vendorOrder.netAmount,
            description: `Pending Order #${vendorOrder._id.toString().slice(-8)} refunded`,
            orderId: vendorOrder._id,
            status: "completed",
            balanceAfter: vendor.wallet.balance,
          });
        }

        // Update metrics
        vendor.metrics = vendor.metrics || {};
        vendor.metrics.refundedOrders =
          (vendor.metrics.refundedOrders || 0) + 1;

        await vendor.save();
      }

      // 3. Update Order Statuses
      vendorOrder.status = "returned"; // or 'refunded'
      vendorOrder.returnStatus = "Completed";
      vendorOrder.payoutStatus = "refunded"; // new status
      await vendorOrder.save();

      // Check if main order should also be marked refunded
      const Order = require("../models/Order");
      const mainOrder = await Order.findById(vendorOrder.order._id);
      if (mainOrder) {
        // Simple logic: if a sub-order is refunded, mark main as partial refund or fully refunded?
        // Let's mark main valid refund
        mainOrder.isRefunded = true;
        mainOrder.refundAmount =
          (mainOrder.refundAmount || 0) +
          vendorOrder.subtotal +
          (vendorOrder.tax || 0);
        mainOrder.refundDate = new Date();
        mainOrder.returnStatus = "Completed";
        mainOrder.status = "Returned";
        await mainOrder.save();
      }

      res.json({ message: "Refund processed successfully", vendorOrder });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
);

// ================== RETURNS ROUTES ==================

// @desc    Get vendor return requests
// @route   GET /api/vendors/returns
// @access  Private/Vendor
router.get("/returns", protectVendor, approvedVendor, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {
      vendor: req.vendor._id,
      returnStatus: { $ne: "None" }, // Only get orders with return requests
    };

    // Filter by specific return status if provided
    if (status) {
      query.returnStatus =
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    const returns = await VendorOrder.find(query)
      .populate("order")
      .populate("items.product")
      .sort({ returnRequestedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Transform data for frontend
    const formattedReturns = returns.map((ret) => ({
      _id: ret._id,
      orderId: ret.order?._id?.toString() || ret._id.toString(),
      productName: ret.items?.[0]?.name || "Multiple Items",
      reason: ret.returnReason || "No reason provided",
      status: ret.returnStatus?.toLowerCase() || "pending",
      customerComment: ret.customerNotes || "",
      createdAt: ret.returnRequestedAt || ret.updatedAt,
      subtotal: ret.subtotal,
      items: ret.items,
    }));

    res.json(formattedReturns);
  } catch (error) {
    console.error("Error fetching returns:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update vendor return status
// @route   PUT /api/vendors/returns/:id
// @access  Private/Vendor
router.put("/returns/:id", protectVendor, approvedVendor, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Validate status
    const validStatuses = [
      "Pending",
      "Approved",
      "Rejected",
      "Processing",
      "Completed",
      "Refunded",
    ];
    const normalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid return status" });
    }

    const vendorOrder = await VendorOrder.findOne({
      _id: req.params.id,
      vendor: req.vendor._id,
    });

    if (!vendorOrder) {
      return res.status(404).json({ message: "Return request not found" });
    }

    // deleted premature assignment

    // If completed or approved, update order status too
    if (
      normalizedStatus === "Completed" &&
      vendorOrder.returnStatus !== "Completed"
    ) {
      // --- FINANCIAL REFUND LOGIC START ---
      // 1. Refund the User
      let fullOrder = vendorOrder.order;
      if (!fullOrder.paymentMethod) {
        const Order = require("../models/Order");
        fullOrder = await Order.findById(vendorOrder.order);
      }

      const User = require("../models/User");
      // Fix: Use fullOrder.user (safe access), or fallback if somehow missing
      const user = fullOrder ? await User.findById(fullOrder.user) : null;

      // Calculate Refund Amount (Items + Tax)
      const refundAmount = (vendorOrder.subtotal || 0) + (vendorOrder.tax || 0);

      let refundType = "wallet";
      if (
        fullOrder &&
        (fullOrder.paymentMethod === "Online" ||
          fullOrder.paymentMethod === "Razorpay") &&
        fullOrder.paymentResult?.id
      ) {
        try {
          const paymentService = require("../services/paymentService");
          await paymentService.refundPayment(
            fullOrder.paymentResult.id,
            refundAmount,
          );
          refundType = "razorpay";
        } catch (err) {
          console.error(
            "Vendor Status Update Refund: Razorpay Refund Failed, falling back to Wallet:",
            err,
          );
          refundType = "wallet";
        }
      }

      if (user) {
        // Log Refund
        const RefundLog = require("../models/RefundLog");
        await RefundLog.create({
          order: fullOrder._id,
          vendorOrder: vendorOrder._id,
          user: user._id,
          initiatedBy: "Vendor",
          actorId: req.vendor._id,
          amount: refundAmount,
          deliveryCharge: 0, // Vendor orders typically don't carry the shipping charge in this context
          totalRefundableAmount: refundAmount,
          reason: "Vendor Processed Return",
          status: "Completed",
        });

        if (refundType === "wallet") {
          user.walletBalance = (user.walletBalance || 0) + refundAmount;
          if (!user.walletTransactions) user.walletTransactions = [];
          user.walletTransactions.push({
            type: "refund",
            amount: refundAmount,
            description: `Refund for Order #${fullOrder._id.toString().slice(-8)} (Vendor Completed)`,
            date: new Date(),
          });
          await user.save();
        }
      }

      // 2. Debit the Vendor
      const vendor = await Vendor.findById(req.vendor._id);
      if (vendor) {
        if (!vendor.wallet) {
          vendor.wallet = {
            balance: 0,
            pendingBalance: 0,
            totalEarnings: 0,
            totalCommissionPaid: 0,
            totalPayouts: 0,
            transactions: [],
          };
        }

        const deductionAmount =
          vendorOrder.netAmount ||
          vendorOrder.subtotal - vendorOrder.commission;

        if (vendorOrder.payoutStatus === "completed") {
          // Allow negative balance
          vendor.wallet.balance =
            (vendor.wallet.balance || 0) - deductionAmount;
          vendor.wallet.totalEarnings = Math.max(
            0,
            (vendor.wallet.totalEarnings || 0) - deductionAmount,
          );
          vendor.wallet.totalCommissionPaid = Math.max(
            0,
            (vendor.wallet.totalCommissionPaid || 0) - vendorOrder.commission,
          );

          vendor.wallet.transactions.push({
            type: "refund_debit",
            amount: -deductionAmount,
            description: `Refund Deduction for Order #${vendorOrder._id.toString().slice(-8)} (Vendor Status Update)`,
            orderId: vendorOrder._id,
            status: "completed",
            balanceAfter: vendor.wallet.balance,
          });
        } else {
          vendor.wallet.pendingBalance = Math.max(
            0,
            (vendor.wallet.pendingBalance || 0) - deductionAmount,
          );

          vendor.wallet.transactions.push({
            type: "pending_cancelled",
            amount: -deductionAmount,
            description: `Pending Order #${vendorOrder._id.toString().slice(-8)} refunded (Vendor Status Update)`,
            orderId: vendorOrder._id,
            status: "completed",
            balanceAfter: vendor.wallet.balance,
          });
        }

        // Update metrics
        vendor.metrics = vendor.metrics || {};
        vendor.metrics.refundedOrders =
          (vendor.metrics.refundedOrders || 0) + 1;
        // Deduct revenue and commission from metrics
        vendor.metrics.totalRevenue = Math.max(
          0,
          (vendor.metrics.totalRevenue || 0) - vendorOrder.subtotal,
        );
        vendor.metrics.totalCommission = Math.max(
          0,
          (vendor.metrics.totalCommission || 0) - vendorOrder.commission,
        );

        await vendor.save();
      }
      vendorOrder.payoutStatus = "refunded";
      // --- FINANCIAL REFUND LOGIC END ---

      vendorOrder.status = "returned";
    } else if (normalizedStatus === "Approved") {
      vendorOrder.status = "returned";
    }

    vendorOrder.returnStatus = normalizedStatus;
    await vendorOrder.save();

    // Sync to main order
    const Order = require("../models/Order");
    const mainOrder = await Order.findById(vendorOrder.order);
    if (mainOrder) {
      mainOrder.returnStatus = normalizedStatus;
      if (normalizedStatus === "Completed") {
        mainOrder.status = "Returned";
        mainOrder.isRefunded = true;
      }
      await mainOrder.save();
    }

    res.json({
      message: "Return status updated successfully",
      returnStatus: vendorOrder.returnStatus,
    });
  } catch (error) {
    console.error("Error updating return status:", error);
    res.status(500).json({ message: error.message });
  }
});

// ================== ANALYTICS ROUTES ==================

// @desc    Get vendor dashboard stats
// @route   GET /api/vendors/dashboard
// @access  Private/Vendor
router.get("/dashboard", protectVendor, approvedVendor, async (req, res) => {
  try {
    // Ensure vendorId is an ObjectId for aggregation queries
    const vendorId = new mongoose.Types.ObjectId(req.vendor._id);

    // Get order stats
    const orderStats = await VendorOrder.aggregate([
      {
        $match: {
          vendor: vendorId,
          status: { $nin: ["cancelled", "returned"] }, // Exclude cancelled/returned from stats
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commission" },
          netEarnings: { $sum: "$netAmount" },
        },
      },
    ]);

    // Get orders by status
    const ordersByStatus = await VendorOrder.aggregate([
      { $match: { vendor: vendorId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get recent orders
    const recentOrders = await VendorOrder.find({ vendor: vendorId })
      .populate("items.product")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get low stock items
    const vendor = await Vendor.findById(vendorId);
    const lowStockItems = vendor.inventory
      ? vendor.inventory.filter(
          (item) => item.stockQuantity <= item.reorderLevel && item.isActive,
        )
      : [];

    // Get monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await VendorOrder.aggregate([
      {
        $match: {
          vendor: vendorId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$netAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      stats: orderStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        netEarnings: 0,
      },
      ordersByStatus: ordersByStatus.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      recentOrders,
      lowStockItems,
      monthlyRevenue,
      vendor: {
        status: vendor.status,
        metrics: vendor.metrics || {},
        commissionRate: vendor.commissionRate,
        wallet: vendor.wallet || { balance: 0 },
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get vendor payout history
// @route   GET /api/vendors/payouts
// @access  Private/Vendor
router.get("/payouts", protectVendor, approvedVendor, async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.vendor._id);

    const payouts = await VendorOrder.find({
      vendor: vendorId,
      payoutStatus: { $in: ["processing", "completed"] },
    }).select(
      "subtotal commission netAmount payoutStatus payoutDate payoutReference createdAt",
    );

    const summary = await VendorOrder.aggregate([
      { $match: { vendor: vendorId } },
      {
        $group: {
          _id: "$payoutStatus",
          total: { $sum: "$netAmount" },
        },
      },
    ]);

    res.json({ payouts, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== WALLET ROUTES ==================

// @desc    Get wallet details
// @route   GET /api/vendors/wallet
// @access  Private/Vendor
router.get("/wallet", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id).select(
      "wallet subscription commissionRate",
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Initialize wallet if it doesn't exist
    if (!vendor.wallet) {
      vendor.wallet = {
        balance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalCommissionPaid: 0,
        totalPayouts: 0,
        transactions: [],
      };
      await vendor.save();
    }

    // Calculate ACTUAL pending balance from non-delivered/non-cancelled/non-returned orders
    // This ensures accuracy regardless of any legacy data issues
    const pendingOrders = await VendorOrder.find({
      vendor: req.vendor._id,
      status: { $nin: ["delivered", "cancelled", "returned"] },
    });
    const actualPendingBalance = pendingOrders.reduce(
      (sum, order) => sum + (order.netAmount || 0),
      0,
    );

    // If there's a mismatch, auto-fix the wallet
    if (vendor.wallet.pendingBalance !== actualPendingBalance) {
      console.log(
        `Auto-fixing pendingBalance for vendor ${req.vendor._id}: ${vendor.wallet.pendingBalance} -> ${actualPendingBalance}`,
      );
      vendor.wallet.pendingBalance = actualPendingBalance;
      await vendor.save();
    }

    // Get recent transactions (last 50)
    const transactions =
      vendor.wallet?.transactions?.slice(-50).reverse() || [];

    console.log(
      `Wallet request for vendor ${vendor._id}: ${transactions.length} transactions, pendingBalance: ${actualPendingBalance}`,
    );

    res.json({
      balance: vendor.wallet?.balance || 0,
      pendingBalance: actualPendingBalance,
      totalEarnings: vendor.wallet?.totalEarnings || 0,
      totalCommissionPaid: vendor.wallet?.totalCommissionPaid || 0,
      totalPayouts: vendor.wallet?.totalPayouts || 0,
      lastPayoutDate: vendor.wallet?.lastPayoutDate,
      commissionRate: vendor.commissionRate,
      transactions,
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Request payout
// @route   POST /api/vendors/wallet/payout
// @access  Private/Vendor (Approved)
router.post(
  "/wallet/payout",
  protectVendor,
  approvedVendor,
  async (req, res) => {
    try {
      const { amount } = req.body;
      const vendor = await Vendor.findById(req.vendor._id);

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid payout amount" });
      }

      if (amount > vendor.wallet.balance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Minimum payout check
      if (amount < 500) {
        return res
          .status(400)
          .json({ message: "Minimum payout amount is ₹500" });
      }

      // Check if bank details are complete
      if (!vendor.bankDetails?.accountNumber || !vendor.bankDetails?.ifscCode) {
        return res
          .status(400)
          .json({ message: "Please complete bank details first" });
      }

      // Deduct from balance
      vendor.wallet.balance -= amount;
      vendor.wallet.totalPayouts += amount;

      // Add transaction
      vendor.wallet.transactions.push({
        type: "payout",
        amount: -amount,
        description: `Payout requested to bank account ending ${vendor.bankDetails.accountNumber.slice(
          -4,
        )}`,
        status: "pending",
        balanceAfter: vendor.wallet.balance,
      });

      await vendor.save();

      res.json({
        message: "Payout request submitted successfully",
        newBalance: vendor.wallet.balance,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Get wallet transactions
// @route   GET /api/vendors/wallet/transactions
// @access  Private/Vendor
router.get("/wallet/transactions", protectVendor, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const vendor = await Vendor.findById(req.vendor._id).select(
      "wallet.transactions",
    );

    let transactions = vendor.wallet?.transactions || [];

    // Filter by type if specified
    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }

    // Sort by date descending and paginate
    transactions = transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((page - 1) * limit, page * limit);

    res.json({
      transactions,
      page: parseInt(page),
      total: vendor.wallet?.transactions?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== SHOP SETTINGS ROUTES ==================

// @desc    Get shop settings
// @route   GET /api/vendors/shop
// @access  Private/Vendor
router.get("/shop", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id).select(
      "shopSettings businessName logo",
    );
    res.json({
      ...vendor.shopSettings?.toObject(),
      businessName: vendor.businessName,
      defaultLogo: vendor.logo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update shop settings
// @route   PUT /api/vendors/shop
// @access  Private/Vendor (Approved)
router.put("/shop", protectVendor, approvedVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id);
    const {
      shopName,
      shopSlug,
      tagline,
      shopDescription,
      shopBanner,
      shopLogo,
      returnPolicy,
      shippingPolicy,
      minOrderValue,
      processingTime,
      socialLinks,
      isPublished,
    } = req.body;

    if (!vendor.shopSettings) {
      vendor.shopSettings = {};
    }

    if (shopName) {
      vendor.shopSettings.shopName = shopName;
    }

    // Handle custom slug or generate from shop name
    if (shopSlug) {
      // Check if slug is unique
      const existingVendor = await Vendor.findOne({
        "shopSettings.shopSlug": shopSlug,
        _id: { $ne: vendor._id },
      });
      if (existingVendor) {
        return res.status(400).json({ message: "Shop URL slug already taken" });
      }
      vendor.shopSettings.shopSlug = shopSlug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    } else if (shopName && !vendor.shopSettings.shopSlug) {
      // Generate slug from shop name if no slug exists
      vendor.shopSettings.shopSlug = shopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (tagline !== undefined) vendor.shopSettings.tagline = tagline;
    if (shopDescription !== undefined)
      vendor.shopSettings.shopDescription = shopDescription;
    if (shopBanner !== undefined) vendor.shopSettings.shopBanner = shopBanner;
    if (shopLogo !== undefined) vendor.shopSettings.shopLogo = shopLogo;
    if (returnPolicy !== undefined)
      vendor.shopSettings.returnPolicy = returnPolicy;
    if (shippingPolicy !== undefined)
      vendor.shopSettings.shippingPolicy = shippingPolicy;
    if (minOrderValue !== undefined)
      vendor.shopSettings.minOrderValue = minOrderValue;
    if (processingTime !== undefined)
      vendor.shopSettings.processingTime = processingTime;
    if (socialLinks) vendor.shopSettings.socialLinks = socialLinks;
    if (isPublished !== undefined)
      vendor.shopSettings.isPublished = isPublished;

    await vendor.save();
    res.json(vendor.shopSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== SUBSCRIPTION ROUTES ==================

// @desc    Get subscription plans
// @route   GET /api/vendors/plans
// @access  Public
router.get("/plans", async (req, res) => {
  try {
    const { vendorPlans } = require("../config/vendorPlans");
    res.json(vendorPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get current subscription
// @route   GET /api/vendors/subscription
// @access  Private/Vendor
router.get("/subscription", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id).select(
      "subscription commissionRate",
    );
    const { vendorPlans } = require("../config/vendorPlans");

    const currentPlan = vendor.subscription?.plan || "starter";
    const planDetails = vendorPlans[currentPlan];

    res.json({
      currentPlan,
      planDetails,
      subscription: vendor.subscription,
      commissionRate: vendor.commissionRate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const Notification = require("../models/Notification");

// @desc    Select/Upgrade subscription plan
// @route   POST /api/vendors/subscription
// @access  Private/Vendor
router.post("/subscription", protectVendor, async (req, res) => {
  try {
    const { plan, billingCycle = "monthly" } = req.body;
    const { vendorPlans, getCommissionRate } = require("../config/vendorPlans");

    if (!vendorPlans[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const vendor = await Vendor.findById(req.vendor._id);
    const planDetails = vendorPlans[plan];

    const planLevels = { starter: 0, professional: 1, enterprise: 2 };
    const currentLevel = planLevels[vendor.subscription?.plan || "starter"];
    const newLevel = planLevels[plan];

    // Downgrade Logic
    if (
      newLevel < currentLevel &&
      vendor.subscription?.isActive &&
      vendor.subscription?.endDate > new Date()
    ) {
      vendor.subscription.upcomingPlan = plan;
      vendor.subscription.upcomingPlanDate = vendor.subscription.endDate;
      vendor.subscription.autoRenew = false;

      await vendor.save();

      // Notify
      await Notification.create({
        recipient: vendor._id,
        recipientModel: "Vendor",
        type: "info",
        title: "Plan Downgrade Scheduled",
        message: `Your plan will be downgraded to ${planDetails.name} on ${new Date(vendor.subscription.endDate).toLocaleDateString()}.`,
      });

      return res.json({
        message: `Plan change to ${planDetails.name} scheduled for ${new Date(vendor.subscription.endDate).toLocaleDateString()}`,
        subscription: vendor.subscription,
        commissionRate: vendor.commissionRate,
      });
    }

    // Upgrade
    const price =
      billingCycle === "yearly"
        ? planDetails.priceYearly
        : planDetails.priceMonthly;

    if (plan === "starter") {
      vendor.subscription = {
        plan: "starter",
        startDate: new Date(),
        endDate: null,
        isActive: true,
        autoRenew: false,
        upcomingPlan: undefined,
        upcomingPlanDate: undefined,
      };
      vendor.commissionRate = getCommissionRate("starter");
      await vendor.save();

      await Notification.create({
        recipient: vendor._id,
        recipientModel: "Vendor",
        type: "success",
        title: "Starter Plan Activated",
        message: `You have successfully switched to the Starter plan.`,
      });

      return res.json({
        message: "Starter plan activated",
        subscription: vendor.subscription,
        commissionRate: vendor.commissionRate,
      });
    }

    const endDate = new Date(
      Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000,
    );

    vendor.subscription = {
      plan,
      startDate: new Date(),
      endDate: endDate,
      isActive: true,
      autoRenew: true,
      upcomingPlan: undefined,
      upcomingPlanDate: undefined,
      paymentHistory: [
        ...(vendor.subscription?.paymentHistory || []),
        {
          amount: price,
          paymentDate: new Date(),
          paymentMethod: "card",
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: "completed",
        },
      ],
    };
    vendor.commissionRate = getCommissionRate(plan);

    await vendor.save();

    await Notification.create({
      recipient: vendor._id,
      recipientModel: "Vendor",
      type: "success",
      title: "Plan Upgraded!",
      message: `Welcome to the ${planDetails.name} plan. You have been charged ₹${price}.`,
    });

    res.json({
      message: `${planDetails.name} plan activated successfully!`,
      subscription: vendor.subscription,
      commissionRate: vendor.commissionRate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== PUBLIC VENDOR SHOP ROUTES ==================

// @desc    Get public vendor shop
// @route   GET /api/vendors/shop/:slugOrId
// @access  Public
router.get(
  "/shop/:slugOrId",
  cacheByIdMiddleware(vendorCache, "vendor:shop"),
  async (req, res) => {
    try {
      const { slugOrId } = req.params;
      let vendor;

      // Check if it's a MongoDB ObjectId (24 hex characters)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);

      if (isObjectId) {
        // Search by vendor ID - allow any approved vendor even if shop not published
        try {
          vendor = await Vendor.findById(slugOrId)
            .select("businessName shopSettings logo metrics status")
            .lean();
        } catch (err) {
          // Invalid ObjectId format
          console.error("Invalid ObjectId:", slugOrId);
        }

        // If vendor exists but not approved, return specific error
        if (vendor && vendor.status !== "approved") {
          return res.status(403).json({
            message: "This vendor is pending approval",
            status: vendor.status,
          });
        }
      } else {
        // Search by shop slug - require published
        vendor = await Vendor.findOne({
          "shopSettings.shopSlug": slugOrId,
          status: "approved",
          "shopSettings.isPublished": true,
        })
          .select("businessName shopSettings logo metrics status")
          .lean();
      }

      if (!vendor) {
        // Try one more search - maybe the slug exists but shop isn't published
        if (!isObjectId) {
          const unpublishedVendor = await Vendor.findOne({
            "shopSettings.shopSlug": slugOrId,
            status: "approved",
          })
            .select("businessName shopSettings")
            .lean();

          if (unpublishedVendor) {
            return res.status(403).json({
              message: "This shop is not published yet",
              shopName: unpublishedVendor.businessName,
            });
          }
        }

        return res.status(404).json({ message: "Shop not found" });
      }

      // Get vendor products - include products pending approval if searching by ID
      const productQuery = {
        vendor: vendor._id,
        isVendorProduct: true,
      };

      // If searching by slug (public shop), only show approved products
      // If searching by ID, show all active products (vendor may not have published shop yet)
      if (!isObjectId) {
        productQuery.vendorStatus = "approved";
        productQuery.isActive = true;
      } else {
        // For ID-based lookup, show all products that are active
        productQuery.isActive = { $ne: false };
      }

      const products = await Product.find(productQuery)
        .select(
          "name slug description price images category rating numReviews vendorStatus",
        )
        .lean();

      res.json({
        shop: {
          id: vendor._id,
          name: vendor.shopSettings?.shopName || vendor.businessName,
          slug: vendor.shopSettings?.shopSlug || vendor._id.toString(),
          tagline: vendor.shopSettings?.tagline,
          description: vendor.shopSettings?.shopDescription,
          banner: vendor.shopSettings?.shopBanner,
          logo: vendor.shopSettings?.shopLogo || vendor.logo,
          returnPolicy: vendor.shopSettings?.returnPolicy,
          shippingPolicy: vendor.shopSettings?.shippingPolicy,
          processingTime: vendor.shopSettings?.processingTime,
          socialLinks: vendor.shopSettings?.socialLinks,
          rating: vendor.metrics?.averageRating || 0,
          totalReviews: vendor.metrics?.totalReviews || 0,
          totalOrders: vendor.metrics?.completedOrders || 0,
          isPublished: vendor.shopSettings?.isPublished || false,
        },
        products,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
