const express = require('express');
const router = express.Router();
const Distributor = require('../models/Distributor');
const SampleRequest = require('../models/SampleRequest');
const B2BSettings = require('../models/B2BSettings');

// --- Distributor Routes ---
// POST /api/b2b/distributors - Submit application
router.post('/distributors', async (req, res) => {
    try {
        const distributor = await Distributor.create(req.body);
        res.status(201).json(distributor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET /api/b2b/distributors - Get applications (Admin)
router.get('/distributors', async (req, res) => {
    try {
        const distributors = await Distributor.find().sort({ createdAt: -1 });
        res.json(distributors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Sample Request Routes ---
// POST /api/b2b/samples - Submit request
router.post('/samples', async (req, res) => {
    try {
        const sample = await SampleRequest.create(req.body);
        res.status(201).json(sample);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET /api/b2b/samples - Get requests (Admin)
router.get('/samples', async (req, res) => {
    try {
        const samples = await SampleRequest.find().sort({ createdAt: -1 });
        res.json(samples);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Settings Routes ---
// GET /api/b2b/settings - Get settings (or create default)
router.get('/settings', async (req, res) => {
    try {
        let settings = await B2BSettings.findOne();
        if (!settings) {
            // Create default settings
            settings = await B2BSettings.create({
                pricingProducts: [
                    { name: 'Kashmiri Saffron', price: 250000 },
                    { name: 'Organic Walnuts', price: 1200 },
                    { name: 'Himalayan Shilajit', price: 15000 },
                    { name: 'Asafoetida (Heeng)', price: 8000 }
                ],
                exportDocs: [
                    { name: 'Certificate of Origin', type: 'Required' },
                    { name: 'Phytosanitary Cert', type: 'Required' },
                    { name: 'Organic NPOP/NOP', type: 'Quality' },
                    { name: 'Lab Analysis Report', type: 'Quality' },
                    { name: 'Commercial Invoice', type: 'Shipping' },
                    { name: 'Packing List', type: 'Shipping' }
                ]
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/b2b/settings - Update settings
router.put('/settings', async (req, res) => {
    try {
        let settings = await B2BSettings.findOne();
        if (!settings) {
            settings = new B2BSettings(req.body);
        } else {
            settings.pricingProducts = req.body.pricingProducts || settings.pricingProducts;
            settings.exportDocs = req.body.exportDocs || settings.exportDocs;
        }
        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
