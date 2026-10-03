/**
 * SIRABA ORGANIC — VENDOR NOTIFICATION QUEUE & WORKER
 * Production-grade BullMQ queue for asynchronous, idempotent vendor notification delivery.
 * Delivers across 3 channels:
 *  1. Database (Notification model with unique eventId)
 *  2. Realtime WebSocket (Socket.IO vendor:{vendorId} private room)
 *  3. Transactional Email (Nodemailer HTML templates)
 */

'use strict';

const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const Notification = require('../models/Notification');
const Vendor = require('../models/Vendor');
const socketManager = require('../utils/socketManager');
const { sendVendorShipmentEmail } = require('../utils/vendorEmailService');
const {
  VENDOR_NOTIFICATION_EVENTS,
  NOTIFICATION_SEVERITIES,
  VENDOR_EVENT_CONFIG,
} = require('../constants/notificationConstants');

// BullMQ Redis connection configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisConnection = null;

try {
  redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 5) return null; // stop reconnecting if redis is not running (e.g. local unit tests)
      return Math.min(times * 1000, 3000);
    },
  });
  redisConnection.on('error', (err) => {
    // Prevent unhandled error crashing in test/dev environments without Redis
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[VendorNotificationQueue] Redis connection warning:', err.message);
    }
  });
} catch (e) {
  console.warn('[VendorNotificationQueue] Failed to initialize Redis connection:', e.message);
}

const NOTIFICATION_QUEUE_NAME = 'vendor-notifications';

const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
  connection: redisConnection,
});

/**
 * Core notification processor function
 * Extracted so it can be executed either via BullMQ Worker OR directly as fallback in test environments.
 *
 * @param {object} data - Notification job payload
 * @returns {Promise<{ success: boolean, notificationId: string, eventId: string, emailSent: boolean }>}
 */
const processNotificationJob = async (data) => {
  const {
    eventId,
    eventType,
    vendorId,
    vendorOrderId,
    orderId,
    category,
    severity,
    title,
    message,
    metadata = {},
  } = data;

  if (!vendorId) {
    console.warn('[VendorNotificationWorker] Missing vendorId, skipping notification');
    return { success: false, reason: 'Missing vendorId' };
  }

  // 1. DB Persistence with Idempotency
  let notification = null;
  try {
    notification = await Notification.create({
      eventId,
      vendor: vendorId,
      vendorOrder: vendorOrderId,
      order: orderId,
      eventType,
      category,
      severity: severity || NOTIFICATION_SEVERITIES.INFO,
      title: title || 'Notification Update',
      message: message || title || 'Notification Update',
      metadata,
      recipient: vendorId,
      recipientModel: 'Vendor',
      type: severity === NOTIFICATION_SEVERITIES.ERROR ? 'error' : (severity === NOTIFICATION_SEVERITIES.SUCCESS ? 'success' : 'info'),
      isRead: false,
    });
  } catch (err) {
    if (err.code === 11000 || (err.message && err.message.includes('duplicate key'))) {
      // Idempotency: Event already recorded in database. Retrieve existing record
      notification = await Notification.findOne({ eventId });
      if (!notification) {
        throw err;
      }
    } else {
      throw err;
    }
  }

  // 2. Realtime WebSocket Emission to Private Vendor Room
  try {
    const socketPayload = {
      _id: notification._id,
      eventId: notification.eventId,
      eventType: notification.eventType,
      category: notification.category,
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      vendorOrderId: notification.vendorOrder,
      orderId: notification.order,
      metadata: notification.metadata,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
    const emitted = socketManager.emitToVendor(vendorId, 'vendor:notification', socketPayload);
    if (emitted && !notification.socketEmitted) {
      notification.socketEmitted = true;
      await Notification.updateOne({ _id: notification._id }, { $set: { socketEmitted: true } });
    }
  } catch (socketErr) {
    console.warn(`[VendorNotificationWorker] Socket emission failed for event ${eventId}:`, socketErr.message);
  }

  // 3. Transactional Email Dispatch (if configured for this event type)
  const eventConfig = VENDOR_EVENT_CONFIG[eventType] || {};
  const shouldSendEmail = Boolean(eventConfig.email);

  if (shouldSendEmail && !notification.emailSent) {
    try {
      // Atomic claim to close crash window: only 1 worker can attempt email dispatch
      const claimed = await Notification.findOneAndUpdate(
        {
          _id: notification._id,
          emailSent: false,
          $or: [
            { emailClaimedAt: null },
            { emailClaimedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } }, // 5 min lock timeout
          ],
        },
        {
          $set: { emailClaimedAt: new Date() },
        },
        { new: true }
      );

      if (claimed) {
        const vendor = await Vendor.findById(vendorId).select('email businessName name storeName');
        if (vendor && vendor.email) {
          const orderNumber = metadata.orderNumber || (orderId ? String(orderId).slice(-8) : '');
          const vendorOrderNumber = metadata.vendorOrderNumber || (vendorOrderId ? String(vendorOrderId).slice(-8) : '');

          const emailResult = await sendVendorShipmentEmail({
            vendorEmail: vendor.email,
            vendorName: vendor.businessName || vendor.storeName || vendor.name,
            eventType,
            orderNumber,
            vendorOrderNumber,
            title,
            eventId: notification.eventId,
            metadata,
          });

          if (emailResult.success) {
            notification.emailSent = true;
            notification.emailSentAt = new Date();
            await Notification.updateOne(
              { _id: notification._id },
              { $set: { emailSent: true, emailSentAt: new Date() } }
            );
          } else {
            // Release claim if sending failed with retryable error
            await Notification.updateOne(
              { _id: notification._id },
              { $set: { emailClaimedAt: null } }
            );
          }
        }
      }
    } catch (emailErr) {
      console.warn(`[VendorNotificationWorker] Email delivery failed for event ${eventId}:`, emailErr.message);
      // Release lock on error
      try {
        await Notification.updateOne({ _id: notification._id }, { $set: { emailClaimedAt: null } });
      } catch (_) {}
      // Do not rethrow: email failures should not crash or infinitely retry if non-recoverable
    }
  }

  return {
    success: true,
    notificationId: String(notification._id),
    eventId: notification.eventId,
    emailSent: Boolean(notification.emailSent),
  };
};

// Initialize BullMQ Worker
const notificationWorker = new Worker(
  NOTIFICATION_QUEUE_NAME,
  async (job) => {
    return await processNotificationJob(job.data);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

notificationWorker.on('completed', (job) => {
  // Debug / observability log
  if (process.env.DEBUG_NOTIFICATIONS === 'true') {
    console.log(`[VendorNotificationWorker] Job ${job.id} completed successfully`);
  }
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[VendorNotificationWorker] Job ${job?.id} failed:`, err.message);
});

module.exports = {
  notificationQueue,
  notificationWorker,
  processNotificationJob,
};
