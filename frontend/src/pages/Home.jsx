import { ArrowRight, Star, Leaf, ShieldCheck, Globe, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import HeroVideo from "../assets/Siraba_s_Organic_Spices_Video_Ready.mp4";
import SaffronImg from "../assets/saffron_jar.png";
import AsafoetidaImg from "../assets/hing_jar_s.png";
import BgImage2 from "../assets/bgimage2.png";
import BgImage1 from "../assets/bgimage1.png"; // Fallback or extra usage
import TextMarquee from "../components/TextMarquee";

const Home = () => {
  const { homeContent, products } = useProducts();

  const getSignatureProducts = () => {
    if (
      homeContent.signatureProducts &&
      homeContent.signatureProducts.length > 0
    ) {
      return homeContent.signatureProducts
        .map((id) => products.find((p) => p._id === id || p.id === id))
        .filter(Boolean); // Filter out any undefineds if product deleted
    }
    return products.slice(0, 2);
  };

  return (
    <div className="w-full pt-20">

      {/* ── HERO SECTION ── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover blur-[2px] scale-105"
            poster={BgImage1}
          >
            <source src={HeroVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-primary/40 md:bg-primary/30 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up">
          {/* Cert badge */}
          <span className="font-subheading text-accent text-xs md:text-sm tracking-[0.15em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm">
            EU Organic • USDA Organic • NPOP Certified • NABL Accredited Lab Testing Standards
          </span>
          <br />
          <br />
          <span className="inline-flex items-center gap-2 border border-accent/30 text-accent px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-black/20">
            <Sparkles size={14} />
            Triple-Verified Organic Marketplace
          </span>

          {/* Main Headline */}
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-surface leading-tight text-shadow max-w-6xl mx-auto">
            Verified Organic{" "}
            <br />
            <span className="italic text-accent">Not Organic by Claim.</span>
          </h1>

          {/* Supporting Headline */}
          <p className="font-body text-white/90 text-base md:text-lg max-w-3xl mx-auto font-light leading-relaxed">
            SIRABA ORGANIC is a certification-led platform offering premium organic ingredients from vendors
            who meet internationally recognized organic standards and scientific documentation requirements.
          </p>

          <div className="bg-primary text-surface text-sm tracking-widest uppercase px-8 py-4 hover:bg-accent transition-all duration-300 transform hover:-translate-y-1 shadow-lg w-50vw md:w-auto">
            Not Every Organic Product Qualifies for SIRABA ORGANIC.
          </div>

          {/* Trust Statement */}
          {/* <div className="inline-block bg-black/30 backdrop-blur border border-white/20 rounded-xl px-6 py-4 text-left">
            <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-3">
              Every listed product must meet:
            </p>
            <ul className="space-y-1.5">
              {[
                "NPOP Certification",
                "USDA Organic OR EU Organic Certification",
                "NABL-Accredited Lab Testing Standards",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-surface text-sm font-light">
                  <span className="text-accent font-bold">•</span> {item}
                </li>
              ))}
            </ul>
          </div> */}

          {/* CTAs */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-2">
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
              Vendor Qualification Program
            </Link>
          </div>
        </div>
      </section>

      {/* ── USP HIGHLIGHT BANNER ── */}
      <section className="relative overflow-hidden py-6 md:py-8" style={{ background: 'linear-gradient(135deg, #1a3c2a 0%, #0d2818 40%, #1a3c2a 100%)' }}>
        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40%, rgba(212,175,55,0.3) 50%, transparent 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }} />
        {/* Top & bottom gold accent lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5">
            <span className="flex items-center gap-2 text-accent text-xs md:text-sm font-bold uppercase tracking-[0.25em] bg-accent/10 border border-accent/30 px-4 py-1.5 rounded-full">
              <Sparkles size={14} className="animate-pulse" />
              USP
            </span>
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl text-surface font-bold tracking-wide">
              India's{" "}
              <span className="text-accent" style={{ textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>
                Triple-Verified
              </span>{" "}
              Organic Marketplace
            </h2>
          </div>
          <p className="text-white/50 text-xs md:text-sm mt-3 tracking-widest uppercase font-light">
            EU Organic · USDA Organic · NPOP Certified · NABL Lab Standards
          </p>
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="bg-primary py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
            {[
              "✔ Triple-Verified Organic Standards",
              "✔ Internationally Certified Vendors",
              "✔ NABL Lab Documentation",
              "✔ Batch-Wise Traceability",
              "✔ Export-Grade Compliance",
            ].map((item, i) => (
              <span key={i} className="text-accent text-xs md:text-sm font-bold tracking-widest uppercase whitespace-nowrap">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOVING TEXT BANNER ── */}
      {/* <TextMarquee /> */}

      {/* ── SECTION 2 — THE SIRABA STANDARD™ ── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
            The SIRABA Standard™
          </span>
          <h2 className="font-heading text-4xl md:text-5xl text-primary leading-tight">
            Organic Claims Require Proof.
          </h2>
          <div className="space-y-5 text-text-secondary text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto text-left">
            <p>
              In today's market, many products are labeled "organic" without meaningful verification, traceability, or internationally recognized compliance standards.
            </p>
            <p>
              SIRABA ORGANIC was created to build a different kind of platform — one where certification, documentation, and scientific validation form the foundation of trust.
            </p>
            <p className="font-semibold text-primary">
              We do not operate as an open marketplace.
            </p>
            <p>
              Every vendor must qualify through SIRABA's Triple Verification Framework™ before their products can be listed on the platform.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — TRIPLE VERIFICATION FRAMEWORK™ ── */}
      <section className="py-20 md:py-28 bg-surface border-b border-secondary/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Principle Header ── */}
          <div className="text-center mb-6 space-y-4">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              Our Framework
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              SIRABA ORGANIC™ Triple Verification Principle
            </h2>
          </div>

          {/* ── CERTIFIED → VERIFIED → QUALIFIED flow bar ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 mb-8">
            {[
              { label: "CERTIFIED", color: "bg-primary text-surface" },
              { label: "VERIFIED", color: "bg-accent text-primary" },
              { label: "QUALIFIED", color: "bg-secondary text-surface" },
            ].map((step, i) => (
              <div key={i} className="flex items-center">
                <div className={`${step.color} px-7 py-3 font-heading font-bold text-sm tracking-[0.2em] uppercase shadow-md`}>
                  {step.label}
                </div>
                {i < 2 && (
                  <div className="hidden sm:block w-8 h-0.5 bg-gradient-to-r from-secondary/40 to-secondary/10" />
                )}
              </div>
            ))}
          </div>

          {/* ── Principle sub-descriptions ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 max-w-5xl mx-auto text-center">
            {[
              { title: "Certified", desc: "Certified by recognized regulatory and organic certification bodies." },
              { title: "Verified", desc: "Scientifically Verified through evidence-based review of laboratory reports, scientific documentation, and traceability records." },
              { title: "Qualified", desc: "Qualified through SIRABA ORGANIC™ marketplace assessment and ongoing compliance review." },
            ].map((item, i) => (
              <div key={i} className="bg-background rounded-xl px-6 py-5 border border-secondary/10 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">{item.title}</p>
                <p className="text-text-secondary text-sm leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4 mb-14 max-w-3xl mx-auto">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
            <span className="text-accent text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap px-3">
              THE SIRABA FRAMEWORK
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
          </div>

          {/* ── Three Layer Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* LAYER 1 — CERTIFIED */}
            <div className="relative bg-background border border-secondary/10 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
              {/* Top accent stripe */}
              <div className="h-1.5 w-full bg-primary" />
              <div className="p-8 space-y-5 flex-1 flex flex-col">
                <div className="space-y-1">
                  <span className="text-primary text-xs font-bold uppercase tracking-[0.2em]">Layer 1</span>
                  <h3 className="font-heading text-2xl text-primary font-bold leading-tight">CERTIFIED</h3>
                  <p className="text-text-secondary text-xs font-light tracking-wide">Organic Regulatory & Certification Compliance</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">Mandatory</p>
                  <ul className="space-y-1.5">
                    {[
                      "Valid NPOP Certification",
                      "Product Scope Certificate",
                      "FSSAI License",
                      "GST Registration",
                      "USDA Organic Certification OR EU Organic Certification",
                    ].map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                        <ShieldCheck size={13} className="text-primary flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent pt-2">Optional</p>
                  <p className="text-xs text-text-secondary font-light pl-1 italic">
                    Other International Organic Certifications
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-secondary/10 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Ensures</p>
                  {[
                    "Regulatory compliance",
                    "Organic production standards",
                    "National and international certification recognition",
                  ].map((e, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-primary font-bold text-base leading-none">✓</span>
                      {e}
                    </div>
                  ))}
                  <div className="pt-3">
                    <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-primary/20">
                      ✔ Certified Organic Compliance Confirmed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LAYER 2 — VERIFIED (highlighted) */}
            <div className="relative bg-primary border border-primary rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col">
              <div className="h-1.5 w-full bg-accent" />
              {/* Subtle glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
              <div className="p-8 space-y-5 flex-1 flex flex-col relative z-10">
                <div className="space-y-1">
                  <span className="text-accent text-xs font-bold uppercase tracking-[0.2em]">Layer 2</span>
                  <h3 className="font-heading text-2xl text-surface font-bold leading-tight">VERIFIED</h3>
                  <p className="text-surface/60 text-xs font-light tracking-wide">Scientific Evidence & Traceability Validation</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent/80">Evidence Reviewed</p>
                  <ul className="space-y-1.5">
                    {[
                      "Laboratory Evidence (NABL / ISO 17025 / ILAC-MRA / Recognized International Laboratories)",
                      "Certificate of Analysis (CoA)",
                      "Product Documentation",
                      "Batch-wise Test Reports",
                      "Farm-to-Fork Traceability Records",
                      "Packaging & Supply Chain Verification",
                    ].map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-surface/80">
                        <ShieldCheck size={13} className="text-accent flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-4 border-t border-surface/10 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">Ensures</p>
                  {[
                    "Scientific evidence review",
                    "Documentation-backed authenticity",
                    "Product traceability and transparency",
                    "Evidence-based verification",
                  ].map((e, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-surface/80">
                      <span className="text-accent font-bold text-base leading-none">✓</span>
                      {e}
                    </div>
                  ))}
                  <div className="pt-3">
                    <span className="inline-block bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-accent/30">
                      ✔ Scientifically Verified by SIRABA ORGANIC™
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LAYER 3 — QUALIFIED */}
            <div className="relative bg-background border border-secondary/10 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <div className="h-1.5 w-full bg-secondary" />
              <div className="p-8 space-y-5 flex-1 flex flex-col">
                <div className="space-y-1">
                  <span className="text-secondary text-xs font-bold uppercase tracking-[0.2em]">Layer 3</span>
                  <h3 className="font-heading text-2xl text-primary font-bold leading-tight">QUALIFIED</h3>
                  <p className="text-text-secondary text-xs font-light tracking-wide">SIRABA ORGANIC™ Marketplace Qualification Framework</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">Assessment Criteria</p>
                  <ul className="space-y-1.5">
                    {[
                      "Vendor Documentation Review",
                      "Brand Presence Assessment",
                      "Ethical Sourcing Evaluation",
                      "Responsiveness Assessment",
                      "Product Quality Evaluation",
                      "Continuous Compliance Monitoring",
                    ].map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                        <ShieldCheck size={13} className="text-secondary flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-4 border-t border-secondary/10 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Ensures</p>
                  {[
                    "Marketplace readiness",
                    "Quality consistency",
                    "Long-term trust and accountability",
                  ].map((e, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-secondary font-bold text-base leading-none">✓</span>
                      {e}
                    </div>
                  ))}
                  <div className="pt-3">
                    <span className="inline-block bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-secondary/20">
                      ✔ SIRABA Qualified Vendor™
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Architecture Footer ── */}
          <div className="mt-14 text-center space-y-3">
            <div className="flex items-center justify-center gap-0 flex-wrap">
              {[
                { label: "CERTIFIED™", sub: "Certification Compliance", color: "bg-primary text-surface" },
                { label: "VERIFIED™", sub: "Scientific Evidence Review", color: "bg-accent text-primary" },
                { label: "QUALIFIED™", sub: "Marketplace Qualification", color: "bg-secondary text-surface" },
              ].map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className={`${step.color} px-5 py-3 text-center shadow-md`}>
                    <p className="font-heading font-bold text-xs tracking-[0.2em] uppercase">{step.label}</p>
                    <p className="text-[10px] opacity-75 font-light tracking-wide mt-0.5">{step.sub}</p>
                  </div>
                  {i < 2 && (
                    <div className="flex items-center px-1">
                      <ArrowRight size={16} className="text-accent/60" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 4 — FLAGSHIP FOCUS ── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 text-accent text-sm tracking-[0.2em] uppercase font-bold">
              <Clock size={16} />
              Launching Soon
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-primary">
              Flagship Ingredients Built Around Trust.
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto font-light">
              SIRABA ORGANIC is strategically launching with two globally recognized ingredients that demand the highest levels of authenticity, sourcing discipline, and quality assurance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
            {/* Kashmiri Saffron */}
            <div className="group relative bg-surface border border-secondary/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-accent/90 text-primary text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <Clock size={12} /> Launching Soon
                </span>
              </div>
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/5 to-secondary/5 p-8 flex items-center justify-center">
                <img
                  src={SaffronImg}
                  alt="Kashmiri Saffron"
                // className="max-h-[220px] w-auto object-contain opacity-95 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-8 space-y-5">
                <h3 className="font-heading text-2xl md:text-3xl text-primary font-bold">
                  Kashmiri Saffron
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Premium saffron sourced from high-altitude regions known for their heritage cultivation practices, deep color, aroma, and potency.
                </p>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Focus Areas</p>
                  <ul className="space-y-1.5">
                    {[
                      "Premium-grade stigmas",
                      "Globally compliant sourcing",
                      "Certification-backed supply chain",
                      "Export-oriented standards",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-primary">
                        <Sparkles size={13} className="text-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Applications</p>
                  <p className="text-text-secondary text-sm">
                    Gourmet culinary use • Wellness formulations • Nutraceutical applications • Luxury food &amp; beverage products
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Asafoetida */}
            <div className="group relative bg-surface border border-secondary/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-accent/90 text-primary text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <Clock size={12} /> Launching Soon
                </span>
              </div>
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/5 to-secondary/5 p-8 flex items-center justify-center">
                <img
                  src={AsafoetidaImg}
                  alt="Premium Asafoetida (Hing)"
                // className="max-h-[220px] w-auto object-contain opacity-95 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-8 space-y-5">
                <h3 className="font-heading text-2xl md:text-3xl text-primary font-bold">
                  Premium Asafoetida – Hing
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Certified organic asafoetida developed for modern kitchens, wellness-conscious consumers, and premium food applications.
                </p>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Focus Areas</p>
                  <ul className="space-y-1.5">
                    {[
                      "Export-grade processing standards",
                      "Certification-led sourcing",
                      "Documentation-backed quality systems",
                      "Traceable handling practices",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-primary">
                        <Sparkles size={13} className="text-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Applications</p>
                  <p className="text-text-secondary text-sm">
                    Culinary preparation • Ayurvedic traditions • Functional food usage • Digestive wellness applications
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — WHY SIRABA ORGANIC ── */}
      <section className="py-20 md:py-28 bg-surface border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
              Our Difference
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              Why SIRABA ORGANIC Is Different
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Curated Vendor Qualification", desc: "We partner only with vendors who meet internationally recognized organic certification standards." },
              { num: "02", title: "Triple-Verified Trust Architecture", desc: "Every product must satisfy certification, international compliance, and scientific documentation requirements." },
              { num: "03", title: "Compliance-First Marketplace Model", desc: "SIRABA prioritizes documented credibility over mass product onboarding." },
              { num: "04", title: "Premium Organic Positioning", desc: "Our ecosystem is built for consumers who value purity, traceability, and globally recognized standards." },
              { num: "05", title: "Export-Grade Standards", desc: "Focus on internationally aligned packaging, documentation, and compliance systems." },
              { num: "06", title: "Long-Term Trust Philosophy", desc: "We believe organic credibility should be earned through systems — not marketing claims." },
            ].map((item, i) => (
              <div key={i} className="bg-background border border-secondary/10 rounded-2xl p-7 space-y-3 hover:shadow-md transition-shadow duration-300">
                <span className="font-heading text-4xl text-accent/50 font-bold">{item.num}</span>
                <h3 className="font-heading text-lg text-primary font-bold">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — SELECTIVE MARKETPLACE POSITIONING ── */}
      <section className="py-20 md:py-28 bg-primary text-surface relative overflow-hidden border-b border-accent/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
            Our Standards
          </span>
          <h2 className="font-heading text-4xl md:text-5xl leading-tight">
            Not Every Organic Product Qualifies for SIRABA ORGANIC.
          </h2>
          <div className="space-y-5 text-white/80 text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto text-left">
            <p className="font-semibold text-surface">
              Our onboarding standards are intentionally selective.
            </p>
            <p>
              Unlike open marketplaces that prioritize quantity, SIRABA ORGANIC is built around disciplined vendor qualification, internationally recognized certifications, and compliance-backed sourcing systems.
            </p>
            <p className="text-white/70">This selective approach allows us to maintain:</p>
            <ul className="space-y-2 pl-2">
              {[
                "Stronger marketplace credibility",
                "Higher compliance standards",
                "Premium positioning",
                "Long-term consumer trust",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-surface text-sm">
                  <span className="text-accent font-bold">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── SECTION 7 — ABOUT SIRABA (SHORT) ── */}
      <section className="py-20 md:py-28 bg-background border-b border-secondary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <span className="inline-block text-accent text-xs tracking-[0.2em] uppercase font-bold border border-accent/30 px-4 py-2 rounded-full">
            About SIRABA ORGANIC
          </span>
          <h2 className="font-heading text-4xl md:text-5xl text-primary leading-tight">
            Built on Certification, Integrity, and Trust.
          </h2>
          <div className="space-y-5 text-text-secondary text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto text-left">
            <p>
              SIRABA ORGANIC was founded with a simple belief:{" "}
              <span className="font-semibold text-primary italic">
                organic should be verified — not merely claimed.
              </span>
            </p>
            <p>
              The platform was created to address growing concerns around inconsistent quality, misleading organic labeling, and lack of transparency in premium food categories.
            </p>
            <p>
              Our vision is to build a globally trusted ecosystem where certified vendors grow with credibility and consumers purchase with confidence.
            </p>
          </div>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-accent font-bold text-sm tracking-widest uppercase hover:underline transition-all duration-200"
          >
            Read Our Story <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── SIGNATURE COLLECTION ── */}
      {/* <section className="py-12 bg-surface border-b border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">
              Curated Excellence
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary">
              Signature Collection
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {getSignatureProducts().map((product) => (
              <Link
                key={product._id || product.id}
                to={`/product/${product.slug}`}
                className="group cursor-pointer"
              >
                <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] border border-white/6 rounded-2xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 overflow-hidden">
                  <div className="relative aspect-[3/4] bg-background">
                    <div className="absolute inset-0 bg-primary/6 group-hover:bg-transparent transition-colors duration-400" />
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-4 md:p-6 transform group-hover:scale-103 transition-transform duration-400"
                    />
                    <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
                      <span className="bg-red-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm pointer-events-auto">
                        PROTOTYPE
                      </span>
                      {product.isPremium && (
                        <span className="bg-accent text-primary text-xs font-bold uppercase px-3 py-1 rounded-full shadow-sm pointer-events-auto">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 text-center">
                    <h3 className="font-heading text-base md:text-xl text-primary font-semibold group-hover:text-accent transition-colors truncate">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary">
                      From{" "}
                      <span className="ml-2 text-lg md:text-2xl font-extrabold text-accent">
                        {product.currency}
                        {product.price}
                      </span>
                    </p>
                    <div className="mt-3">
                      <button className="inline-flex items-center justify-center gap-2 bg-accent text-primary py-2 px-4 rounded-full text-sm font-bold hover:brightness-105 transition-all">
                        View Details <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── SECTION 8 — FINAL TRUST CTA ── */}
      <section className="py-20 md:py-32 bg-primary text-surface relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={BgImage2} alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-primary/40 md:bg-primary/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-8">
          <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">
            Global Standards. Certified Trust.
          </span>
          <h2 className="font-heading text-4xl md:text-6xl leading-tight font-bold">
            Experience Organic Products Backed by Global Standards.
          </h2>
          <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-3xl mx-auto">
            Discover a curated ecosystem of internationally certified organic
            products supported by compliance, documentation, and disciplined
            sourcing standards.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
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

export default Home;