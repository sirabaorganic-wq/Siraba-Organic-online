const VendorOrder = require('../models/VendorOrder');
const WebhookLog = require('../models/WebhookLog');
const Notification = require('../models/Notification');

/**
 * Handles incoming webhooks from Shiprocket to update internal order statuses
 */
const handleWebhook = async (req, res) => {
  try {
    // 1. Security Check: Secret Token Validation
    // Shiprocket allows configuring a custom header (e.g., x-api-key or Authorization)
    const secret = req.headers['x-api-key'] || req.headers['x-shiprocket-token'];
    
    if (process.env.SHIPROCKET_WEBHOOK_SECRET && secret !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
      console.warn('Unauthorized Shiprocket Webhook Attempt');
      return res.status(401).json({ error: 'Unauthorized webhook' });
    }

    const payload = req.body;
    
    // For validation, Shiprocket sends a simple challenge sometimes, but let's handle the main tracking update
    const awb = payload.awb;
    const currentStatus = payload.current_status || payload.shipment_status;
    const statusId = payload.current_status_id || payload.shipment_status_id;

    if (!awb || !currentStatus) {
      return res.status(400).json({ error: 'Invalid payload - missing awb or status' });
    }

    // 2. Idempotency Check
    // AWB + Status ID ensures we only process a specific status update for an AWB once
    const idempotencyKey = `sr_wh_${awb}_${statusId}`;
    
    const existingLog = await WebhookLog.findOne({ eventId: idempotencyKey });
    if (existingLog) {
       return res.status(200).json({ success: true, message: 'Already processed' });
    }

    // Log it immediately to prevent race conditions from concurrent webhook fires
    await WebhookLog.create({
       eventId: idempotencyKey,
       status: currentStatus,
       payload: payload
    });

    // 3. Map to internal VendorOrder
    const vendorOrder = await VendorOrder.findOne({ awbCode: awb });
    if (!vendorOrder) {
      console.log(`Webhook received for unknown AWB: ${awb}`);
      return res.status(200).json({ success: true, message: 'AWB not found in our system' });
    }

    // 4. Status Mapping
    const statusMap = {
      'PICKED UP': 'shipped',
      'IN TRANSIT': 'shipped',
      'OUT FOR DELIVERY': 'shipped',
      'DELIVERED': 'delivered',
      'RTO INITIATED': 'returned',
      'RTO DELIVERED': 'returned',
      'CANCELLED': 'cancelled',
      'LOST': 'partially_failed', 
      'DAMAGED': 'partially_failed'
    };

    const internalStatus = statusMap[currentStatus.toUpperCase()];
    
    vendorOrder.shiprocketStatus = currentStatus;
    
    if (internalStatus) {
      vendorOrder.status = internalStatus;
      
      if (internalStatus === 'delivered' && !vendorOrder.deliveredAt) {
         vendorOrder.deliveredAt = new Date();
      }
      if (internalStatus === 'shipped' && !vendorOrder.shippedAt) {
         vendorOrder.shippedAt = new Date();
      }
      
      // Alert when shipment completely fails in transit
      if (internalStatus === 'partially_failed') {
        await Notification.create({
          recipient: vendorOrder.vendor,
          recipientModel: "Vendor",
          type: "error",
          title: "Shipment Failed Alert",
          message: `Alert: Shipment for AWB ${awb} has been marked as ${currentStatus} by the courier.`
        });
      }
    }

    await vendorOrder.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Shiprocket Webhook Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  handleWebhook
};
