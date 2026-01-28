const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');
const paymentService = require('../services/paymentService');

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
    try {
        const { amount, receipt } = req.body;
        const order = await paymentService.createOrder(amount, receipt);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Error:", error);
        res.status(500).json({ message: "Payment creation failed", error: error.message });
    }
});

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payment/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

        const isValid = paymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (isValid) {
            // Payment Verified

            // Update Order Status in Database
            const order = await Order.findById(order_id);
            if (order) {
                order.isPaid = true;
                order.paidAt = Date.now();

                // Add payment details
                order.paymentResult = {
                    id: razorpay_payment_id,
                    status: 'completed',
                    update_time: Date.now(),
                    email_address: req.user.email,
                };

                // If payment was default COD, change it
                if (order.paymentMethod === 'COD') {
                    order.paymentMethod = 'Online';
                }

                order.status = 'Pending Vendor Approval'; // Set initial status as per workflow

                await order.save();

                // Also update Vendor Orders if they exist (though usually they are created after payment success in some flows, 
                // but here Order is created first then Paid)
                const VendorOrder = require('../models/VendorOrder');
                // We might need to update status of vendor orders too if they were created in 'pending payment' state
                // Based on previous orderRoutes.js code, the order is created first. 
                // Assuming VendorOrders are created at checkout time or post-payment. 
                // If they were created at 'places order' step, we update them here.

                const vendorOrders = await VendorOrder.find({ order: order._id });
                for (const vo of vendorOrders) {
                    vo.status = 'pending'; // Ensure they are pending approval
                    await vo.save();
                }

                res.json({ message: "Payment successful", orderId: order._id });
            } else {
                res.status(404).json({ message: "Order not found" });
            }

        } else {
            res.status(400).json({ message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
