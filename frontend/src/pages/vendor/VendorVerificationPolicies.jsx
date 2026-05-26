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
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    title: "Policy Objective",
    content:
      "SIRABA ORGANIC™ operates as a certification-led premium organic marketplace focused on authenticity, traceability, food safety, ethical sourcing, and consumer trust.",
    list: [
      "Certification-led marketplace governance",
      "Vendor compliance verification",
      "Organic authenticity assurance",
      "Consumer trust protection",
      "Marketplace integrity standards",
    ],
  },

  {
    icon: <BadgeCheck size={20} className="text-emerald-600" />,
    title: "Mandatory Vendor Verification Requirements",
    content:
      "All vendors must successfully complete verification and compliance review before onboarding approval.",
    list: [
      "Valid NPOP Certification issued by an APEDA-accredited certification body",
      "USDA Organic Certification OR EU Organic Certification",
      "Valid FSSAI License or Registration",
      "GST Registration Verification",
      "PAN Verification",
      "Business Address Verification",
      "Authorized Bank Account Verification",
      "NABL-accredited laboratory reports where applicable",
      "Product traceability and sourcing documentation",
      "Food-grade packaging compliance confirmation",
    ],
  },

  {
    icon: <BadgeCheck size={20} className="text-emerald-600" />,
    title: "Organic Certification Verification",
    content:
      "All organic certifications submitted by vendors are subject to independent verification and authenticity review.",
    list: [
      "APEDA verification review",
      "Accredited certification body validation",
      "Regulatory database verification",
      "NPOP certification validation",
      "USDA Organic verification",
      "EU Organic verification",
      "Supporting compliance documentation review",
    ],
  },

  {
    icon: <FileText size={20} className="text-emerald-600" />,
    title: "Product Verification & Quality Review",
    content:
      "Products are reviewed to ensure authenticity, traceability, and regulatory compliance.",
    list: [
      "Product label verification",
      "Packaging compliance review",
      "Ingredient and composition review",
      "Batch traceability validation",
      "Laboratory report verification",
      "Product authenticity assessment",
      "Adulteration and misleading claim review",
    ],
  },

  {
    icon: <AlertTriangle size={20} className="text-amber-500" />,
    title: "Vendor Risk & Fraud Prevention",
    warning: true,
    content:
      "Submission of false, manipulated, forged, misleading, or expired documentation is strictly prohibited.",
    list: [
      "Immediate onboarding rejection",
      "Vendor suspension",
      "Permanent marketplace ban",
      "Removal of listed products",
      "Regulatory reporting where applicable",
      "Legal action in cases of fraud or consumer harm",
    ],
  },

  {
    icon: <RefreshCw size={20} className="text-emerald-600" />,
    title: "Marketplace Compliance Monitoring",
    content:
      "Verification is not limited to initial onboarding and may continue throughout the vendor lifecycle.",
    list: [
      "Certification expiry monitoring",
      "Product authenticity checks",
      "Consumer complaint investigations",
      "Supply-chain verification",
      "Random documentation audits",
      "Compliance re-evaluation",
    ],
  },

  {
    icon: <ClipboardList size={20} className="text-emerald-600" />,
    title: "Traceability & Transparency Requirements",
    content:
      "Vendors must maintain transparent and verifiable sourcing records.",
    list: [
      "Farm origin details",
      "Procurement records",
      "Batch tracking information",
      "Supplier identification",
      "Organic handling records",
      "Storage and transportation documentation",
    ],
  },

  {
    icon: <CheckSquare size={20} className="text-emerald-600" />,
    title: "Verification Approval Levels",
    content:
      "Vendor verification status may be categorized into the following approval levels.",
    list: [
      "Basic Verification: Business verification + FSSAI + GST verification",
      "Certified Organic Verification: NPOP + business + product verification",
      "Premium Global Organic Verification: NPOP + USDA/EU Organic + advanced compliance review",
    ],
  },

  {
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    title: "Vendor Responsibility",
    content:
      "Vendors remain solely responsible for the authenticity, legality, safety, quality, and compliance of all products listed on the marketplace.",
    list: [
      "Product authenticity",
      "Product legality",
      "Food safety compliance",
      "Regulatory compliance",
      "Product quality assurance",
      "Marketplace verification does not transfer liability",
    ],
  },

  {
    icon: <Eye size={20} className="text-emerald-600" />,
    title: "SIRABA ORGANIC™ Marketplace Positioning",
    content:
      "SIRABA ORGANIC™ is a controlled premium organic marketplace ecosystem where verification, traceability, certification, and compliance are mandatory — not optional.",
    list: [
      "Verified organic integrity",
      "Consumer trust",
      "Ethical sourcing",
      "Long-term ecosystem credibility",
      "Certification-first marketplace governance",
    ],
  },

  {
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    title: "Reference Compliance Frameworks",
    content:
      "This policy aligns with recognized national and international compliance standards.",
    list: [
      "National Programme for Organic Production (NPOP)",
      "USDA National Organic Program (NOP)",
      "EU Organic Compliance Standards",
      "FSSAI Food Safety Regulations",
      "NABL-accredited laboratory standards",
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
            SIRABA ORGANIC™ · Verification | Traceability | Compliance
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
            <h2 className="font-heading font-bold text-primary text-lg">
              Introduction
            </h2>
          </div>

          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3">
            This Vendor Verification Policy defines the compliance,
            certification, verification, authenticity, and marketplace
            integrity standards applicable to all vendors onboarding onto
            the SIRABA ORGANIC™ marketplace ecosystem.
          </p>

          <p className="text-text-secondary font-light leading-relaxed text-sm mb-3">
            SIRABA ORGANIC™ operates as a certification-led premium organic
            marketplace focused on authenticity, traceability, food safety,
            ethical sourcing, and consumer trust.
          </p>

          <p className="text-text-secondary font-light leading-relaxed text-sm mb-4">
            The purpose of this policy is to establish a structured vendor
            verification framework to ensure that only compliant and
            verification-approved vendors are permitted to sell through
            the marketplace.
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-primary mb-2">
              Core Verification Principles
            </h3>

            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Certification-first vendor qualification</li>
              <li>• Organic authenticity verification</li>
              <li>• Product traceability and transparency</li>
              <li>• Food safety and regulatory compliance</li>
              <li>• Ethical sourcing and marketplace integrity</li>
              <li>• Long-term consumer trust protection</li>
            </ul>
          </div>

          <p className="text-text-secondary font-light leading-relaxed text-sm">
            Vendor verification is not limited to initial onboarding.
            SIRABA ORGANIC™ may conduct ongoing compliance reviews,
            certification validation, product verification procedures,
            traceability assessments, and marketplace quality checks to
            maintain the highest standards of organic integrity and
            ecosystem credibility.
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