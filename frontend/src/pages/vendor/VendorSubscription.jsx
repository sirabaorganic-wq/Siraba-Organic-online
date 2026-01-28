import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Shield, Zap, TrendingUp, AlertCircle, Calendar, Star, ArrowLeft } from "lucide-react";
import client from "../../api/client";

const PlanFeature = ({ text }) => (
    <div className="flex items-center gap-3 mb-3">
        <div className="min-w-[18px] max-w-[18px] h-[18px] rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
            <Check size={10} strokeWidth={3} />
        </div>
        <span className="text-sm text-text-secondary font-light">{text}</span>
    </div>
);

const VendorSubscription = () => {
    const [loading, setLoading] = useState(true);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | yearly
    const [processingPlan, setProcessingPlan] = useState(null);

    const PLANS = {
        starter: {
            id: "starter",
            name: "Starter",
            priceMonthly: 0,
            priceYearly: 0,
            commission: 15,
            features: [
                "15% platform commission",
                "List up to 10 products",
                "Basic analytics dashboard",
                "Standard support",
                "Basic shop profile",
                "Manual payout (weekly)",
            ],
            color: "blue",
            popular: false,
        },
        professional: {
            id: "professional",
            name: "Professional",
            priceMonthly: 1999,
            priceYearly: 19990, // roughly 17% save
            commission: 10,
            features: [
                "10% platform commission",
                "List up to 100 products",
                "Advanced analytics & reports",
                "Priority support",
                "Custom shop page",
                "Featured product slots (3)",
                "Auto payouts (bi-weekly)",
                "Promotional tools",
                "Bulk product upload",
            ],
            color: "indigo",
            popular: true,
        },
        enterprise: {
            id: "enterprise",
            name: "Enterprise",
            priceMonthly: 4999,
            priceYearly: 49990,
            commission: 5,
            features: [
                "5% platform commission",
                "Unlimited products",
                "Real-time analytics",
                "Dedicated account manager",
                "Branded shop storefront",
                "Featured product slots (10)",
                "Auto payouts (weekly)",
                "API access",
                "White-label invoicing",
                "Priority product approval",
                "Custom commission negotiation",
            ],
            color: "purple",
            popular: false,
            badge: "Best Value",
        },
    };

    const fetchSubscription = async () => {
        try {
            const { data } = await client.get("/vendors/subscription");
            setCurrentSubscription(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load subscription", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    const handlePlanChange = async (planId) => {
        if (processingPlan) return;

        // Confirmation
        const isDowngrade =
            (currentSubscription?.currentPlan === 'enterprise' && planId !== 'enterprise') ||
            (currentSubscription?.currentPlan === 'professional' && planId === 'starter');

        if (isDowngrade) {
            if (!window.confirm("You are downgrading your plan. Changes will take effect at the end of your billing cycle. Continue?")) {
                return;
            }
        } else {
            if (!window.confirm(`Upgrade to ${PLANS[planId].name}? Payment will be processed immediately.`)) {
                return;
            }
        }

        setProcessingPlan(planId);
        try {
            const { data } = await client.post("/vendors/subscription", {
                plan: planId,
                billingCycle,
            });
            alert(data.message);
            await fetchSubscription();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update plan");
        } finally {
            setProcessingPlan(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary font-light">Loading subscription details...</div>;

    const activePlanId = currentSubscription?.currentPlan || "starter";
    const upcomingPlanId = currentSubscription?.subscription?.upcomingPlan;
    const isYearly = billingCycle === "yearly";

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-10 animate-fade-in">
            {/* Header */}
            <div className="text-center relative">
                <Link to="/vendor/dashboard" className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
                    <ArrowLeft size={16} /> Back
                </Link>
                <span className="text-accent text-xs tracking-[0.2em] uppercase font-bold">Subscription Management</span>
                <h1 className="font-heading text-4xl md:text-5xl text-primary mt-2">Your Plan</h1>
                <p className="text-text-secondary mt-3 font-light max-w-xl mx-auto">Manage your subscription and optimize your commission rates.</p>
            </div>

            {/* Current Plan Overview Card */}
            <div className="bg-surface border border-secondary/10 rounded-sm p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                    <div className="p-4 rounded-sm bg-accent/10 text-accent">
                        <Zap size={28} />
                    </div>
                    <div>
                        <h2 className="font-heading text-2xl text-primary flex items-center gap-3">
                            {PLANS[activePlanId].name} Plan
                            <span className="px-3 py-1 rounded-sm bg-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider">
                                Active
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary font-light">
                            <span>{PLANS[activePlanId].commission}% commission on sales</span>
                            <span className="text-secondary/50">•</span>
                            <span>
                                {activePlanId === "starter"
                                    ? "Free forever"
                                    : `Renews on ${new Date(currentSubscription?.subscription?.endDate).toLocaleDateString()}`}
                            </span>
                        </div>
                        {upcomingPlanId && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-accent bg-accent/10 px-4 py-2 rounded-sm border border-accent/20">
                                <Calendar size={14} />
                                <span>
                                    Scheduled downgrade to <strong>{PLANS[upcomingPlanId].name}</strong> on{" "}
                                    {new Date(currentSubscription?.subscription?.upcomingPlanDate).toLocaleDateString()}
                                </span>
                                <button
                                    className="text-xs underline hover:text-primary ml-2 font-medium"
                                    onClick={() => alert("Please contact support to cancel scheduled changes.")}
                                >
                                    Cancel Change
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-background p-5 rounded-sm border border-secondary/10 md:min-w-[320px]">
                    <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wide">Your Commission Rate: {currentSubscription?.commissionRate}%</h3>
                    <p className="text-xs text-text-secondary mb-4 font-light">
                        For every ₹100 sale, Siraba takes ₹{currentSubscription?.commissionRate} as platform fee.
                        Upgrade your plan to reduce commission rates!
                    </p>
                    <div className="w-full bg-secondary/20 rounded-full h-2 mb-2">
                        <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{ width: `${100 - (currentSubscription?.commissionRate * 5)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-text-secondary">
                        <span>High Commission</span>
                        <span>Low Commission</span>
                    </div>
                </div>
            </div>

            {/* Plan Selector */}
            <div>
                <div className="flex flex-col items-center mb-10">
                    <h2 className="font-heading text-3xl text-primary mb-6">Choose the Perfect Plan for Your Business</h2>

                    {/* Billing Cycle Toggle */}
                    <div className="bg-secondary/10 p-1 rounded-sm flex items-center relative gap-1">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-8 py-3 rounded-sm text-sm font-bold uppercase tracking-wider transition-all ${!isYearly ? "bg-surface text-primary shadow-md" : "text-text-secondary hover:text-primary"
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-8 py-3 rounded-sm text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isYearly ? "bg-surface text-primary shadow-md" : "text-text-secondary hover:text-primary"
                                }`}
                        >
                            Yearly <span className="text-[10px] text-accent font-extrabold bg-accent/10 px-2 py-0.5 rounded-sm">SAVE 17%</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {Object.values(PLANS).map((plan) => {
                        const isCurrent = activePlanId === plan.id && !upcomingPlanId;
                        const isUpcoming = upcomingPlanId === plan.id;
                        const isProcessing = processingPlan === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-surface rounded-sm overflow-hidden transition-all duration-500 ${plan.popular ? "border-2 border-accent shadow-2xl scale-105 z-10" : "border border-secondary/20 shadow-lg hover:shadow-xl hover:-translate-y-1"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="bg-accent text-primary text-center text-xs font-bold uppercase tracking-[0.2em] py-2">
                                        Most Popular
                                    </div>
                                )}
                                {plan.badge && !plan.popular && (
                                    <div className="bg-primary text-surface text-center text-xs font-bold uppercase tracking-[0.2em] py-2">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="p-8">
                                    <h3 className="font-heading text-2xl text-primary mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-4xl font-heading font-bold text-primary">
                                            {plan.priceMonthly === 0
                                                ? "Free"
                                                : isYearly ? `₹${(plan.priceYearly / 12).toFixed(0)}` : `₹${plan.priceMonthly}`
                                            }
                                        </span>
                                        {plan.priceMonthly > 0 && <span className="text-text-secondary text-sm font-light">/month</span>}
                                    </div>
                                    {plan.priceMonthly > 0 && isYearly && (
                                        <p className="text-xs text-accent font-bold mb-6 tracking-wide">Billed ₹{plan.priceYearly.toLocaleString()} yearly</p>
                                    )}

                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="h-px bg-secondary/10 flex-1"></div>
                                        <p className={`text-sm font-bold ${plan.id === 'starter' ? 'text-text-secondary' : 'text-accent'
                                            }`}>
                                            {plan.commission}% COMMISSION
                                        </p>
                                        <div className="h-px bg-secondary/10 flex-1"></div>
                                    </div>

                                    <div className="bg-background/50 rounded-sm p-6 space-y-4 mb-8 min-h-[300px] border border-secondary/5">
                                        <p className="text-xs font-bold uppercase text-primary/40 tracking-[0.2em] mb-2">Features</p>
                                        {plan.features.map((feature, idx) => (
                                            <PlanFeature key={idx} text={feature} />
                                        ))}
                                    </div>

                                    <button
                                        disabled={isCurrent || isUpcoming || isProcessing}
                                        onClick={() => handlePlanChange(plan.id)}
                                        className={`w-full py-4 rounded-sm text-sm font-bold uppercase tracking-[0.15em] transition-all duration-300 ${isCurrent
                                            ? "bg-secondary/10 text-text-secondary cursor-not-allowed border border-secondary/20"
                                            : isUpcoming
                                                ? "bg-accent/10 text-accent cursor-not-allowed border border-accent/20"
                                                : plan.popular
                                                    ? "bg-accent text-primary hover:bg-primary hover:text-surface shadow-lg hover:shadow-xl"
                                                    : "bg-primary text-surface hover:bg-accent hover:text-primary shadow-lg hover:shadow-xl"
                                            }`}
                                    >
                                        {isProcessing ? "Processing..." :
                                            isCurrent ? "Current Plan" :
                                                isUpcoming ? "Scheduled Change" :
                                                    "Upgrade Now"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FAQ / Info Section */}
            <div className="bg-secondary/5 border border-secondary/10 rounded-sm p-8 mt-16 backdrop-blur-sm">
                <div className="flex gap-6">
                    <div className="p-3 bg-secondary/10 rounded-full h-fit text-secondary">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-heading text-xl text-primary mb-4">Understanding Your Plan Changes</h3>
                        <ul className="text-sm text-text-secondary space-y-3 list-disc pl-4 font-light leading-relaxed">
                            <li><strong>Upgrades:</strong> Take effect immediately. You will be charged a prorated amount for the new cycle starting today.</li>
                            <li><strong>Downgrades:</strong> Are scheduled for the end of your current billing cycle. You retain your current benefits until then.</li>
                            <li><strong>Commission Rates:</strong> Are updated immediately upon plan activation.</li>
                            <li><strong>Enterprise Plans:</strong> Offer negotiated custom commissions for high-volume sellers. Contact sales for more info.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorSubscription;
