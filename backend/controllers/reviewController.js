const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { checkPurchaseStatus } = require('../middleware/reviewMiddleware');

/**
 * @desc    Get all reviews for a product (with pagination)
 * @route   GET /api/products/:id/reviews-detailed
 * @access  Public
 */
const getProductReviews = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt'; // createdAt, rating, helpful
        const order = req.query.order === 'asc' ? 1 : -1;
        const ratingFilter = req.query.rating ? parseInt(req.query.rating) : null;

        // Build query
        const query = {
            product: productId,
            isApproved: true,
        };

        if (ratingFilter) {
            query.rating = ratingFilter;
        }

        // Sorting options
        let sortOptions = {};
        if (sortBy === 'helpful') {
            sortOptions = { helpfulCount: -1, createdAt: -1 };
        } else if (sortBy === 'rating') {
            sortOptions = { rating: order, createdAt: -1 };
        } else {
            sortOptions = { createdAt: order };
        }

        const skip = (page - 1) * limit;

        const [reviews, total, ratingDistribution] = await Promise.all([
            Review.find(query)
                .populate('user', 'name')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments(query),
            Review.aggregate([
                { $match: { product: productId, isApproved: true } },
                { $group: { _id: '$rating', count: { $sum: 1 } } },
                { $sort: { _id: -1 } },
            ]),
        ]);

        // Format rating distribution
        const distribution = [5, 4, 3, 2, 1].map(rating => {
            const found = ratingDistribution.find(d => d._id === rating);
            return {
                rating,
                count: found ? found.count : 0,
                percentage: total > 0 ? ((found ? found.count : 0) / total * 100).toFixed(1) : 0,
            };
        });

        res.json({
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            distribution,
            summary: {
                totalReviews: total,
                averageRating: total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0,
            },
        });
    } catch (error) {
        console.error('Get product reviews error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Create a new review (Verified Buyers Only)
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = async (req, res) => {
    try {
        const { productId, rating, title, comment, images } = req.body;
        const userId = req.user._id;

        // Input validation
        if (!productId || !rating || !title || !comment) {
            return res.status(400).json({
                message: 'Product ID, rating, title, and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        if (comment.trim().length < 10) {
            return res.status(400).json({
                message: 'Review comment must be at least 10 characters long'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // CRITICAL: Verify purchase
        const purchaseStatus = await checkPurchaseStatus(userId, productId);
        if (!purchaseStatus.canReview) {
            return res.status(403).json({
                message: 'You can only review products you have purchased and received',
                canReview: false,
                reason: 'NOT_PURCHASED',
            });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({
                message: 'You have already reviewed this product. You can update your existing review.',
                existingReview,
            });
        }

        // Create review
        const review = await Review.create({
            product: productId,
            user: userId,
            order: purchaseStatus.orderId,
            rating: Number(rating),
            title: title.trim(),
            comment: comment.trim(),
            verifiedPurchase: true,
            purchaseDate: purchaseStatus.deliveredAt,
            images: images || [],
        });

        // Update product rating (using embedded reviews for backward compatibility)
        const allReviews = await Review.find({
            product: productId,
            isApproved: true
        });

        const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

        product.rating = avgRating;
        product.numReviews = allReviews.length;

        // Also add to embedded reviews for backward compatibility
        product.reviews.push({
            name: req.user.name,
            rating: Number(rating),
            comment: comment.trim(),
            user: userId,
        });

        await product.save();

        // Populate user data
        const populatedReview = await Review.findById(review._id)
            .populate('user', 'name')
            .lean();

        // Emit real-time event
        if (req.io) {
            req.io.emit('new_review', {
                productId,
                review: populatedReview,
                rating: avgRating,
            });
        }

        res.status(201).json({
            message: 'Review submitted successfully',
            review: populatedReview,
            productRating: avgRating,
            productNumReviews: allReviews.length,
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update user's own review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = async (req, res) => {
    try {
        const { id: reviewId } = req.params;
        const { rating, title, comment, images } = req.body;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Only review owner can update
        if (review.user.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You can only update your own reviews'
            });
        }

        // Update fields
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Rating must be between 1 and 5' });
            }
            review.rating = Number(rating);
        }

        if (title !== undefined) review.title = title.trim();
        if (comment !== undefined) {
            if (comment.trim().length < 10) {
                return res.status(400).json({
                    message: 'Review comment must be at least 10 characters long'
                });
            }
            review.comment = comment.trim();
        }
        if (images !== undefined) review.images = images;

        await review.save();

        // Recalculate product rating
        const product = await Product.findById(review.product);
        const allReviews = await Review.find({
            product: review.product,
            isApproved: true
        });

        product.rating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

        // Update embedded review
        const embeddedReview = product.reviews.find(r => r.user.toString() === userId.toString());
        if (embeddedReview) {
            embeddedReview.rating = review.rating;
            embeddedReview.comment = review.comment;
        }

        await product.save();

        // Populate user data
        const updatedReview = await Review.findById(review._id)
            .populate('user', 'name')
            .lean();

        // Emit real-time event
        if (req.io) {
            req.io.emit('review_updated', {
                productId: review.product,
                reviewId: review._id,
                rating: product.rating,
            });
        }

        res.json({
            message: 'Review updated successfully',
            review: updatedReview,
            productRating: product.rating,
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (User can delete own review, Admin can delete any)
 */
const deleteReview = async (req, res) => {
    try {
        const { id: reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check permissions
        const isOwner = review.user.toString() === userId.toString();
        const isAdmin = req.user.isAdmin;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: 'You can only delete your own reviews'
            });
        }

        const productId = review.product;

        await review.deleteOne();

        // Update product rating
        const product = await Product.findById(productId);
        const allReviews = await Review.find({
            product: productId,
            isApproved: true
        });

        product.numReviews = allReviews.length;
        product.rating = allReviews.length > 0
            ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length
            : 0;

        // Remove from embedded reviews
        product.reviews = product.reviews.filter(
            r => r.user.toString() !== userId.toString()
        );

        await product.save();

        // Emit real-time event
        if (req.io) {
            req.io.emit('review_deleted', {
                productId,
                reviewId,
                rating: product.rating,
            });
        }

        res.json({
            message: 'Review deleted successfully',
            productRating: product.rating,
            productNumReviews: product.numReviews,
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Mark review as helpful
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
const markReviewHelpful = async (req, res) => {
    try {
        const { id: reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if already marked as helpful
        const alreadyMarked = review.helpfulUsers.some(
            u => u.toString() === userId.toString()
        );

        if (alreadyMarked) {
            // Remove helpful mark
            review.helpfulUsers = review.helpfulUsers.filter(
                u => u.toString() !== userId.toString()
            );
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
            // Add helpful mark
            review.helpfulUsers.push(userId);
            review.helpfulCount += 1;
        }

        await review.save();

        res.json({
            message: alreadyMarked ? 'Removed helpful mark' : 'Marked as helpful',
            helpfulCount: review.helpfulCount,
            isHelpful: !alreadyMarked,
        });
    } catch (error) {
        console.error('Mark review helpful error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Vendor reply to review
 * @route   POST /api/reviews/:id/reply
 * @access  Private/Vendor
 */
const addVendorReply = async (req, res) => {
    try {
        const { id: reviewId } = req.params;
        const { reply } = req.body;
        const vendorId = req.vendor._id;

        if (!reply || reply.trim().length < 10) {
            return res.status(400).json({
                message: 'Reply must be at least 10 characters long'
            });
        }

        const review = await Review.findById(reviewId).populate('product');

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Verify vendor owns the product
        if (review.product.vendor?.toString() !== vendorId.toString()) {
            return res.status(403).json({
                message: 'You can only reply to reviews for your products'
            });
        }

        review.vendorReply = reply.trim();
        review.vendorReplyDate = new Date();
        await review.save();

        // Also update embedded review
        const product = await Product.findById(review.product._id);
        const embeddedReview = product.reviews.find(
            r => r.user.toString() === review.user.toString()
        );
        if (embeddedReview) {
            embeddedReview.vendorReply = reply.trim();
            embeddedReview.vendorReplyDate = new Date();
            await product.save();
        }

        // Emit real-time event
        if (req.io) {
            req.io.emit('review_reply', {
                productId: review.product._id,
                reviewId: review._id,
                reply: reply.trim(),
                replyDate: review.vendorReplyDate,
            });
        }

        res.json({
            message: 'Reply added successfully',
            review: await Review.findById(reviewId).populate('user', 'name'),
        });
    } catch (error) {
        console.error('Add vendor reply error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get user's own reviews
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
const getMyReviews = async (req, res) => {
    try {
        const userId = req.user._id;

        const reviews = await Review.find({ user: userId })
            .populate('product', 'name image slug')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            reviews,
            count: reviews.length,
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    markReviewHelpful,
    addVendorReply,
    getMyReviews,
};
