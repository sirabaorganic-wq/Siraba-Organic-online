import React, { useState, useEffect, useRef } from "react";
import { useVendor } from "../../context/VendorContext";
import { Navigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileCheck,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Calendar,
  Bell,
  User,
  Store,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Image,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Rocket,
  Zap,
  Crown,
  Star,
  ExternalLink,
  Globe,
  Upload,
  Palette,
  Link as LinkIcon,
  Shield,
  Mail,
  Send,
  MessageCircle,
  HelpCircle,
  Phone,
  ShoppingBag, // New
  Search, // New
  Filter, // New
  ChevronDown, // New
  AlertCircle, // New
  FileText, // New
  MessageSquare, // New
  Headphones, // New
  ArrowLeft, // New
  RotateCcw, // New
} from "lucide-react";

import Logo from "../../assets/SIRABALOGO.png";
import NotificationDropdown from "../../components/vendor/NotificationDropdown";
import client from "../../api/client";

// Sidebar Component
const VendorSidebar = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { vendor, logout } = useVendor();
  const location = useLocation();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "My Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: Package },
    { id: "returns", label: "Returns", icon: RotateCcw },
    { id: "wallet", label: "Wallet & Earnings", icon: Wallet },
    { id: "shop", label: "Shop Settings", icon: Store },
    { id: "subscription", label: "Subscription", icon: Star },
    { id: "compliance", label: "Compliance", icon: FileCheck },
    { id: "messages", label: "Messages", icon: Mail },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "support", label: "Support", icon: HelpCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-surface border-r border-secondary/10 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-8 border-b border-secondary/10">
          <Link to="/">
            <img src={Logo} alt="Siraba" className="h-12" />
          </Link>
          <span className="font-subheading text-accent text-xs tracking-[0.2em] uppercase font-bold mt-3 block">
            Vendor Portal
          </span>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-primary mt-4 transition-colors"
          >
            <ArrowLeft size={12} /> Back to Website
          </Link>
        </div>

        {/* Vendor Info */}
        <div className="p-6 border-b border-secondary/10 bg-background/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
              <Store className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-medium text-lg text-primary truncate">
                {vendor?.businessName}
              </p>
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm ${
                  vendor?.status === "approved"
                    ? "bg-secondary/20 text-secondary"
                    : vendor?.status === "pending"
                      ? "bg-accent/10 text-accent"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {vendor?.status?.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-sm transition-all duration-300 group ${
                activeTab === item.id
                  ? "bg-primary text-surface shadow-md"
                  : "text-text-secondary hover:bg-secondary/5 hover:text-primary"
              }`}
            >
              <item.icon
                className={`w-5 h-5 transition-colors ${activeTab === item.id ? "text-accent" : "text-secondary group-hover:text-accent"}`}
              />
              <span
                className={`font-medium text-sm tracking-wide ${activeTab === item.id ? "font-bold" : ""}`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-secondary/10 bg-surface">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-sm transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium tracking-wide text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const SupportContent = ({ vendor }) => {
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send as a vendor message to admin
      await client.post("/vendor-messages/vendor", {
        message: `[${subject}] ${message}`,
      });
      alert("Message sent to support team successfully!");
      setSubject("General Inquiry");
      setMessage("");
    } catch (error) {
      alert("Failed to send message");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-secondary/5 border border-secondary/10 rounded-sm p-8 text-center backdrop-blur-sm">
        <h2 className="font-heading text-3xl font-bold text-primary mb-2">
          Need help? We're here for you.
        </h2>
        <p className="text-text-secondary max-w-lg mx-auto font-light">
          Our support team is available Mon-Fri to assist you with any issues
          related to your shop, orders, or account.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 space-y-4 hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-3 text-primary">
              <div className="p-2 bg-accent/10 rounded-sm text-accent">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-lg">
                Email Support
              </h3>
            </div>
            <div>
              <p className="font-medium text-primary">info@sirabaorganic.com</p>
              <p className="text-sm text-text-secondary font-light">
                Response time: 24 hours
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 space-y-4 hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-3 text-primary">
              <div className="p-2 bg-accent/10 rounded-sm text-accent">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-lg">
                Phone Support
              </h3>
            </div>
            <div>
              <p className="font-medium text-primary">+91 98765 43210</p>
              <p className="text-sm text-text-secondary font-light">
                Mon-Fri, 9am - 6pm IST
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10">
            <h3 className="font-heading font-bold text-2xl mb-6 flex items-center gap-3 text-primary">
              <Send className="w-5 h-5 text-accent" /> Send a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                >
                  <option>General Inquiry</option>
                  <option>Order Issue</option>
                  <option>Payment/Payout</option>
                  <option>Technical Support</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  How can we help?
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="6"
                  required
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light resize-none"
                  placeholder="Describe your issue..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-accent text-primary rounded-sm hover:bg-primary hover:text-surface disabled:opacity-50 font-bold uppercase tracking-widest transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = "primary",
  subtitle,
}) => (
  <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 hover:border-accent/30 transition-colors group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-text-secondary text-sm font-medium uppercase tracking-wide">
          {title}
        </p>
        <p className="text-3xl font-heading font-medium mt-1 text-primary">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-1 font-light italic">
            {subtitle}
          </p>
        )}
        {trend && (
          <div
            className={`flex items-center gap-1 mt-2 text-sm font-medium ${
              trend === "up" ? "text-secondary" : "text-red-500"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div
        className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all group-hover:scale-110 ${
          color === "primary"
            ? "bg-primary/10 text-primary"
            : color === "green"
              ? "bg-secondary/10 text-secondary"
              : color === "orange"
                ? "bg-accent/10 text-accent"
                : "bg-primary/5 text-primary"
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

// Dashboard Content
const DashboardContent = ({ dashboardData, vendor }) => {
  const stats = dashboardData?.stats || {};
  const recentOrders = dashboardData?.recentOrders || [];
  const lowStockItems = dashboardData?.lowStockItems || [];
  const ordersByStatus = dashboardData?.ordersByStatus || {};
  const vendorWallet = dashboardData?.vendor?.wallet || {};
  const commissionRate =
    vendor?.commissionRate || dashboardData?.vendor?.commissionRate || 15;

  return (
    <div className="space-y-6">
      {/* Commission Rate Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-sm p-6 text-surface flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-surface/10 rounded-sm backdrop-blur-sm text-accent">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <p className="font-heading font-medium text-xl">
              Your Commission Rate
            </p>
            <p className="text-surface/80 text-sm font-light mt-1">
              Platform fee on each sale (
              <span className="font-medium text-accent">
                {vendor?.subscription?.plan || "Starter"}
              </span>{" "}
              plan)
            </p>
          </div>
        </div>
        <div className="text-right relative z-10">
          <p className="text-4xl font-heading font-bold">{commissionRate}%</p>
          {commissionRate > 5 && (
            <Link
              to="#"
              className="text-xs text-accent hover:text-surface transition-colors mt-2 inline-block font-bold uppercase tracking-wider"
            >
              Upgrade to reduce commission →
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Wallet Balance"
          value={`₹${(vendorWallet.balance || 0).toLocaleString()}`}
          icon={Wallet}
          color="green"
          subtitle="Available for payout"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          title="Net Earnings"
          value={`₹${(stats.netEarnings || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="blue"
          subtitle="After commission"
        />
        <StatCard
          title="Commission Paid"
          value={`₹${(stats.totalCommission || 0).toLocaleString()}`}
          icon={BarChart3}
          color="orange"
          subtitle={`${commissionRate}% of sales`}
        />
      </div>

      {/* Orders by Status */}
      <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10">
        <h3 className="font-heading font-medium text-xl mb-6 text-primary">
          Order Status Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "returned",
          ].map((status) => (
            <div
              key={status}
              className="text-center p-4 bg-background/50 rounded-sm hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/10"
            >
              <p className="text-2xl font-bold font-heading text-primary mb-1">
                {ordersByStatus[status] || 0}
              </p>
              <p className="text-xs text-text-secondary capitalize tracking-wide">
                {status}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-medium text-lg text-primary">
              Recent Orders
            </h3>
            <Link
              to="#"
              className="text-accent text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors"
            >
              View All
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-sm hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/10"
                >
                  <div>
                    <p className="font-medium text-sm">
                      #{order._id.slice(-8)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">
                      ₹{order.subtotal}
                    </p>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded-sm mt-1 inline-block tracking-wider ${
                        order.status === "delivered"
                          ? "bg-secondary/20 text-secondary"
                          : order.status === "shipped"
                            ? "bg-primary/10 text-primary"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-accent/10 text-accent"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-secondary py-8">
              No orders yet
            </p>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-medium text-lg flex items-center gap-3 text-primary">
              <div className="p-1.5 bg-red-100 rounded-full text-red-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
              Low Stock Items
            </h3>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-sm hover:bg-red-100/50 transition-colors border border-red-100"
                >
                  <div>
                    <p className="font-medium text-sm text-primary">
                      {item.sku}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Reorder level: {item.reorderLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {item.stockQuantity} left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-secondary py-12 bg-background/30 rounded-sm border border-secondary/5 font-light">
              All items well stocked!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Orders Content
const OrdersContent = ({ orders, fetchOrders, updateOrderStatus }) => {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: "",
    trackingNumber: "",
    shippingCarrier: "",
  });

  useEffect(() => {
    fetchOrders({ status: statusFilter });
  }, [statusFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    const result = await updateOrderStatus(selectedOrder._id, updateData);
    if (result.success) {
      setSelectedOrder(null);
      setUpdateData({ status: "", trackingNumber: "", shippingCarrier: "" });
      fetchOrders({ status: statusFilter });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface rounded-sm p-4 shadow-sm border border-secondary/10 flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 text-sm font-light min-w-[200px]"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-sm shadow-lg border border-secondary/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background/80 border-b border-secondary/10">
              <tr>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Order ID
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Items
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Amount
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Date
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/5">
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-secondary/5 transition-colors"
                >
                  <td className="px-6 py-5 text-sm font-medium text-primary">
                    #{order._id.slice(-8)}
                  </td>
                  <td className="px-6 py-5 text-sm text-text-secondary font-light">
                    {order.items?.length || 0} items
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-primary">
                    ₹{order.subtotal}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-sm tracking-wider ${
                        order.status === "delivered"
                          ? "bg-secondary/20 text-secondary"
                          : order.status === "shipped"
                            ? "bg-primary/10 text-primary"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-accent/10 text-accent"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-text-secondary font-light">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setUpdateData({
                            status: order.status,
                            trackingNumber: order.trackingNumber || "",
                            shippingCarrier: order.shippingCarrier || "",
                          });
                        }}
                        className="text-accent text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors hover:underline"
                      >
                        Update
                      </button>
                      <span className="text-secondary/20">|</span>
                      <button
                        onClick={async () => {
                          try {
                            // Use axios with auth token to download PDF
                            const response = await client.get(
                              `/vendors/invoices/${order._id}/download`,
                              {
                                responseType: "blob",
                              },
                            );

                            // Create blob link to download
                            const blob = new Blob([response.data], {
                              type: "application/pdf",
                            });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `Vendor-Invoice-${order._id.slice(-8).toUpperCase()}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error("Failed to download invoice:", error);
                            alert(
                              "Failed to download invoice. Please try again.",
                            );
                          }
                        }}
                        className="text-primary text-xs font-bold uppercase tracking-wider hover:text-accent transition-colors hover:underline flex items-center gap-1"
                        title="Download Invoice"
                      >
                        <FileText className="w-3 h-3" />
                        Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="p-16 text-center text-text-secondary font-light">
            No orders found matching your criteria.
          </div>
        )}
      </div>

      {/* Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-sm p-8 max-w-md w-full shadow-2xl border border-secondary/10">
            <h3 className="text-xl font-heading font-medium mb-6 text-primary flex items-center gap-3">
              <Package className="w-5 h-5 text-accent" />
              Update Order #{selectedOrder._id.slice(-8)}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, status: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {updateData.status === "shipped" && (
                <>
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={updateData.trackingNumber}
                      onChange={(e) =>
                        setUpdateData({
                          ...updateData,
                          trackingNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                      Shipping Carrier
                    </label>
                    <input
                      type="text"
                      value={updateData.shippingCarrier}
                      onChange={(e) =>
                        setUpdateData({
                          ...updateData,
                          shippingCarrier: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                      placeholder="e.g., BlueDart, Delhivery"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-4 mt-8 pt-4 border-t border-secondary/5">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-4 py-3 border border-secondary/20 rounded-sm text-text-secondary font-medium hover:bg-secondary/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 px-4 py-3 bg-primary text-surface rounded-sm hover:bg-primary/90 font-bold uppercase tracking-wider transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Returns Content
const ReturnsContent = ({ vendor }) => {
  const [returns, setReturns] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/vendors/returns`, {
        params: { status: statusFilter },
      });
      setReturns(data);
    } catch (error) {
      console.error("Failed to fetch returns", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const handleUpdateReturnStatus = async () => {
    if (!selectedReturn || !updateStatus) return;

    setLoading(true);
    try {
      await client.put(`/vendors/returns/${selectedReturn._id}`, {
        status: updateStatus,
      });
      alert("Return status updated successfully!");
      setSelectedReturn(null);
      setUpdateStatus("");
      fetchReturns();
    } catch (error) {
      console.error("Failed to update return status", error);
      alert("Failed to update return status.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      processing: "bg-blue-100 text-blue-700",
      completed: "bg-secondary/20 text-secondary",
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

  if (loading && returns.length === 0) {
    return <div className="text-center py-12">Loading returns...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface rounded-sm p-4 shadow-sm border border-secondary/10 flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 text-sm font-light min-w-[200px]"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Returns Table */}
      <div className="bg-surface rounded-sm shadow-lg border border-secondary/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background/80 border-b border-secondary/10">
              <tr>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Return ID
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Order ID
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Product
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Reason
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Date
                </th>
                <th className="text-left px-6 py-5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/5">
              {returns.map((ret) => (
                <tr
                  key={ret._id}
                  className="hover:bg-secondary/5 transition-colors"
                >
                  <td className="px-6 py-5 text-sm font-medium text-primary">
                    #{ret._id.slice(-8)}
                  </td>
                  <td className="px-6 py-5 text-sm text-text-secondary font-light">
                    #{ret.orderId?.slice(-8)}
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-primary">
                    {ret.productName}
                  </td>
                  <td className="px-6 py-5 text-sm text-text-secondary font-light">
                    {ret.reason}
                  </td>
                  <td className="px-6 py-5">{getStatusBadge(ret.status)}</td>
                  <td className="px-6 py-5 text-sm text-text-secondary font-light">
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => {
                        setSelectedReturn(ret);
                        setUpdateStatus(ret.status);
                      }}
                      className="text-accent text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors hover:underline"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {returns.length === 0 && (
          <div className="p-16 text-center text-text-secondary font-light">
            No returns found matching your criteria.
          </div>
        )}
      </div>

      {/* Update Return Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-sm p-8 max-w-md w-full shadow-2xl border border-secondary/10">
            <h3 className="text-xl font-heading font-medium mb-6 text-primary flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-accent" />
              Manage Return #{selectedReturn._id.slice(-8)}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Current Status
                </label>
                <p className="text-lg font-medium text-primary">
                  {selectedReturn.status}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Update Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {selectedReturn.customerComment && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Customer Comment
                  </label>
                  <p className="p-3 bg-background/50 rounded-sm border border-secondary/10 text-sm text-text-secondary font-light italic">
                    "{selectedReturn.customerComment}"
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-8 pt-4 border-t border-secondary/5">
              <button
                onClick={() => setSelectedReturn(null)}
                className="flex-1 px-4 py-3 border border-secondary/20 rounded-sm text-text-secondary font-medium hover:bg-secondary/5 transition-colors"
              >
                Cancel
              </button>
              {["Approved"].includes(selectedReturn.status) &&
                selectedReturn.returnStatus !== "Completed" &&
                selectedReturn.returnStatus !== "Refunded" && (
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Are you sure you want to issue a refund? This will deduct from your wallet/payouts.",
                        )
                      )
                        return;
                      setLoading(true);
                      try {
                        await client.post(
                          `/vendors/orders/${selectedReturn._id}/refund`,
                        );
                        alert("Refund processed successfully!");
                        setSelectedReturn(null);
                        fetchReturns();
                      } catch (err) {
                        console.error(err);
                        alert(err.response?.data?.message || "Refund failed");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-sm hover:bg-green-700 font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                  >
                    Issue Refund
                  </button>
                )}
              <button
                onClick={handleUpdateReturnStatus}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-primary text-surface rounded-sm hover:bg-primary/90 font-bold uppercase tracking-wider transition-all duration-300 shadow-md transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Products Content - For vendors to add/manage their products
const ProductsContent = ({
  vendorProducts,
  fetchVendorProducts,
  addVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  isApproved = true,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fullDescription: "",
    price: "",
    costPrice: "",
    category: "Saffron",
    tag: "",
    images: [],
    features: [],
    ingredients: "",
    stockQuantity: 0,
    sku: "",
  });
  const [newFeature, setNewFeature] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    fetchVendorProducts(statusFilter);
  }, [statusFilter]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      fullDescription: "",
      price: "",
      costPrice: "",
      category: "Saffron",
      tag: "",
      images: [],
      features: [],
      ingredients: "",
      stockQuantity: 0,
      sku: "",
    });
    setNewFeature("");
    setNewImageUrl("");
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      costPrice: parseFloat(formData.costPrice) || undefined,
      stockQuantity: parseInt(formData.stockQuantity) || 0,
    };

    let result;
    if (editingProduct) {
      result = await updateVendorProduct(editingProduct._id, productData);
    } else {
      result = await addVendorProduct(productData);
    }

    if (result.success) {
      setShowAddModal(false);
      resetForm();
    } else {
      alert(result.message || "Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      fullDescription: product.fullDescription || "",
      price: product.price || "",
      costPrice: product.costPrice || "",
      category: product.category || "Saffron",
      tag: product.tag || "",
      images: product.images || [],
      features: product.features || [],
      ingredients: product.ingredients || "",
      stockQuantity: product.stockQuantity || 0,
      sku: product.sku || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteVendorProduct(productId);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const addImage = () => {
    if (newImageUrl.trim() && formData.images.length < 5) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()],
      });
      setNewImageUrl("");
    }
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          styles[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pending Approval Notice */}
      {!isApproved && (
        <div className="bg-yellow-50/50 border border-yellow-200 rounded-sm p-5 flex items-start gap-4 backdrop-blur-sm">
          <div className="p-2 bg-yellow-100 rounded-full text-yellow-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-heading font-medium text-yellow-900 text-lg">
              Account Pending Approval
            </p>
            <p className="text-sm text-yellow-800/80 font-light mt-1 max-w-2xl">
              You can view products but cannot add or modify them until your
              account is approved. Our team reviews accounts typically within
              24-48 hours.
            </p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-secondary/5 border border-secondary/10 rounded-sm p-6 flex gap-4 backdrop-blur-sm">
        <div className="p-2 bg-secondary/10 rounded-sm text-secondary h-fit">
          <HelpCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-text-secondary font-light leading-relaxed max-w-4xl">
          <strong className="text-primary font-medium block mb-1">
            How it works:
          </strong>{" "}
          Products you add will be reviewed by our team before appearing in the
          shop. Once approved, customers can purchase them. You'll receive
          orders and payouts through the platform.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-heading text-primary">My Products</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-secondary/20 rounded-sm bg-background/50 text-sm font-light min-w-[200px]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          disabled={!isApproved}
          className={`px-6 py-2.5 rounded-sm flex items-center gap-2 font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
            isApproved
              ? "bg-accent text-primary hover:bg-primary hover:text-surface shadow-md hover:shadow-lg"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vendorProducts.map((product) => (
          <div
            key={product._id}
            className="bg-surface rounded-sm shadow-lg border border-secondary/10 overflow-hidden group hover:border-accent/30 transition-all duration-500 hover:-translate-y-1"
          >
            {/* Product Image */}
            <div className="aspect-[4/3] bg-background relative overflow-hidden">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-secondary/30">
                  <Image className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-3 right-3 shadow-sm">
                {getStatusBadge(product.vendorStatus)}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-6">
              <h3 className="font-heading font-medium text-lg text-primary truncate mb-1">
                {product.name}
              </h3>
              <p className="text-sm text-text-secondary font-light line-clamp-2 h-10 mb-4">
                {product.description}
              </p>

              <div className="flex items-end justify-between mb-4 pb-4 border-b border-secondary/5">
                <div>
                  <p className="font-bold text-xl text-primary font-heading">
                    ₹{product.price}
                  </p>
                  {product.costPrice && (
                    <p className="text-xs text-text-secondary font-light mt-0.5">
                      Cost:{" "}
                      <span className="font-medium">₹{product.costPrice}</span>
                    </p>
                  )}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary bg-background px-2 py-1 rounded-sm">
                  Stock: {product.stockQuantity || 0}
                </p>
              </div>

              {/* Rejection Reason */}
              {product.vendorStatus === "rejected" &&
                product.vendorRejectionReason && (
                  <div className="mb-4 p-3 bg-red-50 rounded-sm text-xs text-red-700 border border-red-100">
                    <strong className="block mb-1">Rejection reason:</strong>
                    {product.vendorRejectionReason}
                  </div>
                )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(product)}
                  disabled={!isApproved}
                  className={`flex-1 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    isApproved
                      ? "bg-secondary/10 hover:bg-secondary/20 text-primary"
                      : "bg-gray-50 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  disabled={!isApproved}
                  className={`p-2.5 rounded-sm transition-colors ${
                    isApproved
                      ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100"
                      : "bg-gray-50 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {vendorProducts.length === 0 && (
        <div className="bg-surface rounded-sm p-16 text-center border border-secondary/10">
          {" "}
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Products Yet</h3>
          <p className="text-text-secondary mb-4">
            {statusFilter
              ? `No ${statusFilter} products found.`
              : "Start adding products to sell on the platform!"}
          </p>
          {isApproved && !statusFilter && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Add Your First Product
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-sm p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-secondary/10">
            <h3 className="text-2xl font-heading font-medium mb-6 text-primary border-b border-secondary/10 pb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  placeholder="e.g., Premium Kashmiri Saffron"
                />
              </div>

              {/* Category & Tag */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  >
                    <option value="Saffron">Saffron</option>
                    <option value="Organic Spices">Organic Spices</option>
                    <option value="Dry Fruits">Dry Fruits</option>
                    <option value="Honey">Honey</option>
                    <option value="Herbs">Herbs</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Tag
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData({ ...formData, tag: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                    placeholder="e.g., Best Seller"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Short Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={2}
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light resize-none"
                  placeholder="Brief product description"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Full Description
                </label>
                <textarea
                  value={formData.fullDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullDescription: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light resize-none"
                  placeholder="Detailed product description"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    step="0.01"
                    className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                    step="0.01"
                    className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  />
                </div>
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  placeholder="Auto-generated if empty"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Product Images (max 5)
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                    placeholder="Enter image URL"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={formData.images.length >= 5}
                    className="px-6 py-3 bg-secondary/10 rounded-sm hover:bg-secondary/20 text-text-secondary font-medium tracking-wide disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {formData.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-24 rounded-sm border border-secondary/20 overflow-hidden group"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-sm backdrop-blur-sm transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Features
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="flex-1 px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                    placeholder="Add a feature"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addFeature())
                    }
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-6 py-3 bg-secondary/10 rounded-sm hover:bg-secondary/20 text-text-secondary font-medium tracking-wide"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {formData.features.map((feat, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-background rounded-sm text-sm flex items-center gap-2 border border-secondary/10"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-text-secondary hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Ingredients
                </label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) =>
                    setFormData({ ...formData, ingredients: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light resize-none"
                  placeholder="List ingredients"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-secondary/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-secondary/20 rounded-sm hover:bg-secondary/10 font-medium text-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-accent text-primary rounded-sm hover:bg-primary hover:text-surface font-bold uppercase tracking-wider transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
                >
                  {editingProduct ? "Update Product" : "Submit for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Compliance Content
const ComplianceContent = ({
  compliance,
  fetchCompliance,
  addComplianceDoc,
  deleteComplianceDoc,
  vendor,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "business_license",
    expiryDate: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const handleEditClick = (doc) => {
    setEditingDocId(doc._id);
    setFormData({
      name: doc.name,
      type: doc.type,
      expiryDate: doc.expiryDate ? doc.expiryDate.split("T")[0] : "",
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingDocId(null);
    setFormData({
      name: "",
      type: "business_license",
      expiryDate: "",
    });
    setUploadError("");
    setUploadProgress(0);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ]);

    if (!allowedTypes.has(file.type)) {
      setUploadError("Unsupported type. Use PDF, JPG, PNG, or WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File too large. Max 5MB.");
      return;
    }

    setUploadError("");
    setUploading(true);
    setUploadProgress(0);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append(
        "folder",
        `vendors/${vendor?._id || "vendor"}/compliance`,
      );
      formDataUpload.append("publicId", `${formData.type}-${Date.now()}`);

      const { data } = await client.post("/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const pct = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(pct);
        },
      });

      // Save to compliance
      const result = await addComplianceDoc({
        name: formData.name || file.name,
        type: formData.type,
        fileUrl: data.url,
        expiryDate: formData.expiryDate,
      });

      if (result.success) {
        setShowAddModal(false);
        setFormData({
          name: "",
          type: "business_license",
          expiryDate: "",
        });
        setUploadProgress(0);
      } else {
        setUploadError(result.message || "Failed to save document");
      }
    } catch (err) {
      setUploadError(
        err.response?.data?.message || err.message || "Upload failed",
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const documentTypes = [
    { value: "business_license", label: "Business License" },
    { value: "gst_certificate", label: "GST Certificate" },
    { value: "fssai_license", label: "FSSAI License" },
    { value: "organic_certification", label: "Organic Certification" },
    { value: "pan_card", label: "PAN Card" },
    { value: "bank_details", label: "Bank Details" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-secondary/10 pb-6">
        <div>
          <h2 className="text-2xl font-heading text-primary">
            Compliance Documents
          </h2>
          <p className="text-text-secondary text-sm mt-1 font-light">
            Upload and manage your compliance documents
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2.5 bg-accent text-primary rounded-sm hover:bg-primary hover:text-surface flex items-center gap-2 font-bold uppercase tracking-wider transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
        >
          <FileCheck className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {compliance.map((doc) => (
          <div
            key={doc._id}
            className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-sm flex items-center justify-center transition-colors ${
                    doc.status === "approved"
                      ? "bg-secondary/10 text-secondary"
                      : doc.status === "rejected"
                        ? "bg-red-100 text-red-600"
                        : "bg-accent/10 text-accent"
                  }`}
                >
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-heading font-medium text-lg text-primary">
                    {doc.name}
                  </p>
                  <p className="text-xs text-text-secondary capitalize font-light">
                    {doc.type.replace("_", " ")}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-1 rounded-sm tracking-wider ${
                  doc.status === "approved"
                    ? "bg-secondary/20 text-secondary"
                    : doc.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : doc.status === "expired"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-accent/10 text-accent"
                }`}
              >
                {doc.status}
              </span>
            </div>

            {doc.expiryDate && (
              <p className="text-xs text-text-secondary mt-4 font-light border-t border-secondary/5 pt-3">
                Expires:{" "}
                <span className="font-medium text-primary">
                  {new Date(doc.expiryDate).toLocaleDateString()}
                </span>
              </p>
            )}

            {doc.rejectionReason && (
              <p className="text-xs text-red-600 mt-3 p-2 bg-red-50 rounded-sm border border-red-100">
                <strong>Reason:</strong> {doc.rejectionReason}
              </p>
            )}

            <div className="flex gap-4 mt-6 pt-4 border-t border-secondary/5 flex-wrap">
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors hover:underline"
              >
                View
              </a>
              <a
                href={doc.fileUrl}
                download={doc.name}
                className="text-green-600 text-xs font-bold uppercase tracking-wider hover:text-green-700 transition-colors hover:underline"
              >
                Download
              </a>
              <button
                onClick={() => handleEditClick(doc)}
                className="text-blue-500 text-xs font-bold uppercase tracking-wider hover:text-blue-700 transition-colors hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => deleteComplianceDoc(doc._id)}
                className="text-red-500 text-xs font-bold uppercase tracking-wider hover:text-red-700 transition-colors hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {compliance.length === 0 && (
        <div className="bg-surface rounded-sm p-16 text-center shadow-sm border border-secondary/10">
          <FileCheck className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
          <p className="text-text-secondary font-light">
            No documents uploaded yet
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-accent font-medium hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
          >
            Upload your first document
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingDocId
                ? "Edit Compliance Document"
                : "Upload Compliance Document"}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("compliance-file-input")?.click();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Document Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., FSSAI License 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Document Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Select File *
                </label>
                <div className="border-2 border-dashed border-secondary/30 rounded-lg p-4 text-center hover:border-accent transition-colors cursor-pointer">
                  <input
                    id="compliance-file-input"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div
                    onClick={() =>
                      document.getElementById("compliance-file-input")?.click()
                    }
                    className="cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-secondary/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-text-secondary">
                      {uploading ? "Uploading..." : "Click to select file"}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      PDF, JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {uploading && (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center mt-1 text-text-secondary">
                    {uploadProgress}% uploaded
                  </p>
                </div>
              )}

              {uploadError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  {uploadError}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetModal}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !formData.name || !formData.type}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {uploading
                    ? "Uploading..."
                    : editingDocId
                      ? "Update Details"
                      : "Select & Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Content
const SettingsContent = ({ vendor, updateProfile, getProfile }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile();
      if (data) setProfileData(data);
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile(profileData);
    setLoading(false);
    alert("Profile updated successfully!");
  };

  if (!profileData) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-heading font-medium text-primary">
        Account Settings
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              Business Name
            </label>
            <input
              type="text"
              value={profileData.businessName || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, businessName: e.target.value })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              Contact Person
            </label>
            <input
              type="text"
              value={profileData.contactPerson || ""}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  contactPerson: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              Phone
            </label>
            <input
              type="tel"
              value={profileData.phone || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, phone: e.target.value })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              Website
            </label>
            <input
              type="url"
              value={profileData.website || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, website: e.target.value })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
        </div>

        <hr className="border-secondary/10" />

        <h3 className="font-heading font-medium text-lg text-primary">
          Legal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              GST Number
            </label>
            <input
              type="text"
              value={profileData.gstNumber || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, gstNumber: e.target.value })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              PAN Number
            </label>
            <input
              type="text"
              value={profileData.panNumber || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, panNumber: e.target.value })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              FSSAI Number
            </label>
            <input
              type="text"
              value={profileData.fssaiNumber || ""}
              onChange={(e) =>
                setProfileData({ ...profileData, fssaiNumber: e.target.value })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
            Business Description
          </label>
          <textarea
            value={profileData.businessDescription || ""}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                businessDescription: e.target.value,
              })
            }
            rows={4}
            className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light resize-none"
          />
        </div>

        <hr className="border-secondary/10" />

        <h3 className="font-heading font-medium text-lg text-primary">
          Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              Street Address
            </label>
            <input
              type="text"
              value={profileData.address?.street || ""}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, street: e.target.value },
                })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              City
            </label>
            <input
              type="text"
              value={profileData.address?.city || ""}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, city: e.target.value },
                })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              State
            </label>
            <input
              type="text"
              value={profileData.address?.state || ""}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  address: { ...profileData.address, state: e.target.value },
                })
              }
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-accent text-primary rounded-sm hover:bg-primary hover:text-surface font-bold uppercase tracking-widest transition-all duration-300 shadow-md transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

// Wallet Content
const WalletContent = ({
  walletData,
  fetchWallet,
  requestPayout,
  fetchWalletTransactions,
}) => {
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionPage, setTransactionPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchWallet();
    if (data?.transactions) {
      setTransactions(data.transactions);
    }
    setLoading(false);
  };

  const handlePayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount < 500) {
      alert("Minimum payout amount is ₹500");
      return;
    }
    if (amount > (walletData?.balance || 0)) {
      alert("Insufficient balance");
      return;
    }

    const result = await requestPayout(amount);
    if (result.success) {
      alert("Payout request submitted successfully!");
      setShowPayoutModal(false);
      setPayoutAmount("");
      loadData();
    } else {
      alert(result.message || "Failed to request payout");
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "order_earning":
        return <ArrowDownRight className="w-4 h-4 text-green-600" />;
      case "commission":
        return <ArrowUpRight className="w-4 h-4 text-orange-600" />;
      case "payout":
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case "refund_debit":
      case "pending_cancelled":
      case "admin_refund_debit":
      case "admin_pending_cancelled":
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading wallet...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-sm text-green-600">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-green-100 text-green-700 px-2 py-1 rounded-sm">
              Available
            </span>
          </div>
          <p className="text-3xl font-heading font-medium text-green-700">
            ₹{(walletData?.balance || 0).toLocaleString()}
          </p>
          <p className="text-sm text-text-secondary mt-1 font-light">
            Available Balance
          </p>
        </div>

        <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 hover:border-yellow-300 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-50 rounded-sm text-yellow-600">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-yellow-100 text-yellow-700 px-2 py-1 rounded-sm">
              Pending
            </span>
          </div>
          <p className="text-3xl font-heading font-medium text-yellow-700">
            ₹{(walletData?.pendingBalance || 0).toLocaleString()}
          </p>
          <p className="text-sm text-text-secondary mt-1 font-light">
            Pending Earnings
          </p>
        </div>

        <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/5 rounded-sm text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-heading font-medium text-primary">
            ₹{(walletData?.totalEarnings || 0).toLocaleString()}
          </p>
          <p className="text-sm text-text-secondary mt-1 font-light">
            Total Earnings
          </p>
        </div>

        <div className="bg-surface rounded-sm p-6 shadow-md border border-secondary/10 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-sm text-orange-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-heading font-medium text-orange-600">
            ₹{(walletData?.totalCommissionPaid || 0).toLocaleString()}
          </p>
          <p className="text-sm text-text-secondary mt-1 font-light">
            Commission Paid
          </p>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-secondary/5 border border-secondary/10 rounded-sm p-6 flex items-start gap-4">
        <div className="p-2 bg-secondary/10 rounded-sm text-secondary shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="font-heading font-medium text-lg text-primary mb-1">
            When do I get paid?
          </p>
          <p className="text-sm text-text-secondary font-light leading-relaxed">
            Your wallet balance is credited when orders are marked as{" "}
            <strong className="text-primary font-medium">"Delivered"</strong>.
            Orders in pending, confirmed, or shipped status will appear in your
            dashboard stats but won't be added to your wallet until delivery is
            confirmed.
          </p>
        </div>
      </div>

      {/* Payout Section */}
      <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-medium text-xl text-primary mb-1">
              Request Payout
            </h3>
            <p className="text-sm text-text-secondary font-light">
              Minimum payout:{" "}
              <span className="font-medium text-primary">₹500</span> | Payouts
              processed within 3-5 business days
            </p>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={(walletData?.balance || 0) < 500}
            className={`px-8 py-3 rounded-sm flex items-center gap-2 font-bold uppercase tracking-wider transition-all duration-300 shadow-md transform hover:-translate-y-0.5 ${
              (walletData?.balance || 0) >= 500
                ? "bg-accent text-primary hover:bg-primary hover:text-surface"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none transform-none"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Request Payout
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-surface rounded-sm shadow-lg border border-secondary/10 overflow-hidden">
        <div className="p-6 border-b border-secondary/10 bg-background/30">
          <h3 className="font-heading font-medium text-lg text-primary">
            Transaction History
          </h3>
        </div>
        <div className="divide-y divide-secondary/5">
          {transactions.length > 0 ? (
            transactions.map((txn) => (
              <div
                key={txn._id}
                className="p-5 flex items-center justify-between hover:bg-secondary/5 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border border-current/10 ${
                      txn.type === "order_earning"
                        ? "bg-green-50 text-green-600"
                        : txn.type === "commission"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div>
                    <p className="font-medium capitalize text-primary font-heading tracking-wide">
                      {txn.type.replace("_", " ")}
                    </p>
                    <p className="text-sm text-text-secondary font-light mt-0.5">
                      {txn.description || "Transaction"}
                    </p>
                    <p className="text-xs text-text-secondary font-light mt-0.5">
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {(() => {
                    // Determine if this is a credit (positive) or debit (negative) transaction
                    const isCredit = [
                      "order_earning",
                      "credit",
                      "adjustment",
                    ].includes(txn.type);
                    const isDebit = [
                      "payout",
                      "commission",
                      "debit",
                      "refund_debit",
                      "pending_cancelled",
                      "admin_refund_debit",
                      "admin_pending_cancelled",
                    ].includes(txn.type);

                    let colorClass = "text-text-secondary";
                    let sign = "";

                    if (isCredit) {
                      colorClass = "text-green-600";
                      sign = "+";
                    } else if (isDebit) {
                      colorClass = "text-red-600";
                      sign = "-";
                    }

                    return (
                      <p
                        className={`font-bold font-heading text-lg ${colorClass}`}
                      >
                        {sign}₹{Math.abs(txn.amount).toLocaleString()}
                      </p>
                    );
                  })()}
                  <p className="text-xs text-text-secondary font-light mt-1">
                    Balance:{" "}
                    <span className="font-medium text-primary">
                      ₹{(txn.balanceAfter || 0).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center text-text-secondary font-light">
              No transactions yet
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-sm p-8 max-w-md w-full shadow-2xl border border-secondary/10">
            <h3 className="text-2xl font-heading font-medium mb-6 text-primary border-b border-secondary/10 pb-4">
              Request Payout
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  min="500"
                  max={walletData?.balance || 0}
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light text-lg"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-text-secondary mt-2 font-light">
                  Available:{" "}
                  <span className="font-medium text-green-600">
                    ₹{(walletData?.balance || 0).toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="bg-secondary/5 p-4 rounded-sm border border-secondary/10">
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  Payouts are processed to your registered bank account within
                  3-5 business days.
                </p>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-3 border border-secondary/20 rounded-sm hover:bg-secondary/10 font-medium text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayout}
                className="flex-1 px-4 py-3 bg-accent text-primary rounded-sm hover:bg-primary hover:text-surface font-bold uppercase tracking-wider transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
              >
                Request Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Shop Settings Content
const ShopSettingsContent = ({
  shopSettings,
  fetchShopSettings,
  updateShopSettings,
  vendor,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    shopName: "",
    shopSlug: "",
    tagline: "",
    shopDescription: "",
    shopBanner: "",
    shopLogo: "",
    returnPolicy: "",
    shippingPolicy: "",
    socialLinks: {
      instagram: "",
      facebook: "",
      twitter: "",
      website: "",
    },
    isPublished: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const settings = await fetchShopSettings();
    if (settings) {
      setFormData({
        shopName: settings.shopName || vendor?.businessName || "",
        shopSlug: settings.shopSlug || "",
        tagline: settings.tagline || "",
        shopDescription: settings.shopDescription || "",
        shopBanner: settings.shopBanner || "",
        shopLogo: settings.shopLogo || "",
        returnPolicy: settings.returnPolicy || "",
        shippingPolicy: settings.shippingPolicy || "",
        socialLinks: settings.socialLinks || {
          instagram: "",
          facebook: "",
          twitter: "",
          website: "",
        },
        isPublished: settings.isPublished || false,
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateShopSettings(formData);
    if (result.success) {
      alert("Shop settings saved successfully!");
    } else {
      alert(result.message || "Failed to save settings");
    }
    setSaving(false);
  };

  const generateSlug = () => {
    const slug = formData.shopName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData({ ...formData, shopSlug: slug });
  };

  if (loading) {
    return <div className="text-center py-12">Loading shop settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between border-b border-secondary/10 pb-6">
        <div>
          <h2 className="text-2xl font-heading text-primary font-medium">
            Shop Settings
          </h2>
          <p className="text-text-secondary font-light mt-1">
            Customize your vendor shop page appearance
          </p>
        </div>
        {formData.shopSlug && formData.isPublished && (
          <a
            href={`/shop/vendor/${formData.shopSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 border border-secondary/20 rounded-sm hover:bg-secondary/10 flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            View Shop
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10 space-y-6">
          <h3 className="font-heading font-medium text-xl flex items-center gap-3 text-primary border-b border-secondary/10 pb-4">
            <Store className="w-5 h-5 text-accent" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                Shop Name *
              </label>
              <input
                type="text"
                value={formData.shopName}
                onChange={(e) =>
                  setFormData({ ...formData, shopName: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                Shop URL Slug *
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.shopSlug}
                  onChange={(e) =>
                    setFormData({ ...formData, shopSlug: e.target.value })
                  }
                  required
                  className="flex-1 px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  placeholder="your-shop-name"
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="px-4 py-3 border border-secondary/20 rounded-sm hover:bg-secondary/10 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-2 font-light italic">
                siraba.com/shop/vendor/{formData.shopSlug || "your-shop-name"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) =>
                setFormData({ ...formData, tagline: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="A short tagline for your shop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.shopDescription}
              onChange={(e) =>
                setFormData({ ...formData, shopDescription: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Tell customers about your shop..."
            />
          </div>
        </div>

        {/* Branding */}
        <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10 space-y-6">
          <h3 className="font-heading font-medium text-xl flex items-center gap-3 text-primary border-b border-secondary/10 pb-4">
            <Palette className="w-5 h-5 text-accent" />
            Branding
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.shopLogo}
                onChange={(e) =>
                  setFormData({ ...formData, shopLogo: e.target.value })
                }
                className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                placeholder="https://..."
              />
              {formData.shopLogo && (
                <img
                  src={formData.shopLogo}
                  alt="Logo preview"
                  className="mt-4 w-24 h-24 object-cover rounded-sm border border-secondary/20 shadow-sm"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                Banner Image URL
              </label>
              <input
                type="url"
                value={formData.shopBanner}
                onChange={(e) =>
                  setFormData({ ...formData, shopBanner: e.target.value })
                }
                className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                placeholder="https://..."
              />
              {formData.shopBanner && (
                <img
                  src={formData.shopBanner}
                  alt="Banner preview"
                  className="mt-4 w-full h-24 object-cover rounded-sm border border-secondary/20 shadow-sm"
                />
              )}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10 space-y-6">
          <h3 className="font-heading font-medium text-xl flex items-center gap-3 text-primary border-b border-secondary/10 pb-4">
            <LinkIcon className="w-5 h-5 text-accent" />
            Social Links
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                Website
              </label>
              <input
                type="url"
                value={formData.socialLinks.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: {
                      ...formData.socialLinks,
                      website: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                Instagram
              </label>
              <input
                type="text"
                value={formData.socialLinks.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: {
                      ...formData.socialLinks,
                      instagram: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                placeholder="@yourusername"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                Facebook
              </label>
              <input
                type="text"
                value={formData.socialLinks.facebook}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: {
                      ...formData.socialLinks,
                      facebook: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                placeholder="facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                Twitter
              </label>
              <input
                type="text"
                value={formData.socialLinks.twitter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: {
                      ...formData.socialLinks,
                      twitter: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                placeholder="@yourusername"
              />
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10 space-y-6">
          <h3 className="font-heading font-medium text-xl flex items-center gap-3 text-primary border-b border-secondary/10 pb-4">
            <FileCheck className="w-5 h-5 text-accent" />
            Policies
          </h3>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              Return Policy
            </label>
            <textarea
              value={formData.returnPolicy}
              onChange={(e) =>
                setFormData({ ...formData, returnPolicy: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light resize-none"
              placeholder="Describe your return policy..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
              Shipping Policy
            </label>
            <textarea
              value={formData.shippingPolicy}
              onChange={(e) =>
                setFormData({ ...formData, shippingPolicy: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light resize-none"
              placeholder="Describe your shipping policy..."
            />
          </div>
        </div>

        {/* Publish Settings */}
        <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-medium text-lg text-primary">
                Publish Shop
              </h3>
              <p className="text-sm text-text-secondary font-light mt-1">
                Make your shop visible to customers
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-primary text-white rounded-sm hover:bg-primary/90 font-bold uppercase tracking-widest text-lg disabled:opacity-50 transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
        >
          {saving ? "Saving..." : "Save Shop Settings"}
        </button>
      </form>
    </div>
  );
};

// Subscription Content
const SubscriptionContent = ({
  subscription,
  plans,
  fetchSubscription,
  fetchPlans,
  selectPlan,
  vendor,
}) => {
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSubscription(), fetchPlans()]);
    setLoading(false);
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case "starter":
        return Rocket;
      case "professional":
        return Zap;
      case "enterprise":
        return Crown;
      default:
        return Star;
    }
  };

  const handleUpgrade = async (planName) => {
    if (subscription?.plan === planName) {
      alert("You are already on this plan");
      return;
    }

    const plan = plans[planName];
    if (!plan) return;

    if (planName === "starter") {
      // Downgrade to starter
      if (
        window.confirm(
          "Are you sure you want to downgrade to the Starter plan? Your commission rate will increase to 15%.",
        )
      ) {
        const result = await selectPlan(planName, billingCycle);
        if (result.success) {
          alert("Plan updated to Starter successfully!");
          loadData();
        }
      }
    } else {
      // Show payment modal for paid plans
      setSelectedPlan({ key: planName, ...plan });
      setShowPaymentModal(true);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4, 16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handlePayment = async () => {
    // Validate form
    if (
      !paymentForm.cardNumber ||
      !paymentForm.cardName ||
      !paymentForm.expiry ||
      !paymentForm.cvv
    ) {
      alert("Please fill in all payment details");
      return;
    }

    if (paymentForm.cardNumber.replace(/\s/g, "").length !== 16) {
      alert("Please enter a valid 16-digit card number");
      return;
    }

    setPaymentProcessing(true);

    // Simulate payment processing (2 seconds delay)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Process the subscription
    const result = await selectPlan(selectedPlan.key, billingCycle);

    setPaymentProcessing(false);

    if (result.success) {
      setShowPaymentModal(false);
      setPaymentForm({ cardNumber: "", cardName: "", expiry: "", cvv: "" });
      alert(
        `🎉 Payment successful! Your ${selectedPlan.name} plan is now active. Commission rate: ${selectedPlan.commissionRate}%`,
      );
      loadData();
    } else {
      alert(result.message || "Payment failed. Please try again.");
    }
  };

  const getPrice = () => {
    if (!selectedPlan) return 0;
    return billingCycle === "yearly"
      ? selectedPlan.priceYearly
      : selectedPlan.priceMonthly;
  };

  if (loading) {
    return <div className="text-center py-12">Loading subscription...</div>;
  }

  // Get current plan info
  const currentPlanKey =
    subscription?.plan ||
    subscription?.currentPlan ||
    vendor?.subscription?.plan ||
    "starter";
  const currentPlan = plans?.[currentPlanKey];

  // Determine if subscription is active - multiple fallbacks
  const isSubscriptionActive =
    subscription?.isActive === true ||
    currentPlanKey === "starter" ||
    (subscription?.plan &&
      subscription?.plan !== "starter" &&
      subscription?.endDate &&
      new Date(subscription.endDate) > new Date()) ||
    (vendor?.subscription?.isActive === true &&
      vendor?.subscription?.plan === currentPlanKey);

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Current Subscription</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(() => {
              const Icon = getPlanIcon(currentPlanKey);
              return (
                <>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${currentPlan?.color || "#22c55e"}20`,
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: currentPlan?.color || "#22c55e" }}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {currentPlan?.name || "Starter"} Plan
                    </p>
                    <p className="text-sm text-text-secondary">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isSubscriptionActive
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {isSubscriptionActive ? "Active" : "Inactive"}
                      </span>
                      {currentPlanKey !== "starter" &&
                        (subscription?.endDate ||
                          subscription?.subscription?.endDate) && (
                          <span className="ml-2">
                            • Renews{" "}
                            {new Date(
                              subscription?.endDate ||
                                subscription?.subscription?.endDate,
                            ).toLocaleDateString()}
                          </span>
                        )}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {currentPlanKey === "starter"
                ? "Free"
                : `₹${(currentPlan?.priceMonthly || 0).toLocaleString()}/mo`}
            </p>
            <p className="text-sm text-text-secondary">
              {currentPlan?.commissionRate || 15}% commission on sales
            </p>
          </div>
        </div>

        {/* Commission Info Box */}
        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                Your current commission rate:{" "}
                {vendor?.commissionRate || currentPlan?.commissionRate || 15}%
              </p>
              <p className="text-sm text-amber-700 mt-1">
                For every ₹100 sale, Siraba takes ₹
                {vendor?.commissionRate || 15} as platform fee. Upgrade your
                plan to reduce commission rates!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 bg-white rounded-lg p-2 shadow-sm border">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-6 py-2 rounded-lg transition ${
            billingCycle === "monthly" ? "bg-primary text-white" : ""
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`px-6 py-2 rounded-lg transition ${
            billingCycle === "yearly" ? "bg-primary text-white" : ""
          }`}
        >
          Yearly{" "}
          <span
            className={`text-sm ${
              billingCycle === "yearly" ? "text-white/80" : "text-green-600"
            }`}
          >
            (Save 17%)
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans &&
          Object.entries(plans).map(([key, plan]) => {
            const Icon = getPlanIcon(key);
            const price =
              billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
            const isCurrentPlan = currentPlanKey === key;

            return (
              <div
                key={key}
                className={`relative bg-surface rounded-sm p-8 shadow-lg border transition-all duration-300 hover:scale-105 ${
                  isCurrentPlan
                    ? "border-accent shadow-xl ring-1 ring-accent/20"
                    : "border-secondary/10 hover:border-accent/50"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-primary text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm">
                    {plan.badge}
                  </span>
                )}

                {isCurrentPlan && (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-sm border border-green-200">
                    Current
                  </span>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-12 h-12 rounded-sm flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${plan.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: plan.color }} />
                  </div>
                  <h3 className="font-heading font-medium text-xl text-primary">
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-heading font-medium text-primary">
                    {price === 0 ? "Free" : `₹${price.toLocaleString()}`}
                  </span>
                  {price > 0 && (
                    <span className="text-text-secondary text-sm font-light">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-text-secondary mb-6 flex items-center gap-2">
                  <span className="text-accent font-bold text-lg">
                    {plan.commissionRate}%
                  </span>{" "}
                  platform commission
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm font-light text-text-primary"
                    >
                      <CheckCircle className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3.5 rounded-sm font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                    isCurrentPlan
                      ? "bg-secondary/10 text-text-secondary cursor-not-allowed"
                      : key === "professional"
                        ? "bg-primary text-surface hover:bg-primary/90 shadow-md transform hover:-translate-y-0.5"
                        : key === "enterprise"
                          ? "bg-gradient-to-r from-purple-900 to-indigo-900 text-surface hover:shadow-lg shadow-md transform hover:-translate-y-0.5"
                          : "border border-secondary/20 hover:bg-secondary/5 text-primary"
                  }`}
                >
                  {isCurrentPlan
                    ? "Current Plan"
                    : key === "starter"
                      ? "Downgrade"
                      : "Upgrade Now"}
                </button>
              </div>
            );
          })}
      </div>

      {/* Features Comparison */}
      <div className="bg-surface rounded-sm p-8 shadow-md border border-secondary/10">
        <h3 className="text-xl font-heading font-medium text-primary mb-6 border-b border-secondary/10 pb-4">
          Plan Benefits
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary/10">
                <th className="text-left py-4 px-6 font-heading font-medium text-primary">
                  Feature
                </th>
                <th className="text-center py-4 px-6 font-heading font-medium text-primary">
                  Starter
                </th>
                <th className="text-center py-4 px-6 font-heading font-medium text-primary">
                  Professional
                </th>
                <th className="text-center py-4 px-6 font-heading font-medium text-primary">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/5">
              <tr>
                <td className="py-4 px-6 text-sm font-light">Product Limit</td>
                <td className="text-center py-4 px-6 text-sm font-medium">
                  {plans?.starter?.limits?.products || 10}
                </td>
                <td className="text-center py-4 px-6 text-sm font-medium">
                  {plans?.professional?.limits?.products || 100}
                </td>
                <td className="text-center py-4 px-6 text-sm font-medium">
                  Unlimited
                </td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-sm font-light">
                  Commission Rate
                </td>
                <td className="text-center py-4 px-6 text-sm font-medium">
                  15%
                </td>
                <td className="text-center py-4 px-6 text-sm font-medium">
                  10%
                </td>
                <td className="text-center py-4 px-6 text-sm font-medium">
                  5%
                </td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-sm font-light">
                  Priority Support
                </td>
                <td className="text-center py-4 px-6">
                  <X className="w-5 h-5 text-gray-300 mx-auto" />
                </td>
                <td className="text-center py-4 px-6">
                  <CheckCircle className="w-5 h-5 text-secondary mx-auto" />
                </td>
                <td className="text-center py-4 px-6">
                  <CheckCircle className="w-5 h-5 text-secondary mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-sm font-light">
                  Analytics Dashboard
                </td>
                <td className="text-center py-4 px-6 text-sm">Basic</td>
                <td className="text-center py-4 px-6 text-sm">Advanced</td>
                <td className="text-center py-4 px-6 text-sm">
                  Advanced + Reports
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-sm max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-secondary/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-indigo-500/30 bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-heading font-medium tracking-wide">
                  Upgrade to {selectedPlan.name}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/80 text-sm font-light">
                Unlock lower commission rates and premium features
              </p>
            </div>

            {/* Plan Summary */}
            <div className="p-6 bg-background/50 border-b border-secondary/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-medium text-lg text-primary">
                    {selectedPlan.name} Plan
                  </p>
                  <p className="text-sm text-text-secondary font-light">
                    {billingCycle === "yearly" ? "Annual" : "Monthly"} billing
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-heading text-primary">
                    ₹{getPrice().toLocaleString()}
                  </p>
                  <p className="text-xs text-text-secondary font-light">
                    {billingCycle === "yearly" ? "/year" : "/month"}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-secondary/10 rounded-sm border border-secondary/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-primary font-medium">
                    Commission rate will be reduced to{" "}
                    <span className="text-green-600 font-bold">
                      {selectedPlan.commissionRate}%
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="p-6 space-y-6">
              <h4 className="font-heading font-medium text-lg flex items-center gap-3 text-primary">
                <CreditCard className="w-5 h-5 text-accent" />
                Payment Details
              </h4>

              <div className="p-4 bg-orange-50 rounded-sm border border-orange-100 text-sm">
                <p className="text-orange-800 font-light">
                  <strong className="font-medium">Demo Mode:</strong> Use any
                  card details for testing. No real payment will be processed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Card Number
                </label>
                <input
                  type="text"
                  value={paymentForm.cardNumber}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      cardNumber: formatCardNumber(e.target.value),
                    })
                  }
                  maxLength={19}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={paymentForm.cardName}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, cardName: e.target.value })
                  }
                  placeholder="JOHN DOE"
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={paymentForm.expiry}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        expiry: formatExpiry(e.target.value),
                      })
                    }
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    CVV
                  </label>
                  <input
                    type="password"
                    value={paymentForm.cvv}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                    maxLength={4}
                    placeholder="•••"
                    className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all font-light"
                  />
                </div>
              </div>

              {/* Secure Payment Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-text-secondary py-2 border-t border-secondary/5 pt-4">
                <Shield className="w-3 h-3" />
                <span className="font-light tracking-wide uppercase">
                  256-bit SSL Encrypted Payment
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-secondary/10 bg-background/30 rounded-b-sm">
              <button
                onClick={handlePayment}
                disabled={paymentProcessing}
                className="w-full py-3.5 bg-accent text-primary rounded-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-surface disabled:opacity-50 flex items-center justify-center gap-3 transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
              >
                {paymentProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>Pay ₹{getPrice().toLocaleString()}</>
                )}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentProcessing}
                className="w-full py-3 mt-3 text-text-secondary hover:text-primary font-medium text-sm uppercase tracking-wide transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reviews Content - For vendors to view and reply to reviews
const ReviewsContent = ({ vendorProducts }) => {
  const [reviews, setReviews] = useState([]);
  const [replyModal, setReplyModal] = useState({
    show: false,
    reviewId: null,
    productId: null,
    currentReply: "",
  });
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (vendorProducts) {
      const allReviews = [];
      vendorProducts.forEach((product) => {
        if (product.reviews && product.reviews.length > 0) {
          product.reviews.forEach((review) => {
            allReviews.push({
              ...review,
              productName: product.name,
              productImage: product.images?.[0] || product.image,
              productId: product._id,
            });
          });
        }
      });
      // Sort by date desc
      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(allReviews);
    }
  }, [vendorProducts]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await client.put(
        `/products/${replyModal.productId}/reviews/${replyModal.reviewId}/reply`,
        {
          reply: replyText,
        },
      );

      // Update reviews state optimistically
      setReviews((prev) =>
        prev.map((review) =>
          review._id === replyModal.reviewId &&
          review.productId === replyModal.productId
            ? { ...review, vendorReply: replyText, vendorReplyDate: new Date() }
            : review,
        ),
      );

      alert("Reply submitted");
      setReplyModal({
        show: false,
        reviewId: null,
        productId: null,
        currentReply: "",
      });
      setReplyText("");
    } catch (error) {
      alert("Failed to submit reply");
    }
  };

  const openReplyModal = (review) => {
    setReplyModal({
      show: true,
      reviewId: review._id,
      productId: review.productId,
      currentReply: review.vendorReply || "",
    });
    setReplyText(review.vendorReply || "");
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-heading font-medium text-primary border-b border-secondary/10 pb-6">
        Product Reviews
      </h2>

      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-surface p-8 rounded-sm border border-secondary/10 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-6">
                  <img
                    src={review.productImage}
                    alt=""
                    className="w-16 h-16 object-cover rounded-sm border border-secondary/20 shadow-sm"
                  />
                  <div>
                    <p className="font-heading font-medium text-lg text-primary">
                      {review.productName}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex text-accent">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < review.rating
                                ? "fill-current"
                                : "text-gray-200"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-sm">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-text-secondary font-light bg-secondary/5 px-3 py-1 rounded-full">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="mb-6 pl-22">
                <p className="font-medium text-primary mb-2 flex items-center gap-2">
                  {review.name}
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary font-light border border-secondary/20 px-1.5 rounded-sm">
                    Verified Buyer
                  </span>
                </p>
                <p className="text-text-secondary font-light leading-relaxed bg-background/50 p-4 rounded-sm border border-secondary/5 italic">
                  "{review.comment}"
                </p>
              </div>

              {review.vendorReply && (
                <div className="bg-secondary/5 p-6 rounded-sm border-l-4 border-accent mb-6 ml-6">
                  <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Store className="w-3 h-3 text-accent" />
                    Your Reply
                  </p>
                  <p className="text-sm text-text-secondary font-light">
                    {review.vendorReply}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-secondary/5">
                <button
                  onClick={() => openReplyModal(review)}
                  className="px-6 py-2 border border-secondary/20 rounded-sm text-xs font-bold uppercase tracking-wider text-primary hover:bg-secondary/5 transition-all flex items-center gap-2 group"
                >
                  <Edit2 className="w-3 h-3 text-accent group-hover:scale-110 transition-transform" />
                  {review.vendorReply ? "Edit Reply" : "Reply to Review"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-surface rounded-sm border border-secondary/10 shadow-sm">
            <Star className="w-12 h-12 text-secondary/20 mx-auto mb-4" />
            <p className="text-text-secondary font-light text-lg">
              No reviews found yet.
            </p>
          </div>
        )}
      </div>

      {replyModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-sm p-8 max-w-lg w-full shadow-2xl border border-secondary/10">
            <h3 className="text-2xl font-heading font-medium mb-6 text-primary flex items-center gap-3">
              <Edit2 className="w-5 h-5 text-accent" />
              Reply to Review
            </h3>
            <form onSubmit={handleReplySubmit}>
              <div className="mb-2 p-4 bg-background/50 rounded-sm border-l-2 border-secondary/30 text-sm text-text-secondary italic mb-6">
                "{reviews.find((r) => r._id === replyModal.reviewId)?.comment}"
              </div>
              <textarea
                className="w-full border border-secondary/20 rounded-sm p-4 h-40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 bg-background/30 resize-none font-light"
                placeholder="Write your professional response here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                required
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() =>
                    setReplyModal({
                      show: false,
                      reviewId: null,
                      productId: null,
                    })
                  }
                  className="px-6 py-3 border border-secondary/20 rounded-sm text-sm font-medium text-text-secondary hover:bg-secondary/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-surface rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-primary/90 shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  Submit Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
// Messages Content Component
const MessagesContent = ({ vendor }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await client.get("/vendor-messages/vendor");
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data } = await client.post("/vendor-messages/vendor", {
        message: newMessage,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message");
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between border-b border-secondary/10 pb-4">
        <div>
          <h2 className="text-2xl font-heading font-medium text-primary">
            Messages
          </h2>
          <p className="text-text-secondary font-light mt-1">
            Direct communication with Support
          </p>
        </div>
        <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase rounded-full flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Support Online
        </div>
      </div>

      <div className="bg-surface rounded-sm border border-secondary/10 flex flex-col flex-1 shadow-lg overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-60">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Mail size={32} className="text-secondary" />
              </div>
              <p className="font-heading font-medium text-lg text-primary">
                No messages yet
              </p>
              <p className="font-light text-sm mt-1">
                Start a conversation with support team.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${
                  msg.sender === "vendor" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] p-4 rounded-lg shadow-sm ${
                    msg.sender === "vendor"
                      ? "bg-primary text-surface rounded-br-none"
                      : "bg-surface border border-secondary/10 text-primary rounded-bl-none"
                  }`}
                >
                  <p
                    className={`text-sm leading-relaxed ${msg.sender === "vendor" ? "font-light" : "font-normal"}`}
                  >
                    {msg.message}
                  </p>
                  <p
                    className={`text-[10px] mt-2 text-right uppercase tracking-wider font-bold ${
                      msg.sender === "vendor"
                        ? "text-surface/70"
                        : "text-text-secondary/70"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-secondary/10 bg-surface">
          <form onSubmit={sendMessage} className="flex gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-6 py-3 border border-secondary/20 rounded-full focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 bg-background/50 font-light transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-primary text-surface rounded-full hover:bg-primary/90 transition-all font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2 transform active:scale-95"
            >
              <Send size={18} /> <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const VendorDashboard = () => {
  const {
    vendor,
    isApproved,
    dashboardData,
    orders,
    inventory,
    compliance,
    vendorProducts,
    walletData,
    shopSettings,
    subscription,
    plans,
    fetchDashboard,
    fetchOrders,
    fetchInventory,
    fetchCompliance,
    fetchVendorProducts,
    addVendorProduct,
    updateVendorProduct,
    deleteVendorProduct,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    updateOrderStatus,
    addComplianceDoc,
    deleteComplianceDoc,
    updateProfile,
    getProfile,
    refreshVendorStatus,
    fetchWallet,
    requestPayout,
    fetchWalletTransactions,
    fetchShopSettings,
    updateShopSettings,
    fetchPlans,
    fetchSubscription,
    selectPlan,
  } = useVendor();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await client.get("/notifications/vendor");
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await client.put("/notifications/vendor/read-all");
      // Optimistic update
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  // Refresh vendor status on mount to get latest approval status
  useEffect(() => {
    if (vendor) {
      refreshVendorStatus();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (vendor) {
      fetchDashboard();
    }
  }, [vendor]);

  if (!vendor) {
    return <Navigate to="/vendor" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Pending Approval Banner */}
        {!isApproved && (
          <div className="bg-accent text-primary px-8 py-4 sticky top-16 z-20 shadow-md backdrop-blur-md bg-accent/90">
            <div className="flex items-center justify-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-full animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <span className="font-heading font-medium tracking-wide">
                Your account is{" "}
                <span className="font-bold underline decoration-wavy underline-offset-4">
                  {vendor.status?.replace("_", " ")}
                </span>{" "}
                - Some features are restricted until approval
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-surface/80 backdrop-blur-md shadow-sm border-b border-secondary/10 sticky top-0 z-30 transition-all duration-300">
          <div className="flex items-center justify-between px-8 py-5">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-primary hover:text-accent transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-heading font-medium text-primary capitalize tracking-tight flex items-center gap-3">
                <span className="w-2 h-8 bg-accent rounded-full"></span>
                {activeTab.replace("-", " ")}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <NotificationDropdown
                notifications={notifications}
                onMarkAsRead={handleMarkAllRead}
              />
              <div className="h-8 w-px bg-secondary/20 mx-2 hidden sm:block"></div>
              <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-secondary/5 p-2 rounded-lg transition-colors group">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-offset-2 ring-transparent group-hover:ring-accent transition-all">
                  <span className="text-accent font-heading font-bold text-lg">
                    {vendor?.contactPerson?.charAt(0) || "V"}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-bold text-primary block leading-tight">
                    {vendor?.contactPerson || "Vendor"}
                  </span>
                  <span className="text-xs text-text-secondary font-light">
                    Vendor Account
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 max-w-[1600px] mx-auto animate-fadeIn">
          {activeTab === "dashboard" && (
            <DashboardContent dashboardData={dashboardData} vendor={vendor} />
          )}
          {activeTab === "products" && (
            <ProductsContent
              vendorProducts={vendorProducts}
              fetchVendorProducts={fetchVendorProducts}
              addVendorProduct={addVendorProduct}
              updateVendorProduct={updateVendorProduct}
              deleteVendorProduct={deleteVendorProduct}
              isApproved={isApproved}
            />
          )}
          {activeTab === "orders" && (
            <OrdersContent
              orders={orders}
              fetchOrders={fetchOrders}
              updateOrderStatus={updateOrderStatus}
            />
          )}
          {activeTab === "returns" && <ReturnsContent vendor={vendor} />}
          {activeTab === "wallet" && (
            <WalletContent
              walletData={walletData}
              fetchWallet={fetchWallet}
              requestPayout={requestPayout}
              fetchWalletTransactions={fetchWalletTransactions}
            />
          )}
          {activeTab === "shop" && (
            <ShopSettingsContent
              shopSettings={shopSettings}
              fetchShopSettings={fetchShopSettings}
              updateShopSettings={updateShopSettings}
              vendor={vendor}
            />
          )}
          {activeTab === "subscription" && (
            <SubscriptionContent
              subscription={subscription}
              plans={plans}
              fetchSubscription={fetchSubscription}
              fetchPlans={fetchPlans}
              selectPlan={selectPlan}
              vendor={vendor}
            />
          )}
          {activeTab === "inventory" && (
            <InventoryContent
              inventory={inventory}
              fetchInventory={fetchInventory}
              addInventoryItem={addInventoryItem}
              updateInventoryItem={updateInventoryItem}
              deleteInventoryItem={deleteInventoryItem}
              isApproved={isApproved}
            />
          )}
          {activeTab === "compliance" && (
            <ComplianceContent
              compliance={compliance}
              fetchCompliance={fetchCompliance}
              addComplianceDoc={addComplianceDoc}
              deleteComplianceDoc={deleteComplianceDoc}
              vendor={vendor}
            />
          )}
          {activeTab === "messages" && <MessagesContent vendor={vendor} />}
          {activeTab === "reviews" && (
            <ReviewsContent vendorProducts={vendorProducts} />
          )}
          {activeTab === "support" && <SupportContent vendor={vendor} />}
          {activeTab === "settings" && (
            <SettingsContent
              vendor={vendor}
              updateProfile={updateProfile}
              getProfile={getProfile}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;
