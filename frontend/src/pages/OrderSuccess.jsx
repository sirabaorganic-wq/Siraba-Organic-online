import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Home, Truck, Package, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const OrderSuccess = () => {
    const { formatPrice } = useCurrency();
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;

    useEffect(() => {
        if (!order) {
            navigate('/');
        }
        // Scroll to top on mount
        window.scrollTo(0, 0);
    }, [order, navigate]);

    if (!order) return null;

    return (
        <div className="min-h-screen bg-background pt-28 pb-16 flex items-center justify-center">
            <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8">

                {/* Success Animation & Header */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-green-50 rounded-full p-4">
                            <CheckCircle size={64} className="text-green-600 animate-bounce-short" strokeWidth={1.5} />
                        </div>
                    </div>
                    <h1 className="font-heading text-4xl font-bold text-primary mb-2">Order Placed Successfully!</h1>
                    <p className="text-text-secondary text-lg">Thank you for choosing Siraba Organic.</p>
                </div>

                {/* Order Details Card */}
                <div className="bg-surface rounded-lg shadow-sm border border-secondary/10 overflow-hidden mb-8 animate-fade-in-up animation-delay-200">
                    <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-xs uppercase tracking-widest text-text-secondary mb-1">Order ID</p>
                            <p className="font-mono font-bold text-primary text-lg">#{order._id}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-xs uppercase tracking-widest text-text-secondary mb-1">Total Amount</p>
                            <p className="font-bold text-primary text-lg">{formatPrice(order.totalPrice)}</p>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            {/* Items List */}
                            <div>
                                <h3 className="font-heading text-lg font-bold text-primary mb-4 flex items-center">
                                    <Package size={20} className="mr-2 text-secondary" /> Order Items
                                </h3>
                                <div className="space-y-4">
                                    {order.orderItems?.map((item, index) => (
                                        <div key={index} className="flex gap-4 items-start border-b border-secondary/5 pb-4 last:border-0 last:pb-0">
                                            <div className="w-12 h-12 bg-background rounded-sm border border-secondary/10 flex-shrink-0 p-1">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-primary line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-text-secondary mt-0.5">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="ml-auto">
                                                <p className="text-sm font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping & Payment Info */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-heading text-lg font-bold text-primary mb-4 flex items-center">
                                        <MapPin size={20} className="mr-2 text-secondary" /> Shipping To
                                    </h3>
                                    <div className="bg-background p-4 rounded-sm border border-secondary/10 text-sm">
                                        <p className="font-bold text-primary mb-1">{order.shippingAddress?.name || 'User'}</p>
                                        <p className="text-text-secondary text-sm leading-relaxed">
                                            {order.shippingAddress?.address}<br />
                                            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}<br />
                                            {order.shippingAddress?.country}
                                        </p>
                                        <p className="text-text-secondary text-sm mt-2 flex items-center">
                                            <strong className="mr-1">Contact:</strong> {order.shippingAddress?.phone || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center text-sm border-t border-secondary/10 pt-4 mt-2">
                                        <span className="text-text-secondary">Expected Delivery</span>
                                        <span className="font-bold text-primary">3-5 Business Days</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-text-secondary">Payment Method</span>
                                        <span className="font-bold text-primary">{order.paymentMethod}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-8 py-3 bg-white border border-secondary/20 rounded-md text-primary font-bold hover:bg-secondary/5 transition-all text-sm uppercase tracking-wider group shadow-sm hover:shadow-md"
                    >
                        <Home size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Go to Home
                    </Link>
                    <button
                        onClick={() => navigate('/account')}
                        className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white rounded-md font-bold hover:bg-accent hover:text-primary transition-all text-sm uppercase tracking-wider shadow-lg hover:shadow-xl group"
                    >
                        <Truck size={18} className="mr-2" />
                        Track Order
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default OrderSuccess;
