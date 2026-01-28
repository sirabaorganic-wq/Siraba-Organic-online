const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/authMiddleware');


router.post('/', protect, admin, async (req, res) => {
    try {
        const { code, discountType, discountValue, assignedTo, expiryDate, maxUses } = req.body;

        const couponExists = await Coupon.findOne({ code });
        if (couponExists) {
            return res.status(400).json({ message: 'Coupon already exists' });
        }

        const coupon = await Coupon.create({
            code,
            discountType,
            discountValue,
            assignedTo: assignedTo || null,
            expiryDate,
            maxUses: maxUses || 1
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const coupons = await Coupon.find({}).populate('assignedTo', 'name email');
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (coupon) {
            await coupon.deleteOne();
            res.json({ message: 'Coupon removed' });
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get available coupons for the logged-in user
// @route   GET /api/coupons/available
// @access  Private
router.get('/available', protect, async (req, res) => {
    try {
        const currentDate = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            $or: [
                { expiryDate: { $gt: currentDate } },
                { expiryDate: null }
            ],
            $or: [
                { assignedTo: null },
                { assignedTo: req.user._id }
            ]
        });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Validate and Apply Coupon
// @route   POST /api/coupons/validate
// @access  Private
router.post('/validate', protect, async (req, res) => {
    try {
        const { code } = req.body;
        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ message: 'Coupon is inactive' });
        }

        if (coupon.expiryDate && new Date() > coupon.expiryDate) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Check user assignment
        if (coupon.assignedTo && coupon.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'This coupon is not valid for your account' });
        }

        res.json({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
