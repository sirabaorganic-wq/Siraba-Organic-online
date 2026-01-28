const express = require('express');
const router = express.Router();
const GSTSettings = require('../models/GSTSettings');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/authMiddleware');
const { protectVendor } = require('../middleware/vendorMiddleware');

/**
 * Public GST Settings Routes
 * For users to check if GST is enabled and get GST info
 */

// @desc    Get public GST settings (for everyone)
// @route   GET /api/gst/settings
// @access  Public
router.get('/settings', async (req, res) => {
    try {
        const settings = await GSTSettings.getInstance();

        // Return only public info
        res.json({
            gst_enabled: settings.gst_enabled,
            default_gst_percentage: settings.default_gst_percentage,
            admin_gst_number: settings.gst_enabled ? settings.admin_gst_number : null,
            company_name: settings.company_name
        });
    } catch (error) {
        console.error('Error fetching public GST settings:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user GST claim status
// @route   PUT /api/gst/claim/user
// @access  Private (User)
router.put('/claim/user', protect, async (req, res) => {
    try {
        const { claim_gst, user_gst_number } = req.body;

        if (claim_gst === undefined) {
            return res.status(400).json({ message: 'claim_gst field is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.claim_gst = claim_gst;
        if (claim_gst) {
            user.gst_claimed_at = new Date();
            // Save user's GST number if provided
            if (user_gst_number) {
                user.user_gst_number = user_gst_number;
            }
        } else {
            // Clear GST number if unclaiming
            user.user_gst_number = undefined;
        }

        await user.save();

        res.json({
            success: true,
            message: `GST ${claim_gst ? 'claimed' : 'unclaimed'} successfully`,
            claim_gst: user.claim_gst,
            gst_claimed_at: user.gst_claimed_at,
            user_gst_number: user.user_gst_number
        });
    } catch (error) {
        console.error('Error updating user GST claim:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update vendor GST claim status
// @route   PUT /api/gst/claim/vendor
// @access  Private (Vendor)
router.put('/claim/vendor', protectVendor, async (req, res) => {
    try {
        const { claim_gst } = req.body;

        if (claim_gst === undefined) {
            return res.status(400).json({ message: 'claim_gst field is required' });
        }

        const vendor = await Vendor.findById(req.vendor._id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        vendor.claim_gst = claim_gst;
        if (claim_gst) {
            vendor.gst_claimed_at = new Date();
        }

        await vendor.save();

        res.json({
            success: true,
            message: `GST ${claim_gst ? 'claimed' : 'unclaimed'} successfully`,
            claim_gst: vendor.claim_gst,
            gst_claimed_at: vendor.gst_claimed_at
        });
    } catch (error) {
        console.error('Error updating vendor GST claim:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user's GST claim status
// @route   GET /api/gst/claim/user
// @access  Private (User)
router.get('/claim/user', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('claim_gst gst_claimed_at user_gst_number');
        res.json({
            claim_gst: user.claim_gst || false,
            gst_claimed_at: user.gst_claimed_at,
            user_gst_number: user.user_gst_number
        });
    } catch (error) {
        console.error('Error fetching user GST claim:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get vendor's GST claim status
// @route   GET /api/gst/claim/vendor
// @access  Private (Vendor)
router.get('/claim/vendor', protectVendor, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor._id).select('claim_gst gst_claimed_at gstNumber');
        res.json({
            claim_gst: vendor.claim_gst || false,
            gst_claimed_at: vendor.gst_claimed_at,
            gstNumber: vendor.gstNumber
        });
    } catch (error) {
        console.error('Error fetching vendor GST claim:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
