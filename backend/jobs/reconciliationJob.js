const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const razorpayClient = require('../config/razorpay');

const connection = process.env.REDIS_URL 
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null,
    });

// Creates a queue that repeats daily
const reconciliationQueue = new Queue('daily-reconciliation', { connection });

// Schedule job to run at midnight daily
// Note: Normally called once at startup.
const scheduleReconciliation = async () => {
    // BullMQ repeat pattern
    await reconciliationQueue.add('reconcile-payments', {}, {
        repeat: { cron: '0 0 * * *' } // Midnight everyday
    });
};

const reconciliationWorker = new Worker('daily-reconciliation', async (job) => {
    console.log('[Reconciliation] Starting daily payment reconciliation...');
    
    // Look back at the last 24 hours
    const to = Math.floor(Date.now() / 1000);
    const from = to - (24 * 60 * 60);

    let stats = {
        matched: 0,
        fixed: 0,
        flagged: 0,
        fetched: 0
    };

    try {
        // Fetch all successful & failed payments from Razorpay in the last 24h
        const rzpPayments = await razorpayClient.payments.all({
            from,
            to,
            count: 100, // Handle pagination if over 100 per day in production
        });
        
        stats.fetched = rzpPayments.items.length;

        for (const rzpPayment of rzpPayments.items) {
            const dbPayment = await Payment.findOne({ razorpay_order_id: rzpPayment.order_id });
            
            if (!dbPayment) {
                console.warn(`[Reconciliation] Flagged: Payment ${rzpPayment.id} exists in Razorpay but no local Payment record.`);
                stats.flagged++;
                // In production, insert into a ManualReview collection or alert admin
                continue;
            }

            // 1. Missing Capture: Paid on Razorpay, but DB is 'created'
            if (rzpPayment.status === 'captured' && dbPayment.status !== 'captured') {
                console.log(`[Reconciliation] Fixed: Marking payment ${dbPayment._id} as captured.`);
                dbPayment.status = 'captured';
                dbPayment.razorpay_payment_id = rzpPayment.id;
                dbPayment.paymentMethod = rzpPayment.method;
                dbPayment.reconciliationStatus = 'fixed';
                dbPayment.reconciledAt = new Date();
                dbPayment.expiresAt = null;
                await dbPayment.save();

                // Also update Order
                const order = await Order.findById(dbPayment.orderId);
                if (order && !order.isPaid) {
                    order.isPaid = true;
                    order.paidAt = Date.now();
                    order.paymentStatus = 'captured';
                    order.expiresAt = null;
                    if(order.paymentMethod === 'COD') order.paymentMethod = 'Online';
                    await order.save();
                }
                stats.fixed++;
            }
            // 2. Missing Failure: Failed on Razorpay, but DB is 'created'
            else if (rzpPayment.status === 'failed' && dbPayment.status === 'created') {
                console.log(`[Reconciliation] Fixed: Marking payment ${dbPayment._id} as failed.`);
                dbPayment.status = 'failed';
                dbPayment.reconciliationStatus = 'fixed';
                dbPayment.reconciledAt = new Date();
                await dbPayment.save();

                const order = await Order.findById(dbPayment.orderId);
                if (order) { order.paymentStatus = 'failed'; await order.save(); }
                stats.fixed++;
            }
            // 3. Matched Successfully
            else {
                dbPayment.reconciliationStatus = 'matched';
                dbPayment.reconciledAt = new Date();
                await dbPayment.save();
                stats.matched++;
            }
        }

        console.log(`[Reconciliation] Complete. Stats:`, stats);
        return stats;

    } catch (error) {
        console.error('[Reconciliation] Failed during execution:', error);
        throw error;
    }

}, { connection });

// Provide this for server startup to initialize
module.exports = { scheduleReconciliation };
