import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Award,
  Feather,
  Quote,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import BgImage1 from "../assets/bgimage1.png";
import FounderImage from "../assets/founderimage.png";
import CoFounderImage from "../assets/co-founderimage.jpeg";
import SaffronImage from "../assets/saffron_jar.png";
import HingImage from "../assets/hing_jar_s.png";
import { Sparkles as SparklesIcon } from "lucide-react";

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full bg-background text-primary selection:bg-accent selection:text-white">
      {/* Parallax Hero Section */}
      <div className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-fixed bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url(${BgImage1})` }}
        ></div>
        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />

        <div className="relative z-10 text-center max-w-4xl px-4 animate-fade-in-up space-y-1">
          <span className="inline-block py-1 px-4 border border-accent/30 rounded-full text-accent text-xs tracking-[0.2em] uppercase font-bold backdrop-blur-sm bg-black/20">
            Curated Global-Standard Organic Marketplace
          </span>
          <h1 className="font-heading text-5xl md:text-7xl text-surface font-bold tracking-tight leading-tight text-shadow-lg">
            Built on Certification,{" "}
            <span className="italic text-accent">Integrity, and Trust.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light max-w-3xl mx-auto leading-relaxed">
            SIRABA ORGANIC was created to build a more disciplined, transparent, and globally aligned organic marketplace where credibility is earned through verification — not marketing claims.
          </p>
          <p className="text-white/60 text-sm md:text-base font-light max-w-2xl mx-auto leading-relaxed italic">
            Organic products should be supported by certification, documentation, and accountability.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/certifications"
              className="bg-accent text-primary font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
            >
              Explore Our Standards
            </Link>
            <Link
              to="/shop"
              className="bg-white/10 backdrop-blur text-surface border border-white/20 font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface hover:text-primary transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
            >
              View Certified Products
            </Link>
          </div>
          {/* <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce opacity-70">
            <ChevronDown className="text-surface w-8 h-8" />
          </div> */}
        </div>
      </div>

      {/* ── SECTION 2 — WHY SIRABA ORGANIC WAS CREATED ── */}
      <section className="py-24 md:py-32 overflow-hidden bg-background border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-16 lg:gap-24 items-start">
            {/* Left — The Problem */}
            <div className="w-full md:w-1/2 space-y-8 order-2 md:order-1 animate-slide-in-right">
              <div className="space-y-4">
                <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-accent"></span> Our Origin
                </span>
                <h2 className="font-heading text-4xl md:text-5xl text-primary font-bold leading-tight">
                  Why SIRABA ORGANIC{" "}
                  <span className="italic text-accent">Was Created.</span>
                </h2>
              </div>
              <div className="space-y-4 text-text-secondary font-light text-base md:text-lg leading-relaxed">
                <p>SIRABA ORGANIC was born from a simple but important question:</p>
                <blockquote className="border-l-4 border-accent pl-5 py-2 text-primary font-heading text-xl italic">
                  "Why is it still difficult to fully trust what we consume — even when products are labeled 'organic'?"
                </blockquote>
                <p>Across global markets, consumers are surrounded by products claiming purity, authenticity, organic sourcing, and premium quality. Yet behind many of these claims, there is often:</p>
                <ul className="space-y-2">
                  {["Limited transparency", "Inconsistent quality control", "Weak traceability", "Incomplete compliance systems", "Minimal scientific documentation"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-primary">
                      <span className="text-red-400 font-bold">•</span> {item}
                    </li>
                  ))}
                </ul>
                <p>These concerns become even more serious in high-value ingredients such as saffron, asafoetida (hing), spices, herbs, and wellness ingredients.</p>
                <p>SIRABA ORGANIC was created to help address this growing trust gap through a marketplace built around certification, verification, and disciplined compliance standards.</p>
              </div>
            </div>

            {/* Right — Founder Vision */}
            <div className="w-full md:w-1/2 space-y-8 order-1 md:order-2">
              <div className="space-y-4">
                <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-accent"></span> Founder Vision
                </span>
                <h2 className="font-heading text-4xl md:text-5xl text-primary font-bold leading-tight">
                  A Vision Built Around{" "}
                  <span className="italic text-accent">Long-Term Credibility.</span>
                </h2>
              </div>
              <div className="space-y-5 text-text-secondary font-light text-base md:text-lg leading-relaxed">
                <p>
                  SIRABA ORGANIC is founded by <strong className="text-primary">Rajesh Thakur</strong> — entrepreneur, business growth strategist, and author.
                </p>
                <p>Through his entrepreneurial journey across multiple ventures, he observed a consistent market reality:</p>
                <blockquote className="border-l-4 border-accent pl-5 py-2 text-primary font-heading text-xl italic">
                  "Short-term markets may reward speed and expansion, but long-term trust is built through systems, discipline, and accountability."
                </blockquote>
                <p>Within the organic industry, he identified a major opportunity: to build not simply another organic store — but a more structured and credibility-focused marketplace ecosystem.</p>
                <p className="font-semibold text-primary">SIRABA ORGANIC is the outcome of that philosophy.</p>
              </div>
              <div className="bg-surface border border-secondary/10 rounded-2xl p-6 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Our platform is built around:</p>
                {["Internationally recognized certifications", "Scientific documentation", "Selective vendor qualification", "Compliance-focused governance", "Long-term trust infrastructure"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2 size={14} className="text-accent flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — A FEW WORDS BY THE FOUNDER & CO-FOUNDER (LEADERSHIP PROFILES) ── */}
      <section className="py-24 md:py-32 bg-surface/60 border-b border-secondary/10 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 md:mb-20 space-y-4">
            <span className="text-accent text-xs md:text-sm tracking-[0.25em] uppercase font-bold flex items-center justify-center gap-3">
              <span className="w-8 h-[1px] bg-accent"></span> Leadership &amp; Vision <span className="w-8 h-[1px] bg-accent"></span>
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-primary font-bold tracking-tight">
              A Few Words by the <span className="italic text-accent">Founder &amp; Co-Founder</span>
            </h2>
            <p className="max-w-3xl mx-auto text-text-secondary font-light text-base md:text-lg leading-relaxed">
              Guided by a shared commitment to authenticity, governance, and operational excellence — transforming the organic marketplace through verifiable trust.
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {/* 1. RAJESH THAKUR — Founder & CEO */}
            <div className="bg-background border border-secondary/15 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-bl-full pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                {/* Photo Column */}
                <div className="w-full lg:w-4/12 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4 flex-shrink-0">
                  <div className="relative group w-full max-w-[280px] sm:max-w-[320px] mx-auto sm:mx-0">
                    <div className="absolute -inset-1.5 bg-gradient-to-tr from-accent to-primary rounded-2xl opacity-40 group-hover:opacity-75 blur transition duration-500" />
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-primary/10 border border-accent/30 shadow-md">
                      <img
                        src={FounderImage}
                        alt="Rajesh Thakur - Founder & CEO"
                        className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                  
                  <div className="w-full space-y-1.5 pt-2">
                    <span className="inline-block px-3.5 py-1 bg-accent/15 text-primary border border-accent/30 rounded-full text-xs font-bold uppercase tracking-wider">
                      Founder &amp; CEO
                    </span>
                    <h3 className="font-heading text-2xl sm:text-3xl text-primary font-bold">
                      Rajesh Thakur
                    </h3>
                    <p className="text-accent font-medium text-xs sm:text-sm">
                      Founder &amp; Chief Executive Officer, SIRABA ORGANIC™
                    </p>
                    <p className="text-text-secondary text-xs font-light leading-relaxed pt-1">
                      Entrepreneur • Business Growth Strategist • Author • Business Architect
                    </p>
                  </div>
                </div>

                {/* Text Content Column */}
                <div className="w-full lg:w-8/12 space-y-6">
                  {/* Highlight Quote */}
                  <div className="relative bg-[#0F3D2E] text-surface p-6 sm:p-7 rounded-2xl border border-accent/30 shadow-md">
                    <Quote className="text-accent w-8 h-8 opacity-40 mb-2" />
                    <p className="font-heading text-lg sm:text-xl md:text-2xl text-amber-100 italic leading-snug">
                      “Trust should never be assumed. It should be built, demonstrated, and continuously maintained.”
                    </p>
                    <p className="text-accent text-xs font-bold uppercase tracking-widest mt-3">
                      — Rajesh Thakur, Founder &amp; CEO
                    </p>
                  </div>

                  {/* Bio Narrative */}
                  <div className="space-y-4 text-text-secondary font-light text-sm sm:text-base leading-relaxed">
                    <p>
                      <strong className="text-primary font-semibold">Rajesh Thakur</strong> is an entrepreneur, business growth strategist, author, and Founder &amp; Chief Executive Officer of SIRABA ORGANIC™, India’s Triple-Verified Organic Marketplace.
                    </p>
                    <p>
                      With experience spanning business strategy, operations, supply chain, procurement, technology, governance, and business architecture, Rajesh has built his professional journey around designing businesses that can grow with greater structure, accountability, and long-term sustainability.
                    </p>
                    <p>
                      His vision for SIRABA ORGANIC™ emerged from a fundamental challenge in modern organic commerce: the growing trust gap between organic claims and consumer confidence. Consumers increasingly want more than labels and marketing—they want certification, evidence, documentation, traceability, and accountability.
                    </p>
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <p className="font-medium text-primary text-sm mb-1.5">
                        SIRABA ORGANIC™ addresses this challenge through a governance-led marketplace philosophy built around:
                      </p>
                      <p className="text-accent font-bold text-base font-heading">
                        Certified. Verified. Qualified.™
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Certification establishes compliance. Verification strengthens confidence through evidence, documentation, and traceability. Qualification evaluates responsible marketplace participation.
                      </p>
                    </div>
                    <p>
                      Rajesh is also the Founder of <strong className="text-primary font-semibold">The Freedom Startup Architect™ (TFSA)</strong>, a business architecture and growth framework focused on helping founders build scalable, profitable, system-driven businesses that can operate beyond founder dependency.
                    </p>
                    <p>
                      An MBA in International Business &amp; HR Management, with qualifications in Supply Chain Management, Information Technology, and Commerce, Rajesh combines strategic thinking with practical experience across business and operational environments.
                    </p>
                    <p>
                      He is the author of <em className="text-primary font-serif">Breaking Free: A Path to Your Best Life</em> and <em className="text-primary font-serif">Let’s Startup</em>, with further work focused on the journey from business chaos to sustainable growth.
                    </p>
                  </div>

                  {/* Vision Callout Box */}
                  <div className="bg-surface border border-secondary/15 rounded-2xl p-5 sm:p-6 space-y-2 border-l-4 border-l-accent">
                    <h4 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                      <SparklesIcon size={16} className="text-accent" /> His Vision
                    </h4>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-light">
                      To help build an organic ecosystem where responsible producers meet conscious consumers, supported by transparency, scientific validation, traceability, and responsible governance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SANDEEP UNIYAL — Co-Founder */}
            <div className="bg-background border border-secondary/15 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                {/* Photo Column */}
                <div className="w-full lg:w-4/12 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4 flex-shrink-0">
                  <div className="relative group w-full max-w-[280px] sm:max-w-[320px] mx-auto sm:mx-0">
                    <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-accent rounded-2xl opacity-40 group-hover:opacity-75 blur transition duration-500" />
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-primary/10 border border-accent/30 shadow-md">
                      <img
                        src={CoFounderImage}
                        alt="Sandeep Uniyal - Co-Founder"
                        className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                  
                  <div className="w-full space-y-1.5 pt-2">
                    <span className="inline-block px-3.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
                      Co-Founder
                    </span>
                    <h3 className="font-heading text-2xl sm:text-3xl text-primary font-bold">
                      Sandeep Uniyal
                    </h3>
                    <p className="text-accent font-medium text-xs sm:text-sm">
                      Co-Founder | SIRABA ORGANIC™
                    </p>
                    <p className="text-text-secondary text-xs font-light leading-relaxed pt-1">
                      Supply Chain Leader • Operations &amp; Logistics Expert • Serial Entrepreneur
                    </p>
                  </div>
                </div>

                {/* Text Content Column */}
                <div className="w-full lg:w-8/12 space-y-6">
                  {/* Highlight Quote */}
                  <div className="relative bg-[#0F3D2E] text-surface p-6 sm:p-7 rounded-2xl border border-accent/30 shadow-md">
                    <Quote className="text-accent w-8 h-8 opacity-40 mb-2" />
                    <p className="font-heading text-lg sm:text-xl md:text-2xl text-amber-100 italic leading-snug">
                      “Trust in the organic ecosystem must be supported by strong processes, verifiable information, traceability and accountability.”
                    </p>
                    <p className="text-accent text-xs font-bold uppercase tracking-widest mt-3">
                      — Sandeep Uniyal, Co-Founder
                    </p>
                  </div>

                  {/* Bio Narrative */}
                  <div className="space-y-4 text-text-secondary font-light text-sm sm:text-base leading-relaxed">
                    <p>
                      <strong className="text-primary font-semibold">Sandeep Uniyal</strong> is a seasoned supply chain and operations professional with over two decades of experience across precious metals, sourcing, procurement, logistics, commercial operations and business management. He holds an MBA in Operations, Logistics, Materials &amp; Supply Chain Management from Amity University.
                    </p>
                    <p>
                      Throughout his professional journey, Sandeep has held key roles with leading organisations including <strong className="text-primary font-semibold">Johnson Matthey Group</strong>, <strong className="text-primary font-semibold">MMTC-PAMP India</strong> and <strong className="text-primary font-semibold">Hero Group</strong>, gaining extensive experience in gold and silver sourcing, precious-metals supply chains, raw-material planning, procurement, logistics and commercial coordination. <strong className="text-primary font-semibold">He currently associated with Sovereign Metals Ltd.</strong>
                    </p>
                    <p>
                      Alongside his corporate career, Sandeep has developed diverse entrepreneurial interests. He is the Founder of <strong className="text-primary font-semibold">IVAN Integrated Solution – Finance &amp; Investment</strong> and Co-Founder of <strong className="text-primary font-semibold">Amrada Dairy Products</strong>, a Dehradun-based premium dairy business. These ventures have broadened his experience across investment, consumer businesses, sourcing, quality management and last-mile operations.
                    </p>
                    <p>
                      As Co-Founder of SIRABA ORGANIC™, Sandeep brings his operational expertise to building a structured, transparent and scalable organic marketplace. His focus includes supply-chain architecture, vendor and producer coordination, SOP development, process controls, traceability, operational discipline and continuous improvement.
                    </p>
                    <p>
                      With a hands-on and process-driven approach, Sandeep focuses on transforming strategy into reliable execution. He believes that trust in the organic ecosystem must be supported by strong processes, verifiable information, traceability and accountability.
                    </p>
                  </div>

                  {/* Role & Impact Callout Box */}
                  <div className="bg-surface border border-secondary/15 rounded-2xl p-5 sm:p-6 space-y-2 border-l-4 border-l-accent">
                    <h4 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                      <SparklesIcon size={16} className="text-accent" /> His Role at SIRABA ORGANIC™
                    </h4>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-light">
                      To help translate the company’s philosophy of <strong className="text-primary">“Trust Through Verification™”</strong> into dependable systems and consistent execution—creating an ecosystem where responsible producers can connect with conscious consumers with greater transparency, confidence and trust.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — MARKETPLACE PHILOSOPHY ── */}
      <section className="py-20 md:py-24 bg-primary text-surface border-b border-accent/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
            Our Marketplace Philosophy
          </span>
          <h2 className="font-heading text-4xl md:text-5xl leading-tight">
            Not an Open Marketplace.{" "}
            <span className="italic text-accent">A Curated Organic Ecosystem.</span>
          </h2>
          <div className="space-y-5 text-white/80 text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto text-left">
            <p className="font-semibold text-surface">SIRABA ORGANIC is intentionally designed as a selective marketplace platform.</p>
            <p>We do not prioritize unlimited product onboarding or mass marketplace expansion.</p>
            <p>Instead, our focus is on building:</p>
            <ul className="space-y-2 pl-2">
              {["A disciplined qualification framework", "A premium trust ecosystem", "Internationally aligned standards", "Documentation-driven accountability"].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-surface text-sm">
                  <span className="text-accent font-bold">•</span> {item}
                </li>
              ))}
            </ul>
            <p className="font-semibold text-surface italic">
              Every approved product on SIRABA ORGANIC must satisfy our Triple Verification Framework™ before marketplace approval.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — TRIPLE VERIFICATION FRAMEWORK™ ── */}
      <section className="py-20 md:py-24 bg-surface border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              Our Framework
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              The Foundation of Marketplace Trust.
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto font-light">
              Every approved product on SIRABA ORGANIC must satisfy three qualification layers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { layer: "Layer 1 — CERTIFIED™", badge: "NPOP + USDA Organic OR EU Organic", title: "Organic Certification Gate", desc: "Mandatory organic certification required prior to marketplace onboarding." },
              { layer: "Layer 2 — VERIFIED™", badge: "Accredited Laboratory Evidence & Traceability", title: "Scientific Evidence & Traceability", desc: "Scientific evidence, documentation, and traceability reviewed against quality parameters." },
              { layer: "Layer 3 — QUALIFIED™", badge: "SIRABA Marketplace Qualification", title: "Marketplace Qualification & Governance", desc: "Comprehensive evaluation of vendor integrity, compliance, and operational standards." },
            ].map((item, i) => (
              <div key={i} className="bg-background border border-secondary/10 rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow duration-300">
                <span className="text-accent text-xs font-bold uppercase tracking-widest">{item.layer}</span>
                <h3 className="font-heading text-xl text-primary font-bold">{item.title}</h3>
                <span className="inline-block bg-accent/10 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-accent/20">
                  {item.badge}
                </span>
                <p className="text-text-secondary text-sm leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-text-secondary text-sm font-light italic mt-10 max-w-2xl mx-auto">
            This framework allows SIRABA ORGANIC to position itself around documented credibility rather than unverified organic claims.
          </p>
        </div>
      </section>

      {/* ── SECTION 7 — FLAGSHIP FOCUS ── */}
      <section className="py-20 md:py-24 bg-background border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              Flagship Ingredients
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              Our Flagship Focus: Saffron &amp; Asafoetida.
            </h2>
            <p className="text-text-secondary text-lg max-w-3xl mx-auto font-light">
              SIRABA ORGANIC is strategically launching around two flagship ingredients: Kashmiri Saffron and Premium Asafoetida (Hing).
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              { img: SaffronImage, name: "Kashmiri Saffron", emoji: "🌸" },
              { img: HingImage, name: "Premium Asafoetida – Hing", emoji: "🌿" },
            ].map((prod, i) => (
              <div key={i} className="bg-surface border border-secondary/10 rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 hover:shadow-lg transition-shadow duration-300">
                <div className="md:w-44 bg-accent/5 flex items-center justify-center p-6 flex-shrink-0">
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="w-full h-32 md:h-40 object-contain transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-7 space-y-3">
                  <h3 className="font-heading text-xl text-primary font-bold">{prod.name}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed font-light">
                    These categories were intentionally selected because they hold high culinary and wellness value, require strong authenticity verification, are frequently affected by adulteration concerns, and benefit from compliance-focused sourcing systems.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    Launching Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-text-secondary text-sm font-light italic mt-8 max-w-2xl mx-auto">
            Rather than launching with unlimited categories, SIRABA ORGANIC is beginning with focused premium ingredients where trust and verification matter most.
          </p>
        </div>
      </section>

      {/* ── SECTION 8 — LONG-TERM VISION ── */}
      <section className="py-20 md:py-24 bg-surface border-b border-secondary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
            Our Vision
          </span>
          <h2 className="font-heading text-4xl md:text-5xl text-primary leading-tight">
            Building a Trust Infrastructure for Organic Commerce.
          </h2>
          <div className="space-y-5 text-text-secondary text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto text-left">
            <p className="font-semibold text-primary">Our long-term vision extends beyond selling products.</p>
            <p>SIRABA ORGANIC aims to build a globally respected ecosystem where:</p>
            <ul className="space-y-2 pl-2">
              {["Vendors grow through credibility", "Consumers purchase with confidence", "Compliance standards remain disciplined", "Transparency and accountability are prioritized", "Internationally aligned organic standards are maintained"].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-text-secondary text-sm">
                  <CheckCircle2 size={13} className="text-accent flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <p>We believe the future of premium organic commerce will increasingly depend on:</p>
            <div className="flex flex-wrap gap-3 pt-1">
              {["Certification", "Scientific Documentation", "Traceability", "Disciplined Governance", "Internationally Recognized Compliance"].map((tag, i) => (
                <span key={i} className="bg-accent/10 text-primary text-xs font-semibold px-4 py-2 rounded-full border border-accent/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 9 — CORE PRINCIPLES ── */}
      <section className="py-20 md:py-24 bg-background border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              Our Principles
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              The Principles That Guide SIRABA ORGANIC.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Certification Before Claims", desc: "Organic credibility should be documented, not assumed." },
              { num: "02", title: "Compliance Before Scale", desc: "Marketplace growth should never compromise standards." },
              { num: "03", title: "Trust Before Marketing", desc: "Long-term trust is built through systems and accountability." },
              { num: "04", title: "Selective Vendor Qualification", desc: "Marketplace access should be earned through compliance." },
              { num: "05", title: "Internationally Aligned Standards", desc: "Premium organic commerce should align with global expectations." },
              { num: "06", title: "Long-Term Marketplace Integrity", desc: "Sustainable credibility matters more than short-term expansion." },
            ].map((item, i) => (
              <div key={i} className="bg-surface border border-secondary/10 rounded-2xl p-7 space-y-3 hover:shadow-md transition-shadow duration-300">
                <span className="font-heading text-4xl text-accent/30 font-bold">{item.num}</span>
                <h3 className="font-heading text-lg text-primary font-bold">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transition Strip */}

      <div className="w-full bg-primary text-surface py-4 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-marquee">
          <span className="text-2xl md:text-3xl font-heading font-thin mx-8">
            • CERTIFIED
          </span>
          <span className="text-2xl md:text-3xl font-heading font-thin mx-8">
            • VERIFIED
          </span>
          <span className="text-2xl md:text-3xl font-heading font-thin mx-8">
            • QUALIFIED
          </span>
          <span className="text-2xl md:text-3xl font-heading font-thin mx-8">
            • TRACEABLE
          </span>
          {/* repeat once for loop */}
          <span className="text-2xl md:text-3xl font-heading font-thin mx-8">
            • INTERNATIONALLY ALIGNED
          </span>
          <span className="text-2xl md:text-3xl font-heading font-thin mx-8">
            • DOCUMENTATION-BACKED
          </span>
          <span className="text-2xl md:text-3xl font-heading font-thin mx-8">
            • MARKETPLACE APPROVED
          </span>
          <span className="text-2xl md:text-3xl font-heading font-thin mx-8">
            • EXPORT GRADE STANDARDS
          </span>
        </div>
      </div>

      {/* The Pillars (SI-RA-BA) - Redesigned */}
      <section className="py-24 md:py-32 bg-background relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl mix-blend-multiply"></div>
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24 space-y-4">
            <span className="text-accent text-sm tracking-[0.3em] uppercase font-bold flex items-center justify-center gap-3">
              <span className="w-8 h-[1px] bg-accent/50"></span> The Ethos{" "}
              <span className="w-8 h-[1px] bg-accent/50"></span>
            </span>
            <h2 className="font-heading text-5xl md:text-7xl text-primary font-bold tracking-tight">
              The Meaning of{" "}
              <span className="italic font-serif text-accent">Siraba</span>
            </h2>
            <p className="max-w-2xl mx-auto text-text-secondary font-light text-lg pt-4">
              Rooted in ancient wisdom, defined by modern integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* SI */}
            <div className="group relative bg-surface p-10 rounded-sm border border-secondary/10 hover:border-accent/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                <Feather size={140} />
              </div>
              <div className="relative z-10">
                <span className="block text-8xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-accent group-hover:to-accent/60 transition-all duration-500 mb-6">
                  SI
                </span>
                <h4 className="text-3xl font-heading font-bold text-primary mb-3 flex items-baseline gap-3">
                  Sita{" "}
                  <span className="text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] border border-accent/30 px-2 py-1 rounded-sm">
                    Purity
                  </span>
                </h4>
                <div className="w-12 h-0.5 bg-accent/30 mb-6 group-hover:w-full transition-all duration-700"></div>
                <p className="text-text-secondary leading-relaxed font-light">
                  Uncompromised purity and authenticity. In the organic food
                  space, purity is not a claim—it is a commitment backed by
                  certification, traceability, and verified sourcing.
                </p>
              </div>
            </div>

            {/* RA */}
            <div className="group relative bg-surface p-10 rounded-sm border border-secondary/10 hover:border-accent/50 transition-all duration-500 hover:shadow-2xl md:-translate-y-12 hover:-translate-y-14">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                <Award size={140} />
              </div>
              <div className="relative z-10">
                <span className="block text-8xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-accent group-hover:to-accent/60 transition-all duration-500 mb-6">
                  RA
                </span>
                <h4 className="text-3xl font-heading font-bold text-primary mb-3 flex items-baseline gap-3">
                  Ram{" "}
                  <span className="text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] border border-accent/30 px-2 py-1 rounded-sm">
                    Integrity
                  </span>
                </h4>
                <div className="w-12 h-0.5 bg-accent/30 mb-6 group-hover:w-full transition-all duration-700"></div>
                <p className="text-text-secondary leading-relaxed font-light">
                  Honest practices, transparent sourcing, and ethical business
                  conduct. We believe long-term success is built on systems,
                  discipline, and credibility—not shortcuts.
                </p>
              </div>
            </div>

            {/* BA */}
            <div className="group relative bg-surface p-10 rounded-sm border border-secondary/10 hover:border-accent/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                <Shield size={140} />
              </div>
              <div className="relative z-10">
                <span className="block text-8xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-accent group-hover:to-accent/60 transition-all duration-500 mb-6">
                  BA
                </span>
                <h4 className="text-3xl font-heading font-bold text-primary mb-3 flex items-baseline gap-3">
                  Balaji{" "}
                  <span className="text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] border border-accent/30 px-2 py-1 rounded-sm">
                    Strength
                  </span>
                </h4>
                <div className="w-12 h-0.5 bg-accent/30 mb-6 group-hover:w-full transition-all duration-700"></div>
                <p className="text-text-secondary leading-relaxed font-light">
                  The strength of devotion and righteousness in how we operate.
                  Siraba is built to be a trust infrastructure for organic
                  food—reliable, accountable, and disciplined batch after batch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 10 — FINAL BRAND STATEMENT ── */}
      <section className="py-20 md:py-28 bg-primary text-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-8">
          <Quote className="mx-auto text-accent w-12 h-12 opacity-80" />
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
            Beyond Organic Labels.
          </span>
          <h2 className="font-heading text-4xl md:text-6xl leading-tight font-bold">
            Beyond Organic Labels.
          </h2>
          <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-3xl mx-auto">
            SIRABA ORGANIC exists to build a more disciplined, transparent, and globally aligned organic marketplace ecosystem built around certification, scientific documentation, and compliance-backed trust systems.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Link
              to="/shop"
              className="w-full sm:w-auto bg-accent text-primary px-10 py-4 font-bold uppercase tracking-widest hover:bg-surface transition-all duration-300 shadow-lg transform hover:-translate-y-1 text-center"
            >
              Explore Certified Products
            </Link>
            <Link
              to="/vendor/intro"
              className="w-full sm:w-auto bg-transparent border border-accent text-surface px-10 py-4 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg transform hover:-translate-y-1 text-center"
            >
              Vendor Qualification Program
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;