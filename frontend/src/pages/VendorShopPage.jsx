import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ShoppingBag,
  Star,
  Store,
  MapPin,
  Clock,
  Shield,
  Truck,
  RefreshCcw,
  Heart,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  ArrowLeft,
  Package,
  Award,
  Users,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import client from "../api/client";

const VendorShopPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, user } = useAuth();
  const { formatPrice } = useCurrency();

  const [shopData, setShopData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        const { data } = await client.get(`/vendors/shop/${slug}`);
        setShopData(data.shop);
        setProducts(data.products || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Shop not found");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchShopData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-primary mb-2">
            Shop Not Found
          </h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const { shop } = { shop: shopData };

  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Not Published Warning */}
      {shop && !shop.isPublished && (
        <div className="bg-amber-500 text-white px-4 py-3 text-center">
          <p className="font-medium">
            ⚠️ This shop is not yet published publicly. Only visible via direct
            link.
          </p>
        </div>
      )}

      {/* Shop Banner */}
      <div className="relative h-64 md:h-80 bg-linear-to-r from-primary to-primary/80">
        {shop.banner && (
          <img
            src={shop.banner}
            alt={shop.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>

        {/* Shop Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-6">
            {/* Shop Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white shadow-xl overflow-hidden flex-shrink-0 border-4 border-white">
              {shop.logo ? (
                <img
                  src={shop.logo}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Store className="w-12 h-12 text-primary" />
                </div>
              )}
            </div>

            {/* Shop Details */}
            <div className="flex-1 text-white pb-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl font-heading font-bold">
                  {shop.name}
                </h1>
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verified Seller
                </span>
              </div>
              {shop.tagline && (
                <p className="text-white/90 text-lg mb-3">{shop.tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                {shop.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{shop.rating.toFixed(1)}</span>
                    <span>({shop.totalReviews} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{products.length} Products</span>
                </div>
                {shop.totalOrders > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{shop.totalOrders}+ Orders</span>
                  </div>
                )}
                {shop.processingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{shop.processingTime}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b mb-8">
          {[
            { id: "products", label: "Products", count: products.length },
            { id: "about", label: "About" },
            { id: "policies", label: "Policies" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            {products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-heading font-bold text-primary mb-2">
                  No Products Yet
                </h3>
                <p className="text-text-secondary">
                  This shop hasn't added any products yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    formatPrice={formatPrice}
                    addToCart={addToCart}
                    toggleWishlist={toggleWishlist}
                    user={user}
                    shopName={shop.name}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-heading font-bold text-primary mb-4">
                  About {shop.name}
                </h3>
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {shop.description || "No description available."}
                </p>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">
                    Verified Seller
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-800">
                    Quality Assured
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Truck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-800">
                    Fast Shipping
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <RefreshCcw className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-800">
                    Easy Returns
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Social Links */}
              {shop.socialLinks &&
                Object.values(shop.socialLinks).some((v) => v) && (
                  <div className="bg-white rounded-xl border p-6">
                    <h4 className="font-heading font-bold text-primary mb-4">
                      Connect With Us
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {shop.socialLinks.website && (
                        <a
                          href={shop.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Globe className="w-5 h-5 text-gray-600" />
                        </a>
                      )}
                      {shop.socialLinks.facebook && (
                        <a
                          href={`https://facebook.com/${shop.socialLinks.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Facebook className="w-5 h-5 text-blue-600" />
                        </a>
                      )}
                      {shop.socialLinks.instagram && (
                        <a
                          href={`https://instagram.com/${shop.socialLinks.instagram.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-pink-100 rounded-lg hover:bg-pink-200 transition-colors"
                        >
                          <Instagram className="w-5 h-5 text-pink-600" />
                        </a>
                      )}
                      {shop.socialLinks.twitter && (
                        <a
                          href={`https://twitter.com/${shop.socialLinks.twitter.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-sky-100 rounded-lg hover:bg-sky-200 transition-colors"
                        >
                          <Twitter className="w-5 h-5 text-sky-500" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

              {/* Shop Stats */}
              <div className="bg-white rounded-xl border p-6">
                <h4 className="font-heading font-bold text-primary mb-4">
                  Shop Statistics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Products</span>
                    <span className="font-bold">{products.length}</span>
                  </div>
                  {shop.rating > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Rating</span>
                      <span className="font-bold flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {shop.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {shop.totalOrders > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Orders</span>
                      <span className="font-bold">{shop.totalOrders}+</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === "policies" && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Return Policy */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <RefreshCcw className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-primary">
                  Return Policy
                </h3>
              </div>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {shop.returnPolicy || "No return policy specified."}
              </p>
            </div>

            {/* Shipping Policy */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-primary">
                  Shipping Policy
                </h3>
              </div>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {shop.shippingPolicy || "No shipping policy specified."}
              </p>
            </div>

            {/* Processing Time */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-primary">
                  Processing Time
                </h3>
              </div>
              <p className="text-text-secondary">
                Orders are typically processed within{" "}
                <span className="font-bold text-primary">
                  {shop.processingTime || "2-3 business days"}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({
  product,
  formatPrice,
  addToCart,
  toggleWishlist,
  user,
  shopName,
}) => {
  const isInWishlist = user?.wishlist?.includes(product._id);
  const productImage =
    product.images?.[0] || product.image || "/placeholder.png";

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      ...product,
      image: productImage,
    });
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleWishlist(product._id);
    }
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Vendor Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/90 text-primary text-xs font-medium rounded-full">
            <Store className="w-3 h-3" />
            {shopName}
          </span>
        </div>

        {/* Wishlist Button */}
        {user && (
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
              isInWishlist
                ? "bg-red-500 text-white"
                : "bg-white/80 text-gray-600 hover:bg-white"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isInWishlist ? "fill-current" : ""}`}
            />
          </button>
        )}

        {/* Quick Add Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/60 to-transparent">
          <button
            onClick={handleAddToCart}
            className="w-full py-2 bg-white text-primary font-medium rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-primary line-clamp-2 mb-2 group-hover:text-primary/80">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-text-secondary">
              {product.rating.toFixed(1)}
            </span>
            {product.numReviews > 0 && (
              <span className="text-sm text-text-secondary">
                ({product.numReviews})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-text-secondary line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default VendorShopPage;
