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
    id: "eligibility",
    icon: <ShieldCheck size={18} className="text-emerald-600" />,
    title: "Vendor Eligibility",
    content:
      "To sell products on Siraba Organic, vendors must be a legally registered business or producer, provide valid contact and business information, comply with applicable food safety and regulatory standards, and hold recognized organic certification where required. Siraba Organic reserves the right to approve or reject vendor applications at its discretion.",
    list: [
      "Be a legally registered business or producer",
      "Provide valid contact and business information",
      "Comply with applicable food safety and regulatory standards",
      "Hold recognized organic certification where required",
    ],
  },
  {
    id: "certification",
    icon: <BadgeCheck size={18} className="text-emerald-600" />,
    title: "Organic Certification Requirements",
    content:
      "To list products on the Siraba Organic platform, vendors must hold recognized organic certifications. Vendors must ensure that their certifications remain valid and up to date.",
    list: ["EU Organic", "USDA Organic", "NPOP (India Organic)"],
    notes: [
      "At least one certification required for domestic product listing.",
      "At least two certifications recommended for international product sales.",
    ],
  },
  {
    id: "authenticity",
    icon: <PackageCheck size={18} className="text-emerald-600" />,
    title: "Product Authenticity and Quality",
    content:
      "Siraba Organic may request supporting documentation, laboratory reports, or certification proof during the verification process. All vendors must ensure:",
    list: [
      "Products listed are authentic and accurately described",
      "Products comply with certification standards",
      "Product information and labeling are accurate",
      "Products meet applicable food safety regulations",
    ],
  },
  {
    id: "listing",
    icon: <ListChecks size={18} className="text-emerald-600" />,
    title: "Product Listing Approval",
    content:
      "Siraba Organic reserves the right to approve, reject, or remove any product listing that does not meet platform standards. Before products are listed:",
    list: [
      "Vendors must submit required documentation",
      "Siraba Organic will review certification and product details",
      "Approval will be granted only after successful verification",
    ],
  },
  {
    id: "responsibilities",
    icon: <ListChecks size={18} className="text-emerald-600" />,
    title: "Vendor Responsibilities",
    content: "Vendors are responsible for:",
    list: [
      "Maintaining valid certifications",
      "Ensuring product quality and authenticity",
      "Providing accurate product descriptions and images",
      "Complying with applicable laws and regulations",
      "Fulfilling orders in a timely manner (if applicable)",
    ],
  },
  {
    id: "pricing",
    icon: <Tag size={18} className="text-emerald-600" />,
    title: "Pricing and Product Information",
    content:
      "Siraba Organic reserves the right to request corrections or modifications where necessary. Vendors must ensure:",
    list: [
      "Product pricing is transparent and accurate",
      "Product descriptions are truthful and not misleading",
      "Packaging information complies with regulatory requirements",
    ],
  },
  {
    id: "compliance",
    icon: <Scale size={18} className="text-emerald-600" />,
    title: "Compliance with Regulations",
    content:
      "Siraba Organic may suspend vendor listings if regulatory compliance concerns arise. Vendors must comply with:",
    list: [
      "Organic certification standards",
      "Food safety regulations",
      "Export regulations where applicable",
      "Packaging and labeling laws",
    ],
  },
  {
    id: "ip",
    icon: <Copyright size={18} className="text-emerald-600" />,
    title: "Intellectual Property",
    content:
      "By submitting product content, vendors grant Siraba Organic the right to display such content on the platform. Vendors must ensure:",
    list: [
      "Product images and descriptions are owned by them or properly licensed",
      "Listings do not infringe on the intellectual property rights of third parties",
    ],
  },
  {
    id: "platform",
    icon: <LayoutDashboard size={18} className="text-emerald-600" />,
    title: "Platform Rights",
    content: "Siraba Organic reserves the right to:",
    list: [
      "Approve or reject vendor applications",
      "Request additional documentation",
      "Remove products that do not meet quality standards",
      "Suspend or terminate vendor accounts for policy violations",
    ],
  },
  {
    id: "liability",
    icon: <ShieldCheck size={18} className="text-emerald-600" />,
    title: "Liability Disclaimer",
    content:
      "Siraba Organic acts as a marketplace platform connecting verified vendors with customers. Siraba Organic shall not be liable for any loss arising from vendor-provided product information or certification claims. Vendors are responsible for:",
    list: [
      "Product quality",
      "Certification compliance",
      "Regulatory obligations",
    ],
  },
  {
    id: "suspension",
    icon: <AlertTriangle size={18} className="text-amber-500" />,
    title: "Suspension or Termination",
    content:
      "Siraba Organic may suspend or terminate vendor accounts if:",
    list: [
      "Certification becomes invalid",
      "Product authenticity is questioned",
      "Vendor fails to comply with platform policies",
      "Fraudulent or misleading information is provided",
    ],
    warning: true,
  },
  {
    id: "changes",
    icon: <RefreshCw size={18} className="text-emerald-600" />,
    title: "Changes to Vendor Policy",
    content:
      "Siraba Organic reserves the right to modify these Vendor Terms & Conditions at any time. Vendors will be notified of significant changes when applicable.",
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
            Siraba Organic · Certification-Led | Traceable | Globally Compliant
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
          <h2 className="font-heading font-bold text-primary text-lg mb-3">Introduction</h2>
          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3">
            These Vendor Terms & Conditions govern the relationship between
            Siraba Organic and vendors who wish to list and sell products on the
            Siraba Organic platform.
          </p>
          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3">
            By applying to become a vendor and listing products on Siraba
            Organic, you agree to comply with the terms outlined in this policy.
          </p>
          <p className="text-text-secondary font-light leading-relaxed text-sm">
            Siraba Organic operates as a quality-focused organic marketplace
            that promotes certified organic products and maintains strict
            verification standards.
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