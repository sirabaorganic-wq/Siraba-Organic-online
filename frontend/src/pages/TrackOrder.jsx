import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle, Truck, Clock, MapPin, XCircle } from 'lucide-react';
import client from '../api/client';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';

const TrackOrder = () => {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { cancelOrder } = useOrders();
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelMessage, setCancelMessage] = useState('');

    const fetchOrder = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await client.get(`/orders/track/${id}`);
            setOrder(data);
        } catch (err) {
            console.error(err);
            setError('Order not found or invalid ID');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const queryOrderId = searchParams.get('orderId');
        if (queryOrderId) {
            setOrderId(queryOrderId);
            fetchOrder(queryOrderId);
        }
    }, [searchParams]);

    const handleTrack = (e) => {
        e.preventDefault();
        if (orderId) {
            fetchOrder(orderId);
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;

        const refundAmount = (order.itemsPrice || 0) + (order.taxPrice || 0);
        const deliveryCharge = order.shippingPrice || 0;

        const confirmMessage = `Are you sure you want to cancel this order?\n\n` +
            `REFUND POLICY:\n` +
            `✓ Product Cost: ₹${(order.itemsPrice || 0).toFixed(2)} - REFUNDABLE\n` +
            `✓ Tax: ₹${(order.taxPrice || 0).toFixed(2)} - REFUNDABLE\n` +
            `✗ Delivery Charge: ₹${deliveryCharge.toFixed(2)} - NON-REFUNDABLE\n\n` +
            `You will receive a refund of ₹${refundAmount.toFixed(2)} ${order.isPaid ? 'to your wallet/original payment method' : ''}.`;

        if (!window.confirm(confirmMessage)) return;

        setCancelling(true);
        setCancelMessage('');

        const result = await cancelOrder(order._id);

        if (result.success) {
            setCancelMessage('Order cancelled successfully! Refund will be processed shortly.');
            // Refresh order data
            fetchOrder(order._id);
        } else {
            setCancelMessage(`Error: ${result.message}`);
        }

        setCancelling(false);
    };

    const canCancelOrder = () => {
        if (!order || !user) return false;

        // Only allow cancellation for Pending, Approved, or Processing orders
        const cancellableStatuses = ['Pending', 'Approved', 'Processing'];
        return cancellableStatuses.includes(order.status);
    };

    const getStatusStep = (status) => {
        switch (status) {
            case 'Pending': return 1;
            case 'Approved': return 2;
            case 'Shipped': return 3;
            case 'Delivered': return 4;
            default: return 0;
        }
    };

    const currentStep = order ? getStatusStep(order.status) : 0;

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h1 className="font-heading text-4xl font-bold text-primary mb-4">Track Your Order</h1>
                    <p className="text-text-secondary">Enter your Order ID to see the current status of your shipment.</p>
                </div>

                <div className="bg-surface shadow-lg rounded-sm p-6 md:p-10 mb-10 border border-secondary/10">
                    <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-grow relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                            <input
                                type="text"
                                placeholder="Enter Order ID (e.g. 64f1...)"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-background border border-secondary/20 rounded-sm focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-surface px-8 py-4 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-colors rounded-sm disabled:opacity-70"
                        >
                            {loading ? 'Tracking...' : 'Track Order'}
                        </button>
                    </form>
                    {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                </div>

                {order && (
                    <div className="bg-surface shadow-lg rounded-sm p-8 border border-secondary/10 animate-fade-in">
                        <div className="flex flex-wrap justify-between items-end mb-8 border-b border-secondary/10 pb-6">
                            <div>
                                <p className="text-sm text-text-secondary uppercase tracking-wider mb-1">Order ID</p>
                                <p className="text-xl font-mono font-bold text-primary">{order._id || order.id}</p>
                            </div>
                            <div className="text-right mt-4 sm:mt-0">
                                <p className="text-sm text-text-secondary uppercase tracking-wider mb-1">Estimated Delivery</p>
                                <p className="text-lg font-bold text-primary">3-5 Business Days</p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative py-8 px-4 md:px-12">
                            {/* Progress Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary/10 -translate-y-1/2 hidden md:block"></div>
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-accent -translate-y-1/2 transition-all duration-1000 hidden md:block"
                                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                            ></div>

                            <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-0 relative z-10">
                                {/* Step 1: Placed */}
                                <div className={`flex flex-col items-center gap-3 transition-colors ${currentStep >= 1 ? 'text-primary' : 'text-text-secondary/50'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-surface transition-all
                                        ${currentStep >= 1 ? 'border-accent text-accent shadow-lg scale-110' : 'border-secondary/20'}`}>
                                        <Package size={20} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm uppercase tracking-wide">Order Placed</p>
                                        <p className="text-xs text-text-secondary mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Step 2: Processing (Approved) */}
                                <div className={`flex flex-col items-center gap-3 transition-colors ${currentStep >= 2 ? 'text-primary' : 'text-text-secondary/50'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-surface transition-all
                                        ${currentStep >= 2 ? 'border-accent text-accent shadow-lg scale-110' : 'border-secondary/20'}`}>
                                        <Clock size={20} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm uppercase tracking-wide">Processing</p>
                                        <p className="text-xs text-text-secondary mt-1">{currentStep >= 2 ? 'Verified' : 'Pending'}</p>
                                    </div>
                                </div>

                                {/* Step 3: Shipped */}
                                <div className={`flex flex-col items-center gap-3 transition-colors ${currentStep >= 3 ? 'text-primary' : 'text-text-secondary/50'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-surface transition-all
                                        ${currentStep >= 3 ? 'border-accent text-accent shadow-lg scale-110' : 'border-secondary/20'}`}>
                                        <Truck size={20} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm uppercase tracking-wide">Shipped</p>
                                        <p className="text-xs text-text-secondary mt-1">{currentStep >= 3 ? 'In Transit' : 'Pending'}</p>
                                    </div>
                                </div>

                                {/* Step 4: Delivered */}
                                <div className={`flex flex-col items-center gap-3 transition-colors ${currentStep >= 4 ? 'text-primary' : 'text-text-secondary/50'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-surface transition-all
                                        ${currentStep >= 4 ? 'border-accent text-accent shadow-lg scale-110' : 'border-secondary/20'}`}>
                                        <CheckCircle size={20} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm uppercase tracking-wide">Delivered</p>
                                        <p className="text-xs text-text-secondary mt-1">{currentStep >= 4 ? 'Arrived' : 'In Progress'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Order Items */}
                        <div className="mt-8 pt-8 border-t border-secondary/10">
                            <h3 className="font-heading text-lg font-bold text-primary mb-6">Order Items</h3>
                            <div className="space-y-4">
                                {order.orderItems?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center border border-secondary/10 p-4 rounded-sm bg-background">
                                        <div className="w-16 h-16 bg-surface rounded-sm flex-shrink-0 border border-secondary/10 p-1">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { e.target.src = '/placeholder.png' }}
                                            />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="font-bold text-primary text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Qty: {item.quantity} × <span className="font-medium">₹{(item.price || 0).toFixed(2)}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary text-sm">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="mt-6 flex justify-end">
                                <div className="w-full md:w-1/2 lg:w-1/3 bg-secondary/5 p-4 rounded-sm space-y-2">
                                    <div className="flex justify-between text-xs text-text-secondary">
                                        <span>Subtotal</span>
                                        <span>₹{(order.itemsPrice || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-text-secondary">
                                        <span>Tax</span>
                                        <span>₹{(order.taxPrice || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-text-secondary">
                                        <span>Shipping</span>
                                        <span>{order.shippingPrice > 0 ? `₹${order.shippingPrice.toFixed(2)}` : 'Free'}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold text-primary pt-3 border-t border-secondary/10 mt-2">
                                        <span>Total</span>
                                        <span>₹{(order.totalPrice || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cancellation Section */}
                        {canCancelOrder() && (
                            <div className="mt-8 pt-8 border-t border-secondary/10">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-sm p-6">
                                    <h3 className="font-heading text-lg font-bold text-primary mb-3 flex items-center gap-2">
                                        <XCircle size={20} className="text-yellow-600" />
                                        Cancel Order
                                    </h3>
                                    <div className="mb-4 text-sm text-text-secondary space-y-2">
                                        <p className="font-semibold text-primary">Refund Policy:</p>
                                        <ul className="list-none space-y-1 pl-4">
                                            <li className="flex items-start gap-2">
                                                <span className="text-green-600 font-bold">✓</span>
                                                <span>Product Cost: ₹{(order.itemsPrice || 0).toFixed(2)} - <strong className="text-green-600">REFUNDABLE</strong></span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-green-600 font-bold">✓</span>
                                                <span>Tax: ₹{(order.taxPrice || 0).toFixed(2)} - <strong className="text-green-600">REFUNDABLE</strong></span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Delivery Charge: ₹{(order.shippingPrice || 0).toFixed(2)} - <strong className="text-red-600">NON-REFUNDABLE</strong></span>
                                            </li>
                                        </ul>
                                        <div className="mt-3 pt-3 border-t border-secondary/20">
                                            <p className="font-bold text-primary">
                                                Total Refund Amount: ₹{((order.itemsPrice || 0) + (order.taxPrice || 0)).toFixed(2)}
                                            </p>
                                            {order.isPaid && (
                                                <p className="text-xs mt-1">Refund will be processed to your wallet or original payment method</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCancelOrder}
                                        disabled={cancelling}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <XCircle size={18} />
                                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Cancel Message */}
                        {cancelMessage && (
                            <div className={`mt-4 p-4 rounded-sm ${cancelMessage.includes('Error') ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                                {cancelMessage}
                            </div>
                        )}

                        {/* Cancelled Order Notice */}
                        {order.status === 'Cancelled' && (
                            <div className="mt-8 pt-8 border-t border-secondary/10">
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm p-6">
                                    <h3 className="font-heading text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                                        <XCircle size={20} />
                                        Order Cancelled
                                    </h3>
                                    <p className="text-sm text-text-secondary mb-3">This order has been cancelled.</p>
                                    {order.isRefunded && (
                                        <div className="text-sm space-y-1">
                                            <p className="font-semibold text-primary">Refund Details:</p>
                                            <p>Refund Amount: ₹{(order.refundAmount || 0).toFixed(2)}</p>
                                            {order.refundDate && (
                                                <p>Refund Date: {new Date(order.refundDate).toLocaleDateString()}</p>
                                            )}
                                            <p className="text-xs text-text-secondary mt-2">
                                                Note: Delivery charges (₹{(order.shippingPrice || 0).toFixed(2)}) are non-refundable.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                )
                }
            </div >
        </div >
    );
};

export default TrackOrder;
