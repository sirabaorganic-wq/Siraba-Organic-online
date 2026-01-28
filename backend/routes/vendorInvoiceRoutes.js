const express = require('express');
const router = express.Router();
const VendorOrder = require('../models/VendorOrder');
const Vendor = require('../models/Vendor');
const GSTSettings = require('../models/GSTSettings');
const { protectVendor, approvedVendor } = require('../middleware/vendorMiddleware');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');

// Helper function to generate vendor invoice HTML
const generateVendorInvoiceHTML = async (vendorOrder, vendor) => {
    const templatePath = path.join(__dirname, '../templates/invoices/vendor-invoice-template.html');
    const logoPath = path.join(__dirname, '../templates/invoices/logo.png');

    // Try to read custom template first, fallback to customer template
    let templateContent;
    try {
        templateContent = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
        console.log('Custom vendor template not found, using customer template');
        const customerTemplatePath = path.join(__dirname, '../templates/invoices/invoice-template.html');
        templateContent = await fs.readFile(customerTemplatePath, 'utf8');
    }

    // Read and convert logo to base64
    let logoBase64 = '';
    try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = logoBuffer.toString('base64');
    } catch (error) {
        console.warn('Logo not found, invoice will be generated without logo');
    }

    // Get GST settings
    const gstSettings = await GSTSettings.getInstance();

    // Check if GST should be shown (for vendor invoices)
    const showGST = gstSettings.gst_enabled && vendor.claim_gst;

    // Calculate totals
    const itemsTotal = vendorOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const subtotal = vendorOrder.subtotal || itemsTotal;
    const commission = vendorOrder.platformCommission || 0;
    const netAmount = vendorOrder.netAmount || (subtotal - commission);

    // Prepare invoice data
    const invoiceData = {
        logoBase64,
        // Vendor/Seller Information
        companyName: vendor.businessName || 'Vendor',
        companyAddress: vendor.address?.street || vendor.address?.city || '',
        companyCity: `${vendor.address?.city || ''}, ${vendor.address?.state || ''} ${vendor.address?.postalCode || ''}`,
        companyEmail: vendor.email || '',
        companyPhone: vendor.phone || '',
        gstNumber: showGST ? (vendor.gstNumber || gstSettings.admin_gst_number) : 'N/A',

        // Customer Information
        customerName: vendorOrder.shippingAddress?.name || vendorOrder.customerName || 'Customer',
        customerAddress: vendorOrder.shippingAddress?.address || vendorOrder.shippingAddress?.street || 'N/A',
        customerCity: `${vendorOrder.shippingAddress?.city || 'City'}, ${vendorOrder.shippingAddress?.postalCode || '00000'}`,
        customerCountry: vendorOrder.shippingAddress?.country || 'India',
        customerPhone: vendorOrder.shippingAddress?.phone || 'N/A',

        // Invoice Details
        invoiceNumber: `VND-${vendorOrder._id.toString().slice(-8).toUpperCase()}`,
        invoiceDate: new Date(vendorOrder.createdAt).toLocaleDateString('en-IN'),
        orderId: vendorOrder._id.toString(),
        orderStatus: vendorOrder.status.toUpperCase(),

        // Items
        items: vendorOrder.items.map(item => ({
            name: item.name,
            description: item.description || 'Product from vendor',
            hsn: item.hsn || '0909',
            quantity: item.quantity,
            price: `₹${(item.price || 0).toFixed(2)}`,
            total: `₹${((item.price || 0) * item.quantity).toFixed(2)}`
        })),

        // Financial Details
        subtotal: `₹${subtotal.toFixed(2)}`,
        platformCommission: `₹${commission.toFixed(2)}`,
        tax: vendorOrder.taxAmount ? `₹${vendorOrder.taxAmount.toFixed(2)}` : '₹0.00',
        shipping: vendorOrder.shippingCost ? `₹${vendorOrder.shippingCost.toFixed(2)}` : 'Free',
        grandTotal: `₹${netAmount.toFixed(2)}`,

        // Additional Info
        paymentStatus: vendorOrder.paymentStatus || 'pending',
        trackingNumber: vendorOrder.trackingNumber || 'Not available',
        shippingCarrier: vendorOrder.shippingCarrier || 'To be assigned',

        // Vendor Specific
        isVendorInvoice: true,
        commissionRate: vendor.subscription?.plan?.commission || vendor.commissionRate || 0,

        // GST Information (conditional)
        showGST: gstSettings.gst_enabled,
        // For Vendor Invoice: Seller is the Vendor. 
        sellerGST: gstSettings.gst_enabled ? (vendor.gstNumber || gstSettings.admin_gst_number) : null,
        // Vendor invoices are usually B2C or B2B where Vendor is seller. 
        // If Vendor claims GST (which they should if they have GST number), show it.
        // Actually, for "Vendor Invoice" (Platform -> Vendor commission), Platform is seller, Vendor is buyer.
        // But the previous template logic suggests this invoice is "Vendor -> Customer".
        // If it is Vendor -> Customer invoice:
        // Seller = Vendor
        // Buyer = Customer (order.user)
        // I need to fetch customer logic if I want Buyer GST here. 
        // However, this route is distinct. Let's strictly force SellerGST.
        buyerGST: null, // Vendor invoice route currently doesn't fetch User GST deeply often. Assume B2C for now or just Seller GST.

        gstPercentage: gstSettings.gst_enabled ? gstSettings.default_gst_percentage : null,
        gstAmount: gstSettings.gst_enabled ? `₹${(vendorOrder.taxAmount || 0).toFixed(2)}` : null
    };

    // Compile template with Handlebars
    const template = handlebars.compile(templateContent);
    return template(invoiceData);
};

// @desc    Get vendor invoice HTML preview
// @route   GET /api/vendors/invoices/:orderId/preview
// @access  Private/Vendor
router.get('/:orderId/preview', protectVendor, approvedVendor, async (req, res) => {
    try {
        const vendorOrder = await VendorOrder.findOne({
            _id: req.params.orderId,
            vendor: req.vendor._id
        }).populate('items.product');

        if (!vendorOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const vendor = await Vendor.findById(req.vendor._id);
        const html = await generateVendorInvoiceHTML(vendorOrder, vendor);

        res.send(html);
    } catch (error) {
        console.error('Vendor invoice preview error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Download vendor invoice as PDF
// @route   GET /api/vendors/invoices/:orderId/download
// @access  Private/Vendor
router.get('/:orderId/download', protectVendor, approvedVendor, async (req, res) => {
    let browser;
    try {
        const vendorOrder = await VendorOrder.findOne({
            _id: req.params.orderId,
            vendor: req.vendor._id
        }).populate('items.product');

        if (!vendorOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const vendor = await Vendor.findById(req.vendor._id);
        const html = await generateVendorInvoiceHTML(vendorOrder, vendor);

        // Generate PDF
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            },
            preferCSSPageSize: true
        });

        await browser.close();

        // Set response headers for PDF download
        const invoiceNumber = `VND-${vendorOrder._id.toString().slice(-8).toUpperCase()}`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Vendor-Invoice-${invoiceNumber}.pdf`);
        res.send(pdf);

    } catch (error) {
        console.error('Vendor invoice download error:', error);
        if (browser) await browser.close();
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all vendor invoices (list)
// @route   GET /api/vendors/invoices
// @access  Private/Vendor
router.get('/', protectVendor, approvedVendor, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const query = { vendor: req.vendor._id };
        if (status) query.status = status;

        const orders = await VendorOrder.find(query)
            .select('_id createdAt status subtotal platformCommission netAmount paymentStatus items')
            .populate('items.product', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await VendorOrder.countDocuments(query);

        const invoices = orders.map(order => ({
            _id: order._id,
            invoiceNumber: `VND-${order._id.toString().slice(-8).toUpperCase()}`,
            date: order.createdAt,
            status: order.status,
            subtotal: order.subtotal,
            commission: order.platformCommission,
            netAmount: order.netAmount,
            paymentStatus: order.paymentStatus,
            itemsCount: order.items.length
        }));

        res.json({
            invoices,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Vendor invoices list error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get vendor invoice summary/stats
// @route   GET /api/vendors/invoices/stats
// @access  Private/Vendor
router.get('/stats', protectVendor, approvedVendor, async (req, res) => {
    try {
        const vendorId = req.vendor._id;

        // Get all vendor orders
        const orders = await VendorOrder.find({ vendor: vendorId });

        const stats = {
            totalInvoices: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.subtotal || 0), 0),
            totalCommission: orders.reduce((sum, order) => sum + (order.platformCommission || 0), 0),
            totalNetAmount: orders.reduce((sum, order) => sum + (order.netAmount || 0), 0),
            pendingPayments: orders.filter(o => o.paymentStatus === 'pending').length,
            paidInvoices: orders.filter(o => o.paymentStatus === 'paid').length,
            statusBreakdown: {
                pending: orders.filter(o => o.status === 'pending').length,
                confirmed: orders.filter(o => o.status === 'confirmed').length,
                processing: orders.filter(o => o.status === 'processing').length,
                shipped: orders.filter(o => o.status === 'shipped').length,
                delivered: orders.filter(o => o.status === 'delivered').length,
                cancelled: orders.filter(o => o.status === 'cancelled').length,
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Vendor invoice stats error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
