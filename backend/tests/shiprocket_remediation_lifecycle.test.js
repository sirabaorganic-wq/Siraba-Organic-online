/**
 * ============================================================================
 *  SIRABA ORGANIC — SHIPROCKET REMEDIATION LIFECYCLE & VERIFICATION TEST
 *  File : backend/tests/shiprocket_remediation_lifecycle.test.js
 * ============================================================================
 */

'use strict';

const path = require('path');
const Module = require('module');

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

const PASS = `${GREEN}${BOLD}[ PASS ]${RESET}`;
const FAIL = `${RED}${BOLD}[ FAIL ]${RESET}`;

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ${PASS}  ${label}`);
    passed++;
  } else {
    console.log(`  ${FAIL}  ${label}`);
    if (detail) console.log(`         ${RED}↳ ${detail}${RESET}`);
    failed++;
  }
}

async function runRemediationTests() {
  console.log(`\n${BOLD}============================================================================${RESET}`);
  console.log(`${BOLD}  SHIPROCKET LOGISTICS REMEDIATION: E2E VERIFICATION SUITE${RESET}`);
  console.log(`${BOLD}============================================================================${RESET}\n`);

  const capturedRequests = [];
  let tokenCounter = 1;

  // Mock Axios & Redis
  const responses = {
    '/auth/login': () => ({ token: `jwt_token_${tokenCounter++}` }),
    '/orders/create/adhoc': {
      order_id: 888100,
      shipment_id: 777200,
      status: 1,
      awb_code: 'AWB_MOCK_888',
      courier_name: 'BlueDart Express',
      courier_company_id: 12,
      routing_code: 'BLR_NORTH',
      label_url: 'https://shiprocket.co/labels/AWB_MOCK_888.pdf',
    },
    '/courier/generate/pickup': {
      pickup_status: 1,
      response: {
        pickup_token_number: 'PKP_REM_99999',
        pickup_scheduled_date: '2026-06-01',
      },
    },
    '/settings/company/pickup': {
      data: {
        shipping_address: [{ pickup_location: 'ANANYA_BLR_01' }],
      },
    },
    '/orders/cancel/awb': {
      status_code: 200,
      message: 'Shipment cancelled successfully',
    },
  };

  let return401Once = false;

  const mockAxiosInstance = {
    interceptors: {
      response: {
        use: (onSuccess, onError) => {
          mockAxiosInstance._onError = onError;
        },
      },
    },
    post: async (url, data, config) => {
      const record = { method: 'POST', url, data, headers: config?.headers };
      capturedRequests.push(record);

      if (return401Once && url.includes('/courier/generate/pickup')) {
        return401Once = false;
        const err = new Error('Request failed with status code 401');
        err.response = { status: 401, data: { message: 'Unauthorized' } };
        err.config = { method: 'POST', url, data, headers: config?.headers };
        return mockAxiosInstance._onError ? mockAxiosInstance._onError(err) : Promise.reject(err);
      }

      const matchKey = Object.keys(responses).find((k) => url.includes(k));
      if (!matchKey) throw new Error(`No mock for POST ${url}`);
      const val = responses[matchKey];
      return { data: typeof val === 'function' ? val() : val };
    },
    request: async (cfg) => {
      if (cfg.method === 'POST') return mockAxiosInstance.post(cfg.url, cfg.data, cfg);
      return mockAxiosInstance.get(cfg.url, cfg);
    },
    get: async (url, config) => {
      const record = { method: 'GET', url, headers: config?.headers };
      capturedRequests.push(record);
      const matchKey = Object.keys(responses).find((k) => url.includes(k));
      if (!matchKey) return { data: {} };
      const val = responses[matchKey];
      return { data: typeof val === 'function' ? val() : val };
    },
  };

  class MockRedis {
    constructor() { this.store = {}; this.status = 'ready'; }
    async get(key) { return this.store[key] || null; }
    async set(key, val) { this.store[key] = val; }
    async del(key) { delete this.store[key]; }
  }

  const _origRequire = Module.prototype.require;
  Module.prototype.require = function (id) {
    if (id === 'axios') return { create: () => mockAxiosInstance };
    if (id === 'ioredis') return MockRedis;
    return _origRequire.apply(this, arguments);
  };

  let shiprocketService;
  try {
    delete require.cache[require.resolve('../services/shiprocketService')];
    shiprocketService = require('../services/shiprocketService');
  } finally {
    Module.prototype.require = _origRequire;
  }

  // -------------------------------------------------------------
  // TEST 1: Fresh Shipment Creation invokes generatePickup()
  // -------------------------------------------------------------
  console.log(`${BOLD}--- 1. FRESH SHIPMENT CREATION & PICKUP SCHEDULING (BUG-01) ---${RESET}`);
  capturedRequests.length = 0;

  const mockOrder = {
    _id: 'parent_order_101',
    isPaid: true,
    paymentStatus: 'captured',
    shippingAddress: {
      name: 'Ananya Roy',
      address: 'Plot 45, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
      phone: '9876500000',
    },
  };

  const mockVendorOrder = {
    _id: 'vo_item_201',
    order: mockOrder._id,
    vendor: 'vendor_fresh_01',
    items: [{ name: 'Organic Turmeric', quantity: 2, price: 150, sku: 'TURM-01' }],
    subtotal: 300,
    shippingAddress: mockOrder.shippingAddress,
    status: 'processing',
  };

  const mockVendor = {
    _id: 'vendor_fresh_01',
    businessName: 'Ananya Herbs',
    shiprocket_pickup_code: 'ANANYA_BLR_01',
  };

  const shipmentResult = await shiprocketService.createShipment(mockVendorOrder, mockOrder, mockVendor);

  const adhocCall = capturedRequests.find((r) => r.url.includes('/orders/create/adhoc'));
  const pickupCall = capturedRequests.find((r) => r.url.includes('/courier/generate/pickup'));

  assert('Order creation request sent to Shiprocket', !!adhocCall);
  assert('Pickup location is vendor-specific pickup code', adhocCall?.data?.pickup_location === 'ANANYA_BLR_01');
  assert('generatePickup() was automatically invoked', !!pickupCall);
  assert('generatePickup() payload contains shipment ID', pickupCall?.data?.shipment_id?.[0] === '777200');
  assert('Pickup response marked pickupScheduled = true', shipmentResult.pickupScheduled === true);
  assert('Pickup token number persisted', shipmentResult.pickupTokenNumber === 'PKP_REM_99999');

  // -------------------------------------------------------------
  // TEST 2: Idempotency: Duplicate creation does NOT schedule duplicate pickup
  // -------------------------------------------------------------
  console.log(`\n${BOLD}--- 2. IDEMPOTENCY & DUPLICATE PREVENTION ---${RESET}`);
  capturedRequests.length = 0;

  const alreadyScheduledVendorOrder = {
    ...mockVendorOrder,
    shipmentId: '777200',
    awbCode: 'AWB_MOCK_888',
    status: 'pickup_scheduled',
    pickupScheduledAt: new Date('2026-06-01T10:00:00Z'),
    pickupTokenNumber: 'PKP_REM_99999',
  };

  const idempotentResult = await shiprocketService.createShipment(alreadyScheduledVendorOrder, mockOrder, mockVendor);
  const dupPickupCall = capturedRequests.find((r) => r.url.includes('/courier/generate/pickup'));

  assert('Duplicate shipment request did NOT call /orders/create/adhoc', !capturedRequests.find((r) => r.url.includes('/orders/create/adhoc')));
  assert('Duplicate shipment did NOT call /courier/generate/pickup again', !dupPickupCall);
  assert('Preserved existing pickupScheduled = true', idempotentResult.pickupScheduled === true);
  assert('Preserved existing pickup token number', idempotentResult.pickupTokenNumber === 'PKP_REM_99999');

  // -------------------------------------------------------------
  // TEST 3: Fail-Closed on Missing Vendor Pickup Location
  // -------------------------------------------------------------
  console.log(`\n${BOLD}--- 3. MULTI-VENDOR FAIL-CLOSED SAFETY ---${RESET}`);
  const unconfiguredVendor = {
    _id: 'unconfigured_vendor_01',
    businessName: 'Unconfigured Farm',
  };

  let unconfiguredError = null;
  try {
    await shiprocketService.createShipment(mockVendorOrder, mockOrder, unconfiguredVendor);
  } catch (err) {
    unconfiguredError = err;
  }

  assert('Order creation fails closed when vendor pickup address is missing', unconfiguredError !== null);
  assert('Throws PICKUP_LOCATION_NOT_REGISTERED error code', unconfiguredError?.code === 'PICKUP_LOCATION_NOT_REGISTERED');

  // -------------------------------------------------------------
  // TEST 4: Shipment Cancellation using cancelShipment(awbCode)
  // -------------------------------------------------------------
  console.log(`\n${BOLD}--- 4. SHIPMENT CANCELLATION (BUG-04) ---${RESET}`);
  capturedRequests.length = 0;

  const cancelRes = await shiprocketService.cancelShipment('AWB_MOCK_888');
  const cancelCall = capturedRequests.find((r) => r.url.includes('/orders/cancel/awb'));

  assert('cancelShipment invokes /orders/cancel/awb', !!cancelCall);
  assert('cancelShipment passes awbs array in payload', cancelCall?.data?.awbs?.[0] === 'AWB_MOCK_888');
  assert('cancelShipment returns successful cancellation response', cancelRes?.status_code === 200);

  // -------------------------------------------------------------
  // TEST 5: Automatic 401 Recovery & Retry (BUG-05)
  // -------------------------------------------------------------
  console.log(`\n${BOLD}--- 5. 401 TOKEN RECOVERY & RETRY (BUG-05) ---${RESET}`);
  return401Once = true;
  capturedRequests.length = 0;

  const recoveryResult = await shiprocketService.generatePickup('777200');
  const authLogins = capturedRequests.filter((r) => r.url.includes('/auth/login'));
  const pickupAttempts = capturedRequests.filter((r) => r.url.includes('/courier/generate/pickup'));

  assert('401 triggered re-authentication', authLogins.length >= 1);
  assert('Failed request was automatically retried once', pickupAttempts.length === 2);
  assert('Second attempt succeeded after re-authenticating', recoveryResult.success === true);

  console.log(`\n${BOLD}============================================================================${RESET}`);
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`${BOLD}============================================================================${RESET}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runRemediationTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
