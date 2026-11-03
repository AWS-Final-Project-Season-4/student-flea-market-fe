'use client';

import React from 'react';
import {
    LayoutGrid,
    BookOpen,
    Laptop,
    Home,
    Shirt,
    Sparkles,
    PenTool,
    Utensils,
} from 'lucide-react';
import { CATEGORIES } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

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

    // Render corresponding icon dynamically
    const renderCategoryIcon = (iconName: string, isActive: boolean) => {
        const iconClass = `w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`;
        switch (iconName) {
            case 'BookOpen':
                return <BookOpen className={iconClass} />;
            case 'Laptop':
                return <Laptop className={iconClass} />;
            case 'Home':
                return <Home className={iconClass} />;
            case 'Shirt':
                return <Shirt className={iconClass} />;
            case 'Sparkles':
                return <Sparkles className={iconClass} />;
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
        <div className="w-full py-3">
            {/* Full-width responsive container spanning the entire content area */}
            <div className="w-full flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.id;
                    const localizedName =
                        t.categories[category.id as keyof typeof t.categories] || category.name;

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => onSelectCategory(category.id)}
                            className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-2xs ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.01]'
                                    : 'bg-white text-slate-700 border border-slate-200/90 hover:border-blue-300 hover:bg-slate-50'
                            }`}
                        >
                            {renderCategoryIcon(category.iconName, isActive)}
                            <span>{localizedName}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
