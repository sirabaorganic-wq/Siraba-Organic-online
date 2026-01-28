const Order = require('../models/Order');

/**
 * Middleware to verify if user has purchased a specific product
 * Only users who have successfully received the product can leave reviews
 */
const verifyPurchase = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;

        // Find orders where:
        // 1. User matches
        // 2. Order contains the product
        // 3. Order is delivered (status === 'Delivered')
        // 4. Product was actually delivered (isDelivered === true)
        // 5. Order is paid (for COD, isPaid is set on delivery)
        const purchasedOrder = await Order.findOne({
            user: userId,
            'orderItems.product': productId,
            isDelivered: true,
            status: 'Delivered',
            isPaid: true, // Ensure order is paid (COD marked paid on delivery)
        });

        if (!purchasedOrder) {
            return res.status(403).json({
                message: 'You can only review products you have purchased and received',
                canReview: false,
                reason: 'NOT_PURCHASED',
            });
        }

        // Attach purchase info to request for potential use
        req.purchaseVerified = true;
        req.purchasedOrder = purchasedOrder;
        next();
    } catch (error) {
        console.error('Purchase verification error:', error);
        res.status(500).json({ message: 'Error verifying purchase' });
    }
};

/**
 * Check if user can review a product (without blocking the request)
 * Returns purchase status information
 */
const checkPurchaseStatus = async (userId, productId) => {
    try {
        const purchasedOrder = await Order.findOne({
            user: userId,
            'orderItems.product': productId,
            isDelivered: true,
            status: 'Delivered',
            isPaid: true,
        }).lean();

        if (purchasedOrder) {
            // Find the specific product in the order items
            const orderItem = purchasedOrder.orderItems.find(
                item => item.product.toString() === productId.toString()
            );

            return {
                canReview: true,
                isPurchased: true,
                orderId: purchasedOrder._id,
                deliveredAt: purchasedOrder.deliveredAt,
                purchaseDate: purchasedOrder.createdAt,
                productQuantity: orderItem?.quantity || 1,
            };
        }

        return {
            canReview: false,
            isPurchased: false,
        };
    } catch (error) {
        console.error('Error checking purchase status:', error);
        return {
            canReview: false,
            isPurchased: false,
            error: error.message,
        };
    }
};

module.exports = { verifyPurchase, checkPurchaseStatus };
