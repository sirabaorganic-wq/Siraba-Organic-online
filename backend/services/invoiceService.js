const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const VendorOrder = require("../models/VendorOrder");
const Vendor = require("../models/Vendor");
const GSTSettings = require("../models/GSTSettings");
const { generateNextInvoiceNumber } = require("../utils/invoiceNumberGenerator");
const {
  getStateCode,
  determineJurisdiction,
  calculateLineItemTax,
  CUSTOMER_PRODUCT_GST_RATE,
} = require("../utils/gstEngine");

/**
 * ============================================================================
 * SIRABA ORGANIC — AUTHORITATIVE INVOICE SERVICE (PHASE C)
 * File: backend/services/invoiceService.js
 * ============================================================================
 *
 * Implements Phase C Vendor-as-Seller marketplace architecture:
 * 1. Customer Product Tax Invoice:
 *    - Vendor is the SELLER (legalName, registered address, GSTIN, stateCode)
 *    - Siraba is strictly the Marketplace Facilitator
 *    - Multi-vendor orders generate separate vendor-specific invoices
 *    - Vendor-isolated numbering sequence [VENDOR-CODE]/26-27/000001
 *    - Issuance blocked while vendor order is pending approval
 *    - Issuance blocked if vendor seller identity is incomplete
 * 2. Vendor Settlement Statement:
 *    - Documents gross merchandise, commission deduction, net payout
 * 3. Vendor Commission Invoice:
 *    - Siraba bills Vendor for marketplace facilitation services (SAC 998311, 18% GST)
 * 4. Credit Note:
 *    - Reverses customer tax invoices without mutating original invoice
 */

/**
 * Get or create an immutable Customer Tax Invoice for a specific VendorOrder.
 *
 * @param {string|mongoose.Types.ObjectId} vendorOrderId
 * @returns {Promise<Invoice>}
 */
async function getOrCreateCustomerInvoiceForVendorOrder(vendorOrderId) {
  // 1. Idempotency Check: Return existing customer tax invoice if already issued
  const existingInvoice = await Invoice.findOne({
    invoiceType: "CUSTOMER_TAX_INVOICE",
    vendorOrder: vendorOrderId,
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  // 2. Fetch VendorOrder with populated items, vendor, and parent order
  const vendorOrder = await VendorOrder.findById(vendorOrderId)
    .populate("vendor")
    .populate("items.product", "name sku hsn hsnCode price category gstRate")
    .populate("order", "user shippingAddress paymentMethod status isPaid createdAt couponCode buyerGstNumber gstClaimed");

  if (!vendorOrder) {
    const err = new Error("Vendor order not found");
    err.statusCode = 404;
    throw err;
  }

  const vendor = vendorOrder.vendor;
  const order = vendorOrder.order;

  // 3. Issuance Lifecycle Gate (Part 11):
  // Final tax invoice cannot be issued while vendor order is pending approval
  if (vendorOrder.status === "pending") {
    const err = new Error("Tax invoice cannot be issued while vendor order is pending approval");
    err.statusCode = 400;
    throw err;
  }

  if (vendorOrder.status === "cancelled") {
    const err = new Error("Tax invoice cannot be issued for a cancelled vendor order");
    err.statusCode = 400;
    throw err;
  }

  // 4. Seller Identity Verification Gate (Part 3):
  // If vendor has no required seller identity/GST information, do NOT invent it.
  const vendorAddress = vendor?.address || {};
  const vendorState = vendorAddress.state || vendorOrder.taxBreakdown?.supplierState || "";
  const vendorCity = vendorAddress.city || "";
  const vendorBusinessName = vendor?.businessName || "";

  if (!vendor || !vendorBusinessName || !vendorState || !vendorCity) {
    const err = new Error("Vendor seller identity is incomplete for tax invoice issuance");
    err.statusCode = 422;
    throw err;
  }

  const vendorStateCode = getStateCode(vendorState);
  const gstSettings = await GSTSettings.getInstance();

  // 5. Vendor-Specific Sequence Number Allocation (Part 5)
  const { invoiceNumber, financialYear, sequenceNumber } =
    await generateNextInvoiceNumber(
      "CUSTOMER_TAX_INVOICE",
      vendorOrder.createdAt || (order && order.createdAt) || new Date(),
      vendor
    );

  // 6. Build Immutable Seller Snapshot (Vendor as Seller, Siraba as Facilitator)
  const sellerSnapshot = {
    vendorId: vendor._id,
    legalName: vendorBusinessName,
    tradeName: vendor.shopSettings?.shopName || vendor.brandName || vendorBusinessName,
    address: vendorAddress.street || vendorCity || "",
    city: vendorCity,
    state: vendorState,
    stateCode: vendorStateCode,
    postalCode: vendorAddress.postalCode || "",
    country: vendorAddress.country || "India",
    gstin: vendor.gstNumber || "",
    email: vendor.email || "",
    phone: vendor.phone || "",
    isMarketplaceFacilitator: true,
    facilitatorName: "Siraba Organic",
  };

  // 7. Build Immutable Buyer Snapshot
  const buyerAddress = vendorOrder.shippingAddress || (order && order.shippingAddress) || {};
  const buyerState = buyerAddress.state || "";
  const buyerStateCode = getStateCode(buyerState);

  const buyerSnapshot = {
    name: buyerAddress.name || (order?.user?.name) || "Customer",
    email: order?.user?.email || "",
    phone: buyerAddress.phone || order?.user?.phone || "",
    gstin: order?.gstClaimed && order?.buyerGstNumber ? order.buyerGstNumber : "",
    gstClaimed: !!(order?.gstClaimed && order?.buyerGstNumber),
    billingAddress: buyerAddress,
    shippingAddress: buyerAddress,
    stateCode: buyerStateCode,
  };

  // 8. Supply Jurisdiction Determination
  const { isInterState, supplierState, customerState } = determineJurisdiction(
    vendorState,
    buyerState
  );

  // Phase 14 / Phase D Blocker: Validate product HSN exists for taxable sale
  for (const item of (vendorOrder.items || [])) {
    const rawHsn = item.hsnCode || item.hsn || (item.product && (item.product.hsnCode || item.product.hsn)) || "";
    const cleanHsn = String(rawHsn).trim();
    if (!cleanHsn) {
      const err = new Error("Product HSN code is required before a tax invoice can be issued.");
      err.statusCode = 400;
      throw err;
    }
  }

  // 9. Build Immutable Item Snapshot (Strictly VendorOrder items, authentic HSN, flat 18% GST)
  let totalTaxableSubtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTax = 0;

  const itemsSnapshot = (vendorOrder.items || []).map((item) => {
    const unitPrice = item.price || 0;
    const quantity = item.quantity || 1;
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

    // Authentic HSN from item or populated product (canonical hsnCode and legacy hsn, NO 0909 fallback)
    const itemHsn = (item.hsnCode || item.hsn || (item.product && (item.product.hsnCode || item.product.hsn)) || "").trim();
    const itemSku = item.sku || (item.product && item.product.sku) || "";

    const itemDiscount = item.discountAmount || 0;
    const taxableAmount =
      item.taxableAmount !== undefined && item.taxableAmount !== null
        ? item.taxableAmount
        : Math.max(0, Math.round((lineTotal - itemDiscount) * 100) / 100);

    // Flat 18% GST per client business instruction for customer product sale flow
    const gstRate = gstSettings.gst_enabled !== false ? CUSTOMER_PRODUCT_GST_RATE : 0;

    const lineTax = calculateLineItemTax({ taxableAmount, gstRate, isInterState });

    totalTaxableSubtotal += taxableAmount;
    totalTax += lineTax.totalTax;
    totalCgst += lineTax.cgstAmount;
    totalSgst += lineTax.sgstAmount;
    totalIgst += lineTax.igstAmount;

    return {
      product: item.product?._id || item.product,
      name: item.name,
      sku: itemSku,
      hsn: itemHsn,
      hsnCode: itemHsn,
      quantity,
      unitPrice,
      lineTotal,
      taxRate: lineTax.gstRate,
      taxAmount: lineTax.totalTax,
      discountAmount: itemDiscount,
      taxableAmount,
      cgstAmount: lineTax.cgstAmount,
      sgstAmount: lineTax.sgstAmount,
      igstAmount: lineTax.igstAmount,
    };
  });

  // 10. Financial Reconciliation Totals
  const subtotal = vendorOrder.subtotal || itemsSnapshot.reduce((s, i) => s + i.lineTotal, 0);
  const discountAmount = itemsSnapshot.reduce((s, i) => s + (i.discountAmount || 0), 0);
  const taxableSubtotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  const shippingPrice = vendorOrder.customerShippingCharge || 0;
  const taxPrice = Math.round(totalTax * 100) / 100;
  const grandTotal = Math.round((taxableSubtotal + taxPrice + shippingPrice) * 100) / 100;

  try {
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceType: "CUSTOMER_TAX_INVOICE",
      order: order?._id || vendorOrder.order,
      vendorOrder: vendorOrder._id,
      vendor: vendor._id,
      customer: order?.user?._id || order?.user,
      status: order?.isPaid ? "paid" : "issued",
      issuedAt: vendorOrder.createdAt || (order && order.createdAt) || new Date(),
      financialYear,
      sequenceNumber,
      currency: "INR",
      sellerSnapshot,
      buyerSnapshot,
      itemsSnapshot,
      pricingSnapshot: {
        itemsSubtotal: subtotal,
        grossAmount: subtotal,
      },
      discountSnapshot: {
        couponCode: order?.couponCode || "",
        discountAmount,
        discountedSubtotal: taxableSubtotal,
      },
      taxSnapshot: {
        gstEnabled: gstSettings.gst_enabled !== false,
        gstPercentage: CUSTOMER_PRODUCT_GST_RATE,
        taxPrice,
        isInterState,
        supplierState,
        customerState,
        cgstAmount: Math.round(totalCgst * 100) / 100,
        sgstAmount: Math.round(totalSgst * 100) / 100,
        igstAmount: Math.round(totalIgst * 100) / 100,
      },
      shippingSnapshot: {
        shippingPrice,
        isFreeShipping: shippingPrice === 0,
      },
      totalsSnapshot: {
        subtotal,
        discountAmount,
        taxableSubtotal,
        taxPrice,
        cgstAmount: Math.round(totalCgst * 100) / 100,
        sgstAmount: Math.round(totalSgst * 100) / 100,
        igstAmount: Math.round(totalIgst * 100) / 100,
        shippingPrice,
        grandTotal,
      },
      pdfStatus: "generated",
    });

    return invoice;
  } catch (err) {
    if (err.code === 11000) {
      return await Invoice.findOne({
        invoiceType: "CUSTOMER_TAX_INVOICE",
        vendorOrder: vendorOrderId,
      });
    }
    throw err;
  }
}

/**
 * Retrieve or create all customer tax invoices for an order.
 * In a multi-vendor order, returns an array of separate vendor-specific invoices.
 *
 * @param {string|mongoose.Types.ObjectId} orderId
 * @returns {Promise<Array<Invoice>>}
 */
async function getOrCreateCustomerInvoicesForOrder(orderId) {
  const vendorOrders = await VendorOrder.find({ order: orderId });
  if (vendorOrders.length > 0) {
    const invoices = [];
    for (const vo of vendorOrders) {
      try {
        const inv = await getOrCreateCustomerInvoiceForVendorOrder(vo._id);
        invoices.push(inv);
      } catch (err) {
        const existing = await Invoice.findOne({
          invoiceType: "CUSTOMER_TAX_INVOICE",
          vendorOrder: vo._id,
        });
        if (existing) {
          invoices.push(existing);
        }
      }
    }
    if (invoices.length > 0) return invoices;
  }

  // Fallback to single invoice if no vendor orders exist (legacy mock orders)
  const single = await getOrCreateCustomerInvoice(orderId);
  return [single];
}

/**
 * Get or create a persistent, immutable Customer Tax Invoice.
 * If vendorOrderId is provided or single VendorOrder exists, issues vendor-specific tax invoice.
 *
 * @param {string|ObjectId} orderId
 * @param {string|ObjectId} [vendorOrderId=null]
 * @returns {Promise<Invoice>}
 */
async function getOrCreateCustomerInvoice(orderId, vendorOrderId = null) {
  if (vendorOrderId) {
    return await getOrCreateCustomerInvoiceForVendorOrder(vendorOrderId);
  }

  // Check if VendorOrders exist for this order
  const vendorOrders = await VendorOrder.find({ order: orderId });
  if (vendorOrders.length === 1) {
    return await getOrCreateCustomerInvoiceForVendorOrder(vendorOrders[0]._id);
  }
  if (vendorOrders.length > 1) {
    // Multi-vendor: check if first vendor order already has invoice
    const firstInvoice = await Invoice.findOne({
      invoiceType: "CUSTOMER_TAX_INVOICE",
      order: orderId,
    });
    if (firstInvoice) return firstInvoice;
    return await getOrCreateCustomerInvoiceForVendorOrder(vendorOrders[0]._id);
  }

  // Fallback for orders created without VendorOrders (e.g. legacy test mocks)
  const existingInvoice = await Invoice.findOne({
    invoiceType: "CUSTOMER_TAX_INVOICE",
    order: orderId,
    vendorOrder: null,
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const order = await Order.findById(orderId)
    .populate("user", "name email phone")
    .populate("orderItems.product", "name sku hsn hsnCode price");

  if (!order) {
    throw new Error("Order not found");
  }

  // Check status gate
  if (order.status && order.status.toLowerCase() === "pending") {
    const err = new Error("Tax invoice cannot be issued while order is pending approval");
    err.statusCode = 400;
    throw err;
  }

  // Phase 14 / Phase D Blocker: Validate product HSN exists for taxable sale
  for (const item of (order.orderItems || [])) {
    const rawHsn = item.hsnCode || item.hsn || (item.product && (item.product.hsnCode || item.product.hsn)) || "";
    const cleanHsn = String(rawHsn).trim();
    if (!cleanHsn) {
      const err = new Error("Product HSN code is required before a tax invoice can be issued.");
      err.statusCode = 400;
      throw err;
    }
  }

  const gstSettings = await GSTSettings.getInstance();
  const { invoiceNumber, financialYear, sequenceNumber } =
    await generateNextInvoiceNumber("CUSTOMER_TAX_INVOICE", order.createdAt);

  const sellerSnapshot = {
    legalName: gstSettings.company_name || "Siraba Organic",
    tradeName: "Siraba Organic",
    address: gstSettings.company_address?.street || "123 Saffron Valley, Pampore",
    city: gstSettings.company_address?.city || "Pampore",
    state: gstSettings.company_address?.state || "Jammu and Kashmir",
    stateCode: getStateCode(gstSettings.company_address?.state || "Jammu and Kashmir"),
    postalCode: gstSettings.company_address?.pincode || "192121",
    country: "India",
    gstin: order.sellerGstNumber || gstSettings.admin_gst_number || "",
    email: "info@sirabaorganic.com",
    phone: "+91 99066 93633",
    isMarketplaceFacilitator: false,
    facilitatorName: "Siraba Organic",
  };

  const buyerSnapshot = {
    name: order.shippingAddress?.name || order.user?.name || "Customer",
    email: order.user?.email || "",
    phone: order.shippingAddress?.phone || order.user?.phone || "",
    gstin: order.gstClaimed && order.buyerGstNumber ? order.buyerGstNumber : "",
    gstClaimed: !!(order.gstClaimed && order.buyerGstNumber),
    billingAddress: order.shippingAddress || {},
    shippingAddress: order.shippingAddress || {},
    stateCode: getStateCode(order.shippingAddress?.state || ""),
  };

  const isInterState = order.taxBreakdown?.isInterState ?? false;
  const supplierState = order.taxBreakdown?.supplierState || gstSettings.company_address?.state || "Jammu and Kashmir";
  const customerState = order.taxBreakdown?.customerState || order.shippingAddress?.state || "";

  const itemsSnapshot = (order.orderItems || []).map((item) => {
    const unitPrice = item.price || 0;
    const quantity = item.quantity || 1;
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    const itemHsn = (item.hsnCode || item.hsn || (item.product && (item.product.hsnCode || item.product.hsn)) || "").trim();
    const itemSku = item.sku || (item.product && item.product.sku) || "";

    const itemTaxRate = gstSettings.gst_enabled !== false ? CUSTOMER_PRODUCT_GST_RATE : 0;

    const itemDiscount = item.discountAmount || 0;
    const taxableAmount =
      item.taxableAmount !== undefined && item.taxableAmount !== null
        ? item.taxableAmount
        : Math.max(0, Math.round((lineTotal - itemDiscount) * 100) / 100);

    const lineTax = calculateLineItemTax({ taxableAmount, gstRate: itemTaxRate, isInterState });

    return {
      product: item.product?._id || item.product,
      name: item.name,
      sku: itemSku,
      hsn: itemHsn,
      hsnCode: itemHsn,
      quantity,
      unitPrice,
      lineTotal,
      taxRate: lineTax.gstRate,
      taxAmount: lineTax.totalTax,
      discountAmount: itemDiscount,
      taxableAmount,
      cgstAmount: lineTax.cgstAmount,
      sgstAmount: lineTax.sgstAmount,
      igstAmount: lineTax.igstAmount,
    };
  });

  const itemsSubtotal = order.itemsPrice || 0;
  const discountAmount = order.discountAmount || 0;
  const discountedSubtotal = Math.max(0, itemsSubtotal - discountAmount);
  const taxPrice = order.taxPrice || 0;
  const shippingPrice = order.shippingPrice || 0;
  const grandTotal = order.totalPrice || 0;

  try {
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceType: "CUSTOMER_TAX_INVOICE",
      order: order._id,
      vendorOrder: null,
      customer: order.user?._id || order.user,
      status: order.isPaid ? "paid" : "issued",
      issuedAt: order.createdAt || new Date(),
      financialYear,
      sequenceNumber,
      currency: "INR",
      sellerSnapshot,
      buyerSnapshot,
      itemsSnapshot,
      pricingSnapshot: {
        itemsSubtotal,
        grossAmount: itemsSubtotal,
      },
      discountSnapshot: {
        couponCode: order.couponCode || "",
        discountAmount,
        discountedSubtotal,
      },
      taxSnapshot: {
        gstEnabled: gstSettings.gst_enabled !== false,
        gstPercentage: gstSettings.default_gst_percentage || 18,
        taxPrice,
        isInterState,
        supplierState,
        customerState,
        cgstAmount: order.taxBreakdown?.cgst !== undefined ? order.taxBreakdown.cgst : (isInterState ? 0 : Math.round(taxPrice / 2 * 100) / 100),
        sgstAmount: order.taxBreakdown?.sgst !== undefined ? order.taxBreakdown.sgst : (isInterState ? 0 : Math.round((taxPrice - Math.round(taxPrice / 2 * 100) / 100) * 100) / 100),
        igstAmount: order.taxBreakdown?.igst !== undefined ? order.taxBreakdown.igst : (isInterState ? taxPrice : 0),
      },
      shippingSnapshot: {
        shippingPrice,
        isFreeShipping: shippingPrice === 0,
      },
      totalsSnapshot: {
        subtotal: itemsSubtotal,
        discountAmount,
        taxableSubtotal: discountedSubtotal,
        taxPrice,
        cgstAmount: order.taxBreakdown?.cgst || 0,
        sgstAmount: order.taxBreakdown?.sgst || 0,
        igstAmount: order.taxBreakdown?.igst || 0,
        shippingPrice,
        grandTotal,
      },
      pdfStatus: "generated",
    });

    return invoice;
  } catch (err) {
    if (err.code === 11000) {
      return await Invoice.findOne({
        invoiceType: "CUSTOMER_TAX_INVOICE",
        order: orderId,
        vendorOrder: null,
      });
    }
    throw err;
  }
}

/**
 * Get or create an immutable Vendor Settlement Statement for a VendorOrder.
 * Documents vendor payout economics: subtotal - platform commission = netAmount.
 *
 * @param {string|ObjectId} vendorOrderId
 * @param {string|ObjectId} [vendorId] Optional vendor authorization check
 * @returns {Promise<Invoice>}
 */
async function getOrCreateVendorInvoice(vendorOrderId, vendorId = null) {
  // 1. Idempotency Check: Return existing statement if already issued
  const existingInvoice = await Invoice.findOne({
    invoiceType: "VENDOR_SETTLEMENT_STATEMENT",
    vendorOrder: vendorOrderId,
  });

  if (existingInvoice) {
    if (vendorId && existingInvoice.vendor.toString() !== vendorId.toString()) {
      const err = new Error("Not authorized to view this vendor invoice");
      err.statusCode = 403;
      throw err;
    }
    return existingInvoice;
  }

  // 2. Fetch VendorOrder with populated items, vendor, and order
  const vendorOrder = await VendorOrder.findById(vendorOrderId)
    .populate("vendor")
    .populate("items.product", "name sku hsn price")
    .populate("order", "user status paymentMethod");

  if (!vendorOrder) {
    const err = new Error("Vendor order not found");
    err.statusCode = 404;
    throw err;
  }

  if (vendorId && vendorOrder.vendor?._id.toString() !== vendorId.toString()) {
    const err = new Error("Not authorized to access this vendor order");
    err.statusCode = 403;
    throw err;
  }

  const vendor = vendorOrder.vendor;
  const gstSettings = await GSTSettings.getInstance();

  // 3. Generate persistent sequential invoice number
  const { invoiceNumber, financialYear, sequenceNumber } =
    await generateNextInvoiceNumber("VENDOR_SETTLEMENT_STATEMENT", vendorOrder.createdAt);

  // 4. Construct immutable snapshots
  const sellerSnapshot = {
    legalName: vendor?.businessName || "Vendor Partner",
    tradeName: vendor?.brandName || vendor?.businessName || "Vendor Partner",
    address: vendor?.address?.street || vendor?.address?.city || "",
    city: vendor?.address?.city || "",
    state: vendor?.address?.state || "",
    stateCode: getStateCode(vendor?.address?.state || ""),
    postalCode: vendor?.address?.postalCode || "",
    country: "India",
    gstin: vendor?.gstNumber || "",
    email: vendor?.email || "",
    phone: vendor?.phone || "",
  };

  const buyerSnapshot = {
    name: vendorOrder.shippingAddress?.name || "Customer",
    phone: vendorOrder.shippingAddress?.phone || "",
    shippingAddress: vendorOrder.shippingAddress || {},
    stateCode: getStateCode(vendorOrder.shippingAddress?.state || ""),
  };

  const vIsInterState = vendorOrder.taxBreakdown?.isInterState ?? false;
  const vSupplierState = vendorOrder.taxBreakdown?.supplierState || vendor?.address?.state || "";
  const vCustomerState = vendorOrder.taxBreakdown?.customerState || vendorOrder.shippingAddress?.state || "";

  const itemsSnapshot = (vendorOrder.items || []).map((item) => {
    const unitPrice = item.price || 0;
    const quantity = item.quantity || 1;
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    const itemHsn = item.hsn || (item.product && item.product.hsn) || "";
    const itemSku = item.sku || (item.product && item.product.sku) || "";
    const itemTaxRate = item.taxRate !== undefined ? item.taxRate : (gstSettings.default_gst_percentage || 18);
    const itemTax = item.taxAmount !== undefined ? item.taxAmount : 0;
    const itemDiscount = item.discountAmount || 0;
    const itemTaxable = item.taxableAmount !== undefined ? item.taxableAmount : (lineTotal - itemDiscount);

    return {
      product: item.product?._id || item.product,
      name: item.name,
      sku: itemSku,
      hsn: itemHsn,
      quantity,
      unitPrice,
      lineTotal,
      taxRate: itemTaxRate,
      taxAmount: itemTax,
      discountAmount: itemDiscount,
      taxableAmount: itemTaxable,
      cgstAmount: item.cgstAmount || (vIsInterState ? 0 : Math.round(itemTax / 2 * 100) / 100),
      sgstAmount: item.sgstAmount || (vIsInterState ? 0 : Math.round((itemTax - (item.cgstAmount || Math.round(itemTax / 2 * 100) / 100)) * 100) / 100),
      igstAmount: item.igstAmount || (vIsInterState ? itemTax : 0),
    };
  });

  const subtotal = vendorOrder.subtotal || itemsSnapshot.reduce((s, i) => s + i.lineTotal, 0);
  const commission = vendorOrder.commission || 0;
  const commissionRate =
    vendorOrder.commissionRateAtOrder !== undefined && vendorOrder.commissionRateAtOrder !== null
      ? vendorOrder.commissionRateAtOrder
      : (vendor?.commissionRate || 10);
  const tax = vendorOrder.tax || 0;
  const customerShippingCharge = vendorOrder.customerShippingCharge || 0;
  const netAmount =
    vendorOrder.netAmount !== undefined && vendorOrder.netAmount !== null
      ? vendorOrder.netAmount
      : (subtotal - commission);

  const customerId = vendorOrder.order?.user || vendorOrder.vendor?._id;

  try {
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceType: "VENDOR_SETTLEMENT_STATEMENT",
      order: vendorOrder.order?._id || vendorOrder.order,
      vendorOrder: vendorOrder._id,
      vendor: vendor?._id,
      customer: customerId,
      status: vendorOrder.payoutStatus === "completed" ? "paid" : "issued",
      issuedAt: vendorOrder.createdAt || new Date(),
      financialYear,
      sequenceNumber,
      currency: "INR",
      sellerSnapshot,
      buyerSnapshot,
      itemsSnapshot,
      pricingSnapshot: {
        itemsSubtotal: subtotal,
        grossAmount: subtotal,
      },
      discountSnapshot: {
        discountAmount: 0,
        discountedSubtotal: subtotal,
      },
      taxSnapshot: {
        gstEnabled: gstSettings.gst_enabled !== false,
        gstPercentage: gstSettings.default_gst_percentage || 18,
        taxPrice: tax,
        isInterState: vIsInterState,
        supplierState: vSupplierState,
        customerState: vCustomerState,
        cgstAmount: vendorOrder.taxBreakdown?.cgst !== undefined ? vendorOrder.taxBreakdown.cgst : (vIsInterState ? 0 : Math.round(tax / 2 * 100) / 100),
        sgstAmount: vendorOrder.taxBreakdown?.sgst !== undefined ? vendorOrder.taxBreakdown.sgst : (vIsInterState ? 0 : Math.round((tax - Math.round(tax / 2 * 100) / 100) * 100) / 100),
        igstAmount: vendorOrder.taxBreakdown?.igst !== undefined ? vendorOrder.taxBreakdown.igst : (vIsInterState ? tax : 0),
      },
      shippingSnapshot: {
        shippingPrice: customerShippingCharge,
        isFreeShipping: customerShippingCharge === 0,
      },
      totalsSnapshot: {
        subtotal,
        discountAmount: 0,
        taxableSubtotal: subtotal,
        taxPrice: tax,
        shippingPrice: customerShippingCharge,
        grandTotal: subtotal,
        commissionAmount: commission,
        commissionRate,
        netPayoutAmount: netAmount,
      },
      pdfStatus: "generated",
    });

    return invoice;
  } catch (err) {
    if (err.code === 11000) {
      return await Invoice.findOne({
        invoiceType: "VENDOR_SETTLEMENT_STATEMENT",
        vendorOrder: vendorOrderId,
      });
    }
    throw err;
  }
}

/**
 * Get or create an immutable Vendor Commission Invoice from Siraba Organic to the Vendor.
 * Documents marketplace commission fees billed to the vendor under SAC 998311.
 *
 * @param {string|mongoose.Types.ObjectId} vendorOrderId
 * @returns {Promise<Invoice>}
 */
async function getOrCreateVendorCommissionInvoice(vendorOrderId) {
  const existingInvoice = await Invoice.findOne({
    invoiceType: "VENDOR_COMMISSION_INVOICE",
    vendorOrder: vendorOrderId,
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const vendorOrder = await VendorOrder.findById(vendorOrderId)
    .populate("vendor")
    .populate("order");

  if (!vendorOrder) {
    const err = new Error("Vendor order not found");
    err.statusCode = 404;
    throw err;
  }

  const vendor = vendorOrder.vendor;
  const gstSettings = await GSTSettings.getInstance();
  const commissionAmount = vendorOrder.commission || 0;

  const { invoiceNumber, financialYear, sequenceNumber } =
    await generateNextInvoiceNumber("VENDOR_COMMISSION_INVOICE", vendorOrder.createdAt || new Date());

  // Siraba is the SELLER/service provider
  const sellerSnapshot = {
    legalName: gstSettings.company_name || "Siraba Organic",
    tradeName: "Siraba Organic",
    address: gstSettings.company_address?.street || "123 Saffron Valley, Pampore",
    city: gstSettings.company_address?.city || "Pampore",
    state: gstSettings.company_address?.state || "Jammu and Kashmir",
    stateCode: getStateCode(gstSettings.company_address?.state || "Jammu and Kashmir"),
    postalCode: gstSettings.company_address?.pincode || "192121",
    country: "India",
    gstin: gstSettings.admin_gst_number || "01AABCS1429B1Z1",
    email: "finance@sirabaorganic.com",
    phone: "+91 99066 93633",
    isMarketplaceFacilitator: false,
    facilitatorName: "Siraba Organic",
  };

  // Vendor is the BUYER/recipient of the service
  const buyerSnapshot = {
    name: vendor?.businessName || "Vendor Partner",
    email: vendor?.email || "",
    phone: vendor?.phone || "",
    gstin: vendor?.gstNumber || "",
    gstClaimed: !!vendor?.gstNumber,
    billingAddress: vendor?.address || {},
    shippingAddress: vendor?.address || {},
    stateCode: getStateCode(vendor?.address?.state || ""),
  };

  const isInterState = determineJurisdiction(sellerSnapshot.state, buyerSnapshot.billingAddress?.state).isInterState;
  const serviceTaxRate = 18; // Standard GST on marketplace services
  const taxableSubtotal = commissionAmount;
  const lineTax = calculateLineItemTax({ taxableAmount: taxableSubtotal, gstRate: serviceTaxRate, isInterState });

  const itemsSnapshot = [
    {
      name: "Marketplace Facilitation & Commission Services",
      sku: "SRB-COMM-SVC",
      hsn: "998311", // SAC for other information technology services / facilitation
      quantity: 1,
      unitPrice: commissionAmount,
      lineTotal: commissionAmount,
      taxableAmount: taxableSubtotal,
      taxRate: serviceTaxRate,
      taxAmount: lineTax.totalTax,
      cgstAmount: lineTax.cgstAmount,
      sgstAmount: lineTax.sgstAmount,
      igstAmount: lineTax.igstAmount,
    },
  ];

  const grandTotal = Math.round((taxableSubtotal + lineTax.totalTax) * 100) / 100;

  try {
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceType: "VENDOR_COMMISSION_INVOICE",
      order: vendorOrder.order?._id || vendorOrder.order,
      vendorOrder: vendorOrder._id,
      vendor: vendor?._id,
      customer: vendorOrder.order?.user || vendor?._id,
      status: "issued",
      issuedAt: vendorOrder.createdAt || new Date(),
      financialYear,
      sequenceNumber,
      currency: "INR",
      sellerSnapshot,
      buyerSnapshot,
      itemsSnapshot,
      pricingSnapshot: {
        itemsSubtotal: commissionAmount,
        grossAmount: commissionAmount,
      },
      discountSnapshot: {
        discountAmount: 0,
        discountedSubtotal: commissionAmount,
      },
      taxSnapshot: {
        gstEnabled: true,
        gstPercentage: serviceTaxRate,
        taxPrice: lineTax.totalTax,
        isInterState,
        supplierState: sellerSnapshot.state,
        customerState: buyerSnapshot.billingAddress?.state || "",
        cgstAmount: lineTax.cgstAmount,
        sgstAmount: lineTax.sgstAmount,
        igstAmount: lineTax.igstAmount,
      },
      shippingSnapshot: {
        shippingPrice: 0,
        isFreeShipping: true,
      },
      totalsSnapshot: {
        subtotal: commissionAmount,
        discountAmount: 0,
        taxableSubtotal,
        taxPrice: lineTax.totalTax,
        cgstAmount: lineTax.cgstAmount,
        sgstAmount: lineTax.sgstAmount,
        igstAmount: lineTax.igstAmount,
        shippingPrice: 0,
        grandTotal,
        commissionAmount,
        commissionRate: vendorOrder.commissionRateAtOrder || vendor?.commissionRate || 10,
      },
      pdfStatus: "not_generated",
    });

    return invoice;
  } catch (err) {
    if (err.code === 11000) {
      return await Invoice.findOne({
        invoiceType: "VENDOR_COMMISSION_INVOICE",
        vendorOrder: vendorOrderId,
      });
    }
    throw err;
  }
}

/**
 * Create a persistent, immutable Credit Note linked to an existing issued Customer Tax Invoice.
 * Never mutates or deletes the original tax invoice.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.orderId
 * @param {string|ObjectId} [params.vendorOrderId]
 * @param {number} params.refundAmount
 * @param {string} [params.reason]
 * @param {string} [params.refundReference]
 * @param {Array} [params.itemsRefunded]
 * @returns {Promise<Invoice>}
 */
async function createCreditNote({
  orderId,
  vendorOrderId = null,
  refundAmount,
  reason = "Refund/Cancellation",
  refundReference = "",
  itemsRefunded = [],
}) {
  const query = {
    invoiceType: "CUSTOMER_TAX_INVOICE",
    order: orderId,
  };
  if (vendorOrderId) {
    query.vendorOrder = vendorOrderId;
  }

  const originalInvoice = await Invoice.findOne(query);

  if (!originalInvoice) {
    throw new Error("Original customer invoice not found for credit note issuance");
  }

  const { invoiceNumber, financialYear, sequenceNumber } =
    await generateNextInvoiceNumber("CREDIT_NOTE", new Date());

  const isInterState = originalInvoice.taxSnapshot?.isInterState ?? false;
  const creditGstRate = CUSTOMER_PRODUCT_GST_RATE;

  let totalReversedTaxable = 0;
  let totalReversedTax = 0;
  let totalReversedCgst = 0;
  let totalReversedSgst = 0;
  let totalReversedIgst = 0;

  const rawItems = itemsRefunded && itemsRefunded.length > 0
    ? itemsRefunded
    : [{ name: "Refund / Credit Adjustment", amount: refundAmount, quantity: 1 }];

  const itemsSnapshot = rawItems.map((item) => {
    const origItem = (originalInvoice.itemsSnapshot || []).find((oi) =>
      (item.product && oi.product && oi.product.toString() === item.product.toString()) ||
      (item.name && oi.name && oi.name.toLowerCase() === item.name.toLowerCase())
    );

    const itemHsn = (origItem ? (origItem.hsnCode || origItem.hsn) : (item.hsnCode || item.hsn)) || "";
    const itemSku = origItem?.sku || item.sku || "";
    const lineTotal = item.amount !== undefined ? item.amount : (refundAmount / (rawItems.length || 1));

    // Under GST law, refund amount is gross credit; derive reversed taxable amount and 18% GST
    const taxableAmount = Math.round((lineTotal / (1 + creditGstRate / 100)) * 100) / 100;
    const lineTax = calculateLineItemTax({ taxableAmount, gstRate: creditGstRate, isInterState });

    totalReversedTaxable += taxableAmount;
    totalReversedTax += lineTax.totalTax;
    totalReversedCgst += lineTax.cgstAmount;
    totalReversedSgst += lineTax.sgstAmount;
    totalReversedIgst += lineTax.igstAmount;

    return {
      product: item.product || origItem?.product,
      name: item.name || origItem?.name || "Refunded Item",
      sku: itemSku,
      hsn: itemHsn,
      hsnCode: itemHsn,
      quantity: item.quantity || 1,
      unitPrice: origItem?.unitPrice || lineTotal,
      lineTotal,
      taxableAmount,
      taxRate: lineTax.gstRate,
      taxAmount: lineTax.totalTax,
      cgstAmount: lineTax.cgstAmount,
      sgstAmount: lineTax.sgstAmount,
      igstAmount: lineTax.igstAmount,
    };
  });

  const roundedTaxable = Math.round(totalReversedTaxable * 100) / 100;
  const roundedTax = Math.round(totalReversedTax * 100) / 100;

  const creditNote = await Invoice.create({
    invoiceNumber,
    invoiceType: "CREDIT_NOTE",
    order: orderId,
    vendorOrder: vendorOrderId || originalInvoice.vendorOrder,
    customer: originalInvoice.customer,
    vendor: originalInvoice.vendor || null,
    status: "issued",
    issuedAt: new Date(),
    financialYear,
    sequenceNumber,
    currency: "INR",
    originalInvoice: originalInvoice._id,
    creditNoteDetails: {
      reason,
      refundAmount,
      refundReference,
      itemsRefunded,
    },
    sellerSnapshot: originalInvoice.sellerSnapshot,
    buyerSnapshot: originalInvoice.buyerSnapshot,
    itemsSnapshot,
    pricingSnapshot: {
      itemsSubtotal: refundAmount,
      grossAmount: refundAmount,
    },
    discountSnapshot: {
      discountAmount: 0,
      discountedSubtotal: refundAmount,
    },
    taxSnapshot: {
      gstEnabled: originalInvoice.taxSnapshot?.gstEnabled ?? true,
      gstPercentage: creditGstRate,
      taxPrice: roundedTax,
      isInterState,
      cgstAmount: Math.round(totalReversedCgst * 100) / 100,
      sgstAmount: Math.round(totalReversedSgst * 100) / 100,
      igstAmount: Math.round(totalReversedIgst * 100) / 100,
    },
    shippingSnapshot: {
      shippingPrice: 0,
      isFreeShipping: true,
    },
    totalsSnapshot: {
      subtotal: refundAmount,
      discountAmount: 0,
      taxableSubtotal: roundedTaxable,
      taxPrice: roundedTax,
      shippingPrice: 0,
      grandTotal: refundAmount,
    },
    pdfStatus: "not_generated",
  });

  return creditNote;
}

module.exports = {
  getOrCreateCustomerInvoiceForVendorOrder,
  getOrCreateCustomerInvoicesForOrder,
  getOrCreateCustomerInvoice,
  getOrCreateVendorInvoice,
  getOrCreateVendorCommissionInvoice,
  createCreditNote,
};
