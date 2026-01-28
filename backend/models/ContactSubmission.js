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
    readAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);
