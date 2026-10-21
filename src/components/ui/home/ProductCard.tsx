'use client';

import React, { useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { ProductItem } from '@/data/mock-items';

interface ProductCardProps {
    product: ProductItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const [isLiked, setIsLiked] = useState(false);

    return (
        <div className="group bg-white rounded-2xl border border-slate-100 p-2.5 sm:p-3 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">

            {/* Top Media Container */}
            <div>
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">

                    {/* Product Thumbnail */}
                    <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        loading="lazy"
                    />

                    {/* Floating Condition Badge (Top-Left) */}
                    <div
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold text-white shadow-xs ${product.conditionVariant === 'orange'
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                            }`}
                    >
                        {product.condition}
                    </div>

                    {/* Floating Favorite Wishlist Heart Button (Top-Right) */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsLiked(!isLiked);
                        }}
                        aria-label="Save to favorite list"
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/85 backdrop-blur-xs hover:bg-white text-slate-500 hover:text-rose-500 shadow-xs transition-colors"
                    >
                        <Heart
                            className={`w-4 h-4 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                                }`}
                        />
                    </button>
                </div>

                {/* Product Details */}
                <div className="space-y-1">
                    {/* Title */}
                    <h3
                        title={product.title}
                        className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors"
                    >
                        {product.title}
                    </h3>

                    {/* Price */}
                    <div className="text-sm sm:text-base font-extrabold text-orange-600">
                        {product.price}
                    </div>

                    {/* Campus Location */}
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 pb-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{product.location}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Action Button (Full-width Vibrant Orange) */}
            <div className="mt-2.5">
                <button
                    type="button"
                    className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all text-center"
                >
                    Contact / Exchange
                </button>
            </div>

        </div>
    );
};
