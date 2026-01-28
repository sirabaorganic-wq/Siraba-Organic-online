import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Star,
  Info,
  ArrowRight,
  Filter,
  X,
  Heart,
  Store,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";

const Shop = () => {
  const { addToCart } = useCart();
  const { searchProducts } = useProducts();
  const { toggleWishlist, user } = useAuth();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // URL Params
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // Filter State
  const [filters, setFilters] = useState({
    keyword: queryParams.get("keyword") || "",
    category: queryParams.get("category") || "",
    minPrice: queryParams.get("minPrice") || "",
    maxPrice: queryParams.get("maxPrice") || "",
    sort: queryParams.get("sort") || "",
  });

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      const params = {};
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sort) params.sort = filters.sort;

      const data = await searchProducts(params);
      setProducts(data);
      setLoading(false);
    };

    fetchFilteredProducts();
  }, [filters, searchProducts]);

  // Update filters when URL changes (e.g. from Navbar search)
  useEffect(() => {
    const currentParams = new URLSearchParams(location.search);
    setFilters((prev) => ({
      ...prev,
      keyword: currentParams.get("keyword") || "",
      category: currentParams.get("category") || "",
      minPrice: currentParams.get("minPrice") || "",
      maxPrice: currentParams.get("maxPrice") || "",
      sort: currentParams.get("sort") || "",
    }));
  }, [location.search]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const updateUrl = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    navigate({ search: params.toString() });
  };

  const clearFilters = () => {
    const emptyFilters = {
      keyword: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "",
    };
    setFilters(emptyFilters);
    updateUrl(emptyFilters);
  };

  return (
    <div className="w-full pt-20 bg-background min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-white to-green-50 border-b border-emerald-100 overflow-hidden">
        {/* Decorative elements */}
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles size={16} />
              <span>Premium Organic Collection</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-primary">
              Discover Our Products
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              100% Pure, Lab-tested organic products delivered to your doorstep
            </p>
            {!loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-text-secondary pt-2">
                <Search size={16} className="text-emerald-600" />
                <span>
                  Showing <span className="font-bold text-emerald-600">{products.length}</span> premium products
                  {filters.keyword && ` for "${filters.keyword}"`}
                  {filters.category && ` in ${filters.category}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden px-4 py-4 flex justify-between items-center border-b border-secondary/10 bg-white sticky top-20 z-20 shadow-sm">
        <span className="text-primary font-bold flex items-center gap-2">
          <ShoppingBag size={18} className="text-emerald-600" />
          {products.length} Products
        </span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      <div
        id="product-grid"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16"
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Filters */}
          <aside
            className={`md:w-72 flex-shrink-0 ${showFilters ? "block" : "hidden md:block"
              } space-y-6`}
          >
            {/* Glassmorphic container */}
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-600 to-green-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                    <Filter size={20} />
                    Filters
                  </h2>
                  <button onClick={() => setShowFilters(false)} className="md:hidden text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Search */}
                <div>
                  <h3 className="font-body text-sm font-bold uppercase tracking-widest text-emerald-900 mb-3 flex items-center gap-2">
                    <Search size={14} />
                    Search
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      name="keyword"
                      value={filters.keyword}
                      onChange={handleFilterChange}
                      placeholder="Search products..."
                      className="w-full bg-gray-50 border-2 border-gray-200 p-3 pl-10 text-sm rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="font-body text-sm font-bold uppercase tracking-widest text-emerald-900 mb-3">
                    Category
                  </h3>
                  <div className="space-y-2">
                    {["Spices", "Dry Fruits", "Honey", "Oils"].map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="category"
                          value={cat}
                          checked={filters.category === cat}
                          onChange={handleFilterChange}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        <span className="text-text-secondary group-hover:text-emerald-700 transition-colors text-sm font-medium">
                          {cat}
                        </span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                      <input
                        type="radio"
                        name="category"
                        value=""
                        checked={filters.category === ""}
                        onChange={handleFilterChange}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="text-text-secondary group-hover:text-emerald-700 transition-colors text-sm font-medium">
                        All Categories
                      </span>
                    </label>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-body text-sm font-bold uppercase tracking-widest text-emerald-900 mb-3">
                    Price Range
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="minPrice"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      className="w-full bg-gray-50 border-2 border-gray-200 p-3 text-sm rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      className="w-full bg-gray-50 border-2 border-gray-200 p-3 text-sm rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="font-body text-sm font-bold uppercase tracking-widest text-emerald-900 mb-3">
                    Sort By
                  </h3>
                  <select
                    name="sort"
                    value={filters.sort}
                    onChange={handleFilterChange}
                    className="w-full bg-gray-50 border-2 border-gray-200 p-3 text-sm rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all cursor-pointer"
                  >
                    <option value="">Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest Arrivals</option>
                  </select>
                </div>

                <button
                  onClick={clearFilters}
                  className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 px-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl h-[480px] animate-pulse shadow-lg"
                  ></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product._id || product.id}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col overflow-hidden transform hover:-translate-y-2"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-emerald-50 p-8 flex items-center justify-center">
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <span className="absolute top-4 left-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider z-10 shadow-lg">
                        {product.tag}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(product._id || product.id);
                        }}
                        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg text-red-500 hover:bg-red-50 hover:scale-110 transition-all duration-300"
                      >
                        <Heart
                          size={18}
                          className={
                            user?.wishlist?.some(
                              (item) =>
                                (typeof item === "object" ? item._id : item) ===
                                (product._id || product.id)
                            )
                              ? "fill-current"
                              : ""
                          }
                        />
                      </button>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700 ease-out relative z-[1]"
                      />
                      {/* Quick Action Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                        <Link
                          to={`/product/${product.slug}`}
                          className="block w-full text-center bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 uppercase tracking-wider text-xs font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-xl rounded-lg"
                        >
                          Quick View
                        </Link>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-6 flex flex-col flex-grow bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex text-amber-500 text-sm">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={
                                i < Math.floor(product.rating)
                                  ? "currentColor"
                                  : "none"
                              }
                              className={
                                i < Math.floor(product.rating)
                                  ? "text-amber-500"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                          <span className="ml-2 text-text-secondary text-xs font-medium">
                            ({product.numReviews || product.reviews?.length || 0})
                          </span>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-semibold">
                          In Stock
                        </span>
                      </div>

                      <Link to={`/product/${product.slug}`}>
                        <h2 className="font-heading text-xl text-primary font-bold mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">
                          {product.name}
                        </h2>
                      </Link>

                      {/* Vendor Badge */}
                      {product.isVendorProduct && product.vendor && (
                        <div className="flex items-center gap-2 mb-3 text-sm">
                          <Link
                            to={`/shop/vendor/${typeof product.vendor === "object" &&
                              product.vendor.shopSettings?.shopSlug
                              ? product.vendor.shopSettings.shopSlug
                              : product.vendor._id || product.vendor
                              }`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
                          >
                            <Store size={12} />
                            <span className="text-xs font-semibold">
                              {typeof product.vendor === "object"
                                ? product.vendor.businessName
                                : "Verified Seller"}
                            </span>
                          </Link>
                        </div>
                      )}

                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4 block">
                          {formatPrice(product.price)}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:from-emerald-700 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Add to Cart <ShoppingBag size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
                  No Products Found
                </h3>
                <p className="text-text-secondary mb-8 text-lg">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View All Products
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-green-50 border-t border-emerald-100 py-20 mt-16 overflow-hidden">
        {/* Decorative background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
              Why Choose Us
            </h2>
            <p className="text-text-secondary text-lg">
              Premium quality backed by trust and transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-100 transform hover:-translate-y-2">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Shield size={32} className="text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary mb-3">
                Lab Tested
              </h3>
              <p className="text-text-secondary font-light leading-relaxed">
                Every batch rigorously tested by Eurofins Germany for purity and quality
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-100 transform hover:-translate-y-2">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                }}
              >
                <ShoppingBag size={32} className="text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary mb-3">
                Secure Checkout
              </h3>
              <p className="text-text-secondary font-light leading-relaxed">
                256-bit SSL encrypted payments with multiple secure payment options
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-100 transform hover:-translate-y-2">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                }}
              >
                <ArrowRight size={32} className="text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary mb-3">
                Fast Delivery
              </h3>
              <p className="text-text-secondary font-light leading-relaxed">
                Express shipping worldwide with real-time tracking for your orders
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;
