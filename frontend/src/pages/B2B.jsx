import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Globe, Truck, Package, FileText, Send, Calculator, Download, Users, CheckCircle, ArrowRight, Building, Factory, Coffee } from 'lucide-react';
import BgImage1 from '../assets/bgimage1.png';
import { useCurrency } from '../context/CurrencyContext';

import client from '../api/client';

const B2B = () => {
    const { formatPrice } = useCurrency();
    const [activeTab, setActiveTab] = useState('inquiry'); // inquiry, distributor, sample
    const [pricingQuantity, setPricingQuantity] = useState(10);
    const [selectedPricingProduct, setSelectedPricingProduct] = useState('');
    const [pricingProducts, setPricingProducts] = useState({});
    const [exportDocs, setExportDocs] = useState([]);

    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Fetch B2B Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await client.get('/b2b/settings');
                const pProducts = {};
                if (data.pricingProducts && data.pricingProducts.length > 0) {
                    data.pricingProducts.forEach(p => pProducts[p.name] = p.price);
                    setSelectedPricingProduct(data.pricingProducts[0].name);
                }
                setPricingProducts(pProducts);
                setExportDocs(data.exportDocs || []);
            } catch (error) {
                console.error("Failed to fetch B2B settings", error);
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []);

    // Form States
    const [inquiryForm, setInquiryForm] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        productInterest: [],
        quantity: '',
        destination: '',
        message: ''
    });

    const [distributorForm, setDistributorForm] = useState({
        businessName: '',
        contactName: '',
        email: '',
        region: '',
        yearsInBusiness: '',
        annualTurnover: '',
        message: ''
    });

    const [sampleForm, setSampleForm] = useState({
        companyName: '',
        contactName: '',
        address: '',
        shippingAccount: '', // DHL/FedEx etc
        items: []
    });

    const handleInquiryChange = (e) => setInquiryForm({ ...inquiryForm, [e.target.name]: e.target.value });
    const handleDistributorChange = (e) => setDistributorForm({ ...distributorForm, [e.target.name]: e.target.value });
    const handleSampleChange = (e) => setSampleForm({ ...sampleForm, [e.target.name]: e.target.value });

    const handleProductInterestChange = (e, formType) => {
        const { value, checked } = e.target;
        const form = formType === 'inquiry' ? inquiryForm : sampleForm;
        const setForm = formType === 'inquiry' ? setInquiryForm : setSampleForm;
        const field = formType === 'inquiry' ? 'productInterest' : 'items';

        if (checked) {
            setForm({ ...form, [field]: [...form[field], value] });
        } else {
            setForm({ ...form, [field]: form[field].filter(p => p !== value) });
        }
    };

    const submitForm = async (endpoint, data, resetFn) => {
        try {
            await client.post(endpoint, data);
            alert('Request submitted successfully! Our team will review and contact you shortly.');
            resetFn();
        } catch (error) {
            console.error('Submission failed', error);
            alert('Submission failed. Please try again later.');
        }
    };

    // Bulk Pricing Logic (Simplified for display)
    const calculateBulkPrice = (qty) => {
        // Default values if API fails
        const basePrice = pricingProducts[selectedPricingProduct] || 2500;
        return { total: basePrice * qty };
    };
    const bulkCalculation = calculateBulkPrice(pricingQuantity);

    return (
        <div className="w-full pt-20 bg-background text-primary">
            {/* Hero Section */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img src={BgImage1} alt="Global Trade" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
                <div className="relative z-10 text-center space-y-6 animate-fade-in-up px-4 max-w-5xl">
                    <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold block mb-2">For Business Buyers</span>
                    <h1 className="font-heading text-4xl md:text-6xl text-surface font-bold tracking-tight leading-tight">
                        Source Premium Saffron & Asafetida <br /> with Global Confidence
                    </h1>
                    <p className="text-surface/80 text-lg md:text-xl font-light max-w-3xl mx-auto leading-relaxed">
                        Siraba Organic supplies export-grade Kashmiri Saffron (Kesar) and Premium Asafoetida (Hing) to professional buyers across the world.
                    </p>
                </div>
            </div>

            {/* Partners Grid */}
            <section className="py-20 px-4 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-heading text-3xl font-bold text-primary mb-6">We Partner With</h2>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70">
                            {/* Partner Types as Icons/Text */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-primary"><Truck size={32} /></div>
                                <span className="font-bold text-sm uppercase">Importers & Distributors</span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-primary"><Building size={32} /></div>
                                <span className="font-bold text-sm uppercase">Retailers</span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-primary"><Coffee size={32} /></div>
                                <span className="font-bold text-sm uppercase">HoReCa Chains</span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-primary"><Factory size={32} /></div>
                                <span className="font-bold text-sm uppercase">Food Processing</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-surface border border-secondary/10 p-8 md:p-12 shadow-xl rounded-sm">
                        <div className="space-y-8">
                            <div>
                                <h3 className="font-heading text-3xl font-bold text-primary mb-4">What We Offer Trade Partners</h3>
                                <p className="text-text-secondary text-lg font-light mb-6">
                                    Our products are built for international trade — combining certified organic sourcing, globally accredited laboratory testing, and export-compliant traceability.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="text-accent flex-shrink-0" size={20} />
                                        <span className="font-medium text-primary">Bulk & Wholesale Pricing</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="text-accent flex-shrink-0" size={20} />
                                        <span className="font-medium text-primary">Export Documentation & Compliance Support</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="text-accent flex-shrink-0" size={20} />
                                        <span className="font-medium text-primary">Batch-wise Traceability</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="text-accent flex-shrink-0" size={20} />
                                        <span className="font-medium text-primary">Product Samples for Evaluation</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="text-accent flex-shrink-0" size={20} />
                                        <span className="font-medium text-primary">Private Labeling & Customized Packaging</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-secondary/5 p-6 rounded-sm border-l-4 border-primary">
                                <p className="italic text-text-secondary text-sm">
                                    "Whether you are building a retail brand, supplying premium kitchens, or sourcing for manufacturing, Siraba provides the quality, consistency, and compliance required to operate in global markets."
                                </p>
                            </div>
                        </div>

                        {/* Interactive Form Section */}
                        <div className="bg-background p-6 rounded-sm border border-secondary/20">
                            <div className="flex border-b border-secondary/20 mb-6">
                                <button
                                    className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'inquiry' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'}`}
                                    onClick={() => setActiveTab('inquiry')}
                                >
                                    Trade Inquiry
                                </button>
                                <button
                                    className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'sample' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'}`}
                                    onClick={() => setActiveTab('sample')}
                                >
                                    Request Sample
                                </button>
                            </div>

                            {activeTab === 'inquiry' ? (
                                <form onSubmit={(e) => { e.preventDefault(); submitForm('/inquiries', inquiryForm, () => { }); }} className="space-y-4 animate-fade-in">
                                    <input type="text" name="companyName" placeholder="Company Name" className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleInquiryChange} required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" name="contactPerson" placeholder="Contact Name" className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleInquiryChange} required />
                                        <input type="email" name="email" placeholder="Email" className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleInquiryChange} required />
                                    </div>
                                    <input type="text" name="destination" placeholder="Destination Country" className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleInquiryChange} required />
                                    <textarea name="message" rows="4" placeholder="Tell us about your requirements..." className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleInquiryChange}></textarea>
                                    <button type="submit" className="w-full bg-primary text-surface py-3 font-bold uppercase tracking-widest hover:bg-accent transition-colors">Request Trade Access</button>
                                </form>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); submitForm('/b2b/samples', sampleForm, () => { }); }} className="space-y-4 animate-fade-in">
                                    <input type="text" name="companyName" placeholder="Company Name" className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleSampleChange} required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" name="contactName" placeholder="Recipient Name" className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleSampleChange} required />
                                        <input type="text" name="shippingAccount" placeholder="Courier Acc # (Optional)" className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleSampleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-secondary uppercase">Select Samples</label>
                                        <div className="flex flex-wrap gap-3">
                                            {['Saffron (1g)', 'Hing (10g)'].map(item => (
                                                <label key={item} className="flex items-center space-x-2 text-sm cursor-pointer border border-secondary/20 px-3 py-1 rounded-sm hover:bg-secondary/5">
                                                    <input type="checkbox" value={item} onChange={(e) => handleProductInterestChange(e, 'sample')} className="accent-accent" />
                                                    <span>{item}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea name="address" rows="3" placeholder="Full Shipping Address" className="w-full p-3 bg-surface border border-secondary/20 focus:border-accent outline-none text-sm" onChange={handleSampleChange} required></textarea>
                                    <button type="submit" className="w-full bg-primary text-surface py-3 font-bold uppercase tracking-widest hover:bg-accent transition-colors">Submit Request</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default B2B;
