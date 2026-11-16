'use client';

import React, { useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { ProductItem, formatItemCodeDisplay } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

interface ProductCardProps {
    product: ProductItem;
    onContact?: (product: ProductItem) => void;
}

export const formatCardCondition = (cond: string, lang: 'vi' | 'en') => {
    if (lang === 'en') return cond;
    if (cond === 'Like New') return 'Như mới';
    if (cond.includes('New')) return cond.replace('New', 'Mới');
    return cond;
};

export const formatCardLocation = (loc: string, lang: 'vi' | 'en') => {
    if (lang === 'en') return loc;
    if (loc.startsWith('Dorm Area ')) return loc.replace('Dorm Area ', 'KTX Khu ');
    if (loc === 'Main Campus Gate') return 'Cổng trường chính';
    if (loc === 'Campus Library') return 'Thư viện trường';
    if (loc === 'Student Activity Center') return 'Nhà văn hóa SV';
    return loc;
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onContact }) => {
    const [isLiked, setIsLiked] = useState(false);
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];

    return (
        <div className="group bg-white dark:bg-stone-900 rounded-2xl border border-slate-100 dark:border-stone-800 p-2.5 sm:p-3 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">

            {/* Top Media Container */}
            <div>
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-stone-800 mb-3">

                    {/* Product Thumbnail */}
                    <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        loading="lazy"
                    />

                    {/* Floating Condition Badge (Top-Left) */}
                    <div
                        className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white shadow-xs ${
                            product.conditionVariant === 'orange'
                                ? 'bg-orange-500'
                                : 'bg-emerald-500'
                        }`}
                    >
                        {formatCardCondition(product.condition, language)}
                    </div>

                    {/* Floating Favorite Wishlist Heart Button (Top-Right) */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsLiked(!isLiked);
                        }}
                        aria-label="Save to favorite list"
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/85 backdrop-blur-xs hover:bg-white text-slate-500 hover:text-rose-500 shadow-xs transition-colors cursor-pointer"
                    >
                        <Heart
                            className={`w-4 h-4 transition-colors ${
                                isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                            }`}
                        />
                    </button>
                </div>

                {/* Product Details */}
                <div className="space-y-1.5">
                    {/* Title */}
                    <h3
                        title={product.title}
                        className="font-serif font-bold text-sm sm:text-base text-[#2A211B] dark:text-stone-100 line-clamp-1 group-hover:text-[#C46A28] dark:group-hover:text-[#F5A764] transition-colors"
                    >
                        {product.title}
                    </h3>

                    {/* Price and Item Code Badge */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-sm sm:text-base font-extrabold text-orange-600 dark:text-[#F5A764]">
                            {product.price}
                        </div>
                        {product.itemCode && (
                            <span
                                title={`${language === 'vi' ? 'Mã món đồ' : 'Item Code'}: ${formatItemCodeDisplay(product.itemCode)}`}
                                className="font-mono text-[10px] sm:text-[11px] font-bold text-[#A8744F] dark:text-[#F5A764] bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 px-1.5 py-0.5 rounded-md tracking-wider shrink-0"
                            >
                                {formatItemCodeDisplay(product.itemCode)}
                            </span>
                        )}
                    </div>

                    {/* Campus Location */}
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-stone-400 pb-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-stone-500 shrink-0" />
                        <span className="truncate">{formatCardLocation(product.location, language)}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Action Button (Full-width Vibrant Orange) */}
            <div className="mt-2.5">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onContact?.(product);
                    }}
                    className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all text-center cursor-pointer"
                >
                    {t.productCard.contactBtn}
                </button>
            </div>

        </div>
    );
};
