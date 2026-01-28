import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import client from '../api/client';
import BgImage1 from '../assets/bgimage1.png';

const Contact = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await client.post('/contact', formData);
            alert('Thank you! Your message has been sent successfully.');
            setFormData({ firstName: '', lastName: '', email: '', subject: 'General Inquiry', message: '' });
        } catch (error) {
            console.error(error);
            alert('Failed to send message. Please try again.');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="w-full pt-20 bg-background min-h-screen">
            {/* Header */}
            <div className="relative h-64 md:h-80 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img src={BgImage1} alt="Contact Us" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
                </div>
                <div className="relative z-10 text-center space-y-4 animate-fade-in-up">
                    <h1 className="font-heading text-4xl md:text-5xl text-surface font-bold tracking-wide">CONTACT US</h1>
                    <p className="text-surface/80 font-light max-w-2xl mx-auto text-lg px-4">
                        We'd love to hear from you. Get in touch with us for any queries or support.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Information */}
                    <div className="space-y-12">
                        <div>
                            <span className="text-accent text-sm tracking-[0.2em] uppercase font-bold">Get In Touch</span>
                            <h2 className="font-heading text-3xl md:text-4xl text-primary font-bold mt-4 mb-6">Contact Siraba Organic</h2>
                            <p className="text-text-secondary text-lg font-light leading-relaxed">
                                Whether you're curious about our organic farming practices, interested in bulk orders, or just want to say hello, we're here to help.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-start space-x-6 group">
                                <div className="w-12 h-12 bg-surface border border-secondary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-surface transition-colors duration-300">
                                    <Mail size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-heading text-xl font-bold text-primary mb-2">Email Us</h3>
                                    <p className="text-text-secondary font-light">info@sirabaorganic.com</p>
                                    <p className="text-text-secondary font-light text-sm mt-1">
                                        For wholesale/bulk: <br /> Use subject "Bulk Enquiry"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-6 group">
                                <div className="w-12 h-12 bg-surface border border-secondary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-surface transition-colors duration-300">
                                    <Phone size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-heading text-xl font-bold text-primary mb-2">Call Us</h3>
                                    <p className="text-text-secondary font-light">+91-XXXXXXXXXX</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-6 group">
                                <div className="w-12 h-12 bg-surface border border-secondary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-surface transition-colors duration-300">
                                    <MapPin size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-heading text-xl font-bold text-primary mb-2">Suggestions?</h3>
                                    <p className="text-text-secondary font-light">Write to us at:</p>
                                    <p className="text-text-secondary font-light">sirabaorganic@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-surface p-8 md:p-12 shadow-xl rounded-sm border border-secondary/10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-primary font-medium">First Name</label>
                                    <input
                                        required
                                        name="firstName"
                                        type="text"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full bg-secondary/5 border border-transparent focus:border-accent p-3 rounded-sm focus:outline-none transition-colors"
                                        placeholder="Prasad"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-primary font-medium">Last Name</label>
                                    <input
                                        required
                                        name="lastName"
                                        type="text"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full bg-secondary/5 border border-transparent focus:border-accent p-3 rounded-sm focus:outline-none transition-colors"
                                        placeholder="Shaswat"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-primary font-medium">Email Address</label>
                                <input
                                    required
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-secondary/5 border border-transparent focus:border-accent p-3 rounded-sm focus:outline-none transition-colors"
                                    placeholder="prasad@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-primary font-medium">Subject</label>
                                <select
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full bg-secondary/5 border border-transparent focus:border-accent p-3 rounded-sm focus:outline-none transition-colors appearance-none"
                                >
                                    <option>General Inquiry</option>
                                    <option>Order Support</option>
                                    <option>Wholesale / B2B</option>
                                    <option>Media & Press</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-primary font-medium">Message</label>
                                <textarea
                                    required
                                    name="message"
                                    rows="4"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full bg-secondary/5 border border-transparent focus:border-accent p-3 rounded-sm focus:outline-none transition-colors text-sm"
                                    placeholder="How can we help you?"
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full bg-primary text-surface font-medium text-sm tracking-widest uppercase py-4 hover:bg-accent hover:text-primary transition-all duration-300 shadow-md flex items-center justify-center gap-2">
                                Send Message <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
