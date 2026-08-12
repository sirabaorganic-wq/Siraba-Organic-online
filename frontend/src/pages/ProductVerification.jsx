import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Award, MapPin, QrCode, ArrowLeft, Building2, Calendar, FileText } from 'lucide-react';
import client from '../api/client';
import logo from '../assets/SIRABALOGO.png';

/**
 * ProductVerification Page
 * Public verification page at /verify/:traceId
 */
const ProductVerification = () => {
    const { traceId } = useParams();
    const [verificationData, setVerificationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVerification = async () => {
            if (!traceId) return;
            setLoading(true);
            setError(null);
            try {
                const { data } = await client.get(`/verification/${traceId}`);
                setVerificationData(data);
            } catch (err) {
                console.error('Verification error:', err);
                setError(err.response?.data?.message || 'Failed to resolve Trace ID');
                setVerificationData(err.response?.data || null);
            } finally {
                setLoading(false);
            }
        };

        fetchVerification();
    }, [traceId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-[#0F3D2E] border-t-[#C9A24D] rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-serif font-semibold text-[#0F3D2E] tracking-wider uppercase">
                        Verifying SIRABA Trace ID...
                    </p>
                </div>
            </div>
        );
    }

    const isFound = verificationData?.found;
    const isVerified = verificationData?.isCurrentlyVerified;
    const status = verificationData?.verificationStatus;
    const { product, vendor, compliance, batch, verification } = verificationData || {};

    return (
        <div className="min-h-screen bg-[#FAFAF7] text-slate-800 pb-16">
            {/* Top Navbar Header */}
            <header className="bg-[#0F3D2E] text-white py-4 px-6 border-b border-[#C9A24D]/30 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="SIRABA Organic" className="h-8 object-contain bg-white/90 p-1 rounded" />
                        <span className="font-serif text-sm font-bold text-amber-100 uppercase tracking-widest hidden sm:inline">
                            Trust Passport™
                        </span>
                    </Link>
                    <Link
                        to="/"
                        className="text-xs text-amber-200 hover:text-white flex items-center gap-1 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-8 space-y-6">
                {/* Main Status Hero Card */}
                {!isFound ? (
                    <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-sm text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                            <XCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-serif font-bold text-rose-900">Trace ID Not Found</h2>
                            <p className="text-xs text-slate-600 max-w-md mx-auto">
                                The requested Trace ID <span className="font-mono font-bold text-slate-900">{traceId}</span> could not be verified in the SIRABA Trust Passport registry.
                            </p>
                        </div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-semibold hover:bg-[#164e3c] transition-colors"
                        >
                            Return to Store
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Found Status Banner */}
                        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left ${
                            isVerified
                                ? 'bg-gradient-to-br from-[#0F3D2E] to-[#164e3c] text-white border-[#C9A24D]/40'
                                : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                            <div className={`p-4 rounded-2xl ${isVerified ? 'bg-[#C9A24D]/20 text-[#C9A24D]' : 'bg-amber-100 text-amber-700'}`}>
                                {isVerified ? <ShieldCheck className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                            </div>
                            <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                                        Trace ID: {traceId}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        isVerified ? 'bg-[#C9A24D] text-[#0F3D2E]' : 'bg-amber-200 text-amber-900'
                                    }`}>
                                        Status: {status}
                                    </span>
                                </div>
                                <h2 className="text-lg font-serif font-bold tracking-wide">
                                    {isVerified ? 'Authentic & Triple-Verified Product' : 'Verification Under Review / Special Status'}
                                </h2>
                                <p className="text-xs opacity-90">
                                    {verification?.message || `Refers to Batch: ${batch?.batchNumber}`}
                                </p>
                            </div>
                        </div>

                        {/* Product & Batch Summary Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#0F3D2E] border-b border-slate-100 pb-2">
                                Product & Batch Context
                            </h3>

                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                {product?.image && (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-xs"
                                    />
                                )}
                                <div className="space-y-1.5 flex-1">
                                    <h4 className="font-serif font-bold text-slate-900 text-base">{product?.name || 'Verified Organic Product'}</h4>
                                    <p className="text-xs text-slate-500">Category: {product?.category || 'Organic Pantry'}</p>
                                    <p className="text-xs text-slate-600 flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                        Producer / Vendor: <span className="font-semibold text-slate-800">{vendor?.businessName || 'SIRABA Direct'}</span>
                                    </p>
                                    {product?.slug && (
                                        <Link
                                            to={`/product/${product.slug}`}
                                            className="inline-block text-xs font-medium text-[#C9A24D] hover:text-[#0F3D2E] transition-colors mt-1"
                                        >
                                            View Product Page →
                                        </Link>
                                    )}
                                </div>

                                {/* QR Code Display */}
                                <div className="sm:border-l border-slate-100 pl-4 flex flex-col items-center">
                                    <img
                                        src={`/api/verification/${traceId}/qr`}
                                        alt={`QR Code ${traceId}`}
                                        className="w-24 h-24 object-contain rounded border border-slate-200"
                                    />
                                    <span className="text-[10px] font-mono text-slate-400 mt-1">Official QR</span>
                                </div>
                            </div>
                        </div>

                        {/* Batch Traceability Summary */}
                        {batch && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#0F3D2E] border-b border-slate-100 pb-2 flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-[#C9A24D]" />
                                    Batch Traceability Details
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <span className="text-slate-400 text-[10px] block uppercase font-mono">Batch Number</span>
                                        <span className="font-mono font-bold text-slate-900">{batch.batchNumber}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <span className="text-slate-400 text-[10px] block uppercase font-mono">Farm Origin</span>
                                        <span className="font-semibold text-slate-800">{batch.traceability?.origin || 'Verified Region'}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <span className="text-slate-400 text-[10px] block uppercase font-mono">Manufacture Date</span>
                                        <span className="font-semibold text-slate-800">
                                            {batch.manufacturedAt ? new Date(batch.manufacturedAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <span className="text-slate-400 text-[10px] block uppercase font-mono">Best Before</span>
                                        <span className="font-semibold text-slate-800">
                                            {batch.bestBefore ? new Date(batch.bestBefore).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Public Compliance Pillar Breakdown */}
                        {compliance && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#0F3D2E] border-b border-slate-100 pb-2 flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-[#C9A24D]" />
                                    Verified Compliance Standards
                                </h3>

                                <div className="space-y-3 text-xs">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-slate-800 block">Organic Certification</span>
                                            <span className="text-slate-500 text-[11px]">{compliance.certification?.standard} • {compliance.certification?.certificationBody}</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                            {compliance.certification?.status} ✓
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-slate-800 block">FSSAI Food Safety</span>
                                            <span className="text-slate-500 text-[11px]">License Verified</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                            {compliance.regulatory?.fssai?.status} ✓
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-slate-800 block">Laboratory Testing</span>
                                            <span className="text-slate-500 text-[11px]">{compliance.scientificVerification?.summary}</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                            {compliance.scientificVerification?.status} ✓
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default ProductVerification;
