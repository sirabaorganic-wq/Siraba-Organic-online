import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle, Mail, Twitter, Facebook } from 'lucide-react';

/**
 * ProductShare Component
 * Social sharing helper for product detail page
 */
const ProductShare = ({ product }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!product) return null;

    const url = window.location.href;
    const text = `Check out ${product.name} on SIRABA Organic — Triple-Verified Organic Product`;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    };

    const shareFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    };

    const shareTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    const shareEmail = () => {
        window.open(`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(text + '\n\n' + url)}`, '_self');
    };

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-30 space-y-1 text-xs">
                    <button
                        onClick={shareWhatsApp}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-800 text-left transition-colors"
                    >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>WhatsApp</span>
                    </button>
                    <button
                        onClick={shareFacebook}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-blue-800 text-left transition-colors"
                    >
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <span>Facebook</span>
                    </button>
                    <button
                        onClick={shareTwitter}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-sky-50 text-sky-800 text-left transition-colors"
                    >
                        <Twitter className="w-4 h-4 text-sky-500" />
                        <span>Twitter</span>
                    </button>
                    <button
                        onClick={shareEmail}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-left transition-colors"
                    >
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>Email</span>
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-left transition-colors font-medium"
                    >
                        <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductShare;
