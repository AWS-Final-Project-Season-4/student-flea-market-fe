
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, ShoppingCart } from 'lucide-react';
import { ProductItem, formatItemCodeDisplay } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';
import { useAuthStore } from '@/lib/auth-store';
import { favoritesApi } from '@/lib/favorites-api';
import { useItemInteractionStore } from '@/lib/item-interaction-store';

interface ProductCardProps {
    product: ProductItem;
    onContact?: (product: ProductItem) => void;
    onAddToCart?: (product: ProductItem) => void;
    onAuthRequired?: (product: ProductItem) => void;
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

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onContact,
    onAddToCart,
    onAuthRequired,
}) => {
    const [isTogglingFav, setIsTogglingFav] = useState(false);
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const favEntry = useItemInteractionStore((s) => s.favorites[product.id]);
    const setFavorite = useItemInteractionStore((s) => s.setFavorite);

    const isLiked = favEntry ? favEntry.isFavorited : Boolean(product.isFavorited);
    const favCount = favEntry ? favEntry.favoriteCount : (product.favoriteCount ?? 0);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            onAuthRequired?.(product);
            return;
        }

        if (isTogglingFav) return;
        const optimisticLiked = !isLiked;
        const optimisticCount = Math.max(0, favCount + (optimisticLiked ? 1 : -1));
        setFavorite(product.id, {
            isFavorited: optimisticLiked,
            favoriteCount: optimisticCount,
        });
        setIsTogglingFav(true);

        try {
            const res = await favoritesApi.toggle(product.id);
            setFavorite(product.id, {
                isFavorited: res.isFavorited,
                favoriteCount: res.favoriteCount,
            });
        } catch {
            setFavorite(product.id, {
                isFavorited: isLiked,
                favoriteCount: favCount,
            });
        } finally {
            setIsTogglingFav(false);
        }
    };

    return (
        <div className="group bg-white dark:bg-stone-900 rounded-2xl border border-slate-100 dark:border-stone-800 p-2.5 sm:p-3 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">

            {/* Top Media Container */}
            <div>
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-stone-800 mb-3">

                    {/* Product Thumbnail Link */}
                    <Link
                        href={`/items/${product.id}`}
                        className="block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C46A28]"
                        aria-label={product.title}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                            loading="lazy"
                        />
                    </Link>

                    {/* Floating Condition Badge */}
                    <div
                        className={`pointer-events-none absolute top-2 left-2 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white shadow-xs ${
                            product.conditionVariant === 'orange'
                                ? 'bg-[#855A3C]'
                                : 'bg-emerald-700/95'
                        }`}
                    >
                        {formatCardCondition(product.condition, language)}
                    </div>

                    {/* Favorite Button */}
                    <button
                        type="button"
                        disabled={isTogglingFav}
                        onClick={handleToggleFavorite}
                        aria-pressed={isLiked}
                        aria-label={
                            language === 'vi'
                                ? (isLiked
                                    ? 'Bỏ khỏi danh sách yêu thích'
                                    : 'Lưu vào danh sách yêu thích')
                                : (isLiked
                                    ? 'Remove from favorites'
                                    : 'Save to favorite list')
                        }
                        className="absolute top-1.5 right-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs hover:bg-white dark:hover:bg-stone-900 text-slate-600 dark:text-stone-300 hover:text-rose-500 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                        <Heart
                            aria-hidden="true"
                            className={`w-4 h-4 transition-colors ${
                                isLiked
                                    ? 'fill-rose-500 text-rose-500'
                                    : 'text-slate-600 dark:text-stone-300'
                            }`}
                        />
                    </button>
                </div>

                {/* Product Details */}
                <div className="space-y-1.5">

                    {/* Title */}
                    <Link href={`/items/${product.id}`} className="block">
                        <h3
                            title={product.title}
                            className="font-serif font-bold text-sm sm:text-base text-[#2A211B] dark:text-stone-100 line-clamp-1 group-hover:text-[#7D563A] dark:group-hover:text-[#E5C9A8] transition-colors"
                        >
                            {product.title}
                        </h3>
                    </Link>

                    {/* Price and Item Code */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-sm sm:text-base font-extrabold tabular-nums text-[#7D5435] dark:text-[#E5C9A8]">
                            {product.price}
                        </div>

                        {product.itemCode && (
                            <span
                                title={`${language === 'vi' ? 'Mã món đồ' : 'Item Code'}: ${formatItemCodeDisplay(product.itemCode)}`}
                                className="font-mono text-[10px] sm:text-[11px] font-bold text-[#7D5435] dark:text-[#E5C9A8] bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 px-1.5 py-0.5 rounded-md tracking-wider shrink-0"
                            >
                                {formatItemCodeDisplay(product.itemCode)}
                            </span>
                        )}
                    </div>

                    {/* Campus Location */}
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-[#6D5D52] dark:text-stone-400 pb-1">
                        <MapPin
                            aria-hidden="true"
                            className="w-3.5 h-3.5 text-[#6D5D52] dark:text-stone-400 shrink-0"
                        />
                        <span className="truncate">
                            {formatCardLocation(product.location, language)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="mt-2.5 flex items-center gap-2">

                {/* Contact Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onContact?.(product);
                    }}
                    className="flex-1 min-h-[40px] py-2 px-2 rounded-xl bg-[#F3E8DA] hover:bg-[#E7D6C0] dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-98 text-[#3D2B1F] dark:text-stone-100 border border-[#DEC9B0] dark:border-stone-600 font-semibold text-xs sm:text-sm shadow-2xs transition-all text-center cursor-pointer"
                >
                    {t.productCard.contactBtn}
                </button>

                {/* Add to Cart Button */}
                {onAddToCart && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAddToCart(product);
                        }}
                        title={
                            language === 'vi'
                                ? 'Thêm vào giỏ hàng'
                                : 'Add to cart'
                        }
                        aria-label={
                            language === 'vi'
                                ? 'Thêm vào giỏ hàng'
                                : 'Add to cart'
                        }
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-[#DFC9AE] hover:bg-[#D2B796] dark:bg-stone-800 dark:hover:bg-stone-700 text-[#3D2B1F] dark:text-stone-100 border border-[#CEB290] dark:border-stone-600 transition-all active:scale-95 cursor-pointer"
                    >
                        <ShoppingCart
                            aria-hidden="true"
                            className="w-4 h-4"
                        />
                    </button>
                )}
            </div>
        </div>
    );
};
