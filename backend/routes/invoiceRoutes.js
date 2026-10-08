const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const VendorOrder = require("../models/VendorOrder");
const Invoice = require("../models/Invoice");
const {
  getOrCreateCustomerInvoice,
  getOrCreateCustomerInvoiceForVendorOrder,
  getOrCreateCustomerInvoicesForOrder,
} = require("../services/invoiceService");
const { getStateCode } = require("../utils/gstEngine");
const { protect } = require("../middleware/authMiddleware");
const fs = require("fs").promises;
const path = require("path");
const handlebars = require("handlebars");
const {
  renderHtmlToPdf,
  buildPureJsPdf,
  htmlToTextBlocks,
} = require("../utils/puppeteerHelper");

/**
 * Convert INR currency amount to standard English words (Indian numbering system).
 * E.g., 1050 -> "One Thousand Fifty Rupees Only"
 */
function numberToWordsINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "";
  const num = Math.round(Number(amount) * 100) / 100;
  if (num === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertTwoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = "";
    if (hundred > 0) res += ones[hundred] + " Hundred";
    if (rest > 0) res += (res ? " and " : "") + convertTwoDigits(rest);
    return res;
  }

  const integerPart = Math.floor(num);
  const paisePart = Math.round((num - integerPart) * 100);

  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  let words = "";
  if (crore > 0) words += convertThreeDigits(crore) + " Crore ";
  if (lakh > 0) words += convertThreeDigits(lakh) + " Lakh ";
  if (thousand > 0) words += convertThreeDigits(thousand) + " Thousand ";
  if (remainder > 0) words += convertThreeDigits(remainder) + " ";

  words = words.trim() + " Rupees";
  if (paisePart > 0) {
    words += " and " + convertTwoDigits(paisePart) + " Paise";
  }
  return words + " Only";
}

/**
 * Generate Customer Tax Invoice HTML from authoritative immutable snapshot.
 * Authoritatively presents Vendor as Seller and Siraba as Marketplace Facilitator.
 */
const generateInvoiceHTML = async (order, invoice = null) => {
  const templatePath = path.join(
    __dirname,
    "../templates/invoices/invoice-template.html"
  );
  const logoPath = path.join(__dirname, "../templates/invoices/logo.png");

  const templateContent = await fs.readFile(templatePath, "utf8");

  // Read and convert logo to base64
  let logoBase64 = "";
  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = logoBuffer.toString("base64");
  } catch (error) {
    console.warn("Logo not found, invoice will be generated without logo");
  }

  // Read official Siraba stamp
  const stampPath = path.join(__dirname, "../templates/invoices/sirabastamp-optimized.png");
  const fallbackStampPath = path.join(__dirname, "../templates/invoices/sirabastamp.png");
  let stampBase64 = "";
  try {
    const stampBuffer = await fs.readFile(stampPath);
    stampBase64 = stampBuffer.toString("base64");
  } catch (err) {
    try {
      const fallbackBuffer = await fs.readFile(fallbackStampPath);
      stampBase64 = fallbackBuffer.toString("base64");
    } catch (e) {
      console.warn("Stamp not found, invoice will be generated without stamp");
    }
  }

  // Ensure persistent invoice exists
  const invoiceDoc = invoice || (await getOrCreateCustomerInvoice(order._id));

  const totals = invoiceDoc.totalsSnapshot || {};
  const seller = invoiceDoc.sellerSnapshot || {};
  const buyer = invoiceDoc.buyerSnapshot || {};
  const discount = invoiceDoc.discountSnapshot || {};
  const taxSnap = invoiceDoc.taxSnapshot || {};

  const shippingPrice = totals.shippingPrice || 0;
  const discountAmount = totals.discountAmount || 0;
  const taxableSubtotal =
    totals.taxableSubtotal !== undefined ? totals.taxableSubtotal : totals.subtotal;
  const grandTotal = totals.grandTotal || 0;

  const isInterState = taxSnap.isInterState ?? false;
  const effectiveGstRate = taxSnap.gstPercentage || 18;
  const halfRate = effectiveGstRate / 2;

  const buyerState = buyer.shippingAddress?.state || "";
  const buyerStateCode = buyer.stateCode || getStateCode(buyerState) || "N/A";
  const sellerStateCode = seller.stateCode || getStateCode(seller.state) || "N/A";

  const invoiceData = {
    logoBase64,
    stampBase64,
    // Seller details (Vendor as Seller)
    companyName: seller.legalName || "Vendor Partner",
    tradeName:
      seller.tradeName && seller.tradeName !== seller.legalName
        ? seller.tradeName
        : "",
    companyAddress: seller.address || "",
    companyCityState: `${seller.city ? seller.city + ", " : ""}${seller.state || ""}${seller.postalCode ? " - " + seller.postalCode : ""}`,
    sellerStateCode,
    sellerGST: seller.gstin || null,
    companyEmail: seller.email || "",
    companyPhone: seller.phone || "",
    facilitatorName: seller.facilitatorName || "Siraba Organic",

    // Document Identity
    invoiceNumber: invoiceDoc.invoiceNumber,
    invoiceDate: new Date(invoiceDoc.issuedAt || invoiceDoc.createdAt).toLocaleDateString("en-IN"),
    orderId: order._id ? order._id.toString() : "N/A",
    orderShortId: order._id ? order._id.toString().slice(-8).toUpperCase() : "N/A",
    vendorOrderShortId: invoiceDoc.vendorOrder
      ? invoiceDoc.vendorOrder.toString().slice(-8).toUpperCase()
      : null,
    orderStatus: (order.status || "CONFIRMED").toUpperCase(),
    paymentMethod: order.paymentMethod || "Prepaid",

    // Buyer Destination
    customerName: buyer.name || "Customer",
    customerAddress: buyer.shippingAddress?.address || "N/A",
    customerCityState: `${buyer.shippingAddress?.city || "City"}, ${buyerState || ""} - ${buyer.shippingAddress?.postalCode || ""}`,
    customerCountry: buyer.shippingAddress?.country || "India",
    customerPhone: buyer.phone || buyer.shippingAddress?.phone || "",
    buyerGST: buyer.gstin || null,

    // Place of Supply
    placeOfSupply: `${buyerState || "N/A"} (State Code: ${buyerStateCode})`,
    supplyType: isInterState ? "Inter-State Supply (IGST)" : "Intra-State Supply (CGST + SGST)",

    // Items
    items: (invoiceDoc.itemsSnapshot || []).map((item) => ({
      name: item.name,
      sku: item.sku || "",
      hsn: (item.hsnCode || item.hsn || "").trim() || "N/A",
      hsnCode: (item.hsnCode || item.hsn || "").trim() || "N/A",
      quantity: item.quantity,
      price: `₹${(item.unitPrice || 0).toFixed(2)}`,
      discount: item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : "—",
      taxableAmount: `₹${(item.taxableAmount !== undefined ? item.taxableAmount : item.lineTotal).toFixed(2)}`,
      taxRate: `${item.taxRate !== undefined ? item.taxRate : effectiveGstRate}%`,
      total: `₹${(item.lineTotal || 0).toFixed(2)}`,
    })),

    // Financial Totals
    subtotal: `₹${(totals.subtotal || 0).toFixed(2)}`,
    hasDiscount: discountAmount > 0,
    discountAmount: `₹${discountAmount.toFixed(2)}`,
    couponCode: discount.couponCode || "",
    taxableSubtotal: `₹${taxableSubtotal.toFixed(2)}`,

    // Statutory GST Split
    isInterState,
    cgstRateDisplay: `${halfRate}%`,
    sgstRateDisplay: `${halfRate}%`,
    igstRateDisplay: `${effectiveGstRate}%`,
    cgstAmount: `₹${(totals.cgstAmount || 0).toFixed(2)}`,
    sgstAmount: `₹${(totals.sgstAmount || 0).toFixed(2)}`,
    igstAmount: `₹${(totals.igstAmount || 0).toFixed(2)}`,

    shipping: shippingPrice > 0 ? `₹${shippingPrice.toFixed(2)}` : "Free",
    grandTotal: `₹${grandTotal.toFixed(2)}`,
    amountInWords: numberToWordsINR(grandTotal),
  };

  const template = handlebars.compile(templateContent);
  return { html: template(invoiceData), invoiceDoc };
};

// @desc    Get all customer invoices for an order (multi-vendor aware)
// @route   GET /api/invoices/order/:orderId
// @access  Private
router.get("/order/:orderId", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Not authorized to view these invoices" });
    }

    const invoices = await getOrCreateCustomerInvoicesForOrder(order._id);
    res.json(invoices);
  } catch (error) {
    console.error("Order invoices retrieval error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get invoice HTML preview (supports ?vendorOrderId=...)
// @route   GET /api/invoices/:orderId/preview
// @access  Private
router.get("/:orderId/preview", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Authorization check
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this invoice" });
    }

    const vendorOrderId = req.query.vendorOrderId || null;
    let invoiceDoc;
    if (vendorOrderId) {
      invoiceDoc = await getOrCreateCustomerInvoiceForVendorOrder(vendorOrderId);
    } else {
      invoiceDoc = await getOrCreateCustomerInvoice(order._id);
    }

    const { html } = await generateInvoiceHTML(order, invoiceDoc);
    res.send(html);
  } catch (error) {
    console.error("Invoice preview error:", error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// @desc    Download invoice as PDF (supports ?vendorOrderId=...)
// @route   GET /api/invoices/:orderId/download
// @access  Private
router.get("/:orderId/download", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Authorization check
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to download this invoice" });
    }

    const vendorOrderId = req.query.vendorOrderId || null;
    let invoiceDoc;
    if (vendorOrderId) {
      invoiceDoc = await getOrCreateCustomerInvoiceForVendorOrder(vendorOrderId);
    } else {
      invoiceDoc = await getOrCreateCustomerInvoice(order._id);
    }

    const { html } = await generateInvoiceHTML(order, invoiceDoc);

    let pdf;
    try {
      pdf = await renderHtmlToPdf(html);
    } catch (launchErr) {
      console.warn(
        `[invoiceRoutes] Puppeteer invoice render failed (${launchErr.message}). Generating pure-JS fallback PDF...`
      );
      const textBlocks = htmlToTextBlocks(
        html,
        `TAX INVOICE #${invoiceDoc.invoiceNumber}`
      );
      pdf = buildPureJsPdf(
        `TAX INVOICE #${invoiceDoc.invoiceNumber}`,
        textBlocks
      );
    }

    const safeFilenameNumber = invoiceDoc.invoiceNumber.replace(/[\/\\:]/g, "-");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${safeFilenameNumber}.pdf`
    );
    res.send(pdf);
  } catch (error) {
    console.error("Invoice download error:", error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// @desc    Get preview for specific vendor order customer tax invoice
// @route   GET /api/invoices/vendor-order/:vendorOrderId/preview
// @access  Private
router.get("/vendor-order/:vendorOrderId/preview", protect, async (req, res) => {
  try {
    const vendorOrder = await VendorOrder.findById(req.params.vendorOrderId).populate("order");
    if (!vendorOrder) {
      return res.status(404).json({ message: "Vendor order not found" });
    }

    const order = await Order.findById(vendorOrder.order).populate("user", "name email");
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Not authorized to view this invoice" });
    }

    const invoiceDoc = await getOrCreateCustomerInvoiceForVendorOrder(vendorOrder._id);
    const { html } = await generateInvoiceHTML(order, invoiceDoc);
    res.send(html);
  } catch (error) {
    console.error("Vendor order invoice preview error:", error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// @desc    Download PDF for specific vendor order customer tax invoice
// @route   GET /api/invoices/vendor-order/:vendorOrderId/download
// @access  Private
router.get("/vendor-order/:vendorOrderId/download", protect, async (req, res) => {
  try {
    const vendorOrder = await VendorOrder.findById(req.params.vendorOrderId).populate("order");
    if (!vendorOrder) {
      return res.status(404).json({ message: "Vendor order not found" });
    }

    const order = await Order.findById(vendorOrder.order).populate("user", "name email");
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Not authorized to download this invoice" });
    }

    const invoiceDoc = await getOrCreateCustomerInvoiceForVendorOrder(vendorOrder._id);
    const { html } = await generateInvoiceHTML(order, invoiceDoc);

    let pdf;
    try {
      pdf = await renderHtmlToPdf(html);
    } catch (launchErr) {
      console.warn(
        `[invoiceRoutes] Puppeteer invoice render failed (${launchErr.message}). Generating fallback PDF...`
      );
      const textBlocks = htmlToTextBlocks(
        html,
        `TAX INVOICE #${invoiceDoc.invoiceNumber}`
      );
      pdf = buildPureJsPdf(
        `TAX INVOICE #${invoiceDoc.invoiceNumber}`,
        textBlocks
      );
    }

    const safeFilenameNumber = invoiceDoc.invoiceNumber.replace(/[\/\\:]/g, "-");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${safeFilenameNumber}.pdf`
    );
    res.send(pdf);
  } catch (error) {
    console.error("Vendor order invoice download error:", error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

/**
 * Generate Platform Commission Tax Invoice HTML (Siraba -> Vendor, SAC 998311).
 */
const generateCommissionInvoiceHTML = async (vendorOrder, invoice) => {
  const templatePath = path.join(
    __dirname,
    "../templates/invoices/commission-invoice-template.html"
  );
  const logoPath = path.join(__dirname, "../templates/invoices/logo.png");
  const stampPath = path.join(__dirname, "../templates/invoices/sirabastamp-optimized.png");
  const fallbackStampPath = path.join(__dirname, "../templates/invoices/sirabastamp.png");

  const templateContent = await fs.readFile(templatePath, "utf8");

  let logoBase64 = "";
  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = logoBuffer.toString("base64");
  } catch (error) {
    console.warn("Logo not found for commission invoice");
  }

  let stampBase64 = "";
  try {
    const stampBuffer = await fs.readFile(stampPath);
    stampBase64 = stampBuffer.toString("base64");
  } catch (err) {
    try {
      const fallbackBuffer = await fs.readFile(fallbackStampPath);
      stampBase64 = fallbackBuffer.toString("base64");
    } catch (e) {
      console.warn("Stamp not found for commission invoice");
    }
  }

  const invoiceDoc = invoice;
  const seller = invoiceDoc.sellerSnapshot || {};
  const buyer = invoiceDoc.buyerSnapshot || {};
  const totals = invoiceDoc.totalsSnapshot || {};
  const taxSnap = invoiceDoc.taxSnapshot || {};

  const isInterState = taxSnap.isInterState ?? false;
  const taxableValue = totals.taxableSubtotal !== undefined ? totals.taxableSubtotal : (totals.subtotal || 0);
  const grandTotal = totals.grandTotal || 0;

  const data = {
    logoBase64,
    stampBase64,
    invoiceNumber: invoiceDoc.invoiceNumber,
    invoiceDate: new Date(invoiceDoc.issuedAt || invoiceDoc.createdAt).toLocaleDateString("en-IN"),
    vendorOrderShortId: vendorOrder?._id ? vendorOrder._id.toString().slice(-8).toUpperCase() : null,
    vendorLegalName: buyer.name || "Vendor Partner",
    vendorTradeName: buyer.tradeName || "",
    vendorAddress: buyer.billingAddress?.street || buyer.billingAddress?.address || "",
    vendorCityState: `${buyer.billingAddress?.city ? buyer.billingAddress.city + ", " : ""}${buyer.billingAddress?.state || ""}${buyer.billingAddress?.pincode || buyer.billingAddress?.postalCode ? " - " + (buyer.billingAddress.pincode || buyer.billingAddress.postalCode) : ""}`,
    vendorGSTIN: buyer.gstin || null,
    placeOfSupply: `${buyer.billingAddress?.state || "N/A"} (State Code: ${buyer.stateCode || "N/A"})`,
    supplyType: isInterState ? "Inter-State Supply (IGST)" : "Intra-State Supply (CGST + SGST)",
    commissionRate: vendorOrder?.commissionRateAtOrder || 12,
    taxableValue: `₹${taxableValue.toFixed(2)}`,
    subtotal: `₹${taxableValue.toFixed(2)}`,
    isInterState,
    cgstAmount: `₹${(totals.cgstAmount || 0).toFixed(2)}`,
    sgstAmount: `₹${(totals.sgstAmount || 0).toFixed(2)}`,
    igstAmount: `₹${(totals.igstAmount || 0).toFixed(2)}`,
    grandTotal: `₹${grandTotal.toFixed(2)}`,
    amountInWords: numberToWordsINR(grandTotal),
    facilitatorLegalName: seller.legalName || "Siraba Organic",
  };

  const template = handlebars.compile(templateContent);
  return { html: template(data), invoiceDoc };
};

/**
 * Generate Customer Credit Note HTML (Section 34 CGST Act, 2017).
 */
const generateCreditNoteHTML = async (order, creditNoteDoc) => {
  const templatePath = path.join(
    __dirname,
    "../templates/invoices/credit-note-template.html"
  );
  const logoPath = path.join(__dirname, "../templates/invoices/logo.png");
  const stampPath = path.join(__dirname, "../templates/invoices/sirabastamp-optimized.png");
  const fallbackStampPath = path.join(__dirname, "../templates/invoices/sirabastamp.png");

  const templateContent = await fs.readFile(templatePath, "utf8");

  let logoBase64 = "";
  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = logoBuffer.toString("base64");
  } catch (error) {
    console.warn("Logo not found for credit note");
  }

  let stampBase64 = "";
  try {
    const stampBuffer = await fs.readFile(stampPath);
    stampBase64 = stampBuffer.toString("base64");
  } catch (err) {
    try {
      const fallbackBuffer = await fs.readFile(fallbackStampPath);
      stampBase64 = fallbackBuffer.toString("base64");
    } catch (e) {
      console.warn("Stamp not found for credit note");
    }
  }

  const totals = creditNoteDoc.totalsSnapshot || {};
  const seller = creditNoteDoc.sellerSnapshot || {};
  const buyer = creditNoteDoc.buyerSnapshot || {};
  const taxSnap = creditNoteDoc.taxSnapshot || {};
  const cnDetails = creditNoteDoc.creditNoteDetails || {};

  let originalInvoiceDoc = null;
  if (creditNoteDoc.originalInvoice) {
    if (typeof creditNoteDoc.originalInvoice === "object" && creditNoteDoc.originalInvoice.invoiceNumber) {
      originalInvoiceDoc = creditNoteDoc.originalInvoice;
    } else {
      try {
        const InvoiceModel = mongoose.models.Invoice || mongoose.model("Invoice");
        originalInvoiceDoc = await InvoiceModel.findById(creditNoteDoc.originalInvoice);
      } catch (err) {
        // Fallback gracefully
      }
    }
  }

  const isInterState = taxSnap.isInterState ?? false;
  const taxableSubtotal = totals.taxableSubtotal !== undefined ? totals.taxableSubtotal : totals.subtotal;
  const grandTotal = totals.grandTotal || 0;

  const buyerState = buyer.shippingAddress?.state || "";
  const buyerStateCode = buyer.stateCode || getStateCode(buyerState) || "N/A";
  const sellerStateCode = seller.stateCode || getStateCode(seller.state) || "N/A";

  const data = {
    logoBase64,
    stampBase64,
    companyName: seller.legalName || "Vendor Partner",
    tradeName: seller.tradeName && seller.tradeName !== seller.legalName ? seller.tradeName : "",
    companyAddress: seller.address || "",
    companyCityState: `${seller.city ? seller.city + ", " : ""}${seller.state || ""}${seller.postalCode ? " - " + seller.postalCode : ""}`,
    sellerStateCode,
    sellerGST: seller.gstin || null,
    facilitatorName: seller.facilitatorName || "Siraba Organic",

    creditNoteNumber: creditNoteDoc.invoiceNumber,
    creditNoteDate: new Date(creditNoteDoc.issuedAt || creditNoteDoc.createdAt).toLocaleDateString("en-IN"),
    refundReference: cnDetails.refundReference || "REF-REFUND",
    originalInvoiceNumber: originalInvoiceDoc ? originalInvoiceDoc.invoiceNumber : (cnDetails.originalInvoiceNumber || "INV-ORIGINAL"),
    originalInvoiceDate: originalInvoiceDoc ? new Date(originalInvoiceDoc.issuedAt || originalInvoiceDoc.createdAt).toLocaleDateString("en-IN") : (cnDetails.originalInvoiceDate ? new Date(cnDetails.originalInvoiceDate).toLocaleDateString("en-IN") : ""),
    masterOrderId: order?._id ? order._id.toString().slice(-8).toUpperCase() : null,

    customerName: buyer.name || "Customer",
    customerAddress: buyer.shippingAddress?.address || "N/A",
    customerCityState: `${buyer.shippingAddress?.city || "City"}, ${buyerState || ""} - ${buyer.shippingAddress?.postalCode || ""}`,
    customerPhone: buyer.phone || buyer.shippingAddress?.phone || "",
    buyerGST: buyer.gstin || null,

    placeOfSupply: `${buyerState || "N/A"} (State Code: ${buyerStateCode})`,
    supplyType: isInterState ? "Inter-State (IGST Reversal)" : "Intra-State (CGST + SGST Reversal)",
    reason: cnDetails.reason || creditNoteDoc.notes || "Customer Return / Refund",

    items: (creditNoteDoc.itemsSnapshot || []).map((item) => ({
      name: item.name,
      sku: item.sku || "",
      hsn: item.hsnCode || item.hsn || "N/A",
      quantity: item.quantity,
      taxableAmount: `₹${(item.taxableAmount || 0).toFixed(2)}`,
      taxRate: `${item.taxRate || 18}%`,
      total: `₹${(item.lineTotal || (item.taxableAmount || 0) + (item.taxAmount || 0)).toFixed(2)}`,
    })),

    taxableSubtotal: `₹${(taxableSubtotal || 0).toFixed(2)}`,
    isInterState,
    cgstAmount: `₹${(totals.cgstAmount || 0).toFixed(2)}`,
    sgstAmount: `₹${(totals.sgstAmount || 0).toFixed(2)}`,
    igstAmount: `₹${(totals.igstAmount || 0).toFixed(2)}`,
    grandTotal: `₹${grandTotal.toFixed(2)}`,
    amountInWords: numberToWordsINR(grandTotal),
  };

  const template = handlebars.compile(templateContent);
  return { html: template(data), creditNoteDoc };
};

module.exports = router;
module.exports.generateInvoiceHTML = generateInvoiceHTML;
module.exports.generateCommissionInvoiceHTML = generateCommissionInvoiceHTML;
module.exports.generateCreditNoteHTML = generateCreditNoteHTML;
module.exports.numberToWordsINR = numberToWordsINR;
