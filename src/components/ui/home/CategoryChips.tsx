'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    LayoutGrid,
    BookOpen,
    Laptop,
    Home,
    Shirt,
    Clover,
    PenTool,
    Utensils,
    Wrench,
    Dumbbell,
    Music,
    ChevronDown,
    Check,
} from 'lucide-react';
import { CATEGORIES, CategoryItem } from '@/data/mock-items';
import { itemsApi } from '@/lib/items-api';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

const MAX_INLINE_CHIPS = 7; // 'All' + top 6 primary categories; rest go into 'More' dropdown

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

function resolveCategoryIconBySlug(slug: string): CategoryItem['iconName'] {
    const s = slug.toLowerCase();
    if (s.includes('book') || s.includes('sach')) return 'BookOpen';
    if (s.includes('elec') || s.includes('dien-tu') || s.includes('tech')) return 'Laptop';
    if (s.includes('dorm') || s.includes('home') || s.includes('gia-dung')) return 'Home';
    if (s.includes('fashion') || s.includes('thoi-trang')) return 'Shirt';
    if (s.includes('the-thao') || s.includes('sport') || s.includes('suc-khoe')) return 'Dumbbell';
    if (s.includes('beauty') || s.includes('health') || s.includes('sac-dep')) return 'Lipstick';
    if (s.includes('stationery') || s.includes('study') || s.includes('dung-cu') || s.includes('tai-lieu') || s.includes('giao-duc')) return 'PenTool';
    if (s.includes('food') || s.includes('drink') || s.includes('an-uong')) return 'Utensils';
    if (s.includes('phu-kien-xe') || s.includes('phu-kien') || s.includes('xe-co') || s.includes('vehicle')) return 'Wrench';
    if (s.includes('nhac-cu') || s.includes('music')) return 'Music';
    return 'Clover';
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
    const moreDropdownRef = useRef<HTMLDivElement>(null);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [chipList, setChipList] = useState<CategoryItem[]>(() => [CATEGORIES[0]]);

    useEffect(() => {
        let active = true;
        itemsApi
            .getCategories()
            .then((backendCats) => {
                if (!active || !Array.isArray(backendCats)) return;
                const mapped: CategoryItem[] = backendCats.map((c) => ({
                    id: c.slug,
                    name: c.name,
                    iconName: resolveCategoryIconBySlug(c.slug),
                }));
                setChipList([{ id: 'all', name: 'All', iconName: 'LayoutGrid' }, ...mapped]);
            })
            .catch(() => {
                // Keep at least 'All' chip if backend is temporarily unreachable
                if (active) setChipList([CATEGORIES[0]]);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!isMoreOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
                setIsMoreOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMoreOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMoreOpen]);

    const getLocalizedName = (category: CategoryItem) =>
        t.categories[category.id as keyof typeof t.categories] || category.name;

    // Render corresponding icon dynamically
    const renderCategoryIcon = (iconName: string, isActive: boolean) => {
        const iconClass = `w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-[#4A3525] dark:text-stone-100' : 'text-[#7A6D63] dark:text-stone-400'}`;
        switch (iconName) {
            case 'BookOpen':
                return <BookOpen aria-hidden="true" className={iconClass} />;
            case 'Laptop':
                return <Laptop aria-hidden="true" className={iconClass} />;
            case 'Home':
                return <Home aria-hidden="true" className={iconClass} />;
            case 'Shirt':
                return <Shirt aria-hidden="true" className={iconClass} />;
            case 'Lipstick':
                return <LipstickIcon className={iconClass} />;
            case 'Clover':
                return <Clover aria-hidden="true" className={iconClass} />;
            case 'PenTool':
                return <PenTool aria-hidden="true" className={iconClass} />;
            case 'Utensils':
                return <Utensils aria-hidden="true" className={iconClass} />;
            case 'Wrench':
                return <Wrench aria-hidden="true" className={iconClass} />;
            case 'Dumbbell':
                return <Dumbbell aria-hidden="true" className={iconClass} />;
            case 'Music':
                return <Music aria-hidden="true" className={iconClass} />;
            case 'LayoutGrid':
            default:
                return <LayoutGrid aria-hidden="true" className={iconClass} />;
        }
    };

    const inlineChips = chipList.slice(0, MAX_INLINE_CHIPS);
    const overflowChips = chipList.slice(MAX_INLINE_CHIPS);
    const activeOverflowChip = overflowChips.find((c) => c.id === activeCategory);
    const isMoreActive = Boolean(activeOverflowChip);

    return (
        <div className="relative w-full py-2 flex items-center gap-1.5 sm:gap-2">
            {/* Primary Inline Chips (Horizontally scrollable on narrow screens, single balanced row on desktop) */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto xl:overflow-visible py-0.5 scrollbar-none no-scrollbar scroll-smooth">
                {inlineChips.map((category) => {
                    const isActive = activeCategory === category.id;
                    const localizedName = getLocalizedName(category);

                    return (
                        <button
                            key={category.id}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => {
                                setIsMoreOpen(false);
                                onSelectCategory(category.id);
                            }}
                            className={`xl:flex-1 min-w-fit min-h-[40px] flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-full text-xs sm:text-[12.5px] xl:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-2xs shrink-0 ${
                                isActive
                                    ? 'bg-[#E8D7C3] dark:bg-stone-700 text-[#2A211B] dark:text-stone-100 shadow-xs border border-[#CBB092] dark:border-stone-500 scale-[1.01]'
                                    : 'bg-white dark:bg-stone-900 text-[#5C4E43] dark:text-stone-200 border border-[#EADBCE] dark:border-stone-800 hover:border-[#D4BDA4] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 hover:text-[#2A211B] dark:hover:text-stone-100'
                            }`}
                        >
                            {renderCategoryIcon(category.iconName, isActive)}
                            <span>{localizedName}</span>
                        </button>
                    );
                })}
            </div>

            {/* Overflow Categories Dropdown ('Xem thêm' / 'More') positioned OUTSIDE scroll container */}
            {overflowChips.length > 0 && (
                <div ref={moreDropdownRef} className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsMoreOpen((prev) => !prev)}
                        aria-expanded={isMoreOpen}
                        aria-haspopup="menu"
                        aria-label={language === 'vi' ? 'Danh mục khác' : 'More categories'}
                        className={`min-h-[40px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-[12.5px] xl:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-2xs ${
                            isMoreActive
                                ? 'bg-[#E8D7C3] dark:bg-stone-700 text-[#2A211B] dark:text-stone-100 shadow-xs border border-[#CBB092] dark:border-stone-500'
                                : 'bg-white dark:bg-stone-900 text-[#5C4E43] dark:text-stone-200 border border-[#EADBCE] dark:border-stone-800 hover:border-[#D4BDA4] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 hover:text-[#2A211B] dark:hover:text-stone-100'
                        }`}
                    >
                        {activeOverflowChip ? (
                            <>
                                {renderCategoryIcon(activeOverflowChip.iconName, true)}
                                <span>{getLocalizedName(activeOverflowChip)}</span>
                            </>
                        ) : (
                            <span>{language === 'vi' ? 'Xem thêm' : 'More'}</span>
                        )}
                        <ChevronDown
                            aria-hidden="true"
                            className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                isMoreOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {isMoreOpen && (
                        <div
                            role="menu"
                            aria-label={language === 'vi' ? 'Các danh mục còn lại' : 'Additional categories'}
                            className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 shadow-xl dark:shadow-black/50 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                        >
                            {overflowChips.map((category) => {
                                const isActive = activeCategory === category.id;
                                const localizedName = getLocalizedName(category);

                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={isActive}
                                        onClick={() => {
                                            onSelectCategory(category.id);
                                            setIsMoreOpen(false);
                                        }}
                                        className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-left text-xs sm:text-[13px] flex items-center justify-between gap-2.5 transition cursor-pointer ${
                                            isActive
                                                ? 'bg-[#F5ECE0] dark:bg-stone-800 text-[#2A211B] dark:text-[#F5A764] font-bold'
                                                : 'text-[#4E3F33] dark:text-stone-200 hover:bg-[#FAF7F2] dark:hover:bg-stone-800/70 font-medium'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2.5 min-w-0">
                                            {renderCategoryIcon(category.iconName, isActive)}
                                            <span className="truncate">{localizedName}</span>
                                        </span>
                                        {isActive && (
                                            <Check aria-hidden="true" className="w-4 h-4 text-[#9A5828] dark:text-[#F5A764] shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
