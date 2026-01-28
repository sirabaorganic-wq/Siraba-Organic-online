import React, { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const VendorContext = createContext();

export const useVendor = () => {
  return useContext(VendorContext);
};

export const VendorProvider = ({ children }) => {
  const [vendor, setVendor] = useState(() => {
    const vendorInfo = localStorage.getItem("vendorInfo");
    return vendorInfo ? JSON.parse(vendorInfo) : null;
  });
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  // Login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data } = await client.post("/vendors/login", { email, password });
      setVendor(data);
      localStorage.setItem("vendorInfo", JSON.stringify(data));
      localStorage.setItem("vendorToken", data.token);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (vendorData) => {
    try {
      setLoading(true);
      const { data } = await client.post("/vendors/register", vendorData);
      setVendor(data);
      localStorage.setItem("vendorInfo", JSON.stringify(data));
      localStorage.setItem("vendorToken", data.token);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setVendor(null);
    setInventory([]);
    setOrders([]);
    setCompliance([]);
    setDashboardData(null);
    localStorage.removeItem("vendorInfo");
    localStorage.removeItem("vendorToken");
  };

  // Get Profile
  const getProfile = async () => {
    try {
      const { data } = await client.get("/vendors/profile");
      return data;
    } catch (error) {
      console.error("Failed to fetch profile", error);
      return null;
    }
  };

  // Refresh vendor status from server (to get latest approval status)
  const refreshVendorStatus = async () => {
    try {
      const { data } = await client.get("/vendors/profile");
      if (data) {
        const updatedVendor = { ...vendor, ...data };
        setVendor(updatedVendor);
        localStorage.setItem("vendorInfo", JSON.stringify(updatedVendor));
        return { success: true, vendor: updatedVendor };
      }
      return { success: false };
    } catch (error) {
      console.error("Failed to refresh vendor status", error);
      return { success: false };
    }
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    try {
      const { data } = await client.put("/vendors/profile", profileData);
      setVendor((prev) => ({ ...prev, ...data }));
      localStorage.setItem(
        "vendorInfo",
        JSON.stringify({ ...vendor, ...data })
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  };

  // Onboarding
  const updateOnboarding = async (step, stepData) => {
    try {
      const { data } = await client.put("/vendors/onboarding", {
        step,
        data: stepData,
      });
      setVendor((prev) => ({
        ...prev,
        ...stepData, // Merge the submitted data (e.g., businessDescription) into state immediately
        onboardingStep: data.onboardingStep,
        onboardingComplete: data.onboardingComplete,
        status: data.status,
      }));
      const updatedVendor = {
        ...vendor,
        ...stepData, // Also merge here for localStorage
        onboardingStep: data.onboardingStep,
        onboardingComplete: data.onboardingComplete,
        status: data.status,
      };
      localStorage.setItem("vendorInfo", JSON.stringify(updatedVendor));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  };

  // ================== VENDOR PRODUCTS ==================

  const [vendorProducts, setVendorProducts] = useState([]);

  // Fetch vendor's products
  const fetchVendorProducts = async (status = "") => {
    try {
      const params = status ? `?status=${status}` : "";
      const { data } = await client.get(`/vendors/products${params}`);
      setVendorProducts(data.products || []);
      return data;
    } catch (error) {
      console.error("Failed to fetch vendor products", error);
      return { products: [], total: 0 };
    }
  };

  // Add new product
  const addVendorProduct = async (productData) => {
    try {
      const { data } = await client.post("/vendors/products", productData);
      setVendorProducts((prev) => [data, ...prev]);
      return { success: true, product: data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to add product",
      };
    }
  };

  // Update product
  const updateVendorProduct = async (productId, productData) => {
    try {
      const { data } = await client.put(
        `/vendors/products/${productId}`,
        productData
      );
      setVendorProducts((prev) =>
        prev.map((p) => (p._id === productId ? data : p))
      );
      return { success: true, product: data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update product",
      };
    }
  };

  // Delete product
  const deleteVendorProduct = async (productId) => {
    try {
      await client.delete(`/vendors/products/${productId}`);
      setVendorProducts((prev) => prev.filter((p) => p._id !== productId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete product",
      };
    }
  };

  // ================== INVENTORY ==================
  const fetchInventory = async () => {
    try {
      const { data } = await client.get("/vendors/inventory");
      setInventory(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch inventory", error);
      return [];
    }
  };

  const addInventoryItem = async (itemData) => {
    try {
      const { data } = await client.post("/vendors/inventory", itemData);
      setInventory(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to add item",
      };
    }
  };

  const updateInventoryItem = async (itemId, itemData) => {
    try {
      const { data } = await client.put(
        `/vendors/inventory/${itemId}`,
        itemData
      );
      setInventory((prev) =>
        prev.map((item) => (item._id === itemId ? data : item))
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update item",
      };
    }
  };

  const deleteInventoryItem = async (itemId) => {
    try {
      await client.delete(`/vendors/inventory/${itemId}`);
      setInventory((prev) => prev.filter((item) => item._id !== itemId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete item",
      };
    }
  };

  const bulkUpdateStock = async (updates) => {
    try {
      await client.put("/vendors/inventory/bulk-update", { updates });
      await fetchInventory();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update stock",
      };
    }
  };

  // Orders
  const fetchOrders = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await client.get(`/vendors/orders?${params}`);
      setOrders(data.orders);
      return data;
    } catch (error) {
      console.error("Failed to fetch orders", error);
      return { orders: [], total: 0 };
    }
  };

  const getOrder = async (orderId) => {
    try {
      const { data } = await client.get(`/vendors/orders/${orderId}`);
      return data;
    } catch (error) {
      console.error("Failed to fetch order", error);
      return null;
    }
  };

  const updateOrderStatus = async (orderId, statusData) => {
    try {
      const { data } = await client.put(
        `/vendors/orders/${orderId}/status`,
        statusData
      );
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? data : order))
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update order",
      };
    }
  };

  // Compliance
  const fetchCompliance = async () => {
    try {
      const { data } = await client.get("/vendors/compliance");
      setCompliance(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch compliance", error);
      return [];
    }
  };

  const addComplianceDoc = async (docData) => {
    try {
      const { data } = await client.post("/vendors/compliance", docData);
      setCompliance(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to upload document",
      };
    }
  };

  const deleteComplianceDoc = async (docId) => {
    try {
      await client.delete(`/vendors/compliance/${docId}`);
      setCompliance((prev) => prev.filter((doc) => doc._id !== docId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete document",
      };
    }
  };

  // Dashboard
  const fetchDashboard = async () => {
    try {
      const { data } = await client.get("/vendors/dashboard");
      setDashboardData(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch dashboard", error);
      return null;
    }
  };

  // Payouts
  const fetchPayouts = async () => {
    try {
      const { data } = await client.get("/vendors/payouts");
      return data;
    } catch (error) {
      console.error("Failed to fetch payouts", error);
      return { payouts: [], summary: [] };
    }
  };

  // ================== WALLET ==================
  const [walletData, setWalletData] = useState(null);

  const fetchWallet = async () => {
    try {
      const { data } = await client.get("/vendors/wallet");
      setWalletData(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch wallet", error);
      return null;
    }
  };

  const requestPayout = async (amount) => {
    try {
      const { data } = await client.post("/vendors/wallet/payout", { amount });
      await fetchWallet(); // Refresh wallet
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Payout request failed",
      };
    }
  };

  const fetchWalletTransactions = async (page = 1, type = "") => {
    try {
      const params = new URLSearchParams({ page, ...(type && { type }) });
      const { data } = await client.get(
        `/vendors/wallet/transactions?${params}`
      );
      return data;
    } catch (error) {
      console.error("Failed to fetch transactions", error);
      return { transactions: [], total: 0 };
    }
  };

  // ================== SHOP SETTINGS ==================
  const [shopSettings, setShopSettings] = useState(null);

  const fetchShopSettings = async () => {
    try {
      const { data } = await client.get("/vendors/shop");
      setShopSettings(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch shop settings", error);
      return null;
    }
  };

  const updateShopSettings = async (settings) => {
    try {
      const { data } = await client.put("/vendors/shop", settings);
      setShopSettings(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to update shop settings",
      };
    }
  };

  // ================== SUBSCRIPTION ==================
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState(null);

  const fetchPlans = async () => {
    try {
      const { data } = await client.get("/vendors/plans");
      setPlans(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch plans", error);
      return null;
    }
  };

  const fetchSubscription = async () => {
    try {
      const { data } = await client.get("/vendors/subscription");
      console.log("Subscription API Response:", data); // Debug log
      // Normalize the subscription data
      const normalizedData = {
        plan: data.currentPlan || data.subscription?.plan || "starter",
        isActive:
          data.subscription?.isActive === true ||
          data.currentPlan === "starter" ||
          (data.subscription?.plan &&
            data.subscription?.plan !== "starter" &&
            new Date(data.subscription?.endDate) > new Date()),
        endDate: data.subscription?.endDate,
        startDate: data.subscription?.startDate,
        autoRenew: data.subscription?.autoRenew,
        commissionRate: data.commissionRate,
        planDetails: data.planDetails,
        paymentHistory: data.subscription?.paymentHistory,
      };
      console.log("Normalized subscription:", normalizedData); // Debug log
      setSubscription(normalizedData);
      return normalizedData;
    } catch (error) {
      console.error("Failed to fetch subscription", error);
      return null;
    }
  };

  const selectPlan = async (plan, billingCycle = "monthly") => {
    try {
      const { data } = await client.post("/vendors/subscription", {
        plan,
        billingCycle,
      });
      await fetchSubscription();
      // Also refresh vendor profile to get updated commission rate
      await refreshVendorStatus();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to select plan",
      };
    }
  };

  const value = {
    vendor,
    loading,
    inventory,
    orders,
    compliance,
    dashboardData,
    vendorProducts,
    walletData,
    shopSettings,
    subscription,
    plans,
    isApproved: vendor?.status === "approved",
    isOnboardingComplete: vendor?.onboardingComplete,
    login,
    register,
    logout,
    getProfile,
    refreshVendorStatus,
    updateProfile,
    updateOnboarding,
    // Products
    fetchVendorProducts,
    addVendorProduct,
    updateVendorProduct,
    deleteVendorProduct,
    // Inventory (for existing products)
    fetchInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    bulkUpdateStock,
    // Orders
    fetchOrders,
    getOrder,
    updateOrderStatus,
    // Compliance
    fetchCompliance,
    addComplianceDoc,
    deleteComplianceDoc,
    // Dashboard
    fetchDashboard,
    fetchPayouts,
    // Wallet
    fetchWallet,
    requestPayout,
    fetchWalletTransactions,
    // Shop
    fetchShopSettings,
    updateShopSettings,
    // Subscription
    fetchPlans,
    fetchSubscription,
    selectPlan,
  };

  return (
    <VendorContext.Provider value={value}>{children}</VendorContext.Provider>
  );
};
