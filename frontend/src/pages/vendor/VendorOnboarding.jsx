import React, { useState, useEffect } from "react";
import { useVendor } from "../../context/VendorContext";
import { useNavigate, Link } from "react-router-dom";
import { Upload, Check, AlertCircle, LogOut, ArrowRight, Save } from "lucide-react";
import Logo from "../../assets/SIRABALOGO.png";
import client from "../../api/client";

const ACTIVE_DOCUMENTS = [
  {
    type: "business_legal_identity",
    title: "Business / Legal Identity Document",
    hint: "Registration, incorporation, proprietorship, partnership, FPO/cooperative or equivalent.",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: true,
  },
  {
    type: "fssai_license",
    title: "FSSAI Licence / Registration",
    hint: "Required for applicable food businesses.",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: true,
  },
  {
    type: "gst_certificate",
    title: "GST Certificate",
    hint: "Upload only if GST Registration is applicable • Max 5MB",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: false, // conditional
  },
  {
    type: "organic_certificate",
    title: "Organic Certificate",
    hint: "PDF, JPG, PNG, WEBP • Max 5MB",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: true,
  },
  {
    type: "product_specification",
    title: "Product Specification / Ingredients",
    hint: "Optional at initial qualification • Max 5MB",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: false,
  },
  {
    type: "product_label_packaging",
    title: "Product Label / Packaging",
    hint: "Upload the current label/packaging showing applicable declarations.",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: true,
  },
  {
    type: "representative_product_image",
    title: "Representative Product Image",
    hint: "JPG, PNG, WEBP • Max 5MB",
    accept: ".jpg,.jpeg,.png,.webp",
    mime: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: true,
  },
  {
    type: "laboratory_report_coa",
    title: "Accredited Laboratory Report / CoA",
    hint: "NABL-accredited or appropriately accredited international laboratory, where available.",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: false,
  },
];

const VendorOnboarding = () => {
  const { vendor, updateOnboarding, addComplianceDoc, logout, refreshVendorStatus } = useVendor();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeStep, setActiveStep] = useState(1); // 1: Business, 2: Certification, 3: Product, 4: Quality, 5: Submit

  // Form State matching Prototype
  const [isBusinessRegistered, setIsBusinessRegistered] = useState(vendor?.isBusinessRegistered || "yes");
  const [gstApplicable, setGstApplicable] = useState(vendor?.gstApplicable || "yes");
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState(vendor?.authorizedSignatoryName || vendor?.panNumber || "");
  const [panNumber, setPanNumber] = useState(vendor?.panNumber || "");
  const [fssaiNumber, setFssaiNumber] = useState(vendor?.fssaiNumber || "");
  const [gstNumber, setGstNumber] = useState(vendor?.gstNumber || "");

  // Certification Details
  const [certificationRoute, setCertificationRoute] = useState(vendor?.organicCertification?.certificationRoute || "npop");
  const [certificationBody, setCertificationBody] = useState(vendor?.organicCertification?.certificationBody || "");
  const [certificateNumber, setCertificateNumber] = useState(vendor?.organicCertification?.certificateNumber || "");
  const [certificateValidUntil, setCertificateValidUntil] = useState(
    vendor?.organicCertification?.certificateValidUntil
      ? new Date(vendor.organicCertification.certificateValidUntil).toISOString().split("T")[0]
      : ""
  );

  // Representative Product
  const [productName, setProductName] = useState(vendor?.representativeProduct?.productName || "");
  const [productCategory, setProductCategory] = useState(vendor?.representativeProduct?.productCategory || "Organic Dairy");
  const [certificationCoverage, setCertificationCoverage] = useState(vendor?.representativeProduct?.certificationCoverage || "yes");

  // Quality & Traceability Declarations
  const [maintainsTraceabilityRecords, setMaintainsTraceabilityRecords] = useState(vendor?.maintainsTraceabilityRecords || "yes");
  const [canProvideBatchSourceEvidence, setCanProvideBatchSourceEvidence] = useState(vendor?.canProvideBatchSourceEvidence || "yes");

  // Document Uploads State
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadingState, setUploadingState] = useState({});

  useEffect(() => {
    if (vendor) {
      if (vendor.status === "approved" || vendor.status === "subadmin_approved") {
        navigate("/vendor/dashboard");
      } else if (vendor.status === "under_review" || vendor.status === "pending") {
        if (vendor.onboardingComplete) {
          navigate("/vendor/under-review");
        }
      }

      // Populate compliance docs already uploaded
      if (vendor.complianceDocuments && vendor.complianceDocuments.length > 0) {
        const docMap = {};
        vendor.complianceDocuments.forEach((doc) => {
          docMap[doc.type] = {
            url: doc.fileUrl,
            name: doc.name,
            id: doc._id,
          };
        });
        setUploadedDocs(docMap);
      }
    }
  }, [vendor, navigate]);

  const handleFileUpload = async (docDef, file) => {
    if (!file) return;

    // Check size & mime
    if (file.size > docDef.maxSize) {
      setError(`File size exceeds maximum allowed (5MB) for ${docDef.title}`);
      return;
    }

    setUploadingState((prev) => ({ ...prev, [docDef.type]: true }));
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `vendors/${vendor?._id || "vendor"}/compliance`);
      formData.append("publicId", `${docDef.type}-${Date.now()}`);

      const { data } = await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Save to backend compliance list
      const saveRes = await addComplianceDoc({
        name: docDef.title,
        type: docDef.type,
        fileUrl: data.url,
      });

      if (saveRes.success) {
        setUploadedDocs((prev) => ({
          ...prev,
          [docDef.type]: {
            url: data.url,
            name: file.name,
          },
        }));
        setSuccess(`${docDef.title} uploaded successfully.`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(saveRes.message || "Failed to save document record.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || `Error uploading ${docDef.title}`);
    } finally {
      setUploadingState((prev) => ({ ...prev, [docDef.type]: false }));
    }
  };

  const handleSaveStep = async (stepNum) => {
    setLoading(true);
    setError("");

    const stepPayload = {};

    if (stepNum === 1) {
      stepPayload.isBusinessRegistered = isBusinessRegistered;
      stepPayload.gstApplicable = gstApplicable;
      stepPayload.authorizedSignatoryName = authorizedSignatoryName;
      stepPayload.panNumber = panNumber;
      stepPayload.fssaiNumber = fssaiNumber;
      stepPayload.gstNumber = gstNumber;
    } else if (stepNum === 2) {
      stepPayload.organicCertification = {
        certificationRoute,
        certificationBody,
        certificateNumber,
        certificateValidUntil,
      };
    } else if (stepNum === 3) {
      stepPayload.representativeProduct = {
        productName,
        productCategory,
        certificationCoverage,
      };
    } else if (stepNum === 4) {
      stepPayload.maintainsTraceabilityRecords = maintainsTraceabilityRecords;
      stepPayload.canProvideBatchSourceEvidence = canProvideBatchSourceEvidence;
    }

    try {
      const res = await updateOnboarding(stepNum, stepPayload);
      if (res.success) {
        setSuccess("Information saved.");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Failed to save progress.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError("");

    const fullPayload = {
      isBusinessRegistered,
      gstApplicable,
      authorizedSignatoryName,
      panNumber,
      fssaiNumber,
      gstNumber,
      organicCertification: {
        certificationRoute,
        certificationBody,
        certificateNumber,
        certificateValidUntil,
      },
      representativeProduct: {
        productName,
        productCategory,
        certificationCoverage,
      },
      maintainsTraceabilityRecords,
      canProvideBatchSourceEvidence,
    };

    try {
      const res = await updateOnboarding(5, fullPayload);
      if (res.success) {
        await refreshVendorStatus();
        navigate("/vendor/under-review");
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Submission failed. Please check required fields and uploads.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f4] text-[#24302a] font-serif">
      <div className="max-w-[860px] mx-auto px-4 py-7 pb-16">
        {/* Brand */}
        <div className="text-center mb-5">
          <div className="text-[13px] tracking-[4px] text-[#9d8043] font-bold">
            SIRABA ORGANIC™
          </div>
          <div className="text-[10px] tracking-[2px] text-slate-500 mt-0.5">
            CERTIFIED • VERIFIED • QUALIFIED
          </div>
        </div>

        {/* Topbar */}
        <div className="flex justify-between items-center text-[11px] text-slate-500 mb-5 font-sans">
          <span className="font-semibold uppercase tracking-wider text-slate-600">Vendor Onboarding</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSaveStep(activeStep)}
              disabled={loading}
              className="hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Save size={13} /> Save Progress
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/vendor/login");
              }}
              className="text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center my-3 mb-7 font-sans">
          {[
            { num: 1, name: "Business" },
            { num: 2, name: "Certification" },
            { num: 3, name: "Product" },
            { num: 4, name: "Quality" },
            { num: 5, name: "Submit" },
          ].map((st, idx, arr) => (
            <React.Fragment key={st.num}>
              <div
                onClick={() => setActiveStep(st.num)}
                className={`flex items-center gap-1.5 text-[11px] cursor-pointer ${
                  activeStep === st.num
                    ? "font-bold text-[#24302a]"
                    : "text-[#8a908c]"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${
                    activeStep > st.num
                      ? "bg-[#6d8a72] border-[#6d8a72] text-white"
                      : activeStep === st.num
                      ? "bg-[#6d8a72] border-[#6d8a72] text-white"
                      : "bg-white border-[#c8cec9] text-[#24302a]"
                  }`}
                >
                  {activeStep > st.num ? "✓" : st.num}
                </div>
                <span className="hidden sm:inline">{st.name}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className="w-8 sm:w-12 h-[1px] bg-[#bfc7c0] mx-1.5 sm:mx-2"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Hero */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-[25px] font-semibold text-[#24302a] mb-1.5">
            Vendor Qualification &amp; Onboarding
          </h1>
          <p className="font-sans text-[13px] leading-relaxed text-[#68736d] max-w-[650px] mx-auto">
            Submit the essential evidence for qualification. SIRABA ORGANIC verifies the information internally and may request additional evidence only where required.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-5 mb-6 font-sans">
          <div className="bg-white border border-[#d9ddd9] rounded-lg p-3 text-center">
            <strong className="block text-[12px] tracking-[0.5px] text-[#24302a]">01 — CERTIFIED™</strong>
            <span className="text-[10px] text-[#68736d]">Organic certification</span>
          </div>
          <div className="bg-white border border-[#d9ddd9] rounded-lg p-3 text-center">
            <strong className="block text-[12px] tracking-[0.5px] text-[#24302a]">02 — VERIFIED™</strong>
            <span className="text-[10px] text-[#68736d]">Evidence &amp; compliance</span>
          </div>
          <div className="bg-white border border-[#d9ddd9] rounded-lg p-3 text-center">
            <strong className="block text-[12px] tracking-[0.5px] text-[#24302a]">03 — QUALIFIED™</strong>
            <span className="text-[10px] text-[#68736d]">Marketplace qualification</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-sans flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-sans flex items-center gap-2">
            <Check size={16} /> {success}
          </div>
        )}

        {/* SECTION 1: Business & Food Safety */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 1</div>
            <h2 className="text-lg font-semibold text-[#24302a] margin-0">Business &amp; Food Safety</h2>
            <div className="font-sans text-[11px] text-[#68736d] mt-1">
              Provide the core business and regulatory documents applicable to your operation.
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
              {/* Is business legally registered */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white sm:col-span-2">
                <div className="text-[12px] font-bold text-[#24302a] mb-1.5 font-serif">
                  Is your business legally registered? <span className="text-[#a04b42]">*</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {["yes", "no", "other"].map((val) => (
                    <label
                      key={val}
                      className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 cursor-pointer text-[11px] ${
                        isBusinessRegistered === val ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold" : "bg-[#fbfcfb] border-[#d5dad6] text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="registered"
                        value={val}
                        checked={isBusinessRegistered === val}
                        onChange={(e) => setIsBusinessRegistered(e.target.value)}
                        className="accent-[#6d8a72]"
                      />
                      {val === "yes" ? "Yes" : val === "no" ? "No" : "Other / Applicable Structure"}
                    </label>
                  ))}
                </div>
              </div>

              {/* Upload 1: Business / Legal Identity Document */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-0.5 font-serif">
                  Business / Legal Identity Document <span className="text-[#a04b42]">*</span>
                </div>
                <div className="text-[10px] text-[#7b837e] mb-2 leading-relaxed">
                  Registration, incorporation, proprietorship, partnership, FPO/cooperative or equivalent.
                </div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload document</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.business_legal_identity && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.business_legal_identity.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.business_legal_identity ? "Uploading..." : uploadedDocs.business_legal_identity ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS[0], e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Upload 2: FSSAI Licence */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-0.5 font-serif">
                  FSSAI Licence / Registration <span className="text-[#a04b42]">*</span>
                </div>
                <div className="text-[10px] text-[#7b837e] mb-2 leading-relaxed">
                  Required for applicable food businesses.
                </div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload FSSAI document</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.fssai_license && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.fssai_license.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.fssai_license ? "Uploading..." : uploadedDocs.fssai_license ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS[1], e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Is GST applicable? */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-1.5 font-serif">
                  Is GST Registration applicable? <span className="text-[#a04b42]">*</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  {[
                    { val: "yes", label: "Yes" },
                    { val: "no", label: "No" },
                    { val: "na", label: "Not Applicable" },
                  ].map((item) => (
                    <label
                      key={item.val}
                      className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 cursor-pointer text-[11px] ${
                        gstApplicable === item.val ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold" : "bg-[#fbfcfb] border-[#d5dad6] text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gst"
                        value={item.val}
                        checked={gstApplicable === item.val}
                        onChange={(e) => setGstApplicable(e.target.value)}
                        className="accent-[#6d8a72]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>

                {/* Conditional Upload 3: GST Certificate */}
                {gstApplicable === "yes" && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-[#24302a] font-serif">GST Certificate <span className="text-[#a04b42]">*</span></div>
                        <div className="text-[10px] text-[#7b837e] mt-0.5">Upload only if applicable • Max 5MB</div>
                        {uploadedDocs.gst_certificate && (
                          <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                            ✓ {uploadedDocs.gst_certificate.name || "Uploaded"}
                          </div>
                        )}
                      </div>
                      <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                        {uploadingState.gst_certificate ? "Uploading..." : uploadedDocs.gst_certificate ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS[2], e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* PAN / Authorized Signatory Details */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-0.5 font-serif">
                  PAN / Authorized Signatory Details <span className="text-[#6e806f] font-normal">• Form Data</span>
                </div>
                <div className="text-[10px] text-[#7b837e] mb-2 leading-relaxed">
                  Enter details in the application rather than uploading duplicate evidence where already captured.
                </div>
                <input
                  type="text"
                  placeholder="PAN Number / Authorized Signatory Name"
                  value={authorizedSignatoryName}
                  onChange={(e) => setAuthorizedSignatoryName(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Organic Certification */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 2</div>
            <h2 className="text-lg font-semibold text-[#24302a]">Organic Certification</h2>
            <div className="font-sans text-[11px] text-[#68736d] mt-1">
              <b>Required:</b> Submit one valid recognized organic certification applicable to the product and market.
            </div>
          </div>

          <div className="p-4 sm:p-5 font-sans space-y-4">
            {/* Route Selection */}
            <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
              <div className="text-[12px] font-bold text-[#24302a] mb-1.5 font-serif">
                Which organic certification route applies to your product? <span className="text-[#a04b42]">*</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { val: "npop", label: "NPOP / India Organic" },
                  { val: "pgs", label: "PGS-India, where applicable" },
                  { val: "usda", label: "USDA Organic" },
                  { val: "eu", label: "EU Organic" },
                  { val: "other", label: "Other recognized certification" },
                ].map((route) => (
                  <label
                    key={route.val}
                    className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 cursor-pointer text-[11px] ${
                      certificationRoute === route.val ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold" : "bg-[#fbfcfb] border-[#d5dad6] text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="organicRoute"
                      value={route.val}
                      checked={certificationRoute === route.val}
                      onChange={(e) => setCertificationRoute(e.target.value)}
                      className="accent-[#6d8a72]"
                    />
                    {route.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Cert Metadata + Upload Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">Certification Body <span className="text-[#a04b42]">*</span></div>
                <input
                  type="text"
                  placeholder="Enter certification body (e.g. OneCert, Control Union)"
                  value={certificationBody}
                  onChange={(e) => setCertificationBody(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">Certificate Number <span className="text-[#a04b42]">*</span></div>
                <input
                  type="text"
                  placeholder="Enter certificate number"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">Certificate Valid Until <span className="text-[#a04b42]">*</span></div>
                <input
                  type="date"
                  value={certificateValidUntil}
                  onChange={(e) => setCertificateValidUntil(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              {/* Upload 4: Organic Certificate */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">Organic Certificate <span className="text-[#a04b42]">*</span></div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload certificate</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.organic_certificate && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.organic_certificate.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.organic_certificate ? "Uploading..." : uploadedDocs.organic_certificate ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS[3], e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-[#f7f8f6] border-l-4 border-[#b99a57] p-3 text-[11px] text-[#5f6862] leading-relaxed rounded-r-md">
              <b>No duplicate upload:</b> You do not need to upload a separate Product Scope Certificate if the submitted certification already establishes that the representative product is covered. SIRABA may request scope/supporting documentation only where product coverage is unclear or additional verification is required.
            </div>
          </div>
        </section>

        {/* SECTION 3: Representative Product */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 3</div>
            <h2 className="text-lg font-semibold text-[#24302a]">Representative Product</h2>
            <div className="font-sans text-[11px] text-[#68736d] mt-1">
              Submit <b>one</b> representative product for initial vendor qualification. Your complete catalogue can be added after vendor approval.
            </div>
          </div>

          <div className="p-4 sm:p-5 font-sans space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">Product Name <span className="text-[#a04b42]">*</span></div>
                <input
                  type="text"
                  placeholder="e.g., Certified Organic Cow Ghee"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">Product Category <span className="text-[#a04b42]">*</span></div>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                >
                  <option value="Organic Dairy">Organic Dairy</option>
                  <option value="Organic Oils & Fats">Organic Oils &amp; Fats</option>
                  <option value="Organic Spices">Organic Spices</option>
                  <option value="Organic Grains & Pulses">Organic Grains &amp; Pulses</option>
                  <option value="Organic Foods">Organic Foods</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white sm:col-span-2">
                <div className="text-[12px] font-bold text-[#24302a] mb-1.5 font-serif">
                  Is this product covered by your submitted organic certification? <span className="text-[#a04b42]">*</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { val: "yes", label: "Yes" },
                    { val: "no", label: "No" },
                    { val: "unsure", label: "Not Sure" },
                  ].map((item) => (
                    <label
                      key={item.val}
                      className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 cursor-pointer text-[11px] ${
                        certificationCoverage === item.val ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold" : "bg-[#fbfcfb] border-[#d5dad6] text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="coverage"
                        value={item.val}
                        checked={certificationCoverage === item.val}
                        onChange={(e) => setCertificationCoverage(e.target.value)}
                        className="accent-[#6d8a72]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Upload 5: Product Spec (Optional) */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-0.5 font-serif">Product Specification / Ingredients <span className="text-[#6e806f] font-normal">• Where Applicable</span></div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3 mt-1.5">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload document</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">Optional at initial qualification • Max 5MB</div>
                    {uploadedDocs.product_specification && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.product_specification.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.product_specification ? "Uploading..." : uploadedDocs.product_specification ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS[4], e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Upload 6: Product Label / Packaging (Required) */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-0.5 font-serif">Product Label / Packaging <span className="text-[#a04b42]">*</span></div>
                <div className="text-[10px] text-[#7b837e] mb-1.5">Upload the current label/packaging showing applicable declarations.</div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload label</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.product_label_packaging && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.product_label_packaging.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.product_label_packaging ? "Uploading..." : uploadedDocs.product_label_packaging ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS[5], e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Upload 7: Representative Product Image (Required) */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white sm:col-span-2">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">Representative Product Image <span className="text-[#a04b42]">*</span></div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload image</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.representative_product_image && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.representative_product_image.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.representative_product_image ? "Uploading..." : uploadedDocs.representative_product_image ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS[6], e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-[#f7f8f6] border-l-4 border-[#b99a57] p-3 text-[11px] text-[#5f6862] leading-relaxed rounded-r-md">
              <b>Important:</b> You are not required to submit your complete product catalogue during vendor onboarding. Once your vendor application is approved, you can add eligible products through the Product Listing section.
            </div>
          </div>
        </section>

        {/* SECTION 4: Quality & Traceability */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 4</div>
            <h2 className="text-lg font-semibold text-[#24302a]">Quality &amp; Traceability</h2>
            <div className="font-sans text-[11px] text-[#68736d] mt-1">
              Keep the evidence simple at onboarding. SIRABA may request additional supporting records based on product risk and verification findings.
            </div>
          </div>

          <div className="p-4 sm:p-5 font-sans space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Upload 8: CoA (Optional) */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-0.5 font-serif">
                  Accredited Laboratory Report / CoA <span className="text-[#6e806f] font-normal">• Recommended</span>
                </div>
                <div className="text-[10px] text-[#7b837e] mb-1.5">
                  NABL-accredited or appropriately accredited international laboratory, where available.
                </div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload report / CoA</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.laboratory_report_coa && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.laboratory_report_coa.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.laboratory_report_coa ? "Uploading..." : uploadedDocs.laboratory_report_coa ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS[7], e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Traceability declaration 1 */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                <div className="text-[12px] font-bold text-[#24302a] mb-1.5 font-serif">
                  Do you maintain product traceability records? <span className="text-[#a04b42]">*</span>
                </div>
                <div className="flex gap-3 text-xs mb-2">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700">
                      <input
                        type="radio"
                        name="trace"
                        value={v}
                        checked={maintainsTraceabilityRecords === v}
                        onChange={(e) => setMaintainsTraceabilityRecords(e.target.value)}
                        className="accent-[#6d8a72]"
                      />
                      {v === "yes" ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
                <div className="text-[10px] text-[#7b837e] leading-relaxed">
                  Records may include source, procurement, production, batch, storage and dispatch information.
                </div>
              </div>

              {/* Traceability declaration 2 */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white sm:col-span-2">
                <div className="text-[12px] font-bold text-[#24302a] mb-1.5 font-serif">
                  Do you maintain records that can support batch/source verification if requested by SIRABA? <span className="text-[#a04b42]">*</span>
                </div>
                <div className="flex gap-4 text-xs">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700">
                      <input
                        type="radio"
                        name="evidence"
                        value={v}
                        checked={canProvideBatchSourceEvidence === v}
                        onChange={(e) => setCanProvideBatchSourceEvidence(e.target.value)}
                        className="accent-[#6d8a72]"
                      />
                      {v === "yes" ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#f7f8f6] border-l-4 border-[#b99a57] p-3 text-[11px] text-[#5f6862] leading-relaxed rounded-r-md">
              <b>No full traceability file required at onboarding.</b> SIRABA does not require vendors to upload every source-farm, procurement, supply-chain or batch record at the initial application stage. Relevant evidence may be requested during verification or product review.
            </div>
          </div>
        </section>

        {/* Summary Box */}
        <div className="mt-5 border border-[#cfd5d0] rounded-xl p-4 sm:p-5 bg-white shadow-sm font-sans">
          <h3 className="text-sm font-bold text-[#24302a] font-serif mb-2">
            Initial Submission — Checklist Summary
          </h3>
          <ul className="pl-5 text-xs leading-relaxed text-[#59635d] list-disc space-y-1">
            <li className={uploadedDocs.business_legal_identity ? "text-emerald-800 font-medium" : ""}>
              Business / Legal Identity document {uploadedDocs.business_legal_identity ? "✓" : "(Required)"}
            </li>
            <li className={uploadedDocs.fssai_license ? "text-emerald-800 font-medium" : ""}>
              FSSAI Licence / Registration {uploadedDocs.fssai_license ? "✓" : "(Required)"}
            </li>
            <li className={gstApplicable !== "yes" || uploadedDocs.gst_certificate ? "text-emerald-800 font-medium" : ""}>
              GST Certificate {gstApplicable === "yes" ? (uploadedDocs.gst_certificate ? "✓" : "(Required when applicable)") : "(Not Applicable)"}
            </li>
            <li className={uploadedDocs.organic_certificate ? "text-emerald-800 font-medium" : ""}>
              One valid recognized Organic Certificate {uploadedDocs.organic_certificate ? "✓" : "(Required)"}
            </li>
            <li className={uploadedDocs.product_label_packaging && uploadedDocs.representative_product_image ? "text-emerald-800 font-medium" : ""}>
              Representative Product (Label + Product Image) {uploadedDocs.product_label_packaging && uploadedDocs.representative_product_image ? "✓" : "(Required)"}
            </li>
            <li>Traceability &amp; Verification declarations</li>
            <li>Laboratory Report / CoA — recommended, not mandatory</li>
          </ul>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center mt-6 font-sans">
          <button
            onClick={() => handleSaveStep(activeStep)}
            disabled={loading}
            className="border border-[#455249] rounded-lg px-4 py-2.5 text-xs text-[#24302a] bg-white hover:bg-slate-50 transition-colors font-medium cursor-pointer"
          >
            ← Save Progress
          </button>

          <button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="bg-[#6d8a72] border border-[#6d8a72] text-white rounded-lg px-6 py-2.5 text-xs font-bold hover:bg-[#5c7760] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            {loading ? "Submitting..." : "Review & Submit →"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-[#7b837e] mt-7 leading-relaxed font-sans">
          <b>SIRABA ORGANIC™ — Certified • Verified • Qualified</b><br />
          Your application is subject to SIRABA ORGANIC's verification and marketplace qualification process.<br />
          Additional evidence may be requested where required by product, certification, regulation or verification findings.
        </div>
      </div>
    </div>
  );
};

export default VendorOnboarding;