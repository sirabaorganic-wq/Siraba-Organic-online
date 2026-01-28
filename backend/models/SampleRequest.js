const mongoose = require('mongoose');

const sampleRequestSchema = mongoose.Schema({
    companyName: { type: String, required: true },
    contactName: { type: String, required: true }, // Recipient Name
    address: { type: String, required: true },
    shippingAccount: { type: String },
    items: [String],
    status: { type: String, default: 'New' } // New, Approved, Shipped
}, {
    timestamps: true
});

module.exports = mongoose.model('SampleRequest', sampleRequestSchema);
