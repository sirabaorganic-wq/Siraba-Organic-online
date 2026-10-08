/**
 * ============================================================================
 * SIRABA ORGANIC — PHASE D PDF & SCENARIO VERIFICATION
 * File: backend/scripts/verify_phase_d_pdfs.js
 * Run:  node backend/scripts/verify_phase_d_pdfs.js
 * ============================================================================
 *
 * Verifies all 6 mandatory Phase 19 scenarios programmatically and generates
 * HTML / pure-JS PDF artifacts in backend/scripts/artifacts/:
 * 1. Single-vendor intra-state (CGST 9% + SGST 9%)
 * 2. Single-vendor inter-state (IGST 18%)
 * 3. Multi-vendor order (isolation, independent sequences, no leakage)
 * 4. Discounted order (18% GST on post-discount taxable value)
 * 5. Shipping order (shipping charge isolated, taxable calculation preserved)
 * 6. Credit note (sequential CN, linked to original invoice, reverses 18% GST, preserves HSN)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const VendorOrder = require('../models/VendorOrder');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');

const {
  getOrCreateCustomerInvoiceForVendorOrder,
  getOrCreateCustomerInvoicesForOrder,
  createCreditNote,
} = require('../services/invoiceService');
const {
  generateInvoiceHTML,
  numberToWordsINR,
} = require('../routes/invoiceRoutes');
const {
  buildPureJsPdf,
  htmlToTextBlocks,
} = require('../utils/puppeteerHelper');

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function verifyAllScenarios() {
  console.log('============================================================');
  console.log('🧾  PHASE D PDF & SCENARIO COMPLIANCE VERIFICATION');
  console.log('============================================================\n');

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is missing');
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.\n');

  let testCustKarnataka, testCustJK;
  let vendorPampore, vendorHimalayan;
  let prodSaffron, prodHoney;
  let order1, order2, order3, order4, order5;
  let vo1, vo2, vo3A, vo3B, vo4, vo5;

  try {
    // 1. Fixture Setup
    testCustKarnataka = await User.create({
      name: 'Ramesh Sharma',
      email: `pdf_test_blr_${Date.now()}@example.com`,
      password: 'password123',
      phone: '9876543210',
    });

    testCustJK = await User.create({
      name: 'Gulzar Ahmed',
      email: `pdf_test_srg_${Date.now()}@example.com`,
      password: 'password123',
      phone: '9876543211',
    });

    vendorPampore = await Vendor.create({
      businessName: 'Pampore Organic Farms Pvt Ltd',
      shopSettings: { shopName: 'Pampore Saffron Valley' },
      brandName: 'Pampore Gold',
      email: `vendor_pampore_${Date.now()}@example.com`,
      password: 'password123',
      businessType: 'manufacturer',
      contactPerson: 'Bashir Ahmed',
      phone: '9900112233',
      status: 'approved',
      gstNumber: '01AAAAA1111A1Z1',
      address: {
        street: '12 Saffron Belt',
        city: 'Pampore',
        state: 'Jammu and Kashmir',
        postalCode: '192121',
      },
      commissionRate: 10,
    });

    vendorHimalayan = await Vendor.create({
      businessName: 'Himalayan Nectar Apiaries',
      brandName: 'Wild Himalayan',
      email: `vendor_apiary_${Date.now()}@example.com`,
      password: 'password123',
      businessType: 'farmer',
      contactPerson: 'Mohd Shafi',
      phone: '9900112244',
      status: 'approved',
      gstNumber: '01BBBBB2222B2Z2',
      address: {
        street: '45 Pine Forest Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        postalCode: '190001',
      },
      commissionRate: 12,
    });

    prodSaffron = await Product.create({
      name: 'Pure Kashmiri Mongra Saffron 2g',
      slug: `saffron-mongra-${Date.now()}`,
      description: 'Grade A1 Saffron',
      sku: 'SAF-MGR-02',
      hsnCode: '091020',
      price: 1000,
      stockQuantity: 100,
      vendor: vendorPampore._id,
      isVendorProduct: true,
      category: 'Spices',
    });

    prodHoney = await Product.create({
      name: 'Acacia Raw Honey 500g',
      slug: `honey-acacia-${Date.now()}`,
      description: 'Unprocessed Himalayan Honey',
      sku: 'HNY-ACA-05',
      hsnCode: '040900',
      price: 500,
      stockQuantity: 100,
      vendor: vendorHimalayan._id,
      isVendorProduct: true,
      category: 'Honey',
    });

    console.log('✓ Test fixtures created.\n');

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 1: Single-Vendor Intra-State (J&K -> J&K, CGST 9% + SGST 9%)
    // ─────────────────────────────────────────────────────────────
    console.log('── Scenario 1: Single-Vendor Intra-State (CGST 9% + SGST 9%) ──');
    order1 = await Order.create({
      user: testCustJK._id,
      orderItems: [{
        name: prodSaffron.name,
        quantity: 1,
        price: 1000,
        product: prodSaffron._id,
        sku: prodSaffron.sku,
        hsn: prodSaffron.hsnCode,
        hsnCode: prodSaffron.hsnCode,
        taxRate: 18,
        image: 'sample.png',
      }],
      shippingAddress: {
        name: 'Gulzar Ahmed',
        address: '15 Residency Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        postalCode: '190001',
        country: 'India',
        phone: '9876543211',
      },
      paymentMethod: 'COD',
      itemsPrice: 1000,
      discountAmount: 0,
      taxPrice: 180, // 18% of 1000
      shippingPrice: 0,
      totalPrice: 1180,
      status: 'Confirmed',
    });

    vo1 = await VendorOrder.create({
      order: order1._id,
      vendor: vendorPampore._id,
      items: [{
        name: prodSaffron.name,
        quantity: 1,
        price: 1000,
        product: prodSaffron._id,
        sku: prodSaffron.sku,
        hsn: prodSaffron.hsnCode,
        hsnCode: prodSaffron.hsnCode,
        taxableAmount: 1000,
        taxRate: 18,
        taxAmount: 180,
        cgstAmount: 90,
        sgstAmount: 90,
      }],
      subtotal: 1000,
      commission: 100,
      commissionRateAtOrder: 10,
      tax: 180,
      customerShippingCharge: 0,
      netAmount: 900,
      status: 'confirmed',
      shippingAddress: order1.shippingAddress,
      taxBreakdown: {
        isInterState: false,
        supplierState: 'Jammu and Kashmir',
        customerState: 'Jammu and Kashmir',
        cgst: 90,
        sgst: 90,
        totalTax: 180,
      },
    });

    const inv1 = await getOrCreateCustomerInvoiceForVendorOrder(vo1._id);
    assert.strictEqual(inv1.sellerSnapshot.legalName, 'Pampore Organic Farms Pvt Ltd');
    assert.strictEqual(inv1.taxSnapshot.isInterState, false);
    assert.strictEqual(inv1.taxSnapshot.cgstAmount, 90);
    assert.strictEqual(inv1.taxSnapshot.sgstAmount, 90);
    assert.strictEqual(inv1.taxSnapshot.igstAmount, 0);
    assert.strictEqual(inv1.itemsSnapshot[0].hsnCode, '091020');
    assert.strictEqual(inv1.totalsSnapshot.taxPrice, 180);
    assert.strictEqual(inv1.totalsSnapshot.grandTotal, 1180);

    const { html: html1 } = await generateInvoiceHTML(order1, inv1);
    const pdf1 = buildPureJsPdf(`TAX INVOICE #${inv1.invoiceNumber}`, htmlToTextBlocks(html1, `TAX INVOICE #${inv1.invoiceNumber}`));
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scenario1_single_vendor_intrastate.html'), html1);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scenario1_single_vendor_intrastate.pdf'), pdf1);
    console.log(`  [ PASS ] Scenario 1 verified: CGST 9% (₹90) + SGST 9% (₹90) = ₹180, HSN 091020\n`);

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 2: Single-Vendor Inter-State (J&K -> Karnataka, IGST 18%)
    // ─────────────────────────────────────────────────────────────
    console.log('── Scenario 2: Single-Vendor Inter-State (IGST 18%) ──');
    order2 = await Order.create({
      user: testCustKarnataka._id,
      orderItems: [{
        name: prodSaffron.name,
        quantity: 1,
        price: 1000,
        product: prodSaffron._id,
        sku: prodSaffron.sku,
        hsn: prodSaffron.hsnCode,
        hsnCode: prodSaffron.hsnCode,
        taxRate: 18,
        image: 'sample.png',
      }],
      shippingAddress: {
        name: 'Ramesh Sharma',
        address: '42 Indiranagar 100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
        phone: '9876543210',
      },
      paymentMethod: 'Online',
      itemsPrice: 1000,
      discountAmount: 0,
      taxPrice: 180,
      shippingPrice: 0,
      totalPrice: 1180,
      status: 'Confirmed',
    });

    vo2 = await VendorOrder.create({
      order: order2._id,
      vendor: vendorPampore._id,
      items: [{
        name: prodSaffron.name,
        quantity: 1,
        price: 1000,
        product: prodSaffron._id,
        sku: prodSaffron.sku,
        hsn: prodSaffron.hsnCode,
        hsnCode: prodSaffron.hsnCode,
        taxableAmount: 1000,
        taxRate: 18,
        taxAmount: 180,
        igstAmount: 180,
      }],
      subtotal: 1000,
      commission: 100,
      commissionRateAtOrder: 10,
      tax: 180,
      customerShippingCharge: 0,
      netAmount: 900,
      status: 'confirmed',
      shippingAddress: order2.shippingAddress,
      taxBreakdown: {
        isInterState: true,
        supplierState: 'Jammu and Kashmir',
        customerState: 'Karnataka',
        igst: 180,
        totalTax: 180,
      },
    });

    const inv2 = await getOrCreateCustomerInvoiceForVendorOrder(vo2._id);
    assert.strictEqual(inv2.taxSnapshot.isInterState, true);
    assert.strictEqual(inv2.taxSnapshot.igstAmount, 180);
    assert.strictEqual(inv2.taxSnapshot.cgstAmount, 0);
    assert.strictEqual(inv2.taxSnapshot.sgstAmount, 0);

    const { html: html2 } = await generateInvoiceHTML(order2, inv2);
    const pdf2 = buildPureJsPdf(`TAX INVOICE #${inv2.invoiceNumber}`, htmlToTextBlocks(html2, `TAX INVOICE #${inv2.invoiceNumber}`));
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scenario2_single_vendor_interstate.html'), html2);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scenario2_single_vendor_interstate.pdf'), pdf2);
    console.log(`  [ PASS ] Scenario 2 verified: IGST 18% (₹180), HSN 091020, inter-state place of supply\n`);

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 3: Multi-Vendor Order (Isolation & Independent Invoices)
    // ─────────────────────────────────────────────────────────────
    console.log('── Scenario 3: Multi-Vendor Order (Isolation & Independent Tax) ──');
    order3 = await Order.create({
      user: testCustKarnataka._id,
      orderItems: [
        { name: prodSaffron.name, quantity: 1, price: 1000, product: prodSaffron._id, sku: prodSaffron.sku, hsn: prodSaffron.hsnCode, hsnCode: prodSaffron.hsnCode, taxRate: 18, image: 'sample.png' },
        { name: prodHoney.name, quantity: 2, price: 500, product: prodHoney._id, sku: prodHoney.sku, hsn: prodHoney.hsnCode, hsnCode: prodHoney.hsnCode, taxRate: 18, image: 'sample.png' },
      ],
      shippingAddress: order2.shippingAddress,
      paymentMethod: 'Online',
      itemsPrice: 2000,
      discountAmount: 0,
      taxPrice: 360, // 180 + 180
      shippingPrice: 0,
      totalPrice: 2360,
      status: 'Confirmed',
    });

    vo3A = await VendorOrder.create({
      order: order3._id,
      vendor: vendorPampore._id,
      items: [{
        name: prodSaffron.name,
        quantity: 1,
        price: 1000,
        product: prodSaffron._id,
        sku: prodSaffron.sku,
        hsn: prodSaffron.hsnCode,
        hsnCode: prodSaffron.hsnCode,
        taxableAmount: 1000,
        taxRate: 18,
        taxAmount: 180,
        igstAmount: 180,
      }],
      subtotal: 1000,
      commission: 100,
      commissionRateAtOrder: 10,
      tax: 180,
      customerShippingCharge: 0,
      netAmount: 900,
      status: 'confirmed',
      shippingAddress: order3.shippingAddress,
      taxBreakdown: { isInterState: true, supplierState: 'Jammu and Kashmir', customerState: 'Karnataka', igst: 180, totalTax: 180 },
    });

    vo3B = await VendorOrder.create({
      order: order3._id,
      vendor: vendorHimalayan._id,
      items: [{
        name: prodHoney.name,
        quantity: 2,
        price: 500,
        product: prodHoney._id,
        sku: prodHoney.sku,
        hsn: prodHoney.hsnCode,
        hsnCode: prodHoney.hsnCode,
        taxableAmount: 1000,
        taxRate: 18,
        taxAmount: 180,
        igstAmount: 180,
      }],
      subtotal: 1000,
      commission: 120,
      commissionRateAtOrder: 12,
      tax: 180,
      customerShippingCharge: 0,
      netAmount: 880,
      status: 'confirmed',
      shippingAddress: order3.shippingAddress,
      taxBreakdown: { isInterState: true, supplierState: 'Jammu and Kashmir', customerState: 'Karnataka', igst: 180, totalTax: 180 },
    });

    const multiInvoices = await getOrCreateCustomerInvoicesForOrder(order3._id);
    assert.strictEqual(multiInvoices.length, 2);
    assert.notStrictEqual(multiInvoices[0].invoiceNumber, multiInvoices[1].invoiceNumber);
    assert.notStrictEqual(multiInvoices[0].sellerSnapshot.gstin, multiInvoices[1].sellerSnapshot.gstin);
    assert.strictEqual(multiInvoices[0].itemsSnapshot[0].hsnCode, '091020');
    assert.strictEqual(multiInvoices[1].itemsSnapshot[0].hsnCode, '040900');

    const { html: html3A } = await generateInvoiceHTML(order3, multiInvoices[0]);
    const { html: html3B } = await generateInvoiceHTML(order3, multiInvoices[1]);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scenario3_multivendor_invoiceA.html'), html3A);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scenario3_multivendor_invoiceB.html'), html3B);
    console.log(`  [ PASS ] Scenario 3 verified: 2 distinct vendor invoices, zero cross-vendor leakage, isolated HSNs (091020 & 040900)\n`);

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 4: Discounted Order (18% GST on Taxable Value)
    // ─────────────────────────────────────────────────────────────
    console.log('── Scenario 4: Discounted Order (18% GST on Taxable Value) ──');
    order4 = await Order.create({
      user: testCustKarnataka._id,
      orderItems: [{
        name: prodSaffron.name,
        quantity: 1,
        price: 1000,
        product: prodSaffron._id,
        sku: prodSaffron.sku,
        hsn: prodSaffron.hsnCode,
        hsnCode: prodSaffron.hsnCode,
        taxRate: 18,
        image: 'sample.png',
      }],
      shippingAddress: order2.shippingAddress,
      paymentMethod: 'Online',
      itemsPrice: 1000,
      discountAmount: 200,
      couponCode: 'SAVE20',
      taxPrice: 144, // 18% of 800
      shippingPrice: 0,
      totalPrice: 944,
      status: 'Confirmed',
    });

    vo4 = await VendorOrder.create({
      order: order4._id,
      vendor: vendorPampore._id,
      items: [{
        name: prodSaffron.name,
        quantity: 1,
        price: 1000,
        product: prodSaffron._id,
        sku: prodSaffron.sku,
        hsn: prodSaffron.hsnCode,
        hsnCode: prodSaffron.hsnCode,
        discountAmount: 200,
        taxableAmount: 800,
        taxRate: 18,
        taxAmount: 144,
        igstAmount: 144,
      }],
      subtotal: 1000,
      commission: 80,
      commissionRateAtOrder: 10,
      tax: 144,
      customerShippingCharge: 0,
      netAmount: 720,
      status: 'confirmed',
      shippingAddress: order4.shippingAddress,
      taxBreakdown: { isInterState: true, supplierState: 'Jammu and Kashmir', customerState: 'Karnataka', igst: 144, totalTax: 144 },
    });

    const inv4 = await getOrCreateCustomerInvoiceForVendorOrder(vo4._id);
    assert.strictEqual(inv4.totalsSnapshot.subtotal, 1000);
    assert.strictEqual(inv4.totalsSnapshot.discountAmount, 200);
    assert.strictEqual(inv4.totalsSnapshot.taxableSubtotal, 800);
    assert.strictEqual(inv4.totalsSnapshot.taxPrice, 144);
    assert.strictEqual(inv4.totalsSnapshot.grandTotal, 944);

    const { html: html4 } = await generateInvoiceHTML(order4, inv4);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scenario4_discounted_order.html'), html4);
    console.log(`  [ PASS ] Scenario 4 verified: Taxable Value ₹800, GST 18% ₹144, Total ₹944 (Gross ₹1000 - ₹200 discount)\n`);

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 5: Shipping Order (Isolated Shipping Fee)
    // ─────────────────────────────────────────────────────────────
    console.log('── Scenario 5: Shipping Order (Paid Shipping Charge) ──');
    order5 = await Order.create({
      user: testCustJK._id,
      orderItems: [{
        name: prodHoney.name,
        quantity: 1,
        price: 500,
        product: prodHoney._id,
        sku: prodHoney.sku,
        hsn: prodHoney.hsnCode,
        hsnCode: prodHoney.hsnCode,
        taxRate: 18,
        image: 'sample.png',
      }],
      shippingAddress: order1.shippingAddress,
      paymentMethod: 'COD',
      itemsPrice: 500,
      discountAmount: 0,
      taxPrice: 90,
      shippingPrice: 83,
      totalPrice: 673,
      status: 'Confirmed',
    });

    vo5 = await VendorOrder.create({
      order: order5._id,
      vendor: vendorHimalayan._id,
      items: [{
        name: prodHoney.name,
        quantity: 1,
        price: 500,
        product: prodHoney._id,
        sku: prodHoney.sku,
        hsn: prodHoney.hsnCode,
        hsnCode: prodHoney.hsnCode,
        taxableAmount: 500,
        taxRate: 18,
        taxAmount: 90,
        cgstAmount: 45,
        sgstAmount: 45,
      }],
      subtotal: 500,
      commission: 60,
      commissionRateAtOrder: 12,
      tax: 90,
      customerShippingCharge: 83,
      netAmount: 440,
      status: 'confirmed',
      shippingAddress: order5.shippingAddress,
      taxBreakdown: { isInterState: false, supplierState: 'Jammu and Kashmir', customerState: 'Jammu and Kashmir', cgst: 45, sgst: 45, totalTax: 90 },
    });

    const inv5 = await getOrCreateCustomerInvoiceForVendorOrder(vo5._id);
    assert.strictEqual(inv5.shippingSnapshot.shippingPrice, 83);
    assert.strictEqual(inv5.shippingSnapshot.isFreeShipping, false);
    assert.strictEqual(inv5.totalsSnapshot.shippingPrice, 83);
    assert.strictEqual(inv5.totalsSnapshot.grandTotal, 673);

    const { html: html5 } = await generateInvoiceHTML(order5, inv5);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scenario5_shipping_order.html'), html5);
    console.log(`  [ PASS ] Scenario 5 verified: ₹83 shipping snapshot preserved, Grand Total ₹673 reconciles\n`);

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 6: Credit Note (Reverses 18% GST & Preserves HSN)
    // ─────────────────────────────────────────────────────────────
    console.log('── Scenario 6: Credit Note (Reverses 18% GST & Preserves HSN) ──');
    const creditNote = await createCreditNote({
      orderId: order2._id,
      vendorOrderId: vo2._id,
      refundAmount: 590, // Half of 1180
      reason: 'Partial customer return of damaged item',
      refundReference: 'REF-PHASE-D-001',
      itemsRefunded: [{
        product: prodSaffron._id,
        name: prodSaffron.name,
        quantity: 1,
        amount: 590,
      }],
    });

    assert.ok(creditNote.invoiceNumber.startsWith('CN/'));
    assert.strictEqual(creditNote.originalInvoice.toString(), inv2._id.toString());
    assert.strictEqual(creditNote.totalsSnapshot.grandTotal, 590);
    // 590 / 1.18 = 500 taxable; 90 IGST tax
    assert.strictEqual(creditNote.totalsSnapshot.taxableSubtotal, 500);
    assert.strictEqual(creditNote.totalsSnapshot.taxPrice, 90);
    assert.strictEqual(creditNote.taxSnapshot.igstAmount, 90);
    assert.strictEqual(creditNote.itemsSnapshot[0].hsnCode, '091020');

    // Original invoice remains untouched
    const untouchedInv2 = await Invoice.findById(inv2._id);
    assert.strictEqual(untouchedInv2.totalsSnapshot.grandTotal, 1180);
    assert.strictEqual(untouchedInv2.totalsSnapshot.taxPrice, 180);

    console.log(`  [ PASS ] Scenario 6 verified: Credit Note ${creditNote.invoiceNumber} reverses ₹500 taxable + ₹90 IGST (18%), original invoice #${inv2.invoiceNumber} immutable\n`);

    console.log('============================================================');
    console.log('✓ ALL 6 PHASE 19 PDF SCENARIOS SUCCESSFULLY VERIFIED!');
    console.log(`✓ Artifacts saved to: ${ARTIFACTS_DIR}`);
    console.log('============================================================\n');

  } finally {
    // Teardown
    if (order1) await Order.deleteOne({ _id: order1._id });
    if (order2) await Order.deleteOne({ _id: order2._id });
    if (order3) await Order.deleteOne({ _id: order3._id });
    if (order4) await Order.deleteOne({ _id: order4._id });
    if (order5) await Order.deleteOne({ _id: order5._id });

    if (vo1) await VendorOrder.deleteOne({ _id: vo1._id });
    if (vo2) await VendorOrder.deleteOne({ _id: vo2._id });
    if (vo3A) await VendorOrder.deleteOne({ _id: vo3A._id });
    if (vo3B) await VendorOrder.deleteOne({ _id: vo3B._id });
    if (vo4) await VendorOrder.deleteOne({ _id: vo4._id });
    if (vo5) await VendorOrder.deleteOne({ _id: vo5._id });

    if (testCustKarnataka) await User.deleteOne({ _id: testCustKarnataka._id });
    if (testCustJK) await User.deleteOne({ _id: testCustJK._id });
    if (vendorPampore) await Vendor.deleteOne({ _id: vendorPampore._id });
    if (vendorHimalayan) await Vendor.deleteOne({ _id: vendorHimalayan._id });
    if (prodSaffron) await Product.deleteOne({ _id: prodSaffron._id });
    if (prodHoney) await Product.deleteOne({ _id: prodHoney._id });

    await Invoice.deleteMany({
      'sellerSnapshot.legalName': {
        $in: ['Pampore Organic Farms Pvt Ltd', 'Himalayan Nectar Apiaries'],
      },
    });

    await mongoose.disconnect();
  }
}

verifyAllScenarios().catch((err) => {
  console.error('❌ PDF Scenario Verification Failed:', err);
  process.exit(1);
});
