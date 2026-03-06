import React, { useEffect } from "react";

const PrivacyPolicy = () => {
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
          Privacy Policy
        </h1>
        <p className="text-text-secondary text-sm uppercase tracking-[0.2em] mb-2">
          Siraba Organic
        </p>
        <p className="text-text-secondary text-sm font-light mb-10">
          Effective Date: 2025 &nbsp;|&nbsp; Last Updated: 2025
        </p>

        <div className="space-y-6 text-text-secondary leading-relaxed font-light">
          <P>
            Siraba Organic ("we," "our," or "us") respects your privacy and is committed to
            protecting your personal information. This Privacy Policy explains how we collect,
            use, and safeguard your information when you visit or make a purchase from our
            website. By using our website, you agree to the practices described in this policy.
          </P>

          <Section title="1. Information We Collect">
            <P>When you use our website, we may collect the following types of information:</P>
            <p className="text-text-secondary font-medium mt-2">a. Personal Information</p>
            <UL items={["Full name", "Email address", "Phone number", "Shipping and billing address"]} />
            <p className="text-text-secondary font-medium mt-3">b. Transaction Information</p>
            <UL items={["Order details", "Payment status", "Purchase history"]} />
            <p className="text-text-secondary font-medium mt-3">c. Technical Information</p>
            <UL items={["IP address", "Browser type", "Device information", "Pages visited on our website"]} />
          </Section>

          <Section title="2. Payment Information">
            <P>
              All payments on our website are processed through secure third-party payment
              gateways such as Razorpay. Siraba Organic:
            </P>
            <UL items={[
              "Does not store your credit/debit card details",
              "Does not have direct access to your banking information"
            ]} />
            <P>Payment data is handled in accordance with the payment gateway's privacy and security standards.</P>
          </Section>

          <Section title="3. How We Use Your Information">
            <P>We use your information for the following purposes:</P>
            <UL items={[
              "To process and fulfill orders",
              "To send order confirmations and updates",
              "To provide customer support",
              "To improve our products and website",
              "To comply with legal and regulatory requirements"
            ]} />
            <P>We do not sell, rent, or trade your personal information to third parties.</P>
          </Section>

          <Section title="4. Sharing of Information">
            <P>We may share your information only with:</P>
            <UL items={[
              "Payment gateway providers",
              "Shipping and logistics partners",
              "Government or legal authorities when required by law"
            ]} />
            <P>All partners are expected to maintain the confidentiality and security of your data.</P>
          </Section>

          <Section title="5. Cookies and Tracking">
            <P>Our website may use cookies and similar technologies to:</P>
            <UL items={[
              "Improve user experience",
              "Analyze website performance",
              "Remember user preferences"
            ]} />
            <P>You may disable cookies through your browser settings, but this may affect certain features of the website.</P>
          </Section>

          <Section title="6. Data Security">
            <P>
              We implement reasonable administrative, technical, and physical safeguards to
              protect your personal information from unauthorized access, misuse, loss, or
              disclosure. However, no method of transmission over the internet is completely secure.
            </P>
          </Section>

          <Section title="7. Data Retention">
            <P>We retain your personal information only as long as necessary to:</P>
            <UL items={[
              "Fulfill orders",
              "Comply with legal obligations",
              "Resolve disputes",
              "Enforce our agreements"
            ]} />
          </Section>

          <Section title="8. Your Rights">
            <P>You may request:</P>
            <UL items={[
              "Access to your personal data",
              "Correction of inaccurate information",
              "Deletion of your data (subject to legal requirements)"
            ]} />
            <P>
              To make such requests, contact us at:{" "}
              <span className="font-medium">info@sirabaorganic.com</span>
            </P>
          </Section>

          <Section title="9. Third-Party Links">
            <P>
              Our website may contain links to third-party websites. Siraba Organic is not
              responsible for the privacy practices or content of those sites.
            </P>
          </Section>

          <Section title="10. Changes to This Policy">
            <P>
              We may update this Privacy Policy from time to time. Any changes will be posted
              on this page with the updated effective date.
            </P>
          </Section>

          <Section title="11. Contact Information">
            <P>For privacy-related questions or concerns, please contact us:</P>
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

export default PrivacyPolicy;