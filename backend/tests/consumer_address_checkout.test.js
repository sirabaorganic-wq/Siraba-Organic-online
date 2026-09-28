/**
 * ============================================================================
 * SIRABA ORGANIC — CONSUMER ADDRESS & CHECKOUT INTEGRATION TEST SUITE
 * ============================================================================
 * 
 * Comprehensive E2E automated test suite verifying:
 * 1.  Unauthenticated access rejection (401)
 * 2.  Empty address list for new consumers
 * 3.  Validation failure on invalid/malformed address payloads (400)
 * 4.  First-address creation & automatic default assignment
 * 5.  Multiple address management & explicit default switching (single default invariant)
 * 6.  Address update with validation & ownership preservation
 * 7.  Default address deletion fallback (auto-promotes remaining address to default)
 * 8.  Cross-consumer security: Consumer B cannot read Consumer A's addresses
 * 9.  Cross-consumer security: Consumer B cannot update Consumer A's address
 * 10. Cross-consumer security: Consumer B cannot delete Consumer A's address
 * 11. Cross-consumer security: Consumer B cannot set Consumer A's address as default
 * 12. Checkout address validation: Missing address rejected
 * 13. Checkout security: Consumer B cannot place an order using Consumer A's address ID
 * 14. Checkout order creation: Valid address resolves into complete order shippingAddress snapshot
 * 15. Order snapshot immutability: Subsequent changes to consumer address do NOT alter historical order
 * 16. Shipping/Shiprocket readiness: Snapshot provides all required delivery fields without hardcoded fallbacks
 * 
 * Run with: node tests/consumer_address_checkout.test.js
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

// Helper to make HTTP requests against local test server
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
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return {
      status: res.status,
      data,
    };
  });
}

async function runSuite() {
  console.log('============================================================================');
  console.log('📦  SIRABA ORGANIC — CONSUMER ADDRESS & CHECKOUT VERIFICATION SUITE');
  console.log('============================================================================\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI missing from environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`${INFO} Connected to MongoDB database successfully.\n`);

  // Setup express test app
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/addresses', require('../routes/addressRoutes'));
  app.use('/api/orders', require('../routes/orderRoutes'));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`${INFO} Ephemeral test server listening on ${baseUrl}\n`);

  // Tracking for cleanup
  const createdUserIds = [];
  const createdOrderIds = [];
  const createdProductIds = [];
  const createdVendorIds = [];

  let tokenA = '';
  let userA = null;
  let tokenB = '';
  let userB = null;
  let testProduct = null;
  let addressA1Id = '';
  let addressA2Id = '';
  let testOrderId = '';

  try {
    // ─── SETUP TEST FIXTURES ─────────────────────────────────────────────────
    const timestamp = Date.now();

    // 1. Create Consumer A
    userA = await User.create({
      name: 'Test Consumer Alpha',
      email: `test_consumer_a_${timestamp}@siraba-test.com`,
      password: 'Password123!',
      role: 'customer',
      phone: '9876543210',
      addresses: [],
    });
    createdUserIds.push(userA._id);
    tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1d' });

    // 2. Create Consumer B (for multi-tenant isolation testing)
    userB = await User.create({
      name: 'Test Consumer Beta',
      email: `test_consumer_b_${timestamp}@siraba-test.com`,
      password: 'Password123!',
      role: 'customer',
      phone: '9123456780',
      addresses: [],
    });
    createdUserIds.push(userB._id);
    tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1d' });

    // 3. Create dummy platform product for checkout orders
    testProduct = await Product.create({
      name: `Organic Wildflower Honey ${timestamp}`,
      slug: `organic-wildflower-honey-${timestamp}`,
      price: 499,
      image: 'https://example.com/honey.png',
      category: 'Food',
      stockQuantity: 100,
      isActive: true,
      isVendorProduct: false,
      description: '100% Raw and Certified Organic Honey',
    });
    createdProductIds.push(testProduct._id);

    // ─── TEST CASES ──────────────────────────────────────────────────────────

    // Test 1: Unauthenticated request rejection
    await test('Unauthenticated requests are rejected with 401', async () => {
      const resGet = await httpRequest(baseUrl, '/api/addresses');
      assert.strictEqual(resGet.status, 401, 'GET /api/addresses must return 401');

      const resPost = await httpRequest(baseUrl, '/api/addresses', {
        method: 'POST',
        body: { name: 'Unauthorized' },
      });
      assert.strictEqual(resPost.status, 401, 'POST /api/addresses must return 401');
    });

    // Test 2: Retrieve empty addresses for new consumer
    await test('Consumer receives empty address list initially', async () => {
      const res = await httpRequest(baseUrl, '/api/addresses', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200, 'Expected 200 OK');
      assert.ok(Array.isArray(res.data), 'Expected array response');
      assert.strictEqual(res.data.length, 0, 'Expected empty array for new user');
    });

    // Test 3: Reject invalid address payload (phone, pincode, required fields)
    await test('Address creation rejects malformed payloads with 400', async () => {
      // Missing name
      const res1 = await httpRequest(baseUrl, '/api/addresses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          phone: '9876543210',
          address: '123 Green Way',
          city: 'Noida',
          state: 'Uttar Pradesh',
          postalCode: '201301',
        },
      });
      assert.strictEqual(res1.status, 400, 'Expected 400 on missing name');

      // Invalid phone (<10 digits)
      const res2 = await httpRequest(baseUrl, '/api/addresses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          name: 'Consumer Alpha',
          phone: '12345',
          address: '123 Green Way',
          city: 'Noida',
          state: 'Uttar Pradesh',
          postalCode: '201301',
        },
      });
      assert.strictEqual(res2.status, 400, 'Expected 400 on invalid phone');

      // Invalid postalCode (not 6 digits)
      const res3 = await httpRequest(baseUrl, '/api/addresses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          name: 'Consumer Alpha',
          phone: '9876543210',
          address: '123 Green Way',
          city: 'Noida',
          state: 'Uttar Pradesh',
          postalCode: '201',
        },
      });
      assert.strictEqual(res3.status, 400, 'Expected 400 on invalid 6-digit postal code');
    });

    // Test 4: Create first address (A1) & verify auto-default
    await test('First address created is automatically designated as default', async () => {
      const res = await httpRequest(baseUrl, '/api/addresses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          name: 'Consumer Alpha',
          phone: '9876543210',
          address: '101 Green Valley, Sector 4',
          addressLine2: 'Tower A, Flat 302',
          landmark: 'Opposite Central Park',
          city: 'Noida',
          state: 'Uttar Pradesh',
          postalCode: '201301',
          country: 'India',
          addressType: 'Home',
        },
      });

      assert.strictEqual(res.status, 201, 'Expected 201 Created');
      assert.ok(res.data._id, 'Created address must have an _id');
      assert.strictEqual(res.data.isDefault, true, 'First address must automatically be default');
      assert.strictEqual(res.data.name, 'Consumer Alpha');
      assert.strictEqual(res.data.phone, '9876543210');
      assert.strictEqual(res.data.postalCode, '201301');

      addressA1Id = res.data._id;
    });

    // Test 5: Create second address (A2) without default
    await test('Second address added without isDefault preserves first default', async () => {
      const res = await httpRequest(baseUrl, '/api/addresses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          name: 'Alpha Office',
          phone: '9876543210',
          address: 'Tech Innovation Hub, Block C',
          city: 'Noida',
          state: 'Uttar Pradesh',
          postalCode: '201301',
          country: 'India',
          addressType: 'Work',
          isDefault: false,
        },
      });

      assert.strictEqual(res.status, 201, 'Expected 201 Created');
      assert.strictEqual(res.data.isDefault, false, 'Second address must not be default');
      addressA2Id = res.data._id;

      // Verify list has 2 addresses and exactly 1 default
      const listRes = await httpRequest(baseUrl, '/api/addresses', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(listRes.data.length, 2, 'Must have 2 addresses');
      const defaultAddresses = listRes.data.filter((a) => a.isDefault);
      assert.strictEqual(defaultAddresses.length, 1, 'Exactly one address must be default');
      assert.strictEqual(defaultAddresses[0]._id, addressA1Id, 'Address A1 must still be default');
    });

    // Test 6: Set second address (A2) as default via PATCH & PUT /:id/default
    await test('Setting new default unsets previous default (single default invariant)', async () => {
      const res = await httpRequest(baseUrl, `/api/addresses/${addressA2Id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      assert.strictEqual(res.status, 200, 'Expected 200 OK');
      assert.strictEqual(res.data.defaultAddress._id, addressA2Id, 'Address A2 must be returned as default');

      // Verify in DB / GET list
      const listRes = await httpRequest(baseUrl, '/api/addresses', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const addrA2 = listRes.data.find((a) => a._id === addressA2Id);
      const addrA1 = listRes.data.find((a) => a._id === addressA1Id);

      assert.strictEqual(addrA2.isDefault, true, 'Address A2 must now be default');
      assert.strictEqual(addrA1.isDefault, false, 'Address A1 must no longer be default');
    });

    // Test 7: Update own address (A1)
    await test('Consumer can update their own address details', async () => {
      const res = await httpRequest(baseUrl, `/api/addresses/${addressA1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          name: 'Consumer Alpha Renamed',
          phone: '9876543210',
          address: '101 Green Valley, Sector 4, Updated Villa',
          addressLine2: 'Tower A, Flat 302',
          landmark: 'Next to City Library',
          city: 'Noida',
          state: 'Uttar Pradesh',
          postalCode: '201301',
          country: 'India',
          addressType: 'Home',
          isDefault: true, // Switch default back to A1
        },
      });

      assert.strictEqual(res.status, 200, 'Expected 200 OK on update');
      assert.strictEqual(res.data.name, 'Consumer Alpha Renamed');
      assert.strictEqual(res.data.address, '101 Green Valley, Sector 4, Updated Villa');
      assert.strictEqual(res.data.isDefault, true);

      // Verify in DB
      const freshUserA = await User.findById(userA._id);
      const dbAddrA1 = freshUserA.addresses.id(addressA1Id);
      assert.strictEqual(dbAddrA1.name, 'Consumer Alpha Renamed');
      assert.strictEqual(dbAddrA1.address, '101 Green Valley, Sector 4, Updated Villa');
      assert.strictEqual(dbAddrA1.isDefault, true);
    });

    // Test 8: Cross-consumer security - Isolation against unauthorized access
    await test('Cross-consumer security: Consumer B cannot view Consumer A addresses', async () => {
      const resB = await httpRequest(baseUrl, '/api/addresses', {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resB.status, 200);
      assert.strictEqual(resB.data.length, 0, 'Consumer B must have 0 addresses');
      assert.ok(!resB.data.some((a) => a._id === addressA1Id), 'Consumer B must not see Consumer A addresses');
    });

    // Test 9: Cross-consumer security - Unauthorized update rejected
    await test('Cross-consumer security: Consumer B cannot update Consumer A address', async () => {
      const res = await httpRequest(baseUrl, `/api/addresses/${addressA1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenB}` },
        body: {
          name: 'Malicious Attacker',
          phone: '9123456780',
          address: 'Hacker Haven 404',
          city: 'Nowhere',
          state: 'DarkNet',
          postalCode: '999999',
        },
      });
      assert.strictEqual(res.status, 404, 'Must return 404 unauthorized/not found for foreign address ID');

      // Verify Consumer A address was untouched
      const freshUserA = await User.findById(userA._id);
      const dbAddrA1 = freshUserA.addresses.id(addressA1Id);
      assert.strictEqual(dbAddrA1.name, 'Consumer Alpha Renamed');
    });

    // Test 10: Cross-consumer security - Unauthorized delete rejected
    await test('Cross-consumer security: Consumer B cannot delete Consumer A address', async () => {
      const res = await httpRequest(baseUrl, `/api/addresses/${addressA1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 404, 'Must return 404 unauthorized/not found for foreign address ID');

      // Verify Consumer A address is still intact
      const freshUserA = await User.findById(userA._id);
      assert.ok(freshUserA.addresses.id(addressA1Id), 'Address A1 must still exist');
    });

    // Test 11: Cross-consumer security - Unauthorized setDefault rejected
    await test('Cross-consumer security: Consumer B cannot set Consumer A address as default', async () => {
      const res = await httpRequest(baseUrl, `/api/addresses/${addressA1Id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 404, 'Must return 404 unauthorized/not found');
    });

    // Test 12: Delete address and verify fallback default behavior
    await test('Deleting default address designates next available address as default', async () => {
      // First ensure address A2 is default
      await httpRequest(baseUrl, `/api/addresses/${addressA2Id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      // Now delete Address A2
      const delRes = await httpRequest(baseUrl, `/api/addresses/${addressA2Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(delRes.status, 200, 'Expected 200 OK on delete');

      // The remaining address (A1) should now automatically be default
      const listRes = await httpRequest(baseUrl, '/api/addresses', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(listRes.data.length, 1, 'Should have 1 address remaining');
      assert.strictEqual(listRes.data[0]._id, addressA1Id, 'Remaining address is A1');
      assert.strictEqual(listRes.data[0].isDefault, true, 'A1 must now be default');
    });

    // Test 13: Checkout validation - Missing address rejected
    await test('Order creation rejects order without a delivery address', async () => {
      const res = await httpRequest(baseUrl, '/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          orderItems: [
            {
              name: testProduct.name,
              quantity: 1,
              price: testProduct.price,
              image: 'https://example.com/honey.png',
              product: testProduct._id,
            },
          ],
          paymentMethod: 'COD',
        },
      });
      assert.strictEqual(res.status, 400, 'Expected 400 when shippingAddress is missing');
    });

    // Test 14: Checkout security - Foreign address ID rejected
    await test('Order creation rejects address ID belonging to another consumer', async () => {
      const res = await httpRequest(baseUrl, '/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }, // Consumer B attempting to use Consumer A's address
        body: {
          orderItems: [
            {
              name: testProduct.name,
              quantity: 1,
              price: testProduct.price,
              image: 'https://example.com/honey.png',
              product: testProduct._id,
            },
          ],
          shippingAddressId: addressA1Id,
          paymentMethod: 'COD',
        },
      });
      assert.strictEqual(res.status, 400, 'Expected 400 when using foreign address ID');
      assert.ok(
        res.data.message.includes('does not exist or does not belong to you'),
        'Error message must indicate ownership violation'
      );
    });

    // Test 15: Checkout order creation - Valid address resolves to full snapshot
    await test('Order creation stores complete immutable address snapshot', async () => {
      const res = await httpRequest(baseUrl, '/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          orderItems: [
            {
              name: testProduct.name,
              quantity: 1,
              price: testProduct.price,
              image: 'https://example.com/honey.png',
              product: testProduct._id,
            },
          ],
          shippingAddressId: addressA1Id,
          paymentMethod: 'COD',
          itemsPrice: testProduct.price,
          taxPrice: Math.round(testProduct.price * 0.18 * 100) / 100,
          shippingPrice: 0,
          totalPrice: testProduct.price + Math.round(testProduct.price * 0.18 * 100) / 100,
        },
      });

      assert.strictEqual(res.status, 201, 'Expected 201 Created');
      assert.ok(res.data._id, 'Order must have _id');
      testOrderId = res.data._id;
      createdOrderIds.push(testOrderId);

      // Verify the shipping address snapshot
      const order = await Order.findById(testOrderId);
      assert.ok(order, 'Order must exist in DB');
      assert.strictEqual(order.shippingAddress.name, 'Consumer Alpha Renamed');
      assert.strictEqual(order.shippingAddress.phone, '9876543210');
      assert.strictEqual(order.shippingAddress.address, '101 Green Valley, Sector 4, Updated Villa');
      assert.strictEqual(order.shippingAddress.city, 'Noida');
      assert.strictEqual(order.shippingAddress.state, 'Uttar Pradesh');
      assert.strictEqual(order.shippingAddress.postalCode, '201301');
      assert.strictEqual(order.shippingAddress.country, 'India');
    });

    // Test 16: Order snapshot immutability verification
    await test('Subsequent consumer address modification leaves historical order snapshot untouched', async () => {
      // Consumer A now updates Address A1 to a completely different location
      const updateRes = await httpRequest(baseUrl, `/api/addresses/${addressA1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          name: 'Consumer Alpha Migrated',
          phone: '9999888877',
          address: '777 Seaside Boulevard, Marine Drive',
          addressLine2: 'Penthouse 10',
          landmark: 'Opposite Arabian Sea',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400020',
          country: 'India',
          addressType: 'Home',
          isDefault: true,
        },
      });
      assert.strictEqual(updateRes.status, 200, 'Address update succeeded');

      // Verify Consumer A address book reflects Mumbai
      const userAfterUpdate = await User.findById(userA._id);
      const currentAddr = userAfterUpdate.addresses.id(addressA1Id);
      assert.strictEqual(currentAddr.city, 'Mumbai');
      assert.strictEqual(currentAddr.address, '777 Seaside Boulevard, Marine Drive');

      // CRITICAL ASSERTION: The historical order MUST STILL HAVE the original Noida address!
      const historicalOrder = await Order.findById(testOrderId);
      assert.strictEqual(
        historicalOrder.shippingAddress.address,
        '101 Green Valley, Sector 4, Updated Villa',
        'Historical order address line must remain original'
      );
      assert.strictEqual(
        historicalOrder.shippingAddress.city,
        'Noida',
        'Historical order city must remain original Noida'
      );
      assert.strictEqual(
        historicalOrder.shippingAddress.state,
        'Uttar Pradesh',
        'Historical order state must remain Uttar Pradesh'
      );
      assert.strictEqual(
        historicalOrder.shippingAddress.postalCode,
        '201301',
        'Historical order postal code must remain 201301'
      );
      assert.strictEqual(
        historicalOrder.shippingAddress.name,
        'Consumer Alpha Renamed',
        'Historical recipient name must remain original'
      );
    });

    // Test 17: Shipping & Shiprocket payload compatibility
    await test('Order shippingAddress snapshot satisfies all Shiprocket delivery requirements', async () => {
      const order = await Order.findById(testOrderId);
      const snapshot = order.shippingAddress;

      // Assert all fields required by Shiprocket are present and clean
      assert.ok(snapshot.name && snapshot.name.length >= 2, 'Shiprocket requires customer name');
      assert.ok(snapshot.phone && /^[0-9]{10}$/.test(snapshot.phone), 'Shiprocket requires 10-digit phone');
      assert.ok(snapshot.address && snapshot.address.length >= 5, 'Shiprocket requires street address');
      assert.ok(snapshot.city && snapshot.city.length >= 2, 'Shiprocket requires valid city');
      assert.ok(snapshot.state && snapshot.state.length >= 2, 'Shiprocket requires valid state');
      assert.ok(snapshot.postalCode && /^[0-9]{6}$/.test(snapshot.postalCode), 'Shiprocket requires 6-digit postal code');
      assert.ok(snapshot.country, 'Shiprocket requires country');
    });

    // Test 18: Auth Profile integration verification
    await test('GET /api/auth/profile returns saved addresses and phone', async () => {
      const res = await httpRequest(baseUrl, '/api/auth/profile', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200, 'Expected 200 OK');
      assert.ok(Array.isArray(res.data.addresses), 'Addresses must be returned as array in profile');
      assert.strictEqual(res.data.addresses.length, 1, 'Consumer A has 1 saved address');
      assert.strictEqual(res.data.addresses[0].city, 'Mumbai');
      assert.ok(res.data.phone, 'Phone must be present in profile');
    });

  } finally {
    // ─── TEARDOWN & CLEANUP ──────────────────────────────────────────────────
    console.log(`\n${INFO} Cleaning up test fixtures...`);

    if (createdOrderIds.length > 0) {
      await Order.deleteMany({ _id: { $in: createdOrderIds } });
    }
    if (createdProductIds.length > 0) {
      await Product.deleteMany({ _id: { $in: createdProductIds } });
    }
    if (createdVendorIds.length > 0) {
      await Vendor.deleteMany({ _id: { $in: createdVendorIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }

    server.close();
    await mongoose.disconnect();
    console.log(`${INFO} Test server closed and database disconnected cleanly.\n`);
  }

  // ─── FINAL REPORT ──────────────────────────────────────────────────────────
  console.log('============================================================================');
  console.log(`TEST EXECUTION SUMMARY:`);
  console.log(`  Total:  ${passedCount + failedCount}`);
  console.log(`  Passed: ${GREEN}${passedCount}${RESET}`);
  console.log(`  Failed: ${failedCount > 0 ? RED : GREEN}${failedCount}${RESET}`);
  console.log('============================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal suite failure:', err);
  process.exit(1);
});
