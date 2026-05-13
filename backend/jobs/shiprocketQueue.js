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
  const vendor = await Vendor.findById(vendorId);

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

  // If max attempts reached, mark as failed
  if (job.attemptsMade >= job.opts.attempts) {
    const { vendorOrderId } = job.data;
    try {
      const vendorOrder = await VendorOrder.findById(vendorOrderId);
      if (vendorOrder) {
        vendorOrder.status = 'partially_failed';
        await vendorOrder.save();

        // Uncomment to enable auto rollback:
        // await shiprocketService.rollbackInventory(vendorOrder);

        // Alert the Vendor
        await Notification.create({
          recipient: vendorOrder.vendor,
          recipientModel: "Vendor",
          type: "error",
          title: "Shipment Creation Failed",
          message: `Shiprocket failed to create a shipment after max retries for order ${vendorOrderId}. Please check the Shiprocket dashboard or retry manually.`
        });

        console.log(`VendorOrder ${vendorOrderId} marked as partially_failed due to max retries`);
      }
    } catch (dbErr) {
      console.error('Failed to update DB on job max failures:', dbErr);
    }
  }
});

module.exports = {
  shipmentQueue,
  enqueueShipment
};