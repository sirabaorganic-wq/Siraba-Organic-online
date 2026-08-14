import React, { useState, useEffect } from "react";
import { useVendor } from "../../context/VendorContext";
import { useNavigate, Link } from "react-router-dom";
import { Upload, Check, AlertCircle, LogOut, ArrowRight, Save, Trash2, Eye } from "lucide-react";
import Logo from "../../assets/SIRABALOGO.png";
import client from "../../api/client";
import { getDocumentViewUrl } from "../../utils/documentViewer";

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
    type: "cancelled_cheque",
    title: "Cancelled Cheque / Bank Passbook",
    hint: "Mandatory • Clear photo or PDF showing Account Holder Name, Account Number, and IFSC Code • Max 5MB",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: true,
  },
  {
    type: "npop_certificate",
    title: "NPOP / India Organic Certificate",
    hint: "Mandatory • PDF, JPG, PNG, WEBP • Max 5MB",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: true,
  },
  {
    type: "usda_organic_certificate",
    title: "USDA Organic Certificate",
    hint: "Mandatory • PDF, JPG, PNG, WEBP • Max 5MB",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: true,
  },
  {
    type: "other_organic_certificate",
    title: "Other Organic Certificate (EU, PGS-India, etc.)",
    hint: "Optional • PDF, JPG, PNG, WEBP • Max 5MB",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: false,
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
    hint: "Appropriately accredited testing laboratory, where available.",
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    mime: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    required: false,
  },
];

const VendorOnboarding = () => {
  const { vendor, updateOnboarding, addComplianceDoc, deleteComplianceDoc, logout, refreshVendorStatus } = useVendor();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeStep, setActiveStep] = useState(1); // 1: Business, 2: Bank, 3: Pickup Address, 4: Cert, 5: Product, 6: Quality, 7: Submit

  // Form State matching Prototype
  const [isBusinessRegistered, setIsBusinessRegistered] = useState(vendor?.isBusinessRegistered || "yes");
  const [gstApplicable, setGstApplicable] = useState(vendor?.gstApplicable || "yes");
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState(vendor?.authorizedSignatoryName || vendor?.panNumber || "");
  const [panNumber, setPanNumber] = useState(vendor?.panNumber || "");
  const [fssaiNumber, setFssaiNumber] = useState(vendor?.fssaiNumber || "");
  const [gstNumber, setGstNumber] = useState(vendor?.gstNumber || "");

  // Bank & Payout Details (NEW)
  const [accountHolderName, setAccountHolderName] = useState(vendor?.bankDetails?.accountHolderName || vendor?.businessName || "");
  const [accountNumber, setAccountNumber] = useState(vendor?.bankDetails?.accountNumber || "");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(vendor?.bankDetails?.accountNumber || "");
  const [bankName, setBankName] = useState(vendor?.bankDetails?.bankName || "");
  const [ifscCode, setIfscCode] = useState(vendor?.bankDetails?.ifscCode || "");
  const [branchName, setBranchName] = useState(vendor?.bankDetails?.branchName || "");
  const [accountType, setAccountType] = useState(vendor?.bankDetails?.accountType || "current");
  const [upiId, setUpiId] = useState(vendor?.bankDetails?.upiId || "");

  // Warehouse & Pickup Address (NEW)
  const [facilityName, setFacilityName] = useState(vendor?.pickupAddress?.facilityName || vendor?.businessName || "");
  const [pickupContactPerson, setPickupContactPerson] = useState(vendor?.pickupAddress?.contactPerson || vendor?.contactPerson || "");
  const [pickupPhone, setPickupPhone] = useState(vendor?.pickupAddress?.phone || vendor?.phone || "");
  const [pickupAddressLine1, setPickupAddressLine1] = useState(vendor?.pickupAddress?.addressLine1 || vendor?.address?.street || "");
  const [pickupAddressLine2, setPickupAddressLine2] = useState(vendor?.pickupAddress?.addressLine2 || "");
  const [pickupCity, setPickupCity] = useState(vendor?.pickupAddress?.city || vendor?.address?.city || "");
  const [pickupState, setPickupState] = useState(vendor?.pickupAddress?.state || vendor?.address?.state || "");
  const [pickupPincode, setPickupPincode] = useState(vendor?.pickupAddress?.pincode || vendor?.address?.postalCode || "");
  const [pickupCountry, setPickupCountry] = useState(vendor?.pickupAddress?.country || "India");

  // Certification Details
  const [certificationRoute, setCertificationRoute] = useState(vendor?.organicCertification?.certificationRoute || "npop");
  
  // Certifications By Route map state
  const [certificationsByRoute, setCertificationsByRoute] = useState(() => {
    const initialMap = {
      npop: { certificationBody: "", certificateNumber: "", certificateValidUntil: "" },
      usda: { certificationBody: "", certificateNumber: "", certificateValidUntil: "" },
      pgs: { certificationBody: "", certificateNumber: "", certificateValidUntil: "" },
      eu: { certificationBody: "", certificateNumber: "", certificateValidUntil: "" },
      other: { certificationBody: "", certificateNumber: "", certificateValidUntil: "" },
    };

    const savedByRoute = vendor?.organicCertification?.certificationsByRoute || {};
    Object.keys(initialMap).forEach((routeKey) => {
      if (savedByRoute[routeKey]) {
        initialMap[routeKey] = {
          certificationBody: savedByRoute[routeKey].certificationBody || "",
          certificateNumber: savedByRoute[routeKey].certificateNumber || "",
          certificateValidUntil: savedByRoute[routeKey].certificateValidUntil
            ? new Date(savedByRoute[routeKey].certificateValidUntil).toISOString().split("T")[0]
            : "",
        };
      }
    });

    const currentRoute = vendor?.organicCertification?.certificationRoute || "npop";
    if (vendor?.organicCertification?.certificationBody && !initialMap[currentRoute]?.certificationBody) {
      initialMap[currentRoute] = {
        certificationBody: vendor.organicCertification.certificationBody || "",
        certificateNumber: vendor.organicCertification.certificateNumber || "",
        certificateValidUntil: vendor.organicCertification.certificateValidUntil
          ? new Date(vendor.organicCertification.certificateValidUntil).toISOString().split("T")[0]
          : "",
      };
    }

    return initialMap;
  });

  const activeRouteData = certificationsByRoute[certificationRoute] || {
    certificationBody: "",
    certificateNumber: "",
    certificateValidUntil: "",
  };

  const [certificationBody, setCertificationBody] = useState(
    activeRouteData.certificationBody || vendor?.organicCertification?.certificationBody || ""
  );
  const [certificateNumber, setCertificateNumber] = useState(
    activeRouteData.certificateNumber || vendor?.organicCertification?.certificateNumber || ""
  );
  const [certificateValidUntil, setCertificateValidUntil] = useState(
    activeRouteData.certificateValidUntil ||
      (vendor?.organicCertification?.certificateValidUntil
        ? new Date(vendor.organicCertification.certificateValidUntil).toISOString().split("T")[0]
        : "")
  );

  const handleCertInputChange = (field, value) => {
    if (field === "certificationBody") setCertificationBody(value);
    if (field === "certificateNumber") setCertificateNumber(value);
    if (field === "certificateValidUntil") setCertificateValidUntil(value);

    setCertificationsByRoute((prev) => ({
      ...prev,
      [certificationRoute]: {
        ...prev[certificationRoute],
        [field]: value,
      },
    }));
  };

  const handleRouteSwitch = (newRoute) => {
    // Save current input values into map
    const updatedMap = {
      ...certificationsByRoute,
      [certificationRoute]: {
        certificationBody,
        certificateNumber,
        certificateValidUntil,
      },
    };
    setCertificationsByRoute(updatedMap);
    setCertificationRoute(newRoute);

    // Load values for newRoute
    const targetData = updatedMap[newRoute] || { certificationBody: "", certificateNumber: "", certificateValidUntil: "" };
    setCertificationBody(targetData.certificationBody || "");
    setCertificateNumber(targetData.certificateNumber || "");
    setCertificateValidUntil(targetData.certificateValidUntil || "");
  };

  const handleSaveRouteDetails = async (routeToSave = certificationRoute) => {
    const updatedMap = {
      ...certificationsByRoute,
      [routeToSave]: {
        certificationBody,
        certificateNumber,
        certificateValidUntil,
      },
    };
    setCertificationsByRoute(updatedMap);

    const routeLabel =
      routeToSave === "npop"
        ? "NPOP / India Organic"
        : routeToSave === "usda"
        ? "USDA Organic"
        : routeToSave === "pgs"
        ? "PGS-India"
        : routeToSave === "eu"
        ? "EU Organic"
        : "Other";

    try {
      const res = await updateOnboarding(2, {
        organicCertification: {
          certificationRoute: routeToSave,
          certificationBody,
          certificateNumber,
          certificateValidUntil,
          certificationsByRoute: updatedMap,
        },
      });

      if (res.success) {
        setSuccess(`Saved details for ${routeLabel} certification!`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.message || "Failed to save certification details.");
      }
    } catch (err) {
      setError("Failed to save certification details.");
    }
  };

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
        const otherDocs = [];
        vendor.complianceDocuments.forEach((doc) => {
          if (doc.type === "other_organic_certificate" || doc.type.startsWith("other_organic_certificate")) {
            otherDocs.push({
              url: doc.fileUrl,
              name: doc.name,
              id: doc._id,
              type: doc.type,
            });
          } else {
            docMap[doc.type] = {
              url: doc.fileUrl,
              name: doc.name,
              id: doc._id,
            };
          }
        });
        docMap.other_organic_certificates = otherDocs;
        setUploadedDocs(docMap);
      }

      if (vendor.onboardingStep && vendor.onboardingStep >= 1 && vendor.onboardingStep <= 7) {
        setActiveStep(vendor.onboardingStep);
      }
    }
  }, [vendor, navigate]);

  const handleOtherCertFileUpload = async (file) => {
    if (!file) return;

    const currentList = uploadedDocs.other_organic_certificates || [];
    if (currentList.length >= 5) {
      setError("Maximum limit of 5 files reached for Other Organic Certificates.");
      return;
    }

    const docDef = ACTIVE_DOCUMENTS.find((d) => d.type === "other_organic_certificate");
    if (file.size > (docDef?.maxSize || 5 * 1024 * 1024)) {
      setError(`File size exceeds maximum allowed (5MB) for ${file.name}`);
      return;
    }

    setUploadingState((prev) => ({ ...prev, other_organic_certificate: true }));
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `vendors/${vendor?._id || "vendor"}/compliance`);
      formData.append("publicId", `other-organic-${Date.now()}`);

      const { data } = await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const docName = `Other Organic Certificate #${currentList.length + 1} (${file.name})`;
      const saveRes = await addComplianceDoc({
        name: docName,
        type: "other_organic_certificate",
        fileUrl: data.url,
      });

      if (saveRes.success) {
        setUploadedDocs((prev) => ({
          ...prev,
          other_organic_certificates: [
            ...(prev.other_organic_certificates || []),
            {
              url: data.url,
              name: docName,
              id: saveRes.doc?._id || `temp-${Date.now()}`,
            },
          ],
        }));
        setSuccess("Other Organic Certificate uploaded successfully.");
        setTimeout(() => setSuccess(""), 3000);
        refreshVendorStatus();
      } else {
        setError(saveRes.message || "Failed to save document record.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Error uploading document");
    } finally {
      setUploadingState((prev) => ({ ...prev, other_organic_certificate: false }));
    }
  };

  const handleDeleteOtherCertDoc = async (docId) => {
    try {
      const res = await deleteComplianceDoc(docId);
      if (res.success) {
        setUploadedDocs((prev) => ({
          ...prev,
          other_organic_certificates: (prev.other_organic_certificates || []).filter((d) => d.id !== docId),
        }));
        setSuccess("Document deleted.");
        setTimeout(() => setSuccess(""), 2000);
        refreshVendorStatus();
      } else {
        setError(res.message || "Failed to delete document.");
      }
    } catch (err) {
      setError("Failed to delete document.");
    }
  };

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
      if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
        setError("Account numbers do not match.");
        setLoading(false);
        return;
      }
      stepPayload.bankDetails = {
        accountHolderName,
        accountNumber,
        bankName,
        ifscCode,
        branchName,
        accountType,
        upiId,
      };
    } else if (stepNum === 3) {
      stepPayload.pickupAddress = {
        facilityName,
        contactPerson: pickupContactPerson,
        phone: pickupPhone,
        addressLine1: pickupAddressLine1,
        addressLine2: pickupAddressLine2,
        city: pickupCity,
        state: pickupState,
        pincode: pickupPincode,
        country: pickupCountry,
      };
    } else if (stepNum === 4) {
      stepPayload.organicCertification = {
        certificationRoute,
        certificationBody,
        certificateNumber,
        certificateValidUntil,
        certificationsByRoute: {
          ...certificationsByRoute,
          [certificationRoute]: {
            certificationBody,
            certificateNumber,
            certificateValidUntil,
          },
        },
      };
    } else if (stepNum === 5) {
      stepPayload.representativeProduct = {
        productName,
        productCategory,
        certificationCoverage,
      };
    } else if (stepNum === 6) {
      stepPayload.maintainsTraceabilityRecords = maintainsTraceabilityRecords;
      stepPayload.canProvideBatchSourceEvidence = canProvideBatchSourceEvidence;
    }

    try {
      const res = await updateOnboarding(stepNum, stepPayload);
      if (res.success) {
        setSuccess(`Step ${stepNum} saved successfully! Moving to next step...`);
        const nextStep = Math.min(stepNum + 1, 7);
        setActiveStep(nextStep);
        if (refreshVendorStatus) await refreshVendorStatus();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Failed to save progress.");
    } finally {
      setLoading(false);
    }
  };

  // Step Completion Determination
  const isStepComplete = (stepNum) => {
    const dbStep = vendor?.onboardingStep || 1;
    if (dbStep > stepNum) return true;

    if (stepNum === 1) {
      return Boolean(uploadedDocs.business_legal_identity || uploadedDocs.fssai_license || vendor?.panNumber || authorizedSignatoryName);
    }
    if (stepNum === 2) {
      return Boolean(accountNumber || vendor?.bankDetails?.accountNumber);
    }
    if (stepNum === 3) {
      return Boolean(pickupAddressLine1 || vendor?.pickupAddress?.addressLine1);
    }
    if (stepNum === 4) {
      return Boolean(uploadedDocs.npop_certificate || uploadedDocs.usda_organic_certificate || certificateNumber || vendor?.organicCertification?.certificateNumber);
    }
    if (stepNum === 5) {
      return Boolean(uploadedDocs.representative_product_image || productName || vendor?.representativeProduct?.productName);
    }
    if (stepNum === 6) {
      return Boolean(maintainsTraceabilityRecords && canProvideBatchSourceEvidence);
    }
    if (stepNum === 7) {
      return Boolean(vendor?.onboardingComplete);
    }
    return false;
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError("");

    if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
      setError("Account numbers do not match.");
      setLoading(false);
      return;
    }

    const fullPayload = {
      isBusinessRegistered,
      gstApplicable,
      authorizedSignatoryName,
      panNumber,
      fssaiNumber,
      gstNumber,
      bankDetails: {
        accountHolderName,
        accountNumber,
        bankName,
        ifscCode,
        branchName,
        accountType,
        upiId,
      },
      pickupAddress: {
        facilityName,
        contactPerson: pickupContactPerson,
        phone: pickupPhone,
        addressLine1: pickupAddressLine1,
        addressLine2: pickupAddressLine2,
        city: pickupCity,
        state: pickupState,
        pincode: pickupPincode,
        country: pickupCountry,
      },
      organicCertification: {
        certificationRoute,
        certificationBody,
        certificateNumber,
        certificateValidUntil,
        certificationsByRoute: {
          ...certificationsByRoute,
          [certificationRoute]: {
            certificationBody,
            certificateNumber,
            certificateValidUntil,
          },
        },
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
      const res = await updateOnboarding(7, fullPayload);
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
        <div className="flex items-center justify-center my-3 mb-7 font-sans overflow-x-auto py-2">
          {[
            { num: 1, name: "Business Legal" },
            { num: 2, name: "Bank Details" },
            { num: 3, name: "Pickup Address" },
            { num: 4, name: "Certification" },
            { num: 5, name: "Product Info" },
            { num: 6, name: "Quality" },
            { num: 7, name: "Submit" },
          ].map((st, idx, arr) => {
            const completed = isStepComplete(st.num);
            const active = activeStep === st.num;
            const connectorDone = isStepComplete(st.num) || (vendor?.onboardingStep || 1) > st.num;

            return (
              <React.Fragment key={st.num}>
                <div
                  onClick={() => setActiveStep(st.num)}
                  className={`flex items-center gap-1.5 text-[11px] cursor-pointer whitespace-nowrap transition-all ${
                    active
                      ? "font-bold text-[#24302a]"
                      : completed
                      ? "font-semibold text-emerald-800"
                      : "text-[#8a908c]"
                  }`}
                  title={`Step ${st.num}: ${st.name} ${completed ? "(Completed)" : ""}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-bold transition-all ${
                      completed
                        ? "bg-[#6d8a72] border-[#6d8a72] text-white shadow-sm"
                        : active
                        ? "bg-[#24302a] border-[#24302a] text-white shadow-sm ring-2 ring-[#6d8a72]/30"
                        : "bg-white border-[#c8cec9] text-[#24302a]"
                    }`}
                  >
                    {completed ? "✓" : st.num}
                  </div>
                  <span className="hidden md:inline">{st.name}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`w-4 md:w-8 h-[2px] mx-1 transition-all ${
                      connectorDone ? "bg-[#6d8a72]" : "bg-[#bfc7c0]"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            );
          })}
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
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">
                  Is GST Registration applicable to your business? <span className="text-[#a04b42]">*</span>
                </div>
                <div className="flex gap-3 text-xs mb-2">
                  {[
                    { val: "yes", label: "Yes" },
                    { val: "no", label: "No / Exempt" },
                  ].map((item) => (
                    <label key={item.val} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700">
                      <input
                        type="radio"
                        name="gstApp"
                        value={item.val}
                        checked={gstApplicable === item.val}
                        onChange={(e) => setGstApplicable(e.target.value)}
                        className="accent-[#6d8a72]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
                <div className="text-[10px] text-[#7b837e] leading-relaxed">
                  If exempt under applicable turnover thresholds or exempt goods categories, select No.
                </div>
              </div>

              {/* Upload 3: GST Certificate (Conditional) */}
              {gstApplicable === "yes" && (
                <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
                  <div className="text-[12px] font-bold text-[#24302a] mb-0.5 font-serif">
                    GST Certificate <span className="text-[#a04b42]">*</span>
                  </div>
                  <div className="text-[10px] text-[#7b837e] mb-2 leading-relaxed">
                    Upload your valid GST Certificate document.
                  </div>
                  <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload GST document</div>
                      <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
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

        {/* SECTION 2: Bank & Account Details (NEW) */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 2</div>
            <h2 className="text-lg font-semibold text-[#24302a]">Bank &amp; Payout Details</h2>
            <div className="font-sans text-[11px] text-[#68736d] mt-1">
              Provide your official business bank account details for payouts, settlements, and tax invoices.
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Account Holder Name <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Siraba Organics Pvt Ltd"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Bank Name <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank / ICICI Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Account Number <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Bank Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Re-enter Account Number <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Confirm Bank Account Number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72] font-mono"
                />
                {accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber && (
                  <span className="text-[10px] text-red-600 font-bold mt-0.5 block">Account numbers do not match</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  IFSC Code <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Branch Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. MG Road Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Account Type <span className="text-[#a04b42]">*</span>
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                >
                  <option value="current">Current Account</option>
                  <option value="savings">Savings Account</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. business@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              {/* Mandatory Cancelled Cheque / Passbook Upload */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white sm:col-span-2">
                <div className="text-[12px] font-bold text-[#24302a] mb-0.5 font-serif">
                  Cancelled Cheque / Bank Passbook / Statement <span className="text-[#a04b42]">*</span>
                </div>
                <div className="text-[10px] text-[#7b837e] mb-2 leading-relaxed">
                  Upload a clear image or PDF of a cancelled cheque or bank passbook showing Account Holder Name, Account Number, and IFSC Code for verification.
                </div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload Cancelled Cheque / Bank Document</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.cancelled_cheque && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate flex items-center gap-1">
                        ✓ {uploadedDocs.cancelled_cheque.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.cancelled_cheque ? "Uploading..." : uploadedDocs.cancelled_cheque ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS.find(d => d.type === "cancelled_cheque"), e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Warehouse & Pickup Address (NEW) */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 3</div>
            <h2 className="text-lg font-semibold text-[#24302a]">Warehouse &amp; Pickup Address</h2>
            <div className="font-sans text-[11px] text-[#68736d] mt-1">
              Shiprocket courier partners will pick up customer orders directly from this location.
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Warehouse / Facility Name <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Farm Facility / Central Warehouse"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Dispatch Contact Person <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contact person for courier pickup"
                  value={pickupContactPerson}
                  onChange={(e) => setPickupContactPerson(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Dispatch Contact Phone <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Pincode <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit Pincode"
                  value={pickupPincode}
                  onChange={(e) => setPickupPincode(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72] font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Address Line 1 <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Building/Plot No, Street Name, Industrial Area"
                  value={pickupAddressLine1}
                  onChange={(e) => setPickupAddressLine1(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-[#ffffff] text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  Address Line 2 (Landmark)
                </label>
                <input
                  type="text"
                  placeholder="Landmark, Area, Village/Tehsil"
                  value={pickupAddressLine2}
                  onChange={(e) => setPickupAddressLine2(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  City / District <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="City Name"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#24302a] mb-1 font-serif">
                  State <span className="text-[#a04b42]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="State Name"
                  value={pickupState}
                  onChange={(e) => setPickupState(e.target.value)}
                  className="w-full h-9 border border-[#cfd5d0] rounded px-2.5 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Organic Certification */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 4</div>
            <h2 className="text-lg font-semibold text-[#24302a]">Organic Certification</h2>
            <div className="font-sans text-[11px] text-[#68736d] mt-1">
              <b>Required:</b> Submit one valid recognized organic certification applicable to the product and market.
            </div>
          </div>

          <div className="p-4 sm:p-5 font-sans space-y-4">
            {/* Route Selection */}
            <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white">
              <div className="text-[12px] font-bold text-[#24302a] mb-1.5 font-serif flex items-center justify-between">
                <span>Which organic certification route applies to your product? <span className="text-[#a04b42]">*</span></span>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-sans font-bold border border-emerald-200">
                  Select &amp; Fill for each certification
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { val: "npop", label: "NPOP / India Organic" },
                  { val: "pgs", label: "PGS-India, where applicable" },
                  { val: "usda", label: "USDA Organic" },
                  { val: "eu", label: "EU Organic" },
                  { val: "other", label: "Other recognized certification" },
                ].map((route) => {
                  const hasData = certificationsByRoute[route.val]?.certificationBody && certificationsByRoute[route.val]?.certificateNumber;
                  return (
                    <label
                      key={route.val}
                      onClick={() => handleRouteSwitch(route.val)}
                      className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 cursor-pointer text-[11px] transition-all ${
                        certificationRoute === route.val
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-sm"
                          : "bg-[#fbfcfb] border-[#d5dad6] text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="organicRoute"
                        value={route.val}
                        checked={certificationRoute === route.val}
                        onChange={() => {}}
                        className="accent-[#6d8a72]"
                      />
                      {route.label}
                      {hasData && <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded-full">✓ Saved</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Saved Routes Status Overview */}
            <div className="bg-[#f8f9f7] border border-[#d9ddd9] rounded-lg p-3 text-xs">
              <div className="text-[11px] font-bold text-[#24302a] mb-1 font-serif flex items-center justify-between">
                <span>Certification Details Summary (Saved per route):</span>
                <span className="text-[10px] text-slate-500 font-sans font-normal">Switch tabs to view/edit</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className={`p-2 rounded border ${certificationsByRoute.npop?.certificationBody ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                  <strong className="block text-[11px]">NPOP / India Organic:</strong>
                  {certificationsByRoute.npop?.certificationBody ? (
                    <span>✓ Body: <b>{certificationsByRoute.npop.certificationBody}</b> | No: <b>{certificationsByRoute.npop.certificateNumber}</b></span>
                  ) : (
                    <em>Details pending - Select NPOP above to enter details</em>
                  )}
                </div>
                <div className={`p-2 rounded border ${certificationsByRoute.usda?.certificationBody ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                  <strong className="block text-[11px]">USDA Organic:</strong>
                  {certificationsByRoute.usda?.certificationBody ? (
                    <span>✓ Body: <b>{certificationsByRoute.usda.certificationBody}</b> | No: <b>{certificationsByRoute.usda.certificateNumber}</b></span>
                  ) : (
                    <em>Details pending - Select USDA Organic above to enter details</em>
                  )}
                </div>
              </div>
            </div>

            {/* Active Route Header & Form inputs */}
            <div className="border border-[#6d8a72] rounded-lg p-3 bg-gradient-to-br from-white to-[#f7f9f7] shadow-sm">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-emerald-100">
                <div className="text-[12px] font-bold text-[#24302a] font-serif flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6d8a72]"></span>
                  Active Route Details: <span className="text-emerald-900 font-extrabold uppercase">
                    {certificationRoute === "npop" ? "NPOP / India Organic" : certificationRoute === "usda" ? "USDA Organic" : certificationRoute === "pgs" ? "PGS-India" : certificationRoute === "eu" ? "EU Organic" : "Other"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveRouteDetails(certificationRoute)}
                  className="bg-[#6d8a72] hover:bg-[#5a745f] text-white text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  ✓ Save Details for {certificationRoute.toUpperCase()}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-2.5 rounded border border-[#cfd5d0]">
                  <div className="text-[11px] font-bold text-[#24302a] mb-1 font-serif">Certification Body <span className="text-[#a04b42]">*</span></div>
                  <input
                    type="text"
                    placeholder="e.g. OneCert, Control Union"
                    value={certificationBody}
                    onChange={(e) => handleCertInputChange("certificationBody", e.target.value)}
                    className="w-full h-8 border border-[#cfd5d0] rounded px-2 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                  />
                </div>

                <div className="bg-white p-2.5 rounded border border-[#cfd5d0]">
                  <div className="text-[11px] font-bold text-[#24302a] mb-1 font-serif">Certificate Number <span className="text-[#a04b42]">*</span></div>
                  <input
                    type="text"
                    placeholder="Enter certificate number"
                    value={certificateNumber}
                    onChange={(e) => handleCertInputChange("certificateNumber", e.target.value)}
                    className="w-full h-8 border border-[#cfd5d0] rounded px-2 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                  />
                </div>

                <div className="bg-white p-2.5 rounded border border-[#cfd5d0]">
                  <div className="text-[11px] font-bold text-[#24302a] mb-1 font-serif">Certificate Valid Until <span className="text-[#a04b42]">*</span></div>
                  <input
                    type="date"
                    value={certificateValidUntil}
                    onChange={(e) => handleCertInputChange("certificateValidUntil", e.target.value)}
                    className="w-full h-8 border border-[#cfd5d0] rounded px-2 text-xs bg-white text-[#24302a] focus:outline-none focus:border-[#6d8a72]"
                  />
                </div>
              </div>
            </div>

              {/* Upload 4a: NPOP Certificate (Mandatory) */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white sm:col-span-2">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">
                  NPOP / India Organic Certificate <span className="text-[#a04b42]">* Mandatory</span>
                </div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload NPOP Certificate</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.npop_certificate && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.npop_certificate.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.npop_certificate ? "Uploading..." : uploadedDocs.npop_certificate ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS.find(d => d.type === "npop_certificate"), e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Upload 4b: USDA Organic Certificate (Mandatory) */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white sm:col-span-2">
                <div className="text-[12px] font-bold text-[#24302a] mb-1 font-serif">
                  USDA Organic Certificate <span className="text-[#a04b42]">* Mandatory</span>
                </div>
                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload USDA Certificate</div>
                    <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB</div>
                    {uploadedDocs.usda_organic_certificate && (
                      <div className="text-[10px] text-[#6d8a72] font-bold mt-1 truncate">
                        ✓ {uploadedDocs.usda_organic_certificate.name || "Uploaded"}
                      </div>
                    )}
                  </div>
                  <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                    {uploadingState.usda_organic_certificate ? "Uploading..." : uploadedDocs.usda_organic_certificate ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS.find(d => d.type === "usda_organic_certificate"), e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Upload 4c: Other Organic Certificate (Optional - Up to 5 files) */}
              <div className="border border-[#d9ddd9] rounded-lg p-3 bg-white sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[12px] font-bold text-[#24302a] font-serif">
                    Other Organic Certificates (EU, PGS-India, etc.) <span className="text-[#6e806f] font-normal">• Optional (Up to 5 files)</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#6d8a72] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {(uploadedDocs.other_organic_certificates || []).length} / 5 files uploaded
                  </span>
                </div>

                <div className="border border-dashed border-[#c8cec9] rounded-lg p-3 bg-[#fbfcfb]">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-[#24302a] font-serif">Upload Additional Certificates</div>
                      <div className="text-[10px] text-[#7b837e] mt-0.5">PDF, JPG, PNG, WEBP • Max 5MB per file (Upload up to 5 certificates)</div>
                    </div>
                    {(uploadedDocs.other_organic_certificates || []).length < 5 ? (
                      <label className="border border-[#4d5b52] rounded-md bg-white px-3 py-1.5 text-[10px] font-medium text-[#24302a] cursor-pointer hover:bg-slate-50 flex-shrink-0">
                        {uploadingState.other_organic_certificate ? "Uploading..." : "+ Add Certificate File"}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleOtherCertFileUpload(e.target.files[0]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                        Limit Reached (5/5)
                      </span>
                    )}
                  </div>

                  {/* Uploaded files list */}
                  {(uploadedDocs.other_organic_certificates || []).length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-[#24302a] uppercase tracking-wider">Uploaded Documents:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {uploadedDocs.other_organic_certificates.map((doc, idx) => (
                          <div key={doc.id || idx} className="flex items-center justify-between bg-white border border-[#d5dad6] rounded p-2 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                              <span className="text-emerald-700 font-bold">✓</span>
                              <span className="truncate text-[11px] text-slate-800 font-medium">{doc.name || `Certificate ${idx + 1}`}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <a
                                href={getDocumentViewUrl(doc.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded"
                                title="View document"
                              >
                                <Eye size={13} />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteOtherCertDoc(doc.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                                title="Delete document"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            <div className="bg-[#f7f8f6] border-l-4 border-[#b99a57] p-3 text-[11px] text-[#5f6862] leading-relaxed rounded-r-md">
              <b>No duplicate upload:</b> You do not need to upload a separate Product Scope Certificate if the submitted certification already establishes that the representative product is covered. SIRABA may request scope/supporting documentation only where product coverage is unclear or additional verification is required.
            </div>
          </div>
        </section>

        {/* SECTION 5: Representative Product */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 5</div>
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
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS.find(d => d.type === "product_specification"), e.target.files[0])}
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
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS.find(d => d.type === "product_label_packaging"), e.target.files[0])}
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
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS.find(d => d.type === "representative_product_image"), e.target.files[0])}
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

        {/* SECTION 6: Quality & Traceability */}
        <section className="bg-white border border-[#d9ddd9] rounded-xl my-4 overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-[#d9ddd9] bg-gradient-to-r from-white to-[#fafbf9]">
            <div className="text-[9px] tracking-[1.6px] text-[#9d8043] font-bold">SECTION 6</div>
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
                  Appropriately accredited testing laboratory evidence, where available.
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
                      onChange={(e) => handleFileUpload(ACTIVE_DOCUMENTS.find(d => d.type === "laboratory_report_coa"), e.target.files[0])}
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
            <li className={uploadedDocs.npop_certificate ? "text-emerald-800 font-medium" : ""}>
              NPOP / India Organic Certificate {uploadedDocs.npop_certificate ? "✓" : "(Required)"}
            </li>
            <li className={uploadedDocs.usda_organic_certificate ? "text-emerald-800 font-medium" : ""}>
              USDA Organic Certificate {uploadedDocs.usda_organic_certificate ? "✓" : "(Required)"}
            </li>
            <li className={uploadedDocs.other_organic_certificate ? "text-emerald-800 font-medium" : ""}>
              Other Organic Certificate {uploadedDocs.other_organic_certificate ? "✓" : "(Optional)"}
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