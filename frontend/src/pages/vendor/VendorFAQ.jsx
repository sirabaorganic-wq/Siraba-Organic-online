import React, { useEffect, useState } from "react";
import { Mail, ArrowRight } from "lucide-react";

const faqs = [
  {
    q: "What is the Siraba Organic Vendor Program?",
    a: "The SIRABA ORGANIC Vendor Program is a qualification-based onboarding ecosystem designed for vendors who meet internationally aligned organic certification and documentation standards. Unlike open marketplaces, SIRABA ORGANIC follows a selective approval framework built around certification, scientific documentation, traceability, and compliance-focused marketplace governance.",
  },
  {
    q: "Who can become a vendor on Siraba Organic?",
    a: "Vendors who hold recognized organic certifications and maintain documentation-backed operational systems may apply for qualification. Eligible applicants may include certified organic brands, export-oriented organic processors, premium spice and saffron suppliers, organic ingredient manufacturers, and traceability-focused agricultural businesses.",
  },
  {
    q: "What certifications are required to sell on Siraba Organic?",
    a: "Approved vendors are generally expected to provide valid NPOP Certification, USDA Organic OR EU Organic Certification, and NABL-accredited laboratory documentation where applicable.",
  },
  {
    q: "What types of products can vendors list?",
    a: "SIRABA ORGANIC currently focuses on premium organic ingredients and certification-aligned product categories including Kashmiri saffron, premium hing (asafoetida), organic spices, herbal ingredients, export-grade organic food products, and traceability-supported organic products.",
  },
  {
    q: "How does the vendor onboarding process work?",
    a: "The onboarding process generally includes vendor application submission, certification review, documentation verification, qualification assessment, product compliance evaluation, and marketplace approval decision.",
  },
  {
    q: "Who is responsible for product certification and compliance?",
    a: "Vendors are fully responsible for maintaining valid certifications, documentation accuracy, traceability records, packaging compliance, and regulatory obligations.",
  },
  {
    q: "Are products tested before listing?",
    a: "SIRABA ORGANIC may require laboratory documentation aligned with NABL-accredited testing standards depending on product category and marketplace requirements.",
  },
  {
    q: "Can vendors sell internationally through Siraba Organic?",
    a: "SIRABA ORGANIC is strategically positioned around internationally aligned organic standards and export-oriented marketplace positioning.",
  },
  {
    q: "Are there listing or commission fees?",
    a: "Marketplace fee structures, onboarding models, commissions, and qualification-related policies may vary depending on vendor category and marketplace requirements.",
  },
  {
    q: "How can vendors apply to become a Siraba Organic partner?",
    a: "Interested vendors may apply through the official Vendor Qualification section on the SIRABA ORGANIC website by submitting business information, certification documentation, product details, and qualification-related records.",
  },
  {
    q: "How long does vendor approval take?",
    a: "Approval timelines may vary depending on documentation completeness, certification verification, product category, and compliance review requirements.",
  },
  {
    q: "Can individual farmers apply as vendors?",
    a: "Individual farmers may apply if they satisfy applicable qualification standards, certification requirements, documentation systems, and operational compliance criteria.",
  },
  {
    q: "Do vendors need their own organic certification?",
    a: "Yes. Vendors are generally expected to maintain valid certification documentation aligned with marketplace qualification standards.",
  },
  {
    q: "What happens if a certification expires?",
    a: "Expired certifications may affect marketplace eligibility, product visibility, qualification status, or vendor approval continuity.",
  },
  {
    q: "Can vendors sell multiple products?",
    a: "Yes. Vendors may apply to list multiple qualified products provided each product satisfies applicable certification, documentation, and marketplace approval requirements.",
  },
  {
    q: "Who manages product packaging?",
    a: "Vendors are responsible for packaging systems, product labeling, regulatory compliance, and food-grade packaging standards.",
  },
  {
    q: "Are vendors responsible for order fulfillment?",
    a: "Operational responsibilities may vary depending on marketplace structure, logistics arrangements, and onboarding agreements.",
  },
  {
    q: "Does Siraba Organic support international exports?",
    a: "SIRABA ORGANIC is strategically aligned with internationally recognized organic standards and export-oriented ecosystem positioning.",
  },
  {
    q: "What product information must vendors provide?",
    a: "Vendors may be required to provide certification records, product specifications, ingredient information, sourcing details, laboratory documentation, packaging information, traceability records, and operational compliance details.",
  },
  {
    q: "Can Siraba Organic reject product listings?",
    a: "Yes. SIRABA ORGANIC reserves the right to reject, suspend, or remove listings that do not satisfy marketplace qualification standards or compliance expectations.",
  },
  {
    q: "Are vendors allowed to update product details?",
    a: "Yes. Product updates may be permitted subject to marketplace review policies, documentation accuracy, and qualification compliance standards.",
  },
  {
    q: "Who owns the product listings?",
    a: "Vendors retain ownership of their products, trademarks, and associated intellectual property, subject to platform policies and onboarding agreements.",
  },
  {
    q: "What happens if customers report quality issues?",
    a: "Quality-related concerns may trigger internal review, documentation reassessment, compliance verification, or qualification review procedures.",
  },
  {
    q: "Can vendors sell products outside the spice category?",
    a: "Potentially yes, provided products align with marketplace positioning, certification standards, documentation requirements, and qualification policies.",
  },
  {
    q: "How does Siraba Organic protect marketplace quality?",
    a: "SIRABA ORGANIC follows a selective qualification-led ecosystem built around certification validation, scientific documentation, traceability-oriented governance, compliance-focused onboarding, and selective vendor approval systems under the philosophy: Certified. Verified. Qualified.",
  },
];

const onboardingSteps = [
  "Apply as Vendor",
  "Submit Certification Documents",
  "Product Verification",
  "Account Approval",
  "List Your Products",
  "Start Selling Globally",
];

const WatermarkBg = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden"
    style={{ opacity: 0.04 }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
      <defs>
        <pattern id="siraba-wm-vfaq" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
          <g transform="translate(90,90)">
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(-20)" />
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(20)" />
            <text x="0" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="28" fill="#16a34a">S</text>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#siraba-wm-vfaq)" />
    </svg>
  </div>
);

const FAQItem = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-emerald-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-emerald-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
            {index}
          </span>
          <span className="font-heading font-bold text-primary text-sm md:text-base">
            {question}
          </span>
        </div>
        <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 border-emerald-200 flex items-center justify-center text-emerald-600 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 bg-white border-t border-emerald-50">
          <p className="text-text-secondary leading-relaxed font-light text-sm pl-11">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const VendorFAQ = () => {
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
          <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-3">
            Vendor FAQ
          </h1>
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em]">
            Sell on Siraba Organic
          </p>
        </div>

        {/* How to Start — Quick Steps */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-6 mb-10">
          <h2 className="font-heading text-lg font-bold text-primary mb-5">
            How to Start Selling on Siraba Organic
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            {onboardingSteps.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-primary">{step}</span>
                </div>
                {i < onboardingSteps.length - 1 && (
                  <ArrowRight size={14} className="text-emerald-300 hidden sm:block flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 mb-12">
          {faqs.map((item, i) => (
            <FAQItem key={i} index={i + 1} question={item.q} answer={item.a} />
          ))}
        </div>

        {/* CTA Footer */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 p-8 text-white shadow-lg text-center">
          <h3 className="font-heading text-xl font-bold mb-2">
            Ready to apply as a vendor?
          </h3>
          <p className="text-emerald-100 text-sm mb-6">
            Contact us with the subject line{" "}
            <span className="font-semibold text-white">
              "Vendor Registration"
            </span>{" "}
            and include your company details, product category, and certification information.
          </p>
          <a
            href="mailto:info@sirabaorganic.com?subject=Vendor%20Registration%20%E2%80%93%20Siraba%20Organic"
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

export default VendorFAQ;