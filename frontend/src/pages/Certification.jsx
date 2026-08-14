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
import JaivikBharatLogo from "../assets/jaivik_bharat.png";
import UsdaOrganicLogo from "../assets/usda_organic.png";
import NablLogo from "../assets/nabl_logo.png";

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
      title: "Organic Certification Gate",
      badge: "Layer 1 — CERTIFIED™",
      desc: "Mandatory requirement: NPOP + USDA Organic OR EU Organic certification plus applicable business documentation.",
      purpose: [
        "Recognized organic cultivation standards",
        "Regulated compliance systems",
        "Traceable production processes",
        "Certification-backed credibility",
      ],
      why: "Certification forms the foundational organic compliance gate for products approved on SIRABA ORGANIC.",
      logo: JaivikBharatLogo,
      logoAlt: "Jaivik Bharat / India Organic Logo",
    },
    {
      title: "Scientific Evidence, Documentation & Traceability",
      badge: "Layer 2 — VERIFIED™",
      desc: "Scientific evidence, laboratory testing documentation and batch traceability reviewed according to product category and quality parameters.",
      purpose: [
        "Accredited laboratory documentation",
        "Internationally aligned compliance systems",
        "Batch-level quality parameters",
        "Scientific validation and transparency",
      ],
      why: "Scientific documentation validates product safety and quality parameters through appropriately accredited testing laboratories.",
      logo: UsdaOrganicLogo,
      logoAlt: "Accredited Laboratory Evidence",
    },
    {
      title: "SIRABA Marketplace Qualification & Governance",
      badge: "Layer 3 — QUALIFIED™",
      desc: "Comprehensive assessment of regulatory compliance, vendor integrity, operational capability, fulfillment, and ongoing governance.",
      purpose: [
        "Documentation-backed quality systems",
        "Vendor operational readiness",
        "Traceability maturity & packaging",
        "Compliance-focused accountability",
      ],
      why: "Qualification ensures long-term marketplace discipline, ethical governance, and consumer trust.",
      logo: NablLogo,
      logoAlt: "Marketplace Qualification",
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
            <p className="text-white/60 uppercase tracking-widest text-xs font-bold mb-4">
              Every approved product must satisfy:
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2 border border-white/10">
                <img src={JaivikBharatLogo} alt="Jaivik Bharat Logo" className="h-8 object-contain bg-white rounded p-0.5" />
                <span className="text-surface text-sm font-semibold">NPOP Certification</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2 border border-white/10">
                <img src={UsdaOrganicLogo} alt="USDA Organic Logo" className="h-8 object-contain bg-white rounded p-0.5" />
                <span className="text-surface text-sm font-semibold">USDA Organic</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2 border border-white/10">
                <img src={NablLogo} alt="NABL Logo" className="h-8 object-contain bg-white rounded p-0.5" />
                <span className="text-surface text-sm font-semibold">Accredited Lab Evidence</span>
              </div>
            </div>
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
            Why Organic Certification Matters
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            Why Organic Certification Matters
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left max-w-4xl mx-auto">

            <p>
              Organic certification is essential for ensuring authenticity,
              traceability, consumer trust, food safety compliance,
              export readiness, and marketplace credibility.
            </p>

            <ul className="space-y-2">
              {[
                "Prevents misleading organic claims",
                "Supports consumer trust and transparency",
                "Improves export eligibility",
                "Ensures traceable organic sourcing",
                "Strengthens food safety and compliance",
                "Supports premium brand positioning",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="font-semibold text-primary">
              Certification serves as the foundation for trusted organic
              commerce and long-term marketplace credibility.
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
                className="bg-background border border-secondary/10 rounded-2xl p-8 space-y-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-secondary/10 pb-4 mb-4">
                    <span className="text-accent text-xs uppercase tracking-widest font-bold">
                      {item.badge}
                    </span>
                    {item.logo && (
                      <div className="h-12 w-20 flex items-center justify-end bg-white rounded p-1 shadow-sm border border-secondary/10 flex-shrink-0">
                        <img
                          src={item.logo}
                          alt={item.logoAlt}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <h3 className="font-heading text-2xl text-primary font-bold mb-3">
                    {item.title}
                  </h3>

                  <p className="text-text-secondary text-sm leading-relaxed font-light mb-4">
                    {item.desc}
                  </p>

                  <div className="mb-6">
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
                </div>

                <div className="pt-3 border-t border-secondary/10 mt-auto">
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
            Certification Philosophy
          </span>

          <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
            SIRABA ORGANIC™ Certification Philosophy
          </h2>

          <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left">

            <p>
              SIRABA ORGANIC™ follows a certification-first marketplace
              approach where verification, compliance, and traceability
              are treated as mandatory standards.
            </p>

            <p>
              Only vendors meeting the platform’s certification and
              compliance framework are eligible for onboarding and
              marketplace participation.
            </p>

            <ul className="space-y-2">
              {[
                "Certification-first governance",
                "Verified compliance standards",
                "Organic authenticity verification",
                "Traceable sourcing systems",
                "Consumer trust protection",
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
              { text: "Valid NPOP certification (Mandatory)", logo: JaivikBharatLogo, logoAlt: "NPOP Logo" },
              { text: "USDA Organic Certification OR EU Organic Certification", logo: UsdaOrganicLogo, logoAlt: "USDA Logo" },
              { text: "NABL-accredited lab documentation", logo: NablLogo, logoAlt: "NABL Logo" },
              { text: "Valid FSSAI License or Registration", logo: null },
              { text: "Product traceability and sourcing documentation", logo: null },
              { text: "Documentation verification support", logo: null },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-background border border-secondary/10 rounded-xl p-5 flex items-center justify-between gap-4 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle className="text-accent flex-shrink-0" size={22} />
                  <span className="text-primary font-medium">{item.text}</span>
                </div>
                {item.logo && (
                  <div className="h-10 w-16 flex items-center justify-end bg-white rounded p-1 shadow-sm border border-secondary/10 flex-shrink-0">
                    <img src={item.logo} alt={item.logoAlt} className="max-h-full max-w-full object-contain" />
                  </div>
                )}
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

      {/* ───────────────── DYNAMIC & SAMPLE VENDOR DOCUMENTS ───────────────── */}
      <section className="py-20 bg-surface border-b border-secondary/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
              Vendor Documentation
            </span>

            <h2 className="font-heading text-4xl text-primary mb-4">
              Certification & Document Preview
            </h2>

            <p className="text-text-secondary font-light max-w-3xl mx-auto">
              All certifications and compliance documents displayed on SIRABA
              ORGANIC are submitted and maintained by individual vendors and validated through SIRABA's Triple Verification Framework™.
            </p>
          </div>

          {/* Live Backend Vendor Documents (if available) */}
          {vendorCerts && vendorCerts.length > 0 && (
            <div className="bg-background border border-secondary/10 rounded-2xl p-8 mb-10">
              <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-accent" />
                Live Verified Vendor Documents
              </h4>
              <ul className="space-y-3">
                {vendorCerts.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-text-secondary"
                  >
                    <FileText size={18} className="text-accent" />
                    <span>{typeof c === "string" ? c : c.name || c.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sample Vendor Certifications Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading text-xl font-bold text-primary flex items-center gap-2">
                <ShieldCheck size={20} className="text-accent" />
                Sample Verified Vendor Certifications & Compliance Evidence
              </h4>
              <span className="text-xs uppercase tracking-wider font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                Sample Evidence Preview
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  vendorName: "Rapid Organic Heritage Farms",
                  vendorType: "Certified Organic Producer",
                  certStandard: "USDA Organic (NOP) & NPOP Organic",
                  certBody: "OneCert International",
                  certScope: "Kashmiri Saffron, Asafoetida (Hing), Organic Spices",
                  status: "Verified & Active",
                  fssaiLicense: "FSSAI License Verified",
                  labTesting: "Accredited Laboratory COA Validated",
                  traceability: "Batch Traceability Enabled",
                  badge: "SIRABA Qualified Vendor™",
                },
                {
                  vendorName: "Organic Wellness Collective",
                  vendorType: "Certified Processor & Exporter",
                  certStandard: "EU Organic & NPOP Certification",
                  certBody: "Lacon GmbH / RSOCA",
                  certScope: "Herbal Botanicals, Organic Teas, Superfood Powders",
                  status: "Verified & Active",
                  fssaiLicense: "FSSAI License Active",
                  labTesting: "Heavy Metal & Pesticide Residue Tested",
                  traceability: "Farm-to-Fork Traceability Verified",
                  badge: "SIRABA Qualified Vendor™",
                },
                {
                  vendorName: "Himalayan Bio-Organic Estate",
                  vendorType: "Certified Cultivator",
                  certStandard: "NPOP Organic & USDA NOP Aligned",
                  certBody: "Control Union Certifications",
                  certScope: "Himalayan Herbs, Shilajit, Raw Honey & Spices",
                  status: "Verified & Active",
                  fssaiLicense: "FSSAI License Active",
                  labTesting: "ISO/IEC 17025 Accredited Lab Report",
                  traceability: "Origin & Altitude Verified",
                  badge: "SIRABA Qualified Vendor™",
                },
              ].map((sample, idx) => (
                <div
                  key={idx}
                  className="bg-background border border-secondary/15 rounded-2xl p-6 space-y-4 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent block">
                          {sample.vendorType}
                        </span>
                        <h5 className="font-heading font-bold text-primary text-base leading-tight">
                          {sample.vendorName}
                        </h5>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                        ✓ {sample.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface border border-secondary/10 space-y-2 text-xs">
                      <div>
                        <span className="text-text-secondary text-[10px] uppercase font-bold block">
                          Certification Standard
                        </span>
                        <span className="font-semibold text-primary">
                          {sample.certStandard}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary text-[10px] uppercase font-bold block">
                          Issuing Certification Body
                        </span>
                        <span className="font-semibold text-primary">
                          {sample.certBody}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary text-[10px] uppercase font-bold block">
                          Product Scope Covered
                        </span>
                        <span className="font-medium text-text-primary">
                          {sample.certScope}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <CheckCircle size={13} className="text-accent flex-shrink-0" />
                        <span>{sample.fssaiLicense}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <CheckCircle size={13} className="text-accent flex-shrink-0" />
                        <span>{sample.labTesting}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <CheckCircle size={13} className="text-accent flex-shrink-0" />
                        <span>{sample.traceability}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-secondary/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      {sample.badge}
                    </span>
                    <span className="text-[10px] text-text-secondary font-mono">
                      Sample Evidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
            Built Around Certification, Verification & Traceability.
          </h2>

          <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-3xl mx-auto mb-12">
            SIRABA ORGANIC™ is a premium certification-led organic marketplace where trust, traceability, compliance, and verified organic authenticity form the foundation of the ecosystem.
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