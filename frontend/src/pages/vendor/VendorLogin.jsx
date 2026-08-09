import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  KeyRound,
  RefreshCw,
  X,
  Eye,
  EyeOff,
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

/* Icon-prefixed input with password toggle support */
const IconInput = ({ icon: Icon, type, className, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        {...props}
        type={inputType}
        className={`w-full pl-10 ${isPassword ? "pr-10" : "pr-4"} py-2.5 text-sm bg-white border border-slate-200 rounded-lg
                   text-slate-800 placeholder:text-slate-300
                   focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                   hover:border-slate-300 transition-all duration-200 ${className || ""}`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition-colors focus:outline-none cursor-pointer"
          tabIndex={-1}
          title={showPassword ? "Hide password" : "Show password"}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
};

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
   Forgot Password Modal Component
───────────────────────────────────────────── */
const VendorForgotPasswordModal = ({ isOpen, onClose, initialEmail }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || "");
      setStep(1);
      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccessMsg("");
      const target = document.getElementById("modal-root") || document.body;
      setPortalTarget(target);
    } else {
      setPortalTarget(null);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen || !portalTarget) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await client.post("/vendors/forgot-password/send-otp", { email });
      setSuccessMsg("OTP sent successfully to your email.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError("");
    setSuccessMsg("");
    try {
      await client.post("/vendors/forgot-password/send-otp", { email });
      setSuccessMsg("A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const { data } = await client.post("/vendors/forgot-password/verify-otp", {
        email,
        otp: otp.trim(),
      });
      setResetToken(data.resetToken);
      setSuccessMsg("OTP verified! Set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await client.post("/vendors/forgot-password/reset-password", {
        email,
        resetToken,
        newPassword,
      });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary via-primary/95 to-primary flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-accent" />
            <h2 className="font-heading font-bold text-lg">Reset Vendor Password</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered vendor email address. We will send a 6-digit OTP code to verify your identity.
              </p>

              <Field label="Registered Vendor Email *">
                <IconInput
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vendor@example.com"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-accent to-accent/85 text-primary font-bold text-sm rounded-xl shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send OTP Code</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Please enter the 6-digit OTP sent to <strong className="text-slate-800">{email}</strong>.
              </p>

              <Field label="6-Digit OTP Code *">
                <IconInput
                  icon={ShieldCheck}
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 text-base tracking-[0.2em] font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </Field>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-slate-600 font-medium"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="text-accent font-semibold hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
                  {resending ? "Resending..." : "Resend OTP"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-accent to-accent/85 text-primary font-bold text-sm rounded-xl shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify OTP</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Create a new secure password for your vendor account.
              </p>

              <Field label="New Password *">
                <IconInput
                  icon={Lock}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                />
              </Field>

              <Field label="Confirm New Password *">
                <IconInput
                  icon={Lock}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-accent to-accent/85 text-primary font-bold text-sm rounded-xl shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <CheckCircle2 size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-800">Password Updated!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Your vendor account password has been updated successfully. You can now log in.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-primary/90 transition-all cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    portalTarget
  );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const VendorLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
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

  const getVendorRedirectPath = (v) => {
    if (!v) return "/vendor/login";
    if (!v.onboardingComplete) return "/vendor/onboarding";
    if (v.status === "approved" || v.status === "subadmin_approved") return "/vendor/dashboard";
    if (v.status === "rejected" || v.status === "subadmin_rejected") return "/vendor/rejected";
    return "/vendor/under-review";
  };

  useEffect(() => {
    if (vendor) {
      navigate(getVendorRedirectPath(vendor));
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
          // login function sets vendor state which triggers useEffect navigation
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
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500">
                        Password *
                      </label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setForgotModalOpen(true)}
                          className="text-xs font-semibold text-accent hover:underline cursor-pointer transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <IconInput
                      icon={Lock}
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                    />
                  </div>

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
      <VendorForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        initialEmail={formData.email}
      />
    </div>
  );
};

export default VendorLogin;