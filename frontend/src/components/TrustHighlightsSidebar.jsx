import React from 'react';
import { ShieldCheck, Award, MapPin, Sparkles, CheckCircle } from 'lucide-react';

/**
 * TrustHighlightsSidebar Component
 * Right sidebar card showcasing verified trust highlights
 */
const TrustHighlightsSidebar = ({ compliance, latestBatch }) => {
    if (!compliance && !latestBatch) return null;

    const highlights = [
        {
            icon: Award,
            title: 'Organic Certified',
            subtitle: compliance?.certification?.standard ? `${compliance.certification.standard} Verified` : 'NPOP Certified',
            active: compliance?.certification?.status === 'verified',
        },
        {
            icon: ShieldCheck,
            title: 'Quality Tested',
            subtitle: compliance?.scientificVerification?.summary || 'NABL Accredited Testing',
            active: compliance?.scientificVerification?.status === 'verified' || Boolean(latestBatch?.laboratoryEvidence?.length),
        },
        {
            icon: MapPin,
            title: 'Traceable Source',
            subtitle: latestBatch?.traceability?.origin || 'Verified Origin',
            active: Boolean(latestBatch?.traceability?.origin),
        },
        {
            icon: Sparkles,
            title: 'Marketplace Approved',
            subtitle: 'SIRABA Quality Vetted',
            active: compliance?.sirabaQualification?.status === 'verified',
        },
    ];

    return (
        <div className="rounded-xl border border-emerald-900/10 bg-[#FAFAF7] p-4 space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#0F3D2E] flex items-center gap-1.5 border-b border-emerald-900/10 pb-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A24D]" />
                Trust Highlights
            </h4>

            <div className="space-y-2.5">
                {highlights.map((h, i) => {
                    const IconComponent = h.icon;
                    return (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                            <div className={`mt-0.5 p-1 rounded-md ${h.active ? 'bg-[#0F3D2E] text-[#C9A24D]' : 'bg-slate-100 text-slate-400'}`}>
                                <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-slate-800">{h.title}</span>
                                    {h.active && <CheckCircle className="w-3 h-3 text-emerald-600 inline" />}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">{h.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrustHighlightsSidebar;
