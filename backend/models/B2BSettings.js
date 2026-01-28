const mongoose = require('mongoose');

const b2bSettingsSchema = mongoose.Schema({
    pricingProducts: [{
        name: { type: String, required: true },
        price: { type: Number, required: true }
    }],
    exportDocs: [{
        name: { type: String, required: true },
        type: { type: String, required: true } // Required, Quality, Shipping, Other
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('B2BSettings', b2bSettingsSchema);
