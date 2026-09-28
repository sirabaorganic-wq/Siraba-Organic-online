import React, { useState, useEffect } from 'react';
import {
    Search, Package, CheckCircle, Truck, Clock, MapPin, XCircle,
    AlertCircle, ExternalLink, ShieldCheck, ArrowLeft, RefreshCw,
    FileText, Phone, CreditCard, Lock
} from 'lucide-react';
import client from '../api/client';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useCurrency } from '../context/CurrencyContext';
import SEO from '../components/SEO';

const TrackOrder = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cancelOrder } = useOrders();
    const { formatPrice } = useCurrency();

    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [errorCode, setErrorCode] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelMessage, setCancelMessage] = useState('');
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    const fetchOrder = async (id, isRefresh = false) => {
        if (!id || !id.trim()) return;
        const cleanId = id.trim();

        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        setErrorCode(null);

        try {
            // Call authenticated tracking endpoint with live carrier sync
            const { data } = await client.get(`/orders/${cleanId}/tracking?live=true`);
            setOrder(data);
        } catch (err) {
            console.error('Fetch tracking error:', err);
            const status = err.response?.status;
            setErrorCode(status);

            if (status === 401) {
                setError('Please log in with your account to view order tracking details.');
            } else if (status === 403) {
                setError('Access Denied: This order does not belong to your account.');
            } else if (status === 404) {
                setError('Order not found. Please verify the Order ID.');
            } else {
                setError(err.response?.data?.message || 'Failed to fetch order tracking information.');
            }
            setOrder(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
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
        if (orderId && orderId.trim()) {
            fetchOrder(orderId.trim());
        }
    };

    const handleDownloadInvoice = async (id) => {
        setDownloadingInvoice(true);
        try {
            const response = await client.get(`/invoices/${id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${id.slice(-8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (downloadErr) {
            console.error('Failed to download invoice', downloadErr);
            alert('Unable to download invoice at this moment. Please try again later.');
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;

        const refundAmount = (order.itemsPrice || 0) + (order.taxPrice || 0);
        const deliveryCharge = order.shippingPrice || 0;

        const confirmMessage =
            `Are you sure you want to cancel Order #${order._id.slice(-8)}?\n\n` +
            `CANCELLATION & REFUND POLICY:\n` +
            `✓ Product Items: ${formatPrice(order.itemsPrice || 0)} (Refundable)\n` +
            `✓ Taxes: ${formatPrice(order.taxPrice || 0)} (Refundable)\n` +
            `✗ Delivery Fee: ${formatPrice(deliveryCharge)} (Non-Refundable)\n\n` +
            `Total Refundable Amount: ${formatPrice(refundAmount)}\n` +
            (order.isPaid ? 'Refund will be processed to your wallet or original payment source.' : 'No payment was captured.');

        if (!window.confirm(confirmMessage)) return;

        setCancelling(true);
        setCancelMessage('');

        const result = await cancelOrder(order._id);

        if (result.success) {
            setCancelMessage('Order cancelled successfully. Refund has been initiated.');
            fetchOrder(order._id, true);
        } else {
            setCancelMessage(`Cancellation Failed: ${result.message}`);
        }

        setCancelling(false);
    };

    const canCancelOrder = () => {
        if (!order || !user) return false;
        if (order.canCancel !== undefined) return order.canCancel;
        const nonCancellable = ['shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
        const normalizedStatus = String(order.status || '').toLowerCase();
        return !nonCancellable.includes(normalizedStatus) && !order.isDelivered;
    };

    const getStatusBadge = (status) => {
        const s = String(status || '').toLowerCase();
        if (s.includes('delivered')) return { label: 'Delivered', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
        if (s.includes('out_for_delivery') || s.includes('out for delivery')) return { label: 'Out for Delivery', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
        if (s.includes('shipped') || s.includes('in_transit') || s.includes('in transit')) return { label: 'In Transit', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
        if (s.includes('processing') || s.includes('pickup_scheduled') || s.includes('approved')) return { label: 'Processing', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
        if (s.includes('cancel')) return { label: 'Cancelled', bg: 'bg-red-100 text-red-800 border-red-200' };
        if (s.includes('return')) return { label: 'Returned', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
        return { label: status || 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    };

    // Normalized progress step for visual timeline
    const getProgressStep = (status) => {
        const s = String(status || '').toLowerCase();
        if (s.includes('delivered')) return 5;
        if (s.includes('out_for_delivery') || s.includes('out for delivery')) return 4;
        if (s.includes('shipped') || s.includes('in_transit') || s.includes('in transit')) return 3;
        if (s.includes('processing') || s.includes('pickup_scheduled') || s.includes('approved')) return 2;
        if (s.includes('pending')) return 1;
        return 1;
    };

    const isOrderCancelled = order && (String(order.status).toLowerCase().includes('cancel') || order.isCancelled);

    return (
        <div className="min-h-screen bg-background pt-24 pb-16 px-4">
            <SEO title="Track Order | Siraba Organic" noindex={true} />
            <div className="max-w-5xl mx-auto">

                {/* Back to Account Link */}
                <div className="mb-6">
                    <Link to="/account" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to My Orders
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <h1 className="font-heading text-4xl font-bold text-primary mb-2">Track Your Order</h1>
                    <p className="text-text-secondary text-sm">
                        View real-time delivery status, package tracking numbers, and courier progress.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="bg-surface shadow-sm rounded-sm p-6 mb-8 border border-secondary/15">
                    <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-grow relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                            <input
                                type="text"
                                placeholder="Enter Order ID (e.g. 64f1a2b3...)"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-background border border-secondary/20 rounded-sm focus:outline-none focus:border-primary text-sm font-mono transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !orderId.trim()}
                            className="bg-primary text-surface px-6 py-3 font-bold uppercase text-xs tracking-widest hover:bg-accent hover:text-primary transition-colors rounded-sm disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Track'}
                        </button>
                    </form>

                    {/* Unauthenticated Alert */}
                    {!user && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm text-amber-900 text-xs flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Lock size={14} className="text-amber-700" />
                                For security, order tracking requires logging in with the account that placed the order.
                            </span>
                            <button
                                onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/track-order?orderId=${orderId}`)}`)}
                                className="font-bold underline hover:text-primary"
                            >
                                Log In
                            </button>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Order Details View */}
                {order && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Top Summary Banner */}
                        <div className="bg-surface shadow-sm rounded-sm p-6 border border-secondary/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-primary text-lg">#{order._id}</span>
                                    <span className={`px-2.5 py-0.5 rounded-sm border text-[11px] font-bold uppercase tracking-wider ${getStatusBadge(order.status).bg}`}>
                                        {getStatusBadge(order.status).label}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-sm border text-[11px] font-bold uppercase tracking-wider bg-secondary/5 text-text-secondary border-secondary/20">
                                        {order.paymentMethod} • {order.isPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                </div>
                                <p className="text-xs text-text-secondary mt-1">
                                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                <button
                                    onClick={() => fetchOrder(order._id, true)}
                                    disabled={refreshing}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-secondary/5 hover:bg-secondary/10 border border-secondary/20 rounded-sm text-xs font-bold text-primary transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                                    {refreshing ? 'Refreshing...' : 'Refresh Status'}
                                </button>
                                <button
                                    onClick={() => handleDownloadInvoice(order._id)}
                                    disabled={downloadingInvoice}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-surface hover:bg-accent hover:text-primary transition-colors rounded-sm text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    <FileText size={14} />
                                    {downloadingInvoice ? 'Downloading...' : 'Invoice'}
                                </button>
                            </div>
                        </div>

                        {/* Order Timeline */}
                        {!isOrderCancelled ? (
                            <div className="bg-surface shadow-sm rounded-sm p-6 md:p-8 border border-secondary/15">
                                <h3 className="font-heading text-base font-bold text-primary mb-6 flex items-center gap-2">
                                    <Truck size={18} className="text-secondary" /> Fulfillment Timeline
                                </h3>

                                <div className="relative py-4 px-2 sm:px-6">
                                    {/* Desktop Progress Line */}
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary/15 -translate-y-1/2 hidden md:block"></div>
                                    <div
                                        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 transition-all duration-700 hidden md:block"
                                        style={{ width: `${((Math.max(1, getProgressStep(order.status)) - 1) / 4) * 100}%` }}
                                    ></div>

                                    {/* Timeline Milestones */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2 relative z-10">
                                        {[
                                            { step: 1, label: 'Order Placed', desc: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), icon: Package },
                                            { step: 2, label: 'Confirmed', desc: order.isPaid ? 'Payment Verified' : 'COD Approved', icon: ShieldCheck },
                                            { step: 3, label: 'In Transit', desc: order.vendorOrders?.some(v => v.courierName) ? order.vendorOrders.find(v => v.courierName)?.courierName : 'Dispatched', icon: Truck },
                                            { step: 4, label: 'Out for Delivery', desc: 'Arriving Today', icon: Clock },
                                            { step: 5, label: 'Delivered', desc: order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Destination', icon: CheckCircle },
                                        ].map((milestone) => {
                                            const currentProg = getProgressStep(order.status);
                                            const isDone = milestone.step <= currentProg;
                                            const isCurrent = milestone.step === currentProg;
                                            const IconComp = milestone.icon;

                                            return (
                                                <div key={milestone.step} className="flex md:flex-col items-center md:text-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                                                        isDone ? 'bg-primary text-surface border-primary shadow-sm' : 'bg-surface text-secondary/40 border-secondary/20'
                                                    }`}>
                                                        <IconComp size={18} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold uppercase tracking-wider ${isDone ? 'text-primary' : 'text-text-secondary/60'}`}>
                                                            {milestone.label}
                                                        </p>
                                                        <p className="text-[11px] text-text-secondary mt-0.5">
                                                            {milestone.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 border border-red-200 rounded-sm p-6">
                                <div className="flex items-center gap-3 text-red-800 font-bold mb-2">
                                    <XCircle size={22} className="text-red-600" />
                                    <span>This order has been cancelled</span>
                                </div>
                                <p className="text-xs text-red-700">
                                    {order.isRefunded
                                        ? `Refund of ${formatPrice(order.refundAmount)} was processed on ${order.refundDate ? new Date(order.refundDate).toLocaleDateString() : 'recently'}.`
                                        : 'No further delivery attempts will be made for this order.'}
                                </p>
                            </div>
                        )}

                        {/* Shipment / Courier Breakdown (Multi-Vendor Aware) */}
                        <div className="bg-surface shadow-sm rounded-sm p-6 md:p-8 border border-secondary/15">
                            <h3 className="font-heading text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                <Truck size={18} className="text-secondary" /> Package & Courier Tracking
                            </h3>

                            {order.vendorOrders && order.vendorOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {order.vendorOrders.map((shipment, sIdx) => (
                                        <div key={shipment.vendorOrderId || sIdx} className="border border-secondary/15 rounded-sm p-4 sm:p-5 bg-background">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-secondary/10 pb-4 mb-4">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Package {sIdx + 1} of {order.vendorOrders.length}</span>
                                                    <h4 className="font-bold text-primary text-sm flex items-center gap-2">
                                                        Seller: {shipment.vendorName || 'Verified Organic Partner'}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-0.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(shipment.status).bg}`}>
                                                        {getStatusBadge(shipment.status).label}
                                                    </span>
                                                    {shipment.trackingUrl && (
                                                        <a
                                                            href={shipment.trackingUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary underline hover:text-accent ml-2"
                                                        >
                                                            Shiprocket Tracking <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Shipment Courier Details */}
                                            {shipment.awbCode || shipment.courierName ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface p-3 rounded-sm border border-secondary/10 mb-4 text-xs">
                                                    <div>
                                                        <p className="text-text-secondary uppercase text-[10px] font-bold">Courier Partner</p>
                                                        <p className="font-bold text-primary mt-0.5">{shipment.courierName || 'Shiprocket Air Express'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-text-secondary uppercase text-[10px] font-bold">AWB / Tracking Number</p>
                                                        <p className="font-mono font-bold text-primary mt-0.5">{shipment.awbCode || 'Pending Assignment'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-text-secondary uppercase text-[10px] font-bold">Shipment Reference</p>
                                                        <p className="font-mono text-text-secondary mt-0.5">{shipment.shipmentId ? `#${shipment.shipmentId}` : 'Generated'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-secondary/5 rounded-sm border border-secondary/10 mb-4 text-xs text-text-secondary flex items-center gap-2">
                                                    <Clock size={14} className="text-secondary flex-shrink-0" />
                                                    <span>Shipment is being prepared by the vendor. Courier partner & AWB tracking number will be assigned once picked up.</span>
                                                </div>
                                            )}

                                            {/* Package Items */}
                                            <div className="space-y-2">
                                                <p className="text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Items in this Package:</p>
                                                {shipment.items?.map((item, iIdx) => (
                                                    <div key={iIdx} className="flex justify-between items-center text-xs py-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {item.image && (
                                                                <img src={item.image} alt={item.name} className="w-8 h-8 object-contain rounded-sm border border-secondary/10" />
                                                            )}
                                                            <span className="font-medium text-primary truncate">{item.name}</span>
                                                            <span className="text-text-secondary">× {item.quantity}</span>
                                                        </div>
                                                        <span className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-secondary/5 rounded-sm border border-secondary/10 text-xs text-text-secondary">
                                    <p className="font-bold text-primary mb-1">Awaiting Dispatch</p>
                                    <p>Your order has been confirmed and is currently queued for packaging. Courier tracking details will appear here as soon as the shipment is generated.</p>
                                </div>
                            )}
                        </div>

                        {/* Delivery & Payment Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Shipping Address */}
                            <div className="bg-surface shadow-sm rounded-sm p-6 border border-secondary/15">
                                <h3 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
                                    <MapPin size={18} className="text-secondary" /> Delivery Address
                                </h3>
                                <div className="text-xs text-text-secondary space-y-1 leading-relaxed">
                                    <p className="font-bold text-primary text-sm">{order.shippingAddress?.name || user?.name || 'Customer'}</p>
                                    <p>{order.shippingAddress?.address}</p>
                                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                    {order.shippingAddress?.landmark && <p>Landmark: {order.shippingAddress.landmark}</p>}
                                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}</p>
                                    <p>{order.shippingAddress?.country || 'India'}</p>
                                    <p className="mt-2 text-primary font-medium flex items-center gap-1.5">
                                        <Phone size={13} /> {order.shippingAddress?.phone || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Payment & Charges Summary */}
                            <div className="bg-surface shadow-sm rounded-sm p-6 border border-secondary/15 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-heading text-base font-bold text-primary mb-4 flex items-center gap-2">
                                        <CreditCard size={18} className="text-secondary" /> Payment & Billing Summary
                                    </h3>
                                    <div className="space-y-2 text-xs text-text-secondary border-b border-secondary/10 pb-4 mb-4">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>{formatPrice(order.itemsPrice || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>GST / Taxes</span>
                                            <span>{formatPrice(order.taxPrice || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Delivery Charge</span>
                                            <span>{(order.shippingPrice || 0) > 0 ? formatPrice(order.shippingPrice) : 'Free Delivery'}</span>
                                        </div>
                                        {(order.discountAmount || 0) > 0 && (
                                            <div className="flex justify-between text-emerald-700 font-bold">
                                                <span>Coupon Discount</span>
                                                <span>-{formatPrice(order.discountAmount)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-primary text-sm uppercase tracking-wider">Total Paid</span>
                                    <span className="font-bold text-primary text-xl">{formatPrice(order.totalPrice || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cancellation Section */}
                        {canCancelOrder() && (
                            <div className="bg-amber-50 border border-amber-200 rounded-sm p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                                            <XCircle size={16} className="text-amber-700" /> Cancel Order Option
                                        </h4>
                                        <p className="text-xs text-amber-800 mt-1">
                                            You can cancel this order before dispatch. Product costs and taxes will be fully refunded.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCancelOrder}
                                        disabled={cancelling}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                                    >
                                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                                    </button>
                                </div>
                                {cancelMessage && (
                                    <p className="mt-3 text-xs font-bold text-red-800 bg-red-100 p-2 rounded-sm">{cancelMessage}</p>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackOrder;
