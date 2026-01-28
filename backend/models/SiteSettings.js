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

}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

module.exports = SiteSettings;
