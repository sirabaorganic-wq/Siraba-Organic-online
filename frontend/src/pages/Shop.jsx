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
import BgImage1 from "../assets/bgimage1.png";

const Shop = () => {
  const { addToCart } = useCart();
  const { searchProducts } = useProducts();
  const { toggleWishlist, user } = useAuth();
  const { formatPrice, currency } = useCurrency();
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

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[97vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BgImage1}
            alt="Certification"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/35 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/40" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="text-center space-y-7 max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 border border-accent/30 text-accent px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-black/20">
              <Sparkles size={14} />
              Triple-Verified Organic Marketplace
            </span>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-surface leading-tight">
              Certified Organic Ingredients{" "}
              <span className="italic text-accent">Backed by Global Standards.</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-3xl mx-auto font-light leading-relaxed">
              SIRABA ORGANIC curates premium organic ingredients from vendors who meet internationally recognized certification and scientific documentation requirements.
            </p>
            {/* Trust Statement */}
            <div className="inline-block bg-black/30 backdrop-blur border border-white/20 rounded-xl px-6 py-4 text-left">
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-3">
                Every approved product on our platform must satisfy:
              </p>
              <ul className="space-y-1.5">
                {["NPOP Certification", "USDA Organic OR EU Organic Certification", "NABL-Accredited Lab Documentation"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-surface text-sm font-light">
                    <span className="text-accent font-bold">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-2">
              <a
                href="#product-grid"
                className="bg-accent text-primary font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto text-center"
              >
                Explore Certified Products
              </a>
              <Link
                to="/certifications"
                className="bg-white/10 backdrop-blur text-surface border border-white/20 font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface hover:text-primary transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto text-center"
              >
                View Certification Standards
              </Link>
            </div>
            {!loading && (
              <p className="text-white/50 text-xs pt-2">
                Showing <span className="font-bold text-accent">{products.length}</span> certified products
                {filters.keyword && ` for "${filters.keyword}"`}
                {filters.category && ` in ${filters.category}`}
                {" "}· Prices shown in {currency}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── ELITE MARKETPLACE HIGHLIGHT ── */}
      <section className="relative overflow-hidden py-6 md:py-8" style={{ background: 'linear-gradient(135deg, #1a3c2a 0%, #0d2818 40%, #1a3c2a 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40%, rgba(212,175,55,0.3) 50%, transparent 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-shop 3s linear infinite',
        }} />
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="flex items-center gap-2 text-accent text-xs md:text-sm font-bold uppercase tracking-[0.25em] bg-accent/10 border border-accent/30 px-4 py-1.5 rounded-full">
              <Sparkles size={14} className="animate-pulse" />
              Elite Organic Platform
            </span>
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl text-surface font-bold tracking-wide leading-snug">
              An{" "}
              <span className="text-accent" style={{ textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>
                Elite Organic Marketplace
              </span>{" "}
              for Globally Certified Products.
            </h2>
          </div>
        </div>
        <style>{`@keyframes shimmer-shop { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </section>

      {/* ── SECTION 2 — PRODUCT PHILOSOPHY ── */}
      <section className="py-20 md:py-24 bg-accent/4 border-b border-secondary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
            Our Product Philosophy
          </span>
          <h2 className="font-heading text-4xl md:text-5xl text-primary leading-tight">
            Quality Before Quantity.
          </h2>
          <div className="space-y-5 text-text-secondary text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto text-left">
            <p>
              SIRABA ORGANIC is intentionally building a focused product ecosystem centered around authenticity, certification, compliance, and long-term consumer trust.
            </p>
            <p>
              Unlike mass marketplaces that prioritize unlimited listings, our platform follows a selective product qualification process designed to maintain premium standards.
            </p>
            <p className="font-semibold text-primary">Every approved product must align with:</p>
            <ul className="space-y-2 pl-2">
              {[
                "Internationally recognized organic certifications",
                "Documented sourcing standards",
                "Compliance-focused packaging systems",
                "Scientific quality documentation",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-text-secondary text-sm">
                  <span className="text-accent font-bold">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — FLAGSHIP INGREDIENTS ── */}
      <section className="py-20 md:py-24 bg-surface border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              <Sparkles size={14} /> Launching Soon
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              Our Flagship Organic Ingredients.
            </h2>
            <p className="text-text-secondary text-lg max-w-3xl mx-auto font-light">
              SIRABA ORGANIC is strategically launching with two globally recognized ingredients that require exceptional sourcing discipline, authenticity verification, and quality compliance.
            </p>
            <p className="text-text-secondary text-base max-w-2xl mx-auto font-light">
              These categories represent the foundation of our premium trust-first marketplace approach.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
            {/* Kashmiri Saffron */}
            <div className="bg-background border border-secondary/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-accent/5 border-b border-secondary/10 p-6 flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 bg-accent/10 rounded-xl flex items-center justify-center text-2xl">🌸</div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-2">
                    <Info size={11} /> Launching Soon
                  </span>
                  <h3 className="font-heading text-2xl text-primary font-bold">Kashmiri Saffron</h3>
                  <p className="text-text-secondary text-sm mt-1 font-light">Globally valued for its aroma, color, rarity, and culinary significance.</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-text-secondary text-sm leading-relaxed font-light">
                  Our saffron category is being developed around internationally compliant sourcing systems, certification-backed supply chains, and premium-grade quality positioning.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed font-light">
                  Saffron remains one of the world's most valuable and most adulterated ingredients. SIRABA ORGANIC aims to build a platform where authenticity, traceability, and compliance are prioritized over volume.
                </p>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Key Focus Areas</p>
                    <ul className="space-y-1">
                      {["Premium-grade saffron stigmas", "Globally compliant sourcing", "Certification-backed procurement", "Traceable documentation systems", "Export-oriented handling standards"].map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                          <Sparkles size={11} className="text-accent flex-shrink-0 mt-0.5" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Applications</p>
                    <ul className="space-y-1">
                      {["Gourmet culinary use", "Wellness formulations", "Nutraceutical applications", "Luxury food products", "Premium hospitality usage"].map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                          <span className="text-accent font-bold">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Asafoetida */}
            <div className="bg-background border border-secondary/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-accent/5 border-b border-secondary/10 p-6 flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 bg-accent/10 rounded-xl flex items-center justify-center text-2xl">🌿</div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-2">
                    <Info size={11} /> Launching Soon
                  </span>
                  <h3 className="font-heading text-2xl text-primary font-bold">Premium Asafoetida – Hing</h3>
                  <p className="text-text-secondary text-sm mt-1 font-light">A globally recognized culinary ingredient built around purity, processing discipline, and compliance-backed sourcing.</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-text-secondary text-sm leading-relaxed font-light">
                  SIRABA ORGANIC is developing a premium asafoetida category focused on internationally aligned standards, scientific documentation, and certification-backed sourcing practices.
                </p>
                <p className="text-text-secondary text-sm leading-relaxed font-light">
                  The objective is to deliver a more disciplined and trustworthy category experience within one of the world's most commonly adulterated spice segments.
                </p>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Key Focus Areas</p>
                    <ul className="space-y-1">
                      {["Export-grade processing standards", "Certification-led sourcing", "Food-grade compliance systems", "Documentation-backed quality standards", "Traceable packaging and handling"].map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                          <Sparkles size={11} className="text-accent flex-shrink-0 mt-0.5" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Applications</p>
                    <ul className="space-y-1">
                      {["Culinary preparation", "Ayurvedic traditions", "Digestive wellness products", "Functional foods", "Premium spice applications"].map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                          <span className="text-accent font-bold">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — CERTIFIED VENDOR PRODUCTS ── */}
      <section className="py-20 md:py-24 bg-background border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              Vendor Products
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              Approved Certified Vendor Products.
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-5 text-text-secondary text-base leading-relaxed font-light">
              <p>
                Alongside our flagship categories, SIRABA ORGANIC welcomes carefully qualified vendors whose products meet our marketplace eligibility standards.
              </p>
              <p>
                This allows consumers to access a curated ecosystem of internationally certified organic products across selected premium categories.
              </p>
              <div className="bg-primary/5 border border-secondary/10 rounded-xl p-5 space-y-3">
                <p className="font-semibold text-primary text-sm">Important Marketplace Positioning</p>
                <p className="text-sm">SIRABA ORGANIC is not an open product listing platform.</p>
                <p className="text-sm">Every vendor and product category undergoes a selective qualification review before marketplace approval.</p>
              </div>
            </div>
            <div className="bg-surface border border-secondary/10 rounded-2xl p-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Shield size={18} className="text-surface" />
                </div>
                <h3 className="font-heading text-xl text-primary font-bold">Vendor Eligibility Standards</h3>
              </div>
              <p className="text-text-secondary text-sm font-light">Approved vendors must provide:</p>
              <ul className="space-y-2">
                {[
                  "Valid NPOP certification",
                  "USDA Organic OR EU Organic certification",
                  "NABL-accredited lab documentation",
                  "Traceable sourcing records",
                  "Food-grade packaging compliance",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-primary">
                    <Shield size={13} className="text-accent flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/vendor/intro"
                className="inline-flex items-center gap-2 bg-accent text-primary font-bold text-xs tracking-widest uppercase px-5 py-3 hover:bg-primary hover:text-surface transition-all duration-300 rounded-lg mt-2"
              >
                Apply as a Vendor <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — FUTURE CATEGORIES ── */}
      <section className="py-20 md:py-24 bg-surface border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              Platform Roadmap
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              Future Premium Organic Categories.
            </h2>
            <p className="text-text-secondary text-lg max-w-3xl mx-auto font-light">
              As the SIRABA ecosystem grows, the platform intends to expand into carefully selected premium organic categories aligned with international standards and compliance-focused sourcing systems.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Potential Expansion Categories</p>
              <div className="flex flex-wrap gap-3">
                {["Premium Spices", "Herbs & Botanicals", "Honey", "Tea & Coffee", "Cold-Pressed Oils", "Dry Fruits", "Wellness Ingredients", "Nutraceutical Ingredients", "Functional Organic Foods"].map((cat, i) => (
                  <span key={i} className="bg-background border border-secondary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full hover:border-accent/40 transition-colors">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-background border border-secondary/10 rounded-2xl p-7 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Expansion Philosophy</p>
              <p className="text-text-secondary text-sm font-light">Our focus remains on:</p>
              <ul className="space-y-2">
                {["Authenticity", "Certification", "Traceability", "Scientific documentation", "Premium consumer trust"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-primary">
                    <Sparkles size={13} className="text-accent flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — WHY OUR STANDARDS ARE DIFFERENT ── */}
      <section className="py-20 md:py-24 bg-background border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              Our Standards
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              Why SIRABA Product Standards Are Different.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Triple-Verification Framework", desc: "Products must satisfy certification, international validation, and laboratory documentation requirements." },
              { num: "02", title: "Selective Marketplace Entry", desc: "Not every organic product qualifies for SIRABA ORGANIC." },
              { num: "03", title: "Compliance-First Positioning", desc: "We prioritize documented credibility over mass onboarding." },
              { num: "04", title: "Premium Ingredient Focus", desc: "Focus on categories where authenticity and sourcing discipline matter most." },
              { num: "05", title: "Internationally Aligned Standards", desc: "Built around globally recognized organic compliance systems." },
              { num: "06", title: "Long-Term Trust Philosophy", desc: "We believe premium organic credibility must be earned through systems and accountability." },
            ].map((item, i) => (
              <div key={i} className="bg-surface border border-secondary/10 rounded-2xl p-7 space-y-3 hover:shadow-md transition-shadow duration-300">
                <span className="font-heading text-4xl text-accent/50 font-bold">{item.num}</span>
                <h3 className="font-heading text-lg text-primary font-bold">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                  <button
                    onClick={() => setShowFilters(false)}
                    className="md:hidden text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
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
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
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

                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {product.tag && (
                          <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
                            {product.tag}
                          </span>
                        )}
                        <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-red-600 text-center">
                          PROTOTYPE
                        </span>
                      </div>
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
                                (product._id || product.id),
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
                            (
                            {product.numReviews || product.reviews?.length || 0}
                            )
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
                        {/* Options badge */}
                        {product.options && product.options.length > 0 && (
                          <div className="flex gap-1 flex-wrap mb-2">
                            {product.options.map((opt) => (
                              <span
                                key={opt.label}
                                className="text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full"
                              >
                                {opt.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4 block">
                          {product.options && product.options.length > 0
                            ? `From ${formatPrice(product.options[0].price)}`
                            : formatPrice(product.price)}
                        </span>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              addToCart(
                                product,
                                1,
                                product.options && product.options.length > 0 ? product.options[0] : null
                              );
                              navigate("/checkout");
                            }}
                            className="w-full bg-amber-500 text-white border-2 border-amber-500 px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-amber-600 hover:border-amber-600 transition-all duration-300 flex items-center justify-center gap-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Buy Now
                          </button>
                          <button
                            onClick={() => addToCart(
                              product,
                              1,
                              product.options && product.options.length > 0 ? product.options[0] : null
                            )}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:from-emerald-700 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Add to Cart <ShoppingBag size={18} />
                          </button>
                        </div>
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
                  Try adjusting your search or filters to find what you're
                  looking for.
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

      {/* ── SECTION 7 — FINAL CTA ── */}
      <section className="py-20 md:py-28 bg-primary text-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-8">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
            Global Standards. Certified Trust.
          </span>
          <h2 className="font-heading text-4xl md:text-6xl leading-tight font-bold">
            Explore Organic Products Backed by Global Standards.
          </h2>
          <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-3xl mx-auto">
            Discover a curated ecosystem of internationally certified organic ingredients supported by documentation, compliance, and disciplined sourcing systems.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="#product-grid"
              className="w-full sm:w-auto bg-accent text-primary px-10 py-4 font-bold uppercase tracking-widest hover:bg-surface transition-all duration-300 shadow-lg transform hover:-translate-y-1 text-center"
            >
              Explore Certified Products
            </a>
            <Link
              to="/vendor/intro"
              className="w-full sm:w-auto bg-transparent border border-accent text-surface px-10 py-4 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg transform hover:-translate-y-1 text-center"
            >
              Apply as a Certified Vendor
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Shop;