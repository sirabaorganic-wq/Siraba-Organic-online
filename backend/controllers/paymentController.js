const Order = require('../models/Order');
const Payment = require('../models/Payment');
const paymentService = require('../services/paymentService');
const { enqueueShipment } = require('../jobs/shiprocketQueue');
const { queueOrderExpiry } = require('../jobs/orderExpiryQueue');

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payment/create-order
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const { amount, receipt } = req.body;

    if (!amount || !receipt) {
      return res.status(400).json({ message: 'Amount and receipt are required' });
    }

    // 1. Idempotency Check: Don't create two Razorpay orders for the same local DB Order
    let existingPayment = await Payment.findOne({ receipt: receipt.toString() });
    
    if (existingPayment) {
      // If we already have one that failed or is very old, we might allow a new one, 
      // but standard flow is 1 Payment doc per Order. For retry, frontend creates a new Order.
      if (existingPayment.status === 'created') {
         // Re-use existing un-paid Razorpay order
         return res.json({
           id: existingPayment.razorpay_order_id,
           amount: existingPayment.amount,
           currency: existingPayment.currency,
         });
      }
      return res.status(400).json({ message: 'Payment already processed or processing for this order' });
    }

    // 2. Call Razorpay API
    const rzpOrder = await paymentService.createRazorpayOrder(amount, receipt);

    // 3. Save Payment Record to DB
    // Assuming the frontend passed us the cart items for the snapshot
    const cartSnapshot = req.body.cartSnapshot || []; 
    // receipt might be an Order ID or a temporary string
    let localOrderId = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(receipt)) {
      const localOrder = await Order.findById(receipt);
      if (localOrder) localOrderId = localOrder._id;
    }
    // Generate dummy ID if no local order exists yet to satisfy Payment schema
    const finalOrderId = localOrderId || new mongoose.Types.ObjectId();

    // Set expiration (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const payment = await Payment.create({
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount, // comes back in paise
      currency: rzpOrder.currency,
      status: 'created',
      userId: req.user._id,
      orderId: finalOrderId,
      receipt: receipt.toString(),
      cartSnapshot,
      expiresAt
    });

    // Update local Order with payment status and expiry ONLY if it exists
    if (localOrderId) {
      const localOrder = await Order.findById(localOrderId);
      if (localOrder) {
        localOrder.paymentStatus = 'created';
        localOrder.razorpay_order_id = rzpOrder.id;
        localOrder.expiresAt = expiresAt;
        await localOrder.save();
      }
    }

    // 4. Enqueue Order Expiry Job (only if local order exists)
    if (localOrderId) {
      await queueOrderExpiry(localOrderId, payment._id, 30 * 60 * 1000); // 30 mins delay
    }

    res.json({
       id: rzpOrder.id,
       amount: rzpOrder.amount,
       currency: rzpOrder.currency,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Payment creation failed', error: error.message });
  }
};

/**
 * @desc    Verify Razorpay Payment Signature
 * @route   POST /api/payment/verify
 * @access  Private
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    // 1. Verify Signature locally
    const isValid = paymentService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      console.warn(`Invalid payment signature attempt for order: ${order_id}`);
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // 2. Idempotency / Duplicate Check
    const payment = await Payment.findOne({ razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    // If already captured (possibly via webhook earlier), just return success
    if (payment.status === 'captured') {
       return res.json({ message: 'Payment already verified and processed', orderId: order_id });
    }

    // 3. Update Payment record
    payment.status = 'captured';
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;
    payment.orderId = order_id; // Link to the actual DB order ID
    // Clearing expiresAt prevents the TTL auto-deletion
    payment.expiresAt = null; 
    await payment.save();

    // 4. Update Main Order
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: 'Order logic error, missing DB order' });

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'captured';
    order.expiresAt = null; // Clear expiry
    order.paymentResult = {
        id: razorpay_payment_id,
        status: 'captured',
        update_time: new Date().toISOString(),
        email_address: req.user.email,
    };
    
    // Auto-update to Online if it was left as COD internally
    if (order.paymentMethod === 'COD') {
        order.paymentMethod = 'Online';
    }
    order.status = 'Pending Vendor Approval';
    await order.save();

    // 5. Update Vendor Orders & trigger post-payment jobs
    const VendorOrder = require('../models/VendorOrder');
    
    // Only queue transfers if Razorpay Route feature is enabled.
    // For now, enqueueShipment (prepaid logic).
    const vendorOrders = await VendorOrder.find({ order: order._id });
    for (const vo of vendorOrders) {
        vo.status = 'pending';
        await vo.save();
        
        try {
           await enqueueShipment(vo._id, order._id, vo.vendor);
        } catch (queueErr) {
           console.error("Failed to enqueue Shiprocket Job after payment:", queueErr);
        }
    }

    // NOTE: Razorpay Route transfer logic (split payments) is offloaded
    // to the asynchronous TransferQueue, triggered via webhook.
    // We strictly use webhook for transfers to avoid double-firing.

    res.json({ message: 'Payment verified successfully', orderId: order._id });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};

/**
 * @desc    Get Payment Status
 * @route   GET /api/payment/status/:orderId
 * @access  Private
 */
const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Users can only view their own payments unless admin
    if (payment.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
       return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentStatus,
};
