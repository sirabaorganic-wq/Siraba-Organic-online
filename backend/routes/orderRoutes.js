const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const VendorOrder = require("../models/VendorOrder");
const Vendor = require("../models/Vendor");
const { protect, admin } = require("../middleware/authMiddleware");
const { invalidateCache } = require("../config/cache");
const { enqueueShipment } = require("../jobs/shiprocketQueue");
const { getCommissionRate } = require("../config/vendorPlans");
const { calculateShipping } = require("./shippingRoutes");
const shiprocketService = require("../services/shiprocketService");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post("/", protect, async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    shippingAddressId,
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

  // ===== RESOLVE & VALIDATE SHIPPING ADDRESS WITH OWNERSHIP CHECK =====
  let resolvedAddress = null;
  const user = req.user;

  if (shippingAddressId) {
    resolvedAddress = user.addresses?.id(shippingAddressId);
    if (!resolvedAddress) {
      return res.status(400).json({ message: "Selected delivery address does not exist or does not belong to you" });
    }
  } else if (shippingAddress?._id) {
    resolvedAddress = user.addresses?.id(shippingAddress._id);
    if (!resolvedAddress) {
      return res.status(400).json({ message: "Selected delivery address does not exist or does not belong to you" });
    }
  } else if (shippingAddress && shippingAddress.address) {
    resolvedAddress = shippingAddress;
  } else {
    return res.status(400).json({ message: "Shipping address is required" });
  }

  const cleanPhone = String(resolvedAddress.phone || user.phone || "").replace(/\D/g, "");
  const formattedPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

  const verifiedShippingAddress = {
    name: (resolvedAddress.name || user.name || "").trim(),
    phone: formattedPhone,
    address: (resolvedAddress.address || "").trim(),
    addressLine2: (resolvedAddress.addressLine2 || "").trim(),
    landmark: (resolvedAddress.landmark || "").trim(),
    city: (resolvedAddress.city || "").trim(),
    state: (resolvedAddress.state || "").trim(),
    postalCode: String(resolvedAddress.postalCode || "").trim(),
    country: (resolvedAddress.country || "India").trim(),
    addressType: resolvedAddress.addressType || "Home",
    addressId: resolvedAddress._id || undefined,
  };

  if (!verifiedShippingAddress.address || !verifiedShippingAddress.city || !verifiedShippingAddress.state || !verifiedShippingAddress.postalCode) {
    return res.status(400).json({ message: "Invalid shipping address details. Street address, city, state, and postal code are required." });
  }

  if (!verifiedShippingAddress.name || verifiedShippingAddress.name.length < 2) {
    return res.status(400).json({ message: "Recipient name is required for delivery (minimum 2 characters)" });
  }

  if (!verifiedShippingAddress.phone || verifiedShippingAddress.phone.length < 10) {
    return res.status(400).json({ message: "A valid 10-digit phone number is required for delivery" });
  }

  if (!/^[0-9]{6}$/.test(verifiedShippingAddress.postalCode)) {
    return res.status(400).json({ message: "A valid 6-digit postal/PIN code is required" });
  }

  try {
    // ===== SERVER-SIDE CATALOG PRICE VALIDATION & STOCK DEDUCTION =====
    let calculatedItemsPrice = 0;
    const verifiedOrderItems = [];

    for (const item of orderItems) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct || !dbProduct.isActive) {
        return res.status(400).json({ message: `Product ${item.name || item.product} is not available for purchase` });
      }

      // Stock Check
      if (dbProduct.stockQuantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${dbProduct.name}. Available: ${dbProduct.stockQuantity}` });
      }

      // Authoritative Price Calculation (matches variant option if supplied)
      let itemPrice = dbProduct.price;
      if (item.selectedOption && dbProduct.options && dbProduct.options.length > 0) {
        const matchedOpt = dbProduct.options.find(o => o.label === item.selectedOption.label);
        if (matchedOpt && matchedOpt.price) itemPrice = matchedOpt.price;
      }

      calculatedItemsPrice += itemPrice * item.quantity;
      verifiedOrderItems.push({
        name: dbProduct.name,
        quantity: item.quantity,
        image: item.image || dbProduct.image || (dbProduct.images && dbProduct.images[0]) || "/placeholder.png",
        price: itemPrice,
        product: dbProduct._id,
        sku: dbProduct.sku || "",
      });
    }

    // Atomic Stock Deduction
    for (const item of verifiedOrderItems) {
      const updatedProd = await Product.findOneAndUpdate(
        { _id: item.product, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
        { new: true }
      );
      if (!updatedProd) {
        return res.status(400).json({ message: `Failed to reserve stock for ${item.name}. Stock was modified.` });
      }
    }

    // Authoritative Calculations
    const verifiedItemsPrice = calculatedItemsPrice;
    const verifiedDiscountAmount = discountAmount || 0;
    const discountedSubtotal = Math.max(0, verifiedItemsPrice - verifiedDiscountAmount);

    // GST Logic & Dynamic Rate from GSTSettings
    const GSTSettings = require("../models/GSTSettings");
    const gstSettings = await GSTSettings.getInstance();
    const effectiveGstRate = gstSettings.gst_enabled
      ? ((gstSettings.default_gst_percentage !== undefined ? gstSettings.default_gst_percentage : 18) / 100)
      : 0;
    const verifiedTaxPrice = Math.round(discountedSubtotal * effectiveGstRate * 100) / 100;

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

      coupon.usedCount += 1;
      await coupon.save();
    }

    let gstClaimed = false;
    let buyerGstNumber = null;
    let sellerGstNumber = null;

    if (req.user.vendor) {
      sellerGstNumber =
        req.user.vendor.gstNumber || gstSettings.admin_gst_number || null;
    } else {
      sellerGstNumber = gstSettings.admin_gst_number || null;
    }

    if (gstSettings.gst_enabled) {
      if (req.body.gstClaimed) {
        gstClaimed = true;
        buyerGstNumber = req.body.buyerGstNumber || req.user.user_gst_number;
      } else if (req.user.claim_gst) {
        gstClaimed = true;
        buyerGstNumber = req.user.user_gst_number;
      }
    }

    // ===== SERVER-SIDE SHIPPING CALCULATION =====
    let verifiedShippingPrice = 0;
    let shippingBreakdownMap = new Map();

    try {
      const deliveryPincode = verifiedShippingAddress.postalCode;
      if (deliveryPincode) {
        const shippingResult = await calculateShipping(
          verifiedOrderItems.map(item => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price,
          })),
          deliveryPincode,
          paymentMethod
        );
        verifiedShippingPrice = shippingResult.totalShipping || 0;

        if (shippingResult.vendorBreakdown && Array.isArray(shippingResult.vendorBreakdown)) {
          shippingResult.vendorBreakdown.forEach(b => {
            shippingBreakdownMap.set(b.vendorId, b);
          });
        }
      }
    } catch (shippingErr) {
      console.error('Server-side shipping calculation failed:', shippingErr.message);
      // Security boundary: Never allow ₹0 shipping if discountedSubtotal is under threshold
      if (discountedSubtotal >= 999) {
        verifiedShippingPrice = 0;
      } else {
        verifiedShippingPrice = (shippingPrice && shippingPrice > 0) ? shippingPrice : 66;
      }
    }

    const verifiedTotalPrice = Math.round((discountedSubtotal + verifiedTaxPrice + verifiedShippingPrice) * 100) / 100;

    // Create main order with authoritative verified prices
    const order = new Order({
      user: req.user._id,
      orderItems: verifiedOrderItems,
      shippingAddress: verifiedShippingAddress,
      paymentMethod,
      itemsPrice: verifiedItemsPrice,
      taxPrice: verifiedTaxPrice,
      shippingPrice: verifiedShippingPrice,
      totalPrice: verifiedTotalPrice,
      couponCode,
      discountAmount: verifiedDiscountAmount,
      gstClaimed,
      buyerGstNumber,
      sellerGstNumber,
    });

    const createdOrder = await order.save();

    // Clear caches when new order is created
    invalidateCache.orders();
    invalidateCache.vendors();

    // ===== CREATE VENDOR ORDERS FOR VENDOR PRODUCTS =====
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
      const commissionRate =
        vendor?.commissionRate !== undefined && vendor?.commissionRate !== null
          ? vendor.commissionRate
          : getCommissionRate(vendor?.subscription?.plan || "starter");
      const commission = (vendorData.subtotal * commissionRate) / 100;
      const netAmount = vendorData.subtotal - commission;

      const vendorTax =
        verifiedItemsPrice > 0
          ? Math.round(((vendorData.subtotal / verifiedItemsPrice) * verifiedTaxPrice) * 100) / 100
          : 0;

      // Extract vendor shipping breakdown
      const vBreakdown = shippingBreakdownMap.get(vendorId);
      const shippingThresholdAtOrder = vBreakdown?.threshold || 999;
      const isFreeShippingEligible = vBreakdown?.isFreeShippingEligible || (vendorData.subtotal >= shippingThresholdAtOrder);
      const customerShippingCharge = vBreakdown?.customerShippingCharge !== undefined ? vBreakdown.customerShippingCharge : (isFreeShippingEligible ? 0 : 66);
      const estimatedShippingCost = vBreakdown?.estimatedShippingCost || 66;
      const shippingSubsidy = vBreakdown?.shippingSubsidy !== undefined ? vBreakdown.shippingSubsidy : Math.max(0, estimatedShippingCost - customerShippingCharge);
      const estimatedGatewayFee = Math.round(vendorData.subtotal * 0.0236 * 100) / 100;
      const expectedNetContribution = Math.round((customerShippingCharge + commission - estimatedShippingCost - estimatedGatewayFee) * 100) / 100;

      const vendorOrder = new VendorOrder({
        order: createdOrder._id,
        vendor: vendorId,
        items: vendorData.items,
        subtotal: vendorData.subtotal,
        tax: vendorTax,
        commission: commission,
        commissionRateAtOrder: commissionRate,
        planAtOrder: vendor?.subscription?.plan || "starter",
        netAmount: netAmount,

        // Shipping Economics Snapshot
        shippingThresholdAtOrder,
        isFreeShippingEligible,
        customerShippingCharge,
        estimatedShippingCost,
        shippingSubsidy,
        estimatedGatewayFee,
        expectedNetContribution,

        status: "pending",
        shippingAddress: {
          name: verifiedShippingAddress.name || "",
          address: verifiedShippingAddress.address || "",
          city: verifiedShippingAddress.city || "",
          state: verifiedShippingAddress.state || "",
          postalCode: verifiedShippingAddress.postalCode || "",
          country: verifiedShippingAddress.country || "",
          phone: verifiedShippingAddress.phone || "",
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

      // Shiprocket: Enqueue shipment if it's COD (Prepaid orders enqueue after payment verif)
      if (paymentMethod === 'COD') {
        try {
          await enqueueShipment(vendorOrder._id, createdOrder._id, vendorId);
        } catch (queueErr) {
          console.error("Failed to enqueue COD Shiprocket Job:", queueErr);
        }
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

// Helper: normalize and construct consumer-facing tracking and order data
const formatOrderTrackingData = (order, vendorOrders = [], liveCourierTracking = null, liveTrackingError = null) => {
  const shipments = vendorOrders.map((vo) => ({
    _id: vo._id,
    vendorOrderId: vo._id,
    vendorName: vo.vendor?.businessName || "Direct Seller",
    items: (vo.items || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
      sku: i.sku,
    })),
    status: vo.status || "pending",
    shipmentId: vo.shipmentId || null,
    awbCode: vo.awbCode || null,
    courierName: vo.courierName || null,
    trackingNumber: vo.trackingNumber || null,
    shippingRoutingCode: vo.shippingRoutingCode || null,
    shippedAt: vo.shippedAt || null,
    deliveredAt: vo.deliveredAt || null,
    trackingUrl: vo.awbCode ? `https://shiprocket.co/tracking/${vo.awbCode}` : null,
    trackingAvailable: Boolean(vo.awbCode || vo.shipmentId),
  }));

  const anyTrackingAvailable = shipments.some((s) => s.trackingAvailable);
  const allDelivered = shipments.length > 0 && shipments.every((s) => s.status === "delivered");
  const anyInTransit = shipments.some((s) => ["in_transit", "out_for_delivery", "shipped"].includes(s.status));
  const isCancelled = order.status === "Cancelled" || order.status === "cancelled";

  // Build canonical timeline
  const timeline = [
    {
      title: "Order Placed",
      statusKey: "placed",
      description: "Your order has been placed successfully.",
      timestamp: order.createdAt,
      completed: true,
      current: order.status === "Pending" && !order.isPaid,
    },
    {
      title: "Payment Confirmed",
      statusKey: "payment_confirmed",
      description:
        order.paymentMethod === "COD"
          ? "Cash on Delivery chosen"
          : order.isPaid
          ? "Payment received and verified"
          : "Awaiting payment verification",
      timestamp: order.paidAt || (order.isPaid ? order.createdAt : null),
      completed: order.isPaid || order.paymentMethod === "COD",
      current:
        (order.isPaid || order.paymentMethod === "COD") &&
        ["Pending", "Approved"].includes(order.status) &&
        !anyInTransit &&
        !anyTrackingAvailable,
    },
    {
      title: "Processing",
      statusKey: "processing",
      description: anyTrackingAvailable
        ? "Shipment created and courier assigned"
        : "Order is being packed and prepared for pickup",
      timestamp: shipments.find((s) => s.shippedAt)?.shippedAt || null,
      completed:
        anyTrackingAvailable ||
        ["Processing", "Shipped", "Delivered"].includes(order.status),
      current:
        (order.status === "Processing" || order.status === "Approved") &&
        !anyInTransit &&
        !order.isDelivered,
    },
    {
      title: "In Transit",
      statusKey: "in_transit",
      description: shipments.find((s) => s.courierName)
        ? `In transit with ${shipments.find((s) => s.courierName).courierName}`
        : "Package has been dispatched and is moving towards destination facility",
      timestamp: shipments.find((s) => s.shippedAt)?.shippedAt || null,
      completed:
        anyInTransit ||
        allDelivered ||
        order.isDelivered ||
        order.status === "Delivered",
      current: anyInTransit && !allDelivered && !order.isDelivered,
    },
    {
      title: "Out for Delivery",
      statusKey: "out_for_delivery",
      description: "Package is out for delivery with courier executive",
      timestamp: null,
      completed:
        shipments.some((s) => s.status === "out_for_delivery") ||
        allDelivered ||
        order.isDelivered ||
        order.status === "Delivered",
      current:
        shipments.some((s) => s.status === "out_for_delivery") &&
        !allDelivered &&
        !order.isDelivered,
    },
    {
      title: "Delivered",
      statusKey: "delivered",
      description:
        order.isDelivered || order.status === "Delivered" || allDelivered
          ? "Package has been delivered"
          : "Pending delivery completion",
      timestamp:
        order.deliveredAt ||
        shipments.find((s) => s.deliveredAt)?.deliveredAt ||
        null,
      completed: Boolean(
        order.isDelivered || order.status === "Delivered" || allDelivered
      ),
      current: Boolean(
        order.isDelivered || order.status === "Delivered" || allDelivered
      ),
    },
  ];

  return {
    _id: order._id,
    orderId: order._id,
    user: order.user,
    status: order.status,
    isDelivered: order.isDelivered || false,
    deliveredAt: order.deliveredAt || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    orderItems: order.orderItems || [],
    shippingAddress: order.shippingAddress || {},
    paymentMethod: order.paymentMethod || "COD",
    paymentStatus:
      order.paymentStatus ||
      (order.isPaid
        ? "captured"
        : order.paymentMethod === "COD"
        ? "not_applicable"
        : "created"),
    isPaid: order.isPaid || false,
    paidAt: order.paidAt || null,
    itemsPrice: order.itemsPrice || 0,
    taxPrice: order.taxPrice || 0,
    shippingPrice: order.shippingPrice || 0,
    totalPrice: order.totalPrice || 0,
    discountAmount: order.discountAmount || 0,
    couponCode: order.couponCode || null,
    returnStatus: order.returnStatus || "None",
    returnReason: order.returnReason || null,
    returnRequestedAt: order.returnRequestedAt || null,
    isRefunded: order.isRefunded || false,
    refundAmount: order.refundAmount || 0,
    refundDate: order.refundDate || null,
    cancelledAt: order.cancelledAt || null,
    vendorOrders: shipments,
    trackingAvailable: anyTrackingAvailable,
    liveCourierTracking: liveCourierTracking || null,
    liveTrackingError: liveTrackingError || null,
    canCancel:
      ["Pending", "Approved", "Processing"].includes(order.status) &&
      !order.isDelivered &&
      !isCancelled,
    canReturn:
      (order.status === "Delivered" || order.isDelivered) &&
      (!order.returnStatus || order.returnStatus === "None"),
    timeline: isCancelled ? [] : timeline,
    isCancelled,
  };
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get("/myorders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const orderIds = orders.map((o) => o._id);
    const vendorOrders = await VendorOrder.find({ order: { $in: orderIds } })
      .populate("vendor", "businessName")
      .lean();

    const vendorOrdersMap = {};
    vendorOrders.forEach((vo) => {
      const parentId = vo.order.toString();
      if (!vendorOrdersMap[parentId]) vendorOrdersMap[parentId] = [];
      vendorOrdersMap[parentId].push(vo);
    });

    const formattedOrders = orders.map((o) =>
      formatOrderTrackingData(o, vendorOrdersMap[o._id.toString()] || [])
    );

    res.json(formattedOrders);
  } catch (error) {
    console.error("Get My Orders Error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "id name email")
      .populate({
        path: "orderItems.product",
        select: "vendor",
        populate: {
          path: "vendor",
          select: "businessName shiprocket_pickup_code pickupAddress",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const orderIds = orders.map((o) => o._id);
    const vendorOrders = await VendorOrder.find({ order: { $in: orderIds } })
      .populate("vendor", "businessName shiprocket_pickup_code pickupAddress shiprocketPickup")
      .lean();

    const vendorOrdersMap = {};
    vendorOrders.forEach((vo) => {
      const parentId = vo.order.toString();
      if (!vendorOrdersMap[parentId]) vendorOrdersMap[parentId] = [];
      vendorOrdersMap[parentId].push(vo);
    });

    orders.forEach((o) => {
      o.vendorOrders = vendorOrdersMap[o._id.toString()] || [];
    });

    res.json(orders);
  } catch (error) {
    console.error("Get All Orders Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch orders" });
  }
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

// Shared handler for tracking endpoints
const getOrderTrackingHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    const order = await Order.findById(id).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Multi-tenant authorization check
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to access tracking for this order" });
    }

    const vendorOrders = await VendorOrder.find({ order: order._id })
      .populate("vendor", "businessName")
      .lean();

    let liveCourierTracking = null;
    let liveTrackingError = null;

    // Check if live tracking requested and an AWB is available
    if (req.query.live === "true" || req.query.realtime === "true") {
      const awbToTrack = vendorOrders.find((vo) => vo.awbCode)?.awbCode;
      if (awbToTrack) {
        try {
          liveCourierTracking = await shiprocketService.trackOrder(awbToTrack);
        } catch (liveErr) {
          liveTrackingError = "Carrier live tracking service is temporarily unavailable. Showing latest confirmed status.";
        }
      }
    }

    const trackingData = formatOrderTrackingData(
      order,
      vendorOrders,
      liveCourierTracking,
      liveTrackingError
    );

    res.json(trackingData);
  } catch (error) {
    console.error("Tracking endpoint error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch tracking details" });
  }
};

// @desc    Track order shipment by ID (Private/Authenticated)
// @route   GET /api/orders/:id/tracking
// @access  Private
router.get("/:id/tracking", protect, getOrderTrackingHandler);

// @desc    Track order by ID (Backwards compatibility with authentication)
// @route   GET /api/orders/track/:id
// @access  Private
router.get("/track/:id", protect, getOrderTrackingHandler);

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private (Owner or Admin)
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    const order = await Order.findById(id).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Strict multi-tenant security verification
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this order" });
    }

    const vendorOrders = await VendorOrder.find({ order: order._id })
      .populate("vendor", "businessName")
      .lean();

    let liveCourierTracking = null;
    let liveTrackingError = null;

    if (req.query.live === "true") {
      const awbToTrack = vendorOrders.find((vo) => vo.awbCode)?.awbCode;
      if (awbToTrack) {
        try {
          liveCourierTracking = await shiprocketService.trackOrder(awbToTrack);
        } catch (liveErr) {
          liveTrackingError = "Carrier live tracking service is temporarily unavailable. Showing latest confirmed status.";
        }
      }
    }

    const responseData = formatOrderTrackingData(
      order,
      vendorOrders,
      liveCourierTracking,
      liveTrackingError
    );

    res.json(responseData);
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch order details" });
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

          // Cancel Shiprocket shipment if AWB exists and not yet in-transit/delivered
          const cancellableStatuses = ["pending", "processing", "pickup_pending", "pickup_scheduled", "pickup_failed"];
          const awbToCancel = vendorOrder.awbCode || vendorOrder.trackingNumber;
          if (awbToCancel && cancellableStatuses.includes(vendorOrder.status)) {
            try {
              const shiprocketService = require("../services/shiprocketService");
              await shiprocketService.cancelShipment(awbToCancel);
            } catch (err) {
              console.error(`Shiprocket Cancel Failed for AWB ${awbToCancel}:`, err.message);
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
