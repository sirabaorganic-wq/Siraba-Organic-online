import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useSocket } from "../context/SocketContext";
import useProductCompliance from "../hooks/useProductCompliance";

import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  Leaf,
  Minus,
  Plus,
  Heart,
  Store,
  ChevronRight,
  Star,
  RotateCcw,
  CreditCard,
  Award,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import ProductReviews from "../components/ProductReviews";
import TripleVerifiedBadge from "../components/TripleVerifiedBadge";
import SirabaTrustPassport from "../components/SirabaTrustPassport";
import TrustHighlightsSidebar from "../components/TrustHighlightsSidebar";
import QRVerificationCard from "../components/QRVerificationCard";
import ProductShare from "../components/ProductShare";
import TrustVerificationTab from "../components/TrustVerificationTab";
import TraceabilityTab from "../components/TraceabilityTab";
import DynamicTrustCards from "../components/DynamicTrustCards";

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { toggleWishlist, user } = useAuth();
  const { formatPrice } = useCurrency();
  const { socket } = useSocket();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedOption, setSelectedOption] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  // Central Compliance Data Layer Hook
  const {
    compliance,
    latestBatch,
    productTrustStatus,
    isTripleVerified,
    loading: complianceLoading,
    error: complianceError,
  } = useProductCompliance(product?._id);

  // Callback for when reviews are updated
  const handleReviewUpdate = (data) => {
    const updated = products.find((p) => p.slug === slug);
    if (updated) {
      setProduct(updated);
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      const found = products.find((p) => p.slug === slug);
      if (found) {
        setProduct(found);
        setActiveImage(found.image);
        if (found.options && found.options.length > 0) {
          setSelectedOption(found.options[0]);
        } else {
          setSelectedOption(null);
        }
        window.scrollTo(0, 0);
      }
    }
  }, [slug, products]);

  // Listen for real-time review updates via socket
  useEffect(() => {
    if (!socket || !product?._id) return;

    const handleNewReview = (data) => {
      if (data.productId === product._id) {
        setProduct((prev) => ({
          ...prev,
          reviews: [...(prev.reviews || []), data.review],
          numReviews: (prev.numReviews || 0) + 1,
          rating: data.rating,
        }));
      }
    };

    const handleReviewReply = (data) => {
      if (data.productId === product._id) {
        setProduct((prev) => ({
          ...prev,
          reviews: (prev.reviews || []).map((r) =>
            r._id === data.reviewId
              ? { ...r, vendorReply: data.reply, vendorReplyDate: data.replyDate }
              : r
          ),
        }));
      }
    };

    socket.on("new_review", handleNewReview);
    socket.on("review_reply", handleReviewReply);

    return () => {
      socket.off("new_review", handleNewReview);
      socket.off("review_reply", handleReviewReply);
    };
  }, [socket, product?._id]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 bg-[#FAFAF7]">
        <div className="w-10 h-10 border-4 border-[#0F3D2E] border-t-[#C9A24D] rounded-full animate-spin mb-4" />
        <p className="font-serif text-sm text-[#0F3D2E] tracking-wider uppercase font-bold">
          Loading Product Details...
        </p>
      </div>
    );
  }

  // Recommendations: Same category first, excluding current product
  const recommendations = products
    .filter(
      (p) =>
        p.category === product.category &&
        (p._id || p.id) !== (product._id || product.id)
    )
    .slice(0, 4);

  if (recommendations.length < 4) {
    const others = products
      .filter(
        (p) =>
          p.category !== product.category &&
          (p._id || p.id) !== (product._id || product.id)
      )
      .slice(0, 4 - recommendations.length);
    recommendations.push(...others);
  }

  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === "object" ? item._id : item) === product._id
  );

  const handleWishlistClick = async () => {
    if (!user) {
      alert("Please login to add items to your wishlist.");
      return;
    }
    await toggleWishlist(product._id);
  };

  const productImages = [
    product.image,
    product.image2,
    ...(product.images || []),
  ].filter(Boolean);

  // Price & MRP Calculations (Legitimate MRP, no fake multiplier)
  const price = selectedOption?.price ?? product.price;
  const mrp = selectedOption?.mrp;
  const hasDiscount = mrp && mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : null;

  return (
    <div className="bg-[#FAFAF7] min-h-screen pt-24 pb-20 font-body text-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Back Button & Breadcrumb Navigation Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#0F3D2E] hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs transition-all shadow-2xs group cursor-pointer"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform text-[#0F3D2E]" />
            <span>Back</span>
          </button>

          <nav className="flex items-center text-xs text-slate-500 font-medium space-x-2">
            <Link to="/" className="hover:text-[#0F3D2E] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-[#0F3D2E] transition-colors">
              Shop
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  to={`/shop?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-[#0F3D2E] transition-colors"
                >
                  {product.category}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#0F3D2E] font-semibold truncate max-w-xs">
              {product.name}
            </span>
          </nav>
        </div>

        {/* 3-Column Desktop Layout (Gallery | Product Info | Trust & Vendor Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">

          {/* COLUMN 1: Product Gallery (4 Columns) */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden aspect-square flex items-center justify-center p-6 relative group shadow-sm">
              {product.tag && (
                <span className="absolute top-4 left-4 bg-[#C9A24D] text-[#0F3D2E] text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-full shadow-xs z-10">
                  {product.tag}
                </span>
              )}
              <img
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Gallery Thumbnail Strip */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square bg-white border rounded-xl p-1.5 transition-all cursor-pointer ${activeImage === img
                        ? "border-[#0F3D2E] ring-2 ring-[#0F3D2E]/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 2: Product Core Information & Actions */}
          <div className="lg:col-span-4 xl:col-span-5 flex flex-col space-y-6">

            {/* Title & Subtitle */}
            <div className="space-y-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#0F3D2E] leading-tight">
                {product.name}
              </h1>

              {/* Subtitle / Key Attributes */}
              {product.features && product.features.length > 0 && (
                <p className="text-xs text-slate-500 font-medium">
                  {product.features.slice(0, 3).join(" • ")}
                </p>
              )}

              {/* Customer Star Rating & Reviews */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={
                        i < Math.floor(product.rating || 5)
                          ? "fill-current"
                          : "text-slate-300"
                      }
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-800 ml-1">
                    {product.rating || "4.9"}
                  </span>
                </div>
                <span className="text-xs text-slate-400">•</span>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="text-xs text-emerald-800 font-medium hover:underline cursor-pointer"
                >
                  {product.numReviews || 0} Customer Reviews
                </button>
              </div>
            </div>

            {/* Triple-Verified Badge */}
            <TripleVerifiedBadge
              productTrustStatus={productTrustStatus}
              onTabSelect={(tab) => setActiveTab(tab)}
            />


            {/* Price & Variant Selection */}
            <div className="space-y-4 pt-2 border-t border-slate-200/80">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#0F3D2E]">
                  {formatPrice(price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-slate-400 line-through font-light">
                      {formatPrice(mrp)}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Inclusive of all applicable taxes • Free shipping on orders above ₹499
              </p>

              {/* Weight / Size Variants */}
              {product.options && product.options.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Select Pack Size:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.options.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedOption(opt)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${selectedOption?.label === opt.label
                            ? "border-[#0F3D2E] bg-[#0F3D2E] text-white shadow-xs"
                            : "border-slate-300 bg-white text-slate-700 hover:border-[#0F3D2E]/50"
                          }`}
                      >
                        {opt.label}
                        <span
                          className={`ml-1.5 font-normal text-[11px] ${selectedOption?.label === opt.label
                              ? "text-amber-200"
                              : "text-slate-500"
                            }`}
                        >
                          {formatPrice(opt.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-300 rounded-xl bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-xs text-[#0F3D2E]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product, quantity, selectedOption)}
                  className="flex-1 py-3 px-6 rounded-xl bg-[#0F3D2E] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#164e3c] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>

                <button
                  onClick={handleWishlistClick}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer ${isWishlisted
                      ? "border-rose-300 bg-rose-50 text-rose-600"
                      : "border-slate-300 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-600"
                    }`}
                  title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={18} className={isWishlisted ? "fill-current" : ""} />
                </button>
              </div>

              <button
                onClick={() => {
                  addToCart(product, quantity, selectedOption);
                  navigate("/checkout");
                }}
                className="w-full py-3 px-6 rounded-xl bg-[#C9A24D] text-[#0F3D2E] font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-md cursor-pointer text-center"
              >
                Buy Now — Instant Checkout
              </button>
            </div>

            {/* Benefit Strip */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-3 border-t border-slate-200/80">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/60">
                <Truck className="w-4 h-4 text-[#0F3D2E] shrink-0" />
                <span>Free Express Shipping &gt; ₹499</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Organic Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/60">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Easy Returns & Replacement</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/60">
                <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Secure Payments & COD Available</span>
              </div>
            </div>

          </div>

          {/* COLUMN 3: Right Sidebar — Trust Highlights, QR Card, Vendor & Share */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-5">
            {/* Share Product Header Helper */}
            <div className="flex justify-end">
              <ProductShare product={product} />
            </div>

            {/* Vendor Information Box (if Vendor Product) */}
            {product.isVendorProduct && product.vendor && (
              <Link
                to={`/shop/vendor/${typeof product.vendor === "object" &&
                    product.vendor.shopSettings?.shopSlug
                    ? product.vendor.shopSettings.shopSlug
                    : product.vendor._id || product.vendor
                  }`}
                className="block p-4 rounded-xl bg-blue-50/80 border border-blue-200 hover:bg-blue-100/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                    <Store size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-900 truncate">
                      {typeof product.vendor === "object"
                        ? product.vendor.businessName
                        : "Verified Vendor"}
                    </p>
                    <p className="text-[11px] text-blue-700">
                      SIRABA Marketplace Seller ✓
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )}

            {/* Trust Highlights Sidebar */}
            <TrustHighlightsSidebar compliance={compliance} latestBatch={latestBatch} />

            {/* SIRABA Trust Passport Card */}
            <SirabaTrustPassport
              compliance={compliance}
              latestBatch={latestBatch}
              loading={complianceLoading}
              error={complianceError}
              onTabSelect={(tab) => setActiveTab(tab)}
            />

            {/* QR Code Verification Card */}
            <QRVerificationCard latestBatch={latestBatch} />
          </div>

        </div>

        {/* DYNAMIC TRUST & VENDOR PASSPORT CARDS (CERTIFIED • VERIFIED • TRACEABLE • QUALIFIED) */}
        {/* <div className="pt-4 border-t border-slate-200/80">
          <DynamicTrustCards productId={product._id} />
        </div> */}

        {/* FULL-WIDTH TABS SECTION BELOW PRODUCT MAIN */}
        <div className="pt-8 border-t border-slate-200">
          <div className="flex flex-wrap border-b border-slate-200 gap-2 mb-6">
            {[
              { id: "description", label: "Description" },
              { id: "ingredients", label: "Ingredients & Features" },
              { id: "trust", label: "Trust & Verification Passport" },
              { id: "traceability", label: "Batch Traceability" },
              { id: "shipping", label: "Shipping & Returns" },
              { id: "reviews", label: `Customer Reviews (${product.numReviews || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${activeTab === tab.id
                    ? "border-[#0F3D2E] text-[#0F3D2E] bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 min-h-[250px] shadow-xs">
            {activeTab === "description" && (
              <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
                <h3 className="font-serif font-bold text-[#0F3D2E] text-base">
                  About {product.name}
                </h3>
                <p>{product.fullDescription || product.description}</p>
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1 text-xs uppercase tracking-wider">
                    Pure Ingredients
                  </h4>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-medium">
                    {product.ingredients || "100% Pure Organic Content"}
                  </p>
                </div>
                {product.features && product.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                      Product Characteristics
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {product.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "trust" && (
              <div className="space-y-6">
                <DynamicTrustCards productId={product._id} />
                <TrustVerificationTab compliance={compliance} />
              </div>
            )}

            {activeTab === "traceability" && (
              <TraceabilityTab latestBatch={latestBatch} />
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#0F3D2E]" />
                    Delivery Timelines & Shipping Rates
                  </h4>
                  <p>• <strong>Free Shipping:</strong> On vendor orders above ₹499 across India.</p>
                  <p>• <strong>Standard Delivery:</strong> 3–5 Business Days.</p>
                  <p>• <strong>Express Delivery:</strong> 1–2 Days available for select metro locations.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    Returns & Replacement Guarantee
                  </h4>
                  <p>• Easy 7-day replacement for damaged or compromised seals.</p>
                  <p>• Sealed food items guaranteed fresh on arrival.</p>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <ProductReviews
                product={product}
                onReviewUpdate={handleReviewUpdate}
              />
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="pt-12">
          <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
            <h2 className="font-serif text-2xl font-bold text-[#0F3D2E]">
              You May Also Like
            </h2>
            <Link
              to="/shop"
              className="text-xs font-semibold text-[#0F3D2E] hover:text-[#C9A24D] transition-colors"
            >
              View Full Collection →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <div
                key={rec.id || rec._id}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 p-4 hover:shadow-lg transition-all duration-300 relative"
              >
                <Link
                  to={`/product/${rec.slug}`}
                  className="block aspect-square overflow-hidden mb-3 relative"
                >
                  <img
                    src={rec.image}
                    alt={rec.name}
                    className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                  />
                  {rec.tag && (
                    <span className="absolute top-2 left-2 bg-[#C9A24D] text-[#0F3D2E] text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-full">
                      {rec.tag}
                    </span>
                  )}
                </Link>

                <div className="flex flex-col flex-1 space-y-1">
                  <span className="text-[11px] text-slate-400 font-mono uppercase">
                    {rec.category}
                  </span>
                  <Link to={`/product/${rec.slug}`}>
                    <h3 className="font-serif text-sm font-bold text-slate-900 group-hover:text-[#0F3D2E] transition-colors line-clamp-1">
                      {rec.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between pt-2 mt-auto">
                    <span className="text-sm font-bold text-[#0F3D2E]">
                      {formatPrice(rec.price)}
                    </span>
                    <button
                      onClick={() => addToCart(rec)}
                      className="p-2 rounded-xl bg-[#0F3D2E] text-white hover:bg-[#C9A24D] hover:text-[#0F3D2E] transition-colors cursor-pointer"
                      title="Add to Cart"
                    >
                      <ShoppingBag size={14} />
                    </button>
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

export default ProductDetails;
