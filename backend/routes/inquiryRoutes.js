const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Create new inquiry
// @route   POST /api/inquiries
// @access  Public
router.post('/', async (req, res) => {
    try {
        const inquiry = await Inquiry.create(req.body);
        res.status(201).json(inquiry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const inquiries = await Inquiry.find({}).sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update inquiry status
// @route   PUT /api/inquiries/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id);
        if (inquiry) {
            inquiry.status = req.body.status || inquiry.status;
            const updated = await inquiry.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Inquiry not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id);
        if (inquiry) {
            await inquiry.deleteOne();
            res.json({ message: 'Inquiry removed' });
        } else {
            res.status(404).json({ message: 'Inquiry not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
