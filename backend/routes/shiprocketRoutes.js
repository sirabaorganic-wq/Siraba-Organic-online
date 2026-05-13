const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/shiprocketController');

// POST /api/shiprocket/webhook
// Shiprocket pushes tracking status updates here 
router.post('/webhook', handleWebhook);

module.exports = router;
