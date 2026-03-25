import React, { useEffect } from "react";
import {
  ShieldCheck,
  BadgeCheck,
  Building,
  FileText,
  ClipboardList,
  CheckSquare,
  RefreshCw,
  AlertTriangle,
  Eye,
  Mail,
  Phone,
} from "lucide-react";

const sections = [
  {
    icon: <Building size={20} className="text-emerald-600" />,
    title: "Vendor Eligibility",
    content:
      "Siraba Organic accepts applications from businesses involved in the production, processing, or distribution of certified organic products. All applicants must provide accurate and verifiable business information.",
    list: [
      "Organic farmers",
      "Organic food manufacturers",
      "Certified organic brands",
      "Organic spice producers",
      "Exporters of certified organic products",
    ],
  },
  {
    icon: <BadgeCheck size={20} className="text-emerald-600" />,
    title: "Certification Verification",
    content:
      "To maintain platform integrity, vendors must hold recognized organic certifications. Siraba Organic verifies certification validity, scope, and expiration dates before approving vendor listings.",
    list: [
      "EU Organic",
      "USDA Organic",
      "NPOP (India Organic)",
    ],
    notes: [
      "Minimum one certification required for domestic product listing.",
      "Minimum two certifications recommended for products intended for international sales.",
    ],
  },
  {
    icon: <Building size={20} className="text-emerald-600" />,
    title: "Business Information Verification",
    content:
      "During onboarding, vendors must provide the following. Siraba Organic may verify this information through documentation review.",
    list: [
      "Business registration details",
      "Contact information",
      "Business address",
      "Product category details",
    ],
  },
  {
    icon: <FileText size={20} className="text-emerald-600" />,
    title: "Product Documentation Review",
    content:
      "Vendors must submit documentation for each product they intend to list. This helps ensure that products listed on the platform match their certification claims.",
    list: [
      "Product description",
      "Certification coverage for the product",
      "Product images",
      "Ingredient details (where applicable)",
    ],
  },
  {
    icon: <ClipboardList size={20} className="text-emerald-600" />,
    title: "Quality and Compliance Review",
    content:
      "Siraba Organic may review supporting documentation to ensure that products meet applicable food safety and organic compliance standards.",
    list: [
      "Laboratory testing reports",
      "Product specification sheets",
      "Quality assurance documentation",
    ],
  },
  {
    icon: <CheckSquare size={20} className="text-emerald-600" />,
    title: "Product Listing Approval",
    content:
      "Only vendors that successfully complete the verification process are approved to list products on the Siraba Organic platform.",
    list: [
      "Request additional documentation",
      "Reject vendor applications",
      "Remove products that do not meet quality or certification standards",
    ],
    listPrefix: "Siraba Organic reserves the right to:",
  },
  {
    icon: <RefreshCw size={20} className="text-emerald-600" />,
    title: "Ongoing Compliance Monitoring",
    content:
      "Vendor verification is not a one-time process. Siraba Organic may periodically review vendor documentation to maintain platform quality.",
    list: [
      "Maintaining valid organic certifications",
      "Updating documentation when certifications expire or change",
      "Ensuring product authenticity and compliance",
    ],
    listPrefix: "Vendors are responsible for:",
  },
  {
    icon: <AlertTriangle size={20} className="text-amber-500" />,
    title: "Suspension or Removal",
    content:
      "Siraba Organic may suspend or remove vendors from the platform under the following circumstances:",
    list: [
      "Certification becomes invalid or expired",
      "False or misleading product information is provided",
      "Products fail to meet platform quality standards",
      "Vendors violate platform policies",
    ],
    warning: true,
  },
  {
    icon: <Eye size={20} className="text-emerald-600" />,
    title: "Transparency and Trust",
    content:
      "The purpose of the vendor verification process is to ensure that customers purchasing products through Siraba Organic receive authentic, certified organic products from verified vendors. This approach helps maintain transparency and trust across the marketplace.",
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
        <pattern id="siraba-wm-vvp" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
          <g transform="translate(90,90)">
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(-20)" />
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(20)" />
            <text x="0" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="28" fill="#16a34a">S</text>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#siraba-wm-vvp)" />
    </svg>
  </div>
);

const VendorVerificationPolicies = () => {
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
            Vendor Verification Policy
          </h1>
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em]">
            Siraba Organic Vendor Compliance Framework
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
            <h2 className="font-heading font-bold text-primary text-lg">Introduction</h2>
          </div>
          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3">
            Siraba Organic is committed to building a trusted marketplace for
            certified organic products. To maintain high standards of
            authenticity, quality, and transparency, all vendors must go through
            a structured verification process before their products are listed on
            the Siraba Organic platform.
          </p>
          <p className="text-text-secondary font-light leading-relaxed text-sm">
            This Vendor Verification Policy explains how Siraba Organic reviews
            and approves vendors to ensure compliance with organic certification
            and quality requirements.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-5 mb-12">
          {sections.map((section) => (
            <div
              key={section.title}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${section.warning ? "border-amber-100" : "border-emerald-100"
                }`}
            >
              {/* Section header */}
              <div
                className={`flex items-center gap-3 px-6 py-4 border-b ${section.warning
                  ? "border-amber-50 bg-amber-50/50"
                  : "border-emerald-50"
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${section.warning ? "bg-amber-50" : "bg-emerald-50"
                    }`}
                >
                  {section.icon}
                </div>
                <h2 className="font-heading font-bold text-primary text-base">
                  {section.title}
                </h2>
              </div>

              <div className="px-6 py-5 space-y-4">
                <p className="text-text-secondary font-light leading-relaxed text-sm">
                  {section.content}
                </p>

                {section.notes && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {section.notes.map((note) => (
                      <div
                        key={note}
                        className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3"
                      >
                        <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                          {note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {section.list && (
                  <>
                    {section.listPrefix && (
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                        {section.listPrefix}
                      </p>
                    )}
                    <ul className="space-y-2">
                      {section.list.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-text-secondary font-light">
                          <span
                            className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${section.warning ? "bg-amber-400" : "bg-emerald-500"
                              }`}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Footer */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 p-8 text-white shadow-lg text-center">
          <h3 className="font-heading text-xl font-bold mb-2">Contact Information</h3>
          <p className="text-emerald-100 text-sm mb-6">
            For vendor verification inquiries or onboarding assistance, please contact us.
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

export default VendorVerificationPolicies;