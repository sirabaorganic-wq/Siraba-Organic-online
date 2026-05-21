import React, { useEffect } from "react";
import { Globe, Shield, Star, Users, TrendingUp, Package, CheckCircle, ArrowRight, Mail, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: <Globe size={22} className="text-emerald-600" />,
    title: "Access to a Premium Organic Marketplace",
    description:
      "Siraba Organic connects verified organic producers with customers seeking high-quality certified organic products.",
  },
  {
    icon: <Users size={22} className="text-emerald-600" />,
    title: "Reach a Wider Customer Base",
    description:
      "Vendors can reach individual consumers, organic product enthusiasts, gourmet buyers, and businesses seeking certified organic ingredients.",
  },
  {
    icon: <Shield size={22} className="text-emerald-600" />,
    title: "Certification-Focused Marketplace",
    description:
      "Siraba Organic prioritizes products backed by recognized organic certifications such as EU Organic, USDA Organic, and NPOP (India Organic).",
  },
  {
    icon: <Star size={22} className="text-emerald-600" />,
    title: "Strong Brand Positioning",
    description:
      "Vendors benefit from being part of a platform that emphasizes authentic organic sourcing, transparency, and compliance.",
  },
  {
    icon: <TrendingUp size={22} className="text-emerald-600" />,
    title: "Opportunity for International Exposure",
    description:
      "Vendors with multiple certifications may gain opportunities for global marketplace visibility.",
  },
  {
    icon: <Package size={22} className="text-emerald-600" />,
    title: "Focus on Premium Organic Products",
    description:
      "Siraba Organic highlights high-value categories such as Kashmiri Saffron and Premium Asafoetida along with other certified organic products.",
  },
  {
    icon: <CheckCircle size={22} className="text-emerald-600" />,
    title: "Quality and Transparency",
    description:
      "The platform emphasizes certification verification, documentation, and product traceability.",
  },
];

const steps = [
  "Submit vendor application",
  "Provide certification documentation",
  "Product verification",
  "Vendor approval",
  "List and sell products",
];

// Siraba watermark — same pattern used across guide pages
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
          id="siraba-wm-vb"
          x="0"
          y="0"
          width="180"
          height="180"
          patternUnits="userSpaceOnUse"
        >
          <g transform="translate(90,90)">
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(-20)" />
            <ellipse cx="0" cy="-18" rx="22" ry="38" fill="none" stroke="#16a34a" strokeWidth="3" transform="rotate(20)" />
            <text x="0" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="28" fill="#16a34a">S</text>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#siraba-wm-vb)" />
    </svg>
  </div>
);

const VendorBenefits = () => {
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
            Vendor Benefits
          </h1>
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-2">
            Siraba Organic Marketplace
          </p>
        </div>

        {/* ── ELITE MARKETPLACE HIGHLIGHT ── */}
        <div className="relative overflow-hidden rounded-2xl mb-10 py-6 md:py-8" style={{ background: 'linear-gradient(135deg, #1a3c2a 0%, #0d2818 40%, #1a3c2a 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40%, rgba(212,175,55,0.3) 50%, transparent 60%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-vb 3s linear infinite',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
          <div className="text-center relative z-10 px-4">
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="flex items-center gap-2 text-amber-400 text-xs md:text-sm font-bold uppercase tracking-[0.25em] bg-amber-400/10 border border-amber-400/30 px-4 py-1.5 rounded-full">
                <Sparkles size={14} className="animate-pulse" />
                Elite Organic Platform
              </span>
              <h2 className="font-heading text-xl md:text-2xl lg:text-3xl text-white font-bold tracking-wide leading-snug">
                An{" "}
                <span className="text-amber-400" style={{ textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>
                  Elite Organic Marketplace
                </span>{" "}
                for Globally Certified Products.
              </h2>
            </div>
          </div>
          <style>{`@keyframes shimmer-vb { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7 mb-10">
          <p className="text-text-secondary leading-relaxed font-light">
            Siraba Organic is building a trusted marketplace dedicated to
            certified organic products, transparency, and quality verification.
            Vendors who join the platform gain access to customers who value
            authenticity, compliance, and premium organic ingredients.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="mb-12">
          <h2 className="font-heading text-xl md:text-2xl text-primary font-bold mb-6">
            Why Join Siraba Organic?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 flex gap-4 items-start hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-primary text-base mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-text-secondary text-sm font-light leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="mb-10">
          <h2 className="font-heading text-xl md:text-2xl text-primary font-bold mb-6">
            Getting Started
          </h2>
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-7">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
              {steps.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-primary">{step}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight size={16} className="text-emerald-300 hidden sm:block flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 p-8 text-white shadow-lg text-center">
          <h3 className="font-heading text-xl font-bold mb-2">
            Ready to become a vendor?
          </h3>
          <p className="text-emerald-100 text-sm mb-6">
            For vendor onboarding inquiries, reach out to us directly.
          </p>
          <a
            href="mailto:info@sirabaorganic.com?subject=Vendor%20Registration%20%E2%80%93%20Siraba%20Organic"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-md"
          >
            <Mail size={16} />
            info@sirabaorganic.com
          </a>
          <p className="text-emerald-200 text-xs mt-3">
            Subject: Vendor Registration – Siraba Organic
          </p>
          <p className="text-emerald-200 text-xs mt-4">
            UDYAM-HR-05-0179395 · www.sirabaorganic.com
          </p>
        </div>

      </div>
    </div>
  );
};

export default VendorBenefits;