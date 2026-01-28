import React, { useState, useEffect } from 'react';
import {
    Lock, Mail, Truck, PackageCheck, Phone, Star, X, CreditCard, ChevronDown, Filter, Search, Eye, EyeOff, Wallet, LayoutDashboard,
    User, Heart, Package, MapPin, Settings, HelpCircle, LogOut, CheckCircle, Clock, History, Ban, Download, FileText
} from 'lucide-react';
import client from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useCurrency } from '../context/CurrencyContext';
import PhoneInput from '../components/PhoneInput';

// Subcode for Wishlist Grid to handle fetching
const WishlistGrid = () => {
    const { fetchWishlist, toggleWishlist } = useAuth();
    const { formatPrice } = useCurrency();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWishlist = async () => {
            const items = await fetchWishlist();
            setWishlistItems(items);
            setLoading(false);
        };
        loadWishlist();
    }, [fetchWishlist]);

    if (loading) return <div className="text-center text-xs text-text-secondary">Loading wishlist...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map(item => (
                <div key={item._id} className="border border-secondary/10 rounded-sm overflow-hidden bg-background group">
                    <div className="relative h-48 bg-white p-4">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                        <button
                            onClick={async () => {
                                await toggleWishlist(item._id);
                                setWishlistItems(prev => prev.filter(i => i._id !== item._id));
                            }}
                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50"
                        >
                            <Heart size={16} fill="currentColor" />
                        </button>
                    </div>
                    <div className="p-4">
                        <h4 className="font-bold text-primary truncate">{item.name}</h4>
                        <p className="text-accent font-bold mt-1">{formatPrice(item.price)}</p>
                        <Link to={`/product/${item._id}`} className="block text-center mt-3 text-xs font-bold uppercase tracking-wider text-text-secondary border border-secondary/20 py-2 rounded-sm hover:border-primary hover:text-primary transition-colors">
                            View Product
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Account = () => {
    const { user, login, register, logout, isAdmin, updateProfile } = useAuth();
    const { orders } = useOrders();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, price-high, price-low
    const [refundLogs, setRefundLogs] = useState([]);

    useEffect(() => {
        if (activeTab === 'refunds') {
            client.get('/refunds/my-logs')
                .then(res => setRefundLogs(res.data))
                .catch(err => console.error(err));
        }
    }, [activeTab]);

    // Redirect admin users to admin dashboard
    useEffect(() => {
        if (user && isAdmin) {
            navigate('/admin/dashboard');
        }
    }, [user, isAdmin, navigate]);

    // Auth Form State
    const [isRegistering, setIsRegistering] = useState(false);
    const [authData, setAuthData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [authError, setAuthError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use actual user data
    const userProfile = {
        name: user?.name || "Guest User",
        email: user?.email || "guest@example.com",
        phone: user?.phone || "",
        altPhone: user?.altPhone || "",
        dob: user?.dob || "",
        gender: user?.gender || "Male",
        loyaltyPoints: 120 // Placeholder for future feature
    };

    // Helper function to get order status details
    const getOrderStatusInfo = (status) => {
        const statusMap = {
            'Pending': { color: 'yellow', icon: Clock, step: 1, label: 'Order Placed' },
            'Approved': { color: 'blue', icon: CheckCircle, step: 2, label: 'Confirmed' },
            'Packed': { color: 'purple', icon: PackageCheck, step: 3, label: 'Packed' },
            'Shipped': { color: 'indigo', icon: Truck, step: 4, label: 'Shipped' }
        };
        return statusMap[status] || statusMap['Pending'];
    };

    // Address Form State
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: ''
    });



    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create updated addresses array
            const updatedAddresses = [...(user.addresses || []), { ...newAddress, isDefault: user.addresses?.length === 0 }];

            const res = await updateProfile({ addresses: updatedAddresses });
            if (res.success) {
                setIsAddingAddress(false);
                setNewAddress({
                    address: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'India',
                    phone: ''
                });
            } else {
                alert(res.message);
            }
        } catch (error) {
            console.error("Failed to add address", error);
        }
    };



    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedProductForReview, setSelectedProductForReview] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Profile Update Logic
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone: '',
        altPhone: '',
        dob: '',
        gender: 'Male'
    });



    // Return Modal State
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

    const handleOpenReturnModal = (orderId) => {
        setSelectedOrderForReturn(orderId);
        setReturnReason('');
        setReturnModalOpen(true);
    };

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOrderForReturn) return;

        setIsSubmittingReturn(true);
        try {
            await client.post(`/orders/${selectedOrderForReturn}/return`, {
                reason: returnReason
            });
            alert('Return requested successfully!');
            setReturnModalOpen(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to request return');
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order? Only product price + tax will be refunded. Delivery charges are non-refundable.")) return;

        try {
            await client.post(`/orders/${orderId}/cancel`);
            alert("Order cancelled successfully");
            window.location.reload();
        } catch (error) {
            console.error("Cancellation Failed", error);
            alert(error.response?.data?.message || "Failed to cancel order");
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const response = await client.get(`/invoices/${orderId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${orderId.slice(-8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download invoice", error);
            alert("Failed to download invoice. Please try again later.");
        }
    };

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Notification Preferences State
    const [notifications, setNotifications] = useState({
        orderUpdates: true,
        promotions: false
    });

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
        if (confirmDelete) {
            try {
                await client.delete('/auth/profile');
                logout();
                alert("Your account has been successfully deleted.");
            } catch (error) {
                console.error("Failed to delete account:", error);
                alert(error.response?.data?.message || "Failed to delete account. Please try again.");
            }
        }
    };

    const [gstConfig, setGstConfig] = useState({
        enabled: false,
        claimed: false,
        gstNumber: ''
    });

    useEffect(() => {
        if (user) {
            // Format date properly for date input (YYYY-MM-DD format)
            const formattedDob = user.dob
                ? new Date(user.dob).toISOString().split('T')[0]
                : '';

            setProfileForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                altPhone: user.altPhone || '',
                dob: formattedDob,
                gender: user.gender || 'Male'
            });

            if (user.notificationPreferences) {
                setNotifications(user.notificationPreferences);
            }

            // Fetch GST Settings & User Claim Status
            const fetchGSTData = async () => {
                try {
                    const [settingsRes, userRes] = await Promise.all([
                        client.get('/gst/settings'),
                        client.get('/gst/claim/user')
                    ]);

                    setGstConfig({
                        enabled: settingsRes.data.gst_enabled,
                        claimed: userRes.data.claim_gst,
                        gstNumber: userRes.data.user_gst_number || ''
                    });
                } catch (error) {
                    console.error("Failed to fetch GST data", error);
                }
            };
            fetchGSTData();
        }
    }, [user]);

    const handleGSTUpdate = async (claimed, number) => {
        try {
            const res = await client.put('/gst/claim/user', {
                claim_gst: claimed,
                user_gst_number: number
            });
            if (res.data.success) {
                setGstConfig(prev => ({
                    ...prev,
                    claimed: res.data.claim_gst,
                    gstNumber: res.data.user_gst_number || ''
                }));
                // alert('GST settings updated successfully');
            }
        } catch (error) {
            console.error("Failed to update GST settings", error);
            alert("Failed to update GST settings");
        }
    };

    const handleNotificationToggle = async (key) => {
        const updatedNotifications = { ...notifications, [key]: !notifications[key] };
        setNotifications(updatedNotifications);

        try {
            await updateProfile({ notificationPreferences: updatedNotifications });
        } catch (error) {
            console.error("Failed to update notification preferences", error);
            // Revert on failure
            setNotifications(notifications);
        }
    };

    const handleProfileUpdate = async () => {
        setIsUpdatingProfile(true);
        try {
            const res = await updateProfile(profileForm);
            if (res.success) {
                alert('Profile updated successfully!');
            } else {
                alert(res.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update failed', error);
            alert('An error occurred while updating profile.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleOpenReviewModal = (productId) => {
        setSelectedProductForReview(productId);
        setReviewRating(5);
        setReviewComment('');
        setReviewModalOpen(true);
    };

    const closeReviewModal = () => {
        setReviewModalOpen(false);
        setSelectedProductForReview(null);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!selectedProductForReview) return;

        setIsSubmittingReview(true);
        try {
            await client.post(`/products/${selectedProductForReview}/reviews`, {
                rating: reviewRating,
                comment: reviewComment
            });
            alert('Review submitted successfully!');
            closeReviewModal();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Auth Handlers
    const handleAuthChange = (e) => {
        setAuthData({ ...authData, [e.target.name]: e.target.value });
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        setIsSubmitting(true);

        try {
            let result;
            if (isRegistering) {
                result = await register(authData.name, authData.email, authData.password);
            } else {
                result = await login(authData.email, authData.password);
            }

            if (!result.success) {
                setAuthError(result.message);
            }
        } catch (err) {
            setAuthError('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const MenuButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors rounded-sm ${activeTab === id
                ? 'bg-primary text-surface'
                : 'text-text-secondary hover:bg-secondary/10 hover:text-primary'
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    if (!user) {
        return (
            <div className="w-full pt-20 bg-background min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-surface p-8 rounded-sm shadow-md border border-secondary/10">
                    <div className="text-center mb-8">
                        <h2 className="font-heading text-3xl font-bold text-primary mb-2">
                            {isRegistering ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-text-secondary text-sm">
                            {isRegistering
                                ? 'Join Siraba Organic for a premium experience.'
                                : 'Sign in to access your orders and profile.'}
                        </p>
                    </div>

                    {authError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-sm">
                            {authError}
                        </div>
                    )}

                    <form onSubmit={handleAuthSubmit} className="space-y-5">
                        {isRegistering && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-secondary" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={authData.name}
                                        onChange={handleAuthChange}
                                        className="w-full pl-10 pr-4 py-2.5 border border-secondary/20 rounded-sm focus:border-accent focus:outline-none transition-colors"
                                        placeholder="Prasad Shaswat"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-secondary" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={authData.email}
                                    onChange={handleAuthChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-secondary/20 rounded-sm focus:border-accent focus:outline-none transition-colors"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-secondary" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={authData.password}
                                    onChange={handleAuthChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-secondary/20 rounded-sm focus:border-accent focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {!isRegistering && (
                                <div className="text-right mt-1">
                                    <Link to="/forgot-password" className="text-xs text-text-secondary hover:text-accent transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-surface py-3 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg mt-2 disabled:opacity-70"
                        >
                            {isSubmitting ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t border-secondary/10 pt-6">
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setAuthError('');
                            }}
                            className="text-sm text-text-secondary hover:text-primary transition-colors"
                        >
                            {isRegistering
                                ? 'Already have an account? Login here'
                                : "Don't have an account? Create one"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full pt-20 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar / Navigation */}
                    <div className="w-full md:w-64 flex-shrink-0 space-y-6">
                        <div className="bg-surface p-6 rounded-sm shadow-sm border border-secondary/10">
                            <div className="flex flex-col items-center text-center space-y-2 mb-6">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading text-2xl font-bold">
                                    {userProfile.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-heading text-lg font-bold text-primary">{userProfile.name}</h3>
                                    <p className="text-xs text-text-secondary">Loyalty Member</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <MenuButton id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                                <MenuButton id="profile" icon={User} label="My Profile" />
                                <MenuButton id="orders" icon={Package} label="My Orders" />
                                <MenuButton id="addresses" icon={MapPin} label="Addresses" />
                                <MenuButton id="wallet" icon={Wallet} label="Wallet" />
                                <MenuButton id="refunds" icon={History} label="Refund History" />
                                <MenuButton id="wishlist" icon={Heart} label="Wishlist" />
                                <MenuButton id="settings" icon={Settings} label="Settings" />
                                <MenuButton id="support" icon={HelpCircle} label="Support" />
                            </div>
                        </div>

                        <div className="mt-4 md:mt-0">
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-sm transition-colors"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-surface rounded-sm shadow-md border border-secondary/10 overflow-hidden min-h-[600px]">

                        {/* 1. Dashboard View */}
                        {activeTab === 'dashboard' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="flex justify-between items-center border-b border-secondary/10 pb-6">
                                    <div>
                                        <h2 className="font-heading text-3xl text-primary font-bold">My Account</h2>
                                        <p className="text-text-secondary text-sm font-light mt-1">Hello, {userProfile.name}</p>
                                    </div>
                                    <Link to="/shop" className="bg-accent text-primary px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-white transition-colors shadow-sm">
                                        Continue Shopping
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-background p-6 rounded-sm border-t-4 border-accent shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-text-secondary text-xs uppercase tracking-wider font-medium">Total Orders</p>
                                                <h3 className="text-3xl font-bold text-primary mt-2">{orders.length}</h3>
                                            </div>
                                            <Package className="text-accent/20" size={32} />
                                        </div>
                                    </div>
                                    <div className="bg-background p-6 rounded-sm border-t-4 border-primary shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-text-secondary text-xs uppercase tracking-wider font-medium">Pending Delivery</p>
                                                <h3 className="text-3xl font-bold text-primary mt-2">
                                                    {orders.filter(o => o.status !== 'Shipped').length}
                                                </h3>
                                            </div>
                                            <Truck className="text-primary/20" size={32} />
                                        </div>
                                    </div>
                                    <div className="bg-background p-6 rounded-sm border-t-4 border-secondary shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-text-secondary text-xs uppercase tracking-wider font-medium">Total Spent</p>
                                                <h3 className="text-3xl font-bold text-primary mt-2">
                                                    {formatPrice(orders
                                                        .filter(o => !['Cancelled', 'Returned'].includes(o.status))
                                                        .reduce((sum, o) => sum + (o.totalPrice || 0), 0))}
                                                </h3>
                                            </div>
                                            <CreditCard className="text-secondary/20" size={32} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-heading text-xl text-primary font-bold mb-4 flex items-center">
                                        <Clock size={20} className="mr-2 text-secondary" /> Recent Orders
                                    </h3>
                                    {orders.length > 0 ? (
                                        <div className="space-y-4">
                                            {[...orders]
                                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                .slice(0, 3)
                                                .map((order, index) => {
                                                    const statusInfo = getOrderStatusInfo(order.status);
                                                    const StatusIcon = statusInfo.icon;
                                                    const firstItem = order.orderItems?.[0];

                                                    return (
                                                        <div
                                                            key={order._id}
                                                            style={{ animationDelay: `${index * 100}ms` }}
                                                            className="flex flex-col md:flex-row justify-between items-center border border-secondary/10 p-4 rounded-sm bg-background/50 hover:bg-background transition-all hover:shadow-sm animate-fade-in-up"
                                                        >
                                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                                {firstItem?.image ? (
                                                                    <div className="relative">
                                                                        <img src={firstItem.image} alt={firstItem.name} className="w-14 h-14 object-cover rounded-sm border border-secondary/10" />
                                                                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-white border border-secondary/10`}>
                                                                            <StatusIcon size={12} className={`text-${statusInfo.color}-600`} />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className={`w-14 h-14 rounded-sm flex items-center justify-center bg-${statusInfo.color}-50 text-${statusInfo.color}-600`}>
                                                                        <StatusIcon size={24} />
                                                                    </div>
                                                                )}

                                                                <div>
                                                                    <h4 className="font-bold text-primary text-sm line-clamp-1">
                                                                        {firstItem?.name || 'Order'}
                                                                        {order.orderItems?.length > 1 && <span className="text-text-secondary font-normal text-xs ml-1">+{order.orderItems.length - 1} more</span>}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-xs font-mono text-text-secondary bg-secondary/5 px-1.5 py-0.5 rounded-sm">#{order._id.slice(-6).toUpperCase()}</span>
                                                                        <span className="text-xs text-text-secondary">• {new Date(order.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                                                <div className="text-right">
                                                                    <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">Total</p>
                                                                    <span className="font-bold text-primary">{formatPrice(order.totalPrice)}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => setActiveTab('orders')}
                                                                    className="px-4 py-2 bg-white border border-secondary/20 text-xs font-bold uppercase tracking-wider text-primary hover:bg-secondary/5 hover:border-secondary/40 transition-colors rounded-sm"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border border-dashed border-secondary/20 rounded-sm bg-secondary/5">
                                            <Package size={32} className="mx-auto text-secondary/40 mb-3" />
                                            <p className="text-text-secondary text-sm mb-4">No recent orders found.</p>
                                            <Link to="/shop" className="text-accent underline hover:text-primary text-sm font-medium">Start Shopping</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. Profile View */}
                        {activeTab === 'profile' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="border-b border-secondary/10 pb-6">
                                    <h2 className="font-heading text-3xl text-primary font-bold">My Profile</h2>
                                    <p className="text-text-secondary text-sm font-light mt-1">Manage your personal information.</p>
                                </div>

                                <div className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">Full Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.name}
                                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                className="w-full border-b border-secondary/20 bg-transparent py-2 focus:outline-none focus:border-accent text-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">Email Address</label>
                                            <input
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                className="w-full border-b border-secondary/20 bg-transparent py-2 focus:outline-none focus:border-accent text-primary"
                                            />
                                        </div>
                                        <PhoneInput
                                            label="Phone Number"
                                            value={profileForm.phone}
                                            onChange={(value) => setProfileForm({ ...profileForm, phone: value })}
                                            placeholder="Enter your mobile number"
                                            required={true}
                                        />
                                        <PhoneInput
                                            label="Alternate Phone"
                                            value={profileForm.altPhone}
                                            onChange={(value) => setProfileForm({ ...profileForm, altPhone: value })}
                                            placeholder="Enter alternate number"
                                            required={false}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={profileForm.dob}
                                                onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                                                className="w-full border-b border-secondary/20 bg-transparent py-2 focus:outline-none focus:border-accent text-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">Gender</label>
                                            <select
                                                value={profileForm.gender}
                                                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                                                className="w-full border-b border-secondary/20 bg-transparent py-2 focus:outline-none focus:border-accent text-primary"
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* GST Section */}
                                    {gstConfig.enabled && (
                                        <div className="mt-8 pt-6 border-t border-secondary/10">
                                            <h3 className="font-heading text-lg font-bold text-primary mb-4">Tax Information</h3>
                                            <div className="bg-background p-4 rounded-sm border border-secondary/10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="font-bold text-sm text-primary">Claim GST Input Credit</p>
                                                        <p className="text-xs text-text-secondary mt-1">Enable to get GST invoice with your GSTIN.</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={gstConfig.claimed}
                                                            onChange={(e) => handleGSTUpdate(e.target.checked, gstConfig.gstNumber)}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                    </label>
                                                </div>

                                                {gstConfig.claimed && (
                                                    <div className="space-y-2 animate-fade-in">
                                                        <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">Your GST Number</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={gstConfig.gstNumber}
                                                                onChange={(e) => setGstConfig({ ...gstConfig, gstNumber: e.target.value.toUpperCase() })}
                                                                placeholder="e.g. 29ABCDE1234F1Z5"
                                                                className="flex-1 border-b border-secondary/20 bg-transparent py-2 focus:outline-none focus:border-accent text-primary uppercase font-mono"
                                                            />
                                                            <button
                                                                onClick={() => handleGSTUpdate(true, gstConfig.gstNumber)}
                                                                className="px-4 py-2 bg-secondary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-secondary/20"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-text-secondary italic">Ensure your GSTIN is correct for valid input credit.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-4">
                                        <button
                                            onClick={handleProfileUpdate}
                                            disabled={isUpdatingProfile}
                                            className="bg-primary text-surface px-8 py-3 text-sm font-medium uppercase tracking-wider hover:bg-accent hover:text-primary transition-colors rounded-sm shadow-md disabled:opacity-70"
                                        >
                                            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Orders View */}
                        {activeTab === 'orders' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="border-b border-secondary/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-heading text-3xl text-primary font-bold">My Orders</h2>
                                        <p className="text-text-secondary text-sm font-light mt-1">Track your shipment status and order history.</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search Order ID..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 pr-4 py-2 border border-secondary/20 rounded-sm text-sm focus:outline-none focus:border-primary w-full sm:w-64"
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(e.target.value)}
                                                className="appearance-none pl-4 pr-10 py-2 border border-secondary/20 rounded-sm text-sm focus:outline-none focus:border-primary bg-white cursor-pointer w-full sm:w-auto"
                                            >
                                                <option value="newest">Newest First</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="price-high">Price: High to Low</option>
                                                <option value="price-low">Price: Low to High</option>
                                            </select>
                                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" size={14} />
                                        </div>
                                    </div>
                                </div>

                                {orders.length > 0 ? (
                                    <div className="space-y-6">
                                        {orders
                                            .filter(order => order._id.toLowerCase().includes(searchQuery.toLowerCase()) || order.orderItems.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())))
                                            .sort((a, b) => {
                                                if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
                                                if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
                                                if (sortOrder === 'price-high') return b.totalPrice - a.totalPrice;
                                                if (sortOrder === 'price-low') return a.totalPrice - b.totalPrice;
                                                return 0;
                                            })
                                            .map((order) => {
                                                const statusInfo = getOrderStatusInfo(order.status);
                                                return (
                                                    <div key={order._id} className="border border-secondary/10 rounded-sm bg-background hover:shadow-md transition-shadow overflow-hidden group">
                                                        {/* Card Header */}
                                                        <div className="bg-secondary/5 p-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-white border border-secondary/10 flex items-center justify-center font-heading font-bold text-primary text-xs shadow-sm">
                                                                    #{order._id.slice(-4).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                                                                            {order.status}
                                                                        </span>
                                                                        <span className="text-secondary text-xs">•</span>
                                                                        <span className="text-xs text-text-secondary">Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <p className="text-xs text-text-secondary mt-1 font-mono">ID: #{order._id}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                                <div className="text-right">
                                                                    <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">Total Amount</p>
                                                                    <p className="font-bold text-primary text-lg">{formatPrice(order.totalPrice)}</p>
                                                                </div>
                                                                <Link to={`/track-order?orderId=${order._id}`} className="bg-white border border-secondary/20 hover:bg-secondary/5 text-primary text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm transition-colors shadow-sm hidden md:block">
                                                                    Track Order
                                                                </Link>
                                                                {!['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].includes(order.status) && (
                                                                    <button
                                                                        onClick={() => handleCancelOrder(order._id)}
                                                                        className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm transition-colors shadow-sm ml-2"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}
                                                                {(order.status === 'Delivered' || order.status === 'delivered') && (!order.returnStatus || order.returnStatus === 'None') && (
                                                                    <button
                                                                        onClick={() => handleOpenReturnModal(order._id)}
                                                                        className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm transition-colors shadow-sm ml-2"
                                                                    >
                                                                        Return
                                                                    </button>
                                                                )}
                                                                {order.returnStatus && order.returnStatus !== 'None' && (
                                                                    <span className="bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm ml-2">
                                                                        Return: {order.returnStatus}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Card Body */}
                                                        <div className="p-4 md:p-6">
                                                            {/* Items */}
                                                            <div className="space-y-4 mb-6">
                                                                {order.orderItems?.map((item, idx) => (
                                                                    <div key={idx} className="flex gap-4 items-center">
                                                                        <div className="w-14 h-14 bg-surface rounded-sm flex-shrink-0 border border-secondary/10 p-1">
                                                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                                                        </div>
                                                                        <div className="flex-grow min-w-0">
                                                                            <p className="font-bold text-primary text-sm truncate">{item.name}</p>
                                                                            <p className="text-xs text-text-secondary mt-0.5">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="font-bold text-primary text-sm">{formatPrice(item.quantity * item.price)}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Price Breakdown */}
                                                            <div className="mb-6 pt-4 border-t border-secondary/10 space-y-2 bg-secondary/5 p-4 rounded-sm">
                                                                <div className="flex justify-between text-xs text-text-secondary">
                                                                    <span>Subtotal</span>
                                                                    <span>{formatPrice(order.itemsPrice || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs text-text-secondary">
                                                                    <span>Tax</span>
                                                                    <span>{formatPrice(order.taxPrice || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs text-text-secondary">
                                                                    <span>Delivery Charge</span>
                                                                    <span>{order.shippingPrice > 0 ? formatPrice(order.shippingPrice) : 'Free'}</span>
                                                                </div>
                                                                {order.discountAmount > 0 && (
                                                                    <div className="flex justify-between text-xs text-green-600 font-medium">
                                                                        <span>Discount</span>
                                                                        <span>-{formatPrice(order.discountAmount)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t border-secondary/10 mt-2">
                                                                    <span>Total</span>
                                                                    <span>{formatPrice(order.totalPrice)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Actions Row */}
                                                            <div className="flex justify-between items-center mb-6">
                                                                <button
                                                                    onClick={() => handleDownloadInvoice(order._id)}
                                                                    className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider hover:text-accent transition-colors"
                                                                >
                                                                    <FileText size={16} /> Download Invoice
                                                                </button>
                                                            </div>

                                                            {/* Progress Bar - Simplified for Card */}
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase text-text-secondary mb-3 tracking-wider">Order Progress</p>
                                                                <div className="relative">
                                                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-secondary/10 -translate-y-1/2 rounded-full"></div>
                                                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((statusInfo.step - 1) / 4) * 100}%` }}></div>

                                                                    <div className="relative flex justify-between">
                                                                        {['Placed', 'Confirmed', 'Packed', 'Shipped'].map((step, idx) => {
                                                                            const isCompleted = idx < statusInfo.step;
                                                                            const isCurrent = idx === statusInfo.step - 1;

                                                                            return (
                                                                                <div key={step} className="flex flex-col items-center gap-2">
                                                                                    <div className={`w-3 h-3 rounded-full border-2 transition-colors z-10 ${isCompleted || isCurrent ? 'bg-primary border-primary' : 'bg-background border-secondary/30'}`}></div>
                                                                                    <span className={`text-[10px] font-medium transition-colors ${isCompleted || isCurrent ? 'text-primary' : 'text-secondary/50'}`}>{step}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                <div className="md:hidden mt-6 pt-4 border-t border-secondary/10">
                                                                    <Link to={`/track-order?orderId=${order._id}`} className="block w-full text-center bg-white border border-secondary/20 hover:bg-secondary/5 text-primary text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-sm transition-colors shadow-sm">
                                                                        Track Order
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border border-dashed border-secondary/20 rounded-sm bg-secondary/5">
                                        <Package size={32} className="mx-auto text-secondary/40 mb-3" />
                                        <p className="text-text-secondary text-sm mb-4">No orders found matching your criteria.</p>
                                        <button onClick={() => { setSearchQuery(''); setSortOrder('newest'); }} className="text-accent underline hover:text-primary text-sm font-medium">Clear Filters</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. Addresses View */}
                        {activeTab === 'addresses' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="border-b border-secondary/10 pb-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="font-heading text-3xl text-primary font-bold">My Addresses</h2>
                                        <p className="text-text-secondary text-sm font-light mt-1">Manage your shipping addresses.</p>
                                    </div>
                                    {!isAddingAddress && (
                                        <button
                                            onClick={() => setIsAddingAddress(true)}
                                            className="bg-primary text-surface px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-accent hover:text-primary transition-colors flex items-center gap-2"
                                        >
                                            <MapPin size={16} /> Add New
                                        </button>
                                    )}
                                </div>

                                {isAddingAddress ? (
                                    <div className="bg-background p-6 rounded-sm border border-secondary/10">
                                        <h3 className="font-heading text-lg font-bold text-primary mb-6">Add New Address</h3>
                                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Street Address</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={newAddress.address}
                                                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                                        className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                                                        placeholder="e.g. A-102 Block A Prayosha bliss"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">City</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={newAddress.city}
                                                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                        className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                                                        placeholder="Surat"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">State / Province</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={newAddress.state}
                                                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                                        className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                                                        placeholder="Gujarat"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Postal Code</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={newAddress.postalCode}
                                                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                                                        className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                                                        placeholder="394210"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Phone Number</label>
                                                    <input
                                                        required
                                                        type="tel"
                                                        value={newAddress.phone}
                                                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                                        className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                                                        placeholder="+91 98765 43210"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-4 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingAddress(false)}
                                                    className="text-text-secondary text-sm hover:text-primary transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="bg-primary text-white px-6 py-2 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-colors"
                                                >
                                                    Save Address
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <>
                                        {user.addresses && user.addresses.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {user.addresses.map((addr, idx) => (
                                                    <div key={idx} className="border border-secondary/20 p-6 rounded-sm relative hover:shadow-md transition-shadow bg-background">
                                                        {addr.isDefault && (
                                                            <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-sm">Default</span>
                                                        )}
                                                        <h4 className="font-bold text-primary mb-2 flex items-center">
                                                            Address #{idx + 1}
                                                        </h4>
                                                        <div className="text-sm text-text-secondary space-y-1 mb-4">
                                                            <p className="font-medium text-primary block mb-1">{addr.address}</p>
                                                            <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                                                            <p>{addr.country}</p>
                                                            <p className="flex items-center gap-1 mt-2 text-xs opacity-80">
                                                                <Phone size={12} /> {user.phone || addr.phone || 'N/A'}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-4 pt-4 border-t border-secondary/10">
                                                            <button className="text-xs font-bold uppercase text-primary hover:text-accent transition-colors flex items-center gap-1">
                                                                Edit
                                                            </button>
                                                            <button className="text-xs font-bold uppercase text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-secondary/5 rounded-sm border border-dashed border-secondary/20">
                                                <MapPin size={32} className="mx-auto text-secondary/40 mb-3" />
                                                <p className="text-text-secondary text-sm">No addresses saved yet.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Wallet View */}
                        {activeTab === 'wallet' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="border-b border-secondary/10 pb-6">
                                    <h2 className="font-heading text-3xl text-primary font-bold">My Wallet</h2>
                                    <p className="text-text-secondary text-sm font-light mt-1">Manage your refunds and wallet balance.</p>
                                </div>

                                <div className="bg-primary text-white p-8 rounded-sm shadow-lg max-w-md relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <div className="relative z-10">
                                        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-1">Available Balance</p>
                                        <h3 className="text-4xl font-bold font-heading">{formatPrice(user.walletBalance || 0)}</h3>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-heading text-xl font-bold text-primary mb-4">Transaction History</h3>
                                    {user.walletTransactions && user.walletTransactions.length > 0 ? (
                                        <div className="space-y-4">
                                            {[...user.walletTransactions].reverse().map((txn, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-background border border-secondary/10 p-4 rounded-sm">
                                                    <div>
                                                        <p className="font-bold text-primary text-sm">{txn.description}</p>
                                                        <span className="text-xs text-text-secondary">{new Date(txn.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className={`font-bold ${txn.type === 'refund' || txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {txn.type === 'refund' || txn.type === 'credit' ? '+' : '-'}{formatPrice(txn.amount)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-secondary/5 rounded-sm border border-dashed border-secondary/20">
                                            <p className="text-text-secondary text-sm">No transactions yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Refund History View */}
                        {activeTab === 'refunds' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="border-b border-secondary/10 pb-6">
                                    <h2 className="font-heading text-3xl text-primary font-bold">Refund History</h2>
                                    <p className="text-text-secondary text-sm font-light mt-1">Track your returned items and refund status. Delivery charges are non-refundable.</p>
                                </div>

                                {refundLogs.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-secondary/10 text-xs font-bold uppercase text-text-secondary tracking-wider">
                                                    <th className="p-4">Order ID</th>
                                                    <th className="p-4">Date</th>
                                                    <th className="p-4">Refund Amount</th>
                                                    <th className="p-4 text-red-500">Delivery Deducted</th>
                                                    <th className="p-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {refundLogs.map(log => (
                                                    <tr key={log._id} className="border-b border-secondary/5 hover:bg-secondary/5 transition-colors">
                                                        <td className="p-4 font-bold text-primary">#{log.order?._id?.slice(-8).toUpperCase()}</td>
                                                        <td className="p-4 text-text-secondary">{new Date(log.createdAt).toLocaleDateString()}</td>
                                                        <td className="p-4 font-bold text-green-600">+{formatPrice(log.amount)}</td>
                                                        <td className="p-4 text-red-500 font-medium">-{formatPrice(log.deliveryCharge)}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wider ${log.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 rounded-sm bg-secondary/5 border border-dashed border-secondary/20">
                                        <History size={32} className="mx-auto text-secondary/40 mb-3" />
                                        <p className="text-text-secondary text-sm">No refund records found (last 45 days).</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. Wishlist View */}
                        {activeTab === 'wishlist' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="border-b border-secondary/10 pb-6">
                                    <h2 className="font-heading text-3xl text-primary font-bold">My Wishlist</h2>
                                    <p className="text-text-secondary text-sm font-light mt-1">Items you saved for later.</p>
                                </div>

                                {user.wishlist && user.wishlist.length > 0 ? (
                                    <WishlistGrid />
                                ) : (
                                    <div className="text-center py-12">
                                        <Heart size={48} className="mx-auto text-secondary/30 mb-4" />
                                        <p className="text-text-secondary mb-4">Your wishlist is empty</p>
                                        <Link to="/shop" className="text-accent underline hover:text-primary">Browse Products</Link>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* 6. Settings View */}
                        {activeTab === 'settings' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="border-b border-secondary/10 pb-6">
                                    <h2 className="font-heading text-3xl text-primary font-bold">Settings</h2>
                                    <p className="text-text-secondary text-sm font-light mt-1">Manage your account preferences and security.</p>
                                </div>

                                <div className="space-y-8 max-w-3xl">
                                    {/* Notifications */}
                                    <div className="bg-background border border-secondary/10 p-6 rounded-sm">
                                        <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                            <Mail size={18} /> Notification Preferences
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm text-primary">Order Updates</p>
                                                    <p className="text-xs text-text-secondary">Receive updates about your order status.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.orderUpdates}
                                                        onChange={() => handleNotificationToggle('orderUpdates')}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm text-primary">Promotions</p>
                                                    <p className="text-xs text-text-secondary">Receive emails about new products and sales.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.promotions}
                                                        onChange={() => handleNotificationToggle('promotions')}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="bg-background border border-secondary/10 p-6 rounded-sm">
                                        <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                            <Lock size={18} /> Security
                                        </h3>
                                        <form className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">Current Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showCurrentPassword ? "text" : "password"}
                                                            className="w-full border border-secondary/20 bg-surface px-4 py-2 rounded-sm focus:outline-none focus:border-accent text-sm pr-10"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                                                        >
                                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">New Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showNewPassword ? "text" : "password"}
                                                            className="w-full border border-secondary/20 bg-surface px-4 py-2 rounded-sm focus:outline-none focus:border-accent text-sm pr-10"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                                                        >
                                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <button className="text-xs font-bold uppercase tracking-wider text-primary border border-primary px-4 py-2 rounded-sm hover:bg-primary hover:text-surface transition-colors">
                                                    Update Password
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Delete Account */}
                                    <div className="pt-6 border-t border-secondary/10">
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="text-red-600 text-sm font-bold flex items-center gap-2 hover:text-red-700 transition-colors"
                                        >
                                            <LogOut size={16} /> Delete My Account
                                        </button>
                                        <p className="text-xs text-text-secondary mt-1">This action cannot be undone.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 7. Support View */}
                        {activeTab === 'support' && (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div className="border-b border-secondary/10 pb-6">
                                    <h2 className="font-heading text-3xl text-primary font-bold">Support</h2>
                                    <p className="text-text-secondary text-sm font-light mt-1">Need help? We're here for you.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="font-bold text-lg text-primary">Contact Us</h3>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                <Mail size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-primary text-sm">Email Support</p>
                                                <p className="text-text-secondary text-sm">info@sirabaorganic.com</p>
                                                <p className="text-xs text-text-secondary mt-1">Response time: 24 hours</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Phone</h4>
                                                <p className="text-text-secondary text-sm">+91 98765 43210</p>
                                                <p className="text-xs text-text-secondary mt-1">Mon-Fri, 9am - 6pm IST</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/5 p-6 rounded-sm">
                                        <h3 className="font-bold text-lg text-primary mb-4">Send a Message</h3>
                                        <form className="space-y-4">
                                            <input type="text" placeholder="Subject" className="w-full p-3 bg-white border border-secondary/20 rounded-sm text-sm" />
                                            <textarea placeholder="How can we help?" className="w-full p-3 bg-white border border-secondary/20 rounded-sm text-sm h-32"></textarea>
                                            <button className="bg-primary text-surface px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-colors w-full rounded-sm">
                                                Send Message
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
            {/* Review Modal */}
            {
                reviewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-sm shadow-xl w-full max-w-md overflow-hidden relative">
                            <button
                                onClick={closeReviewModal}
                                className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="p-6">
                                <h3 className="text-xl font-heading font-bold text-primary mb-2">Write a Review</h3>
                                <p className="text-text-secondary text-sm mb-6">Share your experience with this product.</p>

                                <form onSubmit={handleSubmitReview} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    className={`transition-colors ${reviewRating >= star ? 'text-accent' : 'text-gray-300'}`}
                                                >
                                                    <Star size={28} fill={reviewRating >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Comment</label>
                                        <textarea
                                            required
                                            rows="4"
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Tell us what you liked or disliked..."
                                            className="w-full bg-surface border border-secondary/20 rounded-sm p-3 focus:border-accent outline-none"
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeReviewModal}
                                            className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingReview}
                                            className="bg-primary text-white px-6 py-2 rounded-sm text-sm font-bold hover:bg-accent transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Return Request Modal */}
            {
                returnModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-sm shadow-xl w-full max-w-md overflow-hidden relative">
                            <button
                                onClick={() => setReturnModalOpen(false)}
                                className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <div className="p-6">
                                <h3 className="text-xl font-heading font-bold text-primary mb-2">Request Return</h3>
                                <p className="text-text-secondary text-sm mb-6">Please tell us why you want to return this order. Note: Delivery charges are non-refundable.</p>
                                <form onSubmit={handleReturnSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Reason</label>
                                        <textarea
                                            required
                                            rows="4"
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            placeholder="Reason for return..."
                                            className="w-full bg-surface border border-secondary/20 rounded-sm p-3 focus:border-accent outline-none"
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setReturnModalOpen(false)}
                                            className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingReturn}
                                            className="bg-primary text-white px-6 py-2 rounded-sm text-sm font-bold hover:bg-accent transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingReturn ? 'Submitting...' : 'Confirm Return'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Account;
