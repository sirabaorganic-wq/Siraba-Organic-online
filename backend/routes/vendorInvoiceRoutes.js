const express = require('express');
const router = express.Router();
const VendorOrder = require('../models/VendorOrder');
const Vendor = require('../models/Vendor');
const Invoice = require('../models/Invoice');
const { getOrCreateVendorInvoice } = require('../services/invoiceService');
const { protectVendor, approvedVendor } = require('../middleware/vendorMiddleware');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const {
    renderHtmlToPdf,
    buildPureJsPdf,
    htmlToTextBlocks,
} = require('../utils/puppeteerHelper');

// Helper function to generate vendor invoice HTML from snapshot
const generateVendorInvoiceHTML = async (vendorOrder, vendor, invoice) => {
    const templatePath = path.join(__dirname, '../templates/invoices/vendor-invoice-template.html');
    const logoPath = path.join(__dirname, '../templates/invoices/logo.png');
    const stampPath = path.join(__dirname, '../templates/invoices/sirabastamp.png');

    const templateContent = await fs.readFile(templatePath, 'utf8');

    // Read and convert logo to base64
    let logoBase64 = '';
    try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = logoBuffer.toString('base64');
    } catch (error) {
        console.warn('Logo not found, invoice will be generated without logo');
    }

    // Read and convert official Siraba stamp to base64
    let stampBase64 = '';
    try {
        const stampBuffer = await fs.readFile(stampPath);
        stampBase64 = stampBuffer.toString('base64');
    } catch (error) {
        console.warn('Stamp not found, invoice will be generated without stamp');
    }

    // Ensure persistent invoice exists
    const invoiceDoc = invoice || (await getOrCreateVendorInvoice(vendorOrder._id));

    const totals = invoiceDoc.totalsSnapshot || {};
    const seller = invoiceDoc.sellerSnapshot || {};
    const buyer = invoiceDoc.buyerSnapshot || {};

    const subtotal = totals.subtotal || vendorOrder.subtotal || 0;
    const commission = totals.commissionAmount !== undefined ? totals.commissionAmount : (vendorOrder.commission || 0);
    const commissionRate = totals.commissionRate !== undefined ? totals.commissionRate : (vendorOrder.commissionRateAtOrder || vendor?.commissionRate || 10);
    const tax = totals.taxPrice !== undefined ? totals.taxPrice : (vendorOrder.tax || 0);
    const customerShipping = totals.shippingPrice !== undefined ? totals.shippingPrice : (vendorOrder.customerShippingCharge || 0);
    const netAmount = totals.netPayoutAmount !== undefined ? totals.netPayoutAmount : (vendorOrder.netAmount !== undefined ? vendorOrder.netAmount : (subtotal - commission));

    const invoiceData = {
        logoBase64,
        stampBase64,
        companyName: seller.legalName || vendor?.businessName || 'Vendor Partner',
        companyAddress: seller.address || '',
        companyCity: seller.city ? `${seller.city}${seller.state ? ', ' + seller.state : ''} ${seller.postalCode || ''}` : '',
        companyEmail: seller.email || vendor?.email || '',
        companyPhone: seller.phone || vendor?.phone || '',
        sellerGST: seller.gstin || vendor?.gstNumber || null,

        // Customer Destination
        customerName: buyer.name || vendorOrder.shippingAddress?.name || 'Customer',
        customerAddress: buyer.shippingAddress?.address || vendorOrder.shippingAddress?.address || 'N/A',
        customerCity: `${buyer.shippingAddress?.city || vendorOrder.shippingAddress?.city || 'City'}, ${buyer.shippingAddress?.postalCode || vendorOrder.shippingAddress?.postalCode || '00000'}`,
        customerCountry: buyer.shippingAddress?.country || vendorOrder.shippingAddress?.country || 'India',
        customerPhone: buyer.shippingAddress?.phone || vendorOrder.shippingAddress?.phone || '',

        // Document Details
        invoiceNumber: invoiceDoc.invoiceNumber,
        invoiceDate: new Date(invoiceDoc.issuedAt).toLocaleDateString('en-IN'),
        vendorOrderId: vendorOrder._id.toString(),
        orderId: vendorOrder.order?._id ? vendorOrder.order._id.toString() : (vendorOrder.order ? vendorOrder.order.toString() : 'N/A'),
        vendorOrderNumber: vendorOrder._id.toString().slice(-8).toUpperCase(),
        orderNumber: vendorOrder.order?._id ? vendorOrder.order._id.toString().slice(-8).toUpperCase() : 'N/A',
        orderStatus: (vendorOrder.status || 'pending').toUpperCase(),
        paymentStatus: (vendorOrder.payoutStatus || 'pending').toUpperCase(),
        shippingCarrier: vendorOrder.shippingCarrier || vendorOrder.courierName || 'Shiprocket Designated',
        trackingNumber: vendorOrder.trackingNumber || vendorOrder.awbCode || null,

        // Items
        items: (invoiceDoc.itemsSnapshot || vendorOrder.items || []).map(item => ({
            name: item.name,
            sku: item.sku || '',
            hsn: item.hsn || '',
            quantity: item.quantity,
            price: `₹${(item.unitPrice || item.price || 0).toFixed(2)}`,
            total: `₹${(item.lineTotal || ((item.price || 0) * item.quantity)).toFixed(2)}`
        })),

        // Financial Settlement Details
        subtotal: `₹${subtotal.toFixed(2)}`,
        commissionRate,
        platformCommission: `₹${commission.toFixed(2)}`,
        tax: tax > 0 ? `₹${tax.toFixed(2)}` : null,
        shipping: customerShipping > 0 ? `₹${customerShipping.toFixed(2)}` : '₹0.00',
        netAmount: `₹${netAmount.toFixed(2)}`,
        grandTotal: `₹${netAmount.toFixed(2)}`, // Net payout labeled as NET VENDOR PAYOUT in template
    };

    const template = handlebars.compile(templateContent);
    return { html: template(invoiceData), invoiceDoc };
};

// @desc    Get vendor invoice HTML preview
// @route   GET /api/vendors/invoices/:orderId/preview
// @access  Private/Vendor or Admin
router.get('/:orderId/preview', protectVendor, approvedVendor, async (req, res) => {
    try {
        const query = { _id: req.params.orderId };
        if (!req.isAdmin) {
            query.vendor = req.vendor._id;
        }

        const vendorOrder = await VendorOrder.findOne(query).populate('items.product').populate('order');
        if (!vendorOrder) {
            return res.status(404).json({ message: 'Vendor order not found' });
        }

        const vendor = await Vendor.findById(vendorOrder.vendor);
        const { html } = await generateVendorInvoiceHTML(vendorOrder, vendor);

        res.send(html);
    } catch (error) {
        console.error('Vendor invoice preview error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Download vendor invoice as PDF
// @route   GET /api/vendors/invoices/:orderId/download
// @access  Private/Vendor or Admin
router.get('/:orderId/download', protectVendor, approvedVendor, async (req, res) => {
    try {
        const query = { _id: req.params.orderId };
        if (!req.isAdmin) {
            query.vendor = req.vendor._id;
        }

        const vendorOrder = await VendorOrder.findOne(query).populate('items.product').populate('order');
        if (!vendorOrder) {
            return res.status(404).json({ message: 'Vendor order not found' });
        }

        const vendor = await Vendor.findById(vendorOrder.vendor);
        const { html, invoiceDoc } = await generateVendorInvoiceHTML(vendorOrder, vendor);

        let pdf;
        try {
            pdf = await renderHtmlToPdf(html);
        } catch (launchErr) {
            console.warn(`[vendorInvoiceRoutes] Puppeteer render failed (${launchErr.message}). Generating fallback PDF...`);
            const textBlocks = htmlToTextBlocks(html, `VENDOR SETTLEMENT #${invoiceDoc.invoiceNumber}`);
            pdf = buildPureJsPdf(`VENDOR SETTLEMENT #${invoiceDoc.invoiceNumber}`, textBlocks);
        }

        const safeFilenameNumber = invoiceDoc.invoiceNumber.replace(/[\/\\:]/g, '-');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Vendor-Statement-${safeFilenameNumber}.pdf`);
        res.send(pdf);

    } catch (error) {
        console.error('Vendor invoice download error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all vendor invoices (list)
// @route   GET /api/vendors/invoices
// @access  Private/Vendor or Admin
router.get('/', protectVendor, approvedVendor, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const query = {};
        if (!req.isAdmin) {
            query.vendor = req.vendor._id;
        } else if (req.query.vendorId) {
            query.vendor = req.query.vendorId;
        }

        if (status) query.status = status;

        const orders = await VendorOrder.find(query)
            .select('_id createdAt status subtotal commission netAmount payoutStatus items')
            .populate('items.product', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await VendorOrder.countDocuments(query);

        // Fetch or create persistent invoice records for each
        const invoices = await Promise.all(
            orders.map(async (order) => {
                let invoice = await Invoice.findOne({
                    invoiceType: 'VENDOR_SETTLEMENT_STATEMENT',
                    vendorOrder: order._id,
                });

                if (!invoice) {
                    try {
                        invoice = await getOrCreateVendorInvoice(order._id);
                    } catch (e) {
                        // Fallback formatting if generation deferred
                    }
                }

                return {
                    _id: order._id,
                    invoiceNumber: invoice ? invoice.invoiceNumber : `VND-${order._id.toString().slice(-8).toUpperCase()}`,
                    date: order.createdAt,
                    status: order.status,
                    subtotal: order.subtotal,
                    commission: order.commission,
                    netAmount: order.netAmount,
                    paymentStatus: order.payoutStatus || 'pending',
                    itemsCount: order.items.length,
                };
            })
        );

        res.json({
            invoices,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error('Vendor invoices list error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get vendor invoice summary/stats
// @route   GET /api/vendors/invoices/stats
// @access  Private/Vendor or Admin
router.get('/stats', protectVendor, approvedVendor, async (req, res) => {
    try {
        const query = {};
        if (!req.isAdmin) {
            query.vendor = req.vendor._id;
        } else if (req.query.vendorId) {
            query.vendor = req.query.vendorId;
        }

        const orders = await VendorOrder.find(query);

        const stats = {
            totalInvoices: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.subtotal || 0), 0),
            totalCommission: orders.reduce((sum, order) => sum + (order.commission || 0), 0),
            totalNetAmount: orders.reduce((sum, order) => sum + (order.netAmount || 0), 0),
            pendingPayments: orders.filter(o => o.payoutStatus === 'pending').length,
            paidInvoices: orders.filter(o => o.payoutStatus === 'completed').length,
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
