import React from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';

/**
 * ReviewPrompt Component
 * Shows on order tracking/history pages
 * Prompts users to review delivered products
 */
const ReviewPrompt = ({ order, product }) => {
    // Only show for delivered orders
    if (!order.isDelivered || order.status !== 'Delivered') {
        return null;
    }

    return (
        <Link
            to={`/product/${product.slug || product._id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent/10 to-primary/10 border border-primary/20 rounded-lg hover:shadow-md transition-all group"
        >
            <div className="flex items-center gap-2">
                <Star size={16} className="text-accent group-hover:fill-current transition-all" />
                <span className="text-sm font-medium text-primary">
                    Review this product
                </span>
            </div>
            <CheckCircle size={14} className="text-emerald-600" />
        </Link>
    );
};

export default ReviewPrompt;
