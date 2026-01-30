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

      {/* The Four Pillars */}
      <section className="py-24 px-4 bg-secondary/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">
              Our Foundation
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-primary font-bold mt-4">
              The Four Pillars of Siraba
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pillar 1 */}
            <div className="bg-surface p-8 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-accent">
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <Leaf size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary mb-3">
                Certified Organic Practices
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Our sourcing and processing follow USDA Organic and NPOP (India
                Organic) guidelines, aligned with APEDA export requirements
                where applicable.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-surface p-8 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-primary">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Award size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary mb-3">
                Quality Testing
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Each production batch undergoes independent laboratory testing
                using internationally recognized analytical methods to assess
                safety and quality parameters.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-surface p-8 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-accent">
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <MapPin size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary mb-3">
                Origin Transparency
              </h3>
              <ul className="text-text-secondary text-sm list-disc list-inside space-y-1">
                <li>
                  <strong>Kashmir</strong> — saffron
                </li>
                <li>
                  <strong>Ladakh & selected Indian regions</strong> — compounded
                  and processed hing
                </li>
              </ul>
            </div>

            {/* Pillar 4 */}
            <div className="bg-surface p-8 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-primary">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Globe size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary mb-3">
                Export-Ready Operations
              </h3>
              <ul className="text-text-secondary text-sm space-y-1 mb-3">
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} /> Batch traceability
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} /> Documentation records
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} /> Food-grade packaging
                </li>
              </ul>
              <p className="text-text-secondary text-sm">
                Designed to support international trade requirements and buyer
                audits.
              </p>
            </div>
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
