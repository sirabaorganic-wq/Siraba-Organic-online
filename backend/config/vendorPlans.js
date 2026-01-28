// Vendor Subscription Plans Configuration

const vendorPlans = {
  starter: {
    name: "Starter",
    price: 0, // Free
    priceMonthly: 0,
    priceYearly: 0,
    commissionRate: 15, // 15% commission
    features: [
      "List up to 10 products",
      "Basic analytics dashboard",
      "Standard support",
      "Basic shop profile",
      "Manual payout (weekly)",
    ],
    limits: {
      maxProducts: 10,
      maxImages: 3,
      prioritySupport: false,
      featuredListing: false,
      customShopPage: false,
      autoPayouts: false,
    },
    badge: null,
    color: "#6B7280", // gray
  },
  professional: {
    name: "Professional",
    price: 1999, // ₹1999/month
    priceMonthly: 1999,
    priceYearly: 19990, // ~2 months free
    commissionRate: 10, // 10% commission
    features: [
      "List up to 100 products",
      "Advanced analytics & reports",
      "Priority support",
      "Custom shop page",
      "Featured product slots (3)",
      "Auto payouts (bi-weekly)",
      "Promotional tools",
      "Bulk product upload",
    ],
    limits: {
      maxProducts: 100,
      maxImages: 5,
      prioritySupport: true,
      featuredListing: true,
      featuredSlots: 3,
      customShopPage: true,
      autoPayouts: true,
      bulkUpload: true,
    },
    badge: "Popular",
    color: "#10B981", // green
  },
  enterprise: {
    name: "Enterprise",
    price: 4999, // ₹4999/month
    priceMonthly: 4999,
    priceYearly: 49990, // ~2 months free
    commissionRate: 5, // 5% commission
    features: [
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
    limits: {
      maxProducts: -1, // Unlimited
      maxImages: 10,
      prioritySupport: true,
      dedicatedManager: true,
      featuredListing: true,
      featuredSlots: 10,
      customShopPage: true,
      brandedStorefront: true,
      autoPayouts: true,
      bulkUpload: true,
      apiAccess: true,
      priorityApproval: true,
    },
    badge: "Best Value",
    color: "#8B5CF6", // purple
  },
};

// Commission rates by plan
const getCommissionRate = (plan) => {
  return vendorPlans[plan]?.commissionRate || 15;
};

// Check if vendor can add more products
const canAddProduct = (plan, currentProductCount) => {
  const limits = vendorPlans[plan]?.limits;
  if (!limits) return false;
  if (limits.maxProducts === -1) return true; // Unlimited
  return currentProductCount < limits.maxProducts;
};

// Get plan features
const getPlanFeatures = (plan) => {
  return vendorPlans[plan] || vendorPlans.starter;
};

module.exports = {
  vendorPlans,
  getCommissionRate,
  canAddProduct,
  getPlanFeatures,
};
