import React, { useEffect } from "react";

const QualityPromise = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full pt-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-4">
          Our Quality Promise
        </h1>

        <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-10">
          Siraba Organic
        </p>

        {/* Intro Section */}
        <div className="mb-12">
          <p className="text-text-secondary leading-relaxed font-light">
            Every product at Siraba Organic follows a strict quality and
            compliance process to ensure safety, authenticity, and global
            standards. From sourcing to packaging, we maintain complete
            transparency and traceability.
          </p>
        </div>

        {/* Commitment Section */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl text-primary font-semibold mb-6">
            Our Commitment
          </h2>

          <ul className="space-y-3 text-text-secondary font-light list-disc list-inside">
            <li>Certification-verified sourcing</li>
            <li>Documentation checks</li>
            <li>Batch traceability</li>
            <li>Export-grade packaging</li>
          </ul>
        </div>

        {/* International Orders Section */}
        <div>
          <h2 className="font-heading text-2xl text-primary font-semibold mb-6">
            International Orders
          </h2>

          <p className="text-text-secondary leading-relaxed font-light mb-6">
            Due to the regulated and perishable nature of food products,
            international returns are not feasible.
          </p>

          <p className="text-text-secondary leading-relaxed font-light mb-4">
            However, if there is any verified quality issue, the following will
            be provided after review:
          </p>

          <ul className="space-y-3 text-text-secondary font-light list-disc list-inside">
            <li>Replacement</li>
            <li>Store credit</li>
            <li>Refund (case-based)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QualityPromise;