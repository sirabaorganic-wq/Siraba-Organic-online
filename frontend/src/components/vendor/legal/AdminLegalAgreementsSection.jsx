import React, { useState } from "react";
import { FileText, Download, ShieldCheck, Clock, MinusCircle, AlertCircle, Loader2, Check } from "lucide-react";
import client from "../../../api/client";

/**
 * AdminLegalAgreementsSection:
 * Embedded into Admin Dashboard (Dashboard.jsx) and VendorOnboarderDashboard.jsx
 *
 * Provides:
 * - Read-only view of legal agreement execution status & signatory details
 * - Optional document hash viewing for audit compliance
 * - Authenticated admin PDF downloads
 * - Controlled NDA requirement toggle with confirmation modal & audit reason
 */
const AdminLegalAgreementsSection = ({ vendor, onVendorUpdated }) => {
  const [downloadingType, setDownloadingType] = useState(null);
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [targetNdaState, setTargetNdaState] = useState(false);
  const [ndaReason, setNdaReason] = useState("");
  const [updatingNda, setUpdatingNda] = useState(false);
  const [ndaError, setNdaError] = useState("");

  if (!vendor) return null;

  const agreements = vendor.agreements || {};
  const vma = agreements.marketplaceAgreement || {};
  const nda = agreements.mutualNda || {};

  const isVmaExecuted = vma.status === "executed";
  const isNdaRequired = nda.isRequired || false;
  const isNdaExecuted = nda.status === "executed";

  // Authenticated Admin Download
  const handleAdminDownload = async (docType) => {
    setDownloadingType(docType);
    try {
      const response = await client.get(`/admin/vendors/${vendor._id}/agreements/${docType}/download`, {
        responseType: "blob",
      });

      let filename = `${docType.toLowerCase()}-${vendor._id}.pdf`;
      const disposition = response.headers?.["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/["']/g, "").trim();
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Admin agreement download error:", err);
      alert(
        err.response?.data?.message ||
          "Failed to download executed agreement. The document may not be generated yet."
      );
    } finally {
      setDownloadingType(null);
    }
  };

  // Open NDA toggle confirmation
  const handleInitiateNdaToggle = (newRequired) => {
    setTargetNdaState(newRequired);
    setNdaReason("");
    setNdaError("");
    setShowNdaModal(true);
  };

  // Confirm NDA Requirement change via backend API
  const handleConfirmNdaRequirement = async () => {
    setUpdatingNda(true);
    setNdaError("");
    try {
      const payload = {
        isRequired: targetNdaState,
        reason: ndaReason.trim() || undefined,
      };

      const { data } = await client.put(`/admin/vendors/${vendor._id}/nda-requirement`, payload);

      setShowNdaModal(false);
      if (onVendorUpdated) {
        onVendorUpdated(data);
      }
    } catch (err) {
      console.error("Failed to update NDA requirement:", err);
      setNdaError(
        err.response?.data?.message || "Failed to update Mutual NDA requirement. Please try again."
      );
    } finally {
      setUpdatingNda(false);
    }
  };

  return (
    <div className="border border-secondary/20 rounded-sm p-4 bg-white space-y-4 font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-secondary/10 pb-3">
        <div>
          <h4 className="font-heading font-bold text-primary text-sm flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#6d8a72]" />
            Agreements &amp; Legal Execution
          </h4>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Phase 2 legal documents foundation, execution records, and conditional NDA enforcement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Marketplace Agreement Card */}
        <div className="border border-secondary/15 rounded-sm p-3.5 bg-secondary/5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-primary text-xs">Master Vendor Agreement</div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                Mandatory Baseline
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isVmaExecuted
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isVmaExecuted ? "Executed" : "Pending Execution"}
            </span>
          </div>

          <div className="text-[11px] text-text-secondary space-y-1 pt-1 border-t border-secondary/10">
            <div>
              <strong>Status:</strong>{" "}
              <span className="capitalize">{vma.status || "Pending"}</span>
            </div>
            {isVmaExecuted && (
              <>
                <div>
                  <strong>Executed On:</strong>{" "}
                  {vma.executedAt
                    ? new Date(vma.executedAt).toLocaleString("en-IN")
                    : "Recorded"}
                </div>
                <div>
                  <strong>Template Version:</strong> {vma.executedVersion || "1.0"}
                </div>
              </>
            )}
          </div>

          {isVmaExecuted && (
            <button
              onClick={() => handleAdminDownload("VENDOR_MARKETPLACE_AGREEMENT")}
              disabled={downloadingType === "VENDOR_MARKETPLACE_AGREEMENT"}
              className="w-full mt-2 py-1.5 px-3 bg-primary text-surface rounded-sm text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download size={13} />
              {downloadingType === "VENDOR_MARKETPLACE_AGREEMENT"
                ? "Downloading..."
                : "Download Executed PDF"}
            </button>
          )}
        </div>

        {/* Mutual NDA Card */}
        <div className="border border-secondary/15 rounded-sm p-3.5 bg-secondary/5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-primary text-xs">Mutual NDA &amp; Confidentiality</div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                Conditional Requirement
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isNdaExecuted
                  ? "bg-emerald-100 text-emerald-800"
                  : isNdaRequired
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isNdaExecuted
                ? "Executed"
                : isNdaRequired
                ? "Required (Pending)"
                : "Not Required"}
            </span>
          </div>

          <div className="text-[11px] text-text-secondary space-y-1 pt-1 border-t border-secondary/10">
            <div>
              <strong>Enforcement:</strong>{" "}
              {isNdaRequired ? (
                <span className="text-amber-800 font-bold">Mandated for this Vendor</span>
              ) : (
                <span className="text-slate-600">Not Mandated (Standard Onboarding)</span>
              )}
            </div>
            {isNdaExecuted && (
              <>
                <div>
                  <strong>Executed On:</strong>{" "}
                  {nda.executedAt
                    ? new Date(nda.executedAt).toLocaleString("en-IN")
                    : "Recorded"}
                </div>
                <div>
                  <strong>Template Version:</strong> {nda.executedVersion || "1.0"}
                </div>
              </>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {isNdaExecuted && (
              <button
                onClick={() => handleAdminDownload("MUTUAL_NDA")}
                disabled={downloadingType === "MUTUAL_NDA"}
                className="w-full py-1.5 px-3 bg-primary text-surface rounded-sm text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download size={13} />
                {downloadingType === "MUTUAL_NDA"
                  ? "Downloading..."
                  : "Download Executed NDA"}
              </button>
            )}

            {/* NDA Requirement Toggle Button */}
            <button
              onClick={() => handleInitiateNdaToggle(!isNdaRequired)}
              className={`w-full py-1 px-3 border rounded-sm text-[11px] font-bold transition-colors cursor-pointer ${
                isNdaRequired
                  ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                  : "border-secondary/30 text-primary bg-white hover:bg-secondary/10"
              }`}
            >
              {isNdaRequired ? "Waive NDA Requirement" : "Require Mutual NDA"}
            </button>
          </div>
        </div>
      </div>

      {/* NDA Confirmation Modal */}
      {showNdaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-secondary/20 space-y-4 font-sans">
            <div>
              <h4 className="text-sm font-bold text-primary font-heading">
                {targetNdaState
                  ? "Mandate Mutual NDA Requirement"
                  : "Waive Mutual NDA Requirement"}
              </h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {targetNdaState
                  ? `Requiring an NDA will mandate that ${vendor.businessName} must electronically review and execute the Mutual NDA before their onboarding or strategic partnership can proceed.`
                  : `Waiving the NDA requirement will allow ${vendor.businessName} to complete onboarding with only the standard Master Vendor Agreement.`}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Reason / Internal Audit Note (Optional)
              </label>
              <textarea
                value={ndaReason}
                onChange={(e) => setNdaReason(e.target.value)}
                placeholder="e.g., Proprietary private label supply, institutional procurement, B2B wholesale access"
                rows={2}
                disabled={updatingNda}
                className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {ndaError && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded">
                {ndaError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNdaModal(false)}
                disabled={updatingNda}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNdaRequirement}
                disabled={updatingNda}
                className={`px-4 py-1.5 text-xs font-bold rounded text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                  targetNdaState
                    ? "bg-[#24302a] hover:bg-slate-800"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updatingNda ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    Confirm {targetNdaState ? "Requirement" : "Waiver"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLegalAgreementsSection;
