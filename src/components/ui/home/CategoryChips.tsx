'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    LayoutGrid,
    BookOpen,
    Laptop,
    Home,
    Shirt,
    Clover,
    PenTool,
    Utensils,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { CATEGORIES } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

// Custom Lucide-styled Lipstick Icon for Beauty & Health
function LipstickIcon({ className = 'w-4 h-4' }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 9V6.2a1.2 1.2 0 0 1 .4-.9l4-3.1a1.2 1.2 0 0 1 1.6.9V9" />
            <rect x="8" y="9" width="8" height="3" rx="0.5" />
            <path d="M7 12h10v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9z" />
            <line x1="7" y1="17" x2="17" y2="17" />
        </svg>
    );
}

interface CategoryChipsProps {
    activeCategory: string;
    onSelectCategory: (id: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
    activeCategory,
    onSelectCategory,
}) => {
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollability = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 6);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        checkScrollability();

        const resizeObserver = new ResizeObserver(() => checkScrollability());
        resizeObserver.observe(el);
        return () => resizeObserver.disconnect();
    }, [checkScrollability, language]);

    const handleScroll = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const scrollAmount = direction === 'left' ? -260 : 260;
        el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    // Render corresponding icon dynamically
    const renderCategoryIcon = (iconName: string, isActive: boolean) => {
        const iconClass = `w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#7A6D63]'}`;
        switch (iconName) {
            case 'BookOpen':
                return <BookOpen className={iconClass} />;
            case 'Laptop':
                return <Laptop className={iconClass} />;
            case 'Home':
                return <Home className={iconClass} />;
            case 'Shirt':
                return <Shirt className={iconClass} />;
            case 'Lipstick':
                return <LipstickIcon className={iconClass} />;
            case 'Clover':
                return <Clover className={iconClass} />;
            case 'PenTool':
                return <PenTool className={iconClass} />;
            case 'Utensils':
                return <Utensils className={iconClass} />;
            case 'LayoutGrid':
            default:
                return <LayoutGrid className={iconClass} />;
        }
    };

    return (
        <div className="relative w-full py-2 group">
            {/* Left Scroll Navigation Button */}
            {canScrollLeft && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center pr-2 bg-gradient-to-r from-white via-white/90 to-transparent h-full">
                    <button
                        type="button"
                        onClick={() => handleScroll('left')}
                        className="w-8 h-8 rounded-full bg-white shadow-md border border-[#EADBCE] text-[#5C4E43] hover:text-[#A8744F] hover:border-[#F5A764]/60 hover:bg-[#FAF7F2] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Scrollable Chips Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScrollability}
                className="w-full flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar scroll-smooth"
            >
                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.id;
                    const localizedName =
                        t.categories[category.id as keyof typeof t.categories] || category.name;

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => onSelectCategory(category.id)}
                            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 xl:px-3.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[12.5px] xl:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-2xs ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#F5A764] to-[#E89650] text-white shadow-md shadow-[#F5A764]/30 border border-[#E89650] scale-[1.01]'
                                    : 'bg-white text-[#5C4E43] border border-[#EADBCE] hover:border-[#F5A764]/70 hover:bg-[#FAF7F2] hover:text-[#2A211B]'
                            }`}
                        >
                            {renderCategoryIcon(category.iconName, isActive)}
                            <span>{localizedName}</span>
                        </button>
                    );
                })}
            </div>

            {/* Right Scroll Navigation Button */}
            {canScrollRight && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center pl-2 bg-gradient-to-l from-white via-white/90 to-transparent h-full">
                    <button
                        type="button"
                        onClick={() => handleScroll('right')}
                        className="w-8 h-8 rounded-full bg-white shadow-md border border-[#EADBCE] text-[#5C4E43] hover:text-[#A8744F] hover:border-[#F5A764]/60 hover:bg-[#FAF7F2] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};
