import React, { useState, useEffect } from "react";
import { X, FileText, Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import client from "../../../api/client";

/**
 * Accessible modal for previewing and electronically executing legal agreements.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - documentType: "vendor-agreement" | "mutual-nda"
 * - documentTitle: string
 * - currentAgreement: Object (execution info if already executed)
 * - isExecuted: boolean
 * - vendor: Object (for prefilling signatory name/designation)
 * - onAcceptSuccess: () => Promise<void> (parent callback to re-fetch backend status)
 * - onDownload: () => void
 */
const AgreementPreviewModal = ({
  isOpen,
  onClose,
  documentType,
  documentTitle,
  currentAgreement,
  isExecuted,
  vendor,
  onAcceptSuccess,
  onDownload,
}) => {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [templateVersion, setTemplateVersion] = useState("1.0");

  // Electronic Acceptance Form State
  const defaultSignatory =
    vendor?.authorizedSignatoryName || vendor?.contactPerson || "";
  const [signatoryName, setSignatoryName] = useState(defaultSignatory);
  const [signatoryDesignation, setSignatoryDesignation] = useState("Authorized Signatory");
  const [agreedConsent, setAgreedConsent] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signingError, setSigningError] = useState("");

  // Sync default signatory when vendor props update
  useEffect(() => {
    if (vendor && !signatoryName) {
      setSignatoryName(vendor.authorizedSignatoryName || vendor.contactPerson || "");
    }
  }, [vendor]);

  // Load preview when modal opens
  useEffect(() => {
    if (!isOpen || !documentType) return;

    let isMounted = true;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      setPreviewError("");
      try {
        const { data } = await client.get(`/vendors/agreements/preview/${documentType}`);
        if (isMounted) {
          setPreviewHtml(data.html || "");
          if (data.templateVersion) setTemplateVersion(data.templateVersion);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load agreement preview:", err);
          setPreviewError(
            err.response?.data?.message ||
              "Unable to load the agreement preview. Please check your network and try again."
          );
        }
      } finally {
        if (isMounted) setLoadingPreview(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, documentType]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !signing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, signing, onClose]);

  // Handle electronic signing submission
  const handleAcceptAndSign = async (e) => {
    e.preventDefault();
    if (!agreedConsent) {
      setSigningError("Please check the declaration checkbox to confirm your agreement.");
      return;
    }
    if (!signatoryName.trim()) {
      setSigningError("Please enter the full legal name of the authorized signatory.");
      return;
    }
    if (!signatoryDesignation.trim()) {
      setSigningError("Please enter the designation / title of the authorized signatory.");
      return;
    }

    setSigning(true);
    setSigningError("");

    try {
      const payload = {
        agreementType: documentType,
        signatoryName: signatoryName.trim(),
        signatoryDesignation: signatoryDesignation.trim(),
        agreed: true,
      };

      const { data } = await client.post("/vendors/agreements/accept", payload);

      if (data.success || data.agreement) {
        if (onAcceptSuccess) {
          await onAcceptSuccess();
        }
        onClose();
      } else {
        setSigningError(data.message || "Failed to execute agreement.");
      }
    } catch (err) {
      console.error("Agreement acceptance error:", err);
      let errMsg = err.response?.data?.message || "";
      if (errMsg.includes("Could not find Chrome") || errMsg.includes("puppeteer")) {
        errMsg = "Document signing engine was temporarily initializing. Please try again.";
      } else if (!errMsg) {
        errMsg = "An error occurred while executing the agreement. Please try again.";
      }
      setSigningError(errMsg);
    } finally {
      setSigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs font-sans animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agreement-modal-title"
    >
      <div className="bg-white w-full max-w-4xl h-[92vh] max-h-[850px] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#d9ddd9]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white via-[#fafbf9] to-[#f4f6f4] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#24302a] text-white flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h2
                id="agreement-modal-title"
                className="text-base sm:text-lg font-bold text-[#24302a] font-serif leading-tight"
              >
                {documentTitle}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[#68736d] mt-0.5">
                <span>Version {templateVersion}</span>
                <span>•</span>
                <span>SIRABA ORGANIC™ Official Master Document</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={signing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close agreement dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Document Viewer */}
        <div className="flex-1 min-h-0 bg-[#fbfcfb] relative flex flex-col">
          {loadingPreview ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={32} className="animate-spin text-[#6d8a72]" />
              <p className="text-xs font-medium">Generating official legal preview...</p>
            </div>
          ) : previewError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle size={36} className="text-red-500 mb-2" />
              <p className="text-sm font-semibold text-slate-800 mb-1">Failed to load preview</p>
              <p className="text-xs text-slate-500 max-w-md mb-4">{previewError}</p>
              <button
                onClick={() => {
                  setLoadingPreview(true);
                  client
                    .get(`/vendors/agreements/preview/${documentType}`)
                    .then(({ data }) => setPreviewHtml(data.html || ""))
                    .catch((err) =>
                      setPreviewError(err.response?.data?.message || "Failed to load preview")
                    )
                    .finally(() => setLoadingPreview(false));
                }}
                className="px-4 py-2 text-xs font-bold bg-[#6d8a72] text-white rounded-lg hover:bg-[#5c7760] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              title={`${documentTitle} Full Text`}
              sandbox="allow-same-origin"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>

        {/* Footer: Execution / Status Actions */}
        <div className="border-t border-[#d9ddd9] bg-white p-4 shrink-0">
          {isExecuted ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle size={18} className="text-emerald-700 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Document Successfully Executed
                  </div>
                  <div className="text-[11px] text-emerald-800/80 mt-0.5">
                    {currentAgreement?.executedAt && (
                      <span>
                        Executed on: {new Date(currentAgreement.executedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        •{" "}
                      </span>
                    )}
                    {currentAgreement?.signatoryName && (
                      <span>
                        Signatory: {currentAgreement.signatoryName}
                        {currentAgreement?.signatoryDesignation ? ` (${currentAgreement.signatoryDesignation})` : ""} •{" "}
                      </span>
                    )}
                    <span>Version {currentAgreement?.executedVersion || templateVersion}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#24302a] text-white rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download size={13} />
                    Download Executed PDF
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAcceptAndSign} className="space-y-3">
              <div className="bg-[#f9faf9] border border-[#d9ddd9] rounded-lg p-3 space-y-3">
                <div className="text-[11px] font-bold tracking-wider text-[#9d8043] uppercase">
                  Electronic Acceptance &amp; Execution
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#24302a] mb-1">
                      Authorized Signatory Full Legal Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      placeholder="Full Legal Name"
                      disabled={signing}
                      className="w-full h-8 px-2.5 text-xs border border-[#cfd5d0] rounded bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#24302a] mb-1">
                      Designation / Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={signatoryDesignation}
                      onChange={(e) => setSignatoryDesignation(e.target.value)}
                      placeholder="e.g., Proprietor, Director, Partner"
                      disabled={signing}
                      className="w-full h-8 px-2.5 text-xs border border-[#cfd5d0] rounded bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedConsent}
                    onChange={(e) => setAgreedConsent(e.target.checked)}
                    disabled={signing}
                    className="mt-0.5 accent-[#6d8a72] w-4 h-4 rounded cursor-pointer"
                    required
                  />
                  <span className="text-[11px] text-slate-700 leading-tight">
                    I, <b>{signatoryName || "[Authorized Signatory]"}</b>, in my capacity as{" "}
                    <b>{signatoryDesignation || "[Designation]"}</b>, confirm that I have read,
                    understood, and agree to the terms of the <b>{documentTitle}</b>. I warrant that I
                    am legally authorized to execute this agreement on behalf of the Vendor.
                  </span>
                </label>
              </div>

              {signingError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{signingError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={signing}
                  className="px-4 py-2 text-xs font-medium border border-[#cfd5d0] rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signing || !agreedConsent || !signatoryName.trim() || !signatoryDesignation.trim()}
                  className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold bg-[#6d8a72] text-white rounded-lg hover:bg-[#5c7760] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {signing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sealing &amp; Executing Document...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Accept &amp; Sign Agreement
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgreementPreviewModal;
