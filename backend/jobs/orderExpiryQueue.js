const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

const connection = process.env.REDIS_URL 
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null,
    });

const orderExpiryQueue = new Queue('order-expiry', { connection });

/**
 * Enqueue order for expiration checking.
 * @param {ObjectId} orderId 
 * @param {ObjectId} paymentId
 * @param {number} delayMs - Milliseconds until execution
 */
const queueOrderExpiry = async (orderId, paymentId, delayMs) => {
    await orderExpiryQueue.add('check-expiry', { orderId, paymentId }, {
        delay: delayMs,
        attempts: 2,
    });
};

const orderExpiryWorker = new Worker('order-expiry', async (job) => {
    const { orderId, paymentId } = job.data;

    const payment = await Payment.findById(paymentId);
    if (!payment) return { status: 'skipped', reason: 'Payment record missing' };

    if (payment.status === 'created') {
        console.log(`Order ${orderId} expired without payment. Cancelling.`);
        
        // Mark payment failed/expired
        payment.status = 'failed';
        payment.notes = { ...payment.notes, reason: 'unpaid_timeout' };
        await payment.save();

        // Mark sequence of orders failed
        const order = await Order.findById(orderId);
        if (order) {
            order.status = 'Cancelled';
            order.paymentStatus = 'failed';
            await order.save();
        }

        const VendorOrder = require('../models/VendorOrder');
        await VendorOrder.updateMany(
            { order: orderId },
            { $set: { status: 'cancelled' } }
        );

        // TODO: Restore Product Inventory if items were deducted upon creation
    }

    return { status: 'processed' };
}, { connection });

orderExpiryWorker.on('failed', (job, err) => {
    console.error(`Expiry Job ${job.id} failed:`, err);
});

module.exports = { queueOrderExpiry };
