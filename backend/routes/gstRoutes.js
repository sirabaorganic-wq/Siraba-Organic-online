const express = require('express');
const router = express.Router();
const GSTSettings = require('../models/GSTSettings');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * GST Settings Management Routes (Admin Only)
 */

// @desc    Get GST settings
// @route   GET /api/admin/gst-settings
// @access  Private/Admin
router.get('/gst-settings', protect, admin, async (req, res) => {
    try {
        const settings = await GSTSettings.getInstance();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching GST settings:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update GST settings
// @route   PUT /api/admin/gst-settings
// @access  Private/Admin
router.put('/gst-settings', protect, admin, async (req, res) => {
    try {
        const {
            gst_enabled,
            default_gst_percentage,
            admin_gst_number,
            company_name,
            company_address,
            category_gst_rates
        } = req.body;

        const settings = await GSTSettings.getInstance();

        // Update fields if provided
        if (gst_enabled !== undefined) settings.gst_enabled = gst_enabled;
        if (default_gst_percentage !== undefined) {
            if (default_gst_percentage < 0 || default_gst_percentage > 100) {
                return res.status(400).json({ message: 'GST percentage must be between 0 and 100' });
            }
            settings.default_gst_percentage = default_gst_percentage;
        }
        if (admin_gst_number !== undefined) settings.admin_gst_number = admin_gst_number;
        if (company_name) settings.company_name = company_name;
        if (company_address) settings.company_address = company_address;
        if (category_gst_rates) settings.category_gst_rates = category_gst_rates;

        // Track who updated
        settings.last_updated_by = req.user._id;
        settings.last_updated_at = new Date();

        await settings.save();

        res.json({
            success: true,
            message: 'GST settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Error updating GST settings:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle GST globally
// @route   POST /api/admin/gst-settings/toggle
// @access  Private/Admin
router.post('/gst-settings/toggle', protect, admin, async (req, res) => {
    try {
        const settings = await GSTSettings.getInstance();
        settings.gst_enabled = !settings.gst_enabled;
        settings.last_updated_by = req.user._id;
        settings.last_updated_at = new Date();

        await settings.save();

        res.json({
            success: true,
            message: `GST ${settings.gst_enabled ? 'enabled' : 'disabled'} successfully`,
            gst_enabled: settings.gst_enabled
        });
    } catch (error) {
        console.error('Error toggling GST:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add category-specific GST rate
// @route   POST /api/admin/gst-settings/category-rate
// @access  Private/Admin
router.post('/gst-settings/category-rate', protect, admin, async (req, res) => {
    try {
        const { category, gst_percentage } = req.body;

        if (!category || gst_percentage === undefined) {
            return res.status(400).json({ message: 'Category and GST percentage are required' });
        }

        const settings = await GSTSettings.getInstance();

        // Remove existing rate for this category if any
        settings.category_gst_rates = settings.category_gst_rates.filter(
            rate => rate.category !== category
        );

        // Add new rate
        settings.category_gst_rates.push({ category, gst_percentage });
        settings.last_updated_by = req.user._id;
        settings.last_updated_at = new Date();

        await settings.save();

        res.json({
            success: true,
            message: 'Category GST rate added successfully',
            category_gst_rates: settings.category_gst_rates
        });
    } catch (error) {
        console.error('Error adding category GST rate:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete category-specific GST rate
// @route   DELETE /api/admin/gst-settings/category-rate/:category
// @access  Private/Admin
router.delete('/gst-settings/category-rate/:category', protect, admin, async (req, res) => {
    try {
        const { category } = req.params;
        const settings = await GSTSettings.getInstance();

        settings.category_gst_rates = settings.category_gst_rates.filter(
            rate => rate.category !== category
        );

        settings.last_updated_by = req.user._id;
        settings.last_updated_at = new Date();

        await settings.save();

        res.json({
            success: true,
            message: 'Category GST rate removed successfully',
            category_gst_rates: settings.category_gst_rates
        });
    } catch (error) {
        console.error('Error removing category GST rate:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
