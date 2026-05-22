import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Globe,
  BadgeCheck,
  Store,
  CheckCircle,
  ArrowRight,
  Mail,
  Sparkles,
  FileText,
  Users,
  Package,
  Award,
  ExternalLink,
} from "lucide-react";

// ── Asset imports ────────────────────────────────────────────────────────────
import QualifiedVendorImg    from "../assets/qualified_vendorbadge.png";
import TripleVerifiedImg     from "../assets/triple_verifiedbadge.png";
import MarketplaceApprovedImg from "../assets/marketplace_approvedbadge.png";
import InternationalImg      from "../assets/international_badge.png";
import Footer               from "../components/Footer";
import Navbar               from "../components/Navbar";

// ── Watermark ────────────────────────────────────────────────────────────────
const WatermarkBg = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden"
    style={{ opacity: 0.035 }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
      style={{ position: "absolute", top: 0, left: 0 }}>
      <defs>
        <pattern id="siraba-wm-mb2" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          <g transform="translate(100,100)">
            <ellipse cx="0" cy="-20" rx="24" ry="42" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(-20)" />
            <ellipse cx="0" cy="-20" rx="24" ry="42" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(20)" />
            <text x="0" y="10" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="32" fill="#16a34a">S</text>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#siraba-wm-mb2)" />
    </svg>
  </div>
);

// ── Gold divider ornament ────────────────────────────────────────────────────
const GoldDivider = () => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/60" />
    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
    <div className="w-2 h-2 rounded-full bg-amber-400" />
    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
    <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/60" />
  </div>
);

// ── Badge data ───────────────────────────────────────────────────────────────
const badges = [
  {
    id: "qualified-vendor",
    num: "01",
    image: QualifiedVendorImg,
    name: "Siraba Qualified Vendor™",
    tagline: "Approved · Verified · Trusted",
    subTagline: "Qualified by Standards. Trusted by Siraba Organic.",
    icon: <ShieldCheck size={18} />,
    accentColor: "#16a34a",
    tier: "Foundation",
    tierStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description:
      "Awarded to vendors who meet Siraba Organic's strict qualification standards — including certification, documentation, traceability, and compliance requirements.",
    criteria: [
      "Valid NPOP (India Organic) certification",
      "USDA Organic or EU Organic certification",
      "NABL-accredited laboratory documentation",
      "Sourcing & traceability records submitted",
      "Full compliance with Siraba Organic onboarding standards",
    ],
    placements: ["Vendor Pages", "Vendor Certificates", "Email Signatures", "LinkedIn", "Packaging"],
  },
  {
    id: "triple-verified",
    num: "02",
    image: TripleVerifiedImg,
    name: "Triple-Verified Organic™",
    tagline: "Certified · Verified · Qualified",
    subTagline: "Trusted Standards. Verified Integrity.",
    icon: <BadgeCheck size={18} />,
    accentColor: "#d4af37",
    tier: "Elite",
    tierStyle: "bg-amber-50 text-amber-700 border-amber-200",
    description:
      "Represents Siraba Organic's commitment to triple verification — through international certifications, scientific documentation, and marketplace qualification standards.",
    criteria: [
      "Layer 1 — NPOP Organic Compliance (India)",
      "Layer 2 — USDA Organic or EU Organic Validation",
      "Layer 3 — NABL-accredited Scientific Documentation",
      "All three layers independently verified before eligibility",
    ],
    placements: ["Product Pages", "Marketplace Listings", "Packaging", "Vendor Certificates", "LinkedIn"],
  },
  {
    id: "marketplace-approved",
    num: "03",
    image: MarketplaceApprovedImg,
    name: "Siraba Marketplace Approved™",
    tagline: "Curated · Verified · Trusted",
    subTagline: "Approved by Standards. Trusted by Siraba Organic.",
    icon: <Store size={18} />,
    accentColor: "#0e7490",
    tier: "Verified",
    tierStyle: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description:
      "Signifies that the vendor and their products have successfully met all qualification requirements, certification standards, documentation checks, and compliance validations set by Siraba Organic.",
    criteria: [
      "Passed all vendor qualification stages",
      "Certification documents independently verified",
      "Products reviewed for purity and compliance",
      "Quality documentation assessed and approved",
      "Full marketplace onboarding completed",
    ],
    placements: ["Product Pages", "Vendor Pages", "Marketplace Listings", "Packaging", "LinkedIn"],
  },
  {
    id: "international-aligned",
    num: "04",
    image: InternationalImg,
    name: "International Standards Aligned™",
    tagline: "Global Standards · Global Trust",
    subTagline: "Aligned Globally. Trusted Locally. Respected Worldwide.",
    icon: <Globe size={18} />,
    accentColor: "#7c3aed",
    tier: "Global",
    tierStyle: "bg-violet-50 text-violet-700 border-violet-200",
    description:
      "Represents alignment with globally recognized organic standards — including NPOP, USDA Organic, and EU Organic — ensuring international credibility and consumer confidence.",
    criteria: [
      "Alignment with NPOP (India) organic standards",
      "Compliance with USDA Organic standards",
      "Compliance with EU Organic standards",
      "Export documentation readiness verified",
      "Internationally oriented product positioning",
    ],
    placements: ["Vendor Pages", "Product Pages", "Marketplace Listings", "LinkedIn", "Email Signatures"],
  },
];

const placementIcons = {
  "Vendor Pages":        <Users size={13} />,
  "Product Pages":       <Package size={13} />,
  "Vendor Certificates": <FileText size={13} />,
  "LinkedIn":            <ExternalLink size={13} />,
  "Packaging":           <Award size={13} />,
  "Email Signatures":    <Mail size={13} />,
  "Marketplace Listings":<Store size={13} />,
};

const steps = [
  { n: "01", title: "Submit Application",      desc: "Vendor inquiry via registration page or email" },
  { n: "02", title: "Certification Review",    desc: "NPOP + USDA / EU Organic documents verified" },
  { n: "03", title: "Lab Documentation",       desc: "NABL-accredited testing records evaluated" },
  { n: "04", title: "Compliance Assessment",   desc: "Sourcing, packaging and documentation reviewed" },
  { n: "05", title: "Marketplace Approval",    desc: "Qualification confirmed; badges awarded" },
];

// ── Component ────────────────────────────────────────────────────────────────
const MarketplaceBadges = () => {
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="w-full bg-background min-h-screen relative overflow-x-hidden">
      <Navbar />
      <WatermarkBg />

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-20"
        style={{ background: "linear-gradient(160deg, #061510 0%, #0d2818 40%, #1a3c2a 70%, #0d2818 100%)" }}
      >
        {/* decorative gold lines */}
        <div className="absolute top-0 inset-x-0 h-[2px]"
          style={{ background: "linear-gradient(90deg,transparent,#d4af37 40%,#d4af37 60%,transparent)" }} />
        <div className="absolute bottom-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,#d4af37 40%,#d4af37 60%,transparent)" }} />

        {/* subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, #d4af37 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">

          {/* eyebrow */}
          <div className="flex justify-center mb-7">
            <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-[0.25em] border border-amber-400/30 bg-amber-400/10 px-5 py-2.5 rounded-full">
              <Sparkles size={12} className="animate-pulse" />
              Vendor Ecosystem · Qualification Badges
            </span>
          </div>

          {/* headline */}
          <h1 className="font-heading text-center text-4xl sm:text-5xl md:text-6xl text-white font-bold leading-tight mb-5">
            Marketplace{" "}
            <span className="italic" style={{ color: "#d4af37", textShadow: "0 0 40px rgba(212,175,55,0.25)" }}>
              Qualification
            </span>
            <br />Badges.
          </h1>

          <GoldDivider />

          <p className="text-white/65 text-center text-sm md:text-base font-light leading-relaxed max-w-2xl mx-auto mt-5 mb-14">
            Vendor-facing ecosystem assets awarded exclusively to sellers who meet
            Siraba Organic's strict certification, documentation, and compliance standards.
          </p>

          {/* ── 4 badge previews ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {badges.map((b) => (
              <a
                key={b.id}
                href={`#${b.id}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:bg-white/10 hover:border-amber-400/40 transition-all duration-300"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex-shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-lg">
                  <img src={b.image} alt={b.name} className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-amber-300 text-xs font-bold leading-snug">
                    {b.name.replace("Siraba ", "").replace(" Organic", "")}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5 leading-tight hidden sm:block">
                    {b.tagline}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {/* stat strip */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-14 pt-10 border-t border-white/10">
            {[
              { val: "4", label: "Qualification Badges" },
              { val: "3", label: "Verification Layers" },
              { val: "3+", label: "International Standards" },
              { val: "100%", label: "Approval-Based" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-3xl md:text-4xl font-bold text-amber-400">{s.val}</p>
                <p className="text-white/50 text-xs uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          INTRO BANNER
      ══════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-background relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#16a34a,#d4af37,#16a34a)" }} />
            <div className="p-7 flex flex-col sm:flex-row gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Award size={22} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-primary mb-2">
                  What Are Qualification Badges?
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed font-light">
                  Qualification badges are trust signals awarded exclusively to vendors who
                  successfully complete Siraba Organic's approval-based onboarding process.
                  They are designed for use across vendor pages, product listings, certificates,
                  LinkedIn profiles, packaging, and email communications — reinforcing
                  credibility at every customer touchpoint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BADGE DETAIL CARDS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-16 bg-background relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          <div className="text-center mb-12">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-4">
              The Four Seals
            </span>
            <h2 className="font-heading text-3xl md:text-4xl text-primary font-bold">
              Siraba Organic Qualification Seals
            </h2>
          </div>

          <div className="space-y-8">
            {badges.map((badge, idx) => (
              <div
                key={badge.id}
                id={badge.id}
                className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 scroll-mt-28"
              >
                {/* coloured top strip per badge */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${badge.accentColor}, #d4af37, ${badge.accentColor})` }} />

                <div className="p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── left: badge image ── */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full lg:w-auto">
                      <div
                        className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl flex items-center justify-center p-4"
                        style={{ background: "linear-gradient(145deg, #0d2818, #1a3c2a)" }}
                      >
                        <img
                          src={badge.image}
                          alt={badge.name}
                          className="w-full h-full object-contain drop-shadow-xl"
                        />
                      </div>
                      <span className={`text-xs font-bold px-4 py-1.5 rounded-full border ${badge.tierStyle}`}>
                        {badge.tier} Seal
                      </span>
                      <span className="text-text-secondary text-xs font-mono tracking-widest opacity-50">
                        BADGE {badge.num}
                      </span>
                    </div>

                    {/* ── right: details ── */}
                    <div className="flex-1 min-w-0">

                      {/* header */}
                      <div className="flex items-start gap-3 mb-1">
                        <span className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          {badge.icon}
                        </span>
                        <div>
                          <h3 className="font-heading text-xl md:text-2xl text-primary font-bold leading-tight">
                            {badge.name}
                          </h3>
                          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-[0.15em] mt-1">
                            {badge.tagline}
                          </p>
                        </div>
                      </div>

                      {/* description */}
                      <p className="text-text-secondary text-sm leading-relaxed font-light mt-4 mb-5">
                        {badge.description}
                      </p>

                      {/* criteria */}
                      <div className="mb-5">
                        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="w-5 h-px bg-emerald-400 inline-block" />
                          Qualification Criteria
                        </p>
                        <ul className="space-y-2">
                          {badge.criteria.map((c) => (
                            <li key={c} className="flex items-start gap-2.5 text-sm text-text-secondary">
                              <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* placement chips */}
                      <div>
                        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2.5 flex items-center gap-2">
                          <span className="w-5 h-px bg-amber-400 inline-block" />
                          Recommended Placements
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {badge.placements.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full font-medium"
                            >
                              <span className="text-emerald-500">{placementIcons[p]}</span>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* footer bar */}
                <div className="px-6 md:px-8 py-3.5 border-t border-emerald-50 bg-gradient-to-r from-emerald-50/60 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-text-secondary text-xs italic">
                    "{badge.subTagline}"
                  </p>
                  <span className="text-amber-600 text-xs font-bold uppercase tracking-widest flex-shrink-0">
                    Siraba Organic
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ALL FOUR BADGES TOGETHER — dark showcase grid
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 relative z-10" style={{ background: "linear-gradient(160deg,#061510,#0d2818 50%,#1a3c2a)" }}>
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />
        <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #d4af37 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-[0.25em] border border-amber-400/30 bg-amber-400/10 px-5 py-2 rounded-full mb-5">
              <Sparkles size={11} />
              Complete Badge Suite
            </span>
            <h2 className="font-heading text-2xl md:text-3xl text-white font-bold mb-3">
              The Siraba Organic Badge Ecosystem
            </h2>
            <p className="text-white/50 text-sm font-light max-w-xl mx-auto">
              All four seals work together to create a layered, credibility-first
              vendor ecosystem. Each communicates a distinct dimension of trust.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {badges.map((b) => (
              <a
                href={`#${b.id}`}
                key={b.id}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 hover:bg-white/10 hover:border-amber-400/40 transition-all duration-300"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 transition-transform duration-300 group-hover:scale-105">
                  <img src={b.image} alt={b.name} className="w-full h-full object-contain drop-shadow-xl" />
                </div>
                <div className="text-center">
                  <p className="text-amber-300 text-xs font-bold leading-snug mb-1">{b.name}</p>
                  <p className="text-white/40 text-xs">{b.tagline}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${b.tierStyle}`}>
                  {b.tier}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW TO EARN — 5-step process
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-background relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full mb-4">
              Qualification Path
            </span>
            <h2 className="font-heading text-2xl md:text-3xl text-primary font-bold mb-3">
              How to Earn These Badges
            </h2>
            <p className="text-text-secondary text-sm font-light max-w-xl mx-auto">
              All badges are earned — never self-assigned. Onboarding is fully approval-based.
            </p>
          </div>

          {/* steps — horizontal on md+, vertical on mobile */}
          <div className="relative">
            {/* connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {steps.map((s, i) => (
                <div key={s.n} className="flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-3 text-left md:text-center relative">
                  {/* mobile connector */}
                  {i < steps.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-0 w-px bg-emerald-100 md:hidden" />
                  )}
                  <div className="flex-shrink-0 relative z-10 w-9 h-9 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-heading text-sm font-bold text-primary mb-1">{s.title}</p>
                    <p className="text-text-secondary text-xs font-light leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-text-secondary text-xs">
              Applications reviewed within{" "}
              <span className="font-semibold text-emerald-600">2–5 business days</span>{" "}
              after all documents are submitted.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHERE TO USE — placement grid
      ══════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-surface border-t border-b border-secondary/10 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-heading text-lg font-bold text-primary mb-7 text-center">
            Recommended Badge Placements
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(placementIcons).map(([label, icon]) => (
              <div key={label}
                className="flex items-center gap-2 bg-white border border-emerald-100 rounded-xl px-4 py-2.5 shadow-sm text-sm font-medium text-primary hover:border-emerald-300 hover:shadow-md transition-all">
                <span className="text-emerald-500">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-background relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div
            className="relative rounded-2xl overflow-hidden text-white text-center p-8 md:p-12 shadow-2xl"
            style={{ background: "linear-gradient(135deg,#061510 0%,#0d2818 50%,#1a3c2a 100%)" }}
          >
            {/* gold top border */}
            <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />
            {/* dot pattern */}
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: "radial-gradient(circle,#d4af37 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-[0.25em] border border-amber-400/30 bg-amber-400/10 px-5 py-2 rounded-full mb-6">
                <Sparkles size={11} />
                Apply for Vendor Qualification
              </span>

              <h3 className="font-heading text-2xl md:text-4xl font-bold mb-3">
                Become a Qualified Vendor.
              </h3>

              <GoldDivider />

              <p className="text-white/60 text-sm font-light mt-4 mb-8 max-w-xl mx-auto leading-relaxed">
                Contact us with your company details, product category, and certification
                information to begin the approval-based qualification process.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:info@sirabaorganic.com?subject=Vendor%20Registration%20%E2%80%93%20Siraba%20Organic"
                  className="inline-flex items-center gap-2 bg-amber-400 text-emerald-900 px-7 py-3.5 rounded-xl text-sm font-bold hover:bg-amber-300 transition-colors shadow-lg"
                >
                  <Mail size={16} />
                  info@sirabaorganic.com
                </a>
                <Link
                  to="/vendor/qualification"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
                >
                  View Qualification Program
                  <ArrowRight size={15} />
                </Link>
              </div>

              <p className="text-white/30 text-xs mt-8">
                UDYAM-HR-05-0179395 · www.sirabaorganic.com
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MarketplaceBadges;