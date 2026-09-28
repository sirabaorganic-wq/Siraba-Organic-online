import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { useCurrency } from "../context/CurrencyContext";
import api from "../api/axios";
import addressApi from "../api/address";
import {
  MapPin,
  Phone,
  CreditCard,
  CheckCircle,
  Plus,
  Truck,
  AlertCircle,
  ChevronLeft,
  Loader2,
  Package,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
} from "lucide-react";
import SEO from "../components/SEO";

const Checkout = () => {
  const { user, updateProfile, updateUserAddresses } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  // Get discount from navigation state
  const discount = location.state?.discount || { amount: 0, code: "" };

  // Address State
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormLoading, setAddressFormLoading] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    addressType: "Home",
    isDefault: false,
  });

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD"); // COD or Online

  // Shipping Estimation State
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [showShippingBreakdown, setShowShippingBreakdown] = useState(false);
  const [shippingConfig, setShippingConfig] = useState({ freeShippingThreshold: 999 });
  const [gstPercentage, setGstPercentage] = useState(18);
  const [gstEnabled, setGstEnabled] = useState(true);

  // Load public authoritative shipping & GST config
  useEffect(() => {
    const loadShippingConfig = async () => {
      try {
        const { data } = await api.get("/shipping/config");
        if (data && data.freeShippingThreshold) {
          setShippingConfig(data);
        }
      } catch (err) {
        // Fallback default threshold 999
      }
    };
    const fetchGSTSettings = async () => {
      try {
        const { data } = await api.get("/gst/settings");
        if (data) {
          setGstEnabled(data.gst_enabled !== false);
          setGstPercentage(data.default_gst_percentage !== undefined ? data.default_gst_percentage : 18);
        }
      } catch (e) {
        // Fallback 18%
      }
    };
    loadShippingConfig();
    fetchGSTSettings();
  }, []);

  // GST State
  const [gstClaimed, setGstClaimed] = useState(false);
  const [buyerGstNumber, setBuyerGstNumber] = useState("");
  const [gstError, setGstError] = useState("");

  // GST Validation Function
  const validateGST = (gstNumber) => {
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstNumber) {
      return "GST number is required when claiming GST";
    }
    if (!gstRegex.test(gstNumber)) {
      return "Invalid GST number format (e.g., 29ABCDE1234F1Z5)";
    }
    return "";
  };

  useEffect(() => {
    if (user) {
      if (user.claim_gst) setGstClaimed(true);
      if (user.user_gst_number) setBuyerGstNumber(user.user_gst_number);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=checkout");
    } else if (cartItems.length === 0 && !orderSuccess) {
      navigate("/cart");
    }
  }, [user, cartItems, navigate, orderSuccess]);

  // Initial load and sync of addresses from backend
  useEffect(() => {
    if (user) {
      const loadAddresses = async () => {
        const res = await addressApi.getAddresses();
        if (res.success && res.data.length > 0) {
          setAddresses(res.data);
          if (updateUserAddresses) updateUserAddresses(res.data);
          // Auto select default or first
          setSelectedAddressId((prev) => {
            if (prev && res.data.some((a) => a._id === prev)) return prev;
            const def = res.data.find((a) => a.isDefault);
            return def ? def._id : res.data[0]._id;
          });
        } else if (res.success && res.data.length === 0) {
          setAddresses([]);
          setIsAddressFormOpen(true);
        }
      };
      loadAddresses();
    }
  }, [user?._id]);

  // Sync when user.addresses in context changes
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      setAddresses(user.addresses);
      setSelectedAddressId((prev) => {
        if (prev && user.addresses.some((a) => a._id === prev)) return prev;
        const def = user.addresses.find((a) => a.isDefault);
        return def ? def._id : user.addresses[0]._id;
      });
    } else if (user && (!user.addresses || user.addresses.length === 0)) {
      setIsAddressFormOpen(true);
    }
  }, [user?.addresses]);

  const selectedAddress =
    addresses.find((addr) => addr._id === selectedAddressId) ||
    addresses[0] ||
    null;

  // Fetch shipping estimate when address or payment method changes
  useEffect(() => {
    const fetchShippingEstimate = async () => {
      if (!selectedAddress?.postalCode) return;
      if (cartItems.length === 0) return;

      setShippingLoading(true);
      setShippingError("");
      try {
        const { data } = await api.post("/shipping/estimate", {
          cartItems: cartItems.map((item) => ({
            product: item._id || item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          deliveryPincode: selectedAddress.postalCode,
          paymentMethod,
        });
        setShippingEstimate(data);
      } catch (err) {
        console.error("Shipping estimate failed:", err);
        setShippingError("Could not estimate shipping. A flat rate will apply.");
        const sub = cartItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
        const disc = discount?.amount || 0;
        const discSub = Math.max(0, sub - disc);
        const isFree = discSub >= (shippingConfig.freeShippingThreshold || 999);
        const fallbackRate = isFree ? 0 : 66;
        setShippingEstimate({
          totalShipping: fallbackRate,
          isFreeShipping: isFree,
          freeShippingThreshold: shippingConfig.freeShippingThreshold || 999,
          amountToFreeShipping: Math.max(0, (shippingConfig.freeShippingThreshold || 999) - discSub),
          vendorBreakdown: [],
          _isFallback: true,
        });
      } finally {
        setShippingLoading(false);
      }
    };

    fetchShippingEstimate();
  }, [selectedAddressId, selectedAddress?.postalCode, paymentMethod, cartItems]);

  const openAddNewAddress = () => {
    setAddressFormError("");
    setEditingAddressId(null);
    setAddressForm({
      name: user?.name || "",
      phone: user?.phone || "",
      address: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      addressType: "Home",
      isDefault: addresses.length === 0,
    });
    setIsAddressFormOpen(true);
  };

  const openEditAddress = (addr, e) => {
    if (e) e.stopPropagation();
    setAddressFormError("");
    setEditingAddressId(addr._id);
    setAddressForm({
      name: addr.name || user?.name || "",
      phone: addr.phone || user?.phone || "",
      address: addr.address || "",
      addressLine2: addr.addressLine2 || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "India",
      addressType: addr.addressType || "Home",
      isDefault: !!addr.isDefault,
    });
    setIsAddressFormOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressFormError("");

    if (!addressForm.name || addressForm.name.trim().length < 2) {
      setAddressFormError("Recipient name must be at least 2 characters");
      return;
    }
    const cleanPhone = String(addressForm.phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setAddressFormError("Please provide a valid 10-digit phone number");
      return;
    }
    if (!addressForm.address || addressForm.address.trim().length < 5) {
      setAddressFormError("Street address must be at least 5 characters");
      return;
    }
    if (!addressForm.city || !addressForm.city.trim()) {
      setAddressFormError("City is required");
      return;
    }
    if (!addressForm.state || !addressForm.state.trim()) {
      setAddressFormError("State is required");
      return;
    }
    const cleanPostal = String(addressForm.postalCode || "").trim();
    if (!/^[0-9]{6}$/.test(cleanPostal)) {
      setAddressFormError("Postal/PIN code must be a 6-digit number");
      return;
    }

    setAddressFormLoading(true);
    try {
      if (editingAddressId) {
        const res = await addressApi.updateAddress(editingAddressId, addressForm);
        if (res.success) {
          const updated = addresses.map((a) => {
            if (a._id === editingAddressId) return res.data;
            if (res.data.isDefault) return { ...a, isDefault: false };
            return a;
          });
          setAddresses(updated);
          if (updateUserAddresses) updateUserAddresses(updated);
          setSelectedAddressId(res.data._id);
          setIsAddressFormOpen(false);
        } else {
          setAddressFormError(res.message);
        }
      } else {
        const res = await addressApi.addAddress(addressForm);
        if (res.success) {
          let updated = [...addresses];
          if (res.data.isDefault) {
            updated = updated.map((a) => ({ ...a, isDefault: false }));
          }
          updated.push(res.data);
          setAddresses(updated);
          if (updateUserAddresses) updateUserAddresses(updated);
          setSelectedAddressId(res.data._id); // Auto-select the newly added address
          setIsAddressFormOpen(false);
        } else {
          setAddressFormError(res.message);
        }
      }
    } catch (error) {
      console.error("Error saving address:", error);
      setAddressFormError("Failed to save address. Please try again.");
    } finally {
      setAddressFormLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress || addresses.length === 0) {
      alert("Please add or select a shipping address");
      setIsAddressFormOpen(true);
      return;
    }

    if (isAddressFormOpen) {
      alert("Please save your address details first or cancel address editing");
      return;
    }

    // Validate GST if claimed
    if (gstClaimed) {
      const error = validateGST(buyerGstNumber);
      if (error) {
        setGstError(error);
        alert(error);
        return;
      }
      setGstError("");
    }

    setLoading(true);

    const orderItems = cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      image:
        item.image || (item.images && item.images[0]) || "/placeholder.png",
      price: item.price,
      product: item._id || item.id,
    }));

    const subtotal = getCartTotal();
    const discountedSubtotal = Math.max(0, subtotal - discount.amount);
    const taxRate = gstEnabled ? (gstPercentage / 100) : 0;
    const taxPrice = Math.round(discountedSubtotal * taxRate * 100) / 100;
    const isFree = (discountedSubtotal >= (shippingEstimate?.freeShippingThreshold || shippingConfig.freeShippingThreshold || 999)) || shippingEstimate?.isFreeShipping;
    const shippingPrice = isFree
      ? 0
      : (shippingEstimate?.totalShipping !== undefined
          ? shippingEstimate.totalShipping
          : (shippingError ? 66 : 0));
    const totalPrice = Math.round((discountedSubtotal + taxPrice + shippingPrice) * 100) / 100;

    // Base Order Data with validated shippingAddressId and snapshot
    const orderData = {
      orderItems,
      shippingAddressId: selectedAddress._id,
      shippingAddress: selectedAddress,
      paymentMethod: paymentMethod === "Online" ? "Online" : "COD",
      itemsPrice: subtotal,
      taxPrice,
      shippingPrice,
      totalPrice,
      couponCode: discount.code,
      discountAmount: discount.amount,
      gstClaimed,
      buyerGstNumber,
    };

    try {
      if (paymentMethod === "COD") {
        const newOrder = await createOrder(orderData);
        setOrderSuccess(true);
        clearCart();
        navigate("/order-success", { state: { order: newOrder } });
      } else {
        // ONLINE PAYMENT (Razorpay)

        // 1. Create Razorpay Order from Backend without a DB order yet
        const tempReceipt = `temp_${Date.now()}`;
        const { data: razorpayOrder } = await api.post(
          "/payment/create-order",
          {
            amount: totalPrice,
            currency: "INR",
            receipt: tempReceipt,
          },
        );

        // 3. Open Razorpay Options
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Siraba Organic",
          description: "Order Payment",
          image: "/logo.png", // Add your logo path
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              // 4. Create DB Order ONLY after payment succeeds
              const newOrder = await createOrder(orderData);

              // 5. Verify Payment on Backend
              const verifyRes = await api.post("/payment/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: newOrder._id,
              });

              if (verifyRes.status === 200) {
                setOrderSuccess(true);
                clearCart();
                navigate("/order-success", { state: { order: newOrder } });
              }
            } catch (err) {
              console.error("Payment Verification Failed", err);
              alert(
                "Payment verification failed. Please contact support if money was deducted.",
              );
              // Navigate to a dedicated failed/retry page if available
              navigate("/orders"); 
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || selectedAddress.phone,
          },
          notes: {
            address: "Siraba Organic Corporate Office",
          },
          theme: {
            color: "#D4AF37", // Gold/Amber color matching theme
          },
          modal: {
            ondismiss: function() {
              // Handle the case where the user closes the payment window
              console.log("Payment modal dismissed");
              alert("Payment was not completed. Your order has not been placed.");
              // Stay on checkout page or go to cart
            }
          }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on("payment.failed", function (response) {
          alert(`Payment Failed: ${response.error.description || "Unknown error"}`);
          console.error(response.error);
        });

        rzp1.open();
      }
    } catch (error) {
      alert("Failed to place order. Please try again.");
      console.error(error);
    } finally {
      if (paymentMethod === "COD") setLoading(false); // For online, keep loading until modal opens? Actually better release it.
      setLoading(false);
    }
  };

  if (!user) return null;

  const subtotal = getCartTotal();
  const discountedSubtotal = Math.max(0, subtotal - discount.amount);
  const taxRate = gstEnabled ? (gstPercentage / 100) : 0;
  const taxPrice = Math.round(discountedSubtotal * taxRate * 100) / 100;
  const isFree = (discountedSubtotal >= (shippingEstimate?.freeShippingThreshold || shippingConfig.freeShippingThreshold || 999)) || shippingEstimate?.isFreeShipping;
  const shippingPrice = isFree
    ? 0
    : (shippingEstimate?.totalShipping !== undefined
        ? shippingEstimate.totalShipping
        : (shippingError ? 66 : 0));
  const totalPrice = Math.round((discountedSubtotal + taxPrice + shippingPrice) * 100) / 100;

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <SEO title="Checkout | Siraba Organic" noindex={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center text-secondary hover:text-primary transition-colors text-sm font-medium mb-4"
          >
            <ChevronLeft size={16} className="mr-1" /> Back to Cart
          </Link>
          <h1 className="font-heading text-3xl font-bold text-primary">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Address & Payment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address Section */}
            <div className="bg-surface p-8 rounded-sm shadow-sm border border-secondary/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-xl font-bold text-primary flex items-center">
                  <MapPin className="mr-2" size={20} /> Shipping Address
                </h2>
                {!isAddressFormOpen && addresses && addresses.length > 0 && (
                  <button
                    onClick={openAddNewAddress}
                    className="flex items-center text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider gap-1"
                  >
                    <Plus size={14} /> Add Address
                  </button>
                )}
              </div>

              {!isAddressFormOpen && addresses && addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <div
                        key={addr._id}
                        className={`relative border p-5 rounded-sm cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-secondary/20 hover:border-secondary/40 bg-background"
                        }`}
                        onClick={() => setSelectedAddressId(addr._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <div
                                className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${
                                  isSelected ? "bg-primary" : "bg-transparent"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-primary text-sm">
                                  {addr.name || user.name}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-sm">
                                  {addr.addressType || "Home"}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-text-secondary">
                                {addr.address}
                              </p>
                              {addr.addressLine2 && (
                                <p className="text-sm text-text-secondary">
                                  {addr.addressLine2}
                                </p>
                              )}
                              {addr.landmark && (
                                <p className="text-xs text-text-secondary italic">
                                  Landmark: {addr.landmark}
                                </p>
                              )}
                              <p className="text-sm text-text-secondary font-medium">
                                {addr.city}, {addr.state} {addr.postalCode}
                              </p>
                              <p className="text-sm text-text-secondary">
                                {addr.country || "India"}
                              </p>
                              <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                                <Phone size={11} className="text-secondary" />{" "}
                                {addr.phone || user.phone || "N/A"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => openEditAddress(addr, e)}
                            className="text-xs font-bold uppercase text-primary hover:text-accent transition-colors flex items-center gap-1 p-1 hover:bg-secondary/10 rounded-sm"
                            title="Edit this address"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={openAddNewAddress}
                    className="mt-4 inline-flex items-center text-xs font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider gap-1.5 py-2 px-3 border border-secondary/20 rounded-sm hover:border-primary"
                  >
                    <Plus size={14} /> Add Another Delivery Address
                  </button>
                </div>
              ) : (
                <div className="bg-background p-6 rounded-sm border border-secondary/20 animate-fade-in shadow-sm">
                  <h3 className="font-heading text-lg font-bold text-primary mb-4">
                    {editingAddressId
                      ? "Edit Delivery Address"
                      : "Add New Delivery Address"}
                  </h3>

                  {addressFormError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-sm mb-4 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-500" />
                      <span>{addressFormError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          Full Name *
                        </label>
                        <input
                          required
                          type="text"
                          value={addressForm.name}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                          placeholder="e.g. Ramesh Kumar"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          Phone Number (10 digits) *
                        </label>
                        <input
                          required
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                          placeholder="9876543210"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          Street Address *
                        </label>
                        <input
                          required
                          type="text"
                          value={addressForm.address}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              address: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                          placeholder="House/Flat No., Building Name, Street"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          Apartment, Suite, Unit, etc. (Optional)
                        </label>
                        <input
                          type="text"
                          value={addressForm.addressLine2}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              addressLine2: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                          placeholder="Apt 4B"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={addressForm.landmark}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              landmark: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                          placeholder="Near City Park"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          City *
                        </label>
                        <input
                          required
                          type="text"
                          value={addressForm.city}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              city: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                          placeholder="Jaipur"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          State / Province *
                        </label>
                        <input
                          required
                          type="text"
                          value={addressForm.state}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              state: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                          placeholder="Rajasthan"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          PIN / Postal Code (6 Digits) *
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={6}
                          value={addressForm.postalCode}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              postalCode: e.target.value,
                            })
                          }
                          className="w-full bg-surface border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                          placeholder="302001"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                          Address Type
                        </label>
                        <div className="flex gap-4 pt-2">
                          {["Home", "Work", "Other"].map((type) => (
                            <label
                              key={type}
                              className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                              <input
                                type="radio"
                                name="checkoutAddressType"
                                value={type}
                                checked={addressForm.addressType === type}
                                onChange={(e) =>
                                  setAddressForm({
                                    ...addressForm,
                                    addressType: e.target.value,
                                  })
                                }
                                className="accent-primary"
                              />
                              <span className="text-primary font-medium">
                                {type}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-2 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                isDefault: e.target.checked,
                              })
                            }
                            className="rounded accent-primary w-4 h-4"
                          />
                          <span className="text-text-secondary">
                            Set as default delivery address
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-secondary/10">
                      {addresses && addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddressFormOpen(false)}
                          className="text-text-secondary text-sm hover:text-primary transition-colors px-4 py-2"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={addressFormLoading}
                        className="bg-primary text-white px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {addressFormLoading && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        {addressFormLoading
                          ? "Saving..."
                          : editingAddressId
                          ? "Update Address"
                          : "Save & Deliver Here"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-surface p-8 rounded-sm shadow-sm border border-secondary/10">
              <h2 className="font-heading text-xl font-bold text-primary mb-6 flex items-center">
                <CreditCard className="mr-2" size={20} /> Payment Method
              </h2>

              <div className="space-y-4">
                {/* Online Payment Option */}
                <div
                  onClick={() => setPaymentMethod("Online")}
                  className={`p-4 border rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                    paymentMethod === "Online"
                      ? "border-primary bg-primary/5"
                      : "border-secondary/20 hover:border-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${
                        paymentMethod === "Online"
                          ? "bg-primary"
                          : "bg-transparent"
                      }`}
                    >
                      {paymentMethod === "Online" && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="font-bold text-primary text-sm">
                      Pay Online (UPI, Card, Netbanking)
                    </span>
                  </div>
                  <CreditCard size={20} className="text-secondary" />
                </div>

                {/* COD Option */}
                <div
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-4 border rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                    paymentMethod === "COD"
                      ? "border-primary bg-primary/5"
                      : "border-secondary/20 hover:border-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${
                        paymentMethod === "COD"
                          ? "bg-primary"
                          : "bg-transparent"
                      }`}
                    >
                      {paymentMethod === "COD" && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="font-bold text-primary text-sm">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                  <Truck size={20} className="text-secondary" />
                </div>
              </div>

              <p className="text-xs text-text-secondary mt-3 ml-1">
                <AlertCircle size={10} className="inline mr-1" />
                {paymentMethod === "COD"
                  ? "Pay securely with cash or UPI upon delivery."
                  : "Secure payment gateway powered by Razorpay."}
              </p>
            </div>

            {/* Tax Information / GST Claim */}
            <div className="bg-surface p-8 rounded-sm shadow-sm border border-secondary/10">
              <h2 className="font-heading text-xl font-bold text-primary mb-4 flex items-center">
                <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center mr-2 text-xs font-bold text-primary">
                  %
                </div>{" "}
                GST & Tax Information
              </h2>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-6">
                <div className="flex gap-2">
                  <AlertCircle
                    size={16}
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-xs text-blue-800 space-y-1">
                    <p className="font-semibold">About GST Invoicing:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>{gstPercentage}% GST is calculated and charged on all orders as per Indian tax laws</li>
                      <li>Enable GST claim if you have a registered GSTIN</li>
                      <li>Invoice will show your GSTIN for input tax credit</li>
                      <li>
                        Vendor GST number will be included on all invoices
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-background p-6 rounded-sm border border-secondary/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-primary mb-1">
                      I want to claim GST Input Credit
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Enable this if you have a registered GST number and want
                      to claim input tax credit. Your GSTIN will be mentioned on
                      the tax invoice.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={gstClaimed}
                      onChange={(e) => {
                        setGstClaimed(e.target.checked);
                        if (!e.target.checked) {
                          setGstError("");
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                {gstClaimed && (
                  <div className="space-y-3 pt-4 border-t border-secondary/10 animate-fade-in">
                    <div>
                      <label className="text-xs uppercase text-text-secondary tracking-wider font-bold flex items-center gap-2">
                        Your GST Number (GSTIN) *
                        <span className="normal-case text-[10px] text-red-600 font-normal">
                          Required
                        </span>
                      </label>
                      <div className="mt-2 relative">
                        <input
                          type="text"
                          value={buyerGstNumber}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setBuyerGstNumber(value);
                            if (value) {
                              const error = validateGST(value);
                              setGstError(error);
                            } else {
                              setGstError("");
                            }
                          }}
                          placeholder="29ABCDE1234F1Z5"
                          maxLength={15}
                          className={`w-full border ${gstError ? "border-red-500 bg-red-50" : "border-secondary/20 bg-transparent"} rounded-sm px-4 py-3 focus:outline-none focus:border-accent text-primary uppercase font-mono text-sm transition-colors`}
                        />
                        {buyerGstNumber && !gstError && (
                          <CheckCircle
                            size={16}
                            className="absolute right-3 top-3.5 text-green-600"
                          />
                        )}
                      </div>
                      {gstError && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {gstError}
                        </p>
                      )}
                      <p className="text-[10px] text-text-secondary mt-2 flex items-start gap-1">
                        <span className="text-blue-600">ℹ️</span>
                        <span>
                          Format: 2 digits (State) + 10 digits (PAN) + 1 digit +
                          Z + 1 digit
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {!gstClaimed && (
                  <div className="pt-4 border-t border-secondary/10">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      <strong className="text-primary">
                        Standard Invoice:
                      </strong>{" "}
                      If not claiming GST, your invoice will show the vendor's
                      GST number. GST of {gstPercentage}% will be added to your total
                      amount.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface p-8 rounded-sm shadow-sm border border-secondary/10 sticky top-32">
              <h2 className="font-heading text-xl font-bold text-primary mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-6 custom-scrollbar">
                {cartItems.map((item) => (
                  <div
                    key={item._id || item.id}
                    className="flex gap-4 items-start"
                  >
                    <div className="w-16 h-16 bg-background rounded-sm border border-secondary/10 flex-shrink-0 p-1">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-primary line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-secondary/10 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount.amount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount ({discount.code})</span>
                    <span>-{formatPrice(discount.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Truck size={14} /> Shipping
                  </span>
                  <span>
                    {shippingLoading ? (
                      <span className="flex items-center gap-1 text-xs text-secondary">
                        <Loader2 size={12} className="animate-spin" /> Calculating...
                      </span>
                    ) : (discountedSubtotal >= (shippingEstimate?.freeShippingThreshold || shippingConfig.freeShippingThreshold || 999) || shippingEstimate?.isFreeShipping) ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : shippingPrice > 0 ? (
                      formatPrice(shippingPrice)
                    ) : shippingError ? (
                      formatPrice(66)
                    ) : !selectedAddress?.postalCode ? (
                      <span className="text-xs text-text-secondary italic">Calculated with address</span>
                    ) : (
                      <span className="text-xs text-text-secondary italic">Calculated at checkout</span>
                    )}
                  </span>
                </div>
                {/* Vendor shipping breakdown */}
                {shippingEstimate && !shippingEstimate.isFreeShipping && shippingEstimate.vendorBreakdown?.length > 0 && (
                  <div className="ml-2">
                    <button
                      onClick={() => setShowShippingBreakdown(!showShippingBreakdown)}
                      className="text-[10px] text-secondary hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      {showShippingBreakdown ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      {showShippingBreakdown ? 'Hide' : 'View'} breakdown
                    </button>
                    {showShippingBreakdown && (
                      <div className="mt-1 space-y-1 animate-fade-in">
                        {shippingEstimate.vendorBreakdown.map((v, i) => (
                          <div key={i} className="flex justify-between text-[11px] text-text-secondary pl-2 border-l-2 border-secondary/10">
                            <span className="flex items-center gap-1">
                              <Package size={10} />
                              {v.vendorName}
                              <span className="text-[9px] text-secondary">({v.courierName || 'Standard Delivery'}, {v.estimatedDays || '3-5 days'})</span>
                            </span>
                            <span className="font-medium text-primary">
                              {v.isFreeShippingEligible || v.customerShippingCharge === 0
                                ? <span className="text-green-600">FREE</span>
                                : formatPrice(v.customerShippingCharge !== undefined ? v.customerShippingCharge : (v.subtotal || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* COD Surcharge */}
                {shippingEstimate?.codSurcharge > 0 && (
                  <div className="flex justify-between text-text-secondary text-xs">
                    <span className="text-amber-600">COD Handling Fee</span>
                    <span className="text-amber-600">{formatPrice(shippingEstimate.codSurcharge)}</span>
                  </div>
                )}
                {/* Free shipping progress bar */}
                {discountedSubtotal < (shippingEstimate?.freeShippingThreshold || shippingConfig.freeShippingThreshold || 999) && (
                  <div className="bg-green-50 border border-green-200 rounded-sm p-3 -mx-1">
                    <p className="text-[11px] text-green-800 font-semibold flex items-center gap-1 mb-1.5">
                      <Truck size={12} /> Add {formatPrice(Math.max(0, (shippingEstimate?.freeShippingThreshold || shippingConfig.freeShippingThreshold || 999) - discountedSubtotal))} more for FREE shipping!
                    </p>
                    <div className="w-full bg-green-200 rounded-full h-1.5">
                      <div
                        className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((discountedSubtotal / (shippingEstimate?.freeShippingThreshold || shippingConfig.freeShippingThreshold || 999)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {/* Shipping error */}
                {shippingError && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-600">
                    <AlertCircle size={11} /> {shippingError}
                  </div>
                )}
                <div className="flex justify-between text-text-secondary">
                  <span className="flex items-center gap-1">
                    GST / Tax ({gstPercentage}%)
                    {gstClaimed && buyerGstNumber && !gstError && (
                      <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                        CLAIMABLE
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-primary">+{formatPrice(taxPrice)}</span>
                </div>
                {gstClaimed && buyerGstNumber && !gstError && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 -mx-2">
                    <p className="text-[10px] text-green-800 leading-relaxed">
                      <strong>✓ GST Input Credit Eligible:</strong> Your GSTIN
                      will be on the invoice. You can claim{" "}
                      {formatPrice(taxPrice)} as input tax credit.
                    </p>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-primary pt-3 border-t border-secondary/10 mt-3">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-6 bg-primary text-surface py-4 text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg flex items-center justify-center gap-2 rounded-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Processing..."
                  : paymentMethod === "COD"
                    ? "Place Order"
                    : "Pay Now"}
                {!loading && <CheckCircle size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
