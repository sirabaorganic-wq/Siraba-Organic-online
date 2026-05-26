import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  BadgeCheck,
  PackageCheck,
  ListChecks,
  Tag,
  Scale,
  Copyright,
  LayoutDashboard,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  ChevronDown,
} from "lucide-react";

const clauses = [
  {
    id: "positioning",
    icon: <ShieldCheck size={18} className="text-emerald-600" />,
    title: "Marketplace Positioning",
    content:
      "SIRABA ORGANIC™ operates as a certification-led premium organic marketplace focused on authenticity, traceability, verified compliance, and long-term consumer trust.",
    list: [
      "Certification-led marketplace ecosystem",
      "Traceability-focused operations",
      "Verified compliance standards",
      "Long-term consumer trust",
      "Selective vendor onboarding process",
    ],
  },

  {
    id: "eligibility",
    icon: <BadgeCheck size={18} className="text-emerald-600" />,
    title: "Vendor Eligibility",
    content:
      "Vendor onboarding is selective and based on qualification, certification, verification, and compliance review.",
    list: [
      "Valid NPOP Certification (Mandatory)",
      "USDA Organic Certification OR EU Organic Certification (At least one required)",
      "Valid FSSAI License or Registration",
      "GST Registration",
      "PAN Verification",
      "NABL-accredited laboratory reports",
      "Product traceability and sourcing records",
    ],
  },

  {
    id: "responsibilities",
    icon: <PackageCheck size={18} className="text-emerald-600" />,
    title: "Vendor Responsibilities",
    content:
      "Vendors are responsible for maintaining regulatory compliance, certification validity, and marketplace quality standards.",
    list: [
      "Maintain valid certifications and regulatory compliance",
      "Provide authentic and accurate product information",
      "Ensure all organic claims are legally compliant and verifiable",
      "Maintain hygienic storage, packaging, and transportation practices",
      "Ensure food safety and product quality",
      "Comply with marketplace quality standards",
      "Promptly update expired or modified certifications",
      "Maintain transparent sourcing and supply-chain documentation",
    ],
  },

  {
    id: "listing",
    icon: <ListChecks size={18} className="text-emerald-600" />,
    title: "Product Listing Standards",
    content:
      "Only approved and verification-compliant products may be listed on the marketplace.",
    list: [
      "Products must match submitted certifications",
      "Misleading labeling or false organic claims are prohibited",
      "Products containing prohibited substances may be rejected",
      "Product images and descriptions must accurately represent the actual product",
      "SIRABA ORGANIC™ may remove non-compliant listings without prior notice",
    ],
  },

  {
    id: "verification",
    icon: <ShieldCheck size={18} className="text-emerald-600" />,
    title: "Certification & Verification Compliance",
    content:
      "All certifications and supporting documents submitted by vendors are subject to independent verification.",
    list: [
      "Document reviews",
      "Certification checks",
      "Product verification procedures",
      "Traceability assessments",
      "Listing restrictions for non-compliance",
      "Vendor suspension for failure to provide requested documents",
    ],
  },

  {
    id: "pricing",
    icon: <Tag size={18} className="text-emerald-600" />,
    title: "Pricing & Commercial Terms",
    content:
      "Vendors remain responsible for pricing accuracy and commercial compliance.",
    list: [
      "Pricing accuracy",
      "Taxation compliance",
      "Order fulfillment obligations",
      "Marketplace commissions may apply",
      "Promotional fees or service charges may apply",
      "Settlement timelines governed by marketplace operational policies",
    ],
  },

  {
    id: "branding",
    icon: <Copyright size={18} className="text-emerald-600" />,
    title: "Intellectual Property & Branding",
    content:
      "Vendors retain ownership of their trademarks, certifications, product images, and branding materials.",
    list: [
      "Vendor retains ownership of brand assets",
      "Marketplace may display brand assets",
      "Marketplace may use product information for promotion",
      "Marketplace may use materials for verification and visibility purposes",
      "Non-exclusive promotional rights granted to SIRABA ORGANIC™",
    ],
  },

  {
    id: "liability",
    icon: <ShieldCheck size={18} className="text-emerald-600" />,
    title: "Product Safety & Liability",
    content:
      "Vendors remain solely responsible for the legality, safety, authenticity, quality, and regulatory compliance of all products sold through the marketplace.",
    list: [
      "Product contamination",
      "False organic claims",
      "Expired certifications",
      "Regulatory violations",
      "Mislabeling",
      "Consumer harm caused by vendor products",
    ],
  },

  {
    id: "audits",
    icon: <Scale size={18} className="text-emerald-600" />,
    title: "Marketplace Audits & Compliance Monitoring",
    content:
      "SIRABA ORGANIC™ reserves the right to conduct periodic compliance reviews, random audits, certification verification checks, and product quality assessments.",
    list: [
      "Certification validity review",
      "NABL testing review",
      "Supply-chain traceability checks",
      "Packaging compliance review",
      "Consumer complaint investigations",
      "Organic authenticity reviews",
    ],
  },

  {
    id: "prohibited",
    icon: <AlertTriangle size={18} className="text-amber-500" />,
    title: "Prohibited Activities",
    warning: true,
    content:
      "The following activities are strictly prohibited and may result in immediate action.",
    list: [
      "Submission of fake or manipulated certifications",
      "False organic claims",
      "Sale of adulterated or prohibited products",
      "Misleading advertising",
      "Unauthorized intellectual property use",
      "Marketplace manipulation",
      "Fraudulent activity",
      "Circumventing platform verification systems",
    ],
  },

  {
    id: "termination",
    icon: <AlertTriangle size={18} className="text-amber-500" />,
    title: "Suspension & Termination Rights",
    warning: true,
    content:
      "SIRABA ORGANIC™ reserves the right to suspend, restrict, or permanently terminate vendor access when necessary.",
    list: [
      "Certification fraud",
      "Regulatory non-compliance",
      "Repeated quality violations",
      "Consumer safety concerns",
      "Misleading marketplace behavior",
      "Failure to cooperate with verification procedures",
    ],
  },

  {
    id: "confidentiality",
    icon: <ShieldCheck size={18} className="text-emerald-600" />,
    title: "Confidentiality & Data Protection",
    content:
      "Vendor business information, certifications, operational documents, and commercial details shall be handled with reasonable confidentiality standards.",
    list: [
      "Confidential handling of business records",
      "Protection of operational documentation",
      "Protection of certification records",
      "Vendors responsible for account security",
      "Vendors responsible for protecting credentials and business data",
    ],
  },

  {
    id: "frameworks",
    icon: <Scale size={18} className="text-emerald-600" />,
    title: "Governing Compliance Frameworks",
    content:
      "Marketplace governance follows recognized national and international compliance standards.",
    list: [
      "National Programme for Organic Production (NPOP)",
      "USDA National Organic Program (NOP)",
      "EU Organic Standards",
      "FSSAI Food Safety Regulations",
      "Applicable Indian laws and marketplace regulations",
    ],
  },

  {
    id: "disclaimer",
    icon: <ShieldCheck size={18} className="text-emerald-600" />,
    title: "Disclaimer",
    content:
      "Marketplace verification does not constitute a guarantee of product performance, therapeutic claims, or regulatory immunity.",
    list: [
      "Consumers should independently review product suitability",
      "Verification is not a guarantee of effectiveness",
      "Verification is not a guarantee of regulatory immunity",
    ],
  },

  {
    id: "ecosystem",
    icon: <BadgeCheck size={18} className="text-emerald-600" />,
    title: "Strategic Ecosystem Statement",
    content:
      "SIRABA ORGANIC™ is building a governance-driven premium organic ecosystem focused on verified trust, certification integrity, traceable sourcing, and long-term marketplace credibility.",
    list: [
      "Certification",
      "Verification",
      "Qualification",
    ],
  },
];

const WatermarkBg = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden"
    style={{ opacity: 0.04 }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
      <defs>
        <pattern id="siraba-wm-vtc" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
          <g transform="translate(90,90)">
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(-20)" />
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(20)" />
            <text x="0" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="28" fill="#16a34a">S</text>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#siraba-wm-vtc)" />
    </svg>
  </div>
);

const ClauseCard = ({ clause, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${clause.warning ? "border-amber-100" : "border-emerald-100"} bg-white`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors ${clause.warning ? "hover:bg-amber-50/40" : ""}`}
      >
        <div className="flex items-center gap-3">
          <span className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${clause.warning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
            {index}
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${clause.warning ? "bg-amber-50" : "bg-emerald-50"}`}>
            {clause.icon}
          </div>
          <span className="font-heading font-bold text-primary text-sm md:text-base">
            {clause.title}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className={`px-6 pb-5 pt-1 border-t ${clause.warning ? "border-amber-50" : "border-emerald-50"}`}>
          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3 pl-[76px]">
            {clause.content}
          </p>

          {clause.notes && (
            <div className="pl-[76px] flex flex-col sm:flex-row gap-3 mb-3">
              {clause.notes.map((note) => (
                <div key={note} className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-emerald-800 font-medium leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          )}

          {clause.list && (
            <ul className="pl-[76px] space-y-2">
              {clause.list.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-secondary font-light">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${clause.warning ? "bg-amber-400" : "bg-emerald-500"}`} />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const VendorTermsAndConditions = () => {
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
          <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-2">
            Vendor Terms & Conditions
          </h1>
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em]">
            Siraba Organic Vendor Policy
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <h2 className="font-heading font-bold text-primary text-lg mb-3">
            Introduction
          </h2>

          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3">
            These Vendor Terms & Conditions govern the relationship between
            SIRABA ORGANIC™ and vendors who apply to list, promote, and sell
            products through the SIRABA ORGANIC™ marketplace ecosystem.
          </p>

          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3">
            SIRABA ORGANIC™ operates as a certification-led premium organic
            marketplace focused on authenticity, traceability, verified
            compliance, and long-term consumer trust.
          </p>

          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3">
            Vendor onboarding is selective and based on qualification,
            certification, verification, and compliance review.
          </p>

          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <h3 className="font-semibold text-primary mb-2">
              Marketplace Principles
            </h3>

            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Certification-first vendor qualification framework</li>
              <li>• Verified organic authenticity and compliance standards</li>
              <li>• Transparent sourcing and traceability requirements</li>
              <li>• Food safety, quality assurance, and regulatory compliance</li>
              <li>• Long-term consumer trust and marketplace credibility</li>
            </ul>
          </div>

          <p className="text-text-secondary font-light leading-relaxed text-sm mt-5">
            By applying for vendor onboarding and listing products on the
            marketplace, vendors acknowledge and agree to comply with all
            qualification requirements, certification obligations, verification
            procedures, and operational policies established by SIRABA ORGANIC™.
          </p>
        </div>

        {/* Clauses — accordion */}
        <div className="space-y-3 mb-12">
          {clauses.map((clause, i) => (
            <ClauseCard key={clause.id} clause={clause} index={i + 1} />
          ))}
        </div>

        {/* Contact Footer */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 p-8 text-white shadow-lg text-center">
          <h3 className="font-heading text-xl font-bold mb-2">Contact Information</h3>
          <p className="text-emerald-100 text-sm mb-6">
            For vendor-related inquiries or onboarding support, please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:info@sirabaorganic.com"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-md"
            >
              <Mail size={15} />
              info@sirabaorganic.com
            </a>
            <a
              href="tel:+918586836660"
              className="inline-flex items-center gap-2 border-2 border-white/60 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
            >
              <Phone size={15} />
              +91-8586836660
            </a>
          </div>
          <p className="text-emerald-200 text-xs mt-5">
            UDYAM-HR-05-0179395 · www.sirabaorganic.com
          </p>
        </div>

      </div>
    </div>
  );
};

export default VendorTermsAndConditions;