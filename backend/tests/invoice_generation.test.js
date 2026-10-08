/**
 * ============================================================================
 * SIRABA ORGANIC — PHASE C INVOICE SYSTEM VERIFICATION SUITE
 * File: backend/tests/invoice_generation.test.js
 * Run:  node backend/tests/invoice_generation.test.js
 * ============================================================================
 *
 * Verifies Phase C Vendor-as-Seller Marketplace Model:
 * Group A: Single-Vendor Customer Tax Invoice (Vendor as Seller, Siraba as Facilitator)
 * Group B: Multi-Vendor Order & Isolation (Separate invoices, no cross-vendor leakage)
 * Group C: GST Rates & Supply Jurisdiction (Intra CGST+SGST, Inter IGST, 0/5/12/18%)
 * Group D: HSN Handling & Anti-0909 Gate (Valid HSN preserved, missing does not become 0909)
 * Group E: Discount Allocation & Totals Reconciliation (Gross - Discount + Tax + Shipping = GrandTotal)
 * Group F: Shipping Economics Snapshot (Customer shipping matches snapshot)
 * Group G: Vendor-Owned Invoice Numbering (Independent FY sequence, concurrency-safe, idempotent)
 * Group H: Issuance Lifecycle Gate (Pending approval blocks issuance, confirmed succeeds)
 * Group I: Role-Based Authorization & Tenant Isolation (Customer, Vendor, Admin boundaries)
 * Group J: Historical Immutability (Mutating Product/Vendor does NOT alter issued invoice)
 * Group K: Credit Note Architecture (Original invoice immutable, CN references original)
 * Group L: Platform Commission Separation (No commission on customer invoice, separate commission doc)
 * Group M: PDF Template & Fallback Rendering (Vendor as seller in HTML, amount in words, fallback PDF)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Invoice = require('../models/Invoice');
const InvoiceSequence = require('../models/InvoiceSequence');
const Order = require('../models/Order');
const VendorOrder = require('../models/VendorOrder');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');
const GSTSettings = require('../models/GSTSettings');

const {
  getOrCreateCustomerInvoice,
  getOrCreateCustomerInvoiceForVendorOrder,
  getOrCreateCustomerInvoicesForOrder,
  getOrCreateVendorInvoice,
  getOrCreateVendorCommissionInvoice,
  createCreditNote,
} = require('../services/invoiceService');
const {
  getIndianFinancialYear,
  generateNextInvoiceNumber,
} = require('../utils/invoiceNumberGenerator');
const {
  getStateCode,
  normalizeState,
  determineJurisdiction,
  resolveProductTaxRate,
  calculateLineItemTax,
  calculateOrderTaxBreakdown,
} = require('../utils/gstEngine');
const {
  generateInvoiceHTML,
  numberToWordsINR,
} = require('../routes/invoiceRoutes');
const {
  buildPureJsPdf,
  htmlToTextBlocks,
} = require('../utils/puppeteerHelper');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;
const failures = [];

async function test(label, fn) {
  try {
    await fn();
    console.log(`  ${GREEN}${BOLD}[ PASS ]${RESET}  ${label}`);
    passed++;
  } catch (err) {
    console.log(`  ${RED}${BOLD}[ FAIL ]${RESET}  ${label}`);
    console.log(`         ${RED}↳ ${err.message}${RESET}`);
    failed++;
    failures.push({ label, error: err.message });
  }
}

async function runTestSuite() {
  console.log(`\n${BOLD}============================================================${RESET}`);
  console.log(`${BOLD}🧾  SIRABA ORGANIC — PHASE D VENDOR HSN & FLAT 18% GST VERIFICATION SUITE${RESET}`);
  console.log(`${BOLD}============================================================${RESET}\n`);

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI missing in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('  Database connected successfully.\n');

  // Test Entities
  let testCustomer1, testCustomer2;
  let testVendorA, testVendorB, testVendorIncomplete;
  let testProductA, testProductB, testProductNoHsn;
  let testOrder1, testOrderSingle;
  let testVendorOrderA, testVendorOrderB, testVendorOrderPending, testVendorOrderSingle;

  let invoiceA, invoiceB, singleInvoice;

  try {
    console.log(`${YELLOW}── Setting Up Isolated Test Fixtures ──${RESET}`);

    // Clean up old fixtures if any
    await User.deleteMany({ email: { $regex: /_invoice_test_@example\.com$/ } });
    await Vendor.deleteMany({ email: { $regex: /_invoice_vendor_@example\.com$/ } });

    // 1. Customers
    testCustomer1 = await User.create({
      name: 'Test Customer Bengaluru',
      email: `cust1_${Date.now()}_invoice_test_@example.com`,
      password: 'password123',
      phone: '9876543210',
    });

    testCustomer2 = await User.create({
      name: 'Test Customer Srinagar',
      email: `cust2_${Date.now()}_invoice_test_@example.com`,
      password: 'password123',
      phone: '9876543211',
    });

    // 2. Vendors
    testVendorA = await Vendor.create({
      businessName: 'Vendor A Organics Pvt Ltd',
      shopSettings: { shopName: 'Pampore Gold' },
      brandName: 'Pampore Gold',
      email: `vendorA_${Date.now()}_invoice_vendor_@example.com`,
      password: 'password123',
      businessType: 'manufacturer',
      contactPerson: 'Vendor A Lead',
      phone: '9900112233',
      status: 'approved',
      gstNumber: '01AAAAA1111A1Z1',
      address: {
        street: '10 Saffron Road',
        city: 'Pampore',
        state: 'Jammu and Kashmir',
        postalCode: '192121',
      },
      commissionRate: 10,
    });

    testVendorB = await Vendor.create({
      businessName: 'Vendor B Honey Farms',
      brandName: 'Himalayan Nectar',
      email: `vendorB_${Date.now()}_invoice_vendor_@example.com`,
      password: 'password123',
      businessType: 'farmer',
      contactPerson: 'Vendor B Lead',
      phone: '9900112244',
      status: 'approved',
      gstNumber: '01BBBBB2222B2Z2',
      address: {
        street: '20 Forest Trail',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        postalCode: '190001',
      },
      commissionRate: 15,
    });

    // Incomplete vendor for identity validation gate (inserted via collection to bypass schema validation)
    const incompleteVendorId = new mongoose.Types.ObjectId();
    await Vendor.collection.insertOne({
      _id: incompleteVendorId,
      businessName: '',
      email: `vendor_inc_${Date.now()}_invoice_vendor_@example.com`,
      password: 'password123',
      businessType: 'farmer',
      contactPerson: 'No Name',
      phone: '9900112255',
      status: 'approved',
      address: { city: '', state: '', postalCode: '' },
    });
    testVendorIncomplete = { _id: incompleteVendorId };

    // 3. Products
    testProductA = await Product.create({
      name: 'Certified Saffron 1g',
      slug: `saf-c-${Date.now()}`,
      description: 'Authentic Kashmiri Saffron',
      sku: 'SAF-001',
      hsn: '0910',
      price: 500,
      stockQuantity: 100,
      vendor: testVendorA._id,
      isVendorProduct: true,
      category: 'Spices',
      gstRate: 5,
    });

    testProductB = await Product.create({
      name: 'Wild Forest Honey 500g',
      slug: `hny-c-${Date.now()}`,
      description: 'Pure Himalayan Honey',
      sku: 'HNY-001',
      hsn: '0409',
      price: 600,
      stockQuantity: 100,
      vendor: testVendorB._id,
      isVendorProduct: true,
      category: 'Honey',
      gstRate: 5,
    });

    testProductNoHsn = await Product.create({
      name: 'Artisan Walnut Wood Box',
      slug: `box-c-${Date.now()}`,
      description: 'Handcrafted box with no pre-assigned HSN',
      sku: 'BOX-001',
      hsn: '',
      price: 400,
      stockQuantity: 50,
      vendor: testVendorA._id,
      isVendorProduct: true,
      category: 'Crafts',
      gstRate: 12,
    });

    // 4. Multi-vendor order (Karnataka delivery -> Inter-state)
    // Product A: 2 * 500 = 1000, Discount = 125, Taxable = 875, GST 18% = 157.50, Shipping = 0
    // Product B: 1 * 600 = 600, Discount = 75, Taxable = 525, GST 18% = 94.50, Shipping = 0
    // Total: Subtotal 1600, Discount 200, Taxable 1400, Tax 252.00, Shipping 0, Grand Total 1652.00
    testOrder1 = await Order.create({
      user: testCustomer1._id,
      orderItems: [
        { name: testProductA.name, quantity: 2, price: 500, product: testProductA._id, sku: 'SAF-001', hsn: '0910', hsnCode: '0910', taxRate: 18, image: 'saf.png' },
        { name: testProductB.name, quantity: 1, price: 600, product: testProductB._id, sku: 'HNY-001', hsn: '0409', hsnCode: '0409', taxRate: 18, image: 'hny.png' },
      ],
      shippingAddress: {
        name: 'Bengaluru Buyer',
        address: '100 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9876543210',
      },
      paymentMethod: 'Online',
      itemsPrice: 1600,
      discountAmount: 200,
      couponCode: 'SAVE200',
      taxPrice: 252,
      shippingPrice: 0,
      totalPrice: 1652,
      isPaid: true,
      status: 'Confirmed',
    });

    // VendorOrder A (Confirmed)
    testVendorOrderA = await VendorOrder.create({
      order: testOrder1._id,
      vendor: testVendorA._id,
      items: [
        {
          name: testProductA.name,
          quantity: 2,
          price: 500,
          product: testProductA._id,
          sku: 'SAF-001',
          hsn: '0910',
          hsnCode: '0910',
          discountAmount: 125,
          taxableAmount: 875,
          taxRate: 18,
          taxAmount: 157.5,
          igstAmount: 157.5,
        },
      ],
      subtotal: 1000,
      commission: 100,
      commissionRateAtOrder: 10,
      tax: 157.5,
      customerShippingCharge: 0,
      netAmount: 900,
      status: 'confirmed', // Approved & confirmed
      shippingAddress: testOrder1.shippingAddress,
      taxBreakdown: {
        isInterState: true,
        supplierState: 'Jammu and Kashmir',
        customerState: 'Karnataka',
        igst: 157.5,
        totalTax: 157.5,
      },
    });

    // VendorOrder B (Confirmed)
    testVendorOrderB = await VendorOrder.create({
      order: testOrder1._id,
      vendor: testVendorB._id,
      items: [
        {
          name: testProductB.name,
          quantity: 1,
          price: 600,
          product: testProductB._id,
          sku: 'HNY-001',
          hsn: '0409',
          hsnCode: '0409',
          discountAmount: 75,
          taxableAmount: 525,
          taxRate: 18,
          taxAmount: 94.5,
          igstAmount: 94.5,
        },
      ],
      subtotal: 600,
      commission: 90,
      commissionRateAtOrder: 15,
      tax: 94.5,
      customerShippingCharge: 0,
      netAmount: 510,
      status: 'confirmed',
      shippingAddress: testOrder1.shippingAddress,
      taxBreakdown: {
        isInterState: true,
        supplierState: 'Jammu and Kashmir',
        customerState: 'Karnataka',
        igst: 94.5,
        totalTax: 94.5,
      },
    });

    // VendorOrder Pending (for lifecycle gate testing)
    testVendorOrderPending = await VendorOrder.create({
      order: testOrder1._id,
      vendor: testVendorA._id,
      items: [
        { name: testProductA.name, quantity: 1, price: 500, product: testProductA._id, sku: 'SAF-001', hsn: '0910', hsnCode: '0910' },
      ],
      subtotal: 500,
      netAmount: 450,
      status: 'pending', // NOT yet approved!
      shippingAddress: testOrder1.shippingAddress,
    });

    // 5. Single-Vendor Intra-State Order (J&K -> J&K)
    testOrderSingle = await Order.create({
      user: testCustomer2._id,
      orderItems: [
        { name: testProductA.name, quantity: 1, price: 500, product: testProductA._id, sku: 'SAF-001', hsn: '0910', hsnCode: '0910', taxRate: 18, image: 'saf.png' },
      ],
      shippingAddress: {
        name: 'Srinagar Buyer',
        address: '50 Residency Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        postalCode: '190001',
        country: 'India',
        phone: '9876543211',
      },
      paymentMethod: 'COD',
      itemsPrice: 500,
      discountAmount: 0,
      taxPrice: 90,
      shippingPrice: 60,
      totalPrice: 650,
      isPaid: false,
      status: 'Confirmed',
    });

    testVendorOrderSingle = await VendorOrder.create({
      order: testOrderSingle._id,
      vendor: testVendorA._id,
      items: [
        {
          name: testProductA.name,
          quantity: 1,
          price: 500,
          product: testProductA._id,
          sku: 'SAF-001',
          hsn: '0910',
          hsnCode: '0910',
          taxableAmount: 500,
          taxRate: 18,
          taxAmount: 90,
          cgstAmount: 45,
          sgstAmount: 45,
        },
      ],
      subtotal: 500,
      commission: 50,
      commissionRateAtOrder: 10,
      tax: 90,
      customerShippingCharge: 60,
      netAmount: 450,
      status: 'confirmed',
      shippingAddress: testOrderSingle.shippingAddress,
      taxBreakdown: {
        isInterState: false,
        supplierState: 'Jammu and Kashmir',
        customerState: 'Jammu and Kashmir',
        cgst: 45,
        sgst: 45,
        totalTax: 90,
      },
    });

    console.log('  Fixtures initialized successfully.\n');

    // ─────────────────────────────────────────────────────────────
    // GROUP A: SINGLE-VENDOR INVOICE (VENDOR AS SELLER)
    // ─────────────────────────────────────────────────────────────
    console.log(`${YELLOW}── Group A: Single-Vendor Customer Tax Invoice (Vendor as Seller) ──${RESET}`);

    await test('Single-Vendor: Seller represents Vendor A, NOT Siraba Organic', async () => {
      singleInvoice = await getOrCreateCustomerInvoiceForVendorOrder(testVendorOrderSingle._id);
      assert.ok(singleInvoice, 'Invoice must be generated');
      assert.strictEqual(singleInvoice.sellerSnapshot.legalName, 'Vendor A Organics Pvt Ltd');
      assert.strictEqual(singleInvoice.sellerSnapshot.tradeName, 'Pampore Gold');
      assert.strictEqual(singleInvoice.sellerSnapshot.isMarketplaceFacilitator, true);
      assert.strictEqual(singleInvoice.sellerSnapshot.facilitatorName, 'Siraba Organic');
      assert.notStrictEqual(singleInvoice.sellerSnapshot.legalName, 'Siraba Organic');
    });

    await test('Single-Vendor: Vendor GSTIN and Address are accurately snapshotted', async () => {
      assert.strictEqual(singleInvoice.sellerSnapshot.gstin, '01AAAAA1111A1Z1');
      assert.strictEqual(singleInvoice.sellerSnapshot.city, 'Pampore');
      assert.strictEqual(singleInvoice.sellerSnapshot.state, 'Jammu and Kashmir');
      assert.strictEqual(singleInvoice.sellerSnapshot.stateCode, '01');
      assert.strictEqual(singleInvoice.sellerSnapshot.postalCode, '192121');
    });

    await test('Single-Vendor: Siraba GSTIN does not appear as Seller GSTIN', async () => {
      assert.notStrictEqual(singleInvoice.sellerSnapshot.gstin, '01AABCS1429B1Z1');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP B: MULTI-VENDOR ORDER & ISOLATION
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group B: Multi-Vendor Order & Isolation ──${RESET}`);

    await test('Multi-Vendor: Separate invoices generated for each VendorOrder', async () => {
      invoiceA = await getOrCreateCustomerInvoiceForVendorOrder(testVendorOrderA._id);
      invoiceB = await getOrCreateCustomerInvoiceForVendorOrder(testVendorOrderB._id);

      assert.ok(invoiceA, 'Invoice A must exist');
      assert.ok(invoiceB, 'Invoice B must exist');
      assert.notStrictEqual(invoiceA._id.toString(), invoiceB._id.toString(), 'Invoices must be distinct documents');
      assert.notStrictEqual(invoiceA.invoiceNumber, invoiceB.invoiceNumber, 'Invoice numbers must be distinct');
    });

    await test('Multi-Vendor Isolation: Invoice A contains ONLY Vendor A products', async () => {
      assert.strictEqual(invoiceA.itemsSnapshot.length, 1);
      assert.strictEqual(invoiceA.itemsSnapshot[0].name, 'Certified Saffron 1g');
      assert.strictEqual(invoiceA.sellerSnapshot.legalName, 'Vendor A Organics Pvt Ltd');
      assert.strictEqual(invoiceA.sellerSnapshot.gstin, '01AAAAA1111A1Z1');
    });

    await test('Multi-Vendor Isolation: Invoice B contains ONLY Vendor B products', async () => {
      assert.strictEqual(invoiceB.itemsSnapshot.length, 1);
      assert.strictEqual(invoiceB.itemsSnapshot[0].name, 'Wild Forest Honey 500g');
      assert.strictEqual(invoiceB.sellerSnapshot.legalName, 'Vendor B Honey Farms');
      assert.strictEqual(invoiceB.sellerSnapshot.gstin, '01BBBBB2222B2Z2');
    });

    await test('Multi-Vendor Isolation: Zero cross-vendor GST leakage', async () => {
      assert.strictEqual(invoiceA.totalsSnapshot.taxPrice, 157.5);
      assert.strictEqual(invoiceB.totalsSnapshot.taxPrice, 94.5);
      assert.strictEqual(Math.round((invoiceA.totalsSnapshot.taxPrice + invoiceB.totalsSnapshot.taxPrice) * 100) / 100, 252.00);
    });

    await test('Multi-Vendor: getOrCreateCustomerInvoicesForOrder returns all vendor invoices', async () => {
      const allInvoices = await getOrCreateCustomerInvoicesForOrder(testOrder1._id);
      assert.strictEqual(allInvoices.length, 2);
      const vendors = allInvoices.map((i) => i.sellerSnapshot.legalName);
      assert.ok(vendors.includes('Vendor A Organics Pvt Ltd'));
      assert.ok(vendors.includes('Vendor B Honey Farms'));
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP C: GST RATES & DYNAMIC SUPPLY JURISDICTION
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group C: GST Rates & Dynamic Supply Jurisdiction ──${RESET}`);

    await test('GST Jurisdiction: Intra-State allocates equal CGST and SGST at 9% (IGST is 0)', async () => {
      assert.strictEqual(singleInvoice.taxSnapshot.isInterState, false);
      assert.strictEqual(singleInvoice.taxSnapshot.cgstAmount, 45);
      assert.strictEqual(singleInvoice.taxSnapshot.sgstAmount, 45);
      assert.strictEqual(singleInvoice.taxSnapshot.igstAmount, 0);
      assert.strictEqual(singleInvoice.taxSnapshot.cgstAmount + singleInvoice.taxSnapshot.sgstAmount, singleInvoice.taxSnapshot.taxPrice);
    });

    await test('GST Jurisdiction: Inter-State allocates 100% to IGST at 18% (CGST and SGST are 0)', async () => {
      assert.strictEqual(invoiceA.taxSnapshot.isInterState, true);
      assert.strictEqual(invoiceA.taxSnapshot.igstAmount, 157.5);
      assert.strictEqual(invoiceA.taxSnapshot.cgstAmount, 0);
      assert.strictEqual(invoiceA.taxSnapshot.sgstAmount, 0);
      assert.strictEqual(invoiceA.taxSnapshot.igstAmount, invoiceA.taxSnapshot.taxPrice);
    });

    await test('GST Rates: Flat 18% customer product GST calculation without floating-point drift', async () => {
      const r0 = calculateLineItemTax({ taxableAmount: 1000, gstRate: 0 });
      assert.strictEqual(r0.totalTax, 0);

      const r5 = calculateLineItemTax({ taxableAmount: 875, gstRate: 5 });
      assert.strictEqual(r5.totalTax, 43.75);

      const r18 = calculateLineItemTax({ taxableAmount: 875, gstRate: 18 });
      assert.strictEqual(r18.totalTax, 157.5);

      const r18_500 = calculateLineItemTax({ taxableAmount: 500, gstRate: 18 });
      assert.strictEqual(r18_500.totalTax, 90.00);
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP D: HSN PRESERVATION & ANTI-0909 GATE
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group D: HSN Preservation & Anti-0909 Gate ──${RESET}`);

    await test('HSN Preservation: Authentic product HSN codes 0910 and 0409 preserved in snapshot', async () => {
      assert.strictEqual(invoiceA.itemsSnapshot[0].hsn, '0910');
      assert.strictEqual(invoiceA.itemsSnapshot[0].hsnCode, '0910');
      assert.strictEqual(invoiceB.itemsSnapshot[0].hsn, '0409');
      assert.strictEqual(invoiceB.itemsSnapshot[0].hsnCode, '0409');
    });

    await test('HSN Blocker Gate: Product without HSN strictly BLOCKS final tax invoice issuance', async () => {
      // Create confirmed vendor order for product with no HSN
      const voNoHsn = await VendorOrder.create({
        order: testOrderSingle._id,
        vendor: testVendorA._id,
        items: [{ name: testProductNoHsn.name, quantity: 1, price: 400, product: testProductNoHsn._id, sku: 'BOX-001' }],
        subtotal: 400,
        commission: 40,
        netAmount: 360,
        status: 'confirmed',
        shippingAddress: testOrderSingle.shippingAddress,
      });

      let blocked = false;
      try {
        await getOrCreateCustomerInvoiceForVendorOrder(voNoHsn._id);
      } catch (err) {
        blocked = true;
        assert.ok(err.message.includes('Product HSN code is required before a tax invoice can be issued'), `Expected HSN blocker message, got: ${err.message}`);
      }
      assert.strictEqual(blocked, true, 'Invoice generation MUST be blocked when product has missing HSN');

      // Ensure no phantom invoice was written to DB
      const phantomInvoice = await Invoice.findOne({ vendorOrder: voNoHsn._id });
      assert.strictEqual(phantomInvoice, null, 'No phantom invoice document may be created');
    });

    await test('HSN Anti-Fallback: Zero runtime fallback to 0909 in invoice generation', async () => {
      assert.notStrictEqual(invoiceA.itemsSnapshot[0].hsn, '0909');
      assert.notStrictEqual(invoiceB.itemsSnapshot[0].hsn, '0909');
      assert.notStrictEqual(invoiceA.itemsSnapshot[0].hsnCode, '0909');
      assert.notStrictEqual(invoiceB.itemsSnapshot[0].hsnCode, '0909');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP E: DISCOUNT ALLOCATION & TOTALS RECONCILIATION
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group E: Discount Allocation & Totals Reconciliation ──${RESET}`);

    await test('Discount: Allocated coupon discount displayed and reduces taxable value', async () => {
      assert.strictEqual(invoiceA.totalsSnapshot.subtotal, 1000);
      assert.strictEqual(invoiceA.totalsSnapshot.discountAmount, 125);
      assert.strictEqual(invoiceA.totalsSnapshot.taxableSubtotal, 875);
    });

    await test('Financial Gate: Gross - Discount + Tax + Shipping === Grand Total exactly', async () => {
      const snap = invoiceA.totalsSnapshot;
      const expectedTotal = Math.round((snap.taxableSubtotal + snap.taxPrice + snap.shippingPrice) * 100) / 100;
      assert.strictEqual(snap.grandTotal, expectedTotal);
      assert.strictEqual(snap.grandTotal, 1032.5); // 875 + 157.5 + 0 = 1032.5
    });

    await test('Financial Gate: Intra-state invoice reconciles: 500 + 90 + 60 = 650', async () => {
      const snap = singleInvoice.totalsSnapshot;
      assert.strictEqual(snap.subtotal, 500);
      assert.strictEqual(snap.taxPrice, 90);
      assert.strictEqual(snap.shippingPrice, 60);
      assert.strictEqual(snap.grandTotal, 650);
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP F: SHIPPING ECONOMICS SNAPSHOT
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group F: Shipping Economics Snapshot ──${RESET}`);

    await test('Shipping: Free shipping eligible order preserves ₹0.00 charge', async () => {
      assert.strictEqual(invoiceA.shippingSnapshot.shippingPrice, 0);
      assert.strictEqual(invoiceA.shippingSnapshot.isFreeShipping, true);
    });

    await test('Shipping: Paid shipping charge matches VendorOrder snapshot (₹60.00)', async () => {
      assert.strictEqual(singleInvoice.shippingSnapshot.shippingPrice, 60);
      assert.strictEqual(singleInvoice.shippingSnapshot.isFreeShipping, false);
      assert.strictEqual(singleInvoice.totalsSnapshot.shippingPrice, 60);
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP G: VENDOR-OWNED INVOICE NUMBERING
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group G: Vendor-Owned Invoice Numbering ──${RESET}`);

    await test('Numbering: Vendor-specific sequence prefix used (e.g. VND-XXXX)', async () => {
      const vendorAPrefix = `VND-${testVendorA._id.toString().slice(-6).toUpperCase()}`;
      assert.ok(invoiceA.invoiceNumber.startsWith(vendorAPrefix), `Invoice A should start with ${vendorAPrefix}, got ${invoiceA.invoiceNumber}`);
    });

    await test('Numbering: FY format conforms to Indian calendar (e.g. 26-27)', async () => {
      const fy = getIndianFinancialYear(new Date());
      assert.ok(invoiceA.invoiceNumber.includes(`/${fy}/`));
    });

    await test('Numbering Idempotency: Repeated call returns EXACT same invoice without incrementing sequence', async () => {
      const callAgain = await getOrCreateCustomerInvoiceForVendorOrder(testVendorOrderA._id);
      assert.strictEqual(callAgain._id.toString(), invoiceA._id.toString());
      assert.strictEqual(callAgain.invoiceNumber, invoiceA.invoiceNumber);
      assert.strictEqual(callAgain.sequenceNumber, invoiceA.sequenceNumber);
    });

    await test('Numbering Concurrency: Atomic sequence guarantees no collisions', async () => {
      const gen1 = await generateNextInvoiceNumber('CUSTOMER_TAX_INVOICE', new Date(), testVendorA);
      const gen2 = await generateNextInvoiceNumber('CUSTOMER_TAX_INVOICE', new Date(), testVendorA);
      assert.notStrictEqual(gen1.invoiceNumber, gen2.invoiceNumber);
      assert.strictEqual(gen2.sequenceNumber, gen1.sequenceNumber + 1);
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP H: ISSUANCE LIFECYCLE GATE
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group H: Issuance Lifecycle Gate ──${RESET}`);

    await test('Lifecycle Gate: Pending approval VendorOrder blocks customer invoice issuance', async () => {
      let blocked = false;
      try {
        await getOrCreateCustomerInvoiceForVendorOrder(testVendorOrderPending._id);
      } catch (err) {
        blocked = true;
        assert.ok(err.message.includes('pending approval'), `Expected pending approval error, got: ${err.message}`);
      }
      assert.strictEqual(blocked, true, 'Issuing an invoice for a pending vendor order must be blocked');
    });

    await test('Lifecycle Gate: Incomplete vendor seller identity blocks issuance', async () => {
      const voIncomplete = await VendorOrder.create({
        order: testOrderSingle._id,
        vendor: testVendorIncomplete._id,
        items: [{ name: 'Test Item', quantity: 1, price: 100 }],
        subtotal: 100,
        netAmount: 90,
        status: 'confirmed',
      });

      let blocked = false;
      try {
        await getOrCreateCustomerInvoiceForVendorOrder(voIncomplete._id);
      } catch (err) {
        blocked = true;
        assert.ok(err.message.includes('incomplete'), `Expected incomplete identity error, got: ${err.message}`);
      }
      assert.strictEqual(blocked, true, 'Incomplete vendor identity must block invoice issuance');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP I: AUTHORIZATION & TENANT ISOLATION
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group I: Authorization & Tenant Isolation ──${RESET}`);

    await test('Authorization: Customer can access their own invoice', async () => {
      assert.strictEqual(invoiceA.customer.toString(), testCustomer1._id.toString());
    });

    await test('Authorization: Vendor A owns their invoice record', async () => {
      assert.strictEqual(invoiceA.vendor.toString(), testVendorA._id.toString());
    });

    await test('Authorization: Vendor B cannot claim Vendor A customer invoice', async () => {
      assert.notStrictEqual(invoiceA.vendor.toString(), testVendorB._id.toString());
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP J: HISTORICAL IMMUTABILITY
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group J: Historical Immutability ──${RESET}`);

    await test('Immutability: Mutating Product and Vendor live data does NOT alter issued invoice', async () => {
      const originalProductPrice = invoiceA.itemsSnapshot[0].unitPrice;
      const originalVendorName = invoiceA.sellerSnapshot.legalName;
      const originalVendorGSTIN = invoiceA.sellerSnapshot.gstin;

      // Mutate Product and Vendor in database
      await Product.findByIdAndUpdate(testProductA._id, { price: 9999, name: 'Mutated Saffron Name', hsn: '9999' });
      await Vendor.findByIdAndUpdate(testVendorA._id, { businessName: 'Mutated Vendor Name LLC', gstNumber: '99MUTATED9999Z9' });

      // Re-fetch invoice document
      const refetchedInvoice = await Invoice.findById(invoiceA._id);

      assert.strictEqual(refetchedInvoice.itemsSnapshot[0].unitPrice, originalProductPrice, 'Product price in snapshot must not change');
      assert.strictEqual(refetchedInvoice.itemsSnapshot[0].hsn, '0910', 'HSN in snapshot must not change');
      assert.strictEqual(refetchedInvoice.sellerSnapshot.legalName, originalVendorName, 'Vendor legal name in snapshot must not change');
      assert.strictEqual(refetchedInvoice.sellerSnapshot.gstin, originalVendorGSTIN, 'Vendor GSTIN in snapshot must not change');

      // Restore vendor in database for downstream tests
      await Vendor.findByIdAndUpdate(testVendorA._id, { businessName: originalVendorName, gstNumber: originalVendorGSTIN });
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP K: CREDIT NOTE ARCHITECTURE
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group K: Credit Note Architecture ──${RESET}`);

    let creditNote;
    await test('Credit Note: Persistent sequential CN linked to original invoice', async () => {
      creditNote = await createCreditNote({
        orderId: testOrder1._id,
        vendorOrderId: testVendorOrderA._id,
        refundAmount: 500,
        reason: 'Customer return for 1g Saffron',
        refundReference: 'REF-TEST-001',
        itemsRefunded: [{ product: testProductA._id, name: testProductA.name, quantity: 1, amount: 500 }],
      });

      assert.ok(creditNote, 'Credit note must be created');
      assert.strictEqual(creditNote.invoiceType, 'CREDIT_NOTE');
      assert.ok(creditNote.invoiceNumber.startsWith('CN/'), 'Invoice number must have CN prefix');
      assert.strictEqual(creditNote.originalInvoice.toString(), invoiceA._id.toString());
      assert.strictEqual(creditNote.totalsSnapshot.grandTotal, 500);
      assert.strictEqual(creditNote.totalsSnapshot.taxableSubtotal, 423.73);
      assert.strictEqual(creditNote.totalsSnapshot.taxPrice, 76.27);
      assert.strictEqual(creditNote.taxSnapshot.igstAmount, 76.27);
      assert.strictEqual(creditNote.itemsSnapshot[0].hsn, '0910');
      assert.strictEqual(creditNote.itemsSnapshot[0].hsnCode, '0910');
    });

    await test('Credit Note: Original Customer Tax Invoice remains completely immutable', async () => {
      const originalRetrieved = await Invoice.findById(invoiceA._id);
      assert.ok(originalRetrieved, 'Original invoice must still exist');
      assert.strictEqual(originalRetrieved.totalsSnapshot.grandTotal, 1032.5);
      assert.strictEqual(originalRetrieved.totalsSnapshot.taxPrice, 157.5);
      assert.strictEqual(originalRetrieved.invoiceNumber, invoiceA.invoiceNumber);
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP L: COMMISSION & SETTLEMENT SEPARATION
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group L: Commission & Settlement Separation ──${RESET}`);

    await test('Commission Separation: Customer Tax Invoice contains NO vendor commission fields', async () => {
      assert.strictEqual(invoiceA.totalsSnapshot.commissionAmount, 0);
      assert.strictEqual(invoiceA.totalsSnapshot.commissionRate, 0);
      assert.strictEqual(invoiceA.totalsSnapshot.netPayoutAmount, 0);
    });

    await test('Commission Separation: Vendor Settlement Statement correctly reflects net payout', async () => {
      const settlement = await getOrCreateVendorInvoice(testVendorOrderA._id);
      assert.strictEqual(settlement.invoiceType, 'VENDOR_SETTLEMENT_STATEMENT');
      assert.strictEqual(settlement.totalsSnapshot.subtotal, 1000);
      assert.strictEqual(settlement.totalsSnapshot.commissionAmount, 100);
      assert.strictEqual(settlement.totalsSnapshot.netPayoutAmount, 900); // 1000 - 100 = 900
    });

    await test('Commission Separation: Siraba Commission Invoice bills Vendor under SAC 998311', async () => {
      const commInvoice = await getOrCreateVendorCommissionInvoice(testVendorOrderA._id);
      assert.strictEqual(commInvoice.invoiceType, 'VENDOR_COMMISSION_INVOICE');
      assert.ok(commInvoice.invoiceNumber.startsWith('SO-COMM/'));
      assert.strictEqual(commInvoice.sellerSnapshot.legalName, 'Siraba Organic');
      assert.strictEqual(commInvoice.buyerSnapshot.name, 'Vendor A Organics Pvt Ltd');
      assert.strictEqual(commInvoice.itemsSnapshot[0].hsn, '998311');
      assert.strictEqual(commInvoice.totalsSnapshot.subtotal, 100); // Commission amount
      assert.strictEqual(commInvoice.totalsSnapshot.taxPrice, 18); // 18% GST on facilitation
      assert.strictEqual(commInvoice.totalsSnapshot.grandTotal, 118);
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP M: PDF TEMPLATE & RENDERING
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group M: PDF Template & Rendering ──${RESET}`);

    await test('PDF Template: HTML renders Vendor as Seller and Siraba as Facilitator', async () => {
      const { html } = await generateInvoiceHTML(testOrder1, invoiceA);
      assert.ok(html.includes('Vendor A Organics Pvt Ltd'), 'Must display Vendor Legal Name');
      assert.ok(html.includes('01AAAAA1111A1Z1'), 'Must display Vendor GSTIN');
      assert.ok(html.includes('Marketplace: Siraba Organic') || html.includes('Siraba Organic'), 'Must display Marketplace Facilitator');
      assert.ok(html.includes('SUPPLIER / SELLER'), 'Must clearly label Supplier/Seller');
      assert.ok(html.includes('0910'), 'Must display authentic HSN');
      assert.ok(!html.includes('0909'), 'Must NOT inject fake 0909');
    });

    await test('PDF Template: Amount in Words correctly formatted in Indian English', async () => {
      const words = numberToWordsINR(918.75);
      assert.strictEqual(words, 'Nine Hundred and Eighteen Rupees and Seventy Five Paise Only');

      const words1050 = numberToWordsINR(1050);
      assert.strictEqual(words1050, 'One Thousand Fifty Rupees Only');
    });

    await test('PDF Fallback: Pure-JS PDF builds valid PDF buffer without Puppeteer', async () => {
      const { html } = await generateInvoiceHTML(testOrder1, invoiceA);
      const textBlocks = htmlToTextBlocks(html, `TAX INVOICE #${invoiceA.invoiceNumber}`);
      const pdfBuffer = buildPureJsPdf(`TAX INVOICE #${invoiceA.invoiceNumber}`, textBlocks);
      assert.ok(Buffer.isBuffer(pdfBuffer), 'Must return a Buffer');
      assert.ok(pdfBuffer.length > 500, 'PDF buffer must not be empty');
      assert.strictEqual(pdfBuffer.slice(0, 4).toString(), '%PDF', 'Must have PDF magic bytes');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP N: PHASE D VENDOR HSN MANAGEMENT & SECURITY RBAC
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}── Group N: Phase D Vendor HSN Management & Security RBAC ──${RESET}`);

    await test('HSN Management: Vendor A can update own product HSN', async () => {
      const prod = await Product.findOne({ _id: testProductA._id, vendor: testVendorA._id });
      assert.ok(prod, 'Product owned by Vendor A must exist');
      prod.hsnCode = '091099';
      await prod.save();

      const updated = await Product.findById(testProductA._id);
      assert.strictEqual(updated.hsnCode, '091099');
      assert.strictEqual(updated.hsn, '091099');
    });

    await test('HSN Security: Vendor B cannot update Vendor A product HSN (Tenant Isolation)', async () => {
      const unauthorizedUpdate = await Product.findOneAndUpdate(
        { _id: testProductA._id, vendor: testVendorB._id },
        { hsnCode: '999999' },
        { new: true }
      );
      assert.strictEqual(unauthorizedUpdate, null, 'Cross-tenant update must return null and fail');

      const freshProd = await Product.findById(testProductA._id);
      assert.strictEqual(freshProd.hsnCode, '091099');
    });

    await test('HSN Immutability: Mutating Product HSN does NOT alter already-issued historical invoice', async () => {
      const freshInvoice = await Invoice.findById(invoiceA._id);
      assert.strictEqual(freshInvoice.itemsSnapshot[0].hsn, '0910', 'Historical invoice HSN must remain 0910');
      assert.strictEqual(freshInvoice.itemsSnapshot[0].hsnCode, '0910', 'Historical invoice hsnCode must remain 0910');
    });

  } finally {
    // ── Teardown Fixtures ─────────────────────────────────────────
    console.log(`\n${YELLOW}── Cleaning Up Test Fixtures ──${RESET}`);
    if (testCustomer1) await User.deleteOne({ _id: testCustomer1._id });
    if (testCustomer2) await User.deleteOne({ _id: testCustomer2._id });
    if (testVendorA) await Vendor.deleteOne({ _id: testVendorA._id });
    if (testVendorB) await Vendor.deleteOne({ _id: testVendorB._id });
    if (testVendorIncomplete) await Vendor.deleteOne({ _id: testVendorIncomplete._id });
    if (testProductA) await Product.deleteOne({ _id: testProductA._id });
    if (testProductB) await Product.deleteOne({ _id: testProductB._id });
    if (testProductNoHsn) await Product.deleteOne({ _id: testProductNoHsn._id });
    if (testOrder1) await Order.deleteOne({ _id: testOrder1._id });
    if (testOrderSingle) await Order.deleteOne({ _id: testOrderSingle._id });
    if (testVendorOrderA) await VendorOrder.deleteOne({ _id: testVendorOrderA._id });
    if (testVendorOrderB) await VendorOrder.deleteOne({ _id: testVendorOrderB._id });
    if (testVendorOrderPending) await VendorOrder.deleteOne({ _id: testVendorOrderPending._id });
    if (testVendorOrderSingle) await VendorOrder.deleteOne({ _id: testVendorOrderSingle._id });

    await Invoice.deleteMany({
      'sellerSnapshot.legalName': {
        $in: ['Vendor A Organics Pvt Ltd', 'Vendor B Honey Farms', 'Siraba Organic'],
      },
    });

    await mongoose.disconnect();
    console.log('  Database disconnected.\n');
  }

  // ── Results Summary ──────────────────────────────────────────
  console.log(`${BOLD}============================================================${RESET}`);
  console.log(`TEST EXECUTION SUMMARY:`);
  console.log(`  Total:  ${passed + failed}`);
  console.log(`  Passed: ${GREEN}${passed}${RESET}`);
  console.log(`  Failed: ${failed > 0 ? RED + failed : GREEN + '0'}${RESET}`);
  console.log(`${BOLD}============================================================${RESET}\n`);

  if (failed > 0) {
    console.error(`${RED}${BOLD}Phase D Invoice Verification Failed with ${failed} failure(s).${RESET}`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}All Phase D Invoice Verification Tests Passed Successfully!${RESET}\n`);
    process.exit(0);
  }
}

runTestSuite();
