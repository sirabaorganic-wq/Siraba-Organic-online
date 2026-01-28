import React, { useState, useEffect, useMemo } from "react";
import { useVendor } from "../../context/VendorContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building,
  MapPin,
  CreditCard,
  FileText,
  Rocket,
  Star,
  Zap,
  Crown,
  ArrowRight,
  Upload,
  X,
  ArrowLeft,
} from "lucide-react";
import Logo from "../../assets/SIRABALOGO.png";
import client from "../../api/client";

const DOCUMENT_TYPES = [
  {
    type: "business_license",
    label: "Business License / Registration",
    required: true,
  },
  { type: "gst_certificate", label: "GST Certificate" },
  { type: "fssai_license", label: "FSSAI License" },
  { type: "organic_certification", label: "Organic Certification" },
  { type: "pan_card", label: "PAN Card" },
];
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const VendorOnboarding = () => {
  const {
    vendor,
    updateOnboarding,
    selectPlan,
    fetchPlans,
    plans,
    addComplianceDoc,
  } = useVendor();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form data for each step
  const [businessDetails, setBusinessDetails] = useState({
    businessDescription: "",
    website: "",
    gstNumber: "",
    panNumber: "",
    fssaiNumber: "",
  });

  const [addressDetails, setAddressDetails] = useState({
    street: "",
    city: vendor?.address?.city || "",
    state: vendor?.address?.state || "",
    postalCode: vendor?.address?.postalCode || "",
    country: "India",
  });

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    branchName: "",
    upiId: "",
  });

  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [docUploads, setDocUploads] = useState(() =>
    DOCUMENT_TYPES.reduce((acc, doc) => {
      acc[doc.type] = {
        uploading: false,
        progress: 0,
        url: "",
        error: "",
      };
      return acc;
    }, {}),
  );

  useEffect(() => {
    fetchPlans();
    if (vendor) {
      // Pre-fill business details if they exist
      if (vendor.businessDescription || vendor.gstNumber || vendor.panNumber) {
        setBusinessDetails((prev) => ({
          ...prev,
          businessDescription:
            vendor.businessDescription || prev.businessDescription,
          website: vendor.website || prev.website,
          gstNumber: vendor.gstNumber || prev.gstNumber,
          panNumber: vendor.panNumber || prev.panNumber,
          fssaiNumber: vendor.fssaiNumber || prev.fssaiNumber,
        }));
      }

      // Determine correct step
      // Even if backend says step 2 (Address), if we lack basic business details, force Step 1
      const hasBusinessDetails =
        vendor.businessDescription && vendor.businessDescription.length > 0;

      if (
        vendor.onboardingStep &&
        vendor.onboardingStep > 1 &&
        !hasBusinessDetails
      ) {
        setCurrentStep(1);
      } else if (vendor.onboardingStep) {
        setCurrentStep(vendor.onboardingStep);
      }
    }
  }, [vendor]);

  const steps = [
    { id: 1, title: "Business Details", icon: Building },
    { id: 2, title: "Address", icon: MapPin },
    { id: 3, title: "Bank Details", icon: CreditCard },
    { id: 4, title: "Select Plan", icon: Star },
    { id: 5, title: "Documents", icon: FileText },
  ];

  const handleStepSubmit = async (stepData) => {
    setLoading(true);
    setError("");

    try {
      const result = await updateOnboarding(currentStep, stepData);
      if (result.success) {
        if (currentStep < 5) {
          setCurrentStep(currentStep + 1);
        } else {
          // Onboarding complete
          navigate("/vendor/dashboard");
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await selectPlan(selectedPlan, billingCycle);
      if (result.success) {
        // If starter plan, move to next step immediately
        // For paid plans, would integrate payment gateway here
        await handleStepSubmit({ plan: selectedPlan, billingCycle });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to select plan");
    } finally {
      setLoading(false);
    }
  };

  const docLabelMap = useMemo(
    () =>
      DOCUMENT_TYPES.reduce((acc, doc) => {
        acc[doc.type] = doc.label;
        return acc;
      }, {}),
    [],
  );

  const setDocState = (type, payload) => {
    setDocUploads((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...payload },
    }));
  };

  const uploadDocument = async (docType, file) => {
    setDocState(docType, { uploading: true, progress: 0, error: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `vendors/${vendor?._id || "vendor"}/compliance`);
    formData.append("publicId", `${docType}-${Date.now()}`);

    try {
      const { data } = await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const pct = Math.round((event.loaded * 100) / event.total);
          setDocState(docType, { progress: pct });
        },
      });

      const result = await addComplianceDoc({
        name: docLabelMap[docType],
        type: docType,
        fileUrl: data.url,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to save document");
      }

      setDocState(docType, {
        uploading: false,
        progress: 100,
        url: data.url,
        error: "",
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Upload failed";
      setDocState(docType, { uploading: false, error: message });
    }
  };

  const handleFileChange = (docType, file) => {
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setDocState(docType, {
        error: "Unsupported type. Use PDF, JPG, PNG, or WEBP.",
        uploading: false,
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setDocState(docType, {
        error: "File too large. Max 5MB.",
        uploading: false,
      });
      return;
    }

    uploadDocument(docType, file);
  };

  const handleDocumentsSubmit = async () => {
    if (!docUploads.business_license?.url) {
      setError("Please upload your business license or registration document.");
      return;
    }

    await handleStepSubmit({ documentsUploaded: true });
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case "starter":
        return Rocket;
      case "professional":
        return Zap;
      case "enterprise":
        return Crown;
      default:
        return Star;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <span className="text-accent text-xs tracking-[0.2em] uppercase font-bold">
                Step 1 of 5
              </span>
              <h2 className="font-heading text-3xl text-primary mt-2">
                Business Details
              </h2>
              <p className="text-text-secondary mt-2 font-light">
                Tell us more about your business
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 tracking-wide uppercase">
                  Business Description
                </label>
                <textarea
                  value={businessDetails.businessDescription}
                  onChange={(e) =>
                    setBusinessDetails({
                      ...businessDetails,
                      businessDescription: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all bg-background/50"
                  placeholder="Describe your business, what you sell, your specialties..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 tracking-wide uppercase">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={businessDetails.website}
                  onChange={(e) =>
                    setBusinessDetails({
                      ...businessDetails,
                      website: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all bg-background/50"
                  placeholder="https://yourbusiness.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={businessDetails.gstNumber}
                    onChange={(e) =>
                      setBusinessDetails({
                        ...businessDetails,
                        gstNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={businessDetails.panNumber}
                    onChange={(e) =>
                      setBusinessDetails({
                        ...businessDetails,
                        panNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  FSSAI License Number (Optional)
                </label>
                <input
                  type="text"
                  value={businessDetails.fssaiNumber}
                  onChange={(e) =>
                    setBusinessDetails({
                      ...businessDetails,
                      fssaiNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter FSSAI license number"
                />
              </div>
            </div>

            <button
              onClick={() => handleStepSubmit(businessDetails)}
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              {loading ? "Saving..." : "Continue"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Business Address</h2>
              <p className="text-text-secondary">
                Where is your business located?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={addressDetails.street}
                  onChange={(e) =>
                    setAddressDetails({
                      ...addressDetails,
                      street: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Building, Street, Area"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={addressDetails.city}
                    onChange={(e) =>
                      setAddressDetails({
                        ...addressDetails,
                        city: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={addressDetails.state}
                    onChange={(e) =>
                      setAddressDetails({
                        ...addressDetails,
                        state: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={addressDetails.postalCode}
                    onChange={(e) =>
                      setAddressDetails({
                        ...addressDetails,
                        postalCode: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={addressDetails.country}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={() => handleStepSubmit({ address: addressDetails })}
                disabled={
                  loading || !addressDetails.city || !addressDetails.state
                }
                className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {loading ? "Saving..." : "Continue"}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Bank Details</h2>
              <p className="text-text-secondary">For receiving your payouts</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      accountHolderName: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        accountNumber: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        ifscCode: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        bankName: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.branchName}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        branchName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={bankDetails.upiId}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, upiId: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="yourname@upi"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-3 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={() => handleStepSubmit({ bankDetails })}
                disabled={
                  loading || !bankDetails.accountNumber || !bankDetails.ifscCode
                }
                className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {loading ? "Saving..." : "Continue"}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-text-secondary">
                Select the plan that best fits your business needs
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 bg-gray-100 rounded-lg p-2">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-lg transition ${
                  billingCycle === "monthly" ? "bg-white shadow" : ""
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-lg transition ${
                  billingCycle === "yearly" ? "bg-white shadow" : ""
                }`}
              >
                Yearly{" "}
                <span className="text-green-600 text-sm">(Save 17%)</span>
              </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans &&
                Object.entries(plans).map(([key, plan]) => {
                  const Icon = getPlanIcon(key);
                  const price =
                    billingCycle === "yearly"
                      ? plan.priceYearly
                      : plan.priceMonthly;
                  const isSelected = selectedPlan === key;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedPlan(key)}
                      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs rounded-full">
                          {plan.badge}
                        </span>
                      )}

                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${plan.color}20` }}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ color: plan.color }}
                          />
                        </div>
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                      </div>

                      <div className="mb-4">
                        <span className="text-3xl font-bold">
                          {price === 0 ? "Free" : `₹${price.toLocaleString()}`}
                        </span>
                        {price > 0 && (
                          <span className="text-text-secondary text-sm">
                            /{billingCycle === "yearly" ? "year" : "month"}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-text-secondary mb-4">
                        {plan.commissionRate}% platform commission
                      </p>

                      <ul className="space-y-2">
                        {plan.features.slice(0, 5).map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handlePlanSelect}
                disabled={loading}
                className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {loading
                  ? "Processing..."
                  : selectedPlan === "starter"
                    ? "Start Free"
                    : "Continue to Payment"}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Upload Documents</h2>
              <p className="text-text-secondary">
                Upload your compliance documents for verification
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Required Documents:</strong> Upload at least your
                business license or registration document. Additional documents
                like FSSAI, organic certifications will help faster approval.
              </p>
            </div>

            <div className="space-y-4">
              {DOCUMENT_TYPES.map((doc) => {
                const state = docUploads[doc.type];

                return (
                  <div key={doc.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-medium">{doc.label}</p>
                        <p className="text-sm text-text-secondary">
                          PDF, JPG, PNG, WEBP (Max 5MB)
                        </p>
                        {doc.required && (
                          <p className="text-xs text-primary mt-1">Required</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {state?.url && (
                          <a
                            href={state.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent text-sm font-medium hover:text-primary"
                          >
                            View
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById(`upload-${doc.type}`)
                              ?.click()
                          }
                          disabled={state?.uploading}
                          className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                            state?.uploading
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          {state?.uploading
                            ? "Uploading..."
                            : state?.url
                              ? "Replace"
                              : "Upload"}
                        </button>
                      </div>
                    </div>

                    <input
                      id={`upload-${doc.type}`}
                      type="file"
                      className="hidden"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) =>
                        handleFileChange(doc.type, e.target.files?.[0])
                      }
                    />

                    {state?.uploading && (
                      <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 bg-primary transition-all"
                          style={{ width: `${state.progress || 0}%` }}
                        />
                      </div>
                    )}

                    {state?.error && (
                      <p className="text-sm text-red-600 mt-2">{state.error}</p>
                    )}

                    {state?.url && !state?.error && !state?.uploading && (
                      <p className="text-xs text-green-700 mt-2">
                        Uploaded and saved
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 py-3 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handleDocumentsSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {loading ? "Submitting..." : "Submit for Review"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-sm text-text-secondary">
              You can also upload documents later from your dashboard
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-secondary/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img src={Logo} alt="Siraba" className="h-10" />
          </Link>
          <span className="font-subheading text-accent text-sm tracking-[0.1em] uppercase font-bold">
            Vendor Onboarding
          </span>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Exit
          </Link>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-surface border-b border-secondary/10">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.id
                        ? "bg-secondary text-surface"
                        : currentStep === step.id
                          ? "bg-accent text-primary"
                          : "bg-secondary/10 text-text-secondary"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center hidden sm:block font-medium ${
                      currentStep === step.id
                        ? "text-accent"
                        : "text-text-secondary"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 rounded ${
                      currentStep > step.id ? "bg-secondary" : "bg-secondary/10"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-surface rounded-sm shadow-lg p-8 border border-secondary/10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm flex items-center gap-2">
              <X className="w-5 h-5" />
              {error}
            </div>
          )}
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default VendorOnboarding;
