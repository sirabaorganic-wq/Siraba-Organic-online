import React from 'react';
import { ShieldCheck, CheckCircle2, Award, ArrowRight, AlertCircle } from 'lucide-react';

/**
 * TripleVerifiedBadge Component
 * Compact trust badge for product detail page matching visual reference
 */
const TripleVerifiedBadge = ({ productTrustStatus, onTabSelect }) => {
    if (!productTrustStatus) return null;

    const { isCertified, isVerified, isQualified, isTripleVerified } = productTrustStatus;

    if (isTripleVerified) {
        return (
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-[#0F3D2E]/5 border border-[#0F3D2E]/20 text-[#0F3D2E]">
                <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-[#C9A24D] fill-[#0F3D2E]" />
                    <span>SIRABA Triple-Verified™</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium border-l border-[#0F3D2E]/20 pl-2">
                    <span className="flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Certified</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Qualified</span>
                </div>
                {onTabSelect && (
                    <button
                        onClick={() => onTabSelect('trust')}
                        className="text-[11px] text-[#C9A24D] hover:text-[#0F3D2E] font-medium flex items-center gap-0.5 transition-colors cursor-pointer ml-auto"
                    >
                        Evidence <ArrowRight className="w-3 h-3" />
                    </button>
                )}
            </div>
        );
    }

    if (isCertified) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold">Certified Organic</span>
                {onTabSelect && (
                    <button
                        onClick={() => onTabSelect('trust')}
                        className="text-xs text-emerald-700 underline font-medium hover:text-emerald-900 cursor-pointer ml-1"
                    >
                        Details
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Verification in Progress</span>
        </div>
    );
};

export default TripleVerifiedBadge;
