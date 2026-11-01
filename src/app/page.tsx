///////////////////////////////////////////////////////////
//                                                       //
//               HOME / STOREFRONT PAGE                  //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/layout/Navbar';
import { HeroBanner } from '@/components/ui/home/HeroBanner';
import { CategoryChips } from '@/components/ui/home/CategoryChips';
import { ProductCard } from '@/components/ui/home/ProductCard';
import { MOCK_PRODUCTS, ProductItem } from '@/data/mock-items';
import { Sparkles, ArrowRight } from 'lucide-react';
import { AuthPromptModal } from '@/components/ui/auth/AuthPromptModal';
import { AuthRequiredModal } from '@/components/ui/auth/AuthRequiredModal';
import { SellerContactModal } from '@/components/ui/home/SellerContactModal';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuthStore } from '@/lib/auth-store';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [isSellerContactOpen, setIsSellerContactOpen] = useState(false);

  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return MOCK_PRODUCTS;
    }
    return MOCK_PRODUCTS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  // Handle click on Contact / Exchange button
  const handleContactExchange = (product: ProductItem) => {
    setSelectedProduct(product);
    if (!isAuthenticated) {
      setIsAuthRequiredOpen(true);
    } else {
      setIsSellerContactOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-700">

      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* Welcome Auth Prompt Modal for guests upon first visit */}
      <AuthPromptModal />

      {/* Modal requiring login when guest clicks Contact / Exchange */}
      <AuthRequiredModal
        isOpen={isAuthRequiredOpen}
        onClose={() => setIsAuthRequiredOpen(false)}
        product={selectedProduct}
      />

      {/* Seller Contact Modal when authenticated user clicks Contact / Exchange */}
      <SellerContactModal
        isOpen={isSellerContactOpen}
        onClose={() => setIsSellerContactOpen(false)}
        product={selectedProduct}
      />

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
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 5. Responsive Product Grid (2 cols mobile, 3-4 cols tablet, 6 cols desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onContact={handleContactExchange}
            />
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
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <BrandLogo variant="compact" size="sm" />
            <span className="hidden sm:inline text-slate-300">|</span>
            <p>© 2026 Student Flea Market. A platform for students to exchange second-hand items.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-slate-600">
            <Link href="/policies/term-of-service" className="hover:text-blue-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/policies/privacy-policy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/policies/refund-dispute" className="hover:text-blue-600 transition-colors">
              Refund & Dispute
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
