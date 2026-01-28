const mongoose = require('mongoose');

const distributorSchema = mongoose.Schema({
    businessName: { type: String, required: true },
    contactName: { type: String, required: true },
    email: { type: String, required: true },
    region: { type: String, required: true },
    yearsInBusiness: { type: String },
    annualTurnover: { type: String },
    message: { type: String },
    status: { type: String, default: 'Pending' } // Pending, Reviewed, Approved, Rejected
}, {
    timestamps: true
});

module.exports = mongoose.model('Distributor', distributorSchema);
