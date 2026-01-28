import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { ShieldCheck, TestTube, FileText, Globe, CheckCircle } from 'lucide-react';
import BgImage1 from '../assets/bgimage1.png';
import CertImage from '../assets/image.png';

const Certification = () => {
    const [certData, setCertData] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        client.get('/settings/certifications')
            .then(res => setCertData(res.data))
            .catch(console.error);
    }, []);

    return (
        <div className="w-full pt-20 bg-background text-primary">
            {/* Hero Section */}
            <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img src={BgImage1} alt="Laboratory" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
                </div>
                <div className="relative z-10 text-center max-w-4xl px-4 animate-fade-in-up">
                    <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold mb-4 block">Certified. Tested. Trusted Worldwide.</span>
                    <h1 className="font-heading text-4xl md:text-6xl text-surface font-bold tracking-tight mb-6">
                        Science is Our Standard
                    </h1>
                    <div className="flex items-center justify-center space-x-2 text-sm md:text-base text-surface/80 font-light">
                        <Link to="/" className="hover:text-accent transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-accent">Certifications</span>
                    </div>
                </div>
            </div>

            {/* Introduction Statement */}
            <section className="py-20 px-4 max-w-5xl mx-auto text-center">
                <ShieldCheck size={48} className="text-accent mx-auto mb-6" strokeWidth={1.5} />
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-6">Certification is Not a Formality</h2>
                <p className="text-text-secondary text-lg md:text-xl font-light leading-relaxed mb-6">
                    At Siraba Organic, certification is the <span className="font-bold text-primary">foundation of our credibility</span>.
                </p>
                <p className="text-text-secondary leading-relaxed max-w-3xl mx-auto">
                    Every product we offer is built on a system of government-governed organic standards, scientific verification, and export-compliant traceability, so customers anywhere in the world can trust what they consume.
                </p>
            </section>

            {/* Dynamic Content / Backend Integration Area (Preserved layout but updated content if available) */}
            <section className="py-16 bg-surface border-y border-secondary/10">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="relative order-2 md:order-1">
                        <div className="bg-background p-8 rounded-sm shadow-xl border border-secondary/10 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            <img src={CertImage} alt="Certificate Preview" className="w-full h-auto object-contain shadow-sm" />
                        </div>
                    </div>
                    <div className="order-1 md:order-2 space-y-8">
                        <div>
                            <h3 className="font-heading text-3xl font-bold text-primary mb-4">Verified Through Science</h3>
                            <p className="text-text-secondary font-light mb-4">
                                All Siraba Organic products are verified through globally accredited laboratory testing systems to ensure:
                            </p>
                            <ul className="space-y-3 font-medium text-primary">
                                <li className="flex items-center gap-3"><TestTube size={20} className="text-accent" /> Purity & Potency</li>
                                <li className="flex items-center gap-3"><ShieldCheck size={20} className="text-accent" /> Food Safety</li>
                                <li className="flex items-center gap-3"><FileText size={20} className="text-accent" /> Ingredient Integrity</li>
                                <li className="flex items-center gap-3"><Globe size={20} className="text-accent" /> Compliance with Global Standards</li>
                            </ul>
                        </div>

                        <div className="bg-secondary/5 p-6 rounded-sm border-l-4 border-accent">
                            <h4 className="font-bold text-primary uppercase text-sm mb-2">Our Standards Include:</h4>
                            <ul className="text-sm space-y-2 text-text-secondary">
                                <li>• USDA Organic Standards</li>
                                <li>• NPOP (India Organic) – Government of India (APEDA)</li>
                                <li>• Export-compliant traceability and quality documentation</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Promise */}
            <section className="py-24 px-4 max-w-4xl mx-auto text-center">
                <h2 className="font-heading text-3xl md:text-5xl font-bold text-primary mb-8">
                    "At Siraba, organic is not a claim. <br /> <span className="text-accent italic">It is a science.</span>"
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left mt-12">
                    <div className="p-4 border border-secondary/20 rounded-sm">
                        <span className="block text-3xl font-bold text-accent mb-2">01</span>
                        <h4 className="font-bold text-primary">Properly <br /> Sourced</h4>
                    </div>
                    <div className="p-4 border border-secondary/20 rounded-sm">
                        <span className="block text-3xl font-bold text-accent mb-2">02</span>
                        <h4 className="font-bold text-primary">Scientifically <br /> Tested</h4>
                    </div>
                    <div className="p-4 border border-secondary/20 rounded-sm">
                        <span className="block text-3xl font-bold text-accent mb-2">03</span>
                        <h4 className="font-bold text-primary">Documented & <br /> Traceable</h4>
                    </div>
                    <div className="p-4 border border-secondary/20 rounded-sm">
                        <span className="block text-3xl font-bold text-accent mb-2">04</span>
                        <h4 className="font-bold text-primary">Globally <br /> Trade-Ready</h4>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Certification;
