const mongoose = require('mongoose');

/**
 * GST Settings Model
 * Controls global GST configuration for the platform
 */
const gstSettingsSchema = new mongoose.Schema({
    // Global GST control
    gst_enabled: {
        type: Boolean,
        default: false,
        required: true
    },

    // Default GST percentage (can be updated by admin)
    default_gst_percentage: {
        type: Number,
        default: 18,
        min: 0,
        max: 100,
        required: true
    },

    // Admin's official GST number
    admin_gst_number: {
        type: String,
        default: '',
        trim: true,
        uppercase: true,
        validate: {
            validator: function (v) {
                // GST number format: 22AAAAA0000A1Z5 (15 characters)
                if (!v) return true; // Allow empty
                return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
            },
            message: props => `${props.value} is not a valid GST number format!`
        }
    },

    // Company details for GST
    company_name: {
        type: String,
        default: 'Siraba Organic'
    },

    company_address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },

    // Different GST rates for different categories (optional)
    category_gst_rates: [{
        category: String,
        gst_percentage: Number
    }],

    // Metadata
    last_updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    last_updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists (singleton pattern)
gstSettingsSchema.statics.getInstance = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('GSTSettings', gstSettingsSchema);
