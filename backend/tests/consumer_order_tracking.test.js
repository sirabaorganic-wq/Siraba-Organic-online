/**
 * ============================================================================
 * SIRABA ORGANIC — CONSUMER ORDER TRACKING INTEGRATION TEST SUITE
 * ============================================================================
 * 
 * Comprehensive automated test suite verifying:
 * 
 * Authentication:
 * 1.  Unauthenticated consumer cannot access orders list (401)
 * 2.  Unauthenticated consumer cannot access order details (401)
 * 3.  Unauthenticated consumer cannot access order tracking (401)
 * 
 * Order Ownership & Multi-Tenant Security:
 * 4.  Consumer A can list only their own orders
 * 5.  Consumer A can view their own order details
 * 6.  Consumer A cannot view Consumer B's order details (403 Forbidden)
 * 7.  Consumer A cannot access Consumer B's tracking endpoint (403 Forbidden)
 * 8.  Malicious/forged order IDs cannot expose another consumer's order
 * 
 * Order Data Integrity:
 * 9.  Consumer receives correct order items, prices, tax, and totals
 * 10. Consumer receives full shipping address snapshot (name, phone, address, city, state, pincode)
 * 11. Consumer receives correct payment status and method
 * 12. Consumer receives correct order status
 * 
 * Shipment & Shiprocket Tracking:
 * 13. Order without shipment correctly reports tracking unavailable
 * 14. Order with shipment exposes shipment ID
 * 15. Order with AWB exposes AWB code
 * 16. Courier partner information is accurate (e.g. Delhivery, Blue Dart)
 * 17. Valid tracking URL is generated when AWB is present (https://shiprocket.co/tracking/:awb)
 * 18. Shipment status is normalized and returned correctly
 * 
 * Multi-Vendor Split Shipments:
 * 19. Multi-vendor order preserves separate vendor shipments
 * 20. Consumer can distinguish vendor-specific packages, items, and tracking numbers
 * 
 * Status Lifecycle & Integrity:
 * 21. Delivered status and deliveredAt timestamp are returned correctly
 * 22. Cancelled order does not display contradictory delivery timeline
 * 23. Tracking data remains persistent across re-fetches and logins
 * 24. Shiprocket webhook status update synchronizes VendorOrder and parent Order correctly
 * 
 * Run with: node tests/consumer_order_tracking.test.js
 */

'use strict';

const path = require('path');
const http = require('http');
const assert = require('assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');

const backendDir = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(backendDir, '.env') });

const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const VendorOrder = require('../models/VendorOrder');

const orderRoutes = require('../routes/orderRoutes');
const shiprocketWebhookRoutes = require('../routes/shiprocketWebhookRoutes');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const PASS = `${GREEN}${BOLD}[ PASS ]${RESET}`;
const FAIL = `${RED}${BOLD}[ FAIL ]${RESET}`;
const INFO = `${CYAN}[ INFO ]${RESET}`;

let passedCount = 0;
let failedCount = 0;
const testResults = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ${PASS}  ${name}`);
    passedCount++;
    testResults.push({ name, status: 'PASS' });
  } catch (err) {
    console.error(`  ${FAIL}  ${name}`);
    console.error(`         ${RED}↳ ${err.message}${RESET}`);
    failedCount++;
    testResults.push({ name, status: 'FAIL', error: err.message });
  }
}

function httpRequest(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const { method = 'GET', headers = {}, body } = options;

  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (res) => {
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return {
      status: res.status,
      headers: res.headers,
      body: data,
    };
  });
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecretkey123', {
    expiresIn: '1d',
  });
}

async function runSuite() {
  console.log('\n============================================================================');
  console.log(`${BOLD}  SIRABA ORGANIC — CONSUMER ORDER TRACKING TEST SUITE${RESET}`);
  console.log('============================================================================\n');

  // Connect to DB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  // Setup Express App
  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);
  app.use('/api/fulfillment/status', shiprocketWebhookRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5988, resolve));
  const baseUrl = 'http://localhost:5988';
  console.log(`${INFO} Test server listening on http://localhost:5988\n`);

  // Fixtures
  let consumerA, consumerB;
  let tokenA, tokenB;
  let vendor1, vendor2;
  let product1, product2;
  let orderNoShipment;
  let orderWithShipment;
  let orderMultiVendor;
  let orderCancelled;

  try {
    // 1. Create Test Consumers
    consumerA = await User.create({
      name: 'Consumer Alice',
      email: `alice_${Date.now()}@testtracking.com`,
      password: 'password123',
      phone: '9876543210',
      role: 'customer',
    });
    tokenA = generateToken(consumerA._id);

    consumerB = await User.create({
      name: 'Consumer Bob',
      email: `bob_${Date.now()}@testtracking.com`,
      password: 'password123',
      phone: '9876543211',
      role: 'customer',
    });
    tokenB = generateToken(consumerB._id);

    // 2. Create Test Vendors
    vendor1 = await Vendor.create({
      email: `himalayan_${Date.now()}@test.com`,
      password: 'password123',
      businessName: 'Himalayan Organic Herbs',
      businessType: 'farmer',
      contactPerson: 'Sunil Sharma',
      phone: '9876543220',
      address: {
        street: 'Herbal Valley',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302001',
      },
      status: 'approved',
      shiprocket_pickup_code: 'Himalayan_Jaipur',
      pickupAddress: {
        addressLine1: 'Herbal Valley',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
      },
    });

    vendor2 = await Vendor.create({
      email: `kashmir_${Date.now()}@test.com`,
      password: 'password123',
      businessName: 'Kashmir Saffron Co',
      businessType: 'processor',
      contactPerson: 'Bashir Ahmed',
      phone: '9876543221',
      address: {
        street: 'Saffron Fields',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        postalCode: '190001',
      },
      status: 'approved',
      shiprocket_pickup_code: 'Kashmir_Srinagar',
      pickupAddress: {
        addressLine1: 'Saffron Fields',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        pincode: '190001',
      },
    });

    // 3. Create Products
    product1 = await Product.create({
      name: 'Organic Ashwagandha Powder 250g',
      slug: `organic-ashwagandha-${Date.now()}`,
      description: 'Pure organic ashwagandha root powder for wellness',
      price: 499,
      stockQuantity: 100,
      vendor: vendor1._id,
      isVendorProduct: true,
      category: 'Health',
      sku: 'ASHWA-250',
    });

    product2 = await Product.create({
      name: 'Pure Mogra Saffron 1g',
      slug: `pure-mogra-saffron-${Date.now()}`,
      description: 'Original grade Kashmiri mogra saffron',
      price: 999,
      stockQuantity: 50,
      vendor: vendor2._id,
      isVendorProduct: true,
      category: 'Spices',
      sku: 'SAFF-1G',
    });

    const commonAddress = {
      name: 'Alice Johnson',
      phone: '9876543210',
      address: 'Plot 42, Green Avenue, Sector 5',
      addressLine2: 'Near Central Park',
      landmark: 'Opposite Metro Station',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302015',
      country: 'India',
      addressType: 'Home',
    };

    // 4. Order 1: Alice's order with NO shipment yet (Awaiting Dispatch)
    orderNoShipment = await Order.create({
      user: consumerA._id,
      orderItems: [{
        name: product1.name,
        quantity: 1,
        image: '/images/ashwa.png',
        price: 499,
        product: product1._id,
      }],
      shippingAddress: commonAddress,
      paymentMethod: 'COD',
      paymentStatus: 'not_applicable',
      itemsPrice: 499,
      taxPrice: 89.82,
      shippingPrice: 70,
      totalPrice: 658.82,
      status: 'Pending',
      isPaid: false,
      isDelivered: false,
    });

    await VendorOrder.create({
      order: orderNoShipment._id,
      vendor: vendor1._id,
      items: [{
        product: product1._id,
        name: product1.name,
        quantity: 1,
        price: 499,
      }],
      subtotal: 499,
      netAmount: 449,
      status: 'pending',
    });

    // 5. Order 2: Alice's order WITH shipment & AWB created (In Transit)
    orderWithShipment = await Order.create({
      user: consumerA._id,
      orderItems: [{
        name: product1.name,
        quantity: 2,
        image: '/images/ashwa.png',
        price: 499,
        product: product1._id,
      }],
      shippingAddress: commonAddress,
      paymentMethod: 'Online',
      paymentStatus: 'captured',
      isPaid: true,
      paidAt: new Date(Date.now() - 86400000),
      itemsPrice: 998,
      taxPrice: 179.64,
      shippingPrice: 0,
      totalPrice: 1177.64,
      status: 'Shipped',
      isDelivered: false,
    });

    await VendorOrder.create({
      order: orderWithShipment._id,
      vendor: vendor1._id,
      items: [{
        product: product1._id,
        name: product1.name,
        quantity: 2,
        price: 499,
      }],
      subtotal: 998,
      netAmount: 898,
      status: 'in_transit',
      shipmentId: 'SR_SHP_998877',
      awbCode: 'AWB_BLUEDART_11223344',
      courierName: 'Blue Dart Express',
      courierId: '10',
      shippedAt: new Date(Date.now() - 43200000),
    });

    // 6. Order 3: Bob's multi-vendor order (Two distinct packages)
    orderMultiVendor = await Order.create({
      user: consumerB._id,
      orderItems: [
        {
          name: product1.name,
          quantity: 1,
          image: '/images/ashwa.png',
          price: 499,
          product: product1._id,
        },
        {
          name: product2.name,
          quantity: 1,
          image: '/images/saffron.png',
          price: 999,
          product: product2._id,
        },
      ],
      shippingAddress: {
        name: 'Bob Smith',
        phone: '9876543211',
        address: 'B-104, Royal Palms',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      paymentMethod: 'Online',
      paymentStatus: 'captured',
      isPaid: true,
      itemsPrice: 1498,
      taxPrice: 269.64,
      shippingPrice: 0,
      totalPrice: 1767.64,
      status: 'Shipped',
      isDelivered: false,
    });

    await VendorOrder.create({
      order: orderMultiVendor._id,
      vendor: vendor1._id,
      items: [{ product: product1._id, name: product1.name, quantity: 1, price: 499 }],
      subtotal: 499,
      netAmount: 449,
      status: 'in_transit',
      shipmentId: 'SR_SHP_V1_M1',
      awbCode: 'AWB_DELHIVERY_V1',
      courierName: 'Delhivery Surface',
      shippedAt: new Date(),
    });

    await VendorOrder.create({
      order: orderMultiVendor._id,
      vendor: vendor2._id,
      items: [{ product: product2._id, name: product2.name, quantity: 1, price: 999 }],
      subtotal: 999,
      netAmount: 899,
      status: 'processing',
      shipmentId: null,
      awbCode: null,
      courierName: null,
    });

    // 7. Order 4: Cancelled order
    orderCancelled = await Order.create({
      user: consumerA._id,
      orderItems: [{
        name: product1.name,
        quantity: 1,
        image: '/images/ashwa.png',
        price: 499,
        product: product1._id,
      }],
      shippingAddress: commonAddress,
      paymentMethod: 'Online',
      paymentStatus: 'refunded',
      isPaid: true,
      isRefunded: true,
      refundAmount: 588.82,
      refundDate: new Date(),
      totalPrice: 658.82,
      itemsPrice: 499,
      taxPrice: 89.82,
      shippingPrice: 70,
      status: 'Cancelled',
      cancelledAt: new Date(),
    });

    console.log(`${INFO} Test fixtures created successfully.\n`);

    // ==================== SECTION 1: AUTHENTICATION ====================
    console.log(`${CYAN}--- SECTION 1: AUTHENTICATION & ACCESS CONTROL ---${RESET}`);

    await test('1. Unauthenticated consumer cannot access /api/orders/myorders (401)', async () => {
      const res = await httpRequest(baseUrl, '/api/orders/myorders');
      assert.strictEqual(res.status, 401);
    });

    await test('2. Unauthenticated consumer cannot access /api/orders/:id (401)', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderNoShipment._id}`);
      assert.strictEqual(res.status, 401);
    });

    await test('3. Unauthenticated consumer cannot access /api/orders/:id/tracking (401)', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderNoShipment._id}/tracking`);
      assert.strictEqual(res.status, 401);
    });

    await test('4. Unauthenticated consumer cannot access legacy /api/orders/track/:id (401)', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/track/${orderNoShipment._id}`);
      assert.strictEqual(res.status, 401);
    });

    // ==================== SECTION 2: MULTI-TENANT ISOLATION ====================
    console.log(`\n${CYAN}--- SECTION 2: MULTI-TENANT OWNERSHIP ISOLATION ---${RESET}`);

    await test('5. Consumer A can list their own orders only (does not leak Consumer B orders)', async () => {
      const res = await httpRequest(baseUrl, '/api/orders/myorders', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body), 'Response should be an array');
      const orderIds = res.body.map((o) => o._id);
      assert(orderIds.includes(orderNoShipment._id.toString()), 'Should include Order 1');
      assert(orderIds.includes(orderWithShipment._id.toString()), 'Should include Order 2');
      assert(!orderIds.includes(orderMultiVendor._id.toString()), "Must NOT leak Consumer B's order!");
    });

    await test('6. Consumer A can view their own order details', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderNoShipment._id}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body._id, orderNoShipment._id.toString());
    });

    await test("7. Consumer A CANNOT view Consumer B's order details (403 Forbidden)", async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderMultiVendor._id}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
      assert(res.body.message && res.body.message.includes('Not authorized'));
    });

    await test("8. Consumer A CANNOT access Consumer B's tracking endpoint (403 Forbidden)", async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderMultiVendor._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await test("9. Consumer B CANNOT access Consumer A's tracking endpoint (403 Forbidden)", async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await test('10. Invalid ObjectId format is rejected safely (400 Bad Request)', async () => {
      const res = await httpRequest(baseUrl, '/api/orders/not-a-valid-objectid/tracking', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 400);
    });

    // ==================== SECTION 3: ORDER DATA INTEGRITY ====================
    console.log(`\n${CYAN}--- SECTION 3: ORDER DATA INTEGRITY ---${RESET}`);

    await test('11. Consumer receives complete order items and financial breakdown', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      const b = res.body;
      assert.strictEqual(b.itemsPrice, 998);
      assert.strictEqual(b.taxPrice, 179.64);
      assert.strictEqual(b.totalPrice, 1177.64);
      assert.strictEqual(b.orderItems.length, 1);
      assert.strictEqual(b.orderItems[0].quantity, 2);
    });

    await test('12. Consumer receives complete immutable shippingAddress snapshot', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      const addr = res.body.shippingAddress;
      assert.strictEqual(addr.name, 'Alice Johnson');
      assert.strictEqual(addr.phone, '9876543210');
      assert.strictEqual(addr.city, 'Jaipur');
      assert.strictEqual(addr.state, 'Rajasthan');
      assert.strictEqual(addr.postalCode, '302015');
      assert.strictEqual(addr.country, 'India');
    });

    await test('13. Consumer receives accurate payment status and payment method', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.paymentMethod, 'Online');
      assert.strictEqual(res.body.paymentStatus, 'captured');
      assert.strictEqual(res.body.isPaid, true);
    });

    // ==================== SECTION 4: SHIPMENT & SHIPROCKET TRACKING ====================
    console.log(`\n${CYAN}--- SECTION 4: SHIPMENT & COURIER TRACKING ---${RESET}`);

    await test('14. Order without shipment correctly reports trackingAvailable = false', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderNoShipment._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.trackingAvailable, false);
      assert.strictEqual(res.body.vendorOrders[0].awbCode, null);
      assert.strictEqual(res.body.vendorOrders[0].trackingUrl, null);
    });

    await test('15. Order with shipment exposes shipmentId, AWB code, courierName, and trackingUrl', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.trackingAvailable, true);
      const vo = res.body.vendorOrders[0];
      assert.strictEqual(vo.shipmentId, 'SR_SHP_998877');
      assert.strictEqual(vo.awbCode, 'AWB_BLUEDART_11223344');
      assert.strictEqual(vo.courierName, 'Blue Dart Express');
      assert.strictEqual(vo.trackingUrl, 'https://shiprocket.co/tracking/AWB_BLUEDART_11223344');
      assert.strictEqual(vo.status, 'in_transit');
    });

    // ==================== SECTION 5: MULTI-VENDOR SPLIT SHIPMENTS ====================
    console.log(`\n${CYAN}--- SECTION 5: MULTI-VENDOR SPLIT SHIPMENTS ---${RESET}`);

    await test('16. Multi-vendor order preserves separate packages and vendor identities', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderMultiVendor._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.vendorOrders.length, 2, 'Should contain 2 separate packages');

      const pkg1 = res.body.vendorOrders.find((p) => p.vendorName === 'Himalayan Organic Herbs');
      const pkg2 = res.body.vendorOrders.find((p) => p.vendorName === 'Kashmir Saffron Co');

      assert(pkg1, 'Should have package from Himalayan Organic Herbs');
      assert(pkg2, 'Should have package from Kashmir Saffron Co');

      // Package 1 is in_transit with Delhivery
      assert.strictEqual(pkg1.status, 'in_transit');
      assert.strictEqual(pkg1.courierName, 'Delhivery Surface');
      assert.strictEqual(pkg1.awbCode, 'AWB_DELHIVERY_V1');
      assert.strictEqual(pkg1.trackingAvailable, true);

      // Package 2 is still processing without AWB
      assert.strictEqual(pkg2.status, 'processing');
      assert.strictEqual(pkg2.awbCode, null);
      assert.strictEqual(pkg2.trackingAvailable, false);
    });

    // ==================== SECTION 6: CANCELLED & DELIVERED STATUS ====================
    console.log(`\n${CYAN}--- SECTION 6: STATUS INTEGRITY & EDGE CASES ---${RESET}`);

    await test('17. Cancelled order does not show contradictory active delivery timeline', async () => {
      const res = await httpRequest(baseUrl, `/api/orders/${orderCancelled._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.isCancelled, true);
      assert.strictEqual(res.body.status, 'Cancelled');
      assert.strictEqual(res.body.isRefunded, true);
      assert.strictEqual(res.body.refundAmount, 588.82);
      assert.deepStrictEqual(res.body.timeline, [], 'Timeline should be cleared for cancelled orders');
    });

    await test('18. GET /api/orders/myorders returns orders sorted newest first', async () => {
      const res = await httpRequest(baseUrl, '/api/orders/myorders', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      for (let i = 0; i < res.body.length - 1; i++) {
        const d1 = new Date(res.body[i].createdAt).getTime();
        const d2 = new Date(res.body[i + 1].createdAt).getTime();
        assert(d1 >= d2, 'Orders should be sorted in descending chronological order');
      }
    });

    await test('19. Webhook delivery status update synchronizes VendorOrder and parent Order', async () => {
      // Simulate Shiprocket Webhook delivering orderWithShipment
      process.env.SHIPROCKET_WEBHOOK_SECRET = 'test_webhook_secret';
      const webhookRes = await httpRequest(baseUrl, '/api/fulfillment/status', {
        method: 'POST',
        headers: { 'x-api-key': 'test_webhook_secret' },
        body: {
          shipment_id: 'SR_SHP_998877',
          current_status: 'DELIVERED',
          event_id: `evt_deliver_${Date.now()}`,
        },
      });
      assert.strictEqual(webhookRes.status, 200);

      // Now query consumer tracking for orderWithShipment
      const trackRes = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(trackRes.status, 200);
      assert.strictEqual(trackRes.body.status, 'Delivered', 'Parent order should be updated to Delivered');
      assert.strictEqual(trackRes.body.isDelivered, true);
      assert.strictEqual(trackRes.body.vendorOrders[0].status, 'delivered');
      assert(trackRes.body.vendorOrders[0].deliveredAt, 'deliveredAt timestamp should be set');
    });

    await test('20. Delivered order displays completed delivery timeline', async () => {
      const trackRes = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(trackRes.status, 200);
      const deliveredStep = trackRes.body.timeline.find((t) => t.statusKey === 'delivered');
      assert(deliveredStep, 'Delivered step must exist in timeline');
      assert.strictEqual(deliveredStep.completed, true);
      assert.strictEqual(deliveredStep.current, true);
    });

    await test('21. Live tracking handles carrier API errors gracefully without fake data', async () => {
      // Request tracking with ?live=true for an AWB where Shiprocket API is not reachable/offline
      const trackRes = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}/tracking?live=true`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(trackRes.status, 200);
      // It should still return the persisted order data and report carrier live status availability cleanly
      assert.strictEqual(trackRes.body.orderId, orderWithShipment._id.toString());
      assert(trackRes.body.liveTrackingError || trackRes.body.liveCourierTracking !== undefined);
    });

    await test('22. Order tracking data remains consistent and persistent across re-fetches', async () => {
      const fetch1 = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const fetch2 = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(fetch1.status, 200);
      assert.strictEqual(fetch2.status, 200);
      assert.strictEqual(fetch1.body.orderId, fetch2.body.orderId);
      assert.strictEqual(fetch1.body.status, fetch2.body.status);
      assert.strictEqual(fetch1.body.totalPrice, fetch2.body.totalPrice);
      assert.strictEqual(fetch1.body.vendorOrders[0].awbCode, fetch2.body.vendorOrders[0].awbCode);
    });

    await test('23. Non-existent order returns 404 Not Found cleanly', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await httpRequest(baseUrl, `/api/orders/${nonExistentId}/tracking`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.message, 'Order not found');
    });

    await test('24. Order return request enforces ownership and delivered status requirement', async () => {
      // Bob cannot request return for Alice's order
      const resBob = await httpRequest(baseUrl, `/api/orders/${orderWithShipment._id}/return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` },
        body: { reason: 'Wrong size' },
      });
      assert.strictEqual(resBob.status, 401, 'Non-owner must be rejected');

      // Alice cannot request return for non-delivered order
      const resUndelivered = await httpRequest(baseUrl, `/api/orders/${orderNoShipment._id}/return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: { reason: 'Changed mind' },
      });
      assert.strictEqual(resUndelivered.status, 400, 'Undelivered order cannot be returned');
    });

  } finally {
    // Cleanup fixtures
    console.log(`\n${INFO} Cleaning up test fixtures...`);
    if (consumerA) await User.deleteOne({ _id: consumerA._id });
    if (consumerB) await User.deleteOne({ _id: consumerB._id });
    if (vendor1) await Vendor.deleteOne({ _id: vendor1._id });
    if (vendor2) await Vendor.deleteOne({ _id: vendor2._id });
    if (product1) await Product.deleteOne({ _id: product1._id });
    if (product2) await Product.deleteOne({ _id: product2._id });
    if (orderNoShipment) {
      await Order.deleteOne({ _id: orderNoShipment._id });
      await VendorOrder.deleteMany({ order: orderNoShipment._id });
    }
    if (orderWithShipment) {
      await Order.deleteOne({ _id: orderWithShipment._id });
      await VendorOrder.deleteMany({ order: orderWithShipment._id });
    }
    if (orderMultiVendor) {
      await Order.deleteOne({ _id: orderMultiVendor._id });
      await VendorOrder.deleteMany({ order: orderMultiVendor._id });
    }
    if (orderCancelled) {
      await Order.deleteOne({ _id: orderCancelled._id });
      await VendorOrder.deleteMany({ order: orderCancelled._id });
    }

    server.close();
    await mongoose.disconnect();
    console.log(`${INFO} Test server closed and database disconnected cleanly.\n`);
  }

  // Summary
  console.log('============================================================================');
  console.log('TEST EXECUTION SUMMARY:');
  console.log(`  Total:  ${passedCount + failedCount}`);
  console.log(`  Passed: ${passedCount}`);
  console.log(`  Failed: ${failedCount}`);
  console.log('============================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
