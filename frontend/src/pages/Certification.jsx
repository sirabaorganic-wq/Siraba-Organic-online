import React, { useState, useEffect } from "react";
import client from "../api/client";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  TestTube,
  FileText,
  Globe,
  CheckCircle,
} from "lucide-react";
import BgImage1 from "../assets/bgimage1.png";
// CertImage removed — vendor documents are shown from backend when available

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

  const marketCerts = [
    { id: "us", name: "United States", certs: ["USDA Organic"] },
    { id: "eu", name: "European Union", certs: ["EU Organic Regulation"] },
    { id: "in", name: "India", certs: ["NPOP (India Organic)"] },
    { id: "jp", name: "Japan", certs: ["JAS (Japan Agricultural Standards)"] },
    { id: "cn", name: "China", certs: ["China Organic Certification"] },
    {
      id: "au",
      name: "Australia",
      certs: ["Australian Certified Organic (ACO)"],
    },
    { id: "ca", name: "Canada", certs: ["Canada Organic Regime (COR)"] },
  ];

  return (
    <div className="w-full pt-20 bg-background text-primary">
      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BgImage1}
            alt="Laboratory"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="relative z-10 text-center max-w-4xl px-4 animate-fade-in-up">
          <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold mb-4 block">
            Certification Is a Responsibility, Not a Formality
          </span>
          <h1 className="font-heading text-4xl md:text-6xl text-surface font-bold tracking-tight mb-6">
            Certification Is a Responsibility, Not a Formality
          </h1>
          <div className="flex items-center justify-center space-x-2 text-sm md:text-base text-surface/80 font-light">
            <Link to="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-accent">Certifications</span>
          </div>
        </div>
      </div>

      {/* Introduction Statement */}
      <section className="py-20 px-4 max-w-5xl mx-auto text-center">
        <ShieldCheck
          size={48}
          className="text-accent mx-auto mb-6"
          strokeWidth={1.5}
        />
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-6">
          On Siraba Organic, certification is not treated as marketing — it is a
          vendor obligation.
        </h2>
        <p className="text-text-secondary text-lg md:text-xl font-light leading-relaxed mb-6">
          Every product listed on the platform must be supported by
          government-recognized organic standards, appropriate quality
          documentation, and export-ready traceability, as required by Indian
          regulations and the destination country’s import rules.
        </p>
        <p className="text-text-secondary leading-relaxed max-w-3xl mx-auto">
          This ensures customers worldwide can make informed, confident choices
          about what they consume.
        </p>
      </section>

      {/* Dynamic Content / Backend Integration Area (Preserved layout but updated content if available) */}
      <section className="py-16 bg-surface border-y border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left: Market-by-market certification overview */}
          <div className="order-1">
            <h3 className="font-heading text-3xl font-bold text-primary mb-4">
              Certification & Document Preview
            </h3>
            <p className="text-text-secondary font-light mb-6">
              (Provided by Vendors)
            </p>

            <p className="text-text-secondary mb-6">
              All certifications and compliance documents displayed on Siraba
              Organic are submitted and maintained by individual vendors, who
              act as the exporter and seller of record.
            </p>

            <h4 className="font-heading text-xl font-bold text-primary mb-3">
              Common destination-market certifications (examples)
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {marketCerts.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-surface rounded-sm border border-secondary/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-primary">{m.name}</div>
                      <div className="text-sm text-text-secondary">
                        {m.certs.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Vendor-submitted certifications & standards-based testing notes */}
          <div className="order-2 space-y-6">
            <div>
              <h4 className="font-heading text-xl font-bold text-primary mb-3">
                Verified Through Standards & Testing
              </h4>
              <p className="text-text-secondary font-light mb-4">
                Vendors on Siraba Organic are required to ensure their products
                undergo independent quality and safety testing using recognized
                laboratory testing methods, appropriate to the product type and
                export destination, to support:
              </p>
              <ul className="space-y-3 font-medium text-primary">
                <li className="flex items-center gap-3">
                  <TestTube size={20} className="text-accent" /> Purity &
                  quality parameters
                </li>
                <li className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-accent" /> Food safety
                  requirements
                </li>
                <li className="flex items-center gap-3">
                  <FileText size={20} className="text-accent" /> Ingredient
                  authenticity
                </li>
                <li className="flex items-center gap-3">
                  <Globe size={20} className="text-accent" /> Compliance with
                  applicable organic and trade standards
                </li>
              </ul>
            </div>

            <div className="bg-secondary/5 p-6 rounded-sm border-l-4 border-accent">
              <h4 className="font-bold text-primary uppercase text-sm mb-2">
                Standards Vendors May Comply With
              </h4>
              <ul className="text-sm space-y-2 text-text-secondary mb-3">
                <li>• USDA Organic Standards (United States)</li>
                <li>
                  • NPOP (India Organic) – Government of India (via
                  APEDA-accredited certifiers)
                </li>
                <li>• EU Organic Regulation (European Union)</li>
                <li>• JAS (Japan Agricultural Standards)</li>
                <li>
                  • China organic certification (as required by importing
                  authorities)
                </li>
                <li>
                  • Export-compliant traceability and quality documentation as
                  required by customs and importing authorities
                </li>
              </ul>
              <p className="text-xs text-text-secondary mt-3">
                Certification requirements vary by country and product category.
                Vendors are solely responsible for obtaining and maintaining the
                appropriate approvals.
              </p>
            </div>

            <div className="p-4 bg-background rounded-sm border border-secondary/10">
              <h4 className="font-bold text-primary mb-2">
                Vendor-submitted documents
              </h4>
              {vendorCerts && vendorCerts.length > 0 ? (
                <ul className="list-disc pl-6 text-text-secondary space-y-2">
                  {vendorCerts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-secondary">
                  No vendor documents available for this vendor.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The Promise */}
      <section className="py-24 px-4 max-w-4xl mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-primary mb-8">
          "On Siraba Organic, “organic” is not a claim made lightly. <br />{" "}
          <span className="text-accent italic">
            It is supported by process, documentation, and accountability.
          </span>
          "
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left mt-12">
          <div className="p-4 border border-secondary/20 rounded-sm">
            <span className="block text-3xl font-bold text-accent mb-2">
              01
            </span>
            <h4 className="font-bold text-primary">
              Properly <br /> Sourced
            </h4>
          </div>
          <div className="p-4 border border-secondary/20 rounded-sm">
            <span className="block text-3xl font-bold text-accent mb-2">
              02
            </span>
            <h4 className="font-bold text-primary">
              Quality <br /> Tested
            </h4>
          </div>
          <div className="p-4 border border-secondary/20 rounded-sm">
            <span className="block text-3xl font-bold text-accent mb-2">
              03
            </span>
            <h4 className="font-bold text-primary">
              Documented & <br /> Traceable
            </h4>
          </div>
          <div className="p-4 border border-secondary/20 rounded-sm">
            <span className="block text-3xl font-bold text-accent mb-2">
              04
            </span>
            <h4 className="font-bold text-primary">Trade-Ready</h4>
          </div>
        </div>
      </section>

      <section className="py-6 px-4 max-w-7xl mx-auto text-center text-sm text-text-secondary">
        <p>
          Siraba Organic operates as a technology platform. Vendors are
          responsible for product compliance, certifications, testing, and
          export documentation.
        </p>
      </section>
    </div>
  );
};

export default Certification;
