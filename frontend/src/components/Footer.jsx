import { Link } from 'react-router-dom';
import logo from '../assets/SIRABALOGO.png';

const Footer = () => {
  return (
    <footer className="bg-primary text-surface pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
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
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-secondary leading-tight">
                  Organic
                </span>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed font-light">
              Bringing the world's finest certified organic saffron and
              superfoods directly from the pristine farms of India to your
              home.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg mb-6 text-accent">
              Customer Care
            </h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link
                  to="/shipping-policy"
                  className="hover:text-accent transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="hover:text-accent transition-colors"
                >
                  Refund &amp; Cancellation
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-accent transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/track-order"
                  className="hover:text-accent transition-colors"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg mb-6 text-accent">Legal</h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link
                  to="/privacy-policy"
                  className="hover:text-accent transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-accent transition-colors"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg mb-6 text-accent">
              Trust &amp; More
            </h4>
            <ul className="space-y-3 text-sm font-light text-white/80">
              <li>
                <Link
                  to="/certifications"
                  className="hover:text-accent transition-colors"
                >
                  Certifications
                </Link>
              </li>
              <li>
                <Link
                  to="/quality-promise"
                  className="hover:text-accent transition-colors"
                >
                  Quality Promise
                </Link>
              </li>
              <li>
                <Link
                  to="/b2b"
                  className="hover:text-accent transition-colors"
                >
                  B2B
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-accent transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-xs text-white/60 font-light space-y-1 text-center md:text-left">
            <p>© 2026 Siraba Organic. All rights reserved.</p>
            <p>Business Name: Siraba Organic</p>
            <p>GSTIN: 06ACMPT6127H1ZA | URN: UDYAM-HR-05-0179395</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
