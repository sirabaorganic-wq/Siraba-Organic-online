/**
 * SIRABA ORGANIC — VENDOR NOTIFICATION ROUTES
 * Mount point: /api/vendors/notifications
 * Enforces vendor JWT authentication on every endpoint.
 */

'use strict';

const express = require('express');
const router = express.Router();
const { protectVendor } = require('../middleware/vendorMiddleware');
const {
  getVendorNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/vendorNotificationController');

// All routes require authenticated vendor
router.use(protectVendor);

// Notification retrieval & unread count
router.get('/', getVendorNotifications);
router.get('/unread-count', getUnreadCount);

// Single notification read
router.patch('/:id/read', markNotificationAsRead);
router.put('/:id/read', markNotificationAsRead);

// Mark all read
router.patch('/read-all', markAllNotificationsAsRead);
router.put('/read-all', markAllNotificationsAsRead);

module.exports = router;
