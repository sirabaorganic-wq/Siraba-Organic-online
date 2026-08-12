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
    // Platform / Admin direct product
    vendor = {
      _id: null,
      businessName: "SIRABA Organic Direct",
      phone: process.env.PLATFORM_PHONE || "9876543210",
      email: process.env.PLATFORM_EMAIL || "support@sirabaorganic.com",
      shiprocket_pickup_code: process.env.SHIPROCKET_PRIMARY_LOCATION || "Primary",
      pickupAddress: {
        facilityName: "Primary",
        shiprocketLocationName: process.env.SHIPROCKET_PRIMARY_LOCATION || "Primary",
        addressLine1: "SIRABA Organic Fulfillment Center",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
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

  // Generate shipment via service
  const shipmentResult = await shiprocketService.createShipment(vendorOrder, order, vendor);

  // Update VendorOrder
  vendorOrder.shiprocketOrderId = shipmentResult.shiprocketOrderId;
  vendorOrder.shipmentId = shipmentResult.shipmentId;
  vendorOrder.awbCode = shipmentResult.awbCode;
  vendorOrder.courierName = shipmentResult.courierName;
  vendorOrder.courierId = shipmentResult.courierId;
  vendorOrder.shippingRoutingCode = shipmentResult.routingCode;
  vendorOrder.labelUrl = shipmentResult.labelUrl;
  vendorOrder.status = 'processing'; // Moved from pending to processing as it's now sent

  await vendorOrder.save();
  return shipmentResult;
}, { connection });

// Handle Worker Events for Resilience/Logging
shipmentWorker.on('completed', (job, returnvalue) => {
  console.log(`Shipment Job ${job.id} completed successfully!`);
});

shipmentWorker.on('failed', async (job, err) => {
  console.error(`Shipment Job ${job.id} failed with error: ${err.message}`);

  const isPickupUnverified = err.code === 'PICKUP_LOCATION_NOT_REGISTERED';
  
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

        // Alert the Vendor & Admin
        await Notification.create({
          recipient: vendorOrder.vendor,
          recipientModel: "Vendor",
          type: "error",
          title: isPickupUnverified ? "Shipment Blocked: Pickup Location Unverified" : "Shipment Creation Failed",
          message: isPickupUnverified
            ? `Shipment blocked for VendorOrder ${vendorOrderId}. Vendor pickup location is not registered in Shiprocket. Please contact Admin.`
            : `Shiprocket failed to create a shipment after max retries for order ${vendorOrderId}. Reason: ${err.message}`
        });

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