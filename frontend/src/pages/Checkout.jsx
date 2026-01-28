import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { useCurrency } from "../context/CurrencyContext";
import api from "../api/axios";
import {
  MapPin,
  Phone,
  CreditCard,
  CheckCircle,
  Plus,
  Truck,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";

const Checkout = () => {
  const { user, updateProfile } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  // Get discount from navigation state
  const discount = location.state?.discount || { amount: 0, code: "" };

  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD"); // COD or Online

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
  });

  // GST State
  const [gstClaimed, setGstClaimed] = useState(false);
  const [buyerGstNumber, setBuyerGstNumber] = useState("");

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

  // Set default selected address if available
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const defaultIndex = user.addresses.findIndex((addr) => addr.isDefault);
      setSelectedAddressIndex(defaultIndex >= 0 ? defaultIndex : 0);
    } else {
      setIsAddingNewAddress(true); // Force add address if none exist
    }
  }, [user]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create updated addresses array
      const updatedAddresses = [
        ...(user.addresses || []),
        { ...newAddress, isDefault: user.addresses?.length === 0 },
      ];

      // If phone is not set on user profile, update it too
      const profileUpdate = {
        addresses: updatedAddresses,
        phone: user.phone || newAddress.phone,
      };

      const res = await updateProfile(profileUpdate);
      if (res.success) {
        setIsAddingNewAddress(false);
        setSelectedAddressIndex(updatedAddresses.length - 1); // Select the new address
        // Reset form
        const savedPhone = newAddress.phone; // Keep phone
        setNewAddress({
          address: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          phone: savedPhone,
        });
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (user?.addresses?.length === 0 && !isAddingNewAddress) {
      alert("Please add a shipping address");
      setIsAddingNewAddress(true);
      return;
    }

    if (isAddingNewAddress) {
      alert("Please save your address first");
      return;
    }

    const selectedAddress = user.addresses[selectedAddressIndex];
    if (!selectedAddress) {
      alert("Please select a valid address");
      return;
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
    const taxPrice = discountedSubtotal * 0.18; // 18% Tax
    const shippingPrice = 499;
    const totalPrice = discountedSubtotal + taxPrice + shippingPrice;

    // Base Order Data
    const orderData = {
      orderItems,
      shippingAddress: selectedAddress,
      paymentMethod: paymentMethod === 'Online' ? 'Online' : 'COD',
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

        // 1. Create Order in DB first (or you can create Razorpay order first, but creating DB order is safer to track)
        // Here we will create DB order first with status 'Pending' and isPaid 'false'
        const newOrder = await createOrder(orderData);

        // 2. Create Razorpay Order from Backend
        const { data: razorpayOrder } = await api.post(
          "/payment/create-order",
          {
            amount: totalPrice,
            currency: "INR",
            receipt: newOrder._id
          }
        );

        // 3. Open Razorpay Options
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_1234567890", // Fallback to test key if env not set
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Siraba Organic",
          description: "Order Payment",
          image: "/logo.png", // Add your logo path
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              // 4. Verify Payment on Backend
              const verifyRes = await api.post(
                "/payment/verify",
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: newOrder._id
                }
              );

              if (verifyRes.status === 200) {
                setOrderSuccess(true);
                clearCart();
                navigate("/order-success", { state: { order: newOrder } });
              }
            } catch (err) {
              console.error("Payment Verification Failed", err);
              alert("Payment verification failed. Please contact support if money was deducted.");
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
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on("payment.failed", function (response) {
          alert(`Payment Failed: ${response.error.description}`);
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
  const taxPrice = discountedSubtotal * 0.18;
  const shippingPrice = 499;
  const totalPrice = discountedSubtotal + taxPrice + shippingPrice;

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
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
              <h2 className="font-heading text-xl font-bold text-primary mb-6 flex items-center">
                <MapPin className="mr-2" size={20} /> Shipping Address
              </h2>

              {!isAddingNewAddress &&
                user.addresses &&
                user.addresses.length > 0 ? (
                <div className="space-y-4">
                  {user.addresses.map((addr, index) => (
                    <div
                      key={index}
                      className={`relative border p-4 rounded-sm cursor-pointer transition-all ${selectedAddressIndex === index
                        ? "border-primary bg-primary/5"
                        : "border-secondary/20 hover:border-secondary/40"
                        }`}
                      onClick={() => setSelectedAddressIndex(index)}
                    >
                      <div className="flex items-start">
                        <div className="mt-1 mr-3">
                          <div
                            className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${selectedAddressIndex === index
                              ? "bg-primary"
                              : "bg-transparent"
                              }`}
                          >
                            {selectedAddressIndex === index && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <p className="font-bold text-primary text-sm">
                            {user.name}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {addr.address}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {addr.city}, {addr.state} {addr.postalCode}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {addr.country}
                          </p>
                          <p className="text-sm text-text-secondary mt-1 flex items-center">
                            <Phone size={12} className="mr-1" />{" "}
                            {user.phone || addr.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setIsAddingNewAddress(true)}
                    className="mt-4 flex items-center text-sm font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider"
                  >
                    <Plus size={16} className="mr-1" /> Add New Address
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSaveAddress}
                  className="space-y-4 animate-fade-in"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                        Street Address
                      </label>
                      <input
                        required
                        type="text"
                        name="address"
                        value={newAddress.address}
                        onChange={handleAddressChange}
                        className="w-full bg-background border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                        placeholder="123 Organic Lane"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                        City
                      </label>
                      <input
                        required
                        type="text"
                        name="city"
                        value={newAddress.city}
                        onChange={handleAddressChange}
                        className="w-full bg-background border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                        State / Province
                      </label>
                      <input
                        required
                        type="text"
                        name="state"
                        value={newAddress.state}
                        onChange={handleAddressChange}
                        className="w-full bg-background border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                        Postal Code
                      </label>
                      <input
                        required
                        type="text"
                        name="postalCode"
                        value={newAddress.postalCode}
                        onChange={handleAddressChange}
                        className="w-full bg-background border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">
                        Phone Number
                      </label>
                      <input
                        required
                        type="tel"
                        name="phone"
                        value={newAddress.phone}
                        onChange={handleAddressChange}
                        className="w-full bg-background border border-secondary/20 rounded-sm p-3 text-sm focus:outline-none focus:border-primary"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 pt-4">
                    {user?.addresses?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddress(false)}
                        className="text-text-secondary text-sm hover:text-primary transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary text-white px-6 py-2 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Address"}
                    </button>
                  </div>
                </form>
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
                  className={`p-4 border rounded-sm flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === "Online"
                    ? "border-primary bg-primary/5"
                    : "border-secondary/20 hover:border-secondary/40"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${paymentMethod === "Online" ? "bg-primary" : "bg-transparent"
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
                  className={`p-4 border rounded-sm flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === "COD"
                    ? "border-primary bg-primary/5"
                    : "border-secondary/20 hover:border-secondary/40"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${paymentMethod === "COD" ? "bg-primary" : "bg-transparent"
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
              <h2 className="font-heading text-xl font-bold text-primary mb-6 flex items-center">
                <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center mr-2 text-xs font-bold text-primary">
                  %
                </div>{" "}
                Tax Information
              </h2>

              <div className="bg-background p-4 rounded-sm border border-secondary/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm text-primary">
                      Claim GST Input Credit
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Enable to get GST invoice with your GSTIN.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={gstClaimed}
                      onChange={(e) => setGstClaimed(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                {gstClaimed && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-xs uppercase text-text-secondary tracking-wider font-bold">
                      Your GST Number
                    </label>
                    <input
                      type="text"
                      value={buyerGstNumber}
                      onChange={(e) =>
                        setBuyerGstNumber(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      className="w-full border-b border-secondary/20 bg-transparent py-2 focus:outline-none focus:border-accent text-primary uppercase font-mono"
                    />
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
                  <span>Shipping</span>
                  <span>
                    {shippingPrice === 0 ? "Free" : formatPrice(shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Tax (18% GST)</span>
                  <span>{formatPrice(taxPrice)}</span>
                </div>
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
                {loading ? "Processing..." : paymentMethod === "COD" ? "Place Order" : "Pay Now"}
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
