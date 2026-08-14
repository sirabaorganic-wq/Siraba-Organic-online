import React, { useEffect } from "react";
import {
  Leaf,
  Award,
  MapPin,
  Globe,
  CheckCircle,
  ShieldCheck,
  Sprout,
  Microscope,
  FileCheck,
  Plane,
} from "lucide-react";
import { Link } from "react-router-dom";
import BgImage2 from "../assets/bgimage2.png";

const WhySiraba = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full pt-20 bg-background text-primary selection:bg-accent selection:text-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BgImage2}
            alt="Kashmir Landscapes"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center max-w-4xl px-4 animate-fade-in-up">
          <h1 className="font-heading text-5xl md:text-7xl text-surface font-bold tracking-tight mb-6 text-shadow">
            Why Global Buyers Choose Siraba
          </h1>
          <p className="text-surface/90 text-xl md:text-2xl font-light font-heading italic tracking-wide">
            Built on standards, testing, and disciplined sourcing — not
            marketing claims.
          </p>
        </div>
      </div>

      {/* Differentiation Statement */}
      <section className="py-24 px-4 max-w-6xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          <ShieldCheck size={48} className="text-accent" />
        </div>
        <p className="text-text-secondary text-lg md:text-xl font-light leading-relaxed max-w-4xl mx-auto">
          In a market crowded with organic labels, Siraba Organic focuses on
          what truly matters:
          <span className="font-bold text-primary"> certified sourcing</span>,
          <span className="font-bold text-primary">
            {" "}
            standardized quality testing
          </span>
          , and
          <span className="font-bold text-primary">
            {" "}
            export-ready processes
          </span>{" "}
          applied consistently across our supply chain.
        </p>
      </section>

      {/* The Four Foundations */}
      <section className="py-24 px-4 bg-secondary/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">
              Our Foundation
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary font-bold mt-3 mb-4">
              The Four Foundations of SIRABA ORGANIC™
            </h2>
            <p className="text-text-secondary text-base md:text-lg font-light leading-relaxed">
              The Triple Verification Framework™ is supported by four core foundations that strengthen compliance, evidence, transparency, and marketplace integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
            {[
              {
                id: "01",
                title: "CERTIFICATION COMPLIANCE",
                tagline: "Organic credibility begins with recognized certification.",
                desc: "SIRABA ORGANIC™ requires applicable organic and regulatory credentials before a vendor can progress through qualification.",
                points: [
                  "NPOP or equivalent organic certification",
                  "Product Scope Certificate",
                  "FSSAI Licence/Registration for India",
                  "Legal business registration",
                  "USDA Organic / EU Organic certification where applicable",
                  "Export registration and other relevant credentials where applicable",
                ],
                foundation: "Regulatory & organic compliance",
                icon: Award,
                borderColor: "border-accent",
                badgeBg: "bg-accent/10 text-accent",
              },
              {
                id: "02",
                title: "SCIENTIFIC EVIDENCE",
                tagline: "Claims should be supported by evidence.",
                desc: "SIRABA ORGANIC™ reviews scientific and documentary evidence to strengthen product authenticity and quality assurance.",
                points: [
                  "Accreditable Laboratory Documentation",
                  "ISO/IEC 17025 laboratory evidence where applicable",
                  "Certificate of Analysis (CoA)",
                  "Batch-wise test reports",
                  "Product documentation",
                  "Evidence-based validation",
                ],
                foundation: "Scientific verification & documentation",
                icon: Microscope,
                borderColor: "border-primary",
                badgeBg: "bg-primary/10 text-primary",
              },
              {
                id: "03",
                title: "TRACEABILITY & TRANSPARENCY",
                tagline: "Trust requires visibility beyond the label.",
                desc: "SIRABA ORGANIC™ evaluates the evidence behind product origin, handling, packaging, and supply-chain movement.",
                points: [
                  "Farm-to-fork traceability",
                  "Product origin documentation",
                  "Packaging verification",
                  "Supply-chain records",
                  "Batch-level documentation",
                  "Transparent compliance records",
                ],
                foundation: "Traceability & documented transparency",
                icon: FileCheck,
                borderColor: "border-accent",
                badgeBg: "bg-accent/10 text-accent",
              },
              {
                id: "04",
                title: "MARKETPLACE GOVERNANCE",
                tagline: "Qualification continues beyond onboarding.",
                desc: "SIRABA ORGANIC™ evaluates whether vendors are operationally and ethically prepared to participate in a controlled marketplace ecosystem.",
                points: [
                  "Vendor documentation review",
                  "Product quality evaluation",
                  "Packaging & listing readiness",
                  "Order fulfilment capability",
                  "Ethical sourcing",
                  "Governance & compliance",
                  "Continuous compliance monitoring",
                ],
                foundation: "Marketplace qualification & long-term accountability",
                icon: Globe,
                borderColor: "border-primary",
                badgeBg: "bg-primary/10 text-primary",
              },
            ].map((card) => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  className={`bg-surface p-7 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 ${card.borderColor} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-heading text-2xl font-bold text-accent/80 tracking-wider">
                        {card.id}
                      </span>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.badgeBg}`}>
                        <IconComp size={24} />
                      </div>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-primary tracking-wide mb-2">
                      {card.title}
                    </h3>

                    <p className="text-accent text-xs font-semibold italic mb-2">
                      {card.tagline}
                    </p>
                    <p className="text-text-secondary text-xs leading-relaxed mb-5">
                      {card.desc}
                    </p>

                    <ul className="space-y-2 mb-6 border-t border-secondary/10 pt-4">
                      {card.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary leading-snug">
                          <CheckCircle size={13} className="text-accent mt-0.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-secondary/10 mt-auto bg-secondary/5 -mx-7 -mb-7 p-4 rounded-b-sm">
                    <p className="text-[11px] font-semibold text-primary leading-tight">
                      <span className="text-accent font-bold uppercase tracking-wider block mb-0.5">Foundation:</span>
                      {card.foundation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-5xl text-primary font-bold">
              From Source to Shipment
            </h2>
            <p className="text-text-secondary mt-4 max-w-2xl mx-auto font-light">
              A structured process designed for consistency, safety, and
              traceability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border rounded-sm bg-background/50">
              <Sprout className="w-8 h-8 text-green-600 mb-4" />
              <h4 className="font-heading font-bold mb-2">
                Responsible Sourcing
              </h4>
              <p className="text-sm text-text-secondary">
                Cultivation through traditional organic farming practices in
                selected regions.
              </p>
            </div>

            <div className="p-6 border rounded-sm bg-background/50">
              <Microscope className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="font-heading font-bold mb-2">Batch Testing</h4>
              <p className="text-sm text-text-secondary">
                Quality and safety parameters assessed through standardized
                laboratory methods.
              </p>
            </div>

            <div className="p-6 border rounded-sm bg-background/50">
              <FileCheck className="w-8 h-8 text-purple-600 mb-4" />
              <h4 className="font-heading font-bold mb-2">Documentation</h4>
              <p className="text-sm text-text-secondary">
                Records maintained to support regulatory and export
                requirements.
              </p>
            </div>

            <div className="p-6 border rounded-sm bg-background/50">
              <Plane className="w-8 h-8 text-amber-600 mb-4" />
              <h4 className="font-heading font-bold mb-2">Global Dispatch</h4>
              <p className="text-sm text-text-secondary">
                Secure logistics with traceable delivery channels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="py-24 px-4 bg-primary text-surface text-center">
        <h2 className="font-heading text-3xl md:text-5xl font-bold mb-8">
          Experience Standards-Driven Organic Sourcing
        </h2>
        <Link
          to="/shop"
          className="inline-block bg-accent text-primary px-10 py-4 font-bold uppercase tracking-widest hover:bg-surface transition-all"
        >
          Start Shopping
        </Link>
      </section>
    </div>
  );
};

export default WhySiraba;
