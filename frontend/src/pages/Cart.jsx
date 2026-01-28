import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const { createOrder } = useOrders();
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();

    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState({ amount: 0, code: '' });
    const [couponError, setCouponError] = useState('');
    const [isApplying, setIsApplying] = useState(false);

    const [availableCoupons, setAvailableCoupons] = useState([]);

    useEffect(() => {
        const fetchCoupons = async () => {
            if (user) {
                try {
                    const { data } = await client.get('/coupons/available');
                    setAvailableCoupons(data);
                } catch (error) {
                    console.error("Failed to fetch coupons", error);
                }
            }
        };
        fetchCoupons();
    }, [user]);

    const handleApplySpecificCoupon = (code) => {
        setCouponCode(code);
        // We need to call the validate function, but since state updates are async, 
        // passing the code directly to a modified handler or waiting would be ideal.
        // For simplicity, we'll just set the code and let the user click apply, 
        // OR better yet, trigger the validation immediately.
        validateCoupon(code);
    };

    const validateCoupon = async (codeToValidate) => {
        if (!codeToValidate.trim()) return;
        setIsApplying(true);
        setCouponError('');
        try {
            const { data } = await client.post('/coupons/validate', { code: codeToValidate });

            let discountAmount = 0;
            const subtotal = getCartTotal();

            if (data.discountType === 'percentage') {
                discountAmount = (subtotal * data.discountValue) / 100;
            } else {
                discountAmount = data.discountValue;
            }

            // Cap discount at subtotal
            discountAmount = Math.min(discountAmount, subtotal);

            setDiscount({ amount: discountAmount, code: data.code });
            setCouponCode(''); // Clear input after successful application
        } catch (error) {
            setCouponError(error.response?.data?.message || 'Invalid coupon');
            setDiscount({ amount: 0, code: '' });
        } finally {
            setIsApplying(false);
        }
    };

    const handleApplyCoupon = () => {
        validateCoupon(couponCode);
    };

    const handleRemoveCoupon = () => {
        setDiscount({ amount: 0, code: '' });
        setCouponCode('');
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) return;

        if (!user) {
            navigate('/login?redirect=cart');
            return;
        }

        navigate('/checkout', { state: { discount } });
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-background pt-32 pb-16 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-fade-in-up">
                    <ShoppingBag size={48} />
                </div>
                <h2 className="font-heading text-3xl text-primary font-bold mb-4">Your cart is empty</h2>
                <p className="text-text-secondary text-lg mb-8 max-w-md">
                    Looks like you haven't added anything to your cart yet. Discover our premium organic collection.
                </p>
                <Link to="/shop" className="bg-primary text-surface px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg rounded-sm">
                    Start Shopping
                </Link>
            </div>
        );
    }

    const currentTotal = getCartTotal();
    const shippingPrice = 499;
    const finalTotal = Math.max(0, currentTotal - discount.amount) + shippingPrice;

    return (
        <div className="min-h-screen bg-background pt-32 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-heading text-4xl font-bold text-primary mb-12 text-center md:text-left border-b border-secondary/10 pb-6">
                    Shopping Cart
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-6">
                        {cartItems.map((item) => (
                            <div key={item._id || item.id} className="bg-surface p-6 rounded-sm shadow-sm border border-secondary/10 flex gap-6 items-center">
                                {/* Product Image */}
                                <div className="w-24 h-24 bg-background p-2 rounded-sm flex-shrink-0 border border-secondary/5">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                </div>

                                {/* Details */}
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <Link to={`/product/${item.slug}`} className="font-heading text-xl text-primary font-bold hover:text-accent transition-colors">
                                            {item.name}
                                        </Link>
                                        <button
                                            onClick={() => removeFromCart(item._id || item.id)}
                                            className="text-text-secondary hover:text-red-500 transition-colors p-1"
                                            title="Remove Item"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-4">{item.category}</p>

                                    <div className="flex justify-between items-end">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center border border-secondary/20 rounded-sm bg-background">
                                            <button
                                                onClick={() => updateQuantity(item._id || item.id, -1)}
                                                className="p-2 hover:bg-secondary/10 transition-colors text-primary"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-10 text-center font-medium text-sm text-primary">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item._id || item.id, 1)}
                                                className="p-2 hover:bg-secondary/10 transition-colors text-primary"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-primary">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                            {item.quantity > 1 && (
                                                <p className="text-xs text-text-secondary">
                                                    {formatPrice(item.price)} each
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between pt-6">
                            <Link to="/shop" className="text-primary font-medium hover:text-accent transition-colors flex items-center gap-2">
                                <ArrowRight className="rotate-180" size={16} /> Continue Shopping
                            </Link>
                            <button onClick={clearCart} className="text-text-secondary hover:text-red-500 text-sm underline">
                                Clear Cart
                            </button>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface p-8 rounded-sm shadow-sm border border-secondary/10 lg:sticky lg:top-32">
                            <h2 className="font-heading text-2xl font-bold text-primary mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6 text-sm text-text-secondary">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-primary font-bold">{formatPrice(currentTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="text-primary">{formatPrice(499)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax (Included)</span>
                                    <span className="text-primary">{formatPrice(currentTotal * 0.18)}</span>
                                </div>

                                {/* Discount Section */}
                                {discount.amount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <span>Discount ({discount.code})</span>
                                            <button onClick={handleRemoveCoupon} className="text-xs underline text-red-500">Remove</button>
                                        </div>
                                        <span>-{formatPrice(discount.amount)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Coupon Input */}
                            <div className="mb-6">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Coupon Code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="flex-grow p-3 bg-background border border-secondary/20 rounded-sm text-sm focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={isApplying || !couponCode}
                                        className="bg-secondary text-white px-4 py-2 text-sm font-bold rounded-sm hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}

                                {/* Available Coupons List */}
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mb-1">Available Coupons</p>
                                    {availableCoupons.length > 0 ? (
                                        availableCoupons.map(coupon => (
                                            <div key={coupon._id} className="bg-background border border-secondary/10 p-3 rounded-sm flex justify-between items-center group hover:border-primary/30 transition-colors">
                                                <div>
                                                    <p className="font-bold text-primary text-sm">{coupon.code}</p>
                                                    <p className="text-xs text-text-secondary">
                                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleApplySpecificCoupon(coupon.code)}
                                                    className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-sm hover:bg-secondary hover:text-white transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-text-secondary italic">No coupons available for you at the moment.</p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-secondary/10 pt-6 mb-8">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-text-secondary">Subtotal</span>
                                    <span className="font-bold text-primary">{formatPrice(currentTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-text-secondary">Shipping</span>
                                    <span className="font-bold text-primary">{formatPrice(shippingPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-secondary/10 pt-4">
                                    <span className="font-heading text-xl font-bold text-primary">Total</span>
                                    <span className="font-heading text-2xl font-bold text-accent">{formatPrice(finalTotal)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full bg-primary text-surface py-4 text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg flex items-center justify-center gap-2 rounded-sm"
                            >
                                Proceed to Checkout
                            </button>

                            <p className="text-xs text-center text-text-secondary mt-4 flex items-center justify-center gap-1">
                                <ShieldCheckIcon size={12} /> Secure Checkout
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Icon for the cart summary
const ShieldCheckIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export default Cart;
