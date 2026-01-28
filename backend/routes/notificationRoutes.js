const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protectVendor } = require('../middleware/vendorMiddleware');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get my notifications (Vendor)
// @route   GET /api/notifications/vendor
// @access  Private/Vendor
router.get('/vendor', protectVendor, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.vendor._id,
            recipientModel: 'Vendor'
        }).sort({ createdAt: -1 }).limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get my notifications (User/Admin)
// @route   GET /api/notifications/user
// @access  Private/User
router.get('/user', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id,
            recipientModel: 'User'
        }).sort({ createdAt: -1 }).limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification) {
            notification.isRead = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Mark all as read (Vendor)
// @route   PUT /api/notifications/vendor/read-all
// @access  Private/Vendor
router.put('/vendor/read-all', protectVendor, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.vendor._id, recipientModel: 'Vendor', isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
