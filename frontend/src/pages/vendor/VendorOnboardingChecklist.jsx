import React, { useEffect, useState } from "react";
import {
  Building,
  ShieldCheck,
  Package,
  Image,
  ClipboardCheck,
  DollarSign,
  Truck,
  Mail,
  CheckCircle,
} from "lucide-react";

const sections = [
  {
    id: "certifications",
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    title: "Organic Certification Requirements",
    items: [
      "Valid NPOP Certification (Mandatory)",
      "USDA Organic Certification OR EU Organic Certification",
      "Certification validity period is active",
      "Certification scope matches product category",
    ],
  },

  {
    id: "laboratory",
    icon: <ClipboardCheck size={20} className="text-emerald-600" />,
    title: "Laboratory & Product Compliance",
    items: [
      "NABL-accredited laboratory test reports",
      "Pesticide residue testing reports",
      "Heavy metal / contamination testing reports",
      "Product specification sheets",
      "Ingredient declarations",
      "Batch identification records",
    ],
  },

  {
    id: "business",
    icon: <Building size={20} className="text-emerald-600" />,
    title: "Business Verification Documents",
    items: [
      "GST Registration Certificate",
      "FSSAI License / Registration",
      "PAN Card",
      "Business Address Proof",
      "Cancelled Cheque / Bank Verification",
      "Authorized Signatory Details",
    ],
  },

  {
    id: "packaging",
    icon: <Package size={20} className="text-emerald-600" />,
    title: "Product & Packaging Requirements",
    items: [
      "Product labels and packaging images",
      "Food-grade packaging compliance confirmation",
      "Storage and handling process details",
      "Shelf-life declaration",
      "Packaging material specifications",
    ],
  },

  {
    id: "traceability",
    icon: <Truck size={20} className="text-emerald-600" />,
    title: "Supply Chain & Traceability",
    items: [
      "Farm/source traceability records",
      "Supplier and procurement records",
      "Organic handling process details",
      "Transportation and storage information",
      "Batch tracking capability",
    ],
  },

  {
    id: "compliance",
    icon: <CheckCircle size={20} className="text-emerald-600" />,
    title: "Marketplace Compliance Requirements",
    items: [
      "Acceptance of Vendor Terms & Conditions",
      "Acceptance of Vendor Verification Policy",
      "Agreement to marketplace compliance audits",
      "Commitment to ethical organic practices",
      "Agreement to product authenticity responsibility",
    ],
  },

  {
    id: "priority",
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    title: "Additional Priority Compliance (Recommended)",
    items: [
      "ISO 22000 Food Safety Certification",
      "HACCP Certification",
      "Export Compliance Documentation",
      "Fair Trade Certification",
      "Sustainability & Ethical Sourcing Programs",
      "Regenerative Agriculture Practices",
    ],
  },
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
          id="siraba-wm-voc"
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
      <rect width="100%" height="100%" fill="url(#siraba-wm-voc)" />
    </svg>
  </div>
);

const ChecklistSection = ({ section }) => {
  const [checked, setChecked] = useState(
    () => section.items.reduce((acc, item) => ({ ...acc, [item]: false }), {})
  );

  const toggleItem = (item) =>
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));

  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = section.items.length;
  const allDone = doneCount === total;

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
            {section.icon}
          </div>
          <h2 className="font-heading font-bold text-primary text-base">
            {section.title}
          </h2>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${allDone
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-500"
            }`}
        >
          {doneCount}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-emerald-500 transition-all duration-300"
          style={{ width: `${(doneCount / total) * 100}%` }}
        />
      </div>

      {/* Items */}
      <ul className="px-6 py-4 space-y-3">
        {section.items.map((item) => (
          <li key={item}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${checked[item]
                    ? "bg-emerald-600 border-emerald-600"
                    : "border-gray-300 group-hover:border-emerald-400"
                  }`}
                onClick={() => toggleItem(item)}
              >
                {checked[item] && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm leading-relaxed transition-colors ${checked[item]
                    ? "line-through text-gray-400"
                    : "text-text-secondary group-hover:text-primary"
                  }`}
                onClick={() => toggleItem(item)}
              >
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

const VendorOnboardingChecklist = () => {
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
            Vendor Onboarding Checklist
          </h1>
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em]">
            Siraba Organic Marketplace
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <h2 className="font-heading font-bold text-primary text-lg mb-4">
            Vendor Eligibility Overview
          </h2>

          <div className="space-y-3 text-text-secondary font-light leading-relaxed">
            <p>
              Only certification-compliant organic vendors are eligible for onboarding.
            </p>

            <p>
              All submitted documents must be valid, traceable, and verifiable.
            </p>

            <p>
              SIRABA ORGANIC™ reserves the right to reject, suspend, or re-verify any vendor application.
            </p>

            <p>
              Submission of incomplete or misleading information may result in onboarding rejection.
            </p>
          </div>

          <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="font-semibold text-primary mb-2">
              Verification Notice
            </p>

            <p className="text-sm text-text-secondary">
              SIRABA ORGANIC™ may conduct document verification,
              certification validation, product authenticity review,
              or compliance checks at any stage of onboarding
              or marketplace operations.
            </p>

            <p className="text-sm text-text-secondary mt-3">
              Marketplace approval is granted only after successful
              verification and compliance review.
            </p>
          </div>
        </div>

        {/* Checklist Sections */}
        <div className="space-y-5 mb-12">
          {sections.map((section) => (
            <ChecklistSection key={section.id} section={section} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <h2 className="font-heading font-bold text-primary text-lg mb-4">
            Strategic Marketplace Positioning
          </h2>

          <p className="text-text-secondary leading-relaxed">
            SIRABA ORGANIC™ is a premium certification-led organic marketplace
            where trust, traceability, compliance, and verified organic
            authenticity form the foundation of vendor onboarding.
          </p>
        </div>

        {/* Final Step CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 p-8 text-white shadow-lg text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-white" />
          </div>
          <h3 className="font-heading text-xl font-bold mb-2">Marketplace Approval Process</h3>
          <p className="text-emerald-100 text-sm mb-6 max-w-md mx-auto">
            Vendor onboarding approval is granted only after successful
            certification verification, documentation review,
            compliance assessment, and marketplace qualification review.
          </p>
          <a
            href="mailto:info@sirabaorganic.com?subject=Vendor%20Registration%20%E2%80%93%20Siraba%20Organic"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-md"
          >
            <Mail size={15} />
            info@sirabaorganic.com
          </a>
          <p className="text-emerald-200 text-xs mt-3">
            Subject: Vendor Registration – Siraba Organic
          </p>
          <p className="text-emerald-200 text-xs mt-4">
            UDYAM-HR-05-0179395 · www.sirabaorganic.com
          </p>
        </div>

      </div>
    </div>
  );
};

export default VendorOnboardingChecklist;