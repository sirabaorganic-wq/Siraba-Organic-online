import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ShieldCheck,
    FileText,
    CheckCircle,
    Globe,
    Sparkles,
    ClipboardCheck,
    ArrowRight,
    BadgeCheck,
    Package,
    Building2,
} from "lucide-react";
import BgImage1 from "../assets/bgimage1.png";

const VendorQualification = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const frameworkLayers = [
        {
            title: "NPOP Compliance Requirement",
            description:
                "Approved vendors must hold valid NPOP certification under India’s National Programme for Organic Production (APEDA).",
            points: [
                "Recognized Indian organic compliance",
                "Regulated production standards",
                "Traceable sourcing systems",
            ],
        },
        {
            title: "International Organic Validation Requirement",
            description:
                "Approved vendors must additionally hold USDA Organic Certification OR EU Organic Certification.",
            points: [
                "Export-oriented credibility",
                "Internationally aligned compliance systems",
                "Globally recognized organic practices",
            ],
        },
        {
            title: "Scientific Documentation Requirement",
            description:
                "Approved vendors must provide laboratory documentation aligned with NABL-accredited testing standards.",
            points: [
                "Documentation-backed accountability",
                "Stronger transparency",
                "Quality validation systems",
                "Compliance-focused governance",
            ],
        },
    ];

    const vendorBenefits = [
        {
            title: "Premium Marketplace Positioning",
            desc: "Access a curated marketplace built around trust, compliance, and premium organic standards.",
        },
        {
            title: "International Standards Alignment",
            desc: "Position products within a globally aligned certification-focused ecosystem.",
        },
        {
            title: "Credibility-Focused Brand Association",
            desc: "Join a marketplace built around certification, scientific documentation, and accountability.",
        },
        {
            title: "Premium Organic Consumer Access",
            desc: "Reach customers seeking internationally certified and scientifically documented products.",
        },
        {
            title: "Long-Term Marketplace Partnerships",
            desc: "Build relationships within a compliance-first ecosystem focused on sustainable trust.",
        },
        {
            title: "Export-Oriented Ecosystem Positioning",
            desc: "Align with a marketplace philosophy built around internationally recognized standards.",
        },
    ];

    const processSteps = [
        {
            title: "Application Submission",
            desc: "Submit vendor qualification request and required documentation.",
        },
        {
            title: "Certification Review",
            desc: "Review of NPOP and USDA/EU Organic certification documentation.",
        },
        {
            title: "Lab Documentation Review",
            desc: "Evaluation of NABL-accredited laboratory documentation.",
        },
        {
            title: "Compliance Assessment",
            desc: "Assessment of sourcing, packaging, and documentation alignment.",
        },
        {
            title: "Marketplace Approval",
            desc: "Qualified vendors receive onboarding approval for marketplace participation.",
        },
    ];

    return (
        <div className="w-full pt-20 bg-background text-primary">

            {/* ───────────────── HERO SECTION ───────────────── */}
            <section className="relative min-h-[97vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={BgImage1}
                        alt="Vendor Qualification"
                        className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-primary/35 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-primary/40" />
                </div>

                <div className="relative z-10 text-center max-w-5xl px-4 animate-fade-in-up">
                    <span className="inline-block text-accent text-xs md:text-sm tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
                        Selective Vendor Qualification Ecosystem
                    </span>

                    <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-surface leading-tight font-bold mb-8">
                        Vendor Qualification <br />
                        <span className="italic text-accent">
                            Program.
                        </span>
                    </h1>

                    <p className="text-white/85 text-base md:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-6">
                        SIRABA ORGANIC partners only with vendors who meet internationally
                        recognized organic certification and scientific documentation
                        standards.
                    </p>

                    <div className="inline-block bg-black/20 border border-white/10 backdrop-blur-sm rounded-xl px-6 py-5 mb-10">
                        <p className="text-white/60 uppercase tracking-widest text-xs font-bold mb-3">
                            Our ecosystem focuses on:
                        </p>

                        <ul className="space-y-2 text-left">
                            {[
                                "Certification-backed credibility",
                                "Internationally aligned standards",
                                "Compliance-focused governance",
                                "Long-term marketplace trust",
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
                        Vendor onboarding at SIRABA ORGANIC is approval-based and
                        qualification-driven.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link
                            to="/contact"
                            className="bg-accent text-primary font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
                        >
                            Apply for Vendor Qualification
                        </Link>

                        <Link
                            to="/certifications"
                            className="bg-white/10 backdrop-blur text-surface border border-white/20 font-bold text-sm tracking-widest uppercase px-8 py-4 hover:bg-surface hover:text-primary transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-full md:w-auto"
                        >
                            View Qualification Standards
                        </Link>
                    </div>
                </div>
            </section>

            {/* ───────────────── SECTION 2 ───────────────── */}
            <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
                        Vendor Eligibility
                    </span>

                    <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
                        Who Can Apply to SIRABA ORGANIC.
                    </h2>

                    <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left">
                        <p>
                            SIRABA ORGANIC welcomes qualified vendors operating within premium
                            organic categories who are committed to internationally aligned
                            compliance systems and disciplined marketplace standards.
                        </p>

                        <p>We are particularly interested in vendors involved in:</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                "Premium spices",
                                "Saffron",
                                "Asafoetida (Hing)",
                                "Herbs and botanicals",
                                "Honey",
                                "Tea and coffee",
                                "Wellness ingredients",
                                "Nutraceutical ingredients",
                                "Functional organic foods",
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="bg-surface border border-secondary/10 rounded-xl p-4 flex items-center gap-3"
                                >
                                    <BadgeCheck size={18} className="text-accent" />
                                    <span className="text-primary font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-accent/10 border-l-4 border-accent p-6 rounded-md mt-8">
                            <p className="text-primary font-semibold leading-relaxed">
                                SIRABA ORGANIC is not an open marketplace platform. Marketplace
                                access is granted only after successful qualification review.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ───────────────── SECTION 3 ───────────────── */}
            <section className="py-20 md:py-28 bg-surface border-b border-secondary/10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
                            Qualification Framework
                        </span>

                        <h2 className="font-heading text-4xl md:text-5xl text-primary mb-6">
                            The Qualification Framework Behind Marketplace Approval.
                        </h2>

                        <p className="text-text-secondary text-lg max-w-3xl mx-auto font-light leading-relaxed">
                            Every approved vendor on SIRABA ORGANIC must satisfy our Triple
                            Verification Framework™.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {frameworkLayers.map((item, i) => (
                            <div
                                key={i}
                                className="bg-background border border-secondary/10 rounded-2xl p-8 space-y-5 hover:shadow-lg transition-all duration-300"
                            >
                                <span className="text-accent text-xs uppercase tracking-widest font-bold">
                                    Layer {i + 1}
                                </span>

                                <h3 className="font-heading text-2xl text-primary font-bold">
                                    {item.title}
                                </h3>

                                <p className="text-text-secondary text-sm leading-relaxed font-light">
                                    {item.description}
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
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
                            Qualification Requirements
                        </span>

                        <h2 className="font-heading text-4xl md:text-5xl text-primary mb-6">
                            Qualification Requirements.
                        </h2>

                        <p className="text-text-secondary text-lg max-w-3xl mx-auto font-light">
                            To maintain marketplace integrity, vendors must provide
                            documentation aligned with our approval framework.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {[
                            "Valid NPOP certification",
                            "USDA Organic OR EU Organic certification",
                            "NABL-accredited lab reports",
                            "Product documentation",
                            "Traceable sourcing records",
                            "Food-grade packaging compliance",
                            "Business verification details",
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="bg-surface border border-secondary/10 rounded-xl p-5 flex items-center gap-4"
                            >
                                <CheckCircle className="text-accent flex-shrink-0" size={22} />
                                <span className="text-primary font-medium">{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-surface border border-secondary/10 rounded-2xl p-8">
                        <h3 className="font-heading text-2xl text-primary mb-6">
                            Additional Review Factors
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                "Category suitability",
                                "Marketplace positioning alignment",
                                "Packaging standards",
                                "Documentation completeness",
                                "Long-term compliance compatibility",
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Sparkles size={16} className="text-accent" />
                                    <span className="text-text-secondary">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ───────────────── SECTION 5 ───────────────── */}
            <section className="py-20 md:py-28 bg-primary text-surface border-b border-accent/10">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
                        Selective Standards
                    </span>

                    <h2 className="font-heading text-4xl md:text-5xl leading-tight mb-10">
                        Why Vendor Qualification Matters.
                    </h2>

                    <div className="space-y-6 text-white/80 text-base md:text-lg font-light leading-relaxed text-left">
                        <p>
                            Our marketplace qualification standards are intentionally
                            selective.
                        </p>

                        <p>
                            Unlike mass marketplaces that prioritize unlimited onboarding,
                            SIRABA ORGANIC focuses on:
                        </p>

                        <ul className="space-y-2">
                            {[
                                "Disciplined vendor approval",
                                "Certification-backed credibility",
                                "Compliance-focused marketplace governance",
                                "Premium organic positioning",
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <span className="text-accent font-bold">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <p>This selective approach helps us maintain:</p>

                        <ul className="space-y-2">
                            {[
                                "Stronger marketplace trust",
                                "Premium ecosystem positioning",
                                "Higher documentation discipline",
                                "Long-term credibility",
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <ClipboardCheck size={16} className="text-accent" />
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
                            Vendor Benefits
                        </span>

                        <h2 className="font-heading text-4xl md:text-5xl text-primary">
                            Benefits of Joining SIRABA ORGANIC.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vendorBenefits.map((item, i) => (
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
            <section className="py-20 md:py-28 bg-surface border-b border-secondary/10">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
                        Vendor Philosophy
                    </span>

                    <h2 className="font-heading text-4xl md:text-5xl text-primary mb-10">
                        Building Long-Term Vendor Credibility.
                    </h2>

                    <div className="space-y-6 text-text-secondary text-base md:text-lg leading-relaxed font-light text-left">
                        <p>
                            SIRABA ORGANIC aims to build partnerships with vendors who:
                        </p>

                        <ul className="space-y-2">
                            {[
                                "Value long-term trust over short-term expansion",
                                "Prioritize documentation and accountability",
                                "Maintain internationally aligned standards",
                                "Understand premium organic positioning",
                                "Believe credibility should be earned through systems",
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Building2 size={16} className="text-accent" />
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
                                "Transparency",
                                "Traceability",
                                "Scientific documentation",
                                "Disciplined governance",
                                "Internationally recognized compliance systems",
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
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-6">
                            Qualification Process
                        </span>

                        <h2 className="font-heading text-4xl md:text-5xl text-primary">
                            Vendor Qualification Process.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {processSteps.map((step, i) => (
                            <div
                                key={i}
                                className="bg-surface border border-secondary/10 rounded-2xl p-6 text-center relative"
                            >
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-primary font-bold text-lg mb-5">
                                    {i + 1}
                                </span>

                                <h3 className="font-heading text-lg text-primary font-bold mb-3">
                                    {step.title}
                                </h3>

                                <p className="text-text-secondary text-sm leading-relaxed font-light">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────────────── FINAL CTA ───────────────── */}
            <section className="py-20 md:py-32 bg-primary text-surface relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">
                        Apply for Vendor Qualification
                    </span>

                    <h2 className="font-heading text-4xl md:text-6xl leading-tight font-bold mt-6 mb-8">
                        Join a Curated Organic Marketplace Ecosystem.
                    </h2>

                    <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-3xl mx-auto mb-12">
                        Join a curated organic marketplace ecosystem built around
                        certification, scientific documentation, and internationally aligned
                        compliance standards.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto bg-accent text-primary px-10 py-4 font-bold uppercase tracking-widest hover:bg-surface transition-all duration-300 shadow-lg transform hover:-translate-y-1"
                        >
                            Apply Now
                        </Link>

                        <Link
                            to="/contact"
                            className="w-full sm:w-auto bg-transparent border border-accent text-surface px-10 py-4 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg transform hover:-translate-y-1"
                        >
                            Contact Vendor Support
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VendorQualification;