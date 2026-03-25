import React, { useEffect } from "react";
import { Shield, CheckCircle, Globe, ArrowRight } from "lucide-react";

const certifications = [
  {
    id: "eu",
    logo: "🇪🇺",
    name: "EU Organic Certification",
    description:
      "One of the most widely recognized organic standards in the world. Ensures agricultural products comply with the European Union's organic farming regulations.",
    points: [
      "No synthetic pesticides or fertilizers",
      "No genetically modified organisms (GMOs)",
      "Strict environmental and sustainability standards",
      "Controlled organic processing methods",
    ],
    note: "Products certified under EU Organic standards may be sold across the European Union.",
  },
  {
    id: "usda",
    logo: "🇺🇸",
    name: "USDA Organic Certification",
    description:
      "Issued under the United States Department of Agriculture (USDA) organic program. Ensures products meet strict organic farming and processing requirements.",
    points: [
      "Organic agricultural practices",
      "Prohibition of synthetic chemicals",
      "Non-GMO production",
      "Strict certification and inspection processes",
    ],
    note: "USDA Organic certification is widely recognized in global organic trade.",
  },
  {
    id: "npop",
    logo: "🇮🇳",
    name: "NPOP (India Organic)",
    description:
      "The National Programme for Organic Production governs organic certification in India. Regulated by APEDA — the Agricultural and Processed Food Products Export Development Authority.",
    points: [
      "Organic farming practices",
      "Processing and handling standards",
      "Export compliance",
    ],
    note: "Products certified under NPOP may carry the India Organic logo.",
  },
];

const tradeRows = [
  {
    cert: "EU Organic",
    market: "European Union",
    detail: "Required for organic products entering the EU.",
  },
  {
    cert: "USDA Organic",
    market: "United States",
    detail: "Allows organic products to be sold in the US.",
  },
  {
    cert: "NPOP",
    market: "India / Export",
    detail: "Supports organic exports from India.",
  },
];

// Siraba "S" leaf watermark SVG — used as a repeating background pattern
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
          id="siraba-wm"
          x="0"
          y="0"
          width="180"
          height="180"
          patternUnits="userSpaceOnUse"
        >
          {/* Leaf shape */}
          <g transform="translate(90,90)">
            <ellipse
              cx="0"
              cy="-18"
              rx="22"
              ry="38"
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              transform="rotate(-20)"
            />
            <ellipse
              cx="0"
              cy="-18"
              rx="22"
              ry="38"
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              transform="rotate(20)"
            />
            {/* S letterform */}
            <text
              x="0"
              y="8"
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontWeight="bold"
              fontSize="28"
              fill="#16a34a"
            >
              S
            </text>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#siraba-wm)" />
    </svg>
  </div>
);

const OrganicCertificationGuide = () => {
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
          <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-4">
            Organic Certification Guide
          </h1>
          <p className="text-lg text-text-secondary font-light leading-relaxed max-w-3xl">
            Understanding Global Organic Standards
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <p className="text-text-secondary leading-relaxed font-light mb-4">
            Organic certification ensures that food and agricultural products are
            produced according to strict standards that promote environmental
            sustainability, product purity, and consumer safety.
          </p>
          <p className="text-text-secondary leading-relaxed font-light">
            At Siraba Organic, we prioritize products that comply with
            internationally recognized organic certifications. These
            certifications help ensure that products listed on our platform meet
            global standards for organic integrity and traceability.
          </p>
        </div>

        {/* Why It Matters */}
        <div className="mb-10">
          <h2 className="font-heading text-xl md:text-2xl text-primary font-bold mb-5 flex items-center gap-2">
            <Shield size={22} className="text-emerald-600" />
            Why Organic Certification Matters
          </h2>
          <p className="text-text-secondary font-light leading-relaxed mb-5">
            Organic certification verifies that products are produced using
            approved methods that avoid harmful chemicals, synthetic fertilizers,
            and genetically modified organisms (GMOs). For customers,
            certification provides confidence that the product is genuinely
            organic.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Authentic organic sourcing",
              "Strict agricultural and processing standards",
              "Food safety and traceability",
              "Transparency for consumers",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3"
              >
                <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-900 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Certification Cards */}
        <div className="mb-10">
          <h2 className="font-heading text-xl md:text-2xl text-primary font-bold mb-2">
            Major Organic Certifications Recognized by Siraba Organic
          </h2>
          <p className="text-text-secondary font-light text-sm mb-6">
            Siraba Organic prioritizes products that comply with internationally
            recognized certification standards.
          </p>

          <div className="space-y-6">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden"
              >
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 flex items-center gap-3">
                  <span className="text-2xl">{cert.logo}</span>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {cert.name}
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-text-secondary font-light leading-relaxed text-sm mb-4">
                    {cert.description}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                    Key Standards
                  </p>
                  <ul className="space-y-2 mb-4">
                    {cert.points.map((pt) => (
                      <li
                        key={pt}
                        className="flex items-start gap-2 text-sm text-text-secondary font-light"
                      >
                        <ArrowRight
                          size={14}
                          className="text-emerald-500 mt-0.5 flex-shrink-0"
                        />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 font-medium">
                    {cert.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Trade */}
        <div className="mb-10">
          <h2 className="font-heading text-xl md:text-2xl text-primary font-bold mb-2 flex items-center gap-2">
            <Globe size={22} className="text-emerald-600" />
            Organic Certification and Global Trade
          </h2>
          <p className="text-text-secondary font-light leading-relaxed text-sm mb-5">
            Organic certifications play a critical role in international food
            trade. Many countries require organic products to comply with
            specific certification standards before they can be imported or
            sold. Vendors seeking to sell internationally often obtain multiple
            certifications to meet regulatory requirements in different markets.
          </p>
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50 border-b border-emerald-100">
                  <th className="text-left px-5 py-3 font-bold text-emerald-800 text-xs uppercase tracking-wider">
                    Certification
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-emerald-800 text-xs uppercase tracking-wider">
                    Market
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-emerald-800 text-xs uppercase tracking-wider hidden sm:table-cell">
                    Requirement
                  </th>
                </tr>
              </thead>
              <tbody>
                {tradeRows.map((row, i) => (
                  <tr
                    key={row.cert}
                    className={i !== tradeRows.length - 1 ? "border-b border-gray-50" : ""}
                  >
                    <td className="px-5 py-4 font-semibold text-primary">
                      {row.cert}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{row.market}</td>
                    <td className="px-5 py-4 text-text-secondary font-light hidden sm:table-cell">
                      {row.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How Siraba Uses Certification */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <h2 className="font-heading text-xl font-bold text-primary mb-4">
            How Siraba Organic Uses Certification Standards
          </h2>
          <p className="text-text-secondary font-light leading-relaxed text-sm mb-5">
            Siraba Organic prioritizes certified organic products to maintain
            trust and transparency in the marketplace.
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
            Vendor Requirements
          </p>
          <ul className="space-y-2">
            {[
              "At least one recognized organic certification for domestic listing.",
              "Two certifications recommended for products intended for global sales.",
              "All vendor applications are reviewed before listing approval.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-text-secondary font-light"
              >
                <CheckCircle
                  size={15}
                  className="text-emerald-500 mt-0.5 flex-shrink-0"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Traceability */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-7 mb-10">
          <h2 className="font-heading text-xl font-bold text-primary mb-3">
            Certification and Product Traceability
          </h2>
          <p className="text-text-secondary font-light leading-relaxed text-sm mb-4">
            Organic certification also supports product traceability. Certified
            producers must maintain documentation that allows products to be
            traced through the supply chain — ensuring authentic sourcing,
            quality control, and compliance with organic standards.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              "Authentic Sourcing",
              "Quality Control",
              "Compliance Documentation",
              "Batch-Level Records",
            ].map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold bg-white border border-emerald-200 text-emerald-800 px-4 py-2 rounded-full shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Commitment */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <h2 className="font-heading text-xl font-bold text-primary mb-3">
            Siraba Organic Commitment
          </h2>
          <p className="text-text-secondary font-light leading-relaxed text-sm">
            Siraba Organic is committed to building a trusted marketplace for
            certified organic products. By prioritizing internationally
            recognized organic certifications, we aim to ensure that customers
            receive products that meet high standards of authenticity, quality,
            and compliance.
          </p>
        </div>

        {/* CTA Footer */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 p-8 text-center text-white shadow-lg">
          <h3 className="font-heading text-xl font-bold mb-2">
            Are you a certified organic vendor?
          </h3>
          <p className="text-emerald-100 text-sm mb-6">
            Visit our Vendor page or contact us for onboarding support.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:info@sirabaorganic.com"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-md"
            >
              info@sirabaorganic.com
            </a>
            <a
              href="tel:+918586836660"
              className="inline-flex items-center gap-2 border-2 border-white/60 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
            >
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

export default OrganicCertificationGuide;