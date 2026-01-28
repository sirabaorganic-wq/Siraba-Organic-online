import { Link } from 'react-router-dom';
import logo from '../assets/SIRABALOGO.png';

const Footer = () => {
    return (
        <footer className="bg-primary text-surface pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Siraba Organic Logo" className="h-14 w-auto object-contain" />
                            <div className="flex flex-col">
                                <span className="font-heading text-2xl font-bold tracking-wide text-surface leading-none">SIRABA</span>
                                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-secondary leading-tight">Organic</span>
                            </div>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed font-light">
                            Bringing the world's finest certified organic saffron and superfoods directly from the pristine farms of India to your home.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-heading text-lg mb-6 text-accent">Menu</h4>
                        <ul className="space-y-3 text-sm font-light text-white/80">
                            <li><Link to="/" className="hover:text-accent transition-colors">Home</Link></li>
                            <li><Link to="/shop" className="hover:text-accent transition-colors">Our Products</Link></li>
                            <li><Link to="/b2b" className="hover:text-accent transition-colors">B2B Trade</Link></li>
                            <li><Link to="/account" className="hover:text-accent transition-colors">My Account</Link></li>
                            <li><Link to="/track-order" className="hover:text-accent transition-colors">Track Order</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-heading text-lg mb-6 text-accent">Explore</h4>
                        <ul className="space-y-3 text-sm font-light text-white/80">
                            <li><Link to="/our-story" className="hover:text-accent transition-colors">Our Story</Link></li>
                            <li><Link to="/why-siraba" className="hover:text-accent transition-colors">Why Siraba</Link></li>
                            <li><Link to="/certifications" className="hover:text-accent transition-colors">Certifications</Link></li>
                            <li><Link to="/blog" className="hover:text-accent transition-colors">Blog</Link></li>
                            <li><Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className="text-xs text-white/40 font-light">
                        © 2026 Siraba Organic. All rights reserved.
                    </p>
                    <div className="flex space-x-6 text-xs text-white/40 font-light">
                        <a href="#" className="hover:text-surface transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-surface transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-surface transition-colors">Shipping & Returns</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
