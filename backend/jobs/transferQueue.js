const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const Payment = require('../models/Payment');
const VendorOrder = require('../models/VendorOrder');
const Vendor = require('../models/Vendor');
const VendorTransfer = require('../models/VendorTransfer');
const { initiateTransfer } = require('../services/paymentService');

const connection = process.env.REDIS_URL 
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null,
    });

const transferQueue = new Queue('vendor-transfers', { connection });

/**
 * Enqueue standard split payment transfers for a captured Razorpay order.
 * @param {ObjectId} paymentId
 */
const enqueueTransfer = async (paymentId) => {
    // Only process if Razorpay connection is available & enabled in logic
    await transferQueue.add('process-transfer', { paymentId }, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000, // 5s, 10s, 20s
        },
    });
};

const transferWorker = new Worker('vendor-transfers', async (job) => {
    const { paymentId } = job.data;
    
    // 1. Fetch Payment Data
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.status !== 'captured') {
        throw new Error(`Invalid or uncaptured payment: ${paymentId}`);
    }

    // 2. Fetch all vendor orders associated with this main order
    const vendorOrders = await VendorOrder.find({ order: payment.orderId }).populate('vendor');
    
    if (vendorOrders.length === 0) {
        return { success: true, message: 'No vendor orders found to transfer' };
    }

    const transfersPayload = [];
    const vendorTransferDocs = [];

    // 3. Process each vendor's cut
    for (const vo of vendorOrders) {
        const vendor = vo.vendor;
        if (!vendor.razorpay_linked_account_id) {
            console.warn(`Vendor ${vendor._id} has no linked account for Razorpay Route. Skipping transfer.`);
            continue; // Fallback to wallet system or manual admin action
        }

        // Check if we already created a transfer for this vendor order
        const existingTransfers = await VendorTransfer.find({ vendor_order_id: vo._id });
        if (existingTransfers.length > 0) continue; // Already processed or queued

        // Calculate commission
        // Use Platform Commission default if vendor specific is missing
        const platformCommission = Number(process.env.PLATFORM_COMMISSION_RATE) || 10;
        const commissionRate = vendor.commissionRate !== undefined ? vendor.commissionRate : platformCommission;
        
        const grossAmount = vo.totalAmount; // IN INR
        const commissionAmount = (grossAmount * commissionRate) / 100;
        const netVendorAmount = grossAmount - commissionAmount;

        transfersPayload.push({
            account: vendor.razorpay_linked_account_id,
            amount: netVendorAmount,
            currency: 'INR',
            notes: {
                vendor_order_id: vo._id.toString(),
                order_id: payment.orderId.toString()
            }
        });

        vendorTransferDocs.push({
            payment_id: payment._id,
            razorpay_payment_id: payment.razorpay_payment_id,
            vendor_id: vendor._id,
            vendor_order_id: vo._id,
            razorpay_linked_account_id: vendor.razorpay_linked_account_id,
            amount: Math.round(netVendorAmount * 100), // stored in paise
            gross_amount: Math.round(grossAmount * 100),
            commission_rate: commissionRate,
            commission_amount: Math.round(commissionAmount * 100),
            status: 'initiated'
        });
    }

    // If no transfers are prepared
    if (transfersPayload.length === 0) {
        return { success: true, message: 'No eligible vendors for Route transfer.' };
    }

    try {
        // 4. API Call to Razorpay Route
        const transferResponse = await initiateTransfer(payment.razorpay_payment_id, transfersPayload);
        
        // 5. Update Local Records
        // transferResponse could contain multiple items. They usually start with 'trf_'
        // It's a complex object. We just mark ours as processed or initiated.
        for (const doc of vendorTransferDocs) {
             const createdDoc = await VendorTransfer.create(doc);
             // Webhooks will update the exact trf_id later, or we can parse from response.
             // Simplest for now: just record our initiated attempt.
        }

        return { success: true, count: transfersPayload.length };
    } catch (error) {
        console.error('Razorpay Route Transfer Error:', error);
        throw error; // Will trigger BullMQ retry
    }

}, { connection });

transferWorker.on('failed', async (job, err) => {
    console.error(`Job ${job.id} failed for payment ${job.data.paymentId}:`, err.message);
    if (job.attemptsMade === job.opts.attempts) {
        // Max retries reached. Mark transfer as permanently_failed or notify admin.
        // Needs admin intervention to manually transfer.
    }
});

module.exports = { enqueueTransfer };
