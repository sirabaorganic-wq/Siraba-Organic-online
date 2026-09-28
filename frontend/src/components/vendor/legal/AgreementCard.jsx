import React from "react";
import { FileText, Eye, Download, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import AgreementStatusBadge from "./AgreementStatusBadge";

/**
 * AgreementCard: Renders single legal document card in Step 7 or Vendor Dashboard.
 */
const AgreementCard = ({
  title,
  documentType,
  isMandatory = false,
  status = "pending", // "pending" | "executed" | "not_applicable"
  executedVersion,
  executedAt,
  signatoryName,
  signatoryDesignation,
  onReview,
  onDownload,
  downloading = false,
  description,
}) => {
  const isExecuted = status === "executed";
  const isNotRequired = status === "not_applicable";

  return (
    <div
      className={`border rounded-xl p-4 sm:p-5 transition-all shadow-xs ${
        isExecuted
          ? "bg-white border-emerald-200 hover:border-emerald-300"
          : isNotRequired
          ? "bg-[#fafafa] border-slate-200"
          : "bg-white border-amber-200 hover:border-amber-300 ring-1 ring-amber-100"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isExecuted
                ? "bg-emerald-100 text-emerald-800"
                : isNotRequired
                ? "bg-slate-100 text-slate-500"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isExecuted ? (
              <ShieldCheck size={20} />
            ) : (
              <FileText size={20} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[#24302a] font-serif leading-tight">
                {title}
              </h3>
              {isMandatory ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  Required
                </span>
              ) : (
                <span className="text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Conditional
                </span>
              )}
            </div>
            {description && (
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="self-start sm:self-center">
          <AgreementStatusBadge status={status} />
        </div>
      </div>

      {/* Metadata & Actions */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          {isExecuted ? (
            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-700">
                <span className="font-semibold text-emerald-900">Executed on:</span>{" "}
                {executedAt
                  ? new Date(executedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "On Record"}
              </div>
              <div className="text-[11px] text-slate-500">
                {signatoryName && (
                  <span>
                    Signatory: {signatoryName}
                    {signatoryDesignation ? ` (${signatoryDesignation})` : ""} •{" "}
                  </span>
                )}
                <span>Version {executedVersion || "1.0"}</span>
              </div>
            </div>
          ) : isNotRequired ? (
            <p className="text-[11px] text-slate-500 italic">
              Not required for your account at this stage. You will be notified if execution becomes necessary.
            </p>
          ) : (
            <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
              <Clock size={12} />
              Review and electronic acceptance required before final submission.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {!isNotRequired && (
            <button
              onClick={onReview}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                isExecuted
                  ? "border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
                  : "bg-[#6d8a72] text-white hover:bg-[#5c7760] shadow-xs"
              }`}
            >
              <Eye size={13} />
              {isExecuted ? "View Agreement" : "Review & Sign Agreement"}
            </button>
          )}

          {isExecuted && onDownload && (
            <button
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#24302a] text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Download executed PDF"
            >
              <Download size={13} />
              {downloading ? "Downloading..." : "Download PDF"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgreementCard;
