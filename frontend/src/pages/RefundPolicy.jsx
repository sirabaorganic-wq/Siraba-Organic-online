import React, { useEffect } from "react";

const RefundPolicy = () => {
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
          Refund, Return &amp; Cancellation Policy
        </h1>
        <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-2">
          Siraba Organic
        </p>
        <p className="text-text-secondary text-sm font-light mb-10">
          Effective Date: 14-Feb-2026
        </p>

        <div className="space-y-6 text-text-secondary leading-relaxed font-light">
          <P>
            At Siraba Organic, we deal in certified organic food products that require careful
            handling and quality assurance. This policy explains how cancellations, returns,
            and refunds are handled for orders placed on our website.
          </P>

          <Section title="1. Order Cancellation">
            <p className="text-text-secondary font-medium">Before Shipment</p>
            <UL items={[
              "Orders may be cancelled before they are shipped.",
              "To cancel an order, please contact our support team as soon as possible."
            ]} />
            <P>If the order has not yet been dispatched, a full refund will be processed to the original payment method.</P>
            <p className="text-text-secondary font-medium mt-3">After Shipment</p>
            <UL items={[
              "Once an order has been shipped, it cannot be cancelled.",
              "In such cases, the order will follow the return policy below (if applicable)."
            ]} />
          </Section>

          <Section title="2. Domestic Returns (India)">
            <P>Returns may be accepted only under the following conditions:</P>
            <p className="text-text-secondary font-medium mt-2">Eligible Cases</p>
            <UL items={[
              "Wrong product delivered",
              "Product damaged during transit",
              "Verified quality issue"
            ]} />
            <p className="text-text-secondary font-medium mt-3">Conditions for Return</p>
            <UL items={[
              "Request must be raised within 48 hours of delivery.",
              "Customer must provide order number and clear photos or videos of the issue.",
              "Product must be unused and in original packaging."
            ]} />
            <P>If the return is approved, a replacement, store credit, or refund will be provided.</P>
          </Section>

          <Section title="3. International Orders">
            <P>
              Due to the perishable and regulated nature of food products, international
              returns are generally not feasible. However, in the event of a verified issue,
              Siraba Organic may offer a replacement (where feasible), store credit, or a
              partial/full refund on a case-by-case basis.
            </P>
            <p className="text-text-secondary font-medium mt-2">Conditions</p>
            <UL items={[
              "Issue must be reported within 48 hours of delivery.",
              "Photo or video proof required.",
              "Batch and order details must be clearly visible."
            ]} />
          </Section>

          <Section title="4. Refund Processing">
            <P>Once a refund is approved:</P>
            <UL items={[
              "Refunds are processed within 5–7 business days.",
              "Amount is credited to the original payment method."
            ]} />
            <P>Please note: banks or payment gateways may take additional time to reflect the amount.</P>
          </Section>

          <Section title="5. Non-Refundable Situations">
            <P>Refunds or returns will not be provided in the following cases:</P>
            <UL items={[
              "Change of mind after purchase",
              "Incorrect shipping address provided by the customer",
              "Delivery failure due to customer unavailability",
              "Minor natural variations in organic products",
              "Delays caused by courier partners or customs"
            ]} />
          </Section>

          <Section title="6. Replacement Policy">
            <P>If a replacement is approved:</P>
            <UL items={[
              "The replacement product will be shipped at no additional cost.",
              "Replacement timelines may vary based on stock availability and location."
            ]} />
          </Section>

          <Section title="7. How to Request a Refund or Return">
            <P>To initiate a request, please contact us and include your order number, a description of the issue, and photos or videos if applicable:</P>
            <div className="space-y-1 mt-2">
              <p><span className="font-medium">Email:</span> info@sirabaorganic.com</p>
              <p><span className="font-medium">Phone:</span> +91-8586836660</p>
            </div>
          </Section>

          <Section title="8. Siraba Quality Assurance">
            <P>All products listed on Siraba Organic follow:</P>
            <UL items={[
              "Certification-based sourcing",
              "Documentation checks",
              "Batch-wise traceability",
              "Export-grade packaging standards"
            ]} />
            <P>Our policies are designed to protect both product integrity and customer trust.</P>
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

export default RefundPolicy;