import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useSocket } from "../context/SocketContext";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  Leaf,
  ArrowRight,
  Minus,
  Plus,
  Heart,
  Share2,
  Store,
  ChevronRight,
  Star,
  MessageCircle,
} from "lucide-react";
import client from "../api/client";
import ProductReviews from "../components/ProductReviews";

const ProductDetails = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { toggleWishlist, user } = useAuth();
  const { formatPrice } = useCurrency();
  const { socket } = useSocket();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Callback for when reviews are updated
  const handleReviewUpdate = (data) => {
    // Refetch product to get updated reviews
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
        window.scrollTo(0, 0);
      }
    }
  }, [slug, products]);

  // Listen for real-time review updates
  useEffect(() => {
    if (!socket || !product?._id) return;

    const handleNewReview = (data) => {
      if (data.productId === product._id) {
        setProduct(prev => ({
          ...prev,
          reviews: [...(prev.reviews || []), data.review],
          numReviews: (prev.numReviews || 0) + 1,
          rating: data.rating
        }));
      }
    };

    const handleReviewReply = (data) => {
      if (data.productId === product._id) {
        setProduct(prev => ({
          ...prev,
          reviews: prev.reviews.map(r =>
            r._id === data.reviewId
              ? { ...r, vendorReply: data.reply, vendorReplyDate: data.replyDate }
              : r
          )
        }));
      }
    };

    socket.on('new_review', handleNewReview);
    socket.on('review_reply', handleReviewReply);

    return () => {
      socket.off('new_review', handleNewReview);
      socket.off('review_reply', handleReviewReply);
    };
  }, [socket, product?._id]);

  const [activeImage, setActiveImage] = useState(null);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        Loading...
      </div>
    );
  }

  // Recommendation Logic: Same category, excluding current
  const recommendations = products
    .filter(
      (p) =>
        p.category === product.category &&
        (p._id || p.id) !== (product._id || product.id)
    )
    .slice(0, 4);

  // If not enough same category, fill with others
  if (recommendations.length < 3) {
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

  const productImages = [product.image, product.image2].filter(Boolean);

  return (
    <div className="bg-background min-h-screen pt-24 pb-16 font-body text-text-primary">
      {/* ... breadcrumbs ... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-secondary mb-8">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-primary transition-colors">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-primary font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <div className="bg-surface border border-secondary/10 rounded-sm overflow-hidden aspect-square flex items-center justify-center p-8 relative group">
              <span className="absolute top-4 left-4 bg-accent text-primary text-xs font-bold px-3 py-1 uppercase tracking-widest z-10">
                {product.tag}
              </span>
              <img
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            {/* Thumbnails */}
            {productImages.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square bg-surface border rounded-sm p-2 ${activeImage === img
                      ? "border-primary"
                      : "border-secondary/10 hover:border-primary/50"
                      }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Vendor Badge */}
            {product.isVendorProduct && product.vendor && (
              <Link
                to={`/shop/vendor/${typeof product.vendor === "object" &&
                  product.vendor.shopSettings?.shopSlug
                  ? product.vendor.shopSettings.shopSlug
                  : product.vendor._id || product.vendor
                  }`}
                className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Store size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    Sold by{" "}
                    {typeof product.vendor === "object"
                      ? product.vendor.businessName
                      : "Verified Vendor"}
                  </p>
                  <p className="text-xs text-blue-600">
                    Verified Seller on Siraba Marketplace
                  </p>
                </div>
                <ChevronRight size={20} className="text-blue-400" />
              </Link>
            )}

            <div className="flex items-center gap-4 mb-6">
              <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                <ShieldCheck size={16} /> Certified Organic
              </span>
            </div>

            <div className="text-3xl font-bold text-primary mb-6">
              {formatPrice(product.price)}
              <span className="text-base font-normal text-text-secondary ml-2 line-through opacity-70">
                {formatPrice(product.price * 1.2)}
              </span>
            </div>

            <p className="text-text-secondary leading-relaxed mb-8 text-lg font-light">
              {product.description}
            </p>

            {/* Quantity & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 pb-8 border-b border-secondary/10">
              <div className="flex items-center border border-secondary/20 rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-secondary/5 transition-colors"
                >
                  <Minus size={20} className="text-primary" />
                </button>
                <span className="w-12 text-center font-medium text-primary">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-secondary/5 transition-colors"
                >
                  <Plus size={20} className="text-primary" />
                </button>
              </div>
              <button
                className="flex-grow bg-primary text-surface py-3 px-8 text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 rounded-sm cursor-pointer"
                onClick={() => addToCart(product, quantity)}
              >
                Add to Cart <ShoppingBag size={18} />
              </button>
              <button
                onClick={handleWishlistClick}
                className={`p-3 border rounded-sm transition-colors group ${isWishlisted
                  ? "border-accent text-accent"
                  : "border-secondary/20 hover:border-accent hover:text-accent"
                  }`}
                title={
                  isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                }
              >
                <Heart
                  size={20}
                  className={
                    isWishlisted ? "fill-current" : "group-hover:fill-current"
                  }
                />
              </button>
            </div>

            {/* Features Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {product.features?.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-sm text-primary font-medium"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Leaf size={14} />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            {/* Accordion / Tabs */}
            <div className="mt-auto">
              <div className="flex border-b border-secondary/10 mb-6">
                {["description", "ingredients", "shipping", "reviews"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 pr-8 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === tab
                        ? "text-primary"
                        : "text-text-secondary hover:text-primary"
                        }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-accent"></span>
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="min-h-[100px] text-text-secondary text-sm leading-relaxed font-light">
                {activeTab === "description" && (
                  <p>{product.fullDescription}</p>
                )}
                {activeTab === "ingredients" && (
                  <div>
                    <p className="mb-2">
                      <strong>Ingredients:</strong> {product.ingredients}
                    </p>
                    <p>100% Vegan, Gluten-Free, Non-GMO.</p>
                  </div>
                )}
                {activeTab === "shipping" && (
                  <div>
                    <p className="mb-2">
                      <strong>Free Shipping:</strong> On all orders above ₹999.
                    </p>
                    <p>
                      <strong>Delivery:</strong> 3-5 Business Days across India.
                    </p>
                    <p>
                      <strong>Return Policy:</strong> Easy 7-day returns for
                      damaged products.
                    </p>
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
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-heading text-3xl font-bold text-primary">
              You May Also Like
            </h2>
            <Link
              to="/shop"
              className="text-primary border-b border-primary pb-1 text-sm font-medium hover:text-accent hover:border-accent transition-colors"
            >
              View All Collection
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((rec) => (
              <div
                key={rec.id || rec._id}
                className="group flex flex-col relative"
              >
                <Link
                  to={`/product/${rec.slug}`}
                  className="block bg-surface rounded-sm overflow-hidden border border-secondary/10 relative aspect-[4/5] mb-4"
                >
                  <img
                    src={rec.image}
                    alt={rec.name}
                    className="w-full h-full object-contain p-6 transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300"></div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(rec._id || rec.id);
                    }}
                    className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                  >
                    <Heart
                      size={16}
                      className={
                        user?.wishlist?.some(
                          (item) =>
                            (typeof item === "object" ? item._id : item) ===
                            (rec._id || rec.id)
                        )
                          ? "fill-current"
                          : ""
                      }
                    />
                  </button>

                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(rec);
                    }}
                    className="absolute bottom-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow-md hover:bg-accent hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                    title="Add to Cart"
                  >
                    <ShoppingBag size={14} />
                  </button>
                </Link>
                <Link to={`/product/${rec.slug}`}>
                  <h3 className="font-heading text-lg font-bold text-primary group-hover:text-accent transition-colors mb-1">
                    {rec.name}
                  </h3>
                </Link>
                <div className="flex items-baseline justify-between mt-auto">
                  <span className="text-text-secondary text-sm font-light truncate pr-4">
                    {rec.category}
                  </span>
                  <span className="font-medium text-primary">
                    {formatPrice(rec.price)}
                  </span>
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
