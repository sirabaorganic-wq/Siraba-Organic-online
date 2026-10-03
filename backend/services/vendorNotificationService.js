/**
 * SIRABA ORGANIC — VENDOR NOTIFICATION EVENT DISPATCHER
 * Authoritative entry point for dispatching all vendor shipment & order notifications.
 * Non-blocking, idempotent, and resilient against Redis/channel failures.
 */

'use strict';

const { notificationQueue, processNotificationJob } = require('../jobs/vendorNotificationQueue');
const {
  VENDOR_NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SEVERITIES,
  VENDOR_EVENT_CONFIG,
} = require('../constants/notificationConstants');

/**
 * Generate a deterministic event ID to guarantee idempotency across retries, webhooks, and workers.
 *
 * @param {string} vendorOrderId
 * @param {string} orderId
 * @param {string} eventType
 * @param {string|number|Date} [timestampOrScan]
 * @returns {string} Safe, deterministic event ID
 */
const generateEventId = (vendorOrderId, orderId, eventType, timestampOrScan, discriminator) => {
  const targetId = vendorOrderId || orderId || 'order';
  const parts = ['vn', targetId, eventType];

  if (timestampOrScan) {
    const ts = new Date(timestampOrScan).getTime() || String(timestampOrScan);
    parts.push(ts);
  }
  if (discriminator) {
    parts.push(String(discriminator));
  }

  const raw = parts.join('_');
  return raw.replace(/[^a-zA-Z0-9_.-]/g, '_');
};

/**
 * Dispatches an event to the vendor notification system asynchronously.
 * Guarantees that failure to notify NEVER throws an uncaught error back to calling logistics/payment code.
 *
 * @param {object} params
 * @param {string} params.eventType - One of VENDOR_NOTIFICATION_EVENTS
 * @param {string|ObjectId} params.vendorId - Target Vendor ID
 * @param {string|ObjectId} [params.vendorOrderId] - Target VendorOrder ID
 * @param {string|ObjectId} [params.orderId] - Parent Order ID
 * @param {object} [params.metadata] - Operational context (AWB, courier, items, customer city, etc.)
 * @param {string} [params.customTitle] - Optional custom title override
 * @param {string} [params.customMessage] - Optional custom message override
 * @param {string|Date} [params.eventTimestamp] - Optional timestamp for webhook scan deduplication
 * @returns {Promise<{ success: boolean, eventId?: string, queued?: boolean, error?: string }>}
 */
const dispatchVendorNotification = async ({
  eventType,
  vendorId,
  vendorOrderId,
  orderId,
  metadata = {},
  customTitle,
  customMessage,
  eventTimestamp,
}) => {
  try {
    if (!vendorId) {
      // Direct platform or unassigned vendor, skip silently
      return { success: false, reason: 'No vendorId associated with event' };
    }

    if (!Object.values(VENDOR_NOTIFICATION_EVENTS).includes(eventType)) {
      console.warn(`[VendorNotificationService] Unrecognized eventType: ${eventType}`);
    }

    // Determine event configuration
    const config = VENDOR_EVENT_CONFIG[eventType] || {};
    const category = config.category || NOTIFICATION_CATEGORIES.LOGISTICS;
    const severity = config.severity || NOTIFICATION_SEVERITIES.INFO;

    // Resolve Title and Message
    let title = customTitle;
    if (!title && typeof config.titleTemplate === 'function') {
      title = config.titleTemplate(metadata);
    } else if (!title) {
      title = config.titleTemplate || 'Order Update';
    }

    let message = customMessage;
    if (!message && typeof config.messageTemplate === 'function') {
      message = config.messageTemplate(metadata);
    } else if (!message) {
      message = config.messageTemplate || 'An update occurred on your order.';
    }

    // Generate deterministic eventId for idempotency
    const discriminator = metadata.pickupToken || metadata.pickupScheduledDate || metadata.attemptCount || '';
    const eventId = metadata.eventId || generateEventId(
      vendorOrderId,
      orderId,
      eventType,
      eventTimestamp || metadata.statusTimestamp,
      discriminator
    );

    const jobData = {
      eventId,
      eventType,
      vendorId: String(vendorId),
      vendorOrderId: vendorOrderId ? String(vendorOrderId) : undefined,
      orderId: orderId ? String(orderId) : undefined,
      category,
      severity,
      title,
      message,
      metadata,
      createdAt: new Date(),
    };

    // Attempt asynchronous delivery via BullMQ
    try {
      await notificationQueue.add('deliver-notification', jobData, {
        jobId: `job_${eventId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      });

      return { success: true, eventId, queued: true };
    } catch (queueErr) {
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction) {
        // IN PRODUCTION: Redis/BullMQ is authoritative. We NEVER silently downgrade to synchronous in-process execution.
        // We log a critical alert for monitoring and return a clear failure without breaking core logistics.
        console.error(`[CRITICAL][VendorNotificationService] BullMQ enqueue failed in production for event ${eventId}:`, queueErr.message);
        return { success: false, eventId, queued: false, error: `Queue unavailable: ${queueErr.message}` };
      }

      // IN TEST / DEVELOPMENT ONLY: Fallback to direct in-process processing to allow local testing without Redis.
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[VendorNotificationService][NON-PROD FALLBACK] Queue add failed, falling back to direct processing:`, queueErr.message);
      }
      const directResult = await processNotificationJob(jobData);
      return { ...directResult, queued: false };
    }
  } catch (error) {
    // Non-blocking rule: Never crash the calling checkout/shipment/webhook flow
    console.error(`[VendorNotificationService] Unexpected error dispatching ${eventType}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  dispatchVendorNotification,
  generateEventId,
  VENDOR_NOTIFICATION_EVENTS,
};
