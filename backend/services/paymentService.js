const Razorpay = require('razorpay');
const crypto = require('crypto');
const razorpayClient = require('../config/razorpay');

/**
 * Payment Service
 * Handles all direct interactions with the Razorpay API.
 */

/**
 * Create a Razorpay Order
 * @param {number} amount - Amount in INR (will be converted to paise internally)
 * @param {string} receipt - Receipt ID (usually the local Order ID stringified)
 * @param {object} notes - Key-value pair for custom metadata
 * @returns {Promise<Object>} Razorpay Order Object
 */
const createRazorpayOrder = async (amount, receipt, notes = {}) => {
  const options = {
    amount: Math.round(amount * 100), // Convert INR to paise
    currency: 'INR',
    receipt: receipt.toString(),
    notes,
    payment_capture: 1, // Automatically capture payment
  };

  try {
    return await razorpayClient.orders.create(options);
  } catch (error) {
    console.error('Razorpay Error: createRazorpayOrder failed', error);
    throw new Error(error.error?.description || 'Failed to create payment order');
  }
};

/**
 * Verify Razorpay Signature (HMAC SHA256)
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature sent from frontend
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Initiate Refund for a Payment
 * @param {string} paymentId - Razorpay Payment ID starting with 'pay_'
 * @param {number} [amount] - Amount to refund in INR (if not provided, fully refunds)
 * @param {string} [reason] - Log reason
 * @param {string} speed - 'normal' (5-7 days) or 'optimum' (instant where possible)
 * @returns {Promise<Object>} Razorpay Refund Object
 */
const initiateRefund = async (paymentId, amount = null, reason = 'customer_requested', speed = 'normal') => {
  const options = {
    speed,
    notes: { reason },
  };

  if (amount) {
    options.amount = Math.round(amount * 100); // Amount in paise
  }

  try {
    return await razorpayClient.payments.refund(paymentId, options);
  } catch (error) {
    console.error('Razorpay Error: initiateRefund failed', error);
    throw new Error(error.error?.description || 'Failed to initiate refund');
  }
};

/**
 * Initiate Split Payment Transfers (Razorpay Route)
 * @param {string} paymentId - Captured Razorpay Payment ID
 * @param {Array<Object>} transfers - Array of transfer details
 *        e.g., [{ account: 'acc_...', amount: 500, currency: 'INR', on_hold: 0 }]
 * @returns {Promise<Object>} Result of the transfer
 */
const initiateTransfer = async (paymentId, transfers) => {
  try {
    const formattedTransfers = transfers.map(t => ({
      ...t,
      amount: Math.round(t.amount * 100), // convert to paise
    }));

    return await razorpayClient.payments.transfer(paymentId, { transfers: formattedTransfers });
  } catch (error) {
    console.error('Razorpay Error: initiateTransfer failed', error);
    throw new Error(error.error?.description || 'Failed to route payment to vendors');
  }
};

/**
 * Fetch Payment Details
 * @param {string} paymentId 
 * @returns {Promise<Object>}
 */
const fetchPaymentDetails = async (paymentId) => {
  try {
    return await razorpayClient.payments.fetch(paymentId);
  } catch (error) {
    console.error('Razorpay Error: fetchPaymentDetails failed', error);
    throw new Error(error.error?.description || 'Failed to fetch payment stats');
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  initiateRefund,
  initiateTransfer,
  fetchPaymentDetails,
};
