import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../context/ProductContext";
import { useOrders } from "../../context/OrderContext";
import { useSocket } from "../../context/SocketContext";
import { useCurrency } from "../../context/CurrencyContext";
import { Navigate } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Check,
  X,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  TicketPercent,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  Menu,
  LineChart as ChartIcon,
  Mail,
  Download,
  TrendingUp,
  AlertCircle,
  Store,
  DollarSign,
  Building,
  FileCheck,
  Ban,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import client from "../../api/client";
import { downloadInvoice, previewInvoice } from "../../utils/invoiceUtils";
import { History as HistoryIcon } from "lucide-react";

const AdminDashboard = () => {
  const { isAdmin, logout } = useAuth();
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    homeContent,
    updateHomeContent,
  } = useProducts();
  const { orders, updateOrderStatus } = useOrders();
  const { activeUsers, socket } = useSocket();
  const { formatPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [users, setUsers] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [couponData, setCouponData] = useState({
    code: "",
    discountType: "percentage", // percentage or fixed
    discountValue: "",
    expiryDate: "",
    maxUses: "",
    isActive: true,
    assignedTo: null, // explicit assignment
  });

  // B2B State
  const [b2bSection, setB2bSection] = useState("requests"); // requests, calculator, documents
  const [distributors, setDistributors] = useState([]);
  const [samples, setSamples] = useState([]);

  // Default Admin Settings for Calculator (In real app, fetch from backend)
  // Admin B2B Settings
  const [adminPricingProducts, setAdminPricingProducts] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(homeContent);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [contactMessages, setContactMessages] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Vendor Management State
  const [vendors, setVendors] = useState([]);
  const [vendorsPagination, setVendorsPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [vendorFilter, setVendorFilter] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [activeVendorModalTab, setActiveVendorModalTab] = useState("details");
  const [adminVendorProducts, setAdminVendorProducts] = useState([]);
  const [vendorAnalytics, setVendorAnalytics] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState({
    vendors: [],
    documents: [],
    counts: { vendors: 0, documents: 0 },
  });
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingProductsCounts, setPendingProductsCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [pricingTiers, setPricingTiers] = useState(null);
  const [platformAnalytics, setPlatformAnalytics] = useState(null);
  const [pdfViewerModal, setPdfViewerModal] = useState({
    isOpen: false,
    url: "",
    name: "",
  });

  // Returns Management State
  const [adminReturns, setAdminReturns] = useState([]);
  const [returnsCounts, setReturnsCounts] = useState({
    requested: 0,
    approved: 0,
    rejected: 0,
    returned: 0,
    refunded: 0,
  });
  const [returnsFilter, setReturnsFilter] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnsLoading, setReturnsLoading] = useState(false);

  // Refund Logs
  const [adminRefundLogs, setAdminRefundLogs] = useState([]);

  const [certSettings, setCertSettings] = useState({
    title: "",
    description: "",
    images: [],
    sectionTitle: "",
    sectionDescription: "",
    cards: [],
  });

  React.useEffect(() => {
    // Fetch cert settings on load
    client
      .get("/settings/certifications")
      .then(({ data }) => setCertSettings(data))
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    setEditingContent(homeContent);
  }, [homeContent]);

  const handleSaveContent = () => {
    updateHomeContent(editingContent);
    alert("Homepage content updated successfully!");
  };

  const handlePayoutAction = async (
    vendorId,
    transactionId,
    status,
    note = "",
  ) => {
    try {
      await client.put(`/admin/payouts/${vendorId}/${transactionId}`, {
        status,
        note,
      });
      // Refresh payouts
      const { data } = await client.get("/admin/payouts");
      setPayouts(data);
      alert(`Payout ${status} successfully`);
    } catch (error) {
      console.error("Failed to update payout", error);
      alert("Failed to update payout status");
    }
  };

  const [adminVendorMessages, setAdminVendorMessages] = useState([]);

  const fetchAdminVendorProducts = async (vendorId) => {
    try {
      const { data } = await client.get(
        `/admin/vendor-products?vendorId=${vendorId}&status=`,
      );
      setAdminVendorProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch vendor products", error);
    }
  };

  const fetchAdminVendorMessages = async (vendorId) => {
    try {
      const { data } = await client.get(`/vendor-messages/admin/${vendorId}`);
      setAdminVendorMessages(data);
    } catch (error) {
      console.error("Failed to fetch vendor messages", error);
    }
  };

  const sendAdminVendorMessage = async (vendorId, message) => {
    try {
      const { data } = await client.post(`/vendor-messages/admin/${vendorId}`, {
        message,
      });
      return true;
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message");
      return false;
    }
  };

  React.useEffect(() => {
    if (socket && selectedVendor && activeVendorModalTab === "messages") {
      const room = `vendor_${selectedVendor._id}`;
      socket.emit("join_chat", room);

      const handleReceiveMessage = (newMsg) => {
        setAdminVendorMessages((prev) => {
          if (prev.some((msg) => msg._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      };

      socket.on("receive_message", handleReceiveMessage);

      return () => {
        socket.off("receive_message", handleReceiveMessage);
      };
    }
  }, [socket, selectedVendor, activeVendorModalTab]);

  React.useEffect(() => {
    const fetchInquiries = async () => {
      if (activeTab === "inquiries") {
        try {
          const { data } = await client.get("/inquiries");
          setInquiries(data);
        } catch (error) {
          console.error("Failed to fetch inquiries", error);
        }
      } else if (activeTab === "users") {
        try {
          const { data } = await client.get("/auth/users");
          setUsers(data);
        } catch (error) {
          console.error("Failed to fetch users", error);
        }
      } else if (activeTab === "b2b") {
        try {
          const [inqRes, distRes, sampRes, setRes] = await Promise.all([
            client.get("/inquiries"),
            client.get("/b2b/distributors"),
            client.get("/b2b/samples"),
            client.get("/b2b/settings"),
          ]);
          setInquiries(inqRes.data);
          setDistributors(distRes.data);
          setSamples(sampRes.data);

          // Populate settings forms
          if (setRes.data) {
            setAdminPricingProducts(
              setRes.data.pricingProducts.map((p, i) => ({ ...p, id: i })),
            ); // Add temp ID for UI list handling
          }
        } catch (error) {
          console.error("Failed to fetch B2B data", error);
        }
      } else if (activeTab === "reports") {
        try {
          const [analyticsRes, platformRes] = await Promise.all([
            client.get("/orders/analytics"),
            client.get("/admin/analytics/overview"),
          ]);
          setAnalyticsData(analyticsRes.data);
          setPlatformAnalytics(platformRes.data);
        } catch (error) {
          console.error("Failed to fetch analytics", error);
        }
      } else if (activeTab === "messages") {
        try {
          const { data } = await client.get("/contact");
          setContactMessages(data);
        } catch (error) {
          console.error("Failed to fetch messages", error);
        }
      } else if (activeTab === "payouts") {
        try {
          const { data } = await client.get("/admin/payouts");
          setPayouts(data);
        } catch (error) {
          console.error("Failed to fetch payouts", error);
        }
      } else if (activeTab === "coupons") {
        try {
          const { data } = await client.get("/coupons");
          setCoupons(data);
        } catch (error) {
          console.error("Failed to fetch coupons", error);
        }
      } else if (activeTab === "vendors") {
        try {
          const params = new URLSearchParams();
          if (vendorFilter) params.append("status", vendorFilter);
          if (vendorSearch) params.append("search", vendorSearch);
          const [vendorsRes, analyticsRes] = await Promise.all([
            client.get(`/admin/vendors?${params.toString()}`),
            client.get("/admin/analytics/vendors"),
          ]);
          setVendors(vendorsRes.data.vendors);
          setVendorsPagination({
            page: vendorsRes.data.page,
            pages: vendorsRes.data.pages,
            total: vendorsRes.data.total,
          });
          setVendorAnalytics(analyticsRes.data);
        } catch (error) {
          console.error("Failed to fetch vendors", error);
        }
      } else if (activeTab === "approvals") {
        try {
          const [approvalsRes, productsRes] = await Promise.all([
            client.get("/admin/approvals"),
            client.get("/admin/vendor-products?status=pending"),
          ]);
          setPendingApprovals(approvalsRes.data);
          setPendingProducts(productsRes.data.products || []);
          setPendingProductsCounts(
            productsRes.data.counts || { pending: 0, approved: 0, rejected: 0 },
          );
        } catch (error) {
          console.error("Failed to fetch approvals", error);
        }
      } else if (activeTab === "pricing") {
        try {
          const { data } = await client.get("/admin/pricing");
          setPricingTiers(data);
        } catch (error) {
          console.error("Failed to fetch pricing", error);
        }
      } else if (activeTab === "returns") {
        setReturnsLoading(true);
        try {
          const params = new URLSearchParams();
          if (returnsFilter) params.append("status", returnsFilter);
          const { data } = await client.get(
            `/admin/returns?${params.toString()}`,
          );
          setAdminRefundLogs(data.returns || []); // Potentially wrong state variable used in my previous thought? No, this is returns.
          setAdminReturns(data.returns || []);
          setReturnsCounts(data.counts || {});
        } catch (error) {
          console.error("Failed to fetch returns", error);
        } finally {
          setReturnsLoading(false);
        }
      } else if (activeTab === "refunds") {
        try {
          const { data } = await client.get("/refunds/admin-logs");
          setAdminRefundLogs(data);
        } catch (error) {
          console.error("Failed to fetch refund logs", error);
        }
      }
    };
    fetchInquiries();
  }, [activeTab, vendorFilter, vendorSearch, returnsFilter]);

  // Initial Product State
  const initialProductState = {
    name: "",
    slug: "",
    description: "",
    price: "",
    category: "",
    tag: "",
    image: "",
    image2: "",
    images: [""], // Initialize with one empty slot
    fullDescription: "",
    ingredients: "",
    features: "",
  };

  const [currentProduct, setCurrentProduct] = useState(initialProductState);
  const [isEditingData, setIsEditingData] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/admin" />;
  }

  // --- Product Handlers ---
  const handleImageUpload = (index) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newImages = [...currentProduct.images];
      newImages[index] = data;
      setCurrentProduct((prev) => ({ ...prev, images: newImages }));
    } catch (error) {
      console.error("File upload error", error);
      alert("Image upload failed");
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...currentProduct.images];
    newImages[index] = value;
    setCurrentProduct((prev) => ({ ...prev, images: newImages }));
  };

  const addImageSlot = () => {
    if (currentProduct.images.length < 5) {
      setCurrentProduct((prev) => ({ ...prev, images: [...prev.images, ""] }));
    }
  };

  const removeImageSlot = (index) => {
    if (currentProduct.images.length > 1) {
      const newImages = currentProduct.images.filter((_, i) => i !== index);
      setCurrentProduct((prev) => ({ ...prev, images: newImages }));
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const validImages = currentProduct.images.filter(
      (img) => img.trim() !== "",
    );
    if (validImages.length < 1) {
      alert("Please add at least 1 image.");
      return;
    }

    const productToSave = {
      ...currentProduct,
      price: parseFloat(currentProduct.price),
      currency: "₹",
      rating: currentProduct.rating || 5,
      reviews: currentProduct.reviews || [],
      // Sync legacy fields
      image: validImages[0],
      image2: validImages[1] || "",
      images: validImages,
      fullDescription: currentProduct.fullDescription || "",
      ingredients: currentProduct.ingredients || "",
      features:
        typeof currentProduct.features === "string"
          ? currentProduct.features
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean)
          : currentProduct.features || [],
    };

    if (isEditingData) {
      await updateProduct(productToSave);
    } else {
      await addProduct(productToSave);
    }
    setIsProductModalOpen(false);
    setCurrentProduct(initialProductState);
    setIsEditingData(false);
  };

  const handleEditClick = (product) => {
    setCurrentProduct({
      ...product,
      images:
        product.images && product.images.length > 0
          ? product.images
          : [product.image, product.image2].filter(Boolean),
      features: Array.isArray(product.features)
        ? product.features.join(", ")
        : product.features,
    });
    setIsEditingData(true);
    setIsProductModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
    }
  };

  const handleAddNewClick = () => {
    setCurrentProduct(initialProductState);
    setIsEditingData(false);
    setIsProductModalOpen(true);
  };

  // --- Coupon Handlers ---
  const handleOpenCouponModal = (user = null) => {
    setSelectedUser(user);
    setCouponData({
      code: user
        ? `WELCOME-${user.name.split(" ")[0].toUpperCase()}-${Math.floor(
            Math.random() * 100,
          )}`
        : "",
      discountType: "percentage",
      discountValue: "10",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      maxUses: "1",
      isActive: true,
      assignedTo: user ? user._id : null,
    });
    setIsCouponModalOpen(true);
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...couponData,
        discountValue: parseFloat(couponData.discountValue),
        maxUses: parseInt(couponData.maxUses),
      };

      // If assignedTo is set in state (via user selection flow), use it.
      // If it's empty string or null, remove it from payload to make it general
      if (!payload.assignedTo) {
        delete payload.assignedTo;
      }

      await client.post("/coupons", payload);
      alert("Coupon created successfully!");
      setIsCouponModalOpen(false);
      setCouponData({
        code: "",
        discountValue: 10,
        expiryDate: "",
        maxUses: 1,
      });
      if (activeTab === "coupons") {
        const { data } = await client.get("/coupons");
        setCoupons(data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create coupon");
    }
  };

  const handleSaveB2BSettings = async () => {
    try {
      // Strip UI-only IDs if needed or backend ignores them. Backend schema expects objects without 'id' usually but mongoose handles extra fields gracefully or we strictly define schema.
      // Our schema is: pricingProducts: [{name, price}], exportDocs: [{name, type}]
      const payload = {
        pricingProducts: adminPricingProducts.map(({ name, price }) => ({
          name,
          price,
        })),
      };
      await client.put("/b2b/settings", payload);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save settings.");
    }
  };

  const handlePrintInvoice = (order) => {
    const invoiceHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice - #${order._id.slice(-8).toUpperCase()}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    @page { size: A4; margin: 15mm; }
                    body {
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                        background: white;
                        color: #333;
                        font-size: 13px;
                        line-height: 1.4;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .invoice-container {
                        max-width: 210mm;
                        margin: 0 auto;
                        background: white;
                        position: relative;
                    }
                    .accent-bar {
                        height: 6px;
                        background: linear-gradient(90deg, #D4AF37 0%, #F5D061 50%, #D4AF37 100%);
                        margin-bottom: 20px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 25px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #e5e5e5;
                    }
                    .logo-section {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    .logo {
                        width: 70px;
                        height: 70px;
                    }
                    .company-info h1 {
                        font-size: 24px;
                        color: #1a4d2e;
                        font-weight: 800;
                        margin-bottom: 3px;
                    }
                    .company-tagline {
                        color: #D4AF37;
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 1.5px;
                        font-weight: 600;
                        margin-bottom: 8px;
                    }
                    .company-contact {
                        color: #666;
                        font-size: 11px;
                        line-height: 1.5;
                    }
                    .invoice-label {
                        text-align: right;
                    }
                    .invoice-label h2 {
                        font-size: 12px;
                        color: #D4AF37;
                        font-weight: 700;
                        margin-bottom: 3px;
                        letter-spacing: 2px;
                    }
                    .invoice-label .inv-number {
                        font-size: 28px;
                        color: #1a4d2e;
                        font-weight: 700;
                    }
                    .detail-cards {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    .card {
                        background: #fafaf8;
                        padding: 15px;
                        border-radius: 6px;
                        border-left: 3px solid #D4AF37;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    .card h3 {
                        font-size: 10px;
                        color: #D4AF37;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 8px;
                        font-weight: 700;
                    }
                    .card p {
                        font-size: 11px;
                        color: #444;
                        line-height: 1.5;
                        margin: 2px 0;
                    }
                    .card .highlight {
                        color: #1a4d2e;
                        font-weight: 700;
                        font-size: 12px;
                    }
                    .status-tag {
                        background: linear-gradient(135deg, #1a4d2e 0%, #2d7a4f 100%);
                        color: white;
                        padding: 4px 10px;
                        border-radius: 15px;
                        font-size: 9px;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: inline-block;
                        margin-top: 6px;
                    }
                    .items-section {
                        margin-bottom: 15px;
                    }
                    .section-title {
                        font-size: 14px;
                        color: #D4AF37;
                        font-weight: 700;
                        margin-bottom: 12px;
                        padding-bottom: 6px;
                        border-bottom: 2px solid #7cb342;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 12px;
                    }
                    thead th {
                        background: #1a4d2e;
                        color: white;
                        padding: 10px 8px;
                        text-align: left;
                        font-size: 10px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    thead th:first-child {
                        border-radius: 5px 0 0 0;
                    }
                    thead th:last-child {
                        border-radius: 0 5px 0 0;
                        text-align: right;
                    }
                    tbody tr {
                        border-bottom: 1px solid #f0f0f0;
                    }
                    tbody tr:last-child {
                        border-bottom: none;
                    }
                    tbody td {
                        padding: 12px 8px;
                        color: #444;
                    }
                    tbody td:nth-child(2),
                    tbody td:nth-child(3),
                    tbody td:nth-child(4) {
                        text-align: right;
                    }
                    .product-name {
                        font-weight: 700;
                        color: #1a4d2e;
                        margin-bottom: 3px;
                        font-size: 13px;
                    }
                    .product-desc {
                        color: #999;
                        font-size: 11px;
                        font-style: italic;
                    }
                    .totals-section {
                        margin-top: 15px;
                    }
                    .totals-box {
                        margin-left: auto;
                        width: 280px;
                        background: #fafaf8;
                        border-radius: 6px;
                        padding: 15px;
                        border-left: 3px solid #D4AF37;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        font-size: 12px;
                        color: #555;
                        border-bottom: 1px solid #e5e5e5;
                    }
                    .total-row:last-child {
                        border-bottom: none;
                    }
                    .total-row.grand {
                        background: linear-gradient(135deg, #1a4d2e 0%, #2d7a4f 100%);
                        color: white;
                        margin: 12px -15px -15px;
                        padding: 15px;
                        border-radius: 0 0 6px 6px;
                        font-size: 16px;
                        font-weight: 700;
                    }
                    .footer {
                        margin-top: 25px;
                        padding-top: 15px;
                        text-align: center;
                        border-top: 1px solid #e5e5e5;
                    }
                    .footer p {
                        color: #777;
                        font-size: 11px;
                        line-height: 1.6;
                        margin-bottom: 15px;
                    }
                    .signature-section {
                        margin-top: 20px;
                        text-align: right;
                    }
                    .sig-line {
                        display: inline-block;
                        border-top: 2px solid #1a4d2e;
                        padding-top: 6px;
                        width: 180px;
                        font-size: 10px;
                        color: #666;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        font-weight: 600;
                    }
                    @media print {
                        body { background: none; padding: 0; }
                        .invoice-container { margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="accent-bar"></div>

                    <div class="header">
                        <div class="logo-section">
                            <img src="${Logo}" alt="Siraba Organic Logo" class="logo">
                            <div class="company-info">
                                <h1>${"Siraba Organic"}</h1>
                                <div class="company-tagline">Premium Quality Organic Products</div>
                                <div class="company-contact">
                                    123 Saffron Valley, Pampore • Kashmir, India 192121<br>
                                    info@sirabaorganic.com • +91 99066 93633
                                </div>
                            </div>
                        </div>
                        <div class="invoice-label">
                            <h2>INVOICE</h2>
                            <div class="inv-number">#${order._id
                              .slice(-8)
                              .toUpperCase()}</div>
                        </div>
                    </div>

                    <div class="detail-cards">
                        <div class="card">
                            <h3>Bill To</h3>
                            <p class="highlight">${
                              order.shippingAddress?.name ||
                              order.user?.name ||
                              "Customer"
                            }</p>
                            <p>${order.shippingAddress?.address || ""}</p>
                            <p>${order.shippingAddress?.city || ""}, ${
                              order.shippingAddress?.postalCode || "00000"
                            }</p>
                            <p>${
                              order.shippingAddress?.country || "Country"
                            }</p>
                        </div>
                        <div class="card">
                            <h3>Invoice Date</h3>
                            <p class="highlight">${new Date(
                              order.createdAt,
                            ).toLocaleDateString("en-IN")}</p>
                            <p style="margin-top: 6px; font-size: 10px; color: #888;">Order ID:</p>
                            <p style="font-size: 10px; word-break: break-all;">${
                              order._id
                            }</p>
                        </div>
                        <div class="card">
                            <h3>Status</h3>
                            <span class="status-tag">● ${order.status.toUpperCase()}</span>
                        </div>
                    </div>

                    <div class="items-section">
                        <div class="section-title">Order Items</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>DESCRIPTION</th>
                                    <th style="width: 80px; text-align: center;">HSN</th>
                                    <th style="width: 50px; text-align: center;">QTY</th>
                                    <th style="width: 90px; text-align: right;">UNIT PRICE</th>
                                    <th style="width: 90px;">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.orderItems
                                  .map(
                                    (item) => `
                                    <tr>
                                        <td>
                                            <div class="product-name">${
                                              item.name
                                            }</div>
                                            <div class="product-desc">Premium Organic Selection</div>
                                        </td>
                                        <td style="text-align: center; font-size: 11px; color: #666;">${
                                          item.hsn || "0909"
                                        }</td>
                                        <td style="text-align: center; font-weight: 700;">${
                                          item.quantity
                                        }</td>
                                        <td style="text-align: right;">₹${item.price.toFixed(
                                          2,
                                        )}</td>
                                        <td style="text-align: right; font-weight: 700; color: #1a4d2e;">₹${(
                                          item.price * item.quantity
                                        ).toFixed(2)}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>

                    <div class="totals-section">
                        <div class="totals-box">
                            <div class="total-row">
                                <span>Subtotal</span>
                                <span>₹${order.totalPrice.toFixed(2)}</span>
                            </div>
                            <div class="total-row">
                                <span>Tax (Included)</span>
                                <span>₹0.00</span>
                            </div>
                            <div class="total-row">
                                <span>Shipping</span>
                                <span>${order.shippingPrice > 0 ? `₹${order.shippingPrice.toFixed(2)}` : "Free"}</span>
                            </div>
                            <div class="total-row grand">
                                <span>GRAND TOTAL</span>
                                <span>₹${order.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Thank you for choosing Siraba Organic. We appreciate your business!<br>
                        For any queries, please contact our support team.</p>
                        <div class="signature-section">
                            <div class="sig-line">Authorized Signatory</div>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() { setTimeout(() => window.print(), 500); }
                </script>
            </body>
            </html>
        `;

    const newWindow = window.open("", "_blank");
    newWindow.document.write(invoiceHTML);
    newWindow.document.close();
  };

  // --- Render Sections ---
  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-surface p-6 rounded-sm shadow-sm border border-secondary/10 flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">
            Total Sales
          </p>
          <h3 className="text-3xl font-bold text-primary mt-1">
            {formatPrice(
              orders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0),
            )}
          </h3>
        </div>
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
          <ShoppingBag size={24} />
        </div>
      </div>
      <div className="bg-surface p-6 rounded-sm shadow-sm border border-secondary/10 flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">
            Active Orders
          </p>
          <h3 className="text-3xl font-bold text-primary mt-1">
            {
              orders.filter(
                (o) =>
                  !["Delivered", "Shipped", "Cancelled", "Closed"].includes(
                    o.status,
                  ),
              ).length
            }
          </h3>
        </div>
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <Package size={24} />
        </div>
      </div>
      <div className="bg-surface p-6 rounded-sm shadow-sm border border-secondary/10 flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">
            Active Users (Live)
          </p>
          <h3 className="text-3xl font-bold text-primary mt-1">
            {activeUsers}
          </h3>
        </div>
        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
          <Users size={24} />
        </div>
      </div>
    </div>
  );

  // Helper function to get order status details
  const getOrderStatusInfo = (status) => {
    const statusMap = {
      Pending: { color: "yellow", icon: Clock, step: 1, label: "Order Placed" },
      Approved: { color: "blue", icon: Check, step: 2, label: "Confirmed" },
      Packed: { color: "purple", icon: PackageCheck, step: 3, label: "Packed" },
      Shipped: { color: "indigo", icon: Truck, step: 4, label: "Shipped" },
      Delivered: {
        color: "green",
        icon: CheckCircle,
        step: 5,
        label: "Delivered",
      },
    };
    return statusMap[status] || statusMap["Pending"];
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const [dateFilter, setDateFilter] = useState("all"); // 'all' or 'today'

  const renderOrders = () => {
    const filteredOrders = orders.filter((order) => {
      if (dateFilter === "today") {
        const orderDate = new Date(order.createdAt).toDateString();
        const today = new Date().toDateString();
        return orderDate === today;
      }
      return true;
    });

    return (
      <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden">
        <div className="p-6 border-b border-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary">Recent Orders</h2>
            <p className="text-xs text-text-secondary mt-1">
              Manage order workflow: Pending → Approved → Packed → Shipped
            </p>
          </div>
          <div className="flex bg-secondary/5 rounded-sm p-1">
            <button
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                dateFilter === "all"
                  ? "bg-white shadow-sm text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setDateFilter("today")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                dateFilter === "today"
                  ? "bg-white shadow-sm text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Today
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-8"></th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/10">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrders[order._id];
                const statusInfo = getOrderStatusInfo(order.status);
                // Extract unique vendors
                const uniqueVendors = Array.from(
                  new Set(
                    order.orderItems
                      ?.map(
                        (item) =>
                          item.product?.vendor?.businessName || "In-House",
                      )
                      .filter(Boolean),
                  ),
                );

                return (
                  <React.Fragment key={order._id}>
                    <tr className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleOrderExpand(order._id)}
                          className="text-text-secondary hover:text-primary transition-colors"
                          title="Toggle tracking view"
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {order._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {order.user?.name || "Guest"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-text-secondary">
                          {order.orderItems?.length || 0} item(s)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {uniqueVendors.map((vendor, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 rounded-full w-fit font-bold ${vendor === "In-House" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                            >
                              {vendor}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-center
                                                    ${
                                                      order.status === "Pending"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : order.status ===
                                                            "Approved"
                                                          ? "bg-blue-100 text-blue-800"
                                                          : order.status ===
                                                              "Packed"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : order.status ===
                                                                "Shipped"
                                                              ? "bg-indigo-100 text-indigo-800"
                                                              : "bg-green-100 text-green-800"
                                                    }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold whitespace-nowrap">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <div className="relative">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                updateOrderStatus(order._id, e.target.value)
                              }
                              className={`appearance-none px-3 py-1.5 pr-8 text-xs font-bold uppercase tracking-wider border rounded-sm focus:outline-none focus:ring-1 focus:ring-opacity-50 cursor-pointer
                                                            ${
                                                              order.status ===
                                                              "Pending"
                                                                ? "bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-400"
                                                                : order.status ===
                                                                    "Approved"
                                                                  ? "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400"
                                                                  : order.status ===
                                                                      "Packed"
                                                                    ? "bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-400"
                                                                    : order.status ===
                                                                        "Shipped"
                                                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-400"
                                                                      : "bg-green-50 text-green-700 border-green-200 focus:ring-green-400"
                                                            }`}
                            >
                              <option value="Pending">Placed</option>
                              <option value="Approved">Confirmed</option>
                              <option value="Packed">Packed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                              <ChevronDown size={12} />
                            </div>
                          </div>
                          <button
                            onClick={() => downloadInvoice(order._id)}
                            className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white px-3 py-1.5 rounded-sm transition-all shadow-sm flex items-center gap-1.5"
                            title="Download Premium Invoice"
                          >
                            <Download size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Invoice
                            </span>
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(order)}
                            className="bg-white border border-secondary/20 hover:bg-secondary/5 text-text-secondary p-1.5 rounded-sm transition-colors hidden"
                            title="Print Invoice"
                          >
                            <FileText size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-secondary/5">
                        <td colSpan="8" className="px-6 py-6">
                          <div className="max-w-4xl">
                            {/* Tracking Timeline */}
                            <div className="mb-6">
                              <p className="text-xs font-bold uppercase text-text-secondary mb-4 tracking-wider">
                                Order Tracking
                              </p>
                              <div className="flex items-center justify-between relative">
                                {/* Progress Line */}
                                <div className="absolute top-5 left-0 right-0 h-1 bg-secondary/20">
                                  <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{
                                      width: `${
                                        ((statusInfo.step - 1) / 3) * 100
                                      }%`,
                                    }}
                                  />
                                </div>

                                {/* Steps */}
                                {[
                                  "Pending",
                                  "Approved",
                                  "Packed",
                                  "Shipped",
                                  "Delivered",
                                ].map((status, idx) => {
                                  const stepInfo = getOrderStatusInfo(status);
                                  const isComplete = statusInfo.step > idx + 1;
                                  const isCurrent = statusInfo.step === idx + 1;
                                  const StepIcon = stepInfo.icon;

                                  return (
                                    <div
                                      key={status}
                                      className="flex flex-col items-center relative z-10"
                                    >
                                      <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                                          isComplete
                                            ? "bg-primary text-white"
                                            : isCurrent
                                              ? "bg-primary text-white ring-4 ring-primary/20"
                                              : "bg-white border-2 border-secondary/20 text-text-secondary"
                                        }`}
                                      >
                                        <StepIcon size={18} />
                                      </div>
                                      <p
                                        className={`text-xs font-medium text-center ${
                                          isComplete || isCurrent
                                            ? "text-primary font-bold"
                                            : "text-text-secondary"
                                        }`}
                                      >
                                        {stepInfo.label}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-white rounded-sm border border-secondary/10 p-4">
                              <p className="text-xs font-bold uppercase text-text-secondary mb-3">
                                Order Items
                              </p>
                              <div className="space-y-2">
                                {order.orderItems?.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 text-sm"
                                  >
                                    <div className="w-10 h-10 bg-background rounded-sm border border-secondary/10 p-1 flex-shrink-0">
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <div className="flex-grow">
                                      <p className="font-medium text-primary">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-text-secondary">
                                        Qty: {item.quantity} ×{" "}
                                        {formatPrice(item.price)}
                                      </p>
                                    </div>
                                    <p className="font-bold text-primary">
                                      {formatPrice(item.quantity * item.price)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-8 text-center text-text-secondary">
              No orders found.
            </div>
          )}
        </div>
      </div>
    );
  };
  const renderProducts = () => (
    <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden">
      <div className="p-6 border-b border-secondary/10 flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">Product Inventory</h2>
        <button
          onClick={handleAddNewClick}
          className="bg-primary text-surface px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all rounded-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Tag</th>
              <th className="px-6 py-4">Sold By</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/10">
            {products.map((product) => (
              <tr
                key={product._id || product.id}
                className={`hover:bg-secondary/5 transition-colors ${
                  product.isVendorProduct ? "bg-blue-50/30" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div className="w-10 h-10 bg-white rounded-sm border border-secondary/10 p-1">
                    <img
                      src={product.image}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-primary">
                  {product.name}
                </td>
                <td className="px-6 py-4 text-text-secondary">
                  {product.category}
                </td>
                <td className="px-6 py-4 font-bold">
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-bold uppercase rounded-sm">
                    {product.tag}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {product.isVendorProduct ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full w-fit">
                      <Store size={12} />
                      {product.vendor?.businessName || "Vendor"}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full w-fit">
                      In-House
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product._id || product.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleSaveCertSettings = async () => {
    await client.put("/settings/certifications", certSettings);
    alert("Certification content saved!");
  };

  const defaultCards = [
    {
      title: "India Organic (NPOP)",
      description:
        "Certified under the National Programme for Organic Production (NPOP) by APEDA, Ministry of Agriculture & Farmers Welfare, Government of India. This ensures our products meet India's national standards for organic agriculture, processing, and quality control.",
      icon: "",
    },
    {
      title: "USDA Organic (NOP)",
      description:
        "Compliant with United States Department of Agriculture National Organic Program standards. This certification validates our commitment to producing organic products that meet strict USDA requirements for American and international markets.",
      icon: "",
    },
    {
      title: "EU Organic & Kosher",
      description:
        "Certified according to European Union Organic Regulations (EC No. 834/2007) and Kosher standards. These certifications ensure our products meet the highest European quality benchmarks and religious dietary requirements.",
      icon: "",
    },
  ];

  const loadDefaultCards = () => {
    if (
      window.confirm(
        "This will replace current cards with the default 3 cards. Continue?",
      )
    ) {
      setCertSettings((prev) => ({ ...prev, cards: defaultCards }));
    }
  };

  const handleCardImageUpload = (cardIndex) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newCards = [...(certSettings.cards || [])];
      newCards[cardIndex].icon = data;
      setCertSettings((prev) => ({ ...prev, cards: newCards }));
    } catch (error) {
      console.error("File upload error", error);
      alert("Icon upload failed");
    }
  };

  // Helper to add card
  const addCard = () => {
    setCertSettings((prev) => ({
      ...prev,
      cards: [
        ...(prev.cards || []),
        {
          title: "New Certification",
          description: "Description here...",
          icon: "",
        },
      ],
    }));
  };

  const removeCard = (index) => {
    setCertSettings((prev) => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index),
    }));
  };

  const updateCard = (index, field, value) => {
    const newCards = [...(certSettings.cards || [])];
    newCards[index][field] = value;
    setCertSettings((prev) => ({ ...prev, cards: newCards }));
  };

  const renderUsers = () => (
    <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-secondary/10">
        <h2 className="text-xl font-bold text-primary">Registered Users</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/10">
            {users.map((user) => (
              <tr
                key={user._id}
                className="hover:bg-secondary/5 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-primary">
                  {user.name}
                </td>
                <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                <td className="px-6 py-4">
                  {user.isAdmin ? (
                    <span className="text-green-600 font-bold text-xs uppercase bg-green-50 px-2 py-1 rounded-full">
                      Admin
                    </span>
                  ) : (
                    <span className="text-text-secondary text-xs uppercase">
                      User
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-text-secondary">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleOpenCouponModal(user)}
                    className="text-accent hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                  >
                    <TicketPercent size={14} /> Send Coupon
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 p-6">
        <h2 className="text-xl font-bold text-primary mb-6">
          Homepage Content
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Subheading
            </label>
            <input
              type="text"
              value={editingContent?.subheading || ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  subheading: e.target.value,
                })
              }
              className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Heading
            </label>
            <input
              type="text"
              value={editingContent?.heading || ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  heading: e.target.value,
                })
              }
              className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none"
            />
          </div>

          <div className="pt-4 border-t border-secondary/10">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
              Signature Collection Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1].map((index) => (
                <div key={index}>
                  <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                    Slot {index + 1}
                  </label>
                  <select
                    value={editingContent?.signatureProducts?.[index] || ""}
                    onChange={(e) => {
                      const newSignatureProducts = [
                        ...(editingContent?.signatureProducts || []),
                      ];
                      newSignatureProducts[index] = e.target.value;
                      setEditingContent({
                        ...editingContent,
                        signatureProducts: newSignatureProducts.filter(Boolean),
                      });
                    }}
                    className="w-full bg-background border border-secondary/20 p-2 rounded-sm focus:border-accent outline-none text-sm"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-secondary/10 mt-4">
            <button
              onClick={handleSaveContent}
              className="bg-primary text-surface px-8 py-3 text-sm font-medium uppercase tracking-wider hover:bg-accent hover:text-primary transition-colors rounded-sm shadow-md"
            >
              Save Home Content
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 p-6 h-fit">
        <h2 className="text-xl font-bold text-primary mb-6">
          Certifications Content
        </h2>
        <div className="space-y-6">
          {/* Top Section */}
          <div className="pb-6 border-b border-secondary/10 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
              Top Section (Hero)
            </h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Hero Title
              </label>
              <input
                type="text"
                value={certSettings.title || ""}
                onChange={(e) =>
                  setCertSettings({ ...certSettings, title: e.target.value })
                }
                className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Hero Description
              </label>
              <textarea
                rows={3}
                value={certSettings.description || ""}
                onChange={(e) =>
                  setCertSettings({
                    ...certSettings,
                    description: e.target.value,
                  })
                }
                className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Hero Image
              </label>
              <input
                type="text"
                value={certSettings?.images?.[0] || ""}
                onChange={(e) =>
                  setCertSettings({ ...certSettings, images: [e.target.value] })
                }
                className="w-full bg-background border border-secondary/20 p-2 rounded-sm mb-2 text-sm"
                placeholder="Image URL"
              />
              {/* Re-using handleImageUpload logic but adapting might be needed if I removed it... assume I didn't fully remove, let's just make a dedicated one if needed. I'll stick to URL input for now or add upload if requested specifically for this image again. The card image upload is below. */}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pb-6 border-b border-secondary/10 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
              Bottom Section (Our Certification)
            </h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={certSettings.sectionTitle || ""}
                onChange={(e) =>
                  setCertSettings({
                    ...certSettings,
                    sectionTitle: e.target.value,
                  })
                }
                className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Section Description
              </label>
              <textarea
                rows={3}
                value={certSettings.sectionDescription || ""}
                onChange={(e) =>
                  setCertSettings({
                    ...certSettings,
                    sectionDescription: e.target.value,
                  })
                }
                className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none resize-none"
              />
            </div>
          </div>

          {/* Cards */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                Certification Cards
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={loadDefaultCards}
                  className="text-xs bg-secondary/10 text-text-secondary px-2 py-1 rounded-sm uppercase font-bold hover:bg-secondary/20 transition-colors"
                >
                  Load Defaults
                </button>
                <button
                  onClick={addCard}
                  className="text-xs bg-primary text-surface px-2 py-1 rounded-sm uppercase font-bold hover:bg-accent hover:text-primary transition-colors"
                >
                  + Add Card
                </button>
              </div>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {certSettings.cards?.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-background border border-secondary/20 p-4 rounded-sm relative group"
                >
                  <button
                    onClick={() => removeCard(idx)}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => updateCard(idx, "title", e.target.value)}
                      className="w-full bg-surface border border-secondary/10 p-2 rounded-sm text-sm font-bold text-primary"
                      placeholder="Card Title"
                    />
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) =>
                        updateCard(idx, "description", e.target.value)
                      }
                      className="w-full bg-surface border border-secondary/10 p-2 rounded-sm text-xs resize-none"
                      placeholder="Card Description"
                    />
                    <div className="flex items-center gap-2">
                      {card.icon && (
                        <img
                          src={card.icon}
                          alt="Icon"
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <input
                        type="text"
                        value={card.icon || ""}
                        onChange={(e) =>
                          updateCard(idx, "icon", e.target.value)
                        }
                        className="flex-1 bg-surface border border-secondary/10 p-1.5 rounded-sm text-xs"
                        placeholder="Icon URL"
                      />
                      <label className="bg-secondary/10 p-1.5 rounded-sm cursor-pointer hover:bg-secondary/20 transition-colors">
                        <Plus size={14} />
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleCardImageUpload(idx)}
                          accept="image/*"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-secondary/10 mt-4">
            <button
              onClick={handleSaveCertSettings}
              className="bg-primary text-surface px-8 py-3 text-sm font-medium uppercase tracking-wider hover:bg-accent hover:text-primary transition-colors rounded-sm shadow-md"
            >
              Save Certifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInquiries = () => (
    <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden">
      <div className="p-6 border-b border-secondary/10">
        <h2 className="text-xl font-bold text-primary">Trade Inquiries</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Direct Contact</th>
              <th className="px-6 py-4">Product Interest</th>
              <th className="px-6 py-4">Destination</th>
              <th className="px-6 py-4">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/10">
            {inquiries.map((inquiry) => (
              <tr
                key={inquiry._id}
                className="hover:bg-secondary/5 transition-colors align-top"
              >
                <td className="px-6 py-4 text-xs text-text-secondary whitespace-nowrap">
                  {new Date(
                    inquiry.createdAt || Date.now(),
                  ).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-primary">
                    {inquiry.companyName}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {inquiry.contactPerson}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-primary">{inquiry.email}</div>
                  <div className="text-xs text-text-secondary">
                    {inquiry.phone}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {inquiry.productInterest.map((p, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-secondary/10 text-primary text-xs rounded-sm"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    Qty: {inquiry.quantity}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{inquiry.destination}</td>
                <td
                  className="px-6 py-4 text-text-secondary italic max-w-xs truncate"
                  title={inquiry.message}
                >
                  {inquiry.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inquiries.length === 0 && (
          <div className="p-8 text-center text-text-secondary">
            No inquiries found.
          </div>
        )}
      </div>
    </div>
  );

  const renderB2B = () => (
    <div className="space-y-6">
      {/* B2B Sub-navigation */}
      <div className="flex bg-surface rounded-sm shadow-sm overflow-hidden p-1 border border-secondary/10 w-fit">
        {["requests", "calculator"].map((opt) => (
          <button
            key={opt}
            onClick={() => setB2bSection(opt)}
            className={`px-6 py-2 text-sm font-bold uppercase tracking-wider rounded-sm transition-all
                            ${
                              b2bSection === opt
                                ? "bg-primary text-surface shadow-md"
                                : "text-text-secondary hover:text-primary hover:bg-secondary/5"
                            }`}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      {b2bSection === "requests" && (
        <div className="space-y-8">
          {/* Trade Inquiries Table */}
          <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden">
            <div className="p-6 border-b border-secondary/10">
              <h2 className="text-xl font-bold text-primary">
                Trade Inquiries
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Interest</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/10">
                  {inquiries.map((item) => (
                    <tr key={item._id} className="hover:bg-secondary/5">
                      <td className="px-6 py-4 text-xs">
                        {new Date(
                          item.createdAt || Date.now(),
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {item.companyName}
                      </td>
                      <td className="px-6 py-4">
                        <div>{item.contactPerson}</div>
                        <div className="text-xs text-text-secondary">
                          {item.email}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {item.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.productInterest?.map((p, i) => (
                            <span
                              key={i}
                              className="bg-secondary/10 px-1 py-0.5 rounded text-xs"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-text-secondary mt-1">
                          Qty: {item.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs italic">
                        {item.message}
                      </td>
                    </tr>
                  ))}
                  {inquiries.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-6 text-center text-text-secondary"
                      >
                        No inquiries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distributor Applications Table */}
          <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden">
            <div className="p-6 border-b border-secondary/10">
              <h2 className="text-xl font-bold text-primary">
                Partner Onboarding
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Business Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Region/Stats</th>
                    <th className="px-6 py-4">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/10">
                  {distributors.map((item) => (
                    <tr key={item._id} className="hover:bg-secondary/5">
                      <td className="px-6 py-4 text-xs">
                        {new Date(item.date || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {item.businessName}
                      </td>
                      <td className="px-6 py-4">
                        <div>{item.contactName}</div>
                        <div className="text-xs text-text-secondary">
                          {item.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{item.region}</div>
                        <div className="text-xs text-text-secondary">
                          {item.yearsInBusiness} yrs | {item.annualTurnover}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs italic">
                        {item.message}
                      </td>
                    </tr>
                  ))}
                  {distributors.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-6 text-center text-text-secondary"
                      >
                        No applications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Requests Table */}
          <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden">
            <div className="p-6 border-b border-secondary/10">
              <h2 className="text-xl font-bold text-primary">
                Sample Requests
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Items Required</th>
                    <th className="px-6 py-4">Shipping Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/10">
                  {samples.map((item) => (
                    <tr key={item._id} className="hover:bg-secondary/5">
                      <td className="px-6 py-4 text-xs">
                        {new Date(item.date || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {item.companyName}
                      </td>
                      <td className="px-6 py-4 md:whitespace-nowrap">
                        {item.recipient || item.contactName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.items?.map((p, i) => (
                            <span
                              key={i}
                              className="bg-secondary/10 px-1 py-0.5 rounded text-xs"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div>{item.address}</div>
                        <span className="font-bold text-primary">
                          Acc: {item.shippingAccount || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {samples.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-6 text-center text-text-secondary"
                      >
                        No sample requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {b2bSection === "calculator" && (
        <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-primary mb-6">
            Bulk Savings Calculator Settings
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Update the base prices used in the B2B calculator.
          </p>
          <div className="space-y-4">
            {adminPricingProducts.map((prod, idx) => (
              <div
                key={prod.id}
                className="flex items-center gap-4 bg-background p-4 border border-secondary/10 rounded-sm"
              >
                <div className="flex-grow">
                  <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={prod.name}
                    onChange={(e) => {
                      const newProds = [...adminPricingProducts];
                      newProds[idx].name = e.target.value;
                      setAdminPricingProducts(newProds);
                    }}
                    className="w-full bg-surface border-b border-secondary/20 py-1 focus:outline-none focus:border-accent font-medium text-primary"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                    Price / KG (₹)
                  </label>
                  <input
                    type="number"
                    value={prod.price}
                    onChange={(e) => {
                      const newProds = [...adminPricingProducts];
                      newProds[idx].price = parseInt(e.target.value);
                      setAdminPricingProducts(newProds);
                    }}
                    className="w-full bg-surface border-b border-secondary/20 py-1 focus:outline-none focus:border-accent font-bold text-primary"
                  />
                </div>
                <button
                  onClick={() => {
                    const newProds = adminPricingProducts.filter(
                      (_, i) => i !== idx,
                    );
                    setAdminPricingProducts(newProds);
                  }}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-sm mt-3"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setAdminPricingProducts([
                  ...adminPricingProducts,
                  { id: Date.now(), name: "New Product", price: 0 },
                ])
              }
              className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mt-4"
            >
              <Plus size={16} /> Add Product
            </button>

            <div className="pt-6 border-t border-secondary/10 mt-6">
              <button
                onClick={handleSaveB2BSettings}
                className="bg-primary text-surface px-8 py-3 text-sm font-medium uppercase tracking-wider hover:bg-accent hover:text-primary transition-colors rounded-sm shadow-md"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const [messageFilter, setMessageFilter] = useState("all"); // all, new, read, closed
  const [messageDateFilter, setMessageDateFilter] = useState("all"); // all, today, week, month
  const [expandedMessage, setExpandedMessage] = useState(null);

  const handleUpdateMessageStatus = async (id, newStatus) => {
    try {
      const { data } = await client.put(`/contact/${id}/status`, {
        status: newStatus,
      });
      setContactMessages(
        contactMessages.map((msg) => (msg._id === id ? data : msg)),
      );
    } catch (error) {
      console.error("Error updating message status:", error);
      alert("Failed to update message status");
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;
    try {
      await client.delete(`/contact/${id}`);
      setContactMessages(contactMessages.filter((msg) => msg._id !== id));
      alert("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  const renderMessages = () => {
    // Filter messages by status
    const filteredByStatus =
      messageFilter === "all"
        ? contactMessages
        : contactMessages.filter((msg) => {
            if (messageFilter === "new") return msg.status === "New";
            if (messageFilter === "read")
              return msg.status === "Read" || msg.status === "Replied";
            if (messageFilter === "closed") return msg.status === "Closed";
            return true;
          });

    // Filter by date
    const filteredMessages = filteredByStatus.filter((msg) => {
      if (messageDateFilter === "all") return true;
      const msgDate = new Date(msg.createdAt);
      const now = new Date();

      if (messageDateFilter === "today") {
        return msgDate.toDateString() === now.toDateString();
      } else if (messageDateFilter === "week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return msgDate >= weekAgo;
      } else if (messageDateFilter === "month") {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return msgDate >= monthAgo;
      }
      return true;
    });

    const unreadCount = contactMessages.filter(
      (m) => m.status === "New",
    ).length;
    const closedCount = contactMessages.filter(
      (m) => m.status === "Closed",
    ).length;

    return (
      <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-secondary/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary">
                Contact Messages
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                {unreadCount} new • {closedCount} closed •{" "}
                {filteredMessages.length} total
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Status Filter */}
              <div className="flex bg-secondary/5 rounded-sm p-1">
                {[
                  { key: "all", label: "All" },
                  { key: "new", label: "New", badge: unreadCount },
                  { key: "read", label: "Read" },
                  { key: "closed", label: "Closed" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setMessageFilter(filter.key)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors relative ${
                      messageFilter === filter.key
                        ? "bg-white shadow-sm text-primary"
                        : "text-text-secondary hover:text-primary"
                    }`}
                  >
                    {filter.label}
                    {filter.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                        {filter.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="flex bg-secondary/5 rounded-sm p-1">
                {[
                  { key: "all", label: "All Time" },
                  { key: "today", label: "Today" },
                  { key: "week", label: "Week" },
                  { key: "month", label: "Month" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setMessageDateFilter(filter.key)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                      messageDateFilter === filter.key
                        ? "bg-white shadow-sm text-primary"
                        : "text-text-secondary hover:text-primary"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Preview</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/10">
              {filteredMessages.map((msg) => {
                const isExpanded = expandedMessage === msg._id;
                const getStatusInfo = (status) => {
                  const statusMap = {
                    New: {
                      color: "blue",
                      bg: "bg-blue-50",
                      text: "text-blue-700",
                      border: "border-blue-200",
                    },
                    Read: {
                      color: "yellow",
                      bg: "bg-yellow-50",
                      text: "text-yellow-700",
                      border: "border-yellow-200",
                    },
                    Replied: {
                      color: "green",
                      bg: "bg-green-50",
                      text: "text-green-700",
                      border: "border-green-200",
                    },
                    Closed: {
                      color: "gray",
                      bg: "bg-gray-50",
                      text: "text-gray-700",
                      border: "border-gray-200",
                    },
                  };
                  return statusMap[status] || statusMap["New"];
                };
                const statusInfo = getStatusInfo(msg.status);

                return (
                  <React.Fragment key={msg._id}>
                    <tr
                      className={`hover:bg-secondary/5 transition-colors ${
                        msg.status === "New" ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-sm text-xs font-bold uppercase border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-primary">
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-text-secondary">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary whitespace-nowrap">
                        {msg.firstName} {msg.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`mailto:${msg.email}`}
                          className="text-accent hover:underline text-xs"
                        >
                          {msg.email}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-secondary/10 text-primary px-2 py-1 rounded-sm text-xs font-bold">
                          {msg.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <button
                          onClick={() =>
                            setExpandedMessage(isExpanded ? null : msg._id)
                          }
                          className="text-text-secondary hover:text-primary text-left truncate max-w-[200px] text-xs"
                          title={msg.message}
                        >
                          {msg.message}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setExpandedMessage(isExpanded ? null : msg._id)
                            }
                            className="bg-white border border-secondary/20 hover:bg-secondary/5 text-primary p-1.5 rounded-sm transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          {msg.status === "New" && (
                            <button
                              onClick={() =>
                                handleUpdateMessageStatus(msg._id, "Read")
                              }
                              className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 p-1.5 rounded-sm transition-colors"
                              title="Mark as Read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {msg.status !== "Closed" && (
                            <button
                              onClick={() =>
                                handleUpdateMessageStatus(msg._id, "Closed")
                              }
                              className="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 p-1.5 rounded-sm transition-colors"
                              title="Close"
                            >
                              <X size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 p-1.5 rounded-sm transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-secondary/5">
                        <td colSpan="7" className="px-6 py-6">
                          <div className="bg-white rounded-sm border border-secondary/10 p-6 max-w-4xl">
                            <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">
                              Message Details
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">
                                  Full Message
                                </label>
                                <p className="text-sm text-primary bg-background p-4 rounded-sm border border-secondary/10">
                                  {msg.message}
                                </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="block text-text-secondary uppercase font-bold mb-1">
                                    Submitted
                                  </span>
                                  <span className="text-primary">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {msg.readAt && (
                                  <div>
                                    <span className="block text-text-secondary uppercase font-bold mb-1">
                                      Read At
                                    </span>
                                    <span className="text-primary">
                                      {new Date(msg.readAt).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <span className="block text-text-secondary uppercase font-bold mb-1">
                                    Contact
                                  </span>
                                  <a
                                    href={`mailto:${msg.email}`}
                                    className="text-accent hover:underline"
                                  >
                                    Reply via Email
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredMessages.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-text-secondary"
                  >
                    No messages found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await client.delete(`/coupons/${id}`);
      setCoupons(coupons.filter((c) => c._id !== id));
      alert("Coupon deleted");
    } catch (error) {
      console.error(error);
      alert("Failed to delete coupon");
    }
  };

  const renderCoupons = () => (
    <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-secondary/10 flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">Coupon Management</h2>
        <button
          onClick={() => handleOpenCouponModal(null)}
          className="bg-primary text-surface px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-accent hover:text-primary transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Expiry</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/10">
            {coupons.map((coupon) => (
              <tr
                key={coupon._id}
                className="hover:bg-secondary/5 transition-colors"
              >
                <td className="px-6 py-4 font-bold font-mono text-primary">
                  {coupon.code}
                </td>
                <td className="px-6 py-4 font-bold text-accent">
                  {coupon.discountValue}%
                </td>
                <td className="px-6 py-4 text-xs uppercase">
                  {coupon.assignedTo ? "User Specific" : "General"}
                </td>
                <td className="px-6 py-4 text-text-secondary">
                  {coupon.assignedTo ? (
                    <div className="flex flex-col text-xs">
                      <span className="font-bold">
                        {coupon.assignedTo.name}
                      </span>
                      <span>{coupon.assignedTo.email}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-secondary italic">
                      Anyone
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-text-secondary">
                  {coupon.expiryDate
                    ? new Date(coupon.expiryDate).toLocaleDateString()
                    : "No Expiry"}
                </td>
                <td className="px-6 py-4 text-xs">
                  {coupon.usedCount} / {coupon.maxUses}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-sm text-xs font-bold uppercase ${
                      new Date(coupon.expiryDate) < new Date()
                        ? "bg-red-50 text-red-500"
                        : "bg-green-50 text-green-500"
                    }`}
                  >
                    {new Date(coupon.expiryDate) < new Date()
                      ? "Expired"
                      : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDeleteCoupon(coupon._id)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                    title="Delete Coupon"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-8 text-center text-text-secondary"
                >
                  No coupons active.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => {
    if (!analyticsData)
      return (
        <div className="p-12 text-center text-text-secondary">
          Loading Analytics...
        </div>
      );

    const maxSales = Math.max(
      ...(analyticsData.salesByDate?.map((d) => d.totalSales) || [100]),
      100,
    );
    const maxDemand = Math.max(
      ...(analyticsData.mostDemanding?.map((p) => p.totalQuantity) || [1]),
      1,
    );
    const maxRevenue = Math.max(
      ...(analyticsData.topRevenueProducts?.map((p) => p.totalRevenue) || [1]),
      1,
    );

    const downloadCSV = () => {
      const headers = ["Date", "Orders", "Revenue"];
      const rows = analyticsData.salesByDate.map((d) => [
        d._id,
        d.count,
        d.totalSales.toFixed(2),
      ]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "sales_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary">
            Performance Overview
          </h2>
          <button
            onClick={downloadCSV}
            className="text-sm border border-secondary/20 hover:bg-secondary/5 px-4 py-2 rounded-sm flex items-center gap-2 transition-colors text-primary"
          >
            <Download size={16} /> Export Report
          </button>
        </div>

        {/* Key Metrics Cards */}
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-sm border border-secondary/10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Total Revenue
              </h3>
              <div className="bg-green-50 text-green-700 p-1.5 rounded-sm">
                <TicketPercent size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-primary mb-1">
              {formatPrice(platformAnalytics?.revenue?.gross || 0)}
            </p>
            <p className="text-xs text-text-secondary">
              Gross Sales (Before Refunds)
            </p>
          </div>

          <div className="bg-surface p-6 rounded-sm shadow-sm border border-secondary/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <RefreshCw size={24} />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">
              Funds in Escrow
            </p>
            <h3 className="text-xl font-bold text-primary mt-1">
              {formatPrice(platformAnalytics?.revenue?.escrow || 0)}
            </h3>
            <p className="text-xs text-text-secondary mt-2">
              Pending Vendor Payouts
            </p>
          </div>

          {/* New Card: Admin Amount Left */}
          <div className="bg-surface p-6 rounded-sm shadow-sm border border-secondary/10 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                <DollarSign size={24} />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                Safe
              </span>
            </div>
            <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">
              Admin Balance (Left)
            </p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {formatPrice(platformAnalytics?.revenue?.adminBalance || 0)}
            </h3>
            <p className="flex justify-between text-xs text-text-secondary mt-2">
              <span>
                Gross: {formatPrice(platformAnalytics?.revenue?.gross || 0)}
              </span>
              <span>
                Ref: -{formatPrice(platformAnalytics?.revenue?.refunds || 0)}
              </span>
            </p>
          </div>

          {/* New Card: Total Settlements */}
          <div className="bg-surface p-6 rounded-sm border border-secondary/10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Total Settlements
              </h3>
              <div className="bg-blue-50 text-blue-700 p-1.5 rounded-sm">
                <FileCheck size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-primary mb-1">
              {formatPrice(platformAnalytics?.revenue?.payouts || 0)}
            </p>
            <p className="text-xs text-text-secondary">Paid to Vendors</p>
          </div>

          <div className="bg-surface p-6 rounded-sm border border-secondary/10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Avg. Order Value
              </h3>
              <div className="bg-amber-50 text-amber-700 p-1.5 rounded-sm">
                <CheckCircle size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-primary mb-1">
              {formatPrice(
                analyticsData.totalRevenue / (analyticsData.totalOrders || 1),
              )}
            </p>
            <p className="text-xs text-text-secondary">Per transaction</p>
          </div>

          <div className="bg-surface p-6 rounded-sm border border-secondary/10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Paid User Ratio
              </h3>
              <div className="bg-purple-50 text-purple-700 p-1.5 rounded-sm">
                <Users size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-primary mb-1">
              {analyticsData.uniqueCustomers || 0}
              <span className="text-sm font-normal text-text-secondary ml-1">
                / {analyticsData.totalUsers || 0}
              </span>
            </p>
            <p className="text-xs text-text-secondary">
              {analyticsData.totalUsers > 0
                ? `${(
                    (analyticsData.uniqueCustomers / analyticsData.totalUsers) *
                    100
                  ).toFixed(1)}% of registered users`
                : "No data"}
            </p>
          </div>
        </div>

        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend */}
          <div className="lg:col-span-2 bg-surface p-6 rounded-sm border border-secondary/10">
            <h3 className="text-lg font-bold text-primary mb-6">
              Revenue Trend (7 Days)
            </h3>
            <div className="h-64 w-full">
              {analyticsData.salesByDate?.length > 0 ? (
                (() => {
                  const data = analyticsData.salesByDate;
                  const maxVal = Math.max(
                    ...data.map((d) => d.totalSales),
                    100,
                  ); // Min max 100 to avoid div/0 or flat lines
                  const width = 800;
                  const height = 250;
                  const paddingX = 40;
                  const paddingY = 20;
                  const graphWidth = width - paddingX * 2;
                  const graphHeight = height - paddingY * 2;

                  const points = data.map((d, i) => {
                    const x =
                      paddingX + (i / (data.length - 1 || 1)) * graphWidth;
                    const y =
                      height - paddingY - (d.totalSales / maxVal) * graphHeight;
                    return { x, y, ...d };
                  });

                  const pathData = points
                    .map((p, i) =>
                      i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`,
                    )
                    .join(" ");
                  const areaPath = `${pathData} L ${
                    points[points.length - 1].x
                  },${height - paddingY} L ${points[0].x},${
                    height - paddingY
                  } Z`;

                  return (
                    <svg
                      viewBox={`0 0 ${width} ${height}`}
                      className="w-full h-full overflow-visible preserve-3d"
                    >
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#1a4d2e"
                            stopOpacity="0.2"
                          />
                          <stop
                            offset="100%"
                            stopColor="#1a4d2e"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines (Horizontal) */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = height - paddingY - ratio * graphHeight;
                        return (
                          <g key={i}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={width - paddingX}
                              y2={y}
                              stroke="#e5e5e5"
                              strokeDasharray="4"
                            />
                            <text
                              x={paddingX - 10}
                              y={y + 4}
                              textAnchor="end"
                              fontSize="10"
                              fill="#999"
                            >
                              {formatPrice(ratio * maxVal, true)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Fill */}
                      <path d={areaPath} fill="url(#gradient)" />

                      {/* Line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#1a4d2e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data Points & Tooltips */}
                      {points.map((p, i) => (
                        <g key={i} className="group cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="#fff"
                            stroke="#1a4d2e"
                            strokeWidth="2"
                            className="transition-all duration-300 group-hover:r-7"
                          />

                          {/* Tooltip */}
                          <foreignObject
                            x={p.x - 60}
                            y={p.y - 70}
                            width="120"
                            height="60"
                            className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          >
                            <div className="bg-primary text-surface p-2 rounded shadow-lg text-center transform scale-90">
                              <div className="text-xs font-bold">
                                {formatPrice(p.totalSales)}
                              </div>
                              <div className="text-[10px] opacity-80">
                                {p.count} orders
                              </div>
                              <div className="text-[10px] font-mono mt-1 border-t border-white/20 pt-1">
                                {new Date(p._id).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                          </foreignObject>

                          {/* X Axis Label */}
                          <text
                            x={p.x}
                            y={height}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#666"
                            className="font-medium"
                          >
                            {new Date(p._id).toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                          </text>
                        </g>
                      ))}
                    </svg>
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-text-secondary">
                  No sales data available for this period.
                </div>
              )}
            </div>
          </div>

          {/* Order Status Donut */}
          <div className="bg-surface p-6 rounded-sm border border-secondary/10 flex flex-col">
            <h3 className="text-lg font-bold text-primary mb-6">
              Order Status
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg
                  viewBox="0 0 100 100"
                  className="transform -rotate-90 w-full h-full"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e5e5"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#1a4d2e"
                    strokeWidth="12"
                    strokeDasharray={`${
                      ((analyticsData.completedOrders || 0) /
                        (analyticsData.totalOrders || 1)) *
                      251
                    } 251`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {analyticsData.totalOrders}
                  </span>
                  <span className="text-[10px] uppercase text-text-secondary">
                    Total
                  </span>
                </div>
              </div>
              <div className="mt-6 w-full space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-text-secondary">Completed</span>
                  </div>
                  <span className="font-bold text-primary">
                    {analyticsData.completedOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    <span className="text-text-secondary">Pending</span>
                  </div>
                  <span className="font-bold text-primary">
                    {analyticsData.pendingOrders}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Analysis Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Selling */}
          <div className="bg-surface p-6 rounded-sm border border-secondary/10 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <TrendingUp size={18} /> Best Sellers
            </h3>
            <div className="space-y-4">
              {analyticsData.mostDemanding?.map((product, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-primary">
                        {product.name}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {product.totalQuantity} units
                      </span>
                    </div>
                    <div className="w-full bg-secondary/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${
                            (product.totalQuantity / maxDemand) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {(!analyticsData.mostDemanding ||
                analyticsData.mostDemanding.length === 0) && (
                <p className="text-center text-sm text-text-secondary">
                  No sales data yet.
                </p>
              )}
            </div>
          </div>

          {/* Low Stock / Least Demanding */}
          <div className="bg-surface p-6 rounded-sm border border-secondary/10 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <AlertCircle size={18} /> Low Performing / Unsold
            </h3>
            <div className="space-y-4">
              {analyticsData.leastDemanding?.slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-xs font-bold text-red-600">
                    !
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-primary">
                        {product.name}
                      </span>
                      <span className="text-xs font-medium text-text-secondary">
                        {product.totalQuantity === 0
                          ? "0 Sales"
                          : `${product.totalQuantity} units`}
                      </span>
                    </div>
                    <div className="w-full bg-secondary/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400"
                        style={{
                          width: `${Math.max(
                            (product.totalQuantity / maxDemand) * 100,
                            5,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== VENDOR MANAGEMENT =====
  const handleVendorStatusUpdate = async (
    vendorId,
    status,
    rejectionReason = "",
  ) => {
    try {
      await client.put(`/admin/vendors/${vendorId}/status`, {
        status,
        rejectionReason,
      });
      alert(`Vendor ${status} successfully!`);
      // Refresh vendors
      const params = new URLSearchParams();
      if (vendorFilter) params.append("status", vendorFilter);
      const { data } = await client.get(`/admin/vendors?${params.toString()}`);
      setVendors(data.vendors);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update vendor status");
    }
  };

  // Handle compliance document approval/rejection
  const handleComplianceDocApproval = async (
    vendorId,
    docId,
    status,
    rejectionReason = "",
  ) => {
    try {
      await client.put(`/admin/vendors/${vendorId}/compliance/${docId}`, {
        status,
        rejectionReason,
      });
      alert(`Document ${status} successfully!`);
      // Refresh vendor details
      const { data } = await client.get(`/admin/vendors/${vendorId}`);
      setSelectedVendor(data);
      // Also refresh the vendors list
      const params = new URLSearchParams();
      if (vendorFilter) params.append("status", vendorFilter);
      const vendorsList = await client.get(
        `/admin/vendors?${params.toString()}`,
      );
      setVendors(vendorsList.data.vendors);
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to update document status",
      );
    }
  };

  // Handle vendor product approval/rejection
  const handleProductApproval = async (
    productId,
    vendorStatus,
    rejectionReason = "",
  ) => {
    try {
      await client.put(`/admin/vendor-products/${productId}`, {
        vendorStatus,
        rejectionReason,
      });
      alert(`Product ${vendorStatus} successfully!`);
      // Refresh pending products
      const { data } = await client.get(
        "/admin/vendor-products?status=pending",
      );
      setPendingProducts(data.products || []);
      setPendingProductsCounts(
        data.counts || { pending: 0, approved: 0, rejected: 0 },
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update product status");
    }
  };

  const handleDocumentReview = async (
    vendorId,
    docId,
    status,
    rejectionReason = "",
  ) => {
    try {
      await client.put(`/admin/vendors/${vendorId}/compliance/${docId}`, {
        status,
        rejectionReason,
      });
      alert(`Document ${status} successfully!`);
      // Refresh approvals
      const { data } = await client.get("/admin/approvals");
      setPendingApprovals(data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update document");
    }
  };

  const renderVendors = () => {
    return (
      <div className="space-y-6">
        {/* Vendor Analytics Summary */}
        {vendorAnalytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-6 rounded-sm border border-secondary/10">
              <div className="flex items-center gap-3 mb-2">
                <Store className="w-5 h-5 text-primary" />
                <span className="text-sm text-text-secondary">
                  Total Vendors
                </span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {vendorAnalytics.totalVendors}
              </p>
            </div>
            <div className="bg-surface p-6 rounded-sm border border-secondary/10">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-text-secondary">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {vendorAnalytics.vendorsByStatus?.pending || 0}
              </p>
            </div>
            <div className="bg-surface p-6 rounded-sm border border-secondary/10">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-text-secondary">Approved</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {vendorAnalytics.vendorsByStatus?.approved || 0}
              </p>
            </div>
            <div className="bg-surface p-6 rounded-sm border border-secondary/10">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-text-secondary">
                  New This Month
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {vendorAnalytics.newVendorsThisMonth}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-surface p-4 rounded-sm border border-secondary/10 flex flex-wrap gap-4 items-center">
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-secondary/20 rounded-sm bg-background"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            placeholder="Search vendors..."
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-secondary/20 rounded-sm bg-background"
          />
        </div>

        {/* Vendors Table */}
        <div className="bg-surface rounded-sm border border-secondary/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/5 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Business
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Plan
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Products
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Contact
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Joined
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/10">
                {vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-secondary/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">
                            {vendor.businessName}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {vendor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-bold uppercase
                            ${
                              vendor.subscription?.plan === "enterprise"
                                ? "bg-purple-100 text-purple-700"
                                : vendor.subscription?.plan === "professional"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                      >
                        {vendor.subscription?.plan || "Starter"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      {vendor.metrics?.totalProducts ||
                        vendor.inventory?.length ||
                        0}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{vendor.contactPerson}</p>
                      <p className="text-xs text-text-secondary">
                        {vendor.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          vendor.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : vendor.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : vendor.status === "under_review"
                                ? "bg-blue-100 text-blue-700"
                                : vendor.status === "suspended"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                        }`}
                      >
                        {vendor.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="p-2 hover:bg-secondary/10 rounded-sm text-primary"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {vendor.status !== "approved" && (
                          <button
                            onClick={() =>
                              handleVendorStatusUpdate(vendor._id, "approved")
                            }
                            className="p-2 hover:bg-green-50 rounded-sm text-green-600"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        {vendor.status === "approved" && (
                          <button
                            onClick={() =>
                              handleVendorStatusUpdate(vendor._id, "suspended")
                            }
                            className="p-2 hover:bg-orange-50 rounded-sm text-orange-600"
                            title="Suspend"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {vendors.length === 0 && (
            <div className="p-12 text-center text-text-secondary">
              No vendors found
            </div>
          )}
        </div>

        {/* Top Performing Vendors */}
        {vendorAnalytics?.topVendors &&
          vendorAnalytics.topVendors.length > 0 && (
            <div className="bg-surface p-6 rounded-sm border border-secondary/10">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <TrendingUp size={18} /> Top Performing Vendors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorAnalytics.topVendors.slice(0, 6).map((vendor, idx) => (
                  <div
                    key={vendor.vendorId}
                    className="flex items-center gap-3 p-3 bg-secondary/5 rounded-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {vendor.businessName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        ₹{vendor.totalRevenue.toLocaleString()} •{" "}
                        {vendor.orderCount} orders
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Vendor Detail Modal */}
        {selectedVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-surface w-full max-w-4xl rounded-sm shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    {selectedVendor.businessName}
                  </h2>
                  <p className="text-sm text-text-secondary capitalize">
                    {selectedVendor.businessType}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-text-secondary hover:text-red-500"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-secondary/20 mb-6">
                <button
                  className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                    activeVendorModalTab === "details"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-primary"
                  }`}
                  onClick={() => setActiveVendorModalTab("details")}
                >
                  Details
                </button>
                <button
                  className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                    activeVendorModalTab === "products"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-primary"
                  }`}
                  onClick={() => {
                    setActiveVendorModalTab("products");
                    fetchAdminVendorProducts(selectedVendor._id);
                  }}
                >
                  Products
                </button>
                <button
                  className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                    activeVendorModalTab === "messages"
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-primary"
                  }`}
                  onClick={() => {
                    setActiveVendorModalTab("messages");
                    fetchAdminVendorMessages(selectedVendor._id);
                  }}
                >
                  Messages
                </button>
              </div>

              {activeVendorModalTab === "details" && (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        Contact Person
                      </p>
                      <p className="font-medium">
                        {selectedVendor.contactPerson}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Email</p>
                      <p className="font-medium">{selectedVendor.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Phone</p>
                      <p className="font-medium">{selectedVendor.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        Location
                      </p>
                      <p className="font-medium">
                        {selectedVendor.address?.city},{" "}
                        {selectedVendor.address?.state}
                      </p>
                    </div>
                  </div>

                  {/* Legal Info */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/5 rounded-sm">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        GST Number
                      </p>
                      <p className="font-mono text-sm">
                        {selectedVendor.gstNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        PAN Number
                      </p>
                      <p className="font-mono text-sm">
                        {selectedVendor.panNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        FSSAI Number
                      </p>
                      <p className="font-mono text-sm">
                        {selectedVendor.fssaiNumber || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Commission Setting - ADDED SUBSCRIPTION DISPLAY */}
                  <div className="p-4 border border-secondary/20 rounded-sm">
                    <h4 className="font-medium mb-3">Plan & Commission</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-text-secondary mb-1">
                          Current Plan
                        </p>
                        <p className="text-lg font-bold text-primary capitalize">
                          {selectedVendor.subscription?.plan || "Starter"}
                          {selectedVendor.subscription?.upcomingPlan && (
                            <span className="text-xs text-secondary block">
                              (Switches to{" "}
                              {selectedVendor.subscription.upcomingPlan} on{" "}
                              {new Date(
                                selectedVendor.subscription.upcomingPlanDate,
                              ).toLocaleDateString()}
                              )
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary mb-1">
                          Commission Rate
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {selectedVendor.commissionRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Documents */}
                  {selectedVendor.complianceDocuments?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Compliance Documents</h4>
                      <div className="space-y-3">
                        {selectedVendor.complianceDocuments.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-secondary/5 rounded-sm border border-secondary/10"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <FileCheck className="w-5 h-5 text-primary flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-text-secondary capitalize">
                                  {doc.type.replace("_", " ")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setPdfViewerModal({
                                    isOpen: true,
                                    url: doc.fileUrl,
                                    name: doc.name,
                                  })
                                }
                                className="text-accent text-xs font-bold uppercase px-2 py-1 hover:text-primary transition-colors underline"
                              >
                                View
                              </button>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                                  doc.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : doc.status === "rejected"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {doc.status}
                              </span>
                              {doc.status === "pending" && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() =>
                                      handleComplianceDocApproval(
                                        selectedVendor._id,
                                        doc._id,
                                        "approved",
                                      )
                                    }
                                    className="p-1 bg-green-100 text-green-700 rounded-sm hover:bg-green-200 transition-colors"
                                    title="Approve"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleComplianceDocApproval(
                                        selectedVendor._id,
                                        doc._id,
                                        "rejected",
                                      )
                                    }
                                    className="p-1 bg-red-100 text-red-700 rounded-sm hover:bg-red-200 transition-colors"
                                    title="Reject"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedVendor.status !== "approved" && (
                      <button
                        onClick={() => {
                          handleVendorStatusUpdate(
                            selectedVendor._id,
                            "approved",
                          );
                          setSelectedVendor(null);
                        }}
                        className="flex-1 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Check size={16} /> Approve Vendor
                      </button>
                    )}
                    {selectedVendor.status === "approved" && (
                      <button
                        onClick={() => {
                          handleVendorStatusUpdate(
                            selectedVendor._id,
                            "suspended",
                          );
                          setSelectedVendor(null);
                        }}
                        className="flex-1 py-2 bg-orange-600 text-white rounded-sm hover:bg-orange-700 flex items-center justify-center gap-2"
                      >
                        <Ban size={16} /> Suspend Vendor
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedVendor(null)}
                      className="flex-1 py-2 border border-secondary/20 rounded-sm hover:bg-secondary/5"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {activeVendorModalTab === "products" && (
                <div className="space-y-4">
                  {adminVendorProducts.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      No products found for this vendor.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/5 font-bold text-text-secondary">
                          <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/10">
                          {adminVendorProducts.map((prod) => (
                            <tr key={prod._id} className="hover:bg-secondary/5">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={prod.images?.[0] || prod.image}
                                    alt=""
                                    className="w-10 h-10 object-contain bg-white rounded-sm border"
                                  />
                                  <div>
                                    <p className="font-medium text-primary">
                                      {prod.name}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                      {prod.category}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-bold">₹{prod.price}</td>
                              <td className="p-3">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full uppercase font-bold
                                                      ${
                                                        prod.vendorStatus ===
                                                        "approved"
                                                          ? "bg-green-100 text-green-700"
                                                          : prod.vendorStatus ===
                                                              "rejected"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                      }`}
                                >
                                  {prod.vendorStatus || "Pending"}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  {prod.vendorStatus !== "approved" && (
                                    <button
                                      onClick={async () => {
                                        await handleProductApproval(
                                          prod._id,
                                          "approved",
                                        );
                                        fetchAdminVendorProducts(
                                          selectedVendor._id,
                                        );
                                      }}
                                      className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                      title="Approve"
                                    >
                                      <Check size={16} />
                                    </button>
                                  )}
                                  {prod.vendorStatus !== "rejected" && (
                                    <button
                                      onClick={async () => {
                                        const r = prompt(
                                          "Reason for rejection:",
                                        );
                                        if (r) {
                                          await handleProductApproval(
                                            prod._id,
                                            "rejected",
                                            r,
                                          );
                                          fetchAdminVendorProducts(
                                            selectedVendor._id,
                                          );
                                        }
                                      }}
                                      className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                      title="Reject"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (
                                        window.confirm("Delete this product?")
                                      ) {
                                        await handleDeleteClick(prod._id);
                                        fetchAdminVendorProducts(
                                          selectedVendor._id,
                                        );
                                      }
                                    }}
                                    className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeVendorModalTab === "messages" && (
                <div className="flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-sm border border-secondary/10 space-y-4">
                    {adminVendorMessages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-text-secondary">
                        No messages yet. Start a conversation.
                      </div>
                    ) : (
                      adminVendorMessages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`flex ${
                            msg.sender === "admin"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.sender === "admin"
                                ? "bg-primary text-white rounded-br-none"
                                : "bg-white border border-secondary/20 rounded-bl-none"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                msg.sender === "admin"
                                  ? "text-white/70"
                                  : "text-text-secondary"
                              }`}
                            >
                              <span className="uppercase font-bold mr-1 text-[8px] opacity-70">
                                {msg.sender}
                              </span>{" "}
                              • {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const msg = e.target.elements.message.value.trim();
                      if (msg) {
                        if (sendAdminVendorMessage(selectedVendor._id, msg)) {
                          e.target.reset();
                        }
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      name="message"
                      placeholder="Type a message to the vendor..."
                      className="flex-1 px-4 py-2 border border-secondary/20 rounded-sm focus:outline-none focus:border-primary"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary text-white rounded-sm hover:bg-primary-dark transition-colors font-bold uppercase tracking-wider text-sm flex items-center gap-2"
                    >
                      <Mail size={16} /> Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== APPROVALS =====
  const renderApprovals = () => {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface p-6 rounded-sm border border-secondary/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Store className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">
                Pending Vendor Approvals
              </p>
              <p className="text-2xl font-bold text-primary">
                {pendingApprovals.counts?.vendors || 0}
              </p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-sm border border-secondary/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">
                Pending Document Reviews
              </p>
              <p className="text-2xl font-bold text-primary">
                {pendingApprovals.counts?.documents || 0}
              </p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-sm border border-secondary/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">
                Pending Product Approvals
              </p>
              <p className="text-2xl font-bold text-primary">
                {pendingProductsCounts.pending || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Vendors */}
        <div className="bg-surface rounded-sm border border-secondary/10 p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Store size={18} /> Vendor Applications
          </h3>
          {pendingApprovals.vendors?.length > 0 ? (
            <div className="space-y-4">
              {pendingApprovals.vendors.map((vendor) => (
                <div
                  key={vendor._id}
                  className="flex items-center justify-between p-4 bg-secondary/5 rounded-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        {vendor.businessName}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {vendor.email} • {vendor.businessType}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Applied:{" "}
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleVendorStatusUpdate(vendor._id, "approved")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 flex items-center gap-2"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Rejection reason:");
                        if (reason)
                          handleVendorStatusUpdate(
                            vendor._id,
                            "rejected",
                            reason,
                          );
                      }}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-sm hover:bg-red-50 flex items-center gap-2"
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-secondary py-8">
              No pending vendor applications
            </p>
          )}
        </div>

        {/* Pending Documents */}
        <div className="bg-surface rounded-sm border border-secondary/10 p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <FileCheck size={18} /> Document Reviews
          </h3>
          {pendingApprovals.documents?.length > 0 ? (
            <div className="space-y-4">
              {pendingApprovals.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-secondary/5 rounded-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">{doc.name}</p>
                      <p className="text-sm text-text-secondary capitalize">
                        {doc.type?.replace("_", " ")}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Vendor: {doc.vendorName} ({doc.vendorEmail})
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-secondary/20 rounded-sm hover:bg-secondary/5"
                    >
                      <Eye size={16} />
                    </a>
                    <button
                      onClick={() =>
                        handleDocumentReview(doc.vendorId, doc._id, "approved")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Rejection reason:");
                        if (reason)
                          handleDocumentReview(
                            doc.vendorId,
                            doc._id,
                            "rejected",
                            reason,
                          );
                      }}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-sm hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-secondary py-8">
              No pending document reviews
            </p>
          )}
        </div>

        {/* Pending Vendor Products */}
        <div className="bg-surface rounded-sm border border-secondary/10 p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Package size={18} /> Vendor Products (
            {pendingProductsCounts.pending || 0} pending)
          </h3>
          {pendingProducts?.length > 0 ? (
            <div className="space-y-4">
              {pendingProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-start justify-between p-4 bg-secondary/5 rounded-sm gap-4"
                >
                  <div className="flex items-start gap-4">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-16 h-16 rounded-sm object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-sm bg-secondary/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-secondary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-primary">{product.name}</p>
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          ₹{product.price}
                        </span>
                        <span className="text-xs bg-secondary/20 px-2 py-1 rounded">
                          {product.category}
                        </span>
                        {product.vendor && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-1">
                            <Store size={12} />
                            {product.vendor.businessName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-2">
                        Submitted:{" "}
                        {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`/product/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-secondary/20 rounded-sm hover:bg-secondary/5 text-center"
                    >
                      <Eye size={16} className="mx-auto" />
                    </a>
                    <button
                      onClick={() =>
                        handleProductApproval(product._id, "approved")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700"
                    >
                      <Check size={16} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Rejection reason:");
                        if (reason)
                          handleProductApproval(
                            product._id,
                            "rejected",
                            reason,
                          );
                      }}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-sm hover:bg-red-50"
                    >
                      <X size={16} className="mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-secondary py-8">
              No pending product reviews
            </p>
          )}
        </div>
      </div>
    );
  };

  // ===== REFUND AUDIT LOG =====
  const renderRefunds = () => (
    <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-secondary/10">
        <h2 className="text-xl font-bold text-primary">Refund Audit Log</h2>
        <p className="text-xs text-text-secondary mt-1">
          Track all refund activities for the last 45 days. Delivery charges are
          strictly non-refundable.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Ref ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Initiated By</th>
              <th className="px-6 py-4">Refund Amount</th>
              <th className="px-6 py-4 text-red-600">Del. Deducted</th>
              <th className="px-6 py-4">Total Ref. Amt</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/10">
            {adminRefundLogs.map((log) => (
              <tr
                key={log._id}
                className="hover:bg-secondary/5 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-xs">
                  {log._id.slice(-6)}
                </td>
                <td className="px-6 py-4 text-xs font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-bold text-primary text-xs">
                  #{log.order?._id?.slice(-8).toUpperCase() || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                      log.initiatedBy === "Admin"
                        ? "bg-purple-100 text-purple-700"
                        : log.initiatedBy === "Vendor"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {log.initiatedBy}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-green-600">
                  {formatPrice(log.amount)}
                </td>
                <td className="px-6 py-4 font-bold text-red-500">
                  -{formatPrice(log.deliveryCharge)}
                </td>
                <td className="px-6 py-4 font-bold text-primary">
                  {formatPrice(log.totalRefundableAmount)}
                </td>
                <td className="px-6 py-4 text-xs text-text-secondary">
                  {log.reason || "No Reason Provided"}
                </td>
              </tr>
            ))}
            {adminRefundLogs.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-8 text-center text-text-secondary"
                >
                  No refund logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ===== PRICING MANAGEMENT =====
  const renderPricing = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">Pricing Tiers</h2>
          <p className="text-sm text-text-secondary">
            Manage vendor commission rates and pricing tiers
          </p>
        </div>

        {pricingTiers ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(pricingTiers).map(([key, tier]) => (
              <div
                key={key}
                className={`bg-surface rounded-sm border-2 p-6 ${
                  key === "premium" ? "border-primary" : "border-secondary/20"
                }`}
              >
                {key === "premium" && (
                  <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                    POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-primary mb-2">
                  {tier.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">
                    {tier.commissionRate}%
                  </span>
                  <span className="text-text-secondary text-sm ml-2">
                    commission
                  </span>
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-text-secondary"
                    >
                      <Check size={16} className="text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-2 border border-primary text-primary rounded-sm hover:bg-primary hover:text-white transition-colors">
                  Edit Tier
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface p-12 rounded-sm border border-secondary/10 text-center">
            <RefreshCw className="w-8 h-8 text-text-secondary animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading pricing tiers...</p>
          </div>
        )}

        {/* Commission Revenue Summary */}
        {vendorAnalytics?.vendorRevenue && (
          <div className="bg-surface p-6 rounded-sm border border-secondary/10">
            <h3 className="text-lg font-bold text-primary mb-4">
              Commission Revenue
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-sm">
                <p className="text-sm text-green-700 mb-1">
                  Total Vendor Revenue
                </p>
                <p className="text-2xl font-bold text-green-800">
                  ₹
                  {vendorAnalytics.vendorRevenue.totalRevenue?.toLocaleString() ||
                    0}
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded-sm">
                <p className="text-sm text-primary mb-1">
                  Total Commission Earned
                </p>
                <p className="text-2xl font-bold text-primary">
                  ₹
                  {vendorAnalytics.vendorRevenue.totalCommission?.toLocaleString() ||
                    0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPayouts = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary font-heading">
            Payout Requests
          </h2>
          <button
            onClick={() => {
              // Refresh payouts
              client.get("/admin/payouts").then(({ data }) => setPayouts(data));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 rounded-sm text-text-primary transition-colors"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="bg-surface rounded-sm shadow-sm border border-secondary/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/5 border-b border-secondary/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Bank Details
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/10">
                {payouts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-text-secondary"
                    >
                      No pending payout requests.
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr
                      key={payout._id}
                      className="hover:bg-secondary/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-primary">
                          {payout.businessName}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {payout.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">
                        {formatPrice(payout.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(payout.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-xs text-text-secondary">
                          <p>
                            <span className="font-bold">Bank:</span>{" "}
                            {payout.bankDetails?.bankName}
                          </p>
                          <p>
                            <span className="font-bold">Acc:</span>{" "}
                            {payout.bankDetails?.accountNumber}
                          </p>
                          <p>
                            <span className="font-bold">IFSC:</span>{" "}
                            {payout.bankDetails?.ifscCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            if (window.confirm("Approve this payout?")) {
                              handlePayoutAction(
                                payout.vendorId,
                                payout._id,
                                "completed",
                              );
                            }
                          }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-sm text-xs font-bold uppercase hover:bg-green-200 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt("Reason for rejection:");
                            if (note) {
                              handlePayoutAction(
                                payout.vendorId,
                                payout._id,
                                "rejected",
                                note,
                              );
                            }
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-sm text-xs font-bold uppercase hover:bg-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Returns Management
  const renderReturns = () => {
    const getStatusBadge = (status) => {
      const styles = {
        Requested: "bg-yellow-100 text-yellow-700",
        Approved: "bg-green-100 text-green-700",
        Rejected: "bg-red-100 text-red-700",
        Returned: "bg-blue-100 text-blue-700",
        Refunded: "bg-purple-100 text-purple-700",
      };
      return (
        <span
          className={`text-[10px] uppercase font-bold px-2 py-1 rounded-sm tracking-wider ${
            styles[status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {status}
        </span>
      );
    };

    const handleUpdateReturnStatus = async (returnId, newStatus) => {
      try {
        await client.put(`/admin/returns/${returnId}`, { status: newStatus });
        alert("Return status updated successfully!");
        // Refresh returns
        const params = new URLSearchParams();
        if (returnsFilter) params.append("status", returnsFilter);
        const { data } = await client.get(
          `/admin/returns?${params.toString()}`,
        );
        setAdminReturns(data.returns || []);
        setReturnsCounts(data.counts || {});
        setSelectedReturn(null);
      } catch (error) {
        console.error("Failed to update return status", error);
        alert("Failed to update return status.");
      }
    };

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: "Requested",
              value: returnsCounts.requested || 0,
              color: "yellow",
            },
            {
              label: "Approved",
              value: returnsCounts.approved || 0,
              color: "green",
            },
            {
              label: "Rejected",
              value: returnsCounts.rejected || 0,
              color: "red",
            },
            {
              label: "Returned",
              value: returnsCounts.returned || 0,
              color: "blue",
            },
            {
              label: "Refunded",
              value: returnsCounts.refunded || 0,
              color: "purple",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={() => setReturnsFilter(stat.label.toLowerCase())}
              className={`bg-surface p-4 rounded-sm shadow-sm border border-secondary/10 cursor-pointer hover:shadow-md transition-shadow ${
                returnsFilter === stat.label.toLowerCase()
                  ? `ring-2 ring-${stat.color}-400`
                  : ""
              }`}
            >
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-sm p-4 shadow-sm border border-secondary/10 flex flex-wrap items-center gap-4">
          <select
            value={returnsFilter}
            onChange={(e) => setReturnsFilter(e.target.value)}
            className="px-4 py-2 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 text-sm min-w-[200px]"
          >
            <option value="">All Status</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="returned">Returned</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={() => setReturnsFilter("")}
            className="px-4 py-2 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            Clear Filter
          </button>
        </div>

        {/* Returns Table */}
        <div className="bg-surface rounded-sm shadow-lg border border-secondary/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background/80 border-b border-secondary/10">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Return ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Vendor
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Product
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Reason
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/5">
                {returnsLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-text-secondary"
                    >
                      Loading returns...
                    </td>
                  </tr>
                ) : adminReturns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-text-secondary"
                    >
                      No return requests found.
                    </td>
                  </tr>
                ) : (
                  adminReturns.map((ret) => (
                    <tr
                      key={ret._id}
                      className="hover:bg-secondary/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        #{ret._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-primary">
                          {ret.vendorName}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {ret.vendorEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary">
                        {ret.productName}
                        {ret.itemCount > 1 && (
                          <span className="text-text-secondary text-xs ml-1">
                            +{ret.itemCount - 1} more
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
                        {ret.reason}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        {formatPrice(ret.subtotal)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ret.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(ret.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="text-accent text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors hover:underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Details Modal */}
        {selectedReturn && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-sm p-8 max-w-lg w-full shadow-2xl border border-secondary/10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-heading font-medium text-primary flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-accent" />
                  Return #{selectedReturn._id.slice(-8)}
                </h3>
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="text-text-secondary hover:text-red-500"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-text-secondary mb-1">
                      Vendor
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {selectedReturn.vendorName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-text-secondary mb-1">
                      Amount
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(selectedReturn.subtotal)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase text-text-secondary mb-1">
                    Product(s)
                  </p>
                  <p className="text-sm text-primary">
                    {selectedReturn.productName}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-text-secondary mb-1">
                    Return Reason
                  </p>
                  <p className="text-sm text-text-secondary bg-background/50 p-3 rounded-sm border border-secondary/10">
                    {selectedReturn.reason}
                  </p>
                </div>

                {selectedReturn.customerComment && (
                  <div>
                    <p className="text-xs uppercase text-text-secondary mb-1">
                      Customer Comment
                    </p>
                    <p className="text-sm text-text-secondary italic bg-background/50 p-3 rounded-sm border border-secondary/10">
                      "{selectedReturn.customerComment}"
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase text-text-secondary mb-1">
                    Current Status
                  </p>
                  {getStatusBadge(selectedReturn.status)}
                </div>
              </div>

              <div className="border-t border-secondary/10 pt-6">
                <p className="text-xs uppercase text-text-secondary mb-3">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Approved", "Rejected", "Returned", "Refunded"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          if (window.confirm(`Update status to "${status}"?`)) {
                            handleUpdateReturnStatus(
                              selectedReturn._id,
                              status,
                            );
                          }
                        }}
                        disabled={selectedReturn.status === status}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                          selectedReturn.status === status
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : status === "Approved"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : status === "Rejected"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : status === "Refunded"
                                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-secondary/5">
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm text-text-secondary font-medium hover:bg-secondary/5 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pt-20 flex relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-surface border-r border-secondary/10 fixed left-0 top-20 z-20 transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ height: "calc(100vh - 5rem)" }}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 text-primary mb-8">
            <Settings size={24} />
            <span className="font-heading font-bold text-xl">Admin</span>
          </div>
          <nav className="space-y-2">
            {[
              { id: "dashboard", icon: ShoppingBag, label: "Dashboard" },
              { id: "products", icon: Package, label: "Products" },
              { id: "vendors", icon: Store, label: "Vendors" },
              { id: "approvals", icon: CheckCircle, label: "Approvals" },
              { id: "payouts", icon: DollarSign, label: "Payouts" },
              { id: "returns", icon: RotateCcw, label: "Returns" },
              { id: "refunds", icon: HistoryIcon, label: "Audit Refunds" },
              { id: "b2b", icon: Truck, label: "B2B Portal" },
              { id: "messages", icon: Mail, label: "Messages" },
              {
                id: "blogs",
                icon: FileText,
                label: "Blogs",
                path: "/admin/blogs",
              },
              { id: "coupons", icon: TicketPercent, label: "Coupons" },
              { id: "reports", icon: ChartIcon, label: "Analytics" },
              { id: "pricing", icon: DollarSign, label: "Pricing" },
              { id: "users", icon: Users, label: "Users" },
              { id: "content", icon: Edit2, label: "Content" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  item.path
                    ? (window.location.href = item.path)
                    : setActiveTab(item.id)
                }
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors
                                    ${
                                      activeTab === item.id
                                        ? "bg-primary text-surface"
                                        : "text-text-secondary hover:bg-secondary/5"
                                    }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 border-t border-secondary/10 bg-surface">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-sm transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow md:ml-64 p-4 md:p-8 overflow-x-hidden">
        <div className="mb-8 flex items-center gap-4">
          <button
            className="md:hidden text-primary p-2 hover:bg-secondary/10 rounded-sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary capitalize">
            {activeTab}
          </h1>
        </div>

        {activeTab === "dashboard" && (
          <>
            {renderStats()}
            {renderOrders()}
          </>
        )}
        {activeTab === "orders" && renderOrders()}
        {activeTab === "products" && renderProducts()}
        {activeTab === "vendors" && renderVendors()}
        {activeTab === "approvals" && renderApprovals()}
        {activeTab === "b2b" && renderB2B()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "messages" && renderMessages()}
        {activeTab === "payouts" && renderPayouts()}
        {activeTab === "coupons" && renderCoupons()}
        {activeTab === "content" && renderContent()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "pricing" && renderPricing()}
        {activeTab === "returns" && renderReturns()}
        {activeTab === "refunds" && renderRefunds()}
      </main>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-4xl rounded-sm shadow-xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">
                {isEditingData ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-text-secondary hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basic Details & Media */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Name
                    </label>
                    <input
                      required
                      type="text"
                      value={currentProduct.name}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-secondary/20 p-2 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Slug (URL)
                    </label>
                    <input
                      required
                      type="text"
                      value={currentProduct.slug}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          slug: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-secondary/20 p-2 rounded-sm"
                      placeholder="e.g. kashmiri-saffron"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Price
                      </label>
                      <input
                        required
                        type="number"
                        value={currentProduct.price}
                        onChange={(e) =>
                          setCurrentProduct({
                            ...currentProduct,
                            price: e.target.value,
                          })
                        }
                        className="w-full bg-background border border-secondary/20 p-2 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Category
                      </label>
                      <select
                        required
                        value={currentProduct.category}
                        onChange={(e) =>
                          setCurrentProduct({
                            ...currentProduct,
                            category: e.target.value,
                          })
                        }
                        className="w-full bg-background border border-secondary/20 p-2 rounded-sm focus:border-accent outline-none appearance-none"
                      >
                        <option value="">Select Category</option>
                        <option value="Spices">Spices</option>
                        <option value="Dry Fruits">Dry Fruits</option>
                        <option value="Honey">Honey</option>
                        <option value="Oils">Oils</option>
                        <option value="Tea">Tea</option>
                        <option value="Herbs">Herbs</option>
                        <option value="Gifts">Gifts</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Tag
                    </label>
                    <select
                      value={currentProduct.tag}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          tag: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-secondary/20 p-2 rounded-sm focus:border-accent outline-none appearance-none"
                    >
                      <option value="">Select Tag</option>
                      <option value="Best Seller">Best Seller</option>
                      <option value="New Arrival">New Arrival</option>
                      <option value="Premium">Premium</option>
                      <option value="Trending">Trending</option>
                      <option value="Essential">Essential</option>
                      <option value="Organic">Organic</option>
                      <option value="Limited Edition">Limited Edition</option>
                    </select>
                  </div>

                  {/* Dynamic Image Fields */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-text-secondary">
                        Product Images (Min 1, Max 5)
                      </label>
                      {currentProduct.images.length < 5 && (
                        <button
                          type="button"
                          onClick={addImageSlot}
                          className="text-xs text-primary font-bold uppercase hover:text-accent flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Image
                        </button>
                      )}
                    </div>
                    {currentProduct.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="bg-background border border-secondary/20 p-3 rounded-sm relative"
                      >
                        <div className="flex gap-2 items-center mb-2">
                          <span className="text-xs font-bold text-text-secondary w-6">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={img}
                            onChange={(e) =>
                              handleImageChange(idx, e.target.value)
                            }
                            className="flex-grow bg-white border border-secondary/10 p-1.5 text-sm rounded-sm"
                            placeholder="Image URL"
                          />
                          <label
                            className="bg-secondary/10 p-1.5 rounded-sm cursor-pointer hover:bg-secondary/20 transition-colors"
                            title="Upload"
                          >
                            <Plus size={16} />
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleImageUpload(idx)}
                              accept="image/*"
                            />
                          </label>
                          {currentProduct.images.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeImageSlot(idx)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        {img && (
                          <div className="w-full h-32 bg-white flex items-center justify-center border border-secondary/5 rounded-sm overflow-hidden">
                            <img
                              src={img}
                              alt={`Preview ${idx + 1}`}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Descriptions & Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Short Description
                    </label>
                    <textarea
                      required
                      value={currentProduct.description}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-secondary/20 p-2 rounded-sm h-32"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Full Description
                    </label>
                    <textarea
                      value={currentProduct.fullDescription}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          fullDescription: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-secondary/20 p-2 rounded-sm h-48"
                      placeholder="Detailed product description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Ingredients
                    </label>
                    <textarea
                      value={currentProduct.ingredients}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          ingredients: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-secondary/20 p-2 rounded-sm h-24"
                      placeholder="List ingredients here..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Features (Comma separated)
                    </label>
                    <textarea
                      value={currentProduct.features}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          features: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-secondary/20 p-2 rounded-sm h-24"
                      placeholder="Organic, Vegan, Gluten-Free..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-secondary/10 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-bold uppercase tracking-widest bg-primary text-surface hover:bg-accent hover:text-primary transition-colors rounded-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-sm shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">
                {couponData.assignedTo
                  ? `Send Coupon to User`
                  : "Create New Coupon"}
              </h2>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-text-secondary hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Coupon Code
                </label>
                <input
                  required
                  type="text"
                  value={couponData.code}
                  onChange={(e) =>
                    setCouponData({
                      ...couponData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full bg-background border border-secondary/20 p-2 rounded-sm font-mono tracking-widest uppercase"
                  placeholder="SUMMER2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Type
                  </label>
                  <select
                    value={couponData.discountType}
                    onChange={(e) =>
                      setCouponData({
                        ...couponData,
                        discountType: e.target.value,
                      })
                    }
                    className="w-full bg-background border border-secondary/20 p-2 rounded-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {couponData.discountType === "percentage"
                      ? "Value (%)"
                      : "Value (₹)"}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={
                      couponData.discountType === "percentage"
                        ? "100"
                        : undefined
                    }
                    value={couponData.discountValue}
                    onChange={(e) =>
                      setCouponData({
                        ...couponData,
                        discountValue: e.target.value,
                      })
                    }
                    className="w-full bg-background border border-secondary/20 p-2 rounded-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Expiry Date
                </label>
                <input
                  required
                  type="date"
                  value={couponData.expiryDate}
                  onChange={(e) =>
                    setCouponData({ ...couponData, expiryDate: e.target.value })
                  }
                  className="w-full bg-background border border-secondary/20 p-2 rounded-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Max Uses
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={couponData.maxUses}
                  onChange={(e) =>
                    setCouponData({ ...couponData, maxUses: e.target.value })
                  }
                  className="w-full bg-background border border-secondary/20 p-2 rounded-sm"
                  placeholder="Total usage limit"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={couponData.isActive}
                  onChange={(e) =>
                    setCouponData({ ...couponData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-text-secondary"
                >
                  Active Status
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-secondary/10 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-bold uppercase tracking-widest bg-primary text-surface hover:bg-accent hover:text-primary transition-colors rounded-sm"
                >
                  {couponData.assignedTo ? "Send Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfViewerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-4xl rounded-sm shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-secondary/10 bg-surface">
              <h2 className="font-medium text-primary">
                {pdfViewerModal.name}
              </h2>
              <button
                onClick={() =>
                  setPdfViewerModal({ isOpen: false, url: "", name: "" })
                }
                className="text-text-secondary hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 bg-black/10 min-h-[600px]">
              <iframe
                src={`${pdfViewerModal.url}?fl_attachment`}
                title={pdfViewerModal.name}
                className="w-full h-[600px] border-0"
                style={{ display: "block" }}
              />
            </div>
            <div className="p-4 border-t border-secondary/10 flex gap-3">
              <a
                href={pdfViewerModal.url}
                download={pdfViewerModal.name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-primary text-surface font-bold uppercase tracking-wider rounded-sm hover:bg-accent hover:text-primary text-center transition-colors"
              >
                Download
              </a>
              <button
                onClick={() =>
                  setPdfViewerModal({ isOpen: false, url: "", name: "" })
                }
                className="flex-1 py-2 border border-secondary/20 rounded-sm hover:bg-secondary/5 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
