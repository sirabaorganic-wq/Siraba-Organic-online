import React, { useEffect, useState } from "react";

const faqs = [
  {
    q: "What is Siraba Organic?",
    a: "Siraba Organic is a quality-focused organic marketplace and brand dedicated to bringing certified organic products to consumers worldwide. Our flagship products include Kashmiri Saffron (Kesar) and Premium Asafoetida (Hing), sourced and verified through strict quality standards.",
  },
  {
    q: "What makes Siraba Organic different from other spice brands?",
    a: "Most spice sellers focus on marketing claims. Siraba Organic focuses on verified authenticity and traceability. Every product listed on our platform must meet strict certification and quality requirements, ensuring customers receive genuine, safe, and premium-grade ingredients.",
  },
  {
    q: "What are Siraba Organic's flagship products?",
    a: "Our primary flagship products are Kashmiri Saffron (Kesar) — known globally for its rich aroma, deep color, and high crocin content — and Premium Asafoetida (Hing) — India's finest compounded hing, widely used in culinary and medicinal traditions. Both products are selected for their purity, potency, and authenticity.",
  },
  {
    q: "Are Siraba Organic products certified organic?",
    a: "Yes. Siraba Organic prioritizes products that comply with internationally recognized organic standards such as EU Organic, USDA Organic, and NPOP (India Organic). Products must also comply with food safety and traceability standards.",
  },
  {
    q: "Are Siraba products laboratory tested?",
    a: "Yes. Products undergo globally accredited laboratory testing to verify purity, safety, absence of harmful contaminants, and quality parameters. This ensures compliance with international food safety standards.",
  },
  {
    q: "Can other vendors sell products on Siraba Organic?",
    a: "Yes. Siraba Organic welcomes vendors who possess recognized organic certifications such as EU Organic, USDA Organic, or NPOP (India Organic). Vendors must hold at least one of these certifications for domestic listing, and a minimum of two for global or international sales. All products must also meet Siraba Organic's internal standards for quality, traceability, and food safety. Only products that successfully pass our verification process are approved for listing.",
  },
  {
    q: "How does Siraba ensure product authenticity?",
    a: "We follow a strict quality verification process: certified sourcing from approved suppliers, compliance with organic certification standards, laboratory testing for safety and purity, batch traceability and documentation, and secure packaging and quality control.",
  },
  {
    q: "Do you sell internationally?",
    a: "Yes. Siraba Organic aims to serve both Indian and international customers. Shipping options for international deliveries are gradually being expanded.",
  },
  {
    q: "How should saffron be stored?",
    a: "To maintain its quality, store saffron in an airtight container, away from moisture, heat, and direct sunlight, in a cool and dark place. Proper storage helps preserve its aroma, flavor, and potency.",
  },
  {
    q: "What are the health benefits of saffron?",
    a: "Saffron has been traditionally valued for its antioxidant properties, mood support, digestive health, and culinary enhancement. It is widely used in gourmet cooking, wellness formulations, and traditional remedies.",
  },
  {
    q: "What is asafoetida (hing) used for?",
    a: "Asafoetida is commonly used in Indian and Middle Eastern cooking, digestive support in traditional medicine, and flavor enhancement in vegetarian dishes. A small quantity adds strong aroma and deep flavor to food.",
  },
  {
    q: "How can businesses source products from Siraba Organic?",
    a: "Businesses such as importers, gourmet retailers, HoReCa chains, food manufacturers, and wellness brands may contact us for bulk sourcing and partnership opportunities.",
  },
  {
    q: "How can I become a vendor on Siraba Organic?",
    a: "Vendors must hold recognized organic certifications, provide documentation and quality reports, and meet Siraba's product verification standards. Interested vendors can contact us through our vendor onboarding process.",
  },
  {
    q: "How can customers contact Siraba Organic?",
    a: "For customer support or queries, you can reach us at info@sirabaorganic.com or call +91-8586836660. We are always happy to assist.",
  },
  {
    q: "Why are organic products sometimes more expensive?",
    a: "Certified organic products often require stricter farming practices, certification audits, quality testing, and careful processing. These standards ensure purity and authenticity, which can increase production costs.",
  },
  {
    q: "How can I verify that a product is truly organic?",
    a: "Customers can verify organic authenticity by checking for recognized certifications such as EU Organic, USDA Organic, or NPOP (India Organic). Siraba Organic prioritizes products that meet these certification standards.",
  },
  {
    q: "How does Siraba Organic ensure product traceability?",
    a: "We maintain traceability through certified sourcing, vendor documentation, certification verification, and batch-level records. This ensures transparency from source to customer.",
  },
  {
    q: "Are Siraba Organic products safe for daily consumption?",
    a: "Products listed on Siraba Organic must comply with recognized certification standards and food safety regulations, making them suitable for regular culinary use when consumed appropriately.",
  },
  {
    q: "How are products packaged for delivery?",
    a: "Products are packed in secure, food-safe packaging designed to preserve freshness, aroma, and product quality during transportation.",
  },
  {
    q: "How long do organic spices stay fresh?",
    a: "When stored properly in airtight containers away from moisture and sunlight, organic spices can retain their quality for extended periods.",
  },
  {
    q: "Can I return products if there is a quality issue?",
    a: "If customers experience any product quality concerns, they may contact Siraba Organic support for assistance and review.",
  },
  {
    q: "Do organic spices taste different from regular spices?",
    a: "Organic spices are often valued for their natural aroma, purity, and flavor because they are produced without synthetic additives.",
  },
  {
    q: "Does Siraba Organic support sustainable farming practices?",
    a: "Yes. Organic certification systems promote environmentally responsible farming practices and sustainable agriculture.",
  },
  {
    q: "Are Siraba Organic products free from artificial additives?",
    a: "Products listed on the platform must comply with certification standards, which typically restrict the use of artificial additives and harmful substances.",
  },
  {
    q: "Can I buy products in bulk from Siraba Organic?",
    a: "Yes. Businesses such as retailers, food manufacturers, and distributors may contact Siraba Organic for bulk sourcing opportunities.",
  },
  {
    q: "How often are products reviewed for quality?",
    a: "Siraba Organic periodically reviews vendor documentation and certification records to maintain marketplace standards.",
  },
  {
    q: "What should I look for when buying saffron online?",
    a: "When purchasing saffron, customers should look for deep red stigmas, strong aroma, certification or quality verification, and reliable sourcing.",
  },
  {
    q: "Can organic products lose certification?",
    a: "Yes. Certifications must be renewed periodically. Vendors must maintain valid certification to continue listing products on Siraba Organic.",
  },
  {
    q: "How can I stay updated about new products on Siraba Organic?",
    a: "Customers may follow Siraba Organic updates through the website, newsletters, or announcements regarding new certified organic products.",
  },
  {
    q: "What makes Siraba Organic different from other organic marketplaces?",
    a: "Siraba Organic prioritizes globally recognized organic certifications and a structured verification process before products are listed on the platform.",
  },
  {
    q: "Who founded Siraba Organic?",
    a: "Siraba Organic was founded by Rajesh Thakur, an entrepreneur and business strategist focused on building platforms that promote transparency, trust, and quality in emerging industries such as certified organic products.",
  },
  {
    q: "What inspired the founder to start Siraba Organic?",
    a: "The idea behind Siraba Organic was to create a trusted marketplace dedicated to certified organic products, where consumers can confidently purchase items that meet recognized organic standards such as EU Organic, USDA Organic, and NPOP. The platform aims to bridge the gap between verified organic producers and conscious consumers worldwide.",
  },
];

const FAQItem = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-emerald-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-emerald-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
            {index}
          </span>
          <span className="font-heading font-bold text-primary text-base">
            {question}
          </span>
        </div>
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full border-2 border-emerald-200 flex items-center justify-center text-emerald-600 transition-transform duration-300 ${open ? "rotate-45" : ""
            }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 1V11M1 6H11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 bg-white border-t border-emerald-50">
          <p className="text-text-secondary leading-relaxed font-light text-sm pl-11">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full pt-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12">
          <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-3">
            Siraba Organic
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-text-secondary leading-relaxed font-light">
            Everything you need to know about Siraba Organic — our products,
            certifications, vendor process, and more.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <FAQItem
              key={i}
              index={i + 1}
              question={item.q}
              answer={item.a}
            />
          ))}
        </div>

        {/* Contact Footer */}
        <div className="mt-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 p-8 text-center">
          <h3 className="font-heading text-xl font-bold text-primary mb-2">
            Still have questions?
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Our team is happy to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:info@sirabaorganic.com"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-md"
            >
              info@sirabaorganic.com
            </a>
            <a
              href="tel:+918586836660"
              className="inline-flex items-center gap-2 border-2 border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors"
            >
              +91-8586836660
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;