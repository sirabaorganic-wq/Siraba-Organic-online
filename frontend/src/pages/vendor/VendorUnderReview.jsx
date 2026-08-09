import React, { useEffect } from "react";
import { useVendor } from "../../context/VendorContext";
import { useNavigate, Link } from "react-router-dom";
import { Clock, ShieldCheck, CheckCircle, LogOut, Mail, Phone, ArrowLeft, RefreshCw } from "lucide-react";
import Logo from "../../assets/SIRABALOGO.png";

const VendorUnderReview = () => {
  const { vendor, logout, refreshVendorStatus } = useVendor();
  const navigate = useNavigate();

  useEffect(() => {
    if (vendor) {
      if (vendor.status === "approved" || vendor.status === "subadmin_approved") {
        navigate("/vendor/dashboard");
      } else if (!vendor.onboardingComplete) {
        navigate("/vendor/onboarding");
      } else if (vendor.status === "rejected" || vendor.status === "subadmin_rejected") {
        navigate("/vendor/rejected");
      }
    }
  }, [vendor, navigate]);

  const handleRefresh = async () => {
    const res = await refreshVendorStatus();
    if (res?.vendor?.status === "approved") {
      navigate("/vendor/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-serif">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/">
            <img src={Logo} alt="Siraba Organic" className="h-10" />
          </Link>
          <div className="flex items-center gap-4 font-sans text-xs">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Status
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/vendor/login");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer font-medium"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-8 text-center relative">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
              <Clock className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Application Under Review
            </h1>
            <p className="font-sans text-emerald-100 text-xs sm:text-sm mt-2 max-w-md mx-auto">
              SIRABA ORGANIC™ — Vendor Qualification System
            </p>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6 font-sans">
            <div className="bg-amber-50/80 border border-amber-200/70 rounded-lg p-4 flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">
                  Thank you for submitting your vendor qualification application!
                </p>
                <p className="mt-1 text-amber-800 text-xs leading-relaxed">
                  Your application has been received and is currently being verified by our compliance team. You will be able to access your Vendor Dashboard as soon as your application is approved.
                </p>
              </div>
            </div>

            {/* Application Information Summary */}
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans border-b border-slate-200 pb-2">
                Application Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Vendor ID:</span>
                  <span className="font-mono font-bold text-slate-800">{vendor?._id || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Business Name:</span>
                  <span className="font-bold text-slate-800">{vendor?.businessName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submitted On:</span>
                  <span className="font-medium text-slate-800">
                    {vendor?.onboardingSubmittedAt
                      ? new Date(vendor.onboardingSubmittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : vendor?.updatedAt
                      ? new Date(vendor.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recently"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Under Review
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps Info */}
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <h4 className="font-bold text-slate-800 text-sm">What happens next?</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Our team will inspect your legal, FSSAI, and organic certification evidence.</li>
                <li>If any additional clarification is needed, we will reach out directly.</li>
                <li>Upon approval, logging in will take you directly to your Vendor Dashboard.</li>
              </ul>
            </div>

            {/* Support Footer */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-emerald-700" /> sirabaorganic@gmail.com
                </span>
              </div>
              <button
                onClick={handleRefresh}
                className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} /> Check for updates
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-slate-400 text-xs font-sans">
        SIRABA ORGANIC™ — Certified • Verified • Qualified
      </footer>
    </div>
  );
};

export default VendorUnderReview;
