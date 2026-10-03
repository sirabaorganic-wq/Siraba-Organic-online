/**
 * SIRABA ORGANIC — VENDOR NOTIFICATION CONTROLLER
 * Multi-tenant safe, strictly authorized controller for vendor notification queries and read-state updates.
 */

'use strict';

const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for authenticated vendor
 * @route   GET /api/vendors/notifications
 * @route   GET /api/notifications/vendor
 * @access  Private/Vendor (req.vendor._id required)
 */
const getVendorNotifications = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    // Strict multi-tenant vendor filter
    const filter = {
      $or: [
        { vendor: vendorId },
        { recipient: vendorId, recipientModel: 'Vendor' },
      ],
    };

    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('vendorOrder', 'status awbCode courierName subtotal netAmount')
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        $or: [
          { vendor: vendorId },
          { recipient: vendorId, recipientModel: 'Vendor' },
        ],
        isRead: false,
      }),
    ]);

    // If caller is legacy frontend expecting direct array
    if (req.query.format === 'array' || req.originalUrl.includes('/notifications/vendor')) {
      return res.json(notifications);
    }

    res.json({
      success: true,
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('[VendorNotificationController] getVendorNotifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: error.message });
  }
};

/**
 * @desc    Get unread notification count for authenticated vendor
 * @route   GET /api/vendors/notifications/unread-count
 * @access  Private/Vendor
 */
const getUnreadCount = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const unreadCount = await Notification.countDocuments({
      $or: [
        { vendor: vendorId },
        { recipient: vendorId, recipientModel: 'Vendor' },
      ],
      isRead: false,
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('[VendorNotificationController] getUnreadCount error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve unread count', error: error.message });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/vendors/notifications/:id/read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private/Vendor (Strict tenant isolation)
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor ? String(req.vendor._id) : (req.user ? String(req.user._id) : null);

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Multi-tenant authorization check: Must belong to caller
    const notificationOwner = String(notification.vendor || notification.recipient || '');
    if (notificationOwner !== vendorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this notification',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('[VendorNotificationController] markNotificationAsRead error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
  }
};

/**
 * @desc    Mark all notifications as read for authenticated vendor
 * @route   PATCH /api/vendors/notifications/read-all
 * @route   PUT /api/vendors/notifications/read-all
 * @route   PUT /api/notifications/vendor/read-all
 * @access  Private/Vendor
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const result = await Notification.updateMany(
      {
        $or: [
          { vendor: vendorId },
          { recipient: vendorId, recipientModel: 'Vendor' },
        ],
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('[VendorNotificationController] markAllNotificationsAsRead error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read', error: error.message });
  }
};

module.exports = {
  getVendorNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
