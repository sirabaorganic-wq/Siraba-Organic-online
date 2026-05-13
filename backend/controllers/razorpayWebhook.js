const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const VendorOrder = require('../models/VendorOrder');
const WebhookLog = require('../models/WebhookLog');
const RefundLog = require('../models/RefundLog');
// const { enqueueTransfer } = require('../jobs/transferQueue'); // Will implement shortly

/**
 * Handle incoming Razorpay Webhooks
 * This endpoint MUST use raw body parsing (express.raw) for signature validation.
 */
const handleWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        
        if (!secret || !signature) {
            console.warn('Webhook blocked: Missing secret or signature');
            return res.status(400).send('Missing signature or secret not configured');
        }

        // req.body is a raw Buffer because of express.raw
        const rawBody = req.body;
        
        let isValid = false;
        try {
            isValid = Razorpay.validateWebhookSignature(rawBody.toString(), signature, secret);
        } catch (e) {
            console.error('Webhook signature validation threw error:', e);
            return res.status(400).send('Signature validation failed');
        }

        if (!isValid) {
            console.warn('Webhook blocked: Invalid signature');
            return res.status(400).send('Invalid signature');
        }

        // Now parse the raw body into JSON
        const payload = JSON.parse(rawBody.toString());
        const eventId = payload.account_id + '_' + payload.event + '_' + payload.payload.payment?.entity?.id;
        
        // Idempotency check: Have we processed this event already?
        const existingLog = await WebhookLog.findOne({ eventId });
        if (existingLog) {
            return res.status(200).send('Event already processed');
        }

        const currentEvent = payload.event;
        
        // Log immediately to prevent race conditions
        const logEntry = await WebhookLog.create({
            eventId,
            source: 'razorpay',
            event_type: currentEvent,
            status: 'processing',
            payload: payload
        });

        // Background processing without blocking Razorpay (Razorpay expects 2xx within 5 seconds)
        processEvent(currentEvent, payload.payload).then(async () => {
             logEntry.status = 'processed';
             logEntry.processedAt = new Date();
             await logEntry.save();
        }).catch(async (error) => {
             console.error(`Webhook processing failed for event ${currentEvent}:`, error);
             logEntry.status = 'failed';
             await logEntry.save();
        });

        // Always acknowledge receipt fast
        res.status(200).send('Webhook received');

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Internal Error');
    }
};

/**
 * Async Event Processor
 */
async function processEvent(event, data) {
    switch (event) {
        case 'payment.captured':
        case 'order.paid':
            await handlePaymentCaptured(data);
            break;
        case 'payment.failed':
            await handlePaymentFailed(data);
            break;
        case 'refund.processed':
            await handleRefundProcessed(data);
            break;
        case 'transfer.processed':
        case 'transfer.failed':
            // await handleTransferEvent(event, data); // To be implemented with VendorTransfer
            break;
        default:
            console.log(`Unhandled Razorpay event: ${event}`);
    }
}

/**
 * Payment Captured logic
 * This is a secondary check in case frontend failed to call /api/payment/verify
 */
async function handlePaymentCaptured(data) {
    const paymentEntity = data.payment?.entity;
    if (!paymentEntity) return;

    const rzpOrderId = paymentEntity.order_id;
    const payment = await Payment.findOne({ razorpay_order_id: rzpOrderId });
    
    if (!payment) {
        console.error(`Webhook Warning: Payment record not found for order ${rzpOrderId}`);
        return;
    }

    // Unnecessary to process if already captured by frontend
    if (payment.status === 'captured') {
        const { enqueueTransfer } = require('../jobs/transferQueue');
        if (enqueueTransfer) { await enqueueTransfer(payment._id); }
        return;
    }

    // Update Payment 
    payment.status = 'captured';
    payment.razorpay_payment_id = paymentEntity.id;
    payment.expiresAt = null;
    payment.paymentMethod = paymentEntity.method;
    payment.bank = paymentEntity.bank;
    payment.wallet = paymentEntity.wallet;
    payment.vpa = paymentEntity.vpa;
    await payment.save();

    // Update Main Order
    const order = await Order.findById(payment.orderId);
    if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = 'captured';
        order.expiresAt = null;
        if (order.paymentMethod === 'COD') order.paymentMethod = 'Online';
        order.status = 'Pending Vendor Approval';
        await order.save();

        // Enqueue SHIPROCKET integration
        const { enqueueShipment } = require('../jobs/shiprocketQueue');
        const vendorOrders = await VendorOrder.find({ order: order._id });
        for (const vo of vendorOrders) {
            vo.status = 'pending';
            await vo.save();
            try { await enqueueShipment(vo._id, order._id, vo.vendor); } 
            catch(ignored) {}
        }
    }

    // Enqueue Vendor Transfers (Razorpay Route)
    const { enqueueTransfer } = require('../jobs/transferQueue');
    if (enqueueTransfer) {
        await enqueueTransfer(payment._id);
    }
}

async function handlePaymentFailed(data) {
    const paymentEntity = data.payment?.entity;
    if (!paymentEntity) return;

    const rzpOrderId = paymentEntity.order_id;
    const payment = await Payment.findOne({ razorpay_order_id: rzpOrderId });
    if (!payment) return;

    payment.status = 'failed';
    // Let the TTL feature auto delete it, or maybe preserve it. We preserve it.
    await payment.save();

    const order = await Order.findById(payment.orderId);
    if (order) {
        order.paymentStatus = 'failed';
        await order.save();
    }
}

async function handleRefundProcessed(data) {
    const refundEntity = data.refund?.entity;
    if (!refundEntity) return;

    const rzpRefundId = refundEntity.id;
    const refundLog = await RefundLog.findOne({ razorpay_refund_id: rzpRefundId });
    if (refundLog) {
        refundLog.status = 'Processed';
        await refundLog.save();
        
        // Could trigger notification here
    }
}

module.exports = {
    handleWebhook
};
