const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const GSTSettings = require("../models/GSTSettings");
const { protect } = require("../middleware/authMiddleware");
const fs = require("fs").promises;
const path = require("path");
const handlebars = require("handlebars");
const puppeteer = require("puppeteer");

// Helper function to generate invoice HTML
const generateInvoiceHTML = async (order) => {
  const templatePath = path.join(
    __dirname,
    "../templates/invoices/invoice-template.html",
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

  // Get GST settings
  const gstSettings = await GSTSettings.getInstance();

  // Populate user if not already populated
  if (!order.populated("user")) {
    await order.populate("user");
  }

  // Prepare invoice data with proper fallbacks
  const shippingPrice = order.shippingPrice || 0;
  const totalPrice = order.totalPrice || 0;

  // Get vendor GSTIN (required for Indian invoices)
  const vendorGSTIN =
    order.sellerGstNumber || gstSettings.admin_gst_number || null;

  // GST should ALWAYS be shown on Indian invoices when vendor has GSTIN
  // This is required by Indian GST law
  const showGST = !!vendorGSTIN;

  // Buyer GSTIN - only shown when explicitly claimed
  const buyerGSTIN =
    order.gstClaimed && order.buyerGstNumber ? order.buyerGstNumber : null;

  const invoiceData = {
    logoBase64,
    companyName: "Siraba Organic",
    companyAddress: "123 Saffron Valley, Pampore",
    companyCity: "Kashmir, India 192121",
    companyEmail: "info@sirabaorganic.com",
    companyPhone: "+91 99066 93633",
    customerName: order.shippingAddress?.name || order.user?.name || "Customer",
    customerAddress: order.shippingAddress?.address || "N/A",
    customerCity: `${order.shippingAddress?.city || "City"}, ${order.shippingAddress?.postalCode || "00000"}`,
    customerCountry: order.shippingAddress?.country || "Country",
    customerPhone: order.shippingAddress?.phone || "N/A",
    invoiceNumber: `#${order._id.toString().slice(-8).toUpperCase()}`,
    invoiceDate: new Date(order.createdAt).toLocaleDateString("en-IN"),
    orderId: order._id.toString(),
    orderStatus: order.status.toUpperCase(),
    items: order.orderItems.map((item) => ({
      name: item.name,
      description: item.description || "Premium Organic Selection",
      hsn: item.hsn || "0909", // HSN code for spices (saffron and spices)
      quantity: item.quantity,
      price: `₹${(item.price || 0).toFixed(2)}`,
      total: `₹${((item.price || 0) * item.quantity).toFixed(2)}`,
    })),
    subtotal: `₹${(order.itemsPrice || 0).toFixed(2)}`,
    tax: `₹${(order.taxPrice || 0).toFixed(2)}`,
    shipping: shippingPrice > 0 ? `₹${shippingPrice.toFixed(2)}` : "Free",
    grandTotal: `₹${(order.totalPrice || 0).toFixed(2)}`,

    // GST Information (Required for Indian Tax Compliance)
    // Vendor GSTIN - ALWAYS shown when available (required by law)
    sellerGST: vendorGSTIN,

    // Buyer GSTIN - Only shown when GST is claimed by buyer
    buyerGST: buyerGSTIN,

    // Show GST section - Always true for Indian invoices with vendor GSTIN
    showGST: showGST,

    // GST calculation details
    gstPercentage: gstSettings.default_gst_percentage || 18,
    gstAmount: `₹${(order.taxPrice || 0).toFixed(2)}`,

    // GST claim status - true only if buyer provided GSTIN
    gstClaimed: !!buyerGSTIN,
  };

  // Compile template with Handlebars
  const template = handlebars.compile(templateContent);
  return template(invoiceData);
};

// @desc    Get invoice HTML preview
// @route   GET /api/invoices/:orderId/preview
// @access  Private
router.get("/:orderId/preview", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "user",
      "name email",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order or is admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this invoice" });
    }

    const html = await generateInvoiceHTML(order);
    res.send(html);
  } catch (error) {
    console.error("Invoice preview error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Download invoice as PDF
// @route   GET /api/invoices/:orderId/download
// @access  Private
router.get("/:orderId/download", protect, async (req, res) => {
  let browser;
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "user",
      "name email",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order or is admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to download this invoice" });
    }

    const html = await generateInvoiceHTML(order);

    // Generate PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
      preferCSSPageSize: true,
    });

    await browser.close();

    // Set response headers for PDF download
    const invoiceNumber = order._id.toString().slice(-8).toUpperCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${invoiceNumber}.pdf`,
    );
    res.send(pdf);
  } catch (error) {
    console.error("Invoice download error:", error);
    if (browser) await browser.close();
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
