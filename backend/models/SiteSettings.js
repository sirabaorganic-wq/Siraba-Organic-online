const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true, // e.g., 'home', 'general'
        default: 'home'
    },
    homeContent: {
        subheading: { type: String, default: "Curated Excellence" },
        heading: { type: String, default: "Signature Collection" },
        signatureProducts: [{ type: String }] // Array of Product IDs (strings or ObjectIds)
    },
    certificationsContent: {
        title: { type: String, default: "Our Certifications" }, // Top section title
        description: { type: String, default: "We are committed to quality and transparency." }, // Top section desc
        images: [{ type: String }], // Top section image(s)

        // New: Bottom section "OUR CERTIFICATION"
        sectionTitle: { type: String, default: "OUR CERTIFICATION" },
        sectionDescription: { type: String, default: "We provide as per India Organic (NPOP)..." },
        cards: [{
            title: String,
            description: String,
            icon: String // URL or Identifier
        }]
    },

    // Shipping Configuration — used by /api/shipping/estimate and order creation
    shippingConfig: {
        freeShippingThreshold: { type: Number, default: 999 },      // Orders ≥ ₹999 get free shipping
        platformHandlingFeeFlat: { type: Number, default: 25 },      // ₹25 flat fee on top of courier rate
        platformHandlingFeePercent: { type: Number, default: 5 },    // 5% of courier rate
        codSurcharge: { type: Number, default: 40 },                 // Extra charge for COD orders
        flatRateFallback: { type: Number, default: 70 },             // Used when Shiprocket API fails
        weightPerItem: { type: Number, default: 0.5 },               // Default kg per item
        isEnabled: { type: Boolean, default: true },                 // Master toggle
    },

}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

module.exports = SiteSettings;
