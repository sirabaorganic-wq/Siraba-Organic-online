const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protectVendor } = require('../middleware/vendorMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  getVendorNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/vendorNotificationController');

// @desc    Get my notifications (Vendor)
// @route   GET /api/notifications/vendor
// @access  Private/Vendor
router.get('/vendor', protectVendor, getVendorNotifications);

// @desc    Get unread notification count (Vendor)
// @route   GET /api/notifications/vendor/unread-count
// @access  Private/Vendor
router.get('/vendor/unread-count', protectVendor, getUnreadCount);

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

// @desc    Mark notification as read (Vendor-scoped if vendor token, else general)
// @route   PATCH /api/notifications/:id/read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.patch('/:id/read', protectVendor, markNotificationAsRead);
router.put('/:id/read', protectVendor, markNotificationAsRead);

// @desc    Mark all as read (Vendor)
// @route   PATCH /api/notifications/vendor/read-all
// @route   PUT /api/notifications/vendor/read-all
// @access  Private/Vendor
router.patch('/vendor/read-all', protectVendor, markAllNotificationsAsRead);
router.put('/vendor/read-all', protectVendor, markAllNotificationsAsRead);

module.exports = router;

