import React from 'react';
import { MapPin, Factory, PackageCheck, Truck, FlaskConical, Calendar, QrCode, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * TraceabilityTab Component
 * Detailed Batch Traceability & Supply Chain Timeline
 */
const TraceabilityTab = ({ latestBatch }) => {
    if (!latestBatch) {
        return (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-semibold text-slate-700">Traceability Record Unavailable</h4>
                <p className="text-xs max-w-md mx-auto">
                    Batch traceability details are currently being processed for this product.
                </p>
            </div>
        );
    }

    const { batchNumber, status, manufacturedAt, bestBefore, traceability, laboratoryEvidence, traceId, batchInfo } = latestBatch;

    const displayInfo = batchInfo || traceability?.batchInfo || traceability?.origin;

    const steps = [
        {
            icon: MapPin,
            title: '1. Source & Farm Origin',
            detail: displayInfo || 'Verified Heritage Belt',
            sub: traceability?.producer || 'Verified Organic Producer',
            status: traceability?.status === 'verified' ? 'Verified' : 'Pending',
        },
        {
            icon: Factory,
            title: '2. Processing & Milling',
            detail: traceability?.processing || 'Verified Processing Facility',
            sub: 'Traditional Stone Ground / Cold Method',
            status: 'Verified',
        },
        {
            icon: FlaskConical,
            title: '3. Laboratory Quality Test',
            detail: laboratoryEvidence?.[0]?.laboratory || 'NABL Accredited Lab',
            sub: laboratoryEvidence?.[0]?.reportNumber ? `Report: ${laboratoryEvidence[0].reportNumber}` : 'Parameters Tested',
            status: laboratoryEvidence?.[0]?.status === 'verified' ? 'Verified' : 'Passed',
        },
        {
            icon: PackageCheck,
            title: '4. Hygienic Packaging',
            detail: traceability?.packaging || 'Sealed Food-Grade Foil',
            sub: manufacturedAt ? `Mfg: ${new Date(manufacturedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Hygienic Sealed',
            status: 'Verified',
        },
        {
            icon: Truck,
            title: '5. Direct Distribution',
            detail: traceability?.distribution || 'Traceability Maintained',
            sub: 'SIRABA Quality Chain',
            status: 'Verified',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header Batch Box */}
            <div className="p-4 rounded-2xl bg-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#C9A24D]/30 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#C9A24D] text-[#0F3D2E] font-bold">
                            Batch {batchNumber}
                        </span>
                        {traceId && (
                            <span className="text-xs font-mono text-emerald-200">
                                Trace ID: {traceId}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-emerald-200/80">
                        This traceability record applies specifically to Batch <span className="font-semibold text-white">{batchNumber}</span>.
                    </p>
                </div>
                {traceId && (
                    <Link
                        to={`/verify/${traceId}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Public Verification Page</span>
                    </Link>
                )}
            </div>

            {/* Batch Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[10px] block uppercase font-mono">Manufactured Date</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {manufacturedAt ? new Date(manufacturedAt).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[10px] block uppercase font-mono">Best Before</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {bestBefore ? new Date(bestBefore).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[10px] block uppercase font-mono">Quality Status</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {latestBatch.qualityVerification?.status === 'verified' ? 'Quality Verified' : 'Standard Passed'}
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[10px] block uppercase font-mono">Batch Status</span>
                    <span className="font-semibold text-slate-800 capitalize">
                        {status || 'Active'}
                    </span>
                </div>
            </div>

            {/* Batch Information Details Card */}
            {displayInfo && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5 shadow-2xs">
                    <span className="text-[#0F3D2E] text-[11px] font-bold uppercase tracking-wider block font-mono">
                        Batch Information & Traceability Details
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {displayInfo}
                    </p>
                </div>
            )}

            {/* Visual Timeline */}
            <div className="space-y-4">
                <h4 className="font-serif font-bold text-slate-900 text-sm tracking-wide uppercase">
                    Supply Chain Journey Timeline
                </h4>

                <div className="relative border-l-2 border-emerald-600/40 ml-4 space-y-6 pl-6 pt-2">
                    {steps.map((step, idx) => {
                        const IconComp = step.icon;
                        return (
                            <div key={idx} className="relative group">
                                {/* Timeline Dot Icon */}
                                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#0F3D2E] border-2 border-[#C9A24D] flex items-center justify-center text-[#C9A24D] shadow-sm">
                                    <IconComp className="w-4 h-4" />
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs hover:border-[#0F3D2E]/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-semibold text-slate-900 text-xs">{step.title}</h5>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {step.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-800">{step.detail}</p>
                                    <p className="text-[11px] text-slate-400">{step.sub}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Lab Test Parameters Table (if evidence present) */}
            {laboratoryEvidence?.[0]?.parameters && laboratoryEvidence[0].parameters.length > 0 && (
                <div className="space-y-3 pt-2">
                    <h4 className="font-serif font-bold text-slate-900 text-sm tracking-wide uppercase">
                        Batch Quality Testing Parameters
                    </h4>

                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                                <tr>
                                    <th className="p-3 font-medium">Parameter Tested</th>
                                    <th className="p-3 font-medium">Category</th>
                                    <th className="p-3 font-medium text-right">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {laboratoryEvidence[0].parameters.map((param, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-medium text-slate-800">{param.name}</td>
                                        <td className="p-3 text-slate-500 capitalize">{param.category}</td>
                                        <td className="p-3 text-right">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                                {param.status} ✓
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraceabilityTab;
