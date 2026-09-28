import React from "react";
import { CheckCircle, Clock, MinusCircle } from "lucide-react";

/**
 * Standard status badge for Legal Agreements in SIRABA ORGANIC.
 * Supported statuses: "executed", "pending", "not_applicable"
 */
const AgreementStatusBadge = ({ status, className = "" }) => {
  const normalized = (status || "").toLowerCase().trim();

  if (normalized === "executed") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}
      >
        <CheckCircle size={12} className="text-emerald-700" />
        Executed
      </span>
    );
  }

  if (normalized === "pending") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 ${className}`}
      >
        <Clock size={12} className="text-amber-700" />
        Pending Execution
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wider bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
    >
      <MinusCircle size={12} className="text-slate-400" />
      Not Required
    </span>
  );
};

export default AgreementStatusBadge;
