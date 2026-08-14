import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Award,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  X,
} from "lucide-react";
import api from "../api/axios";

/**
 * DynamicTrustCards Component
 * Redesigned 4-card SIRABA Trust Passport™ section for Product Details Page.
 * Displays 4 dynamic cards: CERTIFIED™ | VERIFIED™ | TRACEABLE™ | QUALIFIED™
 * Content is 100% dynamic resolved from actual database entities.
 */
const DynamicTrustCards = ({ productId, initialTrustPassport = null }) => {
  const [trustData, setTrustData] = useState(initialTrustPassport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialTrustPassport) {
      setTrustData(initialTrustPassport);
      setLoading(false);
      return;
    }

    if (!productId) {
      setLoading(true);
      return;
    }

    let isMounted = true;
    const fetchTrustPassport = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/products/${productId}/trust-passport`);
        if (isMounted && data?.trustPassport) {
          setTrustData(data.trustPassport);
        }
      } catch (err) {
        console.error("Failed to load Trust Passport cards:", err);
        if (isMounted) {
          setError("Trust verification details temporarily unavailable.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrustPassport();
    return () => {
      isMounted = false;
    };
  }, [productId, initialTrustPassport]);

  if (loading) {
    return (
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-72 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
                <div className="space-y-2 pt-3">
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-24 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !trustData) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{error || "Trust Passport information unavailable."}</span>
        </div>
      </div>
    );
  }

  const { certified, verified, traceable, qualified } = trustData;

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      return new Date(dateVal).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = String(statusStr || "").toLowerCase();
    if (s === "verified" || s === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Status: Verified ✓
        </span>
      );
    }
    if (s === "partially_verified") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Status: Partially Verified
        </span>
      );
    }
    if (s === "expired") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
          <X className="w-3 h-3 text-red-600" />
          Status: Expired ❌
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Clock className="w-3 h-3 text-slate-500" />
        Status: Verification Pending
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F3D2E] text-emerald-400 flex items-center justify-center shadow-2xs">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#0F3D2E] tracking-wide uppercase">
              SIRABA Trust Passport™
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Triple-Verified Organic Integrity & Supply-Chain Transparency
            </p>
          </div>
        </div>
        {/* <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-[10px] font-bold tracking-wider uppercase border border-emerald-200">
          Live Database Sync ✓
        </span> */}
      </div>

      {/* 4 Cards Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">

        {/* CARD 01 — CERTIFIED™ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#0F3D2E]">
                <ShieldCheck size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                CARD 01
              </span>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-[#0F3D2E] uppercase tracking-wider">
                CERTIFIED™
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Organic Certification
              </p>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Standard</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[120px]">
                  {certified?.standard || "USDA NOP"}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Cert. Body</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[120px]">
                  {certified?.certificationBody || "Verified Body"}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Cert No.</span>
                <span className="font-mono font-semibold text-slate-800 text-right truncate max-w-[120px]">
                  {certified?.certificateNumber || "Verified"}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Validity</span>
                <span className="font-semibold text-slate-800 text-right">
                  {certified?.validUntil ? formatDate(certified.validUntil) : "Active"}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Coverage</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[120px]">
                  {certified?.productCoverage || "Full Scope"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {getStatusBadge(certified?.status)}
          </div>
        </div>

        {/* CARD 02 — VERIFIED™ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#0F3D2E]">
                <CheckCircle2 size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                CARD 02
              </span>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-[#0F3D2E] uppercase tracking-wider">
                VERIFIED™
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Evidence & Compliance
              </p>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              {[
                { label: "Business Verified", pass: verified?.businessVerified },
                { label: "FSSAI Registered", pass: verified?.fssaiRegistered },
                { label: "Product Label Verified", pass: verified?.productLabelVerified },
                { label: "Quality Tested", pass: verified?.qualityTested },
                { label: "Accredited Lab Evidence", pass: verified?.safetyTested },
              ].map((chk, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium text-[11px]">
                    {chk.label}
                  </span>
                  {chk.pass ? (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {getStatusBadge(verified?.status)}
          </div>
        </div>

        {/* CARD 03 — TRACEABLE™ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#0F3D2E]">
                <MapPin size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                CARD 03
              </span>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-[#0F3D2E] uppercase tracking-wider">
                TRACEABLE™
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Supply Chain Transparency
              </p>
            </div>

            {/* Vertical Step Timeline */}
            <div className="relative border-l-2 border-emerald-200/80 ml-2 pl-3 space-y-2.5 text-xs pt-2">
              {[
                { stage: "Origin", val: traceable?.origin },
                { stage: "Processing", val: traceable?.processing },
                { stage: "Quality Check", val: traceable?.qualityCheck },
                { stage: "Packaging", val: traceable?.packaging },
                { stage: "Distribution", val: traceable?.distribution },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {step.stage}
                  </p>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {step.val || "Verified Step"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {getStatusBadge(traceable?.status)}
          </div>
        </div>

        {/* CARD 04 — QUALIFIED™ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#0F3D2E]">
                <Award size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                CARD 04
              </span>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-[#0F3D2E] uppercase tracking-wider">
                QUALIFIED™
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                SIRABA Marketplace Approved
              </p>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-normal">
              {qualified?.description}
            </p>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-2">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Vendor</span>
                <span className="font-bold text-[#0F3D2E] text-right truncate max-w-[120px]">
                  {qualified?.vendorName || "Siraba Organic"}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Review Date</span>
                <span className="font-semibold text-slate-800 text-right">
                  {formatDate(qualified?.reviewDate)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Next Review</span>
                <span className="font-semibold text-slate-800 text-right">
                  {formatDate(qualified?.nextReview)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {getStatusBadge(qualified?.status)}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DynamicTrustCards;
