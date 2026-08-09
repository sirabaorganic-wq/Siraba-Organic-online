import React, { useEffect } from "react";
import { useVendor } from "../../context/VendorContext";
import { useNavigate, Link } from "react-router-dom";
import { AlertTriangle, LogOut, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import Logo from "../../assets/SIRABALOGO.png";

const VendorRejected = () => {
  const { vendor, logout, refreshVendorStatus } = useVendor();
  const navigate = useNavigate();

  useEffect(() => {
    if (vendor) {
      if (vendor.status === "approved" || vendor.status === "subadmin_approved") {
        navigate("/vendor/dashboard");
      } else if (vendor.status === "under_review" || vendor.status === "pending") {
        navigate("/vendor/under-review");
      }
    }
  }, [vendor, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-serif">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/">
            <img src={Logo} alt="Siraba Organic" className="h-10" />
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/vendor/login");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors font-sans text-xs font-medium cursor-pointer"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden font-sans">
          <div className="bg-red-700 text-white p-8 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
              <AlertTriangle className="w-7 h-7 text-red-200" />
            </div>
            <h1 className="font-heading text-2xl font-bold">
              Application Not Approved
            </h1>
            <p className="text-red-100 text-xs mt-1">
              Vendor Qualification Status Update
            </p>
          </div>

          <div className="p-6 space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
            <p>
              Thank you for your interest in joining <strong>SIRABA ORGANIC™</strong>. Unfortunately, your vendor application could not be approved at this time.
            </p>

            {vendor?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 space-y-1">
                <span className="font-bold text-xs uppercase tracking-wider text-red-900 block">
                  Reason for Rejection:
                </span>
                <p className="text-xs">{vendor.rejectionReason}</p>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-800">What can you do now?</p>
              <p>
                If you believe this decision was made in error or if you have updated evidence (such as renewed organic certificates or FSSAI license), please contact our support team at:
              </p>
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs pt-1">
                <Mail size={14} /> sirabaorganic@gmail.com
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={async () => {
                  const res = await refreshVendorStatus();
                  if (res?.vendor?.status === "approved") {
                    navigate("/vendor/dashboard");
                  }
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} /> Check Status Again
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate("/vendor/login");
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorRejected;
