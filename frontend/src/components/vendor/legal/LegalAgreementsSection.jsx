import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from "react";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import client from "../../../api/client";
import AgreementCard from "./AgreementCard";
import AgreementPreviewModal from "./AgreementPreviewModal";

/**
 * LegalAgreementsSection:
 * Embeds into Step 7 of VendorOnboarding and VendorDashboard Compliance tab.
 *
 * Exposes:
 * - ref.openModal(docType): allows parent component (or action banner) to open preview directly.
 */
const LegalAgreementsSection = forwardRef(({ vendor, onStatusChange, className = "" }, ref) => {
  const [loading, setLoading] = useState(true);
  const [agreementsStatus, setAgreementsStatus] = useState({
    marketplaceAgreement: { status: "pending" },
    mutualNda: { isRequired: false, status: "not_applicable" },
  });
  const [fetchError, setFetchError] = useState("");

  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    documentType: "vendor-agreement",
    documentTitle: "SIRABA ORGANIC Master Vendor Marketplace Agreement",
    isExecuted: false,
    currentAgreement: null,
  });

  const [downloadingType, setDownloadingType] = useState(null);

  // Authoritative fetch from backend
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");
      const { data } = await client.get("/vendors/agreements/status");
      if (data) {
        setAgreementsStatus(data);
        if (onStatusChangeRef.current) {
          onStatusChangeRef.current(data);
        }
      }
    } catch (err) {
      console.error("Failed to load legal agreement status:", err);
      setFetchError(
        err.response?.data?.message ||
          "Unable to load legal agreement requirements. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Open modal for a specific document
  const openAgreementModal = (docType) => {
    if (docType === "vendor-agreement" || docType === "VENDOR_MARKETPLACE_AGREEMENT") {
      const isExec = agreementsStatus.marketplaceAgreement?.status === "executed";
      setModalConfig({
        isOpen: true,
        documentType: "vendor-agreement",
        documentTitle: "SIRABA ORGANIC Master Vendor Marketplace Agreement",
        isExecuted: isExec,
        currentAgreement: agreementsStatus.marketplaceAgreement,
      });
    } else if (docType === "mutual-nda" || docType === "MUTUAL_NDA") {
      const isExec = agreementsStatus.mutualNda?.status === "executed";
      setModalConfig({
        isOpen: true,
        documentType: "mutual-nda",
        documentTitle: "SIRABA ORGANIC Mutual Non-Disclosure & Confidentiality Agreement",
        isExecuted: isExec,
        currentAgreement: agreementsStatus.mutualNda,
      });
    }
  };

  // Expose openModal to parent components via ref
  useImperativeHandle(ref, () => ({
    openModal: (docType) => openAgreementModal(docType),
    refreshStatus: () => fetchStatus(),
  }));

  // Handle acceptance success: re-fetch authoritative backend state
  const handleAcceptSuccess = async () => {
    await fetchStatus();
  };

  // Authenticated file download handler
  const handleDownloadPdf = async (docType) => {
    setDownloadingType(docType);
    try {
      const token =
        localStorage.getItem("vendorToken") ||
        localStorage.getItem("token") ||
        (() => {
          try {
            return JSON.parse(localStorage.getItem("vendorInfo") || "{}").token;
          } catch (e) {
            return "";
          }
        })();

      const downloadPath = `/vendors/agreements/${docType}/download${
        token ? `?token=${encodeURIComponent(token)}` : ""
      }`;

      const response = await client.get(downloadPath, {
        responseType: "blob",
      });

      // Extract filename from Content-Disposition if present
      let filename = `${docType}.pdf`;
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
      console.error("Document download failed:", err);
      let errorMsg = "Failed to download executed agreement. Please try again.";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.message) errorMsg = parsed.message;
        } catch (e) {}
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      alert(errorMsg);
    } finally {
      setDownloadingType(null);
    }
  };

  const vma = agreementsStatus.marketplaceAgreement || {};
  const nda = agreementsStatus.mutualNda || {};

  return (
    <section
      className={`bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-xs font-sans ${className}`}
    >
      {/* Section Header */}
      <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
        <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold uppercase">
          Legal &amp; Compliance
        </div>
        <h2 className="text-lg font-semibold text-[#24302a] font-serif">
          Marketplace Legal Agreements
        </h2>
        <div className="text-[11px] text-[#68736d] mt-0.5">
          Review, verify, and electronically execute authoritative marketplace agreements for qualification.
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8 gap-2.5 text-slate-500 text-xs">
            <Loader2 size={18} className="animate-spin text-[#6d8a72]" />
            Loading legal agreement status...
          </div>
        ) : fetchError ? (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={fetchStatus}
              className="px-2.5 py-1 text-[11px] font-bold bg-white border border-red-300 rounded hover:bg-red-50 text-red-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* 1. Master Vendor Marketplace Agreement (Mandatory) */}
            <AgreementCard
              title="SIRABA ORGANIC Master Vendor Marketplace Agreement"
              documentType="vendor-agreement"
              isMandatory={true}
              status={vma.status || "pending"}
              executedVersion={vma.executedVersion}
              executedAt={vma.executedAt}
              signatoryName={vma.signatoryName || vendor?.authorizedSignatoryName}
              signatoryDesignation={vma.signatoryDesignation || vendor?.signatoryDesignation}
              description="Authoritative master terms governing vendor qualification, listing, fulfillment, commissions, and platform warranties."
              onReview={() => openAgreementModal("vendor-agreement")}
              onDownload={() => handleDownloadPdf("vendor-agreement")}
              downloading={downloadingType === "vendor-agreement"}
            />

            {/* 2. Mutual NDA & Confidentiality Agreement (Conditional) */}
            <AgreementCard
              title="SIRABA ORGANIC Mutual Non-Disclosure &amp; Confidentiality Agreement"
              documentType="mutual-nda"
              isMandatory={nda.isRequired || false}
              status={nda.isRequired ? (nda.status || "pending") : "not_applicable"}
              executedVersion={nda.executedVersion}
              executedAt={nda.executedAt}
              signatoryName={nda.signatoryName || vendor?.authorizedSignatoryName}
              signatoryDesignation={nda.signatoryDesignation || vendor?.signatoryDesignation}
              description="Bilateral protection for proprietary sourcing channels, organic formulations, and strategic commercial terms."
              onReview={() => openAgreementModal("mutual-nda")}
              onDownload={() => handleDownloadPdf("mutual-nda")}
              downloading={downloadingType === "mutual-nda"}
            />

            <div className="bg-[#f7f8f6] border-l-4 border-[#b99a57] p-3 text-[11px] text-[#5f6862] leading-relaxed rounded-r-md">
              <b>Electronic Execution Integrity:</b> Agreements are rendered verbatim with your verified vendor profile information, electronically signed with tamper-evident audit timestamps, and permanently archived in compliance with the Information Technology Act.
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <AgreementPreviewModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        documentType={modalConfig.documentType}
        documentTitle={modalConfig.documentTitle}
        currentAgreement={modalConfig.currentAgreement}
        isExecuted={modalConfig.isExecuted}
        vendor={vendor}
        onAcceptSuccess={handleAcceptSuccess}
        onDownload={() => handleDownloadPdf(modalConfig.documentType)}
      />
    </section>
  );
});

export default LegalAgreementsSection;
