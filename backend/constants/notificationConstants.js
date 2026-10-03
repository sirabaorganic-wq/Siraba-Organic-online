/**
 * SIRABA ORGANIC — VENDOR NOTIFICATION CONSTANTS & EVENT DEFINITIONS
 * Authoritative single source of truth for vendor notification events,
 * categories, channels, and severity levels.
 */

'use strict';

const VENDOR_NOTIFICATION_EVENTS = {
  // Order Lifecycle
  VENDOR_ORDER_RECEIVED: 'vendor_order_received',
  VENDOR_ORDER_CONFIRMED: 'vendor_order_confirmed',
  ORDER_CANCELLED: 'order_cancelled',

  // Shipment Preparation & Dispatch
  SHIPMENT_CREATED: 'shipment_created',
  AWB_ASSIGNED: 'awb_assigned',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  PICKUP_PENDING: 'pickup_pending',
  PICKUP_FAILED: 'pickup_failed',
  PICKED_UP: 'picked_up',

  // Courier In-Transit & Delivery
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERY_FAILED: 'delivery_failed',
  DELIVERED: 'delivered',

  // Return to Origin (RTO)
  RTO_INITIATED: 'rto_initiated',
  RTO_IN_TRANSIT: 'rto_in_transit',
  RTO_DELIVERED: 'rto_delivered',
};

const NOTIFICATION_CATEGORIES = {
  ORDER: 'order',
  SHIPMENT: 'shipment',
  DELIVERY: 'delivery',
  RTO: 'rto',
  EXCEPTION: 'exception',
};

const NOTIFICATION_SEVERITIES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

/**
 * Event Configuration Matrix:
 * Defines metadata, channels, title templates, and severity for each event.
 */
const VENDOR_EVENT_CONFIG = {
  [VENDOR_NOTIFICATION_EVENTS.VENDOR_ORDER_RECEIVED]: {
    category: NOTIFICATION_CATEGORIES.ORDER,
    severity: NOTIFICATION_SEVERITIES.INFO,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `New Order Received #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.VENDOR_ORDER_CONFIRMED]: {
    category: NOTIFICATION_CATEGORIES.ORDER,
    severity: NOTIFICATION_SEVERITIES.SUCCESS,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Order Confirmed #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.ORDER_CANCELLED]: {
    category: NOTIFICATION_CATEGORIES.ORDER,
    severity: NOTIFICATION_SEVERITIES.WARNING,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Order Cancelled #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.SHIPMENT_CREATED]: {
    category: NOTIFICATION_CATEGORIES.SHIPMENT,
    severity: NOTIFICATION_SEVERITIES.INFO,
    sendEmail: false,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Shipment Created for #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.AWB_ASSIGNED]: {
    category: NOTIFICATION_CATEGORIES.SHIPMENT,
    severity: NOTIFICATION_SEVERITIES.INFO,
    sendEmail: false,
    sendSocket: true,
    titleTemplate: (orderNumber) => `AWB Assigned for #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.PICKUP_SCHEDULED]: {
    category: NOTIFICATION_CATEGORIES.SHIPMENT,
    severity: NOTIFICATION_SEVERITIES.SUCCESS,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Pickup Scheduled for #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.PICKUP_PENDING]: {
    category: NOTIFICATION_CATEGORIES.SHIPMENT,
    severity: NOTIFICATION_SEVERITIES.WARNING,
    sendEmail: false,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Pickup Pending for #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.PICKUP_FAILED]: {
    category: NOTIFICATION_CATEGORIES.EXCEPTION,
    severity: NOTIFICATION_SEVERITIES.ERROR,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `ACTION REQUIRED: Pickup Failed for #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.PICKED_UP]: {
    category: NOTIFICATION_CATEGORIES.SHIPMENT,
    severity: NOTIFICATION_SEVERITIES.SUCCESS,
    sendEmail: false,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Package Picked Up for #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.IN_TRANSIT]: {
    category: NOTIFICATION_CATEGORIES.DELIVERY,
    severity: NOTIFICATION_SEVERITIES.INFO,
    sendEmail: false,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Package In Transit: Order #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.OUT_FOR_DELIVERY]: {
    category: NOTIFICATION_CATEGORIES.DELIVERY,
    severity: NOTIFICATION_SEVERITIES.INFO,
    sendEmail: false,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Out for Delivery: Order #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.DELIVERY_FAILED]: {
    category: NOTIFICATION_CATEGORIES.EXCEPTION,
    severity: NOTIFICATION_SEVERITIES.WARNING,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Delivery Attempt Failed for #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.DELIVERED]: {
    category: NOTIFICATION_CATEGORIES.DELIVERY,
    severity: NOTIFICATION_SEVERITIES.SUCCESS,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Order Delivered Successfully #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.RTO_INITIATED]: {
    category: NOTIFICATION_CATEGORIES.RTO,
    severity: NOTIFICATION_SEVERITIES.WARNING,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `RTO Initiated for Order #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.RTO_IN_TRANSIT]: {
    category: NOTIFICATION_CATEGORIES.RTO,
    severity: NOTIFICATION_SEVERITIES.INFO,
    sendEmail: false,
    sendSocket: true,
    titleTemplate: (orderNumber) => `Return Package In Transit for #${orderNumber}`,
  },
  [VENDOR_NOTIFICATION_EVENTS.RTO_DELIVERED]: {
    category: NOTIFICATION_CATEGORIES.RTO,
    severity: NOTIFICATION_SEVERITIES.SUCCESS,
    sendEmail: true,
    sendSocket: true,
    titleTemplate: (orderNumber) => `RTO Package Returned to Warehouse for #${orderNumber}`,
  },
};

module.exports = {
  VENDOR_NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SEVERITIES,
  VENDOR_EVENT_CONFIG,
};
