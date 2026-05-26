import React, { useEffect } from "react";
import {
  ClipboardList,
  ShieldCheck,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle,
  LayoutDashboard,
  Mail,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    id: 1,
    icon: <ShieldCheck size={22} className="text-emerald-600" />,
    title: "Organic Certification Verification",
    description:
      "Vendor must submit a valid NPOP Certification and either USDA Organic Certification or EU Organic Certification for qualification review.",
  },

  {
    id: 2,
    icon: <FileText size={22} className="text-emerald-600" />,
    title: "Laboratory & Product Compliance Review",
    description:
      "Vendor submits NABL-accredited laboratory reports, product specifications, ingredient declarations, and batch identification records.",
  },

  {
    id: 3,
    icon: <ClipboardList size={22} className="text-emerald-600" />,
    title: "Business Verification",
    description:
      "GST verification, FSSAI validation, PAN verification, bank verification, and legal business identity confirmation are completed.",
  },

  {
    id: 4,
    icon: <MapPin size={22} className="text-emerald-600" />,
    title: "Traceability & Sourcing Review",
    description:
      "Vendor provides farm origin details, procurement records, supplier traceability documentation, batch tracking systems, and organic handling records.",
  },

  {
    id: 5,
    icon: <CreditCard size={22} className="text-emerald-600" />,
    title: "Packaging & Compliance Review",
    description:
      "Food-grade packaging compliance, storage procedures, transportation standards, and marketplace compliance requirements are reviewed.",
  },

  {
    id: 6,
    icon: <CheckCircle size={22} className="text-emerald-600" />,
    title: "Final Qualification Approval",
    description:
      "Marketplace approval is granted only after successful verification, compliance assessment, certification validation, and qualification review.",
  },
];

const dashboardFeatures = [
  "ISO 22000 Certification",
  "HACCP Certification",
  "Fair Trade Certification",
  "Regenerative Agriculture Compliance",
  "Export Compliance Documentation",
  "Sustainability & Ethical Sourcing Programs",
];

const WatermarkBg = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden"
    style={{ opacity: 0.04 }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        <pattern
          id="siraba-wm-vog"
          x="0"
          y="0"
          width="180"
          height="180"
          patternUnits="userSpaceOnUse"
        >
          <g transform="translate(90,90)">
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(-20)" />
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(20)" />
            <text x="0" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="28" fill="#16a34a">S</text>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#siraba-wm-vog)" />
    </svg>
  </div>
);

const VendorOnboardingGuide = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full pt-20 bg-background min-h-screen relative">
      <WatermarkBg />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-24">

        {/* Header */}
        <div className="mb-12">
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-3">
            SIRABA ORGANIC™ · Certification | Verification | Qualification
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-3">
            Vendor Onboarding Guide
          </h1>
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em]">
            Siraba Organic Marketplace
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <h2 className="font-heading font-bold text-primary text-lg mb-4">
            Vendor Qualification Standards
          </h2>

          <p className="text-text-secondary leading-relaxed font-light mb-4">
            At SIRABA ORGANIC™, we maintain a strict certification-first onboarding
            model to ensure authenticity, transparency, food safety, and premium
            organic integrity across our marketplace ecosystem.
          </p>

          <p className="text-text-secondary leading-relaxed font-light">
            To qualify as a verified vendor on our platform, applicants must comply
            with mandatory certification, compliance, documentation, traceability,
            and verification requirements.
          </p>

          <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="font-semibold text-primary mb-2">
              Certification-First Marketplace
            </p>

            <p className="text-sm text-text-secondary">
              Only verified and certification-compliant vendors are eligible
              for onboarding onto SIRABA ORGANIC™.
            </p>
          </div>
        </div>

        {/* Eligibility */}
        <div className="mb-10">
            <h2 className="font-heading text-xl md:text-2xl text-primary font-bold mb-5 flex items-center gap-2">
              <ShieldCheck size={22} className="text-emerald-600" />
              Mandatory Certification & Compliance Requirements
            </h2>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-6">

              <div className="space-y-3">

                <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4">
                  ✓ Valid NPOP Certification (Mandatory)
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4">
                  ✓ USDA Organic Certification OR EU Organic Certification
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4">
                  ✓ NABL-Accredited Laboratory Reports
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4">
                  ✓ Product Documentation & Ingredient Records
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4">
                  ✓ Traceable Sourcing Documentation
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4">
                  ✓ Food-Grade Packaging Compliance
                </div>

                <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4">
                  ✓ GST, FSSAI, PAN & Bank Verification
                </div>

              </div>
            </div>
          </div>

        {/* Onboarding Steps */}
        <div className="mb-10">
          <h2 className="font-heading text-xl md:text-2xl text-primary font-bold mb-6">
            Vendor Onboarding Process
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.id} className="flex gap-4">
                {/* Step spine */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-md">
                    {step.id}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-emerald-100 mt-2 mb-0 min-h-[24px]" />
                  )}
                </div>
                {/* Card */}
                <div className="flex-1 bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      {step.icon}
                    </div>
                    <h3 className="font-heading font-bold text-primary text-base">
                      Step {step.id} — {step.title}
                    </h3>
                  </div>
                  <p className="text-text-secondary text-sm font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Process */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-8">
          <h2 className="font-heading text-xl font-bold text-primary mb-3 flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-600" />
            Verification Process
          </h2>
          <p className="text-text-secondary font-light leading-relaxed text-sm">
            SIRABA ORGANIC™ conducts certification validation,
            document verification, product compliance review,
            traceability assessment, and business verification
            before marketplace approval is granted.
          </p>

          <p className="text-text-secondary font-light leading-relaxed text-sm mt-3">
            Vendors may be re-verified periodically to maintain
            marketplace compliance and organic integrity standards.
          </p>
        </div>

        {/* Dashboard Access */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-7 mb-10">
          <h2 className="font-heading text-xl font-bold text-primary mb-3 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-emerald-600" />
            Premium Vendor Priority
          </h2>
          <p className="text-text-secondary font-light text-sm mb-4">
            Once approved, vendors can access the vendor dashboard to:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dashboardFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-emerald-100 shadow-sm">
                <ArrowRight size={13} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-text-secondary font-light">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <h2 className="font-heading text-xl font-bold text-primary mb-4">
            Strategic Marketplace Positioning
          </h2>

          <p className="text-text-secondary leading-relaxed">
            SIRABA ORGANIC™ is a controlled premium organic marketplace where
            certification, traceability, and compliance are mandatory —
            not optional.
          </p>

          <p className="text-text-secondary leading-relaxed mt-4">
            Only verified and certification-compliant vendors are eligible
            for onboarding.
          </p>
        </div>

        {/* Support Footer */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 p-8 text-white shadow-lg text-center">
          <h3 className="font-heading text-xl font-bold mb-2">Support</h3>
          <p className="text-emerald-100 text-sm mb-6">
            For assistance during onboarding, please contact us.
          </p>
          <a
            href="mailto:info@sirabaorganic.com?subject=Vendor%20Onboarding%20-%20Siraba%20Organic"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-md"
          >
            <Mail size={15} />
            info@sirabaorganic.com
          </a>
          <p className="text-emerald-200 text-xs mt-5">
            UDYAM-HR-05-0179395 · www.sirabaorganic.com
          </p>
        </div>

      </div>
    </div>
  );
};

export default VendorOnboardingGuide;