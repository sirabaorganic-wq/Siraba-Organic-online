const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const VendorOrder = require("../models/VendorOrder");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");
const RefundLog = require("../models/RefundLog");
const { invalidateCache } = require("../config/cache");

// ================== VENDOR MANAGEMENT ==================

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private/Admin
router.get("/vendors", protect, admin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
      ];
    }

    const vendors = await Vendor.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(query);

    res.json({
      vendors,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single vendor details
// @route   GET /api/admin/vendors/:id
// @access  Private/Admin
router.get("/vendors/:id", protect, admin, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .select("-password")
      .populate("inventory.product")
      .populate("approvedBy", "name email")
      .populate("complianceDocuments.reviewedBy", "name email");

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Get vendor orders summary
    const orderStats = await VendorOrder.aggregate([
      { $match: { vendor: vendor._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$subtotal" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      vendor,
      orderStats: orderStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        completedOrders: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update vendor status (approve/reject/suspend)
// @route   PUT /api/admin/vendors/:id/status
// @access  Private/Admin
router.put("/vendors/:id/status", protect, admin, async (req, res) => {
  try {
    const { status, rejectionReason, adminNote } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.status = status;

    if (status === "approved") {
      vendor.approvedBy = req.user._id;
      vendor.approvedAt = new Date();
    } else if (status === "rejected") {
      vendor.rejectionReason = rejectionReason;
    }

    if (adminNote) {
      vendor.adminNotes.push({
        note: adminNote,
        addedBy: req.user._id,
      });
    }

    await vendor.save();

    // Clear vendor cache when status is updated
    invalidateCache.vendors();

    // Send email notification (placeholder) and DB notification
    const Notification = require("../models/Notification");
    let notifyType = "info";
    let notifyTitle = "Status Update";
    let notifyMessage = `Your vendor account status has been updated to ${status}.`;

    if (status === "approved") {
      notifyType = "success";
      notifyTitle = "Account Approved!";
      notifyMessage =
        "Congratulations! Your vendor account has been approved. You can now log in and start selling.";
    } else if (status === "rejected") {
      notifyType = "error";
      notifyTitle = "Account Rejected";
      notifyMessage = `Your account application was rejected. Reason: ${rejectionReason || "Not specified"}`;
    } else if (status === "suspended") {
      notifyType = "warning";
      notifyTitle = "Account Suspended";
      notifyMessage = "Your account has been suspended by the administrator.";
    }

    try {
      await Notification.create({
        recipient: vendor._id,
        recipientModel: "Vendor",
        type: notifyType,
        title: notifyTitle,
        message: notifyMessage,
      });
    } catch (err) {
      console.error("Failed to create notification", err);
    }

    res.json({
      _id: vendor._id,
      status: vendor.status,
      message: `Vendor ${status} successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Review compliance document
// @route   PUT /api/admin/vendors/:id/compliance/:docId
// @access  Private/Admin
router.put(
  "/vendors/:id/compliance/:docId",
  protect,
  admin,
  async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const vendor = await Vendor.findById(req.params.id);

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      const doc = vendor.complianceDocuments.id(req.params.docId);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      doc.status = status;
      doc.reviewedBy = req.user._id;
      doc.reviewedAt = new Date();
      if (rejectionReason) doc.rejectionReason = rejectionReason;

      await vendor.save();
      res.json(doc);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// @desc    Update vendor commission rate
// @route   PUT /api/admin/vendors/:id/commission
// @access  Private/Admin
router.put("/vendors/:id/commission", protect, admin, async (req, res) => {
  try {
    const { commissionRate, pricingTier } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (commissionRate !== undefined) vendor.commissionRate = commissionRate;
    if (pricingTier) vendor.pricingTier = pricingTier;

    await vendor.save();
    res.json({
      commissionRate: vendor.commissionRate,
      pricingTier: vendor.pricingTier,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update vendor allowed categories
// @route   PUT /api/admin/vendors/:id/categories
// @access  Private/Admin
router.put("/vendors/:id/categories", protect, admin, async (req, res) => {
  try {
    const { categories } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.allowedCategories = categories;
    await vendor.save();
    res.json({ allowedCategories: vendor.allowedCategories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add admin note to vendor
// @route   POST /api/admin/vendors/:id/notes
// @access  Private/Admin
router.post("/vendors/:id/notes", protect, admin, async (req, res) => {
  try {
    const { note } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.adminNotes.push({
      note,
      addedBy: req.user._id,
    });

    await vendor.save();
    res.json(vendor.adminNotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== ANALYTICS & REPORTS ==================

// @desc    Get vendor analytics overview
// @route   GET /api/admin/analytics/vendors
// @access  Private/Admin
router.get("/analytics/vendors", protect, admin, async (req, res) => {
  try {
    // Vendor count by status
    const vendorsByStatus = await Vendor.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Total vendors
    const totalVendors = await Vendor.countDocuments();

    // New vendors this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newVendorsThisMonth = await Vendor.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Top performing vendors
    const topVendors = await VendorOrder.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: "$vendor",
          totalRevenue: { $sum: "$subtotal" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },
      {
        $project: {
          vendorId: "$_id",
          businessName: "$vendor.businessName",
          totalRevenue: 1,
          orderCount: 1,
        },
      },
    ]);

    // Revenue from vendors (Commissions from Completed Orders)
    const vendorRevenue = await VendorOrder.aggregate([
      {
        $match: {
          status: "delivered", // Only count commission for fulfilled orders
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subtotal" },
          totalCommission: { $sum: "$commission" },
        },
      },
    ]);

    res.json({
      totalVendors,
      newVendorsThisMonth,
      vendorsByStatus: vendorsByStatus.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      topVendors,
      vendorRevenue: vendorRevenue[0] || {
        totalRevenue: 0,
        totalCommission: 0,
      },
      adminEarnings: vendorRevenue[0]?.totalCommission || 0, // Deprecated calculation, see below
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get comprehensive platform analytics
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
router.get("/analytics/overview", protect, admin, async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Orders analytics
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const totalOrders = await Order.countDocuments();

    // Revenue analytics (Net Revenue - Excludes Cancelled)
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["Cancelled", "cancelled"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          avgOrderValue: { $avg: "$totalPrice" },
        },
      },
    ]);

    // Gross Revenue (All orders except Cancelled)
    const grossRevenueStats = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["Cancelled", "cancelled"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalGrossRevenue = grossRevenueStats[0]?.total || 0;

    // Total Refunds (Source of Truth: RefundLogs)
    const refundStats = await RefundLog.aggregate([
      { $match: { status: "Completed" } }, // Only count completed refunds
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRefunds = refundStats[0]?.total || 0;

    // Total Vendor Payouts
    const payoutStats = await Vendor.aggregate([
      { $group: { _id: null, total: { $sum: "$wallet.totalPayouts" } } },
    ]);
    const totalPayouts = payoutStats[0]?.total || 0;

    // Admin Balance Calculation (Cash Balance)
    // Money In (Gross) - Money Out (Refunds) - Money Out (Payouts to Vendors)
    const adminCashBalance = totalGrossRevenue - totalRefunds - totalPayouts;

    const monthlyRevenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $nin: ["Cancelled", "Returned", "Refunded"] },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    // User analytics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Product analytics
    const totalProducts = await Product.countDocuments();

    // Vendor analytics
    const totalVendors = await Vendor.countDocuments();
    const pendingApprovals = await Vendor.countDocuments({ status: "pending" });
    const underReview = await Vendor.countDocuments({ status: "under_review" });

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Top selling products - exclude cancelled orders
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["Cancelled", "Returned", "Refunded"] },
        },
      },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          name: { $first: "$orderItems.name" },
          totalSold: { $sum: "$orderItems.quantity" },
          revenue: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // Monthly trends (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $nin: ["Cancelled", "Returned", "Refunded"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Escrow analytics (Pending balances)
    const escrowStats = await Vendor.aggregate([
      {
        $group: {
          _id: null,
          totalEscrow: { $sum: "$wallet.pendingBalance" },
        },
      },
    ]);
    const totalEscrowAmount = escrowStats[0]?.totalEscrow || 0;

    res.json({
      orders: {
        today: ordersToday,
        thisMonth: ordersThisMonth,
        total: totalOrders,
        byStatus: ordersByStatus.reduce(
          (acc, item) => ({ ...acc, [item._id]: item.count }),
          {},
        ),
      },
      revenue: {
        total: revenueStats[0]?.totalRevenue || 0,
        thisMonth: monthlyRevenueStats[0]?.revenue || 0,
        avgOrderValue: revenueStats[0]?.avgOrderValue || 0,
        escrow: totalEscrowAmount,
        gross: totalGrossRevenue,
        refunds: totalRefunds,
        payouts: totalPayouts,
        adminBalance: adminCashBalance,
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      products: {
        total: totalProducts,
        topSelling: topProducts,
      },
      vendors: {
        total: totalVendors,
        pendingApprovals,
        underReview,
      },
      trends: {
        monthly: monthlyTrends,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== PRICING MANAGEMENT ==================

// @desc    Get pricing tiers
// @route   GET /api/admin/pricing
// @access  Private/Admin
router.get("/pricing", protect, admin, async (req, res) => {
  try {
    // In a real app, this would come from a PricingTier model
    const pricingTiers = {
      standard: {
        name: "Standard",
        commissionRate: 15,
        features: ["Basic dashboard", "Standard support", "Monthly payouts"],
      },
      premium: {
        name: "Premium",
        commissionRate: 10,
        features: [
          "Advanced analytics",
          "Priority support",
          "Weekly payouts",
          "Featured listings",
        ],
      },
      enterprise: {
        name: "Enterprise",
        commissionRate: 5,
        features: [
          "Custom analytics",
          "Dedicated support",
          "Daily payouts",
          "Premium placement",
          "Custom branding",
        ],
      },
    };

    res.json(pricingTiers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== APPROVALS ==================

// @desc    Get pending approvals
// @route   GET /api/admin/approvals
// @access  Private/Admin
router.get("/approvals", protect, admin, async (req, res) => {
  try {
    // Pending vendor approvals
    const pendingVendors = await Vendor.find({
      status: { $in: ["pending", "under_review"] },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    // Pending document reviews
    const vendorsWithPendingDocs = await Vendor.find({
      "complianceDocuments.status": "pending",
    })
      .select("businessName email complianceDocuments")
      .lean();

    const pendingDocuments = vendorsWithPendingDocs.flatMap((vendor) =>
      vendor.complianceDocuments
        .filter((doc) => doc.status === "pending")
        .map((doc) => ({
          ...doc,
          vendorId: vendor._id,
          vendorName: vendor.businessName,
          vendorEmail: vendor.email,
        })),
    );

    res.json({
      vendors: pendingVendors,
      documents: pendingDocuments,
      counts: {
        vendors: pendingVendors.length,
        documents: pendingDocuments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== VENDOR ORDERS MANAGEMENT ==================

// @desc    Get all vendor orders (admin view)
// @route   GET /api/admin/vendor-orders
// @access  Private/Admin
router.get("/vendor-orders", protect, admin, async (req, res) => {
  try {
    const { status, vendorId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (vendorId) query.vendor = vendorId;

    const orders = await VendorOrder.find(query)
      .populate("vendor", "businessName email")
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

// @desc    Process vendor payout
// @route   PUT /api/admin/vendor-orders/:id/payout
// @access  Private/Admin
router.put("/vendor-orders/:id/payout", protect, admin, async (req, res) => {
  try {
    const { payoutStatus, payoutReference } = req.body;
    const order = await VendorOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.payoutStatus = payoutStatus;
    if (payoutStatus === "completed") {
      order.payoutDate = new Date();
      order.payoutReference = payoutReference;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== VENDOR PRODUCTS APPROVAL ==================

// @desc    Get vendor products pending approval
// @route   GET /api/admin/vendor-products
// @access  Private/Admin
router.get("/vendor-products", protect, admin, async (req, res) => {
  try {
    const query = { isVendorProduct: true };
    // If status is passed as query param (even empty), use it logic. If completely undefined, default to pending?
    // Actually the destructuring `status = "pending"` forces a default.
    // Let's remove default from destructuring and handle logic manually.

    // Original line was: const { status = "pending", page = 1, limit = 20, vendorId } = req.query;

    // New logic:
    const { status, page = 1, limit = 20, vendorId } = req.query;

    if (status !== undefined && status !== "") {
      query.vendorStatus = status;
    } else if (status === undefined) {
      // Default behavior if parameter not provided at all
      query.vendorStatus = "pending";
    }
    // If status === "" (empty string), we do NOT add vendorStatus to query, thus fetching all.

    if (vendorId) query.vendor = vendorId;

    const products = await Product.find(query)
      .populate("vendor", "businessName email contactPerson")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    // Count by status
    const counts = {
      pending: await Product.countDocuments({
        isVendorProduct: true,
        vendorStatus: "pending",
      }),
      approved: await Product.countDocuments({
        isVendorProduct: true,
        vendorStatus: "approved",
      }),
      rejected: await Product.countDocuments({
        isVendorProduct: true,
        vendorStatus: "rejected",
      }),
    };

    res.json({
      products,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      counts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve/Reject vendor product
// @route   PUT /api/admin/vendor-products/:productId
// @access  Private/Admin
router.put("/vendor-products/:productId", protect, admin, async (req, res) => {
  try {
    const { vendorStatus, rejectionReason } = req.body;

    const product = await Product.findOne({
      _id: req.params.productId,
      isVendorProduct: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.vendorStatus = vendorStatus;
    if (vendorStatus === "rejected" && rejectionReason) {
      product.vendorRejectionReason = rejectionReason;
    } else {
      product.vendorRejectionReason = "";
    }

    await product.save();

    // Clear caches when product status is updated
    invalidateCache.products();
    invalidateCache.vendors();

    const updatedProduct = await Product.findById(product._id).populate(
      "vendor",
      "businessName email contactPerson",
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================== PAYOUT MANAGEMENT ==================

// @desc    Get all pending payouts
// @route   GET /api/admin/payouts
// @access  Private/Admin
router.get("/payouts", protect, admin, async (req, res) => {
  try {
    const vendors = await Vendor.find({
      "wallet.transactions": {
        $elemMatch: { type: "payout", status: "pending" },
      },
    }).select("businessName bankDetails wallet.transactions email");

    const payouts = [];
    vendors.forEach((vendor) => {
      vendor.wallet.transactions.forEach((txn) => {
        if (txn.type === "payout" && txn.status === "pending") {
          payouts.push({
            _id: txn._id,
            vendorId: vendor._id,
            businessName: vendor.businessName,
            email: vendor.email,
            amount: Math.abs(txn.amount),
            date: txn.createdAt,
            bankDetails: vendor.bankDetails,
          });
        }
      });
    });

    // Sort by date (oldest first)
    payouts.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve/Reject payout
// @route   PUT /api/admin/payouts/:vendorId/:transactionId
// @access  Private/Admin
router.put(
  "/payouts/:vendorId/:transactionId",
  protect,
  admin,
  async (req, res) => {
    try {
      const { status, note } = req.body; // status: 'completed' or 'rejected'
      const vendor = await Vendor.findById(req.params.vendorId);

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      const transaction = vendor.wallet.transactions.id(
        req.params.transactionId,
      );

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.type !== "payout") {
        return res
          .status(400)
          .json({ message: "This is not a payout transaction" });
      }

      if (transaction.status !== "pending") {
        return res
          .status(400)
          .json({ message: `Transaction is already ${transaction.status}` });
      }

      const payoutAmount = Math.abs(transaction.amount);

      if (status === "completed") {
        // Approve the payout
        transaction.status = "completed";
        if (note) transaction.description += ` | Admin Note: ${note}`;
        vendor.wallet.lastPayoutDate = new Date();

        // Create notification
        const Notification = require("../models/Notification");
        await Notification.create({
          recipient: vendor._id,
          recipientModel: "Vendor",
          type: "success",
          title: "Payout Approved",
          message: `Your payout of ₹${payoutAmount} has been approved and will be transferred to your bank account within 3-5 business days.`,
        });
      } else if (status === "rejected" || status === "failed") {
        // Reject the payout and refund
        transaction.status = "failed"; // Must use 'failed' to match schema enum
        if (note) transaction.description += ` | Admin Note: ${note}`;

        vendor.wallet.balance += payoutAmount;
        vendor.wallet.totalPayouts -= payoutAmount;

        // Add refund transaction
        vendor.wallet.transactions.push({
          type: "adjustment",
          amount: payoutAmount,
          description: `Refund for rejected payout #${req.params.transactionId.slice(-6)}${note ? ` - ${note}` : ""}`,
          status: "completed",
          balanceAfter: vendor.wallet.balance,
        });

        // Create notification
        const Notification = require("../models/Notification");
        await Notification.create({
          recipient: vendor._id,
          recipientModel: "Vendor",
          type: "warning",
          title: "Payout Rejected",
          message: `Your payout request of ₹${payoutAmount} has been rejected.${note ? ` Reason: ${note}` : ""} The amount has been refunded to your wallet.`,
        });
      } else {
        return res.status(400).json({ message: "Invalid status value" });
      }

      await vendor.save();
      res.json({ message: "Payout updated successfully", transaction });
    } catch (error) {
      console.error("Payout update error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

// ================== RETURNS MANAGEMENT ==================

// @desc    Get all return requests (admin view)
// @route   GET /api/admin/returns
// @access  Private/Admin
router.get("/returns", protect, admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {
      returnStatus: { $ne: "None" },
    };

    // Filter by specific return status if provided
    if (status) {
      query.returnStatus =
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    const returns = await VendorOrder.find(query)
      .populate("vendor", "businessName email")
      .populate("order", "user shippingAddress")
      .populate("items.product")
      .sort({ returnRequestedAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await VendorOrder.countDocuments(query);

    // Count by status
    const counts = {
      requested: await VendorOrder.countDocuments({
        returnStatus: "Requested",
      }),
      approved: await VendorOrder.countDocuments({ returnStatus: "Approved" }),
      rejected: await VendorOrder.countDocuments({ returnStatus: "Rejected" }),
      returned: await VendorOrder.countDocuments({ returnStatus: "Returned" }),
      refunded: await VendorOrder.countDocuments({ returnStatus: "Refunded" }),
    };

    // Transform data for frontend
    const formattedReturns = returns.map((ret) => ({
      _id: ret._id,
      orderId: ret.order?._id?.toString() || ret._id.toString(),
      vendorName: ret.vendor?.businessName || "Unknown Vendor",
      vendorEmail: ret.vendor?.email || "",
      productName: ret.items?.[0]?.name || "Multiple Items",
      itemCount: ret.items?.length || 0,
      reason: ret.returnReason || "No reason provided",
      status: ret.returnStatus,
      customerComment: ret.customerNotes || "",
      createdAt: ret.returnRequestedAt || ret.updatedAt,
      subtotal: ret.subtotal,
      items: ret.items,
      shippingAddress: ret.shippingAddress,
    }));

    res.json({
      returns: formattedReturns,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      counts,
    });
  } catch (error) {
    console.error("Error fetching returns:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update return status (admin)
// @route   PUT /api/admin/returns/:id
// @access  Private/Admin
router.put("/returns/:id", protect, admin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    // Validate status
    const validStatuses = [
      "Requested",
      "Approved",
      "Rejected",
      "Returned",
      "Refunded",
      "Completed",
    ];
    const normalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid return status" });
    }

    const vendorOrder = await VendorOrder.findById(req.params.id);

    if (!vendorOrder) {
      return res.status(404).json({ message: "Return request not found" });
    }

    // If status is Completed, process the financial refund
    if (
      normalizedStatus === "Completed" &&
      vendorOrder.returnStatus !== "Completed"
    ) {
      // 1. Refund the User
      // We need to fetch the FULL order if not populated properly to check payment method
      let fullOrder = vendorOrder.order;
      if (!fullOrder.paymentMethod) {
        fullOrder = await Order.findById(vendorOrder.order);
      }

      const User = require("../models/User");
      // Fix: Use fullOrder.user to ensure we get the correct User ID
      const user = fullOrder ? await User.findById(fullOrder.user) : null;

      let refundType = "wallet";
      // Check online payment for potential source refund
      if (
        fullOrder &&
        (fullOrder.paymentMethod === "Online" ||
          fullOrder.paymentMethod === "Razorpay") &&
        fullOrder.paymentResult?.id
      ) {
        try {
          const paymentService = require("../services/paymentService");
          // Attempt Razorpay Refund
          await paymentService.refundPayment(
            fullOrder.paymentResult.id,
            vendorOrder.subtotal,
          );
          refundType = "razorpay";
        } catch (err) {
          console.error(
            "Admin Refund: Razorpay Refund Failed, falling back to Wallet:",
            err,
          );
          refundType = "wallet";
        }
      }

      if (user && refundType === "wallet") {
        user.walletBalance = (user.walletBalance || 0) + vendorOrder.subtotal;
        if (!user.walletTransactions) user.walletTransactions = [];
        user.walletTransactions.push({
          type: "refund",
          amount: vendorOrder.subtotal,
          description: `Refund for Order #${fullOrder._id.toString().slice(-8)} (Admin Processed)`,
          date: new Date(),
        });
        await user.save();
      }

      // 2. Debit the Vendor
      const vendor = await Vendor.findById(vendorOrder.vendor);
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
          // Money was already added to available balance
          vendor.wallet.balance = Math.max(
            0,
            (vendor.wallet.balance || 0) - deductionAmount,
          );
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
            amount: deductionAmount,
            description: `Refund Deduction for Order #${vendorOrder._id.toString().slice(-8)} (Admin)`,
            orderId: vendorOrder._id,
            status: "completed",
            balanceAfter: vendor.wallet.balance,
          });
        } else {
          // Money matches pending
          vendor.wallet.pendingBalance = Math.max(
            0,
            (vendor.wallet.pendingBalance || 0) - deductionAmount,
          );

          vendor.wallet.transactions.push({
            type: "pending_cancelled",
            amount: deductionAmount,
            description: `Pending Order #${vendorOrder._id.toString().slice(-8)} refunded (Admin)`,
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

      // Update vendorOrder payout status
      vendorOrder.payoutStatus = "refunded";
    }

    vendorOrder.returnStatus = normalizedStatus;

    // If approved/completed, update order status too
    if (
      normalizedStatus === "Returned" ||
      normalizedStatus === "Approved" ||
      normalizedStatus === "Refunded" ||
      normalizedStatus === "Completed"
    ) {
      vendorOrder.status = "returned";
    }

    await vendorOrder.save();

    // Sync to main order
    const mainOrder = await Order.findById(
      vendorOrder.order._id || vendorOrder.order,
    );
    if (mainOrder) {
      if (normalizedStatus === "Completed") {
        mainOrder.isRefunded = true;
        mainOrder.refundAmount =
          (mainOrder.refundAmount || 0) + vendorOrder.subtotal;
        mainOrder.returnStatus = "Completed";
        mainOrder.status = "Returned";
      } else {
        mainOrder.returnStatus = normalizedStatus;
      }
      await mainOrder.save();
    }

    // Create notification for vendor
    const Notification = require("../models/Notification");
    await Notification.create({
      recipient: vendorOrder.vendor,
      recipientModel: "Vendor",
      type:
        normalizedStatus === "Approved"
          ? "success"
          : normalizedStatus === "Rejected"
            ? "warning"
            : "info",
      title: "Return Status Updated",
      message: `Return request for order #${vendorOrder._id.toString().slice(-8)} has been ${normalizedStatus.toLowerCase()}.${adminNote ? ` Note: ${adminNote}` : ""}`,
    });

    res.json({
      message: "Return status updated successfully",
      returnStatus: vendorOrder.returnStatus,
    });
  } catch (error) {
    console.error("Error updating return status:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
