const path = require('path');
const backendDir = path.join(__dirname, '..');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const express = require(path.join(backendDir, 'node_modules/express'));
let axios = require(path.join(backendDir, 'node_modules/axios'));
if (axios.default) axios = axios.default;
const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));
const VendorOrder = require(path.join(backendDir, 'models/VendorOrder'));
const Order = require(path.join(backendDir, 'models/Order'));
const WebhookLog = require(path.join(backendDir, 'models/WebhookLog'));
const shiprocketWebhookRoutes = require(path.join(backendDir, 'routes/shiprocketWebhookRoutes'));

const app = express();
app.use(express.json());
app.use('/api/fulfillment/status', shiprocketWebhookRoutes);
app.use('/api/shiprocket/webhook', shiprocketWebhookRoutes);

const TEST_SECRET = 'test_webhook_secret_key_12345';
process.env.SHIPROCKET_WEBHOOK_SECRET = TEST_SECRET;

async function runTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n==================================================');
  console.log('  FULFILLMENT / SHIPROCKET WEBHOOK PRODUCTION TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extraInfo = '') {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title} ${extraInfo}`);
      failed++;
    }
  }

  // Create mock order & vendorOrder in DB
  const mockOrder = await Order.create({
    user: new mongoose.Types.ObjectId(),
    orderItems: [{ name: 'Test Product', quantity: 1, image: 'img.jpg', price: 100, product: new mongoose.Types.ObjectId() }],
    itemsPrice: 100,
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice: 100,
  });

  const mockVendorOrder = await VendorOrder.create({
    order: mockOrder._id,
    vendor: new mongoose.Types.ObjectId(),
    items: [{ name: 'Test Product', quantity: 1, price: 100 }],
    subtotal: 100,
    netAmount: 90,
    status: 'processing',
    shipmentId: '123456789',
    awbCode: 'AWB987654321',
  });

  const server = app.listen(5899);
  const baseURL = 'http://localhost:5899/api/fulfillment/status';
  const legacyURL = 'http://localhost:5899/api/shiprocket/webhook';

  const client = (headers = {}, url = baseURL) => ({
    post: async (data) => {
      try {
        const res = await axios.post(url, data, { headers, validateStatus: () => true });
        return { status: res.status, body: res.data };
      } catch (e) {
        return { status: e.response?.status || 500, body: e.response?.data || {} };
      }
    }
  });

  console.log('--- SECTION 1: AUTHENTICATION TESTS ---');

  // Test A: Correct x-api-key
  const resA = await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'IN TRANSIT', event_id: 'evt_auth_a' });
  assert('Test A: Correct x-api-key header returns HTTP 200', resA.status === 200);

  // Test B: Incorrect x-api-key
  const resB = await client({ 'x-api-key': 'wrong_secret' }).post({ shipment_id: '123456789', current_status: 'DELIVERED', event_id: 'evt_auth_b' });
  assert('Test B: Incorrect x-api-key returns HTTP 401', resB.status === 401);

  // Test C: Missing header
  const resC = await client({}).post({ shipment_id: '123456789', current_status: 'DELIVERED', event_id: 'evt_auth_c' });
  assert('Test C: Missing header returns HTTP 401', resC.status === 401);

  // Test C2: Server secret not configured fails closed with HTTP 500
  const origSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  delete process.env.SHIPROCKET_WEBHOOK_SECRET;
  const resC2 = await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'DELIVERED', event_id: 'evt_auth_c2' });
  assert('Test C2: Unset server secret fails closed (HTTP 500)', resC2.status === 500);
  process.env.SHIPROCKET_WEBHOOK_SECRET = origSecret; // restore

  // Test D: Legacy x-shiprocket-secret header
  const resD = await client({ 'x-shiprocket-secret': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'OUT FOR DELIVERY', event_id: 'evt_auth_d' });
  assert('Test D: Legacy x-shiprocket-secret header accepted (HTTP 200)', resD.status === 200);

  // Test E: Legacy URL /api/shiprocket/webhook backward compatibility
  const resLegacy = await client({ 'x-api-key': TEST_SECRET }, legacyURL).post({ shipment_id: '123456789', current_status: 'IN TRANSIT', event_id: 'evt_auth_legacy' });
  assert('Test E: Legacy /api/shiprocket/webhook route returns HTTP 200', resLegacy.status === 200);

  // Test F: Correct payload but wrong secret does not mutate DB
  const initialVO = await VendorOrder.findById(mockVendorOrder._id);
  await client({ 'x-api-key': 'fake_token_123' }).post({ shipment_id: '123456789', current_status: 'DELIVERED', event_id: 'evt_auth_f' });
  const afterVO = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test F: Unauthorized attempt does NOT mutate DB status', initialVO.status === afterVO.status);

  console.log('\n--- SECTION 2: STATUS TRANSITION & REGRESSION TESTS ---');

  // Reset status to processing in DB
  await VendorOrder.findByIdAndUpdate(mockVendorOrder._id, { status: 'processing' });

  // Test 0A: PICKUP FAILED does NOT become pickup_scheduled
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'PICKUP FAILED', event_id: 'st_t0a' });
  let vo0a = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 0A: PICKUP FAILED maps to pickup_failed (not pickup_scheduled)', vo0a.status === 'pickup_failed');

  // Test 0B: Pickup retry after failure
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'PICKUP SCHEDULED', event_id: 'st_t0b' });
  let vo0b = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 0B: pickup_failed -> pickup_scheduled retry allowed', vo0b.status === 'pickup_scheduled');

  // Test 1: pickup_scheduled -> in_transit
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'IN TRANSIT', event_id: 'st_t1' });
  let vo1 = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 1: pickup_scheduled -> in_transit', vo1.status === 'in_transit');

  // Test 2: in_transit -> out_for_delivery
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'OUT FOR DELIVERY', event_id: 'st_t2' });
  let vo2 = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 2: in_transit -> out_for_delivery', vo2.status === 'out_for_delivery');

  // Test 2B: DELIVERY FAILED maps to delivery_failed
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'DELIVERY FAILED', event_id: 'st_t2b' });
  let vo2b = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 2B: DELIVERY FAILED maps to delivery_failed (not delivered)', vo2b.status === 'delivery_failed');

  // Test 2C: Delivery retry from delivery_failed -> out_for_delivery allowed
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'OUT FOR DELIVERY', event_id: 'st_t2c' });
  let vo2c = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 2C: delivery_failed -> out_for_delivery retry allowed', vo2c.status === 'out_for_delivery');

  // Test 3: out_for_delivery -> delivered
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'DELIVERED', event_id: 'st_t3' });
  let vo3 = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 3: out_for_delivery -> delivered', vo3.status === 'delivered');

  // Test 4: delivered -> in_transit (Regression attempt)
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'IN TRANSIT', event_id: 'st_t4' });
  let vo4 = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 4: delivered -> in_transit IGNORED (Remains delivered)', vo4.status === 'delivered');

  // Test 5: delivered -> processing (Regression attempt)
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'PROCESSING', event_id: 'st_t5' });
  let vo5 = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 5: delivered -> processing IGNORED (Remains delivered)', vo5.status === 'delivered');

  // Test 6: delivered -> cancelled (Regression attempt)
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'CANCELLED', event_id: 'st_t6' });
  let vo6 = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 6: delivered -> cancelled IGNORED (Remains delivered)', vo6.status === 'delivered');

  // Test 7: rto -> in_transit
  mockVendorOrder.status = 'rto';
  await mockVendorOrder.save();
  await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'IN TRANSIT', event_id: 'st_t7' });
  let vo7 = await VendorOrder.findById(mockVendorOrder._id);
  assert('Test 7: rto -> in_transit IGNORED (Remains rto)', vo7.status === 'rto');

  console.log('\n--- SECTION 3: IDEMPOTENCY TESTS ---');

  // Test 8: Same webhook delivered twice
  const resDup1 = await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'DELIVERED', event_id: 'dup_test_event_99' });
  const resDup2 = await client({ 'x-api-key': TEST_SECRET }).post({ shipment_id: '123456789', current_status: 'DELIVERED', event_id: 'dup_test_event_99' });
  assert('Test 8: First delivery returns 200 OK', resDup1.status === 200 && resDup1.body.message === 'Webhook processed successfully');
  assert('Test 8: Second delivery returns 200 OK with "Event already processed"', resDup2.status === 200 && resDup2.body.message === 'Event already processed');

  // Clean up mock data
  await Order.findByIdAndDelete(mockOrder._id);
  await VendorOrder.findByIdAndDelete(mockVendorOrder._id);
  await WebhookLog.deleteMany({ source: 'shiprocket' });
  server.close();

  console.log('\n==================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
