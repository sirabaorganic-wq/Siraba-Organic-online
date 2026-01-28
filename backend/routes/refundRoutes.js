const express = require('express');
const router = express.Router();
const RefundLog = require('../models/RefundLog');
const { protect, admin } = require('../middleware/authMiddleware');
const { protectVendor, approvedVendor } = require('../middleware/vendorMiddleware');

// @desc    Get User Refund Logs
// @route   GET /api/refunds/my-logs
// @access  Private
router.get('/my-logs', protect, async (req, res) => {
    try {
        const logs = await RefundLog.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('order', '_id totalPrice status');
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Vendor Refund Logs
// @route   GET /api/refunds/vendor-logs
// @access  Private/Vendor
router.get('/vendor-logs', protectVendor, approvedVendor, async (req, res) => {
    try {
        // Find logs where the vendor was the actor (initiated return) 
        // OR where a VendorOrder associated with this vendor was involved (if we tracked vendorOrder in RefundLog)
        // Since we added `vendorOrder` to RefundLog in previous step, we can use it.
        // We also need to populate to check strict association if needed.

        const logs = await RefundLog.find({
            $or: [
                { actorId: req.vendor._id }, // Initiated by this vendor
                // We might want to see refunds for our products initiated by Admin/User too?
                // For now, let's stick to explicit vendor involvement or implicit via VendorOrder linkage
            ]
        })
            .populate('vendorOrder')
            // Filter purely by vendor ownership if needed, but actorId is safe for "Activity Log"
            .sort({ createdAt: -1 });

        // If we want ALL refunds involving this vendor's orders (even if Admin refunded), 
        // we'd need to look up VendorOrders first or rely on population.
        // For simplicity, let's stick to Actor = Vendor OR specifically assigned VendorOrder

        // Revised Query:
        const refinedLogs = await RefundLog.find({
            $or: [
                { actorId: req.vendor._id },
                { vendorOrder: { $in: await getVendorOrderIds(req.vendor._id) } }
            ]
        }).sort({ createdAt: -1 }).populate('order', '_id');

        res.json(refinedLogs);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper to get all VendorOrder IDs
async function getVendorOrderIds(vendorId) {
    const VendorOrder = require('../models/VendorOrder');
    const orders = await VendorOrder.find({ vendor: vendorId }).select('_id');
    return orders.map(o => o._id);
}

// @desc    Get All Refund Logs (Admin)
// @route   GET /api/refunds/admin-logs
// @access  Private/Admin
router.get('/admin-logs', protect, admin, async (req, res) => {
    try {
        const logs = await RefundLog.find({})
            .populate('user', 'name email')
            .populate('order', '_id')
            .sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
