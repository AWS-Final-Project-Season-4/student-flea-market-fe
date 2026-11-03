'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, LogIn, UserPlus, ShieldAlert, MapPin, PlusCircle, TrendingUp } from 'lucide-react';
import { ProductItem } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

export type AuthRequiredReason = 'contact' | 'post_item' | 'post_ad';

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
    let icon = <ShieldAlert className="w-6 h-6 text-blue-600" />;
    let iconBg = 'bg-blue-50 border-blue-100';

    if (reason === 'post_item') {
        title = t.authRequired.postItemTitle;
        desc = t.authRequired.postItemDesc;
        icon = <PlusCircle className="w-6 h-6 text-blue-600" />;
    } else if (reason === 'post_ad') {
        title = t.authRequired.postAdTitle;
        desc = t.authRequired.postAdDesc;
        icon = <TrendingUp className="w-6 h-6 text-amber-600" />;
        iconBg = 'bg-amber-50 border-amber-200';
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
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-slate-100">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header Icon */}
                <div className={`w-12 h-12 rounded-2xl ${iconBg} border flex items-center justify-center mb-3`}>
                    {icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                    {title}
                </h3>

                {/* Subtitle */}
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 max-w-sm">
                    {desc}
                </p>

                {/* Selected Product Card Preview (if reason is contact and product is available) */}
                {reason === 'contact' && product && (
                    <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3 mb-5 text-left">
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
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-2">
                    <Link
                        href="/login"
                        onClick={onClose}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
                    >
                        <LogIn className="w-4 h-4" />
                        <span>{t.navbar.login}</span>
                    </Link>

                    <Link
                        href="/register"
                        onClick={onClose}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                    >
                        <UserPlus className="w-4 h-4 text-slate-500" />
                        <span>{t.navbar.register}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
