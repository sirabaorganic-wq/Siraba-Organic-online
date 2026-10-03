const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const shiprocketService = require('../services/shiprocketService');
const VendorOrder = require('../models/VendorOrder');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');

// Setup Redis Connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Create the Queue
const shipmentQueue = new Queue('shiprocket-shipments', { connection });

// Function to add jobs to the queue
const enqueueShipment = async (vendorOrderId, orderId, vendorId) => {
  await shipmentQueue.add('create-shipment', {
    vendorOrderId, orderId, vendorId
  }, {
    jobId: `shipment_${vendorOrderId}`,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s, 10s, 20s
    }
  });
};

// Create the Worker
const shipmentWorker = new Worker('shiprocket-shipments', async job => {
  const { vendorOrderId, orderId, vendorId } = job.data;

  const vendorOrder = await VendorOrder.findById(vendorOrderId);
  const order = await Order.findById(orderId);
  let vendor = vendorId ? await Vendor.findById(vendorId) : null;

  if (!vendor && !vendorId) {
    // Platform / Admin direct product - strictly requires configured location
    const platformLocation = (process.env.SHIPROCKET_PRIMARY_LOCATION || "").trim();
    if (!platformLocation) {
      const err = new Error('Platform pickup location is not configured (SHIPROCKET_PRIMARY_LOCATION missing in environment). Cannot route shipment.');
      err.code = 'PLATFORM_PICKUP_LOCATION_NOT_CONFIGURED';
      throw err;
    }

    vendor = {
      _id: null,
      businessName: "SIRABA Organic Direct",
      phone: process.env.PLATFORM_PHONE || "8586836660",
      email: process.env.PLATFORM_EMAIL || "support@sirabaorganic.com",
      shiprocket_pickup_code: platformLocation,
      pickupAddress: {
        facilityName: platformLocation,
        shiprocketLocationName: platformLocation,
        addressLine1: "SIRABA Fulfillment Facility",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122102",
        country: "India",
      },
    };
  }

  if (!vendorOrder || !order || !vendor) {
    throw new Error('Referenced entities not found for shipment');
  }

  // Idempotency check: don't create if already exists
  if (vendorOrder.shiprocketOrderId || vendorOrder.awbCode) {
    return { skipped: true, reason: 'Shipment already exists for this VendorOrder' };
  }

  // Generate shipment via service (creates shipment, assigns AWB, and automatically requests pickup)
  const shipmentResult = await shiprocketService.createShipment(vendorOrder, order, vendor);

  // Update VendorOrder
  vendorOrder.shiprocketOrderId = shipmentResult.shiprocketOrderId;
  vendorOrder.shipmentId = shipmentResult.shipmentId;
  vendorOrder.awbCode = shipmentResult.awbCode;
  vendorOrder.courierName = shipmentResult.courierName;
  vendorOrder.courierId = shipmentResult.courierId;
  vendorOrder.shippingRoutingCode = shipmentResult.routingCode;
  vendorOrder.labelUrl = shipmentResult.labelUrl;

  // Persist pickup scheduling outcome (BUG-01 Fix)
  if (shipmentResult.pickupScheduled) {
    vendorOrder.status = 'pickup_scheduled';
    vendorOrder.pickupScheduledAt = shipmentResult.pickupScheduledAt || new Date();
    if (shipmentResult.pickupTokenNumber) {
      vendorOrder.pickupTokenNumber = String(shipmentResult.pickupTokenNumber);
    }
  } else {
    vendorOrder.status = 'processing';
    if (shipmentResult.pickupError) {
      vendorOrder.shipmentError = {
        code: 'PICKUP_SCHEDULING_FAILED',
        message: shipmentResult.pickupError,
        timestamp: new Date()
      };
    }
  }

  await vendorOrder.save();

  // Dispatch Canonical Vendor Shipment Notifications (Asynchronous)
  if (vendorOrder.vendor) {
    try {
      const { dispatchVendorNotification, VENDOR_NOTIFICATION_EVENTS } = require('../services/vendorNotificationService');
      const baseMeta = {
        orderNumber: order?._id ? String(order._id).slice(-8) : String(vendorOrder.order).slice(-8),
        vendorOrderNumber: String(vendorOrder._id).slice(-8),
        awbCode: shipmentResult.awbCode,
        courierName: shipmentResult.courierName,
        pickupToken: shipmentResult.pickupTokenNumber ? String(shipmentResult.pickupTokenNumber) : undefined,
        pickupScheduledDate: shipmentResult.pickupScheduledAt ? new Date(shipmentResult.pickupScheduledAt).toLocaleDateString('en-IN') : undefined,
        deliveryCity: vendorOrder.shippingAddress?.city,
        deliveryState: vendorOrder.shippingAddress?.state,
        deliveryPincode: vendorOrder.shippingAddress?.postalCode,
      };

      if (shipmentResult.shipmentId) {
        await dispatchVendorNotification({
          eventType: VENDOR_NOTIFICATION_EVENTS.SHIPMENT_CREATED,
          vendorId: vendorOrder.vendor,
          vendorOrderId: vendorOrder._id,
          orderId: order._id,
          metadata: baseMeta,
        });
      }

      if (shipmentResult.awbCode) {
        await dispatchVendorNotification({
          eventType: VENDOR_NOTIFICATION_EVENTS.AWB_ASSIGNED,
          vendorId: vendorOrder.vendor,
          vendorOrderId: vendorOrder._id,
          orderId: order._id,
          metadata: baseMeta,
        });
      }

      if (shipmentResult.pickupScheduled) {
        await dispatchVendorNotification({
          eventType: VENDOR_NOTIFICATION_EVENTS.PICKUP_SCHEDULED,
          vendorId: vendorOrder.vendor,
          vendorOrderId: vendorOrder._id,
          orderId: order._id,
          metadata: baseMeta,
        });
      } else if (shipmentResult.pickupError) {
        await dispatchVendorNotification({
          eventType: VENDOR_NOTIFICATION_EVENTS.PICKUP_FAILED,
          vendorId: vendorOrder.vendor,
          vendorOrderId: vendorOrder._id,
          orderId: order._id,
          metadata: {
            ...baseMeta,
            failureReason: shipmentResult.pickupError,
          },
        });
      }
    } catch (notifErr) {
      console.error('[ShiprocketQueue] Failed to dispatch vendor shipment notification:', notifErr.message);
    }
  }

  return shipmentResult;
}, { connection });

// Handle Worker Events for Resilience/Logging
shipmentWorker.on('completed', (job, returnvalue) => {
  console.log(`Shipment Job ${job.id} completed successfully!`);
});

shipmentWorker.on('failed', async (job, err) => {
  console.error(`Shipment Job ${job.id} failed with error: ${err.message}`);

  const isPickupUnverified = err.code === 'PICKUP_LOCATION_NOT_REGISTERED' || err.code === 'PLATFORM_PICKUP_LOCATION_NOT_CONFIGURED';
  
  // If unverified pickup location OR max attempts reached
  if (isPickupUnverified || job.attemptsMade >= job.opts.attempts) {
    const { vendorOrderId } = job.data;
    try {
      const vendorOrder = await VendorOrder.findById(vendorOrderId);
      if (vendorOrder) {
        vendorOrder.status = isPickupUnverified ? 'shipment_blocked_pickup_unverified' : 'partially_failed';
        vendorOrder.shipmentError = {
          code: err.code || (isPickupUnverified ? 'PICKUP_LOCATION_NOT_REGISTERED' : 'SHIPMENT_CREATION_FAILED'),
          message: err.message,
          timestamp: new Date()
        };
        await vendorOrder.save();

        // Alert the Vendor & Admin via notification dispatcher & Notification model
        if (vendorOrder.vendor) {
          const { dispatchVendorNotification, VENDOR_NOTIFICATION_EVENTS } = require('../services/vendorNotificationService');
          await dispatchVendorNotification({
            eventType: VENDOR_NOTIFICATION_EVENTS.PICKUP_FAILED,
            vendorId: vendorOrder.vendor,
            vendorOrderId: vendorOrder._id,
            orderId: vendorOrder.order,
            metadata: {
              vendorOrderNumber: String(vendorOrder._id).slice(-8),
              failureReason: err.message,
            },
            customTitle: isPickupUnverified ? "Shipment Blocked: Pickup Location Unverified" : "Shipment Creation Failed",
            customMessage: isPickupUnverified
              ? `Shipment blocked for VendorOrder ${vendorOrderId}. Vendor pickup location is not registered in Shiprocket. Please contact Admin.`
              : `Shiprocket failed to create a shipment after max retries for order ${vendorOrderId}. Reason: ${err.message}`
          });
        }

        console.log(`VendorOrder ${vendorOrderId} status set to ${vendorOrder.status}: ${err.message}`);
      }
    } catch (dbErr) {
      console.error('Failed to update DB on job failure:', dbErr);
    }
  }
});

module.exports = {
  shipmentQueue,
  enqueueShipment
};