import React, { useState } from 'react';
import { Shield, CheckCircle2, Award, FileText, MapPin, Sparkles, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

/**
 * SirabaTrustPassport Component
 * Renders the 4 pillars of the SIRABA Trust Passport™
 * CERTIFIED • VERIFIED • TRACEABLE • QUALIFIED
 */
const SirabaTrustPassport = ({ compliance, latestBatch, onTabSelect, loading, error }) => {
    const [expandedPillar, setExpandedPillar] = useState(null);

    if (loading) {
        return (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Loading verification details...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400" />
                    <span>Verification details could not be loaded.</span>
                </div>
            </div>
        );
    }

    if (!compliance) {
        return (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Verification details currently unavailable for this product.</span>
                </div>
            </div>
        );
    }

    const { certification, regulatory, productVerification, scientificVerification, sirabaQualification, trustStatus } = compliance;

    const togglePillar = (id) => {
        setExpandedPillar(expandedPillar === id ? null : id);
    };

    const cleanEvidenceSummary = (summary) => {
        if (!summary) return 'Accredited Lab Evidence Reviewed';
        return summary
            .replace(/NABL[- ]Accredited Lab Report/gi, 'Accredited Lab Evidence')
            .replace(/NABL[- ]Accredited Lab/gi, 'Accredited Lab Evidence')
            .replace(/&?\s*NABL\s*Lab Tested/gi, '& Accredited Lab Evidence')
            .replace(/NABL Lab Tested/gi, 'Accredited Lab Evidence Reviewed')
            .replace(/NABL Lab Testing/gi, 'Accredited Lab Evidence')
            .replace(/NABL Verified/gi, 'Accredited Lab Evidence Reviewed')
            .replace(/Tested by NABL Lab/gi, 'Laboratory Evidence Reviewed')
            .replace(/NABL Testing/gi, 'Accredited Lab Evidence')
            .replace(/NABL Verification/gi, 'Accredited Lab Evidence')
            .replace(/NABL Lab Evidence/gi, 'Accredited Lab Evidence')
            .replace(/\bNABL\b/gi, 'Accredited Lab')
            .replace(/Accredited Lab Lab Tested/gi, 'Accredited Lab Evidence Reviewed')
            .trim();
    };

    const isCertVerified = certification?.status === 'verified';
    const isVerifiedPillar = regulatory?.fssai?.status === 'verified' && productVerification?.status === 'verified' && (scientificVerification?.status === 'verified' || scientificVerification?.status === 'not_applicable');
    const isTraceablePillar = latestBatch?.traceability?.status === 'verified';
    const isQualifiedPillar = sirabaQualification?.status === 'verified';

    const pillars = [
        {
            id: 'certified',
            title: 'CERTIFIED™',
            status: certification?.status || 'not_available',
            icon: Award,
            summary: isCertVerified ? (certification?.standard ? `${certification.standard} Organic` : 'Certified Organic') : 'Certification Pending Review',
            details: [
                { label: 'Standard', value: certification?.standard || (isCertVerified ? 'Verified Standard' : 'Pending Review') },
                { label: 'Certification Body', value: certification?.certificationBody || (isCertVerified ? 'Verified Certifier' : 'Pending Review') },
                { label: 'Certificate No', value: certification?.certificateNumber || (isCertVerified ? 'Verified' : 'Pending Verification') },
                { label: 'Valid Until', value: certification?.validUntil ? new Date(certification.validUntil).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : (isCertVerified ? 'Verified' : 'Pending') },
            ]
        },
        {
            id: 'verified',
            title: 'VERIFIED™',
            status: isVerifiedPillar ? 'verified' : 'pending',
            icon: CheckCircle2,
            summary: isVerifiedPillar ? 'FSSAI & Accredited Lab Evidence' : 'Accredited Lab Evidence Pending',
            details: [
                { label: 'FSSAI License', value: regulatory?.fssai?.status === 'verified' ? (regulatory?.fssai?.licenseNumber || 'Verified') : 'Pending Verification' },
                { label: 'Ingredients Checked', value: productVerification?.ingredientsVerified ? 'Verified Pure' : 'Pending' },
                { label: 'Label Claims', value: productVerification?.claimsReviewed ? 'Reviewed' : 'Pending' },
                { label: 'Accredited Lab Evidence', value: (scientificVerification?.status === 'verified' || scientificVerification?.status === 'not_applicable') ? cleanEvidenceSummary(scientificVerification?.summary) : 'Accredited Lab Evidence Pending' },
            ]
        },
        {
            id: 'traceable',
            title: 'TRACEABLE™',
            status: isTraceablePillar ? 'verified' : 'pending',
            icon: MapPin,
            summary: latestBatch?.traceability?.origin ? `Origin: ${latestBatch.traceability.origin}` : (latestBatch ? 'Batch Traceability Assigned' : 'Batch Traceability Pending'),
            details: [
                { label: 'Current Batch', value: latestBatch?.batchNumber || 'Pending Assignment' },
                { label: 'Source Region', value: latestBatch?.traceability?.origin || 'Pending Assignment' },
                { label: 'Processing', value: latestBatch?.traceability?.processing || 'Pending Facility Audit' },
                { label: 'Trace ID', value: latestBatch?.traceId || (latestBatch ? 'Assigned' : 'Pending Assignment') },
            ]
        },
        {
            id: 'qualified',
            title: 'QUALIFIED™',
            status: isQualifiedPillar ? 'verified' : 'pending',
            icon: Sparkles,
            summary: isQualifiedPillar ? 'SIRABA Marketplace Vendor Qualified' : 'Vendor Qualification Pending',
            details: [
                { label: 'Vendor Status', value: sirabaQualification?.vendorQualified ? 'Vetted & Approved' : 'Pending' },
                { label: 'Marketplace Status', value: sirabaQualification?.marketplaceApproved ? 'Authorized Seller' : 'Pending' },
                { label: 'Quality Audit', value: isQualifiedPillar ? 'Passed Standard Audit' : 'Audit Pending' },
            ]
        }
    ];

    return (
        <div className="rounded-2xl bg-gradient-to-br from-[#0F3D2E] to-[#164e3c] text-white p-4 sm:p-4.5 shadow-lg border border-[#C9A24D]/30 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-[#C9A24D]/10 blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3 mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-[#C9A24D]/20 border border-[#C9A24D]/40 flex items-center justify-center text-[#C9A24D] shrink-0">
                        <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-serif tracking-wide text-amber-100 font-bold uppercase truncate">
                            SIRABA Trust Passport™
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-emerald-200/80 truncate">Triple-Verified Evidence Summary</p>
                    </div>
                </div>
                {trustStatus?.isTripleVerified && (
                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9A24D] text-[#0F3D2E] tracking-wider uppercase shrink-0 whitespace-nowrap">
                        Triple-Verified
                    </span>
                )}
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {pillars.map((pillar) => {
                    const IconComponent = pillar.icon;
                    const isExpanded = expandedPillar === pillar.id;
                    const isVerified = pillar.status === 'verified';

                    return (
                        <div
                            key={pillar.id}
                            className={`rounded-xl transition-all duration-200 border ${isVerified
                                    ? 'bg-emerald-950/40 border-emerald-600/30 hover:border-[#C9A24D]/50'
                                    : 'bg-emerald-950/20 border-emerald-900/40 opacity-80'
                                }`}
                        >
                            <button
                                onClick={() => togglePillar(pillar.id)}
                                className="w-full p-2 sm:p-2.5 text-left flex items-start justify-between gap-1 cursor-pointer"
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isVerified ? 'text-[#C9A24D]' : 'text-slate-400'}`} />
                                        <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-white truncate">{pillar.title}</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-200/90 leading-tight line-clamp-2">{pillar.summary}</p>
                                </div>
                                <div className="text-emerald-300 mt-0.5 shrink-0">
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </div>
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-2.5 pb-2.5 pt-1 border-t border-emerald-800/40 space-y-1.5 text-[10px] sm:text-[11px] bg-emerald-950/60 rounded-b-xl">
                                    {pillar.details.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-emerald-100">
                                            <span className="text-emerald-300/80">{item.label}:</span>
                                            <span className="font-medium text-white text-right ml-1">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Action */}
            {onTabSelect && (
                <div className="mt-3 pt-2.5 border-t border-emerald-800/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] sm:text-[11px] text-emerald-200/80">Every claim backed by structured evidence.</span>
                </div>
            )}
        </div>
    );
};

export default SirabaTrustPassport;
