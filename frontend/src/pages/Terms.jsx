import React, { useEffect } from "react";

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const Section = ({ title, children }) => (
    <div className="space-y-3">
      <h2 className="font-heading text-lg md:text-xl text-primary font-semibold mt-8 mb-2">
        {title}
      </h2>
      {children}
    </div>
  );

  const P = ({ children }) => (
    <p className="text-text-secondary leading-relaxed font-light">{children}</p>
  );

  const UL = ({ items }) => (
    <ul className="list-disc list-inside space-y-1 text-text-secondary font-light">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );

  return (
    <div className="w-full pt-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="font-heading text-3xl md:text-4xl text-primary font-bold mb-4">
          Terms &amp; Conditions
        </h1>
        <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-2">
          Siraba Organic
        </p>
        <p className="text-text-secondary text-sm font-light mb-10">
          Effective Date: 14-Feb-2026
        </p>

        <div className="space-y-6 text-text-secondary leading-relaxed font-light">
          <P>
            Welcome to Siraba Organic. These Terms &amp; Conditions govern your use of our
            website and the purchase of products through it. By accessing or using this website,
            you agree to be bound by the terms outlined below. If you do not agree with these
            terms, please do not use this website.
          </P>

          <Section title="1. About Siraba Organic">
            <P>
              Siraba Organic is a certification-led organic platform offering premium organic
              ingredients and certified products sourced from vendors who meet globally
              recognized organic standards.
            </P>
            <p className="text-text-secondary font-light">Our flagship products include:</p>
            <UL items={["Kashmiri Saffron", "Premium Asafoetida (Hing)"]} />
            <p className="text-text-secondary font-light mt-2">We also list products from vendors holding:</p>
            <UL items={[
              "USDA Organic certification",
              "EU Organic certification",
              "NPOP (India Organic) certification"
            ]} />
          </Section>

          <Section title="2. Eligibility to Use the Website">
            <P>By using this website, you confirm that:</P>
            <UL items={[
              "You are at least 18 years old, or",
              "You are using the website under the supervision of a parent or legal guardian."
            ]} />
          </Section>

          <Section title="3. Product Information">
            <P>
              We strive to ensure that all product descriptions, images, and prices are
              accurate. However:
            </P>
            <UL items={[
              "Natural products may vary slightly in color, texture, or aroma.",
              "Packaging may change without prior notice.",
              "Minor differences between images and actual products may occur."
            ]} />
            <P>Siraba Organic does not guarantee that product descriptions or other content are completely error-free.</P>
          </Section>

          <Section title="4. Pricing and Payments">
            <UL items={[
              "All prices are listed in Indian Rupees (₹) unless otherwise specified.",
              "Prices are subject to change without prior notice.",
              "Payments are processed securely through authorized payment gateways such as Razorpay."
            ]} />
            <P>Siraba Organic does not store or process card or banking information directly.</P>
          </Section>

          <Section title="5. Order Acceptance and Cancellation">
            <P>We reserve the right to:</P>
            <UL items={[
              "Cancel any order suspected of fraud or misuse",
              "Refuse service to any customer at our discretion",
              "Limit quantities per order"
            ]} />
            <P>Orders may be cancelled:</P>
            <UL items={[
              "By the customer before shipment",
              "By Siraba Organic in case of stock issues, pricing errors, or suspicious activity"
            ]} />
            <P>Refunds, if applicable, will be processed according to our Refund Policy.</P>
          </Section>

          <Section title="6. Shipping and Delivery">
            <P>
              Shipping and delivery are governed by our Shipping Policy. Delivery timelines
              are estimates and may vary due to courier delays, weather conditions, or customs
              processing for international shipments. Siraba Organic is not liable for delays
              caused by third-party logistics providers or customs authorities.
            </P>
          </Section>

          <Section title="7. Returns and Refunds">
            <P>
              Returns, cancellations, and refunds are handled in accordance with our Refund
              &amp; Cancellation Policy. For international orders, physical returns are
              generally not feasible due to food safety and regulatory reasons. Quality issues
              may be resolved through replacement, store credit, or refund, depending on the case.
            </P>
          </Section>

          <Section title="8. User Responsibilities">
            <P>By using this website, you agree:</P>
            <UL items={[
              "To provide accurate personal and shipping information",
              "Not to misuse the website for fraudulent or illegal activities",
              "Not to attempt unauthorized access to any part of the website"
            ]} />
          </Section>

          <Section title="9. Intellectual Property">
            <P>
              All content on this website — including text, images, logos, graphics, product
              descriptions, and design elements — is the property of Siraba Organic and is
              protected by applicable intellectual property laws. You may not copy, reproduce,
              or use any content without written permission.
            </P>
          </Section>

          <Section title="10. Limitation of Liability">
            <P>Siraba Organic shall not be liable for:</P>
            <UL items={[
              "Indirect or incidental damages",
              "Losses caused by courier delays",
              "Customs-related issues for international shipments",
              "Misuse of products by customers"
            ]} />
            <P>Our liability, if any, shall be limited to the value of the purchased product.</P>
          </Section>

          <Section title="11. Third-Party Links">
            <P>
              Our website may contain links to third-party websites. Siraba Organic is not
              responsible for the content, policies, or practices of those websites.
            </P>
          </Section>

          <Section title="12. Changes to Terms">
            <P>
              We reserve the right to modify these Terms &amp; Conditions at any time.
              Changes will be effective immediately upon posting on this page. Continued use
              of the website constitutes acceptance of the updated terms.
            </P>
          </Section>

          <Section title="13. Governing Law and Jurisdiction">
            <P>
              These Terms &amp; Conditions are governed by the laws of India. Any disputes
              shall be subject to the jurisdiction of courts located in Gurugram, Haryana, India.
            </P>
          </Section>

          <Section title="14. Contact Information">
            <P>For any questions regarding these terms, please contact:</P>
            <div className="space-y-1">
              <p><span className="font-medium">Email:</span> info@sirabaorganic.com</p>
              <p><span className="font-medium">Phone:</span> +91-8586836660</p>
            </div>
          </Section>

          {/* Legal Business Information — Razorpay compliance requirement */}
          <div className="border-t border-gray-200 pt-8 mt-10 space-y-2">
            <h2 className="font-heading text-lg text-primary font-semibold mb-4">
              Legal Business Information
            </h2>
            <p><span className="font-medium">Trade Name:</span> Siraba Organic</p>
            <p><span className="font-medium">Legal Name:</span> Rajesh Kumar Thakur</p>
            <p><span className="font-medium">Business Type:</span> Proprietorship</p>
            <p><span className="font-medium">GSTIN:</span> 06ACMPT6127H1ZA</p>
            <p className="mt-3 font-medium">Registered Office:</p>
            <p>1C, Shani Enclave, Nayagaon Bhondsi, Gurugram, Haryana – 122102, India</p>
            <p className="mt-3 font-medium">Corporate Office:</p>
            <p>
              Plot No. 77, Basement, Neelkanth Enclave, Near Ekta Hospital,
              Sohna Road, Badshahpur, Sector 69, Gurugram – 122101, Haryana, India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;