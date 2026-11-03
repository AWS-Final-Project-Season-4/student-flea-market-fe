'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap, Flame, Crown, QrCode, CheckCircle2, ArrowRight } from 'lucide-react';
import { MOCK_PRODUCTS } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

interface AdPromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdPromotionModal: React.FC<AdPromotionModalProps> = ({ isOpen, onClose }) => {
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];

    const [selectedItemIndex, setSelectedItemIndex] = useState(0);
    const [selectedPackage, setSelectedPackage] = useState<'pkg1' | 'pkg2' | 'pkg3'>('pkg1');
    const [step, setStep] = useState<'choose' | 'pay' | 'success'>('choose');

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

    const myItems = MOCK_PRODUCTS.slice(0, 3);
    const currentPkgPrice =
        selectedPackage === 'pkg1'
            ? t.adPromotionModal.pkg1Price
            : selectedPackage === 'pkg2'
            ? t.adPromotionModal.pkg2Price
            : t.adPromotionModal.pkg3Price;

    const handleActivate = () => {
        setStep('success');
        setTimeout(() => {
            setStep('choose');
            onClose();
        }, 2500);
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
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {step === 'success' ? (
                    <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-9 h-9" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {language === 'vi' ? 'Đã kích hoạt quảng cáo!' : 'Boost Activated!'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
                            {t.adPromotionModal.successToast}
                        </p>
                    </div>
                ) : step === 'pay' ? (
                    <div className="py-2 text-center animate-in fade-in duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                            <QrCode className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">
                            {t.adPromotionModal.momoVnpay}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">
                            {language === 'vi' ? `Thanh toán phí dịch vụ: ${currentPkgPrice}` : `Total service fee: ${currentPkgPrice}`}
                        </p>

                        {/* Simulated QR Box */}
                        <div className="w-48 h-48 mx-auto p-3 bg-white border-2 border-dashed border-amber-400 rounded-2xl flex flex-col items-center justify-center shadow-xs">
                            <div className="w-full h-full bg-slate-100 rounded-xl flex flex-col items-center justify-center p-3 text-slate-500">
                                <QrCode className="w-16 h-16 text-slate-700 mb-2" />
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                    MoMo / VNPay QR
                                </span>
                                <span className="text-[10px] text-slate-500">{currentPkgPrice}</span>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-3 mb-5">
                            {language === 'vi' ? 'Quét mã bằng app ngân hàng hoặc ví MoMo để kích hoạt tức thì.' : 'Scan via Banking app or MoMo wallet to activate instantly.'}
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setStep('choose')}
                                className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
                            >
                                {language === 'vi' ? 'Quay lại' : 'Back'}
                            </button>
                            <button
                                type="button"
                                onClick={handleActivate}
                                className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                            >
                                {language === 'vi' ? 'Xác nhận đã chuyển khoản' : 'Confirm & Activate'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="mb-5">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-2">
                                <span>{language === 'vi' ? 'Dịch vụ Đẩy tin & Quảng cáo' : 'Advertisement & Boost'}</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                {t.adPromotionModal.title}
                            </h3>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                {t.adPromotionModal.subtitle}
                            </p>
                        </div>

                        {/* Step 1: Select Item to Boost */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                                {t.adPromotionModal.selectItem}
                            </label>
                            <div className="space-y-2">
                                {myItems.map((item, idx) => {
                                    const isSelected = selectedItemIndex === idx;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedItemIndex(idx)}
                                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isSelected
                                                    ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-xs font-bold text-orange-600">
                                                        {item.price}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 2: Choose Boost Package */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                                {t.adPromotionModal.choosePackage}
                            </label>
                            <div className="grid grid-cols-1 gap-2.5">
                                {/* Pkg 1: 24h Urgent */}
                                <div
                                    onClick={() => setSelectedPackage('pkg1')}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        selectedPackage === 'pkg1'
                                            ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                            <Zap className="w-4.5 h-4.5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                                    {t.adPromotionModal.pkg1Title}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">
                                                    ⚡ BÁN GẤP
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {t.adPromotionModal.pkg1Desc}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-extrabold text-orange-600 shrink-0 ml-2">
                                        {t.adPromotionModal.pkg1Price}
                                    </span>
                                </div>

                                {/* Pkg 2: 3-Day Trending */}
                                <div
                                    onClick={() => setSelectedPackage('pkg2')}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        selectedPackage === 'pkg2'
                                            ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                            <Flame className="w-4.5 h-4.5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                                    {t.adPromotionModal.pkg2Title}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                                                    🔥 HOT DEAL
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {t.adPromotionModal.pkg2Desc}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-extrabold text-orange-600 shrink-0 ml-2">
                                        {t.adPromotionModal.pkg2Price}
                                    </span>
                                </div>

                                {/* Pkg 3: 7-Day VIP */}
                                <div
                                    onClick={() => setSelectedPackage('pkg3')}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        selectedPackage === 'pkg3'
                                            ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                            <Crown className="w-4.5 h-4.5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                                    {t.adPromotionModal.pkg3Title}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                                                    💎 VIP
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {t.adPromotionModal.pkg3Desc}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-extrabold text-orange-600 shrink-0 ml-2">
                                        {t.adPromotionModal.pkg3Price}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
                            >
                                {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('pay')}
                                className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>{t.adPromotionModal.activateBtn}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

