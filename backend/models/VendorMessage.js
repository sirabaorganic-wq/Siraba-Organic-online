const mongoose = require("mongoose");

const vendorMessageSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
    },
    sender: {
        type: String,
        enum: ["vendor", "admin"],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model("VendorMessage", vendorMessageSchema);
