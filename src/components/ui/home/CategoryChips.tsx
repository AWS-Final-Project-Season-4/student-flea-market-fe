'use client';

import React from 'react';
import {
    BookOpen,
    Laptop,
    Cpu,
    PenTool,
    Shirt,
    Grid,
    ChevronRight
} from 'lucide-react';
import { CATEGORIES } from '@/data/mock-items';

interface CategoryChipsProps {
    activeCategory: string;
    onSelectCategory: (id: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
    activeCategory,
    onSelectCategory,
}) => {
    // Render corresponding icon dynamically
    const renderCategoryIcon = (iconName: string, isActive: boolean) => {
        const iconClass = `w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`;
        switch (iconName) {
            case 'BookOpen':
                return <BookOpen className={iconClass} />;
            case 'Laptop':
                return <Laptop className={iconClass} />;
            case 'Cpu':
                return <Cpu className={iconClass} />;
            case 'PenTool':
                return <PenTool className={iconClass} />;
            case 'Shirt':
                return <Shirt className={iconClass} />;
            case 'Grid':
            default:
                return <Grid className={iconClass} />;
        }
    };

    return (
        <div className="w-full py-4">
            {/* Scrollable Container with Hidden Scrollbars */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.id;
                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => onSelectCategory(category.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 shadow-2xs ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                                    : 'bg-white text-slate-700 border border-slate-200/90 hover:border-blue-300 hover:bg-slate-50'
                                }`}
                        >
                            {renderCategoryIcon(category.iconName, isActive)}
                            <span>{category.name}</span>
                            {isActive && category.id === 'all' && (
                                <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
