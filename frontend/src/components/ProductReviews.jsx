import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Star, ShieldCheck, Store, Clock, Edit, Trash2, CheckCircle } from 'lucide-react';
import client from '../api/client';

/**
 * ProductReviews Component
 * Displays product reviews with verified purchase badges
 * Allows verified buyers to submit reviews
 */
const ProductReviews = ({ product, onReviewUpdate }) => {
    const { user } = useAuth();
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [eligibility, setEligibility] = useState(null);
    const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);

    // Check if user can review this product
    useEffect(() => {
        const checkEligibility = async () => {
            if (!user || !product?._id) return;

            setIsLoadingEligibility(true);
            try {
                const { data } = await client.get(`/products/${product._id}/can-review`);
                setEligibility(data);

                // If user already reviewed, pre-fill the form for editing
                if (data.existingReview) {
                    setReviewRating(data.existingReview.rating);
                    setReviewComment(data.existingReview.comment);
                    setEditingReviewId(data.existingReview._id);
                }
            } catch (error) {
                console.error('Error checking review eligibility:', error);
            } finally {
                setIsLoadingEligibility(false);
            }
        };

        checkEligibility();
    }, [user, product?._id]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!reviewComment.trim() || reviewComment.trim().length < 10) {
            setErrorMessage('Review must be at least 10 characters long');
            return;
        }

        setIsSubmitting(true);
        try {
            let response;

            if (editingReviewId) {
                // Update existing review
                response = await client.put(
                    `/products/${product._id}/reviews/${editingReviewId}`,
                    { rating: reviewRating, comment: reviewComment.trim() }
                );
                setSuccessMessage('Review updated successfully!');
            } else {
                // Create new review
                response = await client.post(`/products/${product._id}/reviews`, {
                    rating: reviewRating,
                    comment: reviewComment.trim(),
                });
                setSuccessMessage('Review submitted successfully! Thank you for your feedback.');
            }

            // Reset form
            if (!editingReviewId) {
                setReviewComment('');
                setReviewRating(5);
            }

            // Update parent component
            if (onReviewUpdate) {
                onReviewUpdate(response.data);
            }

            // Refresh eligibility
            const { data: newEligibility } = await client.get(`/products/${product._id}/can-review`);
            setEligibility(newEligibility);

            if (newEligibility.existingReview) {
                setEditingReviewId(newEligibility.existingReview._id);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to submit review';
            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            await client.delete(`/products/${product._id}/reviews/${reviewId}`);
            setSuccessMessage('Review deleted successfully');
            setReviewComment('');
            setReviewRating(5);
            setEditingReviewId(null);

            // Refresh eligibility
            const { data: newEligibility } = await client.get(`/products/${product._id}/can-review`);
            setEligibility(newEligibility);

            if (onReviewUpdate) {
                onReviewUpdate({ deleted: true });
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Failed to delete review');
        }
    };

    // Star Rating Component
    const StarRating = ({ rating, interactive = false, size = 18, onRatingChange }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type={interactive ? 'button' : undefined}
                        onClick={interactive ? () => onRatingChange(star) : undefined}
                        disabled={!interactive}
                        className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
                    >
                        <Star
                            size={size}
                            className={
                                star <= rating
                                    ? 'text-accent fill-current'
                                    : 'text-gray-300'
                            }
                        />
                    </button>
                ))}
            </div>
        );
    };

    // Verified Purchase Badge
    const VerifiedBadge = ({ deliveredAt }) => (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
            <ShieldCheck size={12} />
            <span>Verified Purchase</span>
            {deliveredAt && (
                <span className="text-emerald-600 ml-1">
                    • {new Date(deliveredAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Reviews Statistics */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-lg border border-primary/10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-primary mb-2">
                            {product.rating ? product.rating.toFixed(1) : '0.0'}
                        </div>
                        <StarRating rating={Math.round(product.rating || 0)} />
                        <div className="text-sm text-text-secondary mt-2">
                            {product.numReviews || 0} {product.numReviews === 1 ? 'Review' : 'Reviews'}
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1 space-y-2 w-full">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = product.reviews?.filter(r => r.rating === stars).length || 0;
                            const percentage = product.reviews?.length ? (count / product.reviews.length) * 100 : 0;
                            return (
                                <div key={stars} className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-text-secondary w-8">{stars} ★</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-accent h-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-text-secondary w-12 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Review Form */}
            {user ? (
                <div className="bg-surface border border-secondary/10 rounded-lg p-6">
                    <h3 className="font-heading text-xl font-bold text-primary mb-4 flex items-center gap-2">
                        {editingReviewId ? (
                            <>
                                <Edit size={20} />
                                Update Your Review
                            </>
                        ) : (
                            'Write a Review'
                        )}
                    </h3>

                    {isLoadingEligibility ? (
                        <div className="text-center py-4 text-text-secondary">
                            Checking eligibility...
                        </div>
                    ) : eligibility && !eligibility.canReview && !editingReviewId ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Clock size={20} className="text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-900 mb-1">
                                        Only Verified Buyers Can Review
                                    </p>
                                    <p className="text-sm text-amber-700">
                                        {eligibility.alreadyReviewed
                                            ? 'You have already reviewed this product.'
                                            : 'Purchase this product and receive it to leave a review.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            {/* Success/Error Messages */}
                            {successMessage && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-emerald-800">
                                    <CheckCircle size={18} />
                                    <span className="text-sm font-medium">{successMessage}</span>
                                </div>
                            )}
                            {errorMessage && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Verified Purchase Indicator */}
                            {eligibility?.isPurchased && (
                                <div className="flex items-center gap-2">
                                    <VerifiedBadge deliveredAt={eligibility.purchaseStatus?.deliveredAt} />
                                    <span className="text-xs text-text-secondary">
                                        You purchased this product
                                    </span>
                                </div>
                            )}

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Your Rating *
                                </label>
                                <StarRating
                                    rating={reviewRating}
                                    interactive={true}
                                    size={28}
                                    onRatingChange={setReviewRating}
                                />
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Your Review * <span className="text-text-secondary font-normal">(minimum 10 characters)</span>
                                </label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Share your experience with this product..."
                                    className="w-full p-3 text-sm border border-secondary/20 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    rows="5"
                                    required
                                    minLength={10}
                                />
                                <div className="text-xs text-text-secondary mt-1">
                                    {reviewComment.length}/10 characters minimum
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || reviewComment.trim().length < 10}
                                    className="px-6 py-3 bg-primary text-white font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-accent hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {isSubmitting ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                                </button>

                                {editingReviewId && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteReview(editingReviewId)}
                                        className="px-6 py-3 bg-red-50 text-red-700 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-red-100 transition-all border border-red-200 flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete Review
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            ) : (
                <div className="bg-surface border border-secondary/10 rounded-lg p-6 text-center">
                    <p className="text-text-secondary">
                        Please{' '}
                        <Link to="/login" className="text-primary font-medium hover:underline">
                            login
                        </Link>{' '}
                        to write a review.
                    </p>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                <h3 className="font-heading text-xl font-bold text-primary mb-4">
                    Customer Reviews
                </h3>

                {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-4">
                        {product.reviews.map((review) => (
                            <div
                                key={review._id}
                                className="bg-surface border border-secondary/10 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                                {/* Review Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {review.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-primary">{review.name}</span>
                                                    <VerifiedBadge />
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StarRating rating={review.rating} size={14} />
                                                    <span className="text-xs text-text-secondary">
                                                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Comment */}
                                <p className="text-text-secondary leading-relaxed mb-3">
                                    {review.comment}
                                </p>

                                {/* Vendor Reply */}
                                {review.vendorReply && (
                                    <div className="mt-4 ml-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Store size={16} className="text-blue-600" />
                                            <span className="text-sm font-bold text-blue-900">Seller Response</span>
                                            <span className="text-xs text-blue-600">
                                                • {new Date(review.vendorReplyDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-blue-800">
                                            {review.vendorReply}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-surface border border-secondary/10 rounded-lg p-12 text-center">
                        <Star size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-text-secondary text-lg mb-2">No reviews yet</p>
                        <p className="text-text-secondary text-sm">
                            Be the first to review this product!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductReviews;
