const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_S4Bjzskav8pss5",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "GyciaxkKTcHlXxs0j4vYNn5R",
});

/**
 * Create a Razorpay Order
 * @param {number} amount - Amount in INR
 * @param {string} receipt - Receipt ID
 * @returns {Promise<Object>} Razorpay Order Object
 */
const createOrder = async (amount, receipt) => {
    const options = {
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        receipt,
        payment_capture: 1
    };
    return await razorpay.orders.create(options);
};

/**
 * Verify Razorpay Signature
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature
 * @returns {boolean} isValid
 */
const verifyPayment = (orderId, paymentId, signature) => {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "GyciaxkKTcHlXxs0j4vYNn5R")
        .update(body.toString())
        .digest('hex');
    return expectedSignature === signature;
};

/**
 * Refund a Payment
 * @param {string} paymentId - Razorpay Payment ID
 * @param {number} amount - Amount to refund (optional, defaults to full)
 * @returns {Promise<Object>} Refund Object
 */
const refundPayment = async (paymentId, amount) => {
    const options = {};
    if (amount) {
        options.amount = Math.round(amount * 100); // Amount in paise
    }
    return await razorpay.payments.refund(paymentId, options);
};

module.exports = {
    createOrder,
    verifyPayment,
    refundPayment
};
