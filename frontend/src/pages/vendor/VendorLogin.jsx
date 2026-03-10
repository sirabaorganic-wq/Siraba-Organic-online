import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useVendor } from "../../context/VendorContext";
import {
  Store,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  ArrowRight,
  Leaf,
  ShieldCheck,
  Globe,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import Logo from "../../assets/SIRABALOGO.png";
import BgImage2 from "../../assets/bgimage2.png";
import client from "../../api/client";
import OTPModal from "../../components/OTPModal";

/* ─────────────────────────────────────────────
   Reusable field wrapper
───────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500">
      {label}
    </label>
    {children}
  </div>
);

/* Icon-prefixed input */
const IconInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    <input
      {...props}
      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg
                 text-slate-800 placeholder:text-slate-300
                 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                 hover:border-slate-300 transition-all duration-200"
    />
  </div>
);

/* Plain input (no icon) */
const PlainInput = (props) => (
  <input
    {...props}
    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg
               text-slate-800 placeholder:text-slate-300
               focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
               hover:border-slate-300 transition-all duration-200"
  />
);

/* ─────────────────────────────────────────────
   Benefits data
───────────────────────────────────────────── */
const BENEFITS = [
  {
    icon: Leaf,
    title: "Premium Organic Marketplace",
    desc: "List your products on India's most trusted organic platform.",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    iconColor: "text-green-400",
  },
  {
    icon: Globe,
    title: "Global Customer Reach",
    desc: "Connect with quality-conscious buyers across the country and beyond.",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: TrendingUp,
    title: "Smart Inventory Tools",
    desc: "Effortlessly manage stock, orders, and fulfilment from one dashboard.",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: ShieldCheck,
    title: "Dedicated Vendor Support",
    desc: "Our team is with you every step — onboarding to scaling.",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    iconColor: "text-orange-400",
  },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
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
    if (location.pathname.includes("register")) setIsLogin(false);
  }, [location]);

  useEffect(() => {
    if (vendor) {
      navigate(vendor.onboardingComplete ? "/vendor/dashboard" : "/vendor/onboarding");
    }
  }, [vendor, navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const [emailOtpModalOpen, setEmailOtpModalOpen] = useState(false);
  const [pendingVendorRegistration, setPendingVendorRegistration] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          navigate(
            !result.vendor?.onboardingComplete
              ? "/vendor/onboarding"
              : "/vendor/dashboard"
          );
        } else {
          setError(result.message);
        }
      } else {
        setPendingVendorRegistration(formData);
        await client.post("/otp/send-email", {
          email: formData.email,
          context: "Vendor registration",
        });
        setEmailOtpModalOpen(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative flex flex-col">

      {/* ── Background ── */}
      <div className="absolute inset-0 z-0">
        <img src={BgImage2} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/92 via-primary/80 to-primary/88" />
        {/* ambient glows */}
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-accent/15 blur-[120px] animate-pulse"
          style={{ animationDuration: "7s" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[560px] h-[560px] rounded-full bg-white/5 blur-[140px] animate-pulse"
          style={{ animationDuration: "9s", animationDelay: "3s" }}
        />
      </div>

      {/* ── Top bar ── */}
      <div className="relative z-20 flex items-center px-5 sm:px-8 pt-5 pb-0 flex-shrink-0">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full
                     bg-white/10 backdrop-blur-md border border-white/15
                     text-white/85 text-sm font-medium
                     hover:bg-white/18 hover:text-white transition-all duration-200 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        {/* Logo + portal badge — centred absolutely */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
          <Link to="/" className="group">
            <img
              src={Logo}
              alt="Siraba"
              className="h-10 drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                          bg-black/30 backdrop-blur-md border border-white/12
                          text-accent text-[10px] font-bold tracking-[0.16em] uppercase"
          >
            <Store size={10} />
            Vendor Portal
          </div>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 overflow-hidden py-6 sm:py-8">
        <div
          className={`w-full flex flex-col lg:flex-row gap-5 lg:gap-6 items-stretch transition-all duration-500 ${!isLogin ? "max-w-5xl xl:max-w-6xl" : "max-w-[460px] lg:max-w-[520px]"
            }`}
        >

          {/* ══ LEFT COLUMN : Form ══ */}
          <div className={`flex flex-col min-h-0 ${!isLogin ? "w-full lg:w-1/2" : "w-full"}`}>

            {/* Section heading */}
            <div className="mb-3 text-center">
              <h1 className="font-heading text-3xl sm:text-[2.1rem] text-white drop-shadow-md leading-tight">
                {isLogin ? "Welcome Back" : "Join Our Network"}
              </h1>
              <p className="text-white/60 text-[13px] mt-1.5 font-light tracking-wide">
                {isLogin
                  ? "Sign in to manage your organic business"
                  : "Partner with Siraba Organic today"}
              </p>
            </div>

            {/* Glass card */}
            <div
              className="flex-1 bg-white/97 backdrop-blur-2xl rounded-2xl
                            shadow-[0_20px_60px_rgba(0,0,0,0.28)]
                            border border-white/50 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 168px)" }}
            >
              <div className="p-5 sm:p-6">

                {/* Error banner */}
                {error && (
                  <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200/70 rounded-xl text-red-600 text-[13px]">
                    <span className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-white block" />
                    </span>
                    <span className="font-medium leading-snug">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {!isLogin && (
                    <>
                      {/* Business Name + Type */}
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Business Name *">
                          <IconInput
                            icon={Store}
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            required={!isLogin}
                            placeholder="Brandoo Organics"
                          />
                        </Field>
                        <Field label="Business Type *">
                          <div className="relative">
                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                              name="businessType"
                              value={formData.businessType}
                              onChange={handleChange}
                              className="w-full pl-10 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-lg
                                         text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/30
                                         focus:border-accent hover:border-slate-300 transition-all duration-200
                                         appearance-none cursor-pointer"
                            >
                              <option value="manufacturer">Manufacturer</option>
                              <option value="distributor">Distributor</option>
                              <option value="farmer">Farmer / Producer</option>
                              <option value="processor">Processor</option>
                              <option value="wholesaler">Wholesaler</option>
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                                <path d="M1 1l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        </Field>
                      </div>

                      {/* Contact + Phone */}
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Contact Person *">
                          <IconInput
                            icon={User}
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            required={!isLogin}
                            placeholder="Rajesh Kumar"
                          />
                        </Field>
                        <Field label="Phone Number *">
                          <IconInput
                            icon={Phone}
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required={!isLogin}
                            placeholder="+91 98765 43210"
                          />
                        </Field>
                      </div>

                      {/* City / State / PIN */}
                      <div className="grid grid-cols-3 gap-3">
                        <Field label="City *">
                          <PlainInput
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required={!isLogin}
                            placeholder="Surat"
                          />
                        </Field>
                        <Field label="State *">
                          <PlainInput
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            required={!isLogin}
                            placeholder="Gujarat"
                          />
                        </Field>
                        <Field label="PIN *">
                          <PlainInput
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            required={!isLogin}
                            placeholder="394210"
                          />
                        </Field>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-100 my-1" />
                    </>
                  )}

                  {/* Email */}
                  <Field label="Email Address *">
                    <IconInput
                      icon={Mail}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="vendor@example.com"
                    />
                  </Field>

                  {/* Password */}
                  <Field label="Password *">
                    <IconInput
                      icon={Lock}
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                    />
                  </Field>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative mt-1 w-full flex items-center justify-center gap-2.5
                               bg-gradient-to-r from-accent to-accent/85 text-primary
                               py-3 rounded-xl font-bold text-sm tracking-wide
                               hover:brightness-105 hover:shadow-lg hover:-translate-y-0.5
                               active:translate-y-0 active:brightness-95
                               transition-all duration-200 disabled:opacity-50
                               disabled:pointer-events-none overflow-hidden group"
                  >
                    <span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent
                                     -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    />
                    {loading ? (
                      <span className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    ) : (
                      <>
                        <span className="relative z-10">
                          {isLogin ? "Sign In to Dashboard" : "Create Vendor Account"}
                        </span>
                        <ArrowRight
                          size={15}
                          className="relative z-10 group-hover:translate-x-0.5 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer links */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
                  <p className="text-[13px] text-slate-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError("");
                      }}
                      className="ml-1.5 text-accent font-semibold hover:underline underline-offset-2 transition-colors"
                    >
                      {isLogin ? "Register as Vendor" : "Sign In"}
                    </button>
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-accent transition-colors group"
                  >
                    <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Siraba Organic
                  </Link>
                </div>

              </div>
            </div>
          </div>
          {/* ══ END LEFT COLUMN ══ */}

          {/* ══ RIGHT COLUMN : Benefits (register only) ══ */}
          {!isLogin && (
            <div className="w-full lg:w-1/2 flex flex-col min-h-0 mt-4 lg:mt-0">
              <div
                className="flex-1 flex flex-col
                              bg-white/8 backdrop-blur-xl rounded-2xl p-6 sm:p-7
                              border border-white/12 shadow-[0_16px_48px_rgba(0,0,0,0.22)]
                              overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 168px)" }}
              >
                {/* Heading */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-accent/70 mb-1.5">
                    Partner Benefits
                  </p>
                  <h2 className="font-heading text-2xl sm:text-[1.75rem] text-white leading-tight">
                    Why Partner with{" "}
                    <span className="text-accent">Siraba?</span>
                  </h2>
                  <p className="text-white/50 text-[13px] mt-2 leading-relaxed">
                    Join a growing community of verified organic vendors and scale your business with confidence.
                  </p>
                </div>

                {/* Benefit cards */}
                <div className="flex flex-col gap-2.5">
                  {BENEFITS.map((b, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border ${b.bg} ${b.border}
                                  backdrop-blur-sm hover:scale-[1.015] transition-transform duration-200 cursor-default`}
                    >
                      <div
                        className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg ${b.bg} border ${b.border}
                                    flex items-center justify-center`}
                      >
                        <b.icon className={b.iconColor} size={16} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-[13px] leading-snug">{b.title}</p>
                        <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Social proof strip */}
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/10">
                  <div className="flex -space-x-1.5">
                    {["#22c55e", "#3b82f6", "#a855f7", "#f97316"].map((c, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center"
                        style={{ backgroundColor: c + "30" }}
                      >
                        <CheckCircle2 size={11} style={{ color: c }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-white/45 text-[12px] leading-snug">
                    <span className="text-accent font-bold text-sm">500+</span> vendors already growing with Siraba
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* ══ END RIGHT COLUMN ══ */}

        </div>
      </div>
      <OTPModal
        isOpen={emailOtpModalOpen}
        title="Verify your email"
        description={
          pendingVendorRegistration
            ? `We have sent a 6-digit verification code to ${pendingVendorRegistration.email}. Enter it below to complete your vendor registration.`
            : ""
        }
        onClose={() => setEmailOtpModalOpen(false)}
        onVerify={async (otp) => {
          if (!pendingVendorRegistration) return;
          const result = await register({
            ...pendingVendorRegistration,
            emailOtp: otp,
          });
          if (!result.success) {
            throw new Error(result.message);
          }
          setEmailOtpModalOpen(false);
          setPendingVendorRegistration(null);
          navigate("/vendor/onboarding");
        }}
        onResend={async () => {
          if (!pendingVendorRegistration) return;
          await client.post("/otp/send-email", {
            email: pendingVendorRegistration.email,
            context: "Vendor registration",
          });
        }}
      />
    </div>
  );
};

export default VendorLogin;