import React, { useEffect } from 'react';
import { Leaf, Award, MapPin, Globe, CheckCircle, ShieldCheck, Sprout, Microscope, FileCheck, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import BgImage2 from '../assets/bgimage2.png';
import SaffronImage from '../assets/Saffron.png';

const WhySiraba = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="w-full pt-20 bg-background text-primary selection:bg-accent selection:text-white">
            {/* Hero Section */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img src={BgImage2} alt="Kashmir Landscapes" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent " />
                </div>
                <div className="relative z-10 text-center max-w-4xl px-4 animate-fade-in-up">
                    <h1 className="font-heading text-5xl md:text-7xl text-surface font-bold tracking-tight mb-6 text-shadow">
                        Why Global Buyers Choose Siraba
                    </h1>
                    <p className="text-surface/90 text-xl md:text-2xl font-light font-heading italic tracking-wide">
                        "Most spice sellers sell products. Siraba sells verified purity."
                    </p>
                </div>
            </div>

            {/* Differentiation Statement */}
            <section className="py-24 px-4 max-w-6xl mx-auto text-center">
                <div className="flex justify-center mb-8">
                    <ShieldCheck size={48} className="text-accent" />
                </div>
                <p className="text-text-secondary text-lg md:text-xl font-light leading-relaxed max-w-4xl mx-auto">
                    In a market flooded with claims, Siraba Organic stands apart by combining <span className="font-bold text-primary">certified sourcing</span>, <span className="font-bold text-primary">scientific verification</span>, and <span className="font-bold text-primary">export-grade discipline</span> into every product we deliver.
                </p>
            </section>

            {/* The Four Pillars */}
            <section className="py-24 px-4 bg-secondary/5 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                </div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">Our Foundation</span>
                        <h2 className="font-heading text-4xl md:text-5xl text-primary font-bold mt-4">The Four Pillars of Siraba</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Pillar 1 */}
                        <div className="bg-surface p-8 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-accent group">
                            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                                <Leaf size={28} />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-primary mb-3">Certified Organic</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Our supply chain follows USDA Organic and NPOP (India Organic), APEDA standards — ensuring that every ingredient is cultivated, processed, and packaged according to internationally recognized organic protocols.
                            </p>
                        </div>

                        {/* Pillar 2 */}
                        <div className="bg-surface p-8 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-primary group">
                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <Award size={28} />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-primary mb-3">Lab Tested</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Every batch is verified through globally accredited laboratory testing to confirm purity, safety, and ingredient integrity before it reaches customers.
                            </p>
                        </div>

                        {/* Pillar 3 */}
                        <div className="bg-surface p-8 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-accent group">
                            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                                <MapPin size={28} />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-primary mb-3">Origin Authenticity</h3>
                            <p className="text-text-secondary text-sm leading-relaxed mb-2">
                                We source from the world’s most respected origins:
                            </p>
                            <ul className="text-text-secondary text-xs list-disc list-inside space-y-1 mb-2">
                                <li><strong>Kashmir</strong> for saffron</li>
                                <li><strong>Ladakh & Other States</strong> for premium compounded and processed hing</li>
                            </ul>
                            <p className="text-text-secondary text-sm italic">
                                This ensures unmatched aroma, potency, and quality.
                            </p>
                        </div>

                        {/* Pillar 4 */}
                        <div className="bg-surface p-8 rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-primary group">
                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <Globe size={28} />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-primary mb-3">Export Compliance</h3>
                            <p className="text-text-secondary text-xs font-bold uppercase mb-2">Built for global markets with:</p>
                            <ul className="text-text-secondary text-sm space-y-1 mb-3">
                                <li className="flex items-center gap-2"><CheckCircle size={12} className="text-primary" /> Batch-wise traceability</li>
                                <li className="flex items-center gap-2"><CheckCircle size={12} className="text-primary" /> Documentation records</li>
                                <li className="flex items-center gap-2"><CheckCircle size={12} className="text-primary" /> Food-grade packaging</li>
                            </ul>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                This is why international buyers trust Siraba Organic — not just as a spice brand, but as a globally reliable food partner.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Journey of Purity */}
            <section className="py-24 px-4 bg-surface">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-heading text-3xl md:text-5xl text-primary font-bold">The Journey of Verified Purity</h2>
                        <p className="text-text-secondary mt-4 max-w-2xl mx-auto font-light">
                            From the pristine fields of Kashmir to your doorstep, every step is rigorously monitored.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Step 1 */}
                        <div className="relative p-6 pt-12 border border-secondary/10 rounded-sm hover:border-accent/30 transition-all group bg-background/50">
                            <div className="absolute top-0 left-6 -translate-y-1/2 bg-surface p-2 border border-secondary/10 rounded-full group-hover:border-accent/50 transition-colors shadow-sm">
                                <span className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-full text-green-600 font-bold font-heading">01</span>
                            </div>
                            <Sprout className="w-8 h-8 text-green-600 mb-4 opacity-80" />
                            <h4 className="font-heading text-lg font-bold text-primary mb-2">Sustainable Sourcing</h4>
                            <p className="text-sm text-text-secondary font-light">Cultivation in the nutrient-rich soils of Kashmir and Ladakh using traditional organic methods.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative p-6 pt-12 border border-secondary/10 rounded-sm hover:border-accent/30 transition-all group bg-background/50">
                            <div className="absolute top-0 left-6 -translate-y-1/2 bg-surface p-2 border border-secondary/10 rounded-full group-hover:border-accent/50 transition-colors shadow-sm">
                                <span className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full text-blue-600 font-bold font-heading">02</span>
                            </div>
                            <Microscope className="w-8 h-8 text-blue-600 mb-4 opacity-80" />
                            <h4 className="font-heading text-lg font-bold text-primary mb-2">Rigorous Testing</h4>
                            <p className="text-sm text-text-secondary font-light">Each lot undergoes rigorous chemical and physical analysis in accredited independent labs.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative p-6 pt-12 border border-secondary/10 rounded-sm hover:border-accent/30 transition-all group bg-background/50">
                            <div className="absolute top-0 left-6 -translate-y-1/2 bg-surface p-2 border border-secondary/10 rounded-full group-hover:border-accent/50 transition-colors shadow-sm">
                                <span className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-full text-purple-600 font-bold font-heading">03</span>
                            </div>
                            <FileCheck className="w-8 h-8 text-purple-600 mb-4 opacity-80" />
                            <h4 className="font-heading text-lg font-bold text-primary mb-2">Export Compliance</h4>
                            <p className="text-sm text-text-secondary font-light">Documentation, sealing, and certification to meet standard international trade protocols.</p>
                        </div>

                        {/* Step 4 */}
                        <div className="relative p-6 pt-12 border border-secondary/10 rounded-sm hover:border-accent/30 transition-all group bg-background/50">
                            <div className="absolute top-0 left-6 -translate-y-1/2 bg-surface p-2 border border-secondary/10 rounded-full group-hover:border-accent/50 transition-colors shadow-sm">
                                <span className="flex items-center justify-center w-10 h-10 bg-amber-50 rounded-full text-amber-600 font-bold font-heading">04</span>
                            </div>
                            <Plane className="w-8 h-8 text-amber-600 mb-4 opacity-80" />
                            <h4 className="font-heading text-lg font-bold text-primary mb-2">Global Delivery</h4>
                            <p className="text-sm text-text-secondary font-light">Secure, trackable shipment ensures the product arrives with its purity intact.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Closing Statement */}
            <section className="py-24 px-4 bg-primary text-surface text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    <h2 className="font-heading text-3xl md:text-5xl font-bold leading-tight">
                        Experience the Standard of Purity
                    </h2>
                    <Link
                        to="/shop"
                        className="inline-block bg-accent text-primary px-10 py-4 font-bold uppercase tracking-widest hover:bg-surface transition-all duration-300 shadow-md"
                    >
                        Start Shopping
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default WhySiraba;
