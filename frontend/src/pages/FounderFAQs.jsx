import React, { useEffect, useState } from "react";

const faqs = [
  {
    q: "Who is the founder of Siraba Organic?",
    a: `SIRABA ORGANIC was founded by Rajesh Kumar Thakur with the vision of building India’s Triple-Verified Organic Marketplace centered around trust, certification credibility, scientific documentation, and premium organic ecosystem standards.

The platform was created to move beyond claim-based organic marketing and establish a more disciplined, qualification-led marketplace focused on internationally aligned organic standards, selective vendor onboarding, and long-term consumer trust.

Certified. Verified. Qualified.`,
  },

  {
    q: 'What does the name "SIRABA" signify?',
    a: `The name “SIRABA” carries both spiritual symbolism and brand philosophy.

It is inspired by:
• SI — Sita
• RA — Ram
• BA — Balaji

Together, the name reflects values deeply associated with:
• purity
• trust
• discipline
• integrity
• devotion
• ethical foundations

These principles align closely with the core philosophy behind SIRABA ORGANIC — building a marketplace ecosystem rooted in authenticity, accountability, and long-term trust rather than claim-based positioning.

The name also symbolizes a connection between:
• traditional values
• responsible sourcing
• modern certification-led marketplace governance

SIRABA is therefore not just a brand name — it represents a trust-oriented ecosystem philosophy built around purity, credibility, and disciplined standards.`,
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
          className={`flex-shrink-0 w-7 h-7 rounded-full border-2 border-emerald-200 flex items-center justify-center text-emerald-600 transition-transform duration-300 ${
            open ? "rotate-45" : ""
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
          <p className="text-text-secondary leading-relaxed font-light text-sm pl-11 whitespace-pre-line">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const FounderFAQs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full pt-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">

        {/* Header */}
        <div className="mb-12">
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-3">
            Siraba Organic
          </p>

          <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-4">
            Founder & Branding FAQs
          </h1>

          <p className="text-text-secondary leading-relaxed font-light">
            Learn more about the vision, philosophy, and brand identity behind
            SIRABA ORGANIC.
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

      </div>
    </div>
  );
};

export default FounderFAQs;