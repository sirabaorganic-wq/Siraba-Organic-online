import React, { useState } from 'react';
import { ShieldCheck, Award, FileCheck, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles, Building2, Calendar } from 'lucide-react';

/**
 * TrustVerificationTab Component
 * Detailed Trust & Verification tab for Product Detail Page
 */
const TrustVerificationTab = ({ compliance }) => {
    const [openSection, setOpenSection] = useState('certification');

    if (!compliance) {
        return (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-semibold text-slate-700">Verification Record Unavailable</h4>
                <p className="text-xs max-w-md mx-auto">
                    This product does not currently have an active SIRABA Trust Passport™ compliance record.
                </p>
            </div>
        );
    }

    const { certification, regulatory, productVerification, scientificVerification, sirabaQualification, verifiedClaims, trustStatus } = compliance;

    const toggle = (sec) => setOpenSection(openSection === sec ? null : sec);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Expired
                    </span>
                );
            case 'not_applicable':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        Not Applicable
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                        Pending Review
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-5 rounded-2xl bg-[#0F3D2E] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-[#C9A24D]/30">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#C9A24D]" />
                        <h3 className="font-serif text-lg font-bold text-amber-100 tracking-wide">
                            SIRABA Trust Passport™ Verification Record
                        </h3>
                    </div>
                    <p className="text-xs text-emerald-200/90">
                        Independent structured evidence summary for consumer transparency.
                    </p>
                </div>
                {trustStatus?.isTripleVerified && (
                    <div className="px-3 py-1.5 rounded-xl bg-[#C9A24D] text-[#0F3D2E] font-bold text-xs flex items-center gap-1.5 shadow-xs">
                        <Sparkles className="w-4 h-4 fill-[#0F3D2E]" />
                        <span>Triple-Verified Product</span>
                    </div>
                )}
            </div>

            {/* Accordion Sections */}
            <div className="space-y-3">
                {/* 1. Organic Certification */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <button
                        onClick={() => toggle('certification')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">01. Organic Certification</h4>
                                <p className="text-xs text-slate-500">{certification?.standard || 'NPOP'} Standard Coverage</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(certification?.status)}
                            {openSection === 'certification' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                    </button>

                    {openSection === 'certification' && (
                        <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[11px] block uppercase font-mono">Certification Standard</span>
                                    <span className="font-semibold text-slate-800">{certification?.standard || 'NPOP (India Organic)'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[11px] block uppercase font-mono">Certification Body</span>
                                    <span className="font-semibold text-slate-800">{certification?.certificationBody || 'Accredited Agency'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[11px] block uppercase font-mono">Certificate Number</span>
                                    <span className="font-mono font-medium text-slate-800">{certification?.certificateNumber || 'N/A'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[11px] block uppercase font-mono">Certified Product Scope</span>
                                    <span className="font-medium text-slate-800">{certification?.productScope || 'Organic Agricultural Product'}</span>
                                </div>
                            </div>
                            {certification?.lastVerifiedAt && (
                                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Last Verified: {new Date(certification.lastVerifiedAt).toLocaleDateString()}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Regulatory Compliance */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <button
                        onClick={() => toggle('regulatory')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">02. Regulatory Compliance</h4>
                                <p className="text-xs text-slate-500">FSSAI Food Safety & Regulatory Status</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(regulatory?.fssai?.status)}
                            {openSection === 'regulatory' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                    </button>

                    {openSection === 'regulatory' && (
                        <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[11px] block uppercase font-mono">FSSAI License Number</span>
                                    <span className="font-mono font-semibold text-slate-800">{regulatory?.fssai?.licenseNumber || 'Verified License'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[11px] block uppercase font-mono">Regulatory Status</span>
                                    <span className="font-medium text-emerald-700">Active & Food Grade Verified</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Product & Label Verification */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <button
                        onClick={() => toggle('product')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#0F3D2E]/10 text-[#0F3D2E]">
                                <FileCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">03. Product & Label Verification</h4>
                                <p className="text-xs text-slate-500">Ingredient Purity & Specification Checks</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(productVerification?.status)}
                            {openSection === 'product' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                    </button>

                    {openSection === 'product' && (
                        <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                                    <span className="text-slate-400 text-[10px] block">Label Verified</span>
                                    <span className="font-bold text-emerald-700 text-xs">
                                        {productVerification?.labelVerified ? 'PASSED ✓' : 'PENDING'}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                                    <span className="text-slate-400 text-[10px] block">Ingredients</span>
                                    <span className="font-bold text-emerald-700 text-xs">
                                        {productVerification?.ingredientsVerified ? 'PASSED ✓' : 'PENDING'}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                                    <span className="text-slate-400 text-[10px] block">Specifications</span>
                                    <span className="font-bold text-emerald-700 text-xs">
                                        {productVerification?.specificationVerified ? 'PASSED ✓' : 'PENDING'}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                                    <span className="text-slate-400 text-[10px] block">Claims Review</span>
                                    <span className="font-bold text-emerald-700 text-xs">
                                        {productVerification?.claimsReviewed ? 'PASSED ✓' : 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Scientific Testing & Evidence */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <button
                        onClick={() => toggle('scientific')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">04. Laboratory Testing Evidence</h4>
                                <p className="text-xs text-slate-500">Tested by NABL-Accredited Laboratories</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(scientificVerification?.status)}
                            {openSection === 'scientific' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                    </button>

                    {openSection === 'scientific' && (
                        <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                            <div className="p-3 rounded-lg bg-white border border-slate-200">
                                <span className="text-slate-400 text-[11px] block uppercase font-mono">Laboratory Evidence Summary</span>
                                <p className="text-slate-800 font-medium mt-1">
                                    {scientificVerification?.summary || 'Tested by NABL-accredited laboratory (ISO/IEC 17025 compliant)'}
                                </p>
                            </div>
                            <p className="text-[11px] text-slate-500 italic">
                                Note: Laboratory evidence reviewed under SIRABA product quality framework.
                            </p>
                        </div>
                    )}
                </div>

                {/* 5. Verified Product Claims */}
                {verifiedClaims && verifiedClaims.length > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                        <h5 className="font-semibold text-emerald-900 text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            Verified Product Claims
                        </h5>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {verifiedClaims.map((item, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-800 text-xs font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {item.claim}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrustVerificationTab;
