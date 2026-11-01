'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, MessageSquare, MapPin, ShieldCheck, Check, Copy } from 'lucide-react';
import { ProductItem } from '@/data/mock-items';

interface SellerContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductItem | null;
}

export const SellerContactModal: React.FC<SellerContactModalProps> = ({
    isOpen,
    onClose,
    product,
}) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    const dummyPhone = '0987 654 321';

    const handleCopy = () => {
        navigator.clipboard.writeText(dummyPhone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                            Contact Seller & Exchange
                        </h3>
                        <p className="text-xs text-slate-500">
                            Negotiate and arrange a direct meetup on campus
                        </p>
                    </div>
                </div>

                {/* Product Summary */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3 mb-4">
                    <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-white border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                            {product.title}
                        </h4>
                        <div className="text-sm font-bold text-orange-600 mt-0.5">
                            {product.price}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{product.location}</span>
                        </div>
                    </div>
                </div>

                {/* Seller Info Box */}
                <div className="space-y-3 mb-5">
                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                                SV
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                    <span>Verified Student</span>
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                    {dummyPhone}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCopy}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <a
                            href={`tel:${dummyPhone.replace(/\s+/g, '')}`}
                            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                            <Phone className="w-4 h-4" />
                            <span>Call</span>
                        </a>

                        <a
                            href={`https://zalo.me/${dummyPhone.replace(/\s+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>Chat via Zalo</span>
                        </a>
                    </div>
                </div>

                {/* Safety Tips Footer */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-900 flex items-start gap-2">
                    <span className="text-amber-600 font-bold">💡 Safety Tip:</span>
                    <span>Always meet in person at public campus areas (dorm lobbies, cafeterias) to inspect the item before payment.</span>
                </div>
            </div>
        </div>
    );
};
