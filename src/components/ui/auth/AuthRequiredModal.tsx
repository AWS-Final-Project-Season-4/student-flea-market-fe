'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, LogIn, UserPlus, ShieldAlert, MapPin, PlusCircle, TrendingUp, ShoppingCart } from 'lucide-react';
import { ProductItem } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

export type AuthRequiredReason = 'contact' | 'post_item' | 'post_ad' | 'cart';

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: ProductItem | null;
    reason?: AuthRequiredReason;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
    isOpen,
    onClose,
    product,
    reason = 'contact',
}) => {
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Localized titles & descriptions based on trigger reason
    let title: string = t.authRequired.contactTitle;
    let desc: string = t.authRequired.contactDesc;
    let icon = <ShieldAlert className="w-6 h-6 text-[#C46A28]" />;
    const iconBg = 'bg-amber-50 border-amber-200';

    if (reason === 'post_item') {
        title = t.authRequired.postItemTitle;
        desc = t.authRequired.postItemDesc;
        icon = <PlusCircle className="w-6 h-6 text-[#C46A28]" />;
    } else if (reason === 'post_ad') {
        title = t.authRequired.postAdTitle;
        desc = t.authRequired.postAdDesc;
        icon = <TrendingUp className="w-6 h-6 text-amber-600" />;
    } else if (reason === 'cart') {
        title = t.authRequired.cartTitle;
        desc = t.authRequired.cartDesc;
        icon = <ShoppingCart className="w-6 h-6 text-[#C46A28]" />;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-[#EADBCE]">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F3EADF] text-[#8C7E74] hover:text-[#2A211B] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header Icon */}
                <div className={`w-12 h-12 rounded-2xl ${iconBg} border flex items-center justify-center mb-3 shadow-2xs`}>
                    {icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#2A211B] mb-1.5 font-serif">
                    {title}
                </h3>

                {/* Subtitle */}
                <p className="text-[#6D5D52] text-xs sm:text-sm leading-relaxed mb-4 max-w-sm">
                    {desc}
                </p>

                {/* Selected Product Card Preview (if reason is contact and product is available) */}
                {reason === 'contact' && product && (
                    <div className="w-full bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl p-3 flex items-center gap-3 mb-5 text-left shadow-2xs">
                        <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 bg-white border border-[#EADBCE]"
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs sm:text-sm text-[#2A211B] truncate">
                                {product.title}
                            </h4>
                            <div className="text-sm font-bold text-[#C46A28] mt-0.5">
                                {product.price}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[#7A6D63] mt-0.5">
                                <MapPin className="w-3 h-3 text-[#A8744F] shrink-0" />
                                <span className="truncate">{product.location}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-2">
                    <Link
                        href="/login"
                        onClick={onClose}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#F5A764] hover:bg-[#E89650] active:scale-98 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                        <LogIn className="w-4 h-4" />
                        <span>{t.navbar.login}</span>
                    </Link>

                    <Link
                        href="/register"
                        onClick={onClose}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-[#EADBCE] hover:border-[#D5BEA8] hover:bg-[#FAF7F2] text-[#2A211B] font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4 text-[#8C7E74]" />
                        <span>{t.navbar.register}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
