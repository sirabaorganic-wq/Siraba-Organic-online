const mongoose = require('mongoose');

/**
 * Separate Review Model for scalability
 * Allows better querying, pagination, and analytics
 */
const reviewSchema = mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true, // Track which order this review is from
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 1000,
        },

        // Verified Purchase Badge
        verifiedPurchase: {
            type: Boolean,
            default: true, // All reviews require purchase
        },
        purchaseDate: {
            type: Date,
            required: true,
        },

        // Vendor Response
        vendorReply: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        vendorReplyDate: {
            type: Date,
        },

        // Review Helpfulness (users can mark reviews as helpful)
        helpfulCount: {
            type: Number,
            default: 0,
        },
        helpfulUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],

        // Admin Moderation
        isApproved: {
            type: Boolean,
            default: true, // Auto-approve by default, can be moderated
        },
        isFlagged: {
            type: Boolean,
            default: false,
        },
        flagReason: {
            type: String,
        },

        // Images (optional - users can attach photos)
        images: [{
            type: String,
            validate: {
                validator: function (v) {
                    return v.length <= 5;
                },
                message: 'Maximum 5 images allowed per review.',
            },
        }],

        // Product variant info (if applicable)
        variantInfo: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ isApproved: 1, product: 1 });

// Virtual for user name (populated)
reviewSchema.virtual('userName').get(function () {
    return this.user?.name || 'Anonymous';
});

// Ensure virtuals are included in JSON
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', reviewSchema);
