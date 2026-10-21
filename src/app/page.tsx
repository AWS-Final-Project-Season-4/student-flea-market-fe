'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/ui/layout/Navbar';
import { HeroBanner } from '@/components/ui/home/HeroBanner';
import { CategoryChips } from '@/components/ui/home/CategoryChips';
import { ProductCard } from '@/components/ui/home/ProductCard';
import { MOCK_PRODUCTS } from '@/data/mock-items';
import { Sparkles, ArrowRight } from 'lucide-react';


export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return MOCK_PRODUCTS;
    }
    return MOCK_PRODUCTS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-700">

      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 2. Hero Banner */}
        <HeroBanner />

        {/* 3. Category Filter Chips */}
        <CategoryChips
          activeCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* 4. Products Grid Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Newly posted seller items
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {filteredProducts.length} items
            </span>
          </div>

          <button
            type="button"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 5. Responsive Product Grid (2 cols mobile, 3-4 cols tablet, 6 cols desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Empty state when filter has no items */}
        {filteredProducts.length === 0 && (
          <div className="w-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 font-medium">
              No items found in this category. Be the first to post!
            </p>
          </div>
        )}

      </main>

      {/* Modern Compact Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Student Flea Market. A platform for students to exchange second-hand items.</p>
          <div className="flex items-center gap-6 font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Operating regulations</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Safety policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Student support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

