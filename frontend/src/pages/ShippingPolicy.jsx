import React, { useEffect } from "react";

const ShippingPolicy = () => {
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
          Shipping &amp; Delivery Policy
        </h1>
        <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-2">
          Siraba Organic
        </p>
        <p className="text-text-secondary text-sm font-light mb-10">
          Effective Date: 14-Feb-2026
        </p>

        <div className="space-y-6 text-text-secondary leading-relaxed font-light">
          <P>
            This Shipping &amp; Delivery Policy explains how Siraba Organic processes,
            ships, and delivers orders placed through our website.
          </P>

          <Section title="1. Shipping Coverage">
            <p className="text-text-secondary font-medium">Domestic</p>
            <UL items={["All serviceable locations across India"]} />
            <p className="text-text-secondary font-medium mt-3">International</p>
            <UL items={["Selected countries based on shipping partner coverage and local import regulations"]} />
            <P>International availability may change depending on customs rules, food import restrictions, or logistics feasibility.</P>
          </Section>

          <Section title="2. Order Processing Time">
            <UL items={[
              "Orders are processed within 1–3 business days after payment confirmation.",
              "Orders placed on weekends or public holidays will be processed on the next business day."
            ]} />
            <P>You will receive a confirmation email once your order is shipped.</P>
          </Section>

          <Section title="3. Estimated Delivery Time">
            <p className="text-text-secondary font-medium">Domestic (India)</p>
            <UL items={["Standard delivery: 3–7 business days"]} />
            <p className="text-text-secondary font-medium mt-3">International</p>
            <UL items={[
              "Standard delivery: 7–15 business days",
              "In some cases, delivery may take up to 21 business days depending on customs clearance, local courier operations, or destination country regulations."
            ]} />
          </Section>

          <Section title="4. Shipping Charges">
            <P>Shipping charges are calculated at checkout based on delivery location and order weight and size. Free shipping may be offered on selected orders or promotions.</P>
          </Section>

          <Section title="5. Order Tracking">
            <P>
              Once your order is shipped, you will receive a tracking number via email or SMS
              which you can use to track your shipment.
            </P>
          </Section>

          <Section title="6. International Duties &amp; Taxes">
            <P>
              For international orders, import duties, taxes, or customs fees may apply.
              These charges are determined by the destination country's authorities and the
              customer is responsible for paying any applicable duties or taxes. Siraba Organic
              has no control over these charges and cannot predict the exact amount.
            </P>
          </Section>

          <Section title="7. Delivery Delays">
            <P>Delivery timelines are estimates and may be affected by:</P>
            <UL items={[
              "Weather conditions",
              "Customs inspections",
              "Courier partner delays",
              "Public holidays",
              "Remote delivery locations"
            ]} />
            <P>Siraba Organic is not liable for delays caused by third-party logistics providers or customs authorities.</P>
          </Section>

          <Section title="8. Incorrect Address or Failed Delivery">
            <P>If an order is returned due to incorrect address, customer unavailability, or refusal to accept delivery, the customer may be required to pay re-shipping charges or applicable handling costs.</P>
          </Section>

          <Section title="9. Damaged or Missing Items">
            <P>
              If your order arrives damaged or with missing items, you must notify us within
              <span className="font-medium"> 48 hours of delivery</span>. Please email{" "}
              <span className="font-medium">info@sirabaorganic.com</span> with your order
              number and photos or videos of the issue. Claims made after this period may
              not be eligible for resolution.
            </P>
          </Section>

          <Section title="10. Shipping Restrictions">
            <P>We may refuse or cancel orders to:</P>
            <UL items={[
              "Locations that are not serviceable",
              "Countries with strict food import restrictions",
              "Areas flagged for high risk or compliance issues"
            ]} />
            <P>In such cases, a full refund will be issued.</P>
          </Section>

          <Section title="11. Contact for Shipping Enquiries">
            <P>For shipping-related questions, please contact:</P>
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

export default ShippingPolicy;