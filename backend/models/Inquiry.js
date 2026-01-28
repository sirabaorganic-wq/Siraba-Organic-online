const mongoose = require('mongoose');

const inquirySchema = mongoose.Schema({
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    productInterest: [String],
    quantity: { type: String },
    destination: { type: String, required: true },
    message: { type: String },
    status: { type: String, default: 'New' } // New, Contacted, Closed
}, {
    timestamps: true
});

module.exports = mongoose.model('Inquiry', inquirySchema);
