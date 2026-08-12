import React, { useState } from 'react';
import { QrCode, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * QRVerificationCard Component
 * Renders QR code and Trace ID sidebar card
 */
const QRVerificationCard = ({ latestBatch }) => {
    const [copied, setCopied] = useState(false);

    if (!latestBatch || !latestBatch.traceId) {
        return null;
    }

    const { traceId, batchNumber } = latestBatch;

    const copyTraceId = () => {
        navigator.clipboard.writeText(traceId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const qrImageSrc = `/api/verification/${traceId}/qr`;

    return (
        <div className="rounded-xl border border-emerald-900/15 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-[#0F3D2E]">
                    <QrCode className="w-4 h-4 text-[#C9A24D]" />
                    <span>QR Verification</span>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Batch: {batchNumber}
                </span>
            </div>

            {/* QR Image Display */}
            <div className="flex flex-col items-center justify-center p-3 bg-[#FAFAF7] rounded-lg border border-slate-200/80">
                <img
                    src={qrImageSrc}
                    alt={`Verify Trace ID ${traceId}`}
                    className="w-36 h-36 object-contain rounded border border-white shadow-xs"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                    }}
                />
                <p className="text-[11px] text-slate-500 text-center mt-2">
                    Scan to verify batch authenticity & traceability
                </p>
            </div>

            {/* Trace ID Copy Box */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Trace ID</span>
                    <span className="font-mono font-bold text-[#0F3D2E] text-xs">{traceId}</span>
                </div>
                <button
                    onClick={copyTraceId}
                    className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="Copy Trace ID"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Direct Verification Link */}
            <Link
                to={`/verify/${traceId}`}
                className="w-full py-2 px-3 rounded-lg bg-[#0F3D2E] hover:bg-[#164e3c] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A24D]" />
                <span>Verify Online Page</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
            </Link>
        </div>
    );
};

export default QRVerificationCard;
