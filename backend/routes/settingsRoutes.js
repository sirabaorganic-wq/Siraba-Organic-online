const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');

// @desc    Get Home Page Settings
// @route   GET /api/settings/home
// @access  Public
router.get('/home', async (req, res) => {
    try {
        let settings = await SiteSettings.findOne({ type: 'home' });

        if (!settings) {
            // Create default if not exists
            settings = await SiteSettings.create({
                type: 'home',
                homeContent: {
                    subheading: "Curated Excellence",
                    heading: "Signature Collection",
                    signatureProducts: []
                }
            });
        }

        res.json(settings.homeContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update Home Page Settings
// @route   PUT /api/settings/home
// @access  Private/Admin (Validation to be added by middleware if strictly enforced, but open for now as per context)
router.put('/home', async (req, res) => {
    try {
        const { subheading, heading, signatureProducts } = req.body;

        const settings = await SiteSettings.findOneAndUpdate(
            { type: 'home' },
            {
                type: 'home',
                homeContent: {
                    subheading,
                    heading,
                    signatureProducts
                }
            },
            { new: true, upsert: true } // Create if not exists
        );

        res.json(settings.homeContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get Certifications Settings
// @route   GET /api/settings/certifications
// @access  Public
router.get('/certifications', async (req, res) => {
    try {
        let settings = await SiteSettings.findOne({ type: 'home' });

        if (!settings) {
            settings = await SiteSettings.create({ type: 'home' });
        }

        res.json(settings.certificationsContent || {});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update Certifications Settings
// @route   PUT /api/settings/certifications
// @access  Private/Admin
router.put('/certifications', async (req, res) => {
    try {
        const { title, description, images, sectionTitle, sectionDescription, cards } = req.body;

        const settings = await SiteSettings.findOneAndUpdate(
            { type: 'home' },
            {
                $set: {
                    certificationsContent: {
                        title,
                        description,
                        images,
                        sectionTitle,
                        sectionDescription,
                        cards
                    }
                }
            },
            { new: true, upsert: true }
        );

        res.json(settings.certificationsContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
