import React, { useState, useEffect } from "react";
import client from "../api/client";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  TestTube,
  FileText,
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import BgImage1 from "../assets/bgimage1.png";

const Certification = () => {
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    client
      .get("/settings/certifications")
      .then((res) => setCertData(res.data))
      .catch(console.error);
  }, []);

  const vendorCerts = Array.isArray(certData)
    ? certData
    : Array.isArray(certData?.certifications)
      ? certData.certifications
      : [];

  const frameworkLayers = [
    {
      title: "NPOP — Indian Organic Compliance",
      badge: "Layer 1",
      desc: "Products must comply with India’s National Programme for Organic Production (NPOP), governed by APEDA.",
      purpose: [
        "Recognized organic cultivation standards",
        "Regulated compliance systems",
        "Traceable production processes",
        "India-recognized organic credibility",
      ],
      why: "NPOP forms the foundational organic compliance layer for products approved on SIRABA ORGANIC.",
    },
    {
      title: "International Organic Validation",
      badge: "Layer 2",
      desc: "Approved vendors must additionally hold USDA Organic Certification OR EU Organic Certification.",
      purpose: [
        "Export-oriented credibility",
        "Globally aligned compliance systems",
        "Recognized international organic practices",
        "Stronger marketplace trust",
      ],
      why: "This qualification layer helps position SIRABA ORGANIC around internationally compliant organic standards.",
    },
    {
      title: "Scientific Documentation & Quality Validation",
      badge: "Layer 3",
      desc: "Products must be supported by laboratory documentation aligned with NABL-accredited testing standards.",
      purpose: [
        "Documentation-backed quality systems",
        "Stronger transparency",
        "Quality validation processes",
        "Compliance-focused accountability",
      ],
      why: "Scientific documentation helps strengthen marketplace discipline and consumer confidence.",
    },
  ];

  return (
    <div className="w-full pt-20 bg-background text-primary">

      {/* ───────────────── HERO SECTION ───────────────── */}
      <section className="relative min-h-[97vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BgImage1}
            alt="Certification"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/35 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/40" />
        </div>

        <div className="relative z-10 text-center max-w-5xl px-4 animate-fade-in-up">
          <span className="inline-block text-accent text-xs md:text-sm tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Triple-Verified Organic Marketplace
          </span>

          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-surface leading-tight font-bold mb-8">
            Organic Claims <br />
            <span className="italic text-accent">
              Require Proof.
            </span>
          </h1>

          <p className="text-white/85 text-base md:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-6">
            At SIRABA ORGANIC, certification is not treated as a marketing
            formality — it is the foundation of marketplace credibility.
          </p>

          <p className="text-white/70 text-sm md:text-lg leading-relaxed max-w-3xl mx-auto mb-10">
            We believe trust in organic products should be built through
            internationally recognized certifications, scientific documentation,
            and disciplined compliance systems.
          </p>

          <div className="inline-block bg-black/20 border border-white/10 backdrop-blur-sm rounded-xl px-6 py-5 mb-10">
            <p className="text-white/60 uppercase tracking-widest text-xs font-bold mb-3">
              Every approved product must satisfy:
            </p>

            <ul className="space-y-2 text-left">
              {[
                "NPOP Certification",
                "USDA Organic OR EU Organic Certification",
                "NABL-Accredited Documentation",
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

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              to="/shop"
              className="bg-accent text-primary font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
            >
              Explore Certified Products
            </Link>

            <Link
              to="/vendor/intro"
              className="bg-white/10 backdrop-blur text-surface border border-white/20 font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface hover:text-primary transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
            >
              Apply for Vendor Qualification
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 2 ───────────────── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Why Certification Matters
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            Why Certification Matters in Organic Commerce.
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left max-w-4xl mx-auto">
            <p>
              As global demand for organic products continues to rise, the
              market has also experienced increasing concerns related to:
            </p>

            <ul className="space-y-2 pl-2">
              {[
                "Misleading organic claims",
                "Inconsistent product standards",
                "Lack of sourcing transparency",
                "Weak traceability systems",
                "Adulteration risks in premium ingredients",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p>
              Certification creates an accountability structure that helps
              establish:
            </p>

            <ul className="space-y-2 pl-2">
              {[
                "Documented organic compliance",
                "Recognized production standards",
                "Traceable supply chain systems",
                "Stronger consumer confidence",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="font-semibold text-primary">
              At SIRABA ORGANIC, we believe premium organic credibility must be
              supported by documented systems rather than unverified claims.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 3 ───────────────── */}
      <section className="py-20 md:py-28 bg-surface border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
              Trust Infrastructure
            </span>

            <h2 className="font-heading text-4xl md:text-5xl text-primary mb-6">
              The SIRABA Triple Verification Framework™
            </h2>

            <p className="text-text-secondary text-lg max-w-3xl mx-auto font-light leading-relaxed">
              Every product listed on SIRABA ORGANIC must satisfy three critical
              layers of qualification. This framework forms the foundation of
              our marketplace trust architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {frameworkLayers.map((item, i) => (
              <div
                key={i}
                className="bg-background border border-secondary/10 rounded-2xl p-8 space-y-5 hover:shadow-lg transition-all duration-300"
              >
                <span className="text-accent text-xs uppercase tracking-widest font-bold">
                  {item.badge}
                </span>

                <h3 className="font-heading text-2xl text-primary font-bold">
                  {item.title}
                </h3>

                <p className="text-text-secondary text-sm leading-relaxed font-light">
                  {item.desc}
                </p>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                    Purpose
                  </p>

                  <ul className="space-y-2">
                    {item.purpose.map((p, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <ShieldCheck
                          size={14}
                          className="text-accent flex-shrink-0 mt-0.5"
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-secondary/10">
                  <p className="text-xs uppercase tracking-wider font-bold text-primary mb-2">
                    Why It Matters
                  </p>

                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.why}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 4 ───────────────── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Marketplace Philosophy
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            Not Every Organic Product Qualifies for SIRABA ORGANIC.
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left">
            <p>
              SIRABA ORGANIC is intentionally designed as a selective
              marketplace ecosystem.
            </p>

            <p>
              Unlike open marketplaces that prioritize unlimited onboarding, we
              focus on:
            </p>

            <ul className="space-y-2">
              {[
                "Disciplined vendor qualification",
                "Internationally recognized compliance systems",
                "Documentation-driven accountability",
                "Premium organic positioning",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="font-semibold text-primary">
              Our objective is not to build the largest organic marketplace.
            </p>

            <p>
              Our objective is to build one of the most disciplined and
              credibility-focused organic ecosystems in India.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 5 ───────────────── */}
      <section className="py-20 md:py-28 bg-surface border-b border-secondary/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
              Vendor Qualification
            </span>

            <h2 className="font-heading text-4xl md:text-5xl text-primary mb-6">
              Vendor Qualification Requirements.
            </h2>

            <p className="text-text-secondary text-lg max-w-3xl mx-auto font-light">
              To maintain marketplace integrity, approved vendors must provide
              documentation aligned with our qualification framework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Valid NPOP certification",
              "USDA Organic OR EU Organic certification",
              "NABL-accredited lab documentation",
              "Traceable sourcing records",
              "Food-grade packaging compliance",
              "Documentation verification support",
            ].map((item, i) => (
              <div
                key={i}
                className="bg-background border border-secondary/10 rounded-xl p-5 flex items-center gap-4"
              >
                <CheckCircle className="text-accent flex-shrink-0" size={22} />
                <span className="text-primary font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-accent/10 border-l-4 border-accent p-6 rounded-md">
            <p className="text-primary font-semibold leading-relaxed">
              SIRABA ORGANIC does not operate as an open seller marketplace.
              Vendor onboarding is approval-based and subject to qualification
              review.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 6 ───────────────── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Compliance Systems
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            Our Compliance & Documentation Approach.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {[
              "Certification verification",
              "Documentation review",
              "Traceability support",
              "Packaging compliance alignment",
              "Export-oriented marketplace standards",
              "Compliance-focused governance",
            ].map((item, i) => (
              <div
                key={i}
                className="bg-surface border border-secondary/10 rounded-xl p-6"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="text-accent mt-1" size={18} />
                  <p className="text-primary font-medium leading-relaxed">
                    {item}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 7 ───────────────── */}
      <section className="py-20 md:py-28 bg-primary text-surface border-b border-accent/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Selective Standards
          </span>

          <h2 className="font-heading text-4xl md:text-5xl leading-tight mb-10">
            Why Selective Standards Matter.
          </h2>

          <div className="space-y-6 text-white/80 text-base md:text-lg font-light leading-relaxed text-left">
            <p>
              Because our onboarding standards are intentionally high, fewer
              vendors may initially qualify for marketplace access.
            </p>

            <p className="font-semibold text-surface">
              We view this as a strategic strength rather than a limitation.
            </p>

            <p>Selective qualification helps maintain:</p>

            <ul className="space-y-2">
              {[
                "Stronger compliance discipline",
                "Higher marketplace credibility",
                "Premium positioning",
                "Greater long-term trust",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p>
              SIRABA ORGANIC prioritizes documented credibility over mass
              marketplace expansion.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────── SECTION 8 ───────────────── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
            Long-Term Vision
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            Building a Trust Infrastructure for Organic Commerce.
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left">
            <p>
              Our long-term vision extends beyond selling products.
            </p>

            <p>
              SIRABA ORGANIC aims to build a globally respected organic
              ecosystem where:
            </p>

            <ul className="space-y-2">
              {[
                "Certification remains disciplined",
                "Compliance systems drive trust",
                "Internationally aligned standards are prioritized",
                "Vendors grow through credibility",
                "Consumers purchase with confidence",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p>
              We believe the future of premium organic commerce will be built
              around:
            </p>

            <ul className="space-y-2">
              {[
                "Transparency",
                "Accountability",
                "Traceability",
                "Scientific documentation",
                "Internationally recognized standards",
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

      {/* ───────────────── DYNAMIC VENDOR DOCUMENTS ───────────────── */}
      <section className="py-20 bg-surface border-b border-secondary/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
              Vendor Documentation
            </span>

            <h2 className="font-heading text-4xl text-primary mb-4">
              Certification & Document Preview
            </h2>

            <p className="text-text-secondary font-light max-w-3xl mx-auto">
              All certifications and compliance documents displayed on SIRABA
              ORGANIC are submitted and maintained by individual vendors.
            </p>
          </div>

          <div className="bg-background border border-secondary/10 rounded-2xl p-8">
            <h4 className="font-bold text-primary mb-4">
              Vendor-submitted documents
            </h4>

            {vendorCerts && vendorCerts.length > 0 ? (
              <ul className="space-y-3">
                {vendorCerts.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-text-secondary"
                  >
                    <FileText size={18} className="text-accent" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary">
                No vendor documents available currently.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────── FINAL CTA ───────────────── */}
      <section className="py-20 md:py-32 bg-primary text-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">
            Certified. Verified. Qualified.
          </span>

          <h2 className="font-heading text-4xl md:text-6xl leading-tight font-bold mt-6 mb-8">
            Built Around International Organic Standards.
          </h2>

          <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-3xl mx-auto mb-12">
            Explore a curated marketplace ecosystem built around international
            certification standards, scientific documentation, and
            compliance-focused sourcing systems.
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

export default Certification;