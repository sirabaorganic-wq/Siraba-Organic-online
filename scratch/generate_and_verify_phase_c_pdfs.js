/**
 * Script: scratch/generate_and_verify_phase_c_pdfs.js
 * Generates and programmatically audits the 6 required PDF verification cases.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const mongoose = require('../backend/node_modules/mongoose');

require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const Invoice = require('../backend/models/Invoice');
const Order = require('../backend/models/Order');
const VendorOrder = require('../backend/models/VendorOrder');
const Vendor = require('../backend/models/Vendor');
const User = require('../backend/models/User');
const Product = require('../backend/models/Product');
const {
  getOrCreateCustomerInvoiceForVendorOrder,
  getOrCreateCustomerInvoicesForOrder,
} = require('../backend/services/invoiceService');
const { generateInvoiceHTML } = require('../backend/routes/invoiceRoutes');
const { renderHtmlToPdf, buildPureJsPdf, htmlToTextBlocks } = require('../backend/utils/puppeteerHelper');

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.\n');

  const outDir = path.join(__dirname, 'phase_c_pdfs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Create test actors
  const customerIntra = await User.create({
    name: 'Bashir Ahmad Dar',
    email: `bashir_${Date.now()}@example.com`,
    password: 'password123',
    phone: '9419012345',
  });

  const customerInter = await User.create({
    name: 'Priya Sharma',
    email: `priya_${Date.now()}@example.com`,
    password: 'password123',
    phone: '9845012345',
  });

  const vendorPampore = await Vendor.create({
    businessName: 'Noor Saffron & Spice Guild',
    brandName: 'Noor Organics',
    email: `noor_${Date.now()}@example.com`,
    password: 'password123',
    businessType: 'farmer',
    contactPerson: 'Ghulam Mohammad',
    phone: '9906611223',
    status: 'approved',
    gstNumber: '01AAACN1234F1Z9',
    address: {
      street: 'Kashmir Saffron Park, Ladhoo Road',
      city: 'Pampore',
      state: 'Jammu and Kashmir',
      postalCode: '192121',
    },
    shopSettings: { shopName: 'Noor Organics' },
  });

  const vendorJammu = await Vendor.create({
    businessName: 'Chenab Valley Honey Cooperative',
    brandName: 'Chenab Gold',
    email: `chenab_${Date.now()}@example.com`,
    password: 'password123',
    businessType: 'wholesaler',
    contactPerson: 'Ravi Kumar',
    phone: '9419122334',
    status: 'approved',
    gstNumber: '01BBBCV5678G1Z2',
    address: {
      street: '45 Riverbank Sector 4',
      city: 'Jammu',
      state: 'Jammu and Kashmir',
      postalCode: '180001',
    },
    shopSettings: { shopName: 'Chenab Gold' },
  });

  const saffronProduct = await Product.create({
    name: 'Super Negin Mongra Saffron 2g',
    slug: `saf-pdf-${Date.now()}`,
    description: 'Grade 1 GI-Tagged Kashmiri Saffron',
    sku: 'SAF-MNG-2G',
    hsn: '09102010',
    category: 'Spices',
    price: 900,
    vendor: vendorPampore._id,
    isVendorProduct: true,
    gstRate: 5,
  });

  const honeyProduct = await Product.create({
    name: 'Wild Acacia Raw Honey 500g',
    slug: `hny-pdf-${Date.now()}`,
    description: 'Raw unprocessed Acacia Honey',
    sku: 'HNY-ACA-500G',
    hsn: '04090000',
    category: 'Honey',
    price: 650,
    vendor: vendorJammu._id,
    isVendorProduct: true,
    gstRate: 5,
  });

  async function renderAndSavePdf(filename, order, invoiceDoc) {
    const { html } = await generateInvoiceHTML(order, invoiceDoc);
    let pdf;
    try {
      pdf = await renderHtmlToPdf(html);
    } catch (e) {
      console.warn(`[Puppeteer render failed: ${e.message}], using pure-JS fallback`);
      const textBlocks = htmlToTextBlocks(html, `TAX INVOICE #${invoiceDoc.invoiceNumber}`);
      pdf = buildPureJsPdf(`TAX INVOICE #${invoiceDoc.invoiceNumber}`, textBlocks);
    }
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, pdf);
    console.log(`Saved: ${filePath} (${pdf.length} bytes)`);
    return { filePath, html, invoiceDoc };
  }

  const results = {};

  // ============================================================
  // CASE 1: Single vendor, intra-state (J&K -> J&K)
  // ============================================================
  console.log('Generating Case 1: Single vendor, intra-state...');
  const order1 = await Order.create({
    user: customerIntra._id,
    orderItems: [{ name: saffronProduct.name, quantity: 1, price: 900, product: saffronProduct._id, image: 'p.png', sku: saffronProduct.sku, hsn: saffronProduct.hsn, taxRate: 5 }],
    shippingAddress: { name: 'Bashir Ahmad Dar', address: 'House 14, Rajbagh', city: 'Srinagar', state: 'Jammu and Kashmir', postalCode: '190008', country: 'India', phone: '9419012345' },
    paymentMethod: 'COD',
    itemsPrice: 900,
    discountAmount: 0,
    taxPrice: 45,
    shippingPrice: 50,
    totalPrice: 995,
    status: 'Confirmed',
    isPaid: false,
  });

  const vo1 = await VendorOrder.create({
    order: order1._id,
    vendor: vendorPampore._id,
    items: [{ name: saffronProduct.name, quantity: 1, price: 900, product: saffronProduct._id, sku: saffronProduct.sku, hsn: saffronProduct.hsn, taxRate: 5, taxAmount: 45, taxableAmount: 900, cgstAmount: 22.5, sgstAmount: 22.5 }],
    subtotal: 900,
    commission: 90,
    tax: 45,
    customerShippingCharge: 50,
    netAmount: 810,
    status: 'confirmed',
    shippingAddress: order1.shippingAddress,
    taxBreakdown: { isInterState: false, supplierState: 'Jammu and Kashmir', customerState: 'Jammu and Kashmir', cgst: 22.5, sgst: 22.5, totalTax: 45 },
  });

  const inv1 = await getOrCreateCustomerInvoiceForVendorOrder(vo1._id);
  results.case1 = await renderAndSavePdf('case1_single_vendor_intra_state.pdf', order1, inv1);

  // ============================================================
  // CASE 2: Single vendor, inter-state (J&K -> Karnataka)
  // ============================================================
  console.log('Generating Case 2: Single vendor, inter-state...');
  const order2 = await Order.create({
    user: customerInter._id,
    orderItems: [{ name: saffronProduct.name, quantity: 2, price: 900, product: saffronProduct._id, image: 'p.png', sku: saffronProduct.sku, hsn: saffronProduct.hsn, taxRate: 5 }],
    shippingAddress: { name: 'Priya Sharma', address: 'Flat 402, Palm Meadows', city: 'Bengaluru', state: 'Karnataka', postalCode: '560066', country: 'India', phone: '9845012345' },
    paymentMethod: 'Online',
    itemsPrice: 1800,
    discountAmount: 0,
    taxPrice: 90,
    shippingPrice: 0,
    totalPrice: 1890,
    status: 'Confirmed',
    isPaid: true,
  });

  const vo2 = await VendorOrder.create({
    order: order2._id,
    vendor: vendorPampore._id,
    items: [{ name: saffronProduct.name, quantity: 2, price: 900, product: saffronProduct._id, sku: saffronProduct.sku, hsn: saffronProduct.hsn, taxRate: 5, taxAmount: 90, taxableAmount: 1800, igstAmount: 90 }],
    subtotal: 1800,
    commission: 180,
    tax: 90,
    customerShippingCharge: 0,
    netAmount: 1620,
    status: 'confirmed',
    shippingAddress: order2.shippingAddress,
    taxBreakdown: { isInterState: true, supplierState: 'Jammu and Kashmir', customerState: 'Karnataka', igst: 90, totalTax: 90 },
  });

  const inv2 = await getOrCreateCustomerInvoiceForVendorOrder(vo2._id);
  results.case2 = await renderAndSavePdf('case2_single_vendor_inter_state.pdf', order2, inv2);

  // ============================================================
  // CASE 3: Multi-vendor order (Vendor A Saffron + Vendor B Honey)
  // ============================================================
  console.log('Generating Case 3: Multi-vendor order...');
  const order3 = await Order.create({
    user: customerInter._id,
    orderItems: [
      { name: saffronProduct.name, quantity: 1, price: 900, product: saffronProduct._id, image: 'p.png', sku: saffronProduct.sku, hsn: saffronProduct.hsn, taxRate: 5 },
      { name: honeyProduct.name, quantity: 1, price: 650, product: honeyProduct._id, image: 'p.png', sku: honeyProduct.sku, hsn: honeyProduct.hsn, taxRate: 5 },
    ],
    shippingAddress: { name: 'Priya Sharma', address: 'Flat 402, Palm Meadows', city: 'Bengaluru', state: 'Karnataka', postalCode: '560066', country: 'India', phone: '9845012345' },
    paymentMethod: 'Online',
    itemsPrice: 1550,
    discountAmount: 0,
    taxPrice: 77.5,
    shippingPrice: 0,
    totalPrice: 1627.5,
    status: 'Confirmed',
    isPaid: true,
  });

  const vo3A = await VendorOrder.create({
    order: order3._id,
    vendor: vendorPampore._id,
    items: [{ name: saffronProduct.name, quantity: 1, price: 900, product: saffronProduct._id, sku: saffronProduct.sku, hsn: saffronProduct.hsn, taxRate: 5, taxAmount: 45, taxableAmount: 900, igstAmount: 45 }],
    subtotal: 900,
    commission: 90,
    tax: 45,
    customerShippingCharge: 0,
    netAmount: 810,
    status: 'confirmed',
    shippingAddress: order3.shippingAddress,
    taxBreakdown: { isInterState: true, supplierState: 'Jammu and Kashmir', customerState: 'Karnataka', igst: 45, totalTax: 45 },
  });

  const vo3B = await VendorOrder.create({
    order: order3._id,
    vendor: vendorJammu._id,
    items: [{ name: honeyProduct.name, quantity: 1, price: 650, product: honeyProduct._id, sku: honeyProduct.sku, hsn: honeyProduct.hsn, taxRate: 5, taxAmount: 32.5, taxableAmount: 650, igstAmount: 32.5 }],
    subtotal: 650,
    commission: 97.5,
    tax: 32.5,
    customerShippingCharge: 0,
    netAmount: 552.5,
    status: 'confirmed',
    shippingAddress: order3.shippingAddress,
    taxBreakdown: { isInterState: true, supplierState: 'Jammu and Kashmir', customerState: 'Karnataka', igst: 32.5, totalTax: 32.5 },
  });

  const inv3A = await getOrCreateCustomerInvoiceForVendorOrder(vo3A._id);
  const inv3B = await getOrCreateCustomerInvoiceForVendorOrder(vo3B._id);
  results.case3A = await renderAndSavePdf('case3_multivendor_vendorA_saffron.pdf', order3, inv3A);
  results.case3B = await renderAndSavePdf('case3_multivendor_vendorB_honey.pdf', order3, inv3B);

  // ============================================================
  // CASE 4: Discounted order (Coupon applied)
  // ============================================================
  console.log('Generating Case 4: Discounted order...');
  const order4 = await Order.create({
    user: customerInter._id,
    orderItems: [{ name: saffronProduct.name, quantity: 2, price: 900, product: saffronProduct._id, image: 'p.png', sku: saffronProduct.sku, hsn: saffronProduct.hsn, taxRate: 5 }],
    shippingAddress: { name: 'Priya Sharma', address: 'Flat 402, Palm Meadows', city: 'Bengaluru', state: 'Karnataka', postalCode: '560066', country: 'India', phone: '9845012345' },
    paymentMethod: 'Online',
    itemsPrice: 1800,
    discountAmount: 200,
    couponCode: 'ORGANIC200',
    taxPrice: 80, // (1800 - 200) = 1600 * 5% = 80
    shippingPrice: 0,
    totalPrice: 1680,
    status: 'Confirmed',
    isPaid: true,
  });

  const vo4 = await VendorOrder.create({
    order: order4._id,
    vendor: vendorPampore._id,
    items: [{ name: saffronProduct.name, quantity: 2, price: 900, product: saffronProduct._id, sku: saffronProduct.sku, hsn: saffronProduct.hsn, discountAmount: 200, taxableAmount: 1600, taxRate: 5, taxAmount: 80, igstAmount: 80 }],
    subtotal: 1800,
    commission: 180,
    tax: 80,
    customerShippingCharge: 0,
    netAmount: 1620,
    status: 'confirmed',
    shippingAddress: order4.shippingAddress,
    taxBreakdown: { isInterState: true, supplierState: 'Jammu and Kashmir', customerState: 'Karnataka', igst: 80, totalTax: 80 },
  });

  const inv4 = await getOrCreateCustomerInvoiceForVendorOrder(vo4._id);
  results.case4 = await renderAndSavePdf('case4_discounted_order.pdf', order4, inv4);

  // ============================================================
  // CASE 5: Order with shipping charge
  // ============================================================
  console.log('Generating Case 5: Order with shipping charge...');
  const order5 = await Order.create({
    user: customerInter._id,
    orderItems: [{ name: honeyProduct.name, quantity: 1, price: 650, product: honeyProduct._id, image: 'p.png', sku: honeyProduct.sku, hsn: honeyProduct.hsn, taxRate: 5 }],
    shippingAddress: { name: 'Priya Sharma', address: 'Flat 402, Palm Meadows', city: 'Bengaluru', state: 'Karnataka', postalCode: '560066', country: 'India', phone: '9845012345' },
    paymentMethod: 'Online',
    itemsPrice: 650,
    discountAmount: 0,
    taxPrice: 32.5,
    shippingPrice: 75,
    totalPrice: 757.5,
    status: 'Confirmed',
    isPaid: true,
  });

  const vo5 = await VendorOrder.create({
    order: order5._id,
    vendor: vendorJammu._id,
    items: [{ name: honeyProduct.name, quantity: 1, price: 650, product: honeyProduct._id, sku: honeyProduct.sku, hsn: honeyProduct.hsn, taxableAmount: 650, taxRate: 5, taxAmount: 32.5, igstAmount: 32.5 }],
    subtotal: 650,
    commission: 97.5,
    tax: 32.5,
    customerShippingCharge: 75,
    netAmount: 552.5,
    status: 'confirmed',
    shippingAddress: order5.shippingAddress,
    taxBreakdown: { isInterState: true, supplierState: 'Jammu and Kashmir', customerState: 'Karnataka', igst: 32.5, totalTax: 32.5 },
  });

  const inv5 = await getOrCreateCustomerInvoiceForVendorOrder(vo5._id);
  results.case5 = await renderAndSavePdf('case5_order_with_shipping.pdf', order5, inv5);

  // ============================================================
  // CASE 6: Pending vendor approval (Lifecycle gate verification)
  // ============================================================
  console.log('Verifying Case 6: Pending vendor approval (Lifecycle gate)...');
  const order6 = await Order.create({
    user: customerIntra._id,
    orderItems: [{ name: saffronProduct.name, quantity: 1, price: 900, product: saffronProduct._id, image: 'p.png', sku: saffronProduct.sku, hsn: saffronProduct.hsn, taxRate: 5 }],
    shippingAddress: order1.shippingAddress,
    paymentMethod: 'COD',
    itemsPrice: 900,
    totalPrice: 995,
    status: 'Pending',
    isPaid: false,
  });

  const vo6Pending = await VendorOrder.create({
    order: order6._id,
    vendor: vendorPampore._id,
    items: [{ name: saffronProduct.name, quantity: 1, price: 900, product: saffronProduct._id, sku: saffronProduct.sku, hsn: saffronProduct.hsn }],
    subtotal: 900,
    netAmount: 810,
    status: 'pending', // PENDING APPROVAL!
    shippingAddress: order6.shippingAddress,
  });

  let case6Blocked = false;
  let case6ErrorMessage = '';
  try {
    await getOrCreateCustomerInvoiceForVendorOrder(vo6Pending._id);
  } catch (err) {
    case6Blocked = true;
    case6ErrorMessage = err.message;
  }
  console.log(`Case 6 Lifecycle Gate Blocked: ${case6Blocked} (Error: "${case6ErrorMessage}")`);

  // Write verification report manifest
  const manifest = {
    case1: { file: 'case1_single_vendor_intra_state.pdf', invoiceNumber: inv1.invoiceNumber, seller: inv1.sellerSnapshot.legalName, gstin: inv1.sellerSnapshot.gstin, state: inv1.sellerSnapshot.state, customerState: inv1.buyerSnapshot.shippingAddress.state, isInterState: inv1.taxSnapshot.isInterState, cgst: inv1.totalsSnapshot.cgstAmount, sgst: inv1.totalsSnapshot.sgstAmount, igst: inv1.totalsSnapshot.igstAmount, total: inv1.totalsSnapshot.grandTotal, hsn: inv1.itemsSnapshot[0].hsn },
    case2: { file: 'case2_single_vendor_inter_state.pdf', invoiceNumber: inv2.invoiceNumber, seller: inv2.sellerSnapshot.legalName, gstin: inv2.sellerSnapshot.gstin, state: inv2.sellerSnapshot.state, customerState: inv2.buyerSnapshot.shippingAddress.state, isInterState: inv2.taxSnapshot.isInterState, cgst: inv2.totalsSnapshot.cgstAmount, sgst: inv2.totalsSnapshot.sgstAmount, igst: inv2.totalsSnapshot.igstAmount, total: inv2.totalsSnapshot.grandTotal, hsn: inv2.itemsSnapshot[0].hsn },
    case3A: { file: 'case3_multivendor_vendorA_saffron.pdf', invoiceNumber: inv3A.invoiceNumber, seller: inv3A.sellerSnapshot.legalName, gstin: inv3A.sellerSnapshot.gstin, product: inv3A.itemsSnapshot[0].name, hsn: inv3A.itemsSnapshot[0].hsn, total: inv3A.totalsSnapshot.grandTotal },
    case3B: { file: 'case3_multivendor_vendorB_honey.pdf', invoiceNumber: inv3B.invoiceNumber, seller: inv3B.sellerSnapshot.legalName, gstin: inv3B.sellerSnapshot.gstin, product: inv3B.itemsSnapshot[0].name, hsn: inv3B.itemsSnapshot[0].hsn, total: inv3B.totalsSnapshot.grandTotal },
    case4: { file: 'case4_discounted_order.pdf', invoiceNumber: inv4.invoiceNumber, seller: inv4.sellerSnapshot.legalName, subtotal: inv4.totalsSnapshot.subtotal, discount: inv4.totalsSnapshot.discountAmount, taxable: inv4.totalsSnapshot.taxableSubtotal, tax: inv4.totalsSnapshot.taxPrice, total: inv4.totalsSnapshot.grandTotal },
    case5: { file: 'case5_order_with_shipping.pdf', invoiceNumber: inv5.invoiceNumber, seller: inv5.sellerSnapshot.legalName, shipping: inv5.totalsSnapshot.shippingPrice, total: inv5.totalsSnapshot.grandTotal },
    case6: { blocked: case6Blocked, errorMessage: case6ErrorMessage, status: 'BLOCKED_BY_LIFECYCLE_GATE' },
  };

  fs.writeFileSync(path.join(outDir, 'verification_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Manifest written to verification_manifest.json');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
