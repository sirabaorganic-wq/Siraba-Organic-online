const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const VendorOrder = require("../models/VendorOrder");
const Vendor = require("../models/Vendor");
const { protect, admin } = require("../middleware/authMiddleware");
const { invalidateCache } = require("../config/cache");

// Helper function to get commission rate based on vendor's plan
const getCommissionRate = (plan) => {
  const rates = {
    starter: 15,
    professional: 10,
    enterprise: 5,
  };
  return rates[plan] || 15;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post("/", protect, async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    couponCode,
    discountAmount,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }

  try {
    // Handle Coupon Logic
    if (couponCode) {
      const Coupon = require("../models/Coupon");
      const coupon = await Coupon.findOne({ code: couponCode });

      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ message: "Coupon is inactive" });
      }

      if (coupon.expiryDate && new Date() > coupon.expiryDate) {
        return res.status(400).json({ message: "Coupon has expired" });
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      if (
        coupon.assignedTo &&
        coupon.assignedTo.toString() !== req.user._id.toString()
      ) {
        return res
          .status(400)
          .json({ message: "Coupon not valid for this user" });
      }

      // Apply usage
      coupon.usedCount += 1;
      await coupon.save();
    }

    // GST Logic
    const GSTSettings = require("../models/GSTSettings");
    const gstSettings = await GSTSettings.getInstance();

    let gstClaimed = false;
    let buyerGstNumber = null;
    // Always capture seller GST if it exists in settings, regardless of enabled status
    let sellerGstNumber = gstSettings.admin_gst_number || null;

    // Check request body first (from Checkout), then fallback to User Profile
    if (gstSettings.gst_enabled) {
      if (req.body.gstClaimed) {
        gstClaimed = true;
        buyerGstNumber = req.body.buyerGstNumber || req.user.user_gst_number;
      } else if (req.user.claim_gst) {
        gstClaimed = true;
        buyerGstNumber = req.user.user_gst_number;
      }
    }

    // Create the main order
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      couponCode,
      discountAmount,
      gstClaimed,
      buyerGstNumber,
      sellerGstNumber,
    });

    const createdOrder = await order.save();

    // Clear caches when new order is created
    invalidateCache.orders();
    invalidateCache.vendors();

    // ===== CREATE VENDOR ORDERS FOR VENDOR PRODUCTS =====
    // Get product details to check which ones are vendor products
    const productIds = orderItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).populate(
      "vendor",
    );

    // Group items by vendor
    const vendorItemsMap = new Map();

    for (const item of orderItems) {
      const product = products.find(
        (p) => p._id.toString() === item.product.toString(),
      );

      if (product && product.isVendorProduct && product.vendor) {
        const vendorId = product.vendor._id.toString();

        if (!vendorItemsMap.has(vendorId)) {
          vendorItemsMap.set(vendorId, {
            vendor: product.vendor,
            items: [],
            subtotal: 0,
          });
        }

        const vendorData = vendorItemsMap.get(vendorId);
        vendorData.items.push({
          product: product._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          sku: product.sku || "",
        });
        vendorData.subtotal += item.price * item.quantity;
      }
    }

    // Create VendorOrder for each vendor
    const vendorOrders = [];
    for (const [vendorId, vendorData] of vendorItemsMap) {
      const vendor = await Vendor.findById(vendorId);
      const commissionRate = getCommissionRate(
        vendor?.subscription?.plan || "starter",
      );
      const commission = (vendorData.subtotal * commissionRate) / 100;
      const netAmount = vendorData.subtotal - commission;

      const vendorTax =
        itemsPrice > 0
          ? (vendorData.subtotal / itemsPrice) * (taxPrice || 0)
          : 0;

      const vendorOrder = new VendorOrder({
        order: createdOrder._id,
        vendor: vendorId,
        items: vendorData.items,
        subtotal: vendorData.subtotal,
        tax: vendorTax,
        commission: commission,
        netAmount: netAmount,
        status: "pending",
        shippingAddress: {
          name: shippingAddress.name || "",
          address: shippingAddress.address || "",
          city: shippingAddress.city || "",
          state: shippingAddress.state || "",
          postalCode: shippingAddress.postalCode || "",
          country: shippingAddress.country || "",
          phone: shippingAddress.phone || "",
        },
      });

      await vendorOrder.save();
      vendorOrders.push(vendorOrder);

      // Update vendor metrics and wallet
      if (vendor) {
        vendor.metrics = vendor.metrics || {};
        vendor.metrics.totalOrders = (vendor.metrics.totalOrders || 0) + 1;
        vendor.metrics.pendingOrders = (vendor.metrics.pendingOrders || 0) + 1;

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

        // Add to pending balance
        vendor.wallet.pendingBalance =
          (vendor.wallet.pendingBalance || 0) + netAmount;

        await vendor.save();
      }

      // Emit vendor order event
      if (req.io) {
        req.io.emit(`vendor-new-order-${vendorId}`, vendorOrder);
      }
    }

    // Emit new order event to admin
    if (req.io) {
      req.io.emit("new-order", createdOrder);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get("/myorders", protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get("/", protect, admin, async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "id name")
    .populate({
      path: "orderItems.product",
      select: "vendor",
      populate: {
        path: "vendor",
        select: "businessName",
      },
    });
  res.json(orders);
});

// @desc    Get order analytics
// @route   GET /api/orders/analytics
// @access  Private/Admin
router.get("/analytics", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("orderItems.product");
    const Product = require("../models/Product");
    const User = require("../models/User"); // Import User model
    const allProducts = await Product.find({});

    const totalOrders = orders.length;
    const totalUsers = await User.countDocuments({}); // Total registered users

    // Count unique customers (users who have at least one order)
    const uniqueCustomers = new Set(orders.map((o) => o.user.toString())).size;

    const totalRevenue = orders
      .filter((o) => !["Cancelled", "Returned", "Refunded"].includes(o.status))
      .reduce((acc, order) => acc + (order.totalPrice || 0), 0);

    // Order Status Distribution (for pie chart)
    const ordersByStatus = orders.reduce((acc, order) => {
      const status = order.status || "Pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Completed vs Pending
    const completedOrders = orders.filter((o) =>
      ["Delivered", "Shipped"].includes(o.status),
    ).length;
    const pendingOrders = orders.filter(
      (o) =>
        ![
          "Delivered",
          "Shipped",
          "Closed",
          "Cancelled",
          "Returned",
          "Refunded",
        ].includes(o.status),
    ).length;
    const completedRevenue = orders
      .filter((o) => ["Delivered", "Shipped"].includes(o.status))
      .reduce((acc, o) => acc + o.totalPrice, 0);
    const pendingRevenue = orders
      .filter(
        (o) =>
          ![
            "Delivered",
            "Shipped",
            "Closed",
            "Cancelled",
            "Returned",
            "Refunded",
          ].includes(o.status),
      )
      .reduce((acc, o) => acc + o.totalPrice, 0);

    // Sales by Date (Last 7 days)
    const salesByDate = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["Cancelled", "Returned", "Refunded"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]);

    // Product Demand Analysis
    const productStats = {};

    // Initialize with all products (0 sales)
    allProducts.forEach((product) => {
      productStats[product.name] = {
        name: product.name,
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0,
      };
    });

    // Update with order data - exclude cancelled
    orders
      .filter((o) => !["Cancelled", "Returned", "Refunded"].includes(o.status))
      .forEach((order) => {
        order.orderItems.forEach((item) => {
          const productName = item.name;
          if (!productStats[productName]) {
            // Handle case where product name in order might differ slightly or product deleted but exists in order
            productStats[productName] = {
              name: productName,
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
            };
          }
          productStats[productName].totalQuantity += item.quantity || 0;
          productStats[productName].totalRevenue +=
            (item.price || 0) * (item.quantity || 0);
          productStats[productName].orderCount += 1;
        });
      });

    const productArray = Object.values(productStats);

    // Most demanding products (top 5)
    const mostDemanding = productArray
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // Least demanding products (bottom 5)
    const leastDemanding = productArray
      .sort((a, b) => a.totalQuantity - b.totalQuantity)
      .slice(0, 5);

    // Revenue by Product (top 5)
    const topRevenueProducts = productArray
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Monthly trend (last 6 months)
    const monthlyTrend = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["Cancelled", "Returned", "Refunded"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]);

    res.json({
      totalOrders,
      totalRevenue,
      totalUsers,
      uniqueCustomers,
      completedOrders,
      pendingOrders,
      completedRevenue,
      pendingRevenue,
      ordersByStatus,
      salesByDate: salesByDate.reverse(),
      mostDemanding,
      leastDemanding,
      topRevenueProducts,
      monthlyTrend: monthlyTrend.reverse(),
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Analytics Failed" });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put("/:id/status", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.status;
    order.status = req.body.status;

    if (req.body.status === "Delivered" || req.body.status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }

    const updatedOrder = await order.save();

    // Map main order status to vendor order status
    const statusMap = {
      Processing: "processing",
      Shipped: "shipped",
      "Out for Delivery": "shipped",
      Delivered: "delivered",
      Cancelled: "cancelled",
    };

    const VendorOrder = require("../models/VendorOrder");
    const Vendor = require("../models/Vendor");
    const vendorOrders = await VendorOrder.find({ order: order._id });

    // Sync all VendorOrder statuses
    for (const vendorOrder of vendorOrders) {
      const mappedStatus = statusMap[req.body.status] || vendorOrder.status;

      // Only update if status actually changes
      if (vendorOrder.status !== mappedStatus) {
        vendorOrder.status = mappedStatus;

        if (mappedStatus === "shipped") {
          vendorOrder.shippedAt = new Date();
        } else if (mappedStatus === "cancelled") {
          vendorOrder.cancelledAt = new Date();
          // Deduct from pending balance
          const vendor = await Vendor.findById(vendorOrder.vendor);
          if (vendor && vendor.wallet) {
            vendor.wallet.pendingBalance = Math.max(
              0,
              (vendor.wallet.pendingBalance || 0) - vendorOrder.netAmount,
            );
            await vendor.save();
          }
        }

        await vendorOrder.save();
      }
    }

    // Also update related VendorOrders and credit wallets if delivered
    if (
      (req.body.status === "Delivered" || req.body.status === "delivered") &&
      previousStatus !== "Delivered" &&
      previousStatus !== "delivered"
    ) {
      const vendorOrders = await VendorOrder.find({ order: order._id });

      for (const vendorOrder of vendorOrders) {
        if (vendorOrder.status !== "delivered") {
          vendorOrder.status = "delivered";
          vendorOrder.deliveredAt = new Date();
          vendorOrder.payoutStatus = "completed";
          await vendorOrder.save();

          // Credit vendor wallet
          const vendor = await Vendor.findById(vendorOrder.vendor);
          if (vendor) {
            // Initialize wallet if not exists
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
            vendor.wallet.pendingBalance = Math.max(
              0,
              (vendor.wallet.pendingBalance || 0) - vendorOrder.netAmount,
            );
            vendor.wallet.balance =
              (vendor.wallet.balance || 0) + vendorOrder.netAmount;
            vendor.wallet.totalEarnings =
              (vendor.wallet.totalEarnings || 0) + vendorOrder.netAmount;
            vendor.wallet.totalCommissionPaid =
              (vendor.wallet.totalCommissionPaid || 0) + vendorOrder.commission;

            // Add transaction record for earnings
            vendor.wallet.transactions.push({
              type: "order_earning",
              amount: vendorOrder.netAmount,
              description: `Order #${vendorOrder._id
                .toString()
                .slice(-8)} delivered`,
              orderId: vendorOrder._id,
              status: "completed",
              balanceAfter: vendor.wallet.balance,
            });

            // Add commission deduction transaction
            vendor.wallet.transactions.push({
              type: "commission",
              amount: vendorOrder.commission,
              description: `Commission for Order #${vendorOrder._id
                .toString()
                .slice(-8)}`,
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
            vendor.metrics.totalCommission =
              (vendor.metrics.totalCommission || 0) + vendorOrder.commission;

            await vendor.save();
          }
        }
      }
    }

    // Emit status update event
    if (req.io) {
      req.io.emit("order-status-updated", updatedOrder);
    }

    // Clear caches when order status is updated
    invalidateCache.orders();
    invalidateCache.vendors();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Track order by ID (Public/Protected via ID knowledge)
// @route   GET /api/orders/track/:id
// @access  Public
router.get("/track/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select(
      "status totalPrice orderItems createdAt isDelivered deliveredAt",
    );
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(404).json({ message: "Order not found (Invalid ID)" });
  }
});

// @desc    Request a return for an order
// @route   POST /api/orders/:id/return
// @access  Private
router.post("/:id/return", protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure user owns the order
    if (
      order.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (order.status !== "Delivered" && order.status !== "delivered") {
      return res
        .status(400)
        .json({ message: "Only delivered orders can be returned" });
    }

    if (order.returnStatus !== "None") {
      return res
        .status(400)
        .json({ message: "Return already requested or processed" });
    }

    // Update Main Order
    order.returnStatus = "Requested";
    order.returnReason = reason;
    order.returnRequestedAt = new Date();
    await order.save();

    // Update All Related Vendor Orders
    const VendorOrder = require("../models/VendorOrder");
    const vendorOrders = await VendorOrder.find({ order: order._id });

    for (const vendorOrder of vendorOrders) {
      vendorOrder.returnStatus = "Requested";
      vendorOrder.returnReason = reason;
      vendorOrder.returnRequestedAt = new Date();
      await vendorOrder.save();

      // Emit event to vendor
      if (req.io) {
        req.io.emit(
          `vendor-return-requested-${vendorOrder.vendor}`,
          vendorOrder,
        );
      }
    }

    res.json({ message: "Return requested successfully", order });
  } catch (error) {
    console.error("Return Request Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    User Cancel Order
// @route   POST /api/orders/:id/cancel
// @access  Private
// 
// CANCELLATION POLICY:
// 1. Vendor DOES NOT receive commission as sale is not completed
// 2. User receives FULL REFUND for product cost + tax
// 3. Delivery charges are NON-REFUNDABLE
// 4. Commission is automatically adjusted (deducted from vendor's pending balance)
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Allow cancellation only if not shipped yet
    const nonCancellableStatuses = [
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
    ];
    if (nonCancellableStatuses.includes(order.status)) {
      return res
        .status(400)
        .json({ message: `Cannot cancel order with status: ${order.status}` });
    }

    // 1. Update Main Order
    order.status = "Cancelled";
    order.cancelledAt = new Date();

    // Refund if Paid
    if (order.isPaid) {
      order.isRefunded = true;
      // REFUND POLICY: Product Price + Tax ONLY (Delivery Charge is NON-REFUNDABLE)
      const refundAmount = (order.itemsPrice || 0) + (order.taxPrice || 0);
      order.refundAmount = refundAmount;
      order.refundDate = new Date();

      // Log Refund
      const RefundLog = require("../models/RefundLog");
      await RefundLog.create({
        order: order._id,
        user: req.user._id,
        initiatedBy: "User",
        actorId: req.user._id,
        amount: refundAmount,
        deliveryCharge: order.shippingPrice || 0,
        totalRefundableAmount: refundAmount,
        reason: "User Cancelled Order",
        status: "Completed",
      });

      // Refund User (Wallet or Razorpay)
      const User = require("../models/User");
      const paymentService = require("../services/paymentService");
      const user = await User.findById(req.user._id);

      let refundType = "wallet";

      if (user) {
        // Check for Razorpay Refund
        const isOnlinePayment =
          order.paymentMethod === "Online" ||
          order.paymentMethod === "Razorpay";

        if (isOnlinePayment && order.paymentResult?.id) {
          try {
            await paymentService.refundPayment(
              order.paymentResult.id,
              order.refundAmount,
            );
            refundType = "razorpay";
          } catch (err) {
            console.error(
              "Razorpay Refund Failed (Cancel), falling back to Wallet:",
              err,
            );
            refundType = "wallet";
          }
        }

        if (refundType === "wallet") {
          user.walletBalance = (user.walletBalance || 0) + order.refundAmount;
          if (!user.walletTransactions) user.walletTransactions = [];
          user.walletTransactions.push({
            type: "refund",
            amount: order.refundAmount,
            description: `Refund for Cancelled Order #${order._id.toString().slice(-8)}`,
            date: new Date(),
          });
          await user.save();
        }
      }
    }

    await order.save();

    // 2. Update Vendor Orders & Remove Commission
    // COMMISSION POLICY: Vendor does NOT receive commission for cancelled orders
    // The commission is deducted from vendor's pending balance since order is not completed
    const VendorOrder = require("../models/VendorOrder");
    const vendorOrders = await VendorOrder.find({ order: order._id });

    for (const vendorOrder of vendorOrders) {
      try {
        if (vendorOrder.status !== "cancelled") {
          vendorOrder.status = "cancelled";
          vendorOrder.cancelledAt = new Date();

          // Deduct from Vendor Pending Balance
          // IMPORTANT: netAmount includes the vendor's earnings after commission deduction
          // By removing this from pendingBalance, we ensure vendor doesn't get paid for cancelled orders
          const Vendor = require("../models/Vendor");
          const vendor = await Vendor.findById(vendorOrder.vendor);

          if (vendor) {
            // Ensure wallet exists
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
            if (!vendor.wallet.transactions) vendor.wallet.transactions = [];

            // Deduct netAmount from pending balance
            // This ensures the vendor does NOT receive commission for cancelled sale
            vendor.wallet.pendingBalance = Math.max(
              0,
              (vendor.wallet.pendingBalance || 0) - vendorOrder.netAmount,
            );

            // Add transaction record for transparency
            vendor.wallet.transactions.push({
              type: "adjustment", // Changed from 'pending_cancelled' to match enum if strict, though Schema has 'adjustment'
              amount: vendorOrder.netAmount,
              description: `User Cancelled Order #${vendorOrder._id.toString().slice(-8)} - Commission Adjusted`,
              orderId: vendorOrder._id,
              status: "completed",
              balanceAfter: vendor.wallet.balance,
            });

            // Update metrics
            if (!vendor.metrics) vendor.metrics = {};
            vendor.metrics.pendingOrders = Math.max(
              0,
              (vendor.metrics.pendingOrders || 0) - 1,
            );
            vendor.metrics.cancelledOrders =
              (vendor.metrics.cancelledOrders || 0) + 1;

            await vendor.save();
          }

          // Cancel Shiprocket Order if exists
          if (vendorOrder.trackingNumber) {
            try {
              const shiprocketService = require("../services/shiprocketService");
              await shiprocketService.cancelOrder(vendorOrder.trackingNumber);
            } catch (err) {
              console.error("Shiprocket Cancel Failed", err);
            }
          }

          await vendorOrder.save();
        }
      } catch (voError) {
        console.error(
          `Failed to update vendor order ${vendorOrder._id}:`,
          voError,
        );
        // Continue to next vendor order even if one fails
      }
    }

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({
      message: "Server error preventing cancellation",
      error: error.message,
    });
  }
});

// @desc    Admin Force Refund Order
// @route   POST /api/orders/:id/admin/refund
// @access  Private/Admin
//
// ADMIN REFUND POLICY:
// 1. Admin can forcefully refund any order (even if delivered)
// 2. User receives FULL REFUND for product cost + tax ONLY
// 3. Delivery charges are NON-REFUNDABLE
// 4. Admin adjusts/refunds commission:
//    - If order was delivered: Deduct from vendor's available balance
//    - If order was pending: Deduct from vendor's pending balance
// 5. Vendor does NOT keep commission for refunded orders
router.post("/:id/admin/refund", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.isRefunded) {
      return res.status(400).json({ message: "Order already refunded" });
    }

    // REFUND POLICY: Product Price + Tax ONLY (Delivery Charge is NON-REFUNDABLE)
    const refundAmount = (order.itemsPrice || 0) + (order.taxPrice || 0);

    // 1. Refund to User (Wallet or Razorpay)
    const User = require("../models/User");
    const paymentService = require("../services/paymentService");
    const user = await User.findById(order.user);

    // Log Refund
    const RefundLog = require("../models/RefundLog");
    await RefundLog.create({
      order: order._id,
      user: order.user,
      initiatedBy: "Admin",
      actorId: req.user._id,
      amount: refundAmount,
      deliveryCharge: order.shippingPrice || 0,
      totalRefundableAmount: refundAmount,
      reason: "Admin Force Refund",
      status: "Completed",
    });

    let refundType = "wallet";

    if (user) {
      // Check for Razorpay Refund
      const isOnlinePayment =
        order.paymentMethod === "Online" || order.paymentMethod === "Razorpay";

      if (isOnlinePayment && order.paymentResult?.id) {
        try {
          await paymentService.refundPayment(
            order.paymentResult.id,
            refundAmount,
          );
          refundType = "razorpay";
        } catch (err) {
          console.error(
            "Razorpay Refund Failed (Admin), falling back to Wallet:",
            err,
          );
          refundType = "wallet";
        }
      }

      if (refundType === "wallet") {
        user.walletBalance = (user.walletBalance || 0) + refundAmount;
        user.walletTransactions.push({
          type: "refund",
          amount: refundAmount,
          description: `Admin Refund for Order #${order._id.toString().slice(-8)}`,
          date: new Date(),
        });
        await user.save();
      }
    }

    // 2. Debit All Vendors & Adjust Commission
    // COMMISSION ADJUSTMENT: Admin can recover funds and adjust commission
    // - For COMPLETED orders: Deduct from vendor's available balance (even if negative)
    // - For PENDING orders: Deduct from vendor's pending balance
    // - Commission is NOT retained by vendor for refunded orders
    const VendorOrder = require("../models/VendorOrder");
    const vendorOrders = await VendorOrder.find({ order: order._id });

    for (const vendorOrder of vendorOrders) {
      if (vendorOrder.returnStatus !== "Completed") {
        const Vendor = require("../models/Vendor");
        const vendor = await Vendor.findById(vendorOrder.vendor);

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
            // Order was delivered - deduct from available balance
            // COMMISSION ADJUSTMENT: Deduct netAmount (vendor's earnings after commission)
            // This effectively reverses both the vendor's earnings AND the commission deduction
            vendor.wallet.balance =
              (vendor.wallet.balance || 0) - vendorOrder.netAmount;

            // Adjust total earnings and commission paid metrics
            vendor.wallet.totalEarnings = Math.max(
              0,
              (vendor.wallet.totalEarnings || 0) - vendorOrder.netAmount,
            );
            vendor.wallet.totalCommissionPaid = Math.max(
              0,
              (vendor.wallet.totalCommissionPaid || 0) - vendorOrder.commission,
            );

            vendor.wallet.transactions.push({
              type: "admin_refund_debit",
              amount: -vendorOrder.netAmount, // Negative amount for debit
              description: `Admin Refund - Commission Adjusted for Order #${vendorOrder._id.toString().slice(-8)}`,
              orderId: vendorOrder._id,
              status: "completed",
              balanceAfter: vendor.wallet.balance,
            });
          } else {
            // Order was pending - deduct from pending balance
            vendor.wallet.pendingBalance = Math.max(
              0,
              (vendor.wallet.pendingBalance || 0) - vendorOrder.netAmount,
            );

            vendor.wallet.transactions.push({
              type: "admin_pending_cancelled",
              amount: -vendorOrder.netAmount, // Negative amount for consistency
              description: `Admin Cancelled Pending Order #${vendorOrder._id.toString().slice(-8)}`,
              orderId: vendorOrder._id,
              status: "completed",
              balanceAfter: vendor.wallet.balance, // Showing Realized Balance here might be confusing if it didn't change, but it is accurate state.
            });
          }

          // Update metrics
          vendor.metrics = vendor.metrics || {};
          vendor.metrics.refundedOrders =
            (vendor.metrics.refundedOrders || 0) + 1;

          await vendor.save();
        }

        vendorOrder.status = "returned";
        vendorOrder.returnStatus = "Completed";
        vendorOrder.payoutStatus = "refunded";
        await vendorOrder.save();
      }
    }

    // 3. Update Main Order
    order.isRefunded = true;
    order.refundAmount = refundAmount; // Use actual refunded amount (excl. shipping)
    order.refundDate = new Date();
    order.status = "Returned"; // More accurate than Cancelled if it was delivered
    order.returnStatus = "Completed";
    await order.save();

    res.json({ message: "Order refunded successfully", order });
  } catch (error) {
    console.error("Admin Refund Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
