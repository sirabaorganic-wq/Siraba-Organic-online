import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingBag, Settings, Star,
    Plus, Search, Filter, ChevronDown, Upload, X,
    DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle,
    Store, Award, Users, Globe, ArrowLeft, BarChart3, Zap,
    Shield, Heart, Target, Rocket, Crown, Gift, Activity,
    Clock, Eye, FileText, Truck, Leaf, Camera, MessageCircle
} from "lucide-react";
import { useAuth } from '../../context/AuthContext';

const VendorIntro = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(0);

    // Auto-rotate features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Redirect if already a vendor
    useEffect(() => {
        if (user && (user.role === 'admin' || user.isVendor)) {
            navigate('/vendor/dashboard');
        }
    }, [user, navigate]);

    // Stats Data
    const stats = [
        { icon: Store, value: 'Growing', label: 'Vendor Network', color: 'from-blue-500 to-cyan-500', description: 'Join our expanding community of successful organic sellers' },
        { icon: ShoppingBag, value: 'Thriving', label: 'Order Volume', color: 'from-purple-500 to-pink-500', description: 'Consistent demand from health-conscious customers' },
        { icon: DollarSign, value: 'Strong', label: 'Earning Potential', color: 'from-green-500 to-emerald-500', description: 'Build a sustainable income with transparent payouts' },
        { icon: Star, value: 'Highly Rated', label: 'Vendor Satisfaction', color: 'from-amber-500 to-orange-500', description: 'Trusted platform with excellent vendor support' }
    ];

    // Features
    const features = [
        {
            icon: LayoutDashboard,
            title: 'Intuitive Dashboard',
            description: 'Get a clear overview of your sales, latest orders, and business performance at a glance.',
            benefits: ['Real-time Sales Tracking', 'Performance Analytics', 'Order Notifications', 'Revenue Insights']
        },
        {
            icon: Package,
            title: 'Order Management',
            description: 'Process orders efficiently, print shipping labels, and manage returns seamlessly.',
            benefits: ['Automated Order Processing', 'Bulk Shipping Labels', 'Return Management', 'Customer Communication']
        },
        {
            icon: ShoppingBag,
            title: 'Product Control',
            description: 'Easily add and update your products with our advanced inventory management system.',
            benefits: ['Bulk Product Upload', 'Image Gallery', 'Stock Alerts', 'Price Management']
        },
        {
            icon: DollarSign,
            title: 'Transparent Payouts',
            description: 'Track your earnings in real-time and receive timely payouts directly to your bank account.',
            benefits: ['Weekly Payouts', 'Real-time Earnings', 'Detailed Reports', 'Secure Transactions']
        }
    ];

    // Benefits/Why Sell
    const benefits = [
        {
            icon: Globe,
            title: 'Global Reach',
            stat: 'Worldwide',
            description: 'Expand your customer base beyond your local area. We ship pan-India and internationally, giving you access to customers across multiple continents.',
            color: 'bg-blue-500'
        },
        {
            icon: Users,
            title: 'Loyal Community',
            stat: 'Established',
            description: 'Tap into our vibrant community of health-conscious buyers who trust the Siraba brand for quality organic products.',
            color: 'bg-purple-500'
        },
        {
            icon: Crown,
            title: 'Premium Positioning',
            stat: 'Top-Tier',
            description: 'Showcase your products alongside the finest organic goods, elevating your brand perception and attracting discerning customers.',
            color: 'bg-amber-500'
        },
        {
            icon: Zap,
            title: 'Fast Setup',
            stat: 'Quick Start',
            description: 'Streamlined verification and account setup process. Get approved and start selling quickly with our efficient onboarding.',
            color: 'bg-green-500'
        },
        {
            icon: Shield,
            title: 'Secure Payments',
            stat: 'Protected',
            description: 'Get paid on time, every time. Our automated payout system includes comprehensive fraud protection and secure transactions.',
            color: 'bg-red-500'
        },
        {
            icon: Gift,
            title: 'Marketing Support',
            stat: 'Included',
            description: 'Benefit from featured listings, promotional campaigns, and dedicated marketing support to grow your brand visibility and sales.',
            color: 'bg-pink-500'
        }
    ];

    // Process Steps
    const steps = [
        { icon: FileText, title: 'Register', description: 'Fill registration form with your business details' },
        { icon: CheckCircle, title: 'Verify', description: 'Document verification within 24-48 hours' },
        { icon: Store, title: 'Setup', description: 'Upload products and customize your store' },
        { icon: Rocket, title: 'Launch', description: 'Go live and start receiving orders' }
    ];

    // Success Stories
    const testimonials = [
        {
            name: 'Rajesh Kumar',
            business: 'Organic Spices India',
            revenue: '₹2.5L/month',
            image: '🧑‍🌾',
            quote: 'Siraba helped me reach customers I could never have accessed. Platform is easy and payouts are always on time!',
            rating: 5
        },
        {
            name: 'Priya Sharma',
            business: 'Pure Honey Co.',
            revenue: '₹1.8L/month',
            image: '👩‍🌾',
            quote: 'Complete control with the vendor dashboard. I manage everything in one place effortlessly.',
            rating: 5
        },
        {
            name: 'Mohammed Anwar',
            business: 'Kashmir Saffron House',
            revenue: '₹4.2L/month',
            image: '🧔',
            quote: 'Premium positioning elevated my brand. Customers trust quality because they trust Siraba.',
            rating: 5
        }
    ];

    // FAQs
    const faqs = [
        { q: 'What are the requirements?', a: 'Valid business registration (GST), organic certification, and minimum 5 products initially.' },
        { q: 'What is the commission?', a: '12-18% depending on category and sales volume. Volume discounts available.' },
        { q: 'When do I get paid?', a: 'Automatic payouts every 7 days via NEFT/RTGS. Track all earnings in real-time.' },
        { q: 'Who handles shipping?', a: 'You can ship yourself or use our fulfillment partners with provided labels.' }
    ];

    return (
        <div className="min-h-screen bg-background pt-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-32 md:py-40 bg-gradient-to-br from-primary via-primary to-secondary">
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-surface rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-20">
                    <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-surface/90 backdrop-blur-sm border border-surface/20 rounded-full text-sm font-bold text-primary hover:bg-surface hover:shadow-lg transition-all">
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left Column */}
                        <div className="space-y-8 text-surface animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full text-accent text-xs font-bold uppercase tracking-widest">
                                <Rocket size={14} />
                                Join the Revolution
                            </div>

                            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight">
                                Monetize Your
                                <span className="block text-accent mt-2">Organic Passion</span>
                            </h1>

                            <p className="text-xl text-surface/90 leading-relaxed">
                                Partner with Siraba Organic to reach thousands of health-conscious customers. Manage your products, track orders, and grow your business with our powerful vendor dashboard.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    to="/vendor/register"
                                    className="group px-8 py-4 bg-accent text-primary font-bold uppercase tracking-widest rounded-lg shadow-2xl hover:bg-surface hover:text-primary transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                >
                                    Start Selling Today
                                    <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" size={18} />
                                </Link>
                                <Link
                                    to="/vendor/login"
                                    className="px-8 py-4 bg-surface/10 backdrop-blur-sm border-2 border-surface/30 text-surface font-bold uppercase tracking-widest rounded-lg hover:bg-surface/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye size={18} />
                                    Login to Dashboard
                                </Link>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-surface/20">
                                {stats.slice(0, 2).map((stat, index) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={index} className="text-center sm:text-left">
                                            <div className="text-2xl font-bold text-accent mb-1">{stat.value}</div>
                                            <div className="text-surface/70 text-sm font-semibold">{stat.label}</div>
                                            <div className="text-surface/60 text-xs mt-1">{stat.description}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column - Dashboard Preview */}
                        <div className="relative animate-fade-in-up animation-delay-200">
                            {/* Floating Stats */}
                            <div className="absolute -top-8 -left-8 bg-surface rounded-2xl shadow-2xl p-4 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="text-green-600" size={24} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-primary">₹45,230</div>
                                        <div className="text-xs text-text-secondary">This Month</div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Dashboard Mockup */}
                            <div className="bg-surface rounded-3xl shadow-2xl overflow-hidden border border-secondary/10">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-primary to-secondary p-6 text-surface">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-lg">Vendor Dashboard</h3>
                                        <Activity className="text-accent" size={24} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {stats.slice(2, 4).map((stat, index) => {
                                            const Icon = stat.icon;
                                            return (
                                                <div key={index} className="bg-surface/10 backdrop-blur-sm p-4 rounded-xl">
                                                    <div className="text-xl font-bold mb-1">{stat.value}</div>
                                                    <div className="text-xs opacity-80 font-semibold">{stat.label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Activity Feed */}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-secondary/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                                <Package size={24} className="text-green-600" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-primary">New Order #12847</div>
                                                <div className="text-xs text-text-secondary">2 items • ₹2,450</div>
                                            </div>
                                        </div>
                                        <CheckCircle className="text-green-600" size={20} />
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-secondary/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                                <DollarSign size={24} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-primary">Payout Processed</div>
                                                <div className="text-xs text-text-secondary">₹18,600 to Bank</div>
                                            </div>
                                        </div>
                                        <CheckCircle className="text-blue-600" size={20} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                                <Star size={24} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-primary">New Review (5★)</div>
                                                <div className="text-xs text-text-secondary">Organic Honey</div>
                                            </div>
                                        </div>
                                        <Eye className="text-purple-600" size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -right-6 bg-accent text-primary px-6 py-3 rounded-full font-bold shadow-xl rotate-12 hover:rotate-0 transition-transform cursor-default">
                                ⚡ Live Demo
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-12 bg-surface border-y border-secondary/10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="text-center group hover:scale-105 transition-transform">
                                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center group-hover:shadow-lg transition-shadow`}>
                                        <Icon className="text-white" size={28} />
                                    </div>
                                    <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                                    <div className="text-sm text-text-secondary font-semibold">{stat.label}</div>
                                    <div className="text-xs text-text-secondary/70 mt-2 px-2 max-w-[200px] mx-auto">{stat.description}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-4">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                            Our vendor portal is designed to give you complete control over your business. From inventory management to real-time analytics, we provide the tools you need to thrive.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            const isActive = activeFeature === index;
                            return (
                                <div
                                    key={index}
                                    onClick={() => setActiveFeature(index)}
                                    className={`group cursor-pointer bg-surface p-8 rounded-2xl border transition-all duration-500 hover:-translate-y-2 ${isActive
                                        ? 'border-accent shadow-2xl shadow-accent/20 scale-105'
                                        : 'border-secondary/10 hover:shadow-xl'
                                        }`}
                                >
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all ${isActive
                                        ? 'bg-accent text-white'
                                        : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white'
                                        }`}>
                                        <Icon size={32} />
                                    </div>
                                    <h3 className="font-heading text-xl font-bold text-primary mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm leading-relaxed mb-4">
                                        {feature.description}
                                    </p>
                                    {isActive && (
                                        <ul className="space-y-2 text-xs animate-fade-in">
                                            {feature.benefits.map((benefit, i) => (
                                                <li key={i} className="flex items-center gap-2 text-text-secondary">
                                                    <CheckCircle size={14} className="text-accent flex-shrink-0" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>


                    {/* Analytics Graph Mockup */}
                    <div className="bg-surface p-8 rounded-2xl border border-secondary/10 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-heading text-2xl font-bold text-primary mb-2">Analytics Graph</h3>
                                <p className="text-text-secondary text-sm">Track your sales performance</p>
                            </div>
                            <BarChart3 className="text-accent" size={32} />
                        </div>

                        {/* Graph Container with Grid Background */}
                        <div className="relative bg-gradient-to-b from-secondary/5 to-transparent p-6 rounded-xl border border-secondary/5">
                            {/* Horizontal Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-6 py-6">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="border-t border-secondary/10"></div>
                                ))}
                            </div>

                            {/* Graph Bars */}
                            <div className="flex items-end justify-between gap-2 h-64 relative z-10">
                                {[
                                    { value: 4000, label: 'Day 1' },
                                    { value: 6500, label: 'Day 2' },
                                    { value: 4500, label: 'Day 3' },
                                    { value: 8000, label: 'Day 4' },
                                    { value: 5500, label: 'Day 5' },
                                    { value: 9000, label: 'Day 6' },
                                    { value: 7000, label: 'Day 7' },
                                    { value: 8500, label: 'W1' },
                                    { value: 6000, label: 'W2' },
                                    { value: 9500, label: 'W3' },
                                    { value: 7500, label: 'W4' },
                                    { value: 8800, label: 'W5' }
                                ].map((item, i) => {
                                    const maxValue = 10000;
                                    const heightPercent = (item.value / maxValue) * 100;

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                            {/* Bar */}
                                            <div className="relative w-full flex flex-col items-center">
                                                {/* Value label on hover */}
                                                <div className="absolute -top-8 bg-primary text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap font-bold shadow-lg transform -translate-y-2 group-hover:translate-y-0">
                                                    ₹{item.value.toLocaleString()}
                                                </div>

                                                {/* Bar element */}
                                                <div
                                                    className="w-full bg-gradient-to-t from-primary via-accent to-accent/80 rounded-t-lg transition-all duration-500 hover:from-accent hover:to-primary cursor-pointer shadow-lg hover:shadow-xl relative overflow-hidden"
                                                    style={{
                                                        height: `${heightPercent}%`,
                                                        minHeight: '20px'
                                                    }}
                                                >
                                                    {/* Shine effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                                                </div>
                                            </div>

                                            {/* Label */}
                                            <span className="text-xs font-semibold text-text-secondary group-hover:text-primary transition-colors">
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* X-axis base line */}
                            <div className="mt-2 border-t-2 border-primary/20"></div>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-t from-primary to-accent rounded"></div>
                                <span className="text-text-secondary">Daily Sales</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-t from-accent to-primary rounded"></div>
                                <span className="text-text-secondary">Weekly Average</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Sell Section */}
            <section className="py-24 bg-gradient-to-b from-surface to-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-4">
                            Why Sell on Siraba?
                        </h2>
                        <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                            We're more than just a marketplace. We're a community dedicated to bringing purity and wellness to every home.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => {
                            const Icon = benefit.icon;
                            return (
                                <div
                                    key={index}
                                    className="group bg-surface p-8 rounded-2xl border border-secondary/10 hover:shadow-2xl hover:border-accent/30 transition-all hover:-translate-y-2"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`w-14 h-14 ${benefit.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <Icon className="text-white" size={28} />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-accent">{benefit.stat}</div>
                                        </div>
                                    </div>
                                    <h3 className="font-heading text-xl font-bold text-primary mb-3">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-text-secondary leading-relaxed text-sm">
                                        {benefit.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-surface">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-4">
                            Start Selling in 4 Easy Steps
                        </h2>
                        <p className="text-xl text-text-secondary">Get your store running in less than 24 hours</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="relative text-center group">
                                    {index < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-accent to-transparent z-0"></div>
                                    )}
                                    <div className="bg-background p-8 rounded-2xl border border-secondary/10 hover:border-accent/30 transition-all group-hover:shadow-xl relative z-10">
                                        <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary text-white rounded-full flex items-center justify-center font-bold text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <Icon className="text-accent mb-4 mx-auto group-hover:scale-110 transition-transform" size={32} />
                                        <h3 className="font-heading text-lg font-bold text-primary mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-text-secondary text-sm">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-gradient-to-br from-primary via-primary to-secondary text-surface">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                            Success Stories
                        </h2>
                        <p className="text-surface/80 text-xl">
                            Real vendors, real growth, real results
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-surface/10 backdrop-blur-sm p-8 rounded-2xl border border-surface/20 hover:bg-surface/20 transition-all group"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={16} className="text-accent fill-accent" />
                                    ))}
                                </div>

                                <p className="text-surface/90 italic mb-6 leading-relaxed">
                                    "{testimonial.quote}"
                                </p>

                                <div className="flex items-center gap-4 pt-6 border-t border-surface/20">
                                    <div className="text-5xl">{testimonial.image}</div>
                                    <div>
                                        <div className="font-bold text-surface">{testimonial.name}</div>
                                        <div className="text-xs text-surface/70">{testimonial.business}</div>
                                    </div>
                                </div>

                                <div className="mt-4 inline-block bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-bold">
                                    💰 {testimonial.revenue}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-background">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold text-primary mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-text-secondary text-lg">
                            Everything you need to know about selling on Siraba
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <details
                                key={index}
                                className="group bg-surface p-6 rounded-xl border border-secondary/10 hover:border-accent/30 transition-all"
                            >
                                <summary className="font-bold text-primary cursor-pointer flex items-center justify-between">
                                    <span>{faq.q}</span>
                                    <ChevronDown className="text-accent group-open:rotate-180 transition-transform" size={20} />
                                </summary>
                                <p className="text-text-secondary mt-4 leading-relaxed pl-4 border-l-2 border-accent/20">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 bg-gradient-to-br from-accent via-primary to-secondary text-surface text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-surface rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-surface rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <Rocket className="mx-auto mb-6" size={64} />
                    <h2 className="text-5xl md:text-6xl font-heading font-bold mb-6">
                        Ready to Grow Your Business?
                    </h2>
                    <p className="text-surface/90 text-xl mb-12 max-w-2xl mx-auto">
                        Join hundreds of successful vendors who have transformed their passion into profit with Siraba Organic.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                        <Link
                            to="/vendor/register"
                            className="px-10 py-5 bg-surface text-primary rounded-xl font-bold text-xl hover:bg-white transition-all shadow-2xl hover:scale-105"
                        >
                            Register Now →
                        </Link>
                        <Link
                            to="/contact"
                            className="px-10 py-5 bg-surface/10 backdrop-blur-sm border-2 border-surface/30 text-surface rounded-xl font-bold text-xl hover:bg-surface/20 transition-all"
                        >
                            Talk to Sales
                        </Link>
                    </div>

                    <div className="text-surface/70 text-sm">
                        ✓ No setup fees • ✓ Free onboarding • ✓ 24/7 support
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VendorIntro;
