'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, DollarSign, MapPin, Tag, FileText } from 'lucide-react';
import { CATEGORIES } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

interface PostItemModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PostItemModal: React.FC<PostItemModalProps> = ({ isOpen, onClose }) => {
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];

    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('books');
    const [price, setPrice] = useState('50000');
    const [isFree, setIsFree] = useState(false);
    const [condition, setCondition] = useState('99% New');
    const [location, setLocation] = useState('KTX Khu A');
    const [description, setDescription] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            onClose();
        }, 2000);
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

                {isSubmitted ? (
                    <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-9 h-9" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {language === 'vi' ? 'Đăng tin thành công!' : 'Item Listed Successfully!'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
                            {t.postItemModal.successToast}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="mb-6">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-2">
                                <span>{language === 'vi' ? 'Miễn phí cho sinh viên' : 'Free for Students'}</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                {t.postItemModal.title}
                            </h3>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                {t.postItemModal.subtitle}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    {t.postItemModal.itemName} *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t.postItemModal.itemNamePlaceholder}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                                />
                            </div>

                            {/* Category & Condition Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        {t.postItemModal.category}
                                    </label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition cursor-pointer"
                                    >
                                        {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {t.categories[c.id as keyof typeof t.categories] || c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        {t.postItemModal.condition}
                                    </label>
                                    <select
                                        value={condition}
                                        onChange={(e) => setCondition(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition cursor-pointer"
                                    >
                                        <option value="99% New">{language === 'vi' ? 'Mới 99% (Như mới)' : '99% New (Like New)'}</option>
                                        <option value="90% Good">{language === 'vi' ? 'Còn tốt 90%' : '90% Good Condition'}</option>
                                        <option value="Fair">{language === 'vi' ? 'Đã dùng bình thường' : 'Fair (Working well)'}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Price & Giveaway */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-700">
                                        {t.postItemModal.price} *
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isFree}
                                            onChange={(e) => {
                                                setIsFree(e.target.checked);
                                                if (e.target.checked) setPrice('0');
                                            }}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                                        />
                                        <span>{t.postItemModal.freeGift}</span>
                                    </label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                                        ₫
                                    </div>
                                    <input
                                        type="number"
                                        disabled={isFree}
                                        required
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="50000"
                                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition disabled:opacity-60 disabled:bg-slate-100"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    {t.postItemModal.location} *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder={t.postItemModal.locationPlaceholder}
                                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    {t.postItemModal.description}
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t.postItemModal.descPlaceholder}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
                                >
                                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="w-2/3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                                >
                                    {t.postItemModal.submitBtn}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

