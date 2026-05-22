import { Link } from 'react-router-dom';
import logo from '../assets/SIRABALOGO.png';

const Footer = () => {
  return (
    <footer className="bg-primary text-surface pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Siraba Organic Logo"
                className="h-14 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold tracking-wide text-surface leading-none">
                  SIRABA
                </span>
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-surface leading-tight">
                  Organic
                </span>
                <p className="text-surface text-[0.65rem] leading-relaxed font-light">
                Certified • Verified • Qualified
                </p> 
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed font-light">
              India’s Triple-Verified Organic Marketplace built around internationally certified products, scientific documentation, and selective vendor qualification.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg mb-6 text-accent">
              Marketplace
            </h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link to="/shop" className="hover:text-accent transition-colors">
                  Shop Products
                </Link>
              </li>
              <li>
                <Link to="/b2b" className="hover:text-accent transition-colors">
                  B2B
                </Link>
              </li>
              <li>
                <Link to="/certifications" className="hover:text-accent transition-colors">
                  Certifications
                </Link>
              </li>
              <li>
                <Link to="/quality-promise" className="hover:text-accent transition-colors">
                  Quality Promise
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-accent transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg mb-6 text-accent">
              Sell on Siraba
            </h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link to="/vendor-benefits" className="hover:text-accent transition-colors">
                  Vendor Benefits
                </Link>
              </li>
              <li>
                <Link to="/vendor-qualification" className="hover:text-accent transition-colors">
                  Vendor Qualification
                </Link>
              </li>
              <li>
                <Link to="/vendor-onboarding-guide" className="hover:text-accent transition-colors">
                  Vendor Onboarding Guide
                </Link>
              </li>
              <li>
                <Link to="/vendor-onboarding-checklist" className="hover:text-accent transition-colors">
                  Vendor Onboarding Checklist
                </Link>
              </li>
              <li>
                <Link to="/vendor-verification-policies" className="hover:text-accent transition-colors">
                  Vendor Verification Policy
                </Link>
              </li>
              <li>
                <Link to="/vendor-terms-and-conditions" className="hover:text-accent transition-colors">
                  Vendor Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/vendor-faq" className="hover:text-accent transition-colors">
                  Vendor FAQs
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg mb-6 text-accent">
              Customer Support
            </h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-accent transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-accent transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-accent transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-accent transition-colors">
                  Customer FAQs
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg mb-6 text-accent">
              About Siraba
            </h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  Our Story
                </Link>
              </li>
              {/* <li>
                <Link to="/founder-faqs" className="hover:text-accent transition-colors">
                  Founder & Branding FAQs
                </Link>
              </li> */}
              <li>
                <Link to="/organic-certification-guide" className="hover:text-accent transition-colors">
                  Organic Certification Guide
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg mb-6 text-accent">
              Legal
            </h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link to="/privacy-policy" className="hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-xs text-white/60 font-light space-y-1 text-center md:text-left">
            <p>© 2026 Siraba Organic. All rights reserved. | Business Name: Siraba Organic | GSTIN: 06ACMPT6127H1ZA | URN: UDYAM-HR-05-0179395</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
