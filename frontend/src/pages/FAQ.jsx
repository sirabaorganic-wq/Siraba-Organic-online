import React, { useEffect } from "react";

const FAQ = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full pt-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-4">
          Frequently Asked Questions (FAQ)
        </h1>
        <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-8">
          Siraba Organic
        </p>
        <div className="space-y-4 text-text-secondary leading-relaxed font-light">
          <p>
            This page is meant to host common questions and answers about
            ordering on Siraba Organic, including shipping, refunds, product
            information, and platform usage.
          </p>
          <p>
            Replace this placeholder text with your final FAQ entries so that
            customers and payment partners can easily review your standard
            practices.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

