import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useVendor } from "../../context/VendorContext";
import {
  Store,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Building,
  ArrowRight,
  Leaf,
  ShieldCheck,
  Globe,
  ArrowLeft
} from "lucide-react";
import Logo from "../../assets/SIRABALOGO.png";
import BgImage2 from "../../assets/bgimage2.png";

const VendorLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    businessName: "",
    businessType: "manufacturer",
    contactPerson: "",
    phone: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, vendor } = useVendor();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("register")) {
      setIsLogin(false);
    }
  }, [location]);

  // Redirect if already logged in
  React.useEffect(() => {
    if (vendor) {
      if (!vendor.onboardingComplete) {
        navigate("/vendor/onboarding");
      } else {
        navigate("/vendor/dashboard");
      }
    }
  }, [vendor, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      if (result.success) {
        if (!isLogin) {
          navigate("/vendor/onboarding");
        } else {
          if (!result.vendor?.onboardingComplete) {
            navigate("/vendor/onboarding");
          } else {
            navigate("/vendor/dashboard");
          }
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background with Particles */}
      <div className="absolute inset-0 z-0">
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-30">
          <Link to="/" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold text-white hover:bg-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        <img
          src={BgImage2}
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-accent/30 to-primary/80" />

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-surface/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo & Header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <Link to="/" className="inline-block group">
              <img src={Logo} alt="Siraba Logo" className="h-16 mx-auto mb-6 drop-shadow-2xl transition-transform group-hover:scale-110 duration-300" />
            </Link>
            <div className="inline-flex items-center gap-2 font-subheading text-accent text-xs tracking-[0.15em] uppercase font-bold border border-accent/40 px-5 py-2.5 rounded-full bg-black/30 backdrop-blur-md mb-6 shadow-lg">
              <Store size={14} />
              <span>Vendor Portal</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-surface mt-6 mb-3 drop-shadow-2xl">
              {isLogin ? "Welcome Back" : "Join Our Network"}
            </h1>
            <p className="text-white/90 font-light text-lg">
              {isLogin
                ? "Sign in to manage your organic business"
                : "Partner with Siraba Organic"}
            </p>
          </div>

          {/* Form Card with Glassmorphism */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30 animate-fade-in-up animation-delay-200">
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 rounded-lg text-sm flex items-center gap-3 shadow-md animate-shake">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  {/* Business Name */}
                  <div className="group">
                    <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                      Business Name *
                    </label>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/60 group-focus-within:text-accent transition-colors" />
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md"
                        placeholder="Brandoo"
                      />
                    </div>
                  </div>

                  {/* Business Type */}
                  <div className="group">
                    <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                      Business Type *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/60 group-focus-within:text-accent transition-colors" />
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                      >
                        <option value="manufacturer">Manufacturer</option>
                        <option value="distributor">Distributor</option>
                        <option value="farmer">Farmer / Producer</option>
                        <option value="processor">Processor</option>
                        <option value="wholesaler">Wholesaler</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="group">
                    <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                      Contact Person *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/60 group-focus-within:text-accent transition-colors" />
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md"
                        placeholder="Rajesh Kumar"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="group">
                    <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/60 group-focus-within:text-accent transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md"
                        placeholder="+919265318481"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="group">
                      <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full px-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md"
                        placeholder="Surat"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full px-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md"
                        placeholder="Gujarat"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                        PIN *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full px-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md"
                        placeholder="394210"
                      />
                    </div>
                  </div>

                  <div className="border-t border-secondary/10 my-6" />
                </>
              )}

              {/* Email */}
              <div className="group">
                <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/60 group-focus-within:text-accent transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md"
                    placeholder="vendor@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-xs font-bold text-text-secondary mb-2.5 tracking-widest uppercase">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/60 group-focus-within:text-accent transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-secondary/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white hover:border-secondary/40 shadow-sm hover:shadow-md"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full bg-gradient-to-r from-accent to-accent/90 text-primary py-4 font-bold text-sm tracking-widest uppercase hover:from-primary hover:to-primary/90 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl shadow-lg disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 rounded-xl overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>

                {loading ? (
                  <div className="w-5 h-5 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">{isLogin ? "Sign In to Dashboard" : "Create Vendor Account"}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-8 pt-6 border-t border-secondary/10 text-center">
              <p className="text-text-secondary">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-accent font-bold hover:text-primary transition-colors hover:underline"
                >
                  {isLogin ? "Register as Vendor" : "Sign In"}
                </button>
              </p>
            </div>

            {/* Back to main site */}
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-sm text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-2 hover:gap-3 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Siraba Organic</span>
              </Link>
            </div>
          </div>

          {/* Benefits Section */}
          {!isLogin && (
            <div className="mt-10 bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl animate-fade-in-up animation-delay-400">
              <h3 className="font-heading text-2xl text-surface mb-6 text-center drop-shadow-lg">
                Why Partner with <span className="text-accent">Siraba?</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: Leaf, text: "Access to premium organic marketplace", color: "bg-green-500" },
                  { icon: Globe, text: "Reach quality-conscious customers globally", color: "bg-blue-500" },
                  { icon: ShieldCheck, text: "Easy inventory & order management tools", color: "bg-purple-500" },
                  { icon: Store, text: "Dedicated vendor support team", color: "bg-orange-500" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-4 text-white p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 hover:transform hover:translate-x-2 border border-white/10"
                  >
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
