import React, { useEffect, useState } from "react";
import SEO, { buildFaqSchema, buildBreadcrumbSchema } from "../components/SEO";

export const faqs = [
  {
    q: "What is Siraba Organic?",
    a: "SIRABA ORGANIC is India’s Triple-Verified Organic Marketplace built around internationally recognized certification standards, scientific documentation, and selective vendor qualification systems.",
  },
  {
    q: "What makes Siraba Organic different from other spice brands?",
    a: "Unlike conventional spice brands or open marketplaces, SIRABA ORGANIC operates through a qualification-led ecosystem focused on internationally aligned certification standards, scientific documentation, traceability-oriented sourcing, selective vendor onboarding, and marketplace governance systems.",
  },
  {
    q: "What are Siraba Organic’s flagship products?",
    a: "SIRABA ORGANIC is strategically launching with Kashmiri Saffron and Premium Asafoetida (Hing), categories selected for their authenticity requirements and premium sourcing standards.",
  },
  {
    q: "Are Siraba Organic products certified organic?",
    a: "Products listed on SIRABA ORGANIC are expected to align with marketplace qualification standards that may include NPOP Certification, USDA Organic OR EU Organic Certification, and documentation-supported compliance systems.",
  },
  {
    q: "Are Siraba products laboratory tested?",
    a: "SIRABA ORGANIC promotes documentation-backed marketplace standards and may require laboratory reports aligned with accredited testing laboratory standards where applicable.",
  },
  {
    q: "Can other vendors sell products on Siraba Organic?",
    a: "Yes. However, SIRABA ORGANIC follows a selective vendor qualification framework built around certification, documentation, traceability, and compliance-focused onboarding standards.",
  },
  {
    q: "How does Siraba ensure product authenticity?",
    a: "SIRABA ORGANIC focuses on marketplace trust through certification-led qualification systems, documentation verification, traceability-oriented sourcing, scientific documentation standards, and selective vendor approval processes.",
  },
  {
    q: "Do you sell internationally?",
    a: "SIRABA ORGANIC is strategically positioned around internationally aligned organic standards and export-oriented ecosystem positioning.",
  },
  {
    q: "How should saffron be stored?",
    a: "Saffron should generally be stored in an airtight container away from sunlight, heat, moisture, and strong odors to preserve aroma, color, and flavor.",
  },
  {
    q: "What are the health benefits of saffron?",
    a: "Saffron has traditionally been valued for its culinary richness, antioxidant compounds, aroma, and wellness-oriented applications.",
  },
  {
    q: "What is asafoetida (hing) used for?",
    a: "Asafoetida (hing) is traditionally used as a culinary spice, flavor enhancer, and ingredient in various regional cuisines.",
  },
  {
    q: "How can businesses source products from Siraba Organic?",
    a: "Businesses may contact SIRABA ORGANIC for B2B sourcing, bulk procurement, premium organic ingredient partnerships, and qualification-aligned sourcing discussions.",
  },
];
const FAQItem = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-emerald-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-emerald-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
            {index}
          </span>
          <span className="font-heading font-bold text-primary text-base">
            {question}
          </span>
        </div>
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full border-2 border-emerald-200 flex items-center justify-center text-emerald-600 transition-transform duration-300 ${open ? "rotate-45" : ""
            }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 1V11M1 6H11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
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

const FAQ = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full pt-20 bg-background min-h-screen">
      <SEO
        title="Frequently Asked Questions (FAQ) | Siraba Organic"
        description="Find answers to common questions about Siraba Organic standards, organic certifications, lab evidence, vendor qualification, and shipping."
        canonicalUrl="/faq"
        schema={[
          buildFaqSchema("https://www.sirabaorganic.com/faq", faqs),
          buildBreadcrumbSchema("/faq"),
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12">
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-3">
            Siraba Organic
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-text-secondary leading-relaxed font-light">
            Everything you need to know about Siraba Organic — our products,
            certifications, vendor process, and more.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <FAQItem
              key={i}
              index={i + 1}
              question={item.q}
              answer={item.a}
            />
          ))}
        </div>

        {/* Contact Footer */}
        <div className="mt-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 p-8 text-center">
          <h3 className="font-heading text-xl font-bold text-primary mb-2">
            Still have questions?
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Our team is happy to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:info@sirabaorganic.com"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md"
            >
              info@sirabaorganic.com
            </a>
            <a
              href="tel:+918586836660"
              className="inline-flex items-center gap-2 border-2 border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors"
            >
              +91-8586836660
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;