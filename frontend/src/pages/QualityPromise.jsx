import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  Globe,
  CheckCircle,
  Sparkles,
  Package,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";
import BgImage1 from "../assets/bgimage1.png";

const QualityPromise = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const framework = [
    {
      title: "Certification Compliance Standards",
      desc: "Approved vendors must hold valid NPOP certification along with USDA Organic OR EU Organic certification.",
      points: [
        "Recognized organic compliance",
        "Internationally aligned practices",
        "Traceable production systems",
        "Documentation-backed accountability",
      ],
    },
    {
      title: "Scientific Documentation Standards",
      desc: "Approved products must be supported by laboratory documentation aligned with NABL-accredited testing standards.",
      points: [
        "Quality validation systems",
        "Documentation transparency",
        "Marketplace governance",
        "Compliance-focused accountability",
      ],
    },
    {
      title: "Traceability & Documentation Systems",
      desc: "SIRABA ORGANIC prioritizes disciplined documentation systems designed to support marketplace credibility.",
      points: [
        "Traceable sourcing records",
        "Batch-wise documentation",
        "Product compliance records",
        "Packaging alignment",
      ],
    },
  ];

  const priorities = [
    {
      title: "Certification Integrity",
      desc: "Products must align with recognized organic certification systems.",
    },
    {
      title: "Scientific Documentation",
      desc: "Marketplace accountability should be supported through documentation.",
    },
    {
      title: "Traceability",
      desc: "Transparent sourcing systems strengthen trust.",
    },
    {
      title: "Compliance Governance",
      desc: "Marketplace standards should remain disciplined and structured.",
    },
    {
      title: "Premium Positioning",
      desc: "Quality-focused ecosystems require selective onboarding standards.",
    },
    {
      title: "Long-Term Credibility",
      desc: "Sustainable trust matters more than rapid expansion.",
    },
  ];

  return (
    <div className="w-full pt-20 bg-background text-primary">

      {/* ───────────────── HERO SECTION ───────────────── */}
      <section className="relative min-h-[97vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BgImage1}
            alt="Quality & Compliance"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/35 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-primary/40" />
        </div>

        <div className="relative z-10 text-center max-w-5xl px-4 animate-fade-in-up">
          <span className="inline-block text-accent text-xs md:text-sm tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Compliance-First Organic Platform
          </span>

          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-surface leading-tight font-bold mb-8">
            Built Around Compliance, <br />
            <span className="italic text-accent">
              Documentation, and Trust.
            </span>
          </h1>

          <p className="text-white/85 text-base md:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-8">
            At SIRABA ORGANIC, quality is supported through certification
            standards, documentation systems, and disciplined marketplace
            governance.
          </p>

          <div className="inline-block bg-black/20 border border-white/10 backdrop-blur-sm rounded-xl px-6 py-5 mb-10">
            <p className="text-white/60 uppercase tracking-widest text-xs font-bold mb-3">
              We strengthen credibility through:
            </p>

            <ul className="space-y-2 text-left">
              {[
                "Internationally recognized certifications",
                "Scientific documentation",
                "Traceable sourcing systems",
                "Compliance-focused accountability",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-surface text-sm"
                >
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/70 text-sm md:text-base max-w-3xl mx-auto mb-10 leading-relaxed">
            Every approved product on SIRABA ORGANIC must align with our
            marketplace qualification framework before onboarding approval.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              to="/certifications"
              className="bg-accent text-primary font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
            >
              Explore Certification Standards
            </Link>

            <Link
              to="/shop"
              className="bg-white/10 backdrop-blur text-surface border border-white/20 font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface hover:text-primary transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
            >
              View Certified Products
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 2 ───────────────── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Our Quality Philosophy
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            Quality Should Be Governed Through Systems.
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left max-w-4xl mx-auto">
            <p>
              The premium organic industry increasingly depends on transparency,
              accountability, and internationally aligned compliance systems.
            </p>

            <p>
              Consumers today expect more than marketing-based organic claims.
            </p>

            <p>They increasingly seek:</p>

            <ul className="space-y-2">
              {[
                "Documented credibility",
                "Traceable sourcing",
                "Certification-backed products",
                "Scientific documentation",
                "Compliance-focused transparency",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="font-semibold text-primary">
              SIRABA ORGANIC was created to support a more disciplined
              marketplace ecosystem built around these principles.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 3 ───────────────── */}
      <section className="py-20 md:py-28 bg-surface border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
              Compliance Infrastructure
            </span>

            <h2 className="font-heading text-4xl md:text-5xl text-primary mb-6">
              The SIRABA Compliance Framework.
            </h2>

            <p className="text-text-secondary text-lg max-w-3xl mx-auto font-light leading-relaxed">
              Our marketplace qualification philosophy is built around a
              structured framework focused on certification, scientific
              documentation, and accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {framework.map((item, i) => (
              <div
                key={i}
                className="bg-background border border-secondary/10 rounded-2xl p-8 space-y-5 hover:shadow-lg transition-all duration-300"
              >
                <span className="text-accent text-xs uppercase tracking-widest font-bold">
                  Framework Layer {i + 1}
                </span>

                <h3 className="font-heading text-2xl text-primary font-bold">
                  {item.title}
                </h3>

                <p className="text-text-secondary text-sm leading-relaxed font-light">
                  {item.desc}
                </p>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                    Supports
                  </p>

                  <ul className="space-y-2">
                    {item.points.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <ShieldCheck
                          size={14}
                          className="text-accent flex-shrink-0 mt-0.5"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 4 ───────────────── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Packaging Standards
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            Packaging Standards Matter.
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left">
            <p>
              Packaging is not treated as a cosmetic element at SIRABA ORGANIC.
            </p>

            <p>
              It is part of the overall trust and compliance ecosystem.
            </p>

            <p>Approved vendors are expected to align with:</p>

            <ul className="space-y-2">
              {[
                "Food-grade packaging practices",
                "Product handling discipline",
                "Export-oriented presentation standards",
                "Documentation-backed packaging systems",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Package size={16} className="text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            <p>Our packaging philosophy focuses on:</p>

            <ul className="space-y-2">
              {[
                "Product integrity",
                "Handling discipline",
                "Marketplace consistency",
                "Premium presentation",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 5 ───────────────── */}
      <section className="py-20 md:py-28 bg-surface border-b border-secondary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Selective Standards
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            Why Selective Compliance Standards Matter.
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left">
            <p>
              SIRABA ORGANIC intentionally maintains a disciplined marketplace
              qualification approach.
            </p>

            <p>
              Unlike mass marketplaces that prioritize unlimited onboarding, we
              focus on:
            </p>

            <ul className="space-y-2">
              {[
                "Compliance-first governance",
                "Certification-backed credibility",
                "Documentation discipline",
                "Premium ecosystem positioning",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p>This selective approach helps support:</p>

            <ul className="space-y-2">
              {[
                "Stronger marketplace trust",
                "Higher compliance standards",
                "Premium brand positioning",
                "Long-term credibility",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 6 ───────────────── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
              Governance Priorities
            </span>

            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              The Standards We Prioritize.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {priorities.map((item, i) => (
              <div
                key={i}
                className="bg-surface border border-secondary/10 rounded-2xl p-7 hover:shadow-md transition-all duration-300"
              >
                <span className="font-heading text-4xl text-accent/30 font-bold">
                  0{i + 1}
                </span>

                <h3 className="font-heading text-xl text-primary font-bold mt-4 mb-3">
                  {item.title}
                </h3>

                <p className="text-text-secondary text-sm leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 7 ───────────────── */}
      <section className="py-20 md:py-28 bg-primary text-surface border-b border-accent/10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Marketplace Governance
          </span>

          <h2 className="font-heading text-4xl md:text-5xl leading-tight mb-10">
            A Marketplace Built Around Accountability.
          </h2>

          <div className="space-y-6 text-white/80 text-base md:text-lg font-light leading-relaxed text-left">
            <p>
              SIRABA ORGANIC aims to create a marketplace ecosystem where:
            </p>

            <ul className="space-y-2">
              {[
                "Credibility is documented",
                "Standards remain disciplined",
                "Vendor onboarding is selective",
                "Compliance systems support trust",
                "Consumers purchase with greater confidence",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            <p>
              We believe the future of premium organic commerce will
              increasingly depend on:
            </p>

            <ul className="space-y-2">
              {[
                "Accountability",
                "Traceability",
                "Scientific documentation",
                "Certification discipline",
                "Internationally aligned governance systems",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 8 ───────────────── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            International Orders
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            International Orders & Support Philosophy.
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left">
            <p>
              Due to the regulated and sensitive nature of premium food
              products, international returns may not always be operationally
              feasible.
            </p>

            <p>However, in verified cases involving:</p>

            <ul className="space-y-2">
              {[
                "Product quality concerns",
                "Packaging damage",
                "Shipment-related issues",
                "Documentation discrepancies",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p>SIRABA ORGANIC may review requests for:</p>

            <ul className="space-y-2">
              {[
                "Replacement support",
                "Store credit",
                "Case-based resolution assistance",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ArrowRight size={16} className="text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="bg-accent/10 border-l-4 border-accent p-5 rounded-md mt-8">
              <p className="text-primary font-semibold">
                All support evaluations are subject to documentation review and
                marketplace policies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── FINAL CTA ───────────────── */}
      <section className="py-20 md:py-32 bg-primary text-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">
            Compliance Builds Long-Term Trust
          </span>

          <h2 className="font-heading text-4xl md:text-6xl leading-tight font-bold mt-6 mb-8">
            Built Around Certification, Documentation, and Accountability.
          </h2>

          <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-3xl mx-auto mb-12">
            SIRABA ORGANIC exists to build a more disciplined organic
            marketplace ecosystem where certification, scientific
            documentation, and accountability support premium marketplace
            credibility.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/shop"
              className="w-full sm:w-auto bg-accent text-primary px-10 py-4 font-bold uppercase tracking-widest hover:bg-surface transition-all duration-300 shadow-lg transform hover:-translate-y-1"
            >
              Explore Certified Products
            </Link>

            <Link
              to="/vendor/intro"
              className="w-full sm:w-auto bg-transparent border border-accent text-surface px-10 py-4 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg transform hover:-translate-y-1"
            >
              Vendor Qualification Program
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default QualityPromise;