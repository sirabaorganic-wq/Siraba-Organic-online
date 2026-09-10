const mongoose = require('mongoose');

const contactSubmissionSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['New', 'Read', 'Replied', 'Closed'],
        default: 'New'
    },
    adminNotes: { type: String },
    readAt: { type: Date },
    // Attribution Metadata (Non-PII marketing source tracking)
    utmSource: { type: String, default: '' },
    utmMedium: { type: String, default: '' },
    utmCampaign: { type: String, default: '' },
    utmTerm: { type: String, default: '' },
    utmContent: { type: String, default: '' },
    referrer: { type: String, default: '' },
    landingPage: { type: String, default: '' },
    firstTouchSource: { type: String, default: '' },
    lastTouchSource: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);
