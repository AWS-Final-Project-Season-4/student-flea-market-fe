///////////////////////////////////////////////////////////
//                                                       //
//               HOME / STOREFRONT PAGE                  //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/layout/Navbar';
import { HeroBanner } from '@/components/ui/home/HeroBanner';
import { CategoryChips } from '@/components/ui/home/CategoryChips';
import { ProductCard } from '@/components/ui/home/ProductCard';
import { ProductItem } from '@/data/mock-items';
import { ArrowRight, Search, Plus } from 'lucide-react';
import { AuthPromptModal } from '@/components/ui/auth/AuthPromptModal';
import { AuthRequiredModal } from '@/components/ui/auth/AuthRequiredModal';
import { SellerContactModal } from '@/components/ui/home/SellerContactModal';
import { PostItemModal } from '@/components/ui/home/PostItemModal';
import { AdPromotionModal } from '@/components/ui/home/AdPromotionModal';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';
import { itemsApi } from '@/lib/items-api';
import { ItemDetailDto, ItemSearchQuery, ItemSummaryDto } from '@/types/item';

function mapItemSummaryToProduct(item: ItemSummaryDto): ProductItem {
  return {
    id: item.id,
    itemCode: item.itemCode,
    title: item.title,
    price: item.price === 0 ? '0 VND (Free)' : `${item.price.toLocaleString('vi-VN')} VND`,
    condition: item.conditionName || (item.condition <= 2 ? 'Like New' : 'Good'),
    conditionVariant: item.condition <= 2 ? 'emerald' : 'orange',
    location: item.location,
    imageUrl:
      item.primaryImageUrl ||
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    category: item.categorySlug,
  };
}

function mapDetailToProduct(item: ItemDetailDto): ProductItem {
  return {
    id: item.id,
    itemCode: item.itemCode,
    title: item.title,
    price: item.price === 0 ? '0 VND (Free)' : `${item.price.toLocaleString('vi-VN')} VND`,
    condition: item.conditionName || (item.condition <= 2 ? 'Like New' : 'Good'),
    conditionVariant: item.condition <= 2 ? 'emerald' : 'orange',
    location: item.location,
    imageUrl:
      (item.images && item.images.length > 0 ? item.images[0].imageUrl : null) ||
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    category: item.category?.slug || 'other',
  };
}

function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const { language } = useLanguageStore();
  const t = DICTIONARY[language];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [isSellerContactOpen, setIsSellerContactOpen] = useState(false);
  const [isPostItemOpen, setIsPostItemOpen] = useState(false);
  const [isPostAdOpen, setIsPostAdOpen] = useState(false);

  // Live Backend items state (No mock data fallback)
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Fetch real items from Backend API
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingItems(true);

    const query: ItemSearchQuery = {
      keyword: searchQuery.trim() || undefined,
      categorySlug: selectedCategory !== 'all' ? selectedCategory : undefined,
      page: 1,
      pageSize: 50,
    };

    itemsApi
      .searchItems(query)
      .then((res) => {
        if (!isCancelled) {
          if (res && Array.isArray(res.items)) {
            const mapped = res.items.map(mapItemSummaryToProduct);
            setProducts(mapped);
          } else {
            setProducts([]);
          }
          setIsLoadingItems(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Backend API searchItems error:', err);
          setProducts([]);
          setIsLoadingItems(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, searchQuery]);

  // Handle newly created item posted from PostItemModal
  const handleItemCreated = (newItem: ItemDetailDto) => {
    const product = mapDetailToProduct(newItem);
    setProducts((prev) => [product, ...prev]);
  };

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
    <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col selection:bg-amber-100 selection:text-amber-800">

      {/* 1. Global Navigation Bar */}
      <Navbar onPostAdClick={() => setIsPostAdOpen(true)} />

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

      {/* Post an Item Modal (Hoàn toàn MIỄN PHÍ cho sinh viên) */}
      <PostItemModal
        isOpen={isPostItemOpen}
        onClose={() => setIsPostItemOpen(false)}
        onItemCreated={handleItemCreated}
      />

      {/* Post Ad Modal (Dịch vụ Đẩy tin bán gấp - TÍNH PHÍ 5k, 15k, 25k) */}
      <AdPromotionModal
        isOpen={isPostAdOpen}
        onClose={() => setIsPostAdOpen(false)}
        userItems={products}
        onOpenPostItem={() => {
          setIsPostAdOpen(false);
          setIsPostItemOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 2. Hero Banner */}
        <HeroBanner onPostItemClick={() => setIsPostItemOpen(true)} />

        {/* 3. Category Filter Chips */}
        <CategoryChips
          activeCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Search Results Notice Banner if search query is active */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE] text-[#2A211B] shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F5A764] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium">
                  {t.home.searchingFor} <span className="font-bold text-[#2A211B]">"{searchQuery}"</span>
                </p>
                <p className="text-[11px] text-[#7A6D63]">
                  {products.length} {t.home.matchingFound}
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-[#8C532B] hover:text-[#6D3D1E] bg-white hover:bg-amber-50/50 border border-[#EADBCE] px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              {t.home.clearFilter}
            </Link>
          </div>
        )}

        {/* 4. Products Grid Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2A211B] tracking-tight">
              {searchQuery.trim() ? t.home.searchResultsTitle : t.home.recentTitle}
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#8C532B] border border-[#EADBCE]">
              {products.length} {t.home.itemsCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Post Button */}
            <button
              type="button"
              onClick={() => setIsPostItemOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#A85A24] border border-amber-200 text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C46A28]" />
              <span>{language === 'vi' ? 'Đăng món đồ mới' : 'Post New Item'}</span>
            </button>

            <button
              type="button"
              className="text-xs font-semibold text-[#A8744F] hover:text-[#7A4924] flex items-center gap-1 group cursor-pointer"
            >
              <span>{t.home.seeAll}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 5. Responsive Product Grid (2 cols mobile, 3-4 cols tablet, 6 cols desktop) */}
        {isLoadingItems ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 p-3 shadow-2xs animate-pulse flex flex-col justify-between h-64"
              >
                <div className="w-full aspect-square rounded-xl bg-slate-100 mb-3" />
                <div className="space-y-2">
                  <div className="w-3/4 h-3 rounded-md bg-slate-200" />
                  <div className="w-1/2 h-3 rounded-md bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onContact={handleContactExchange}
              />
            ))}
          </div>
        )}

        {/* Empty state when filter or search has no items */}
        {!isLoadingItems && products.length === 0 && (
          <div className="w-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center">
            <p className="text-sm text-slate-700 font-semibold mb-1">
              {t.home.emptyTitle}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              {t.home.emptySubtitle}
            </p>
            <button
              type="button"
              onClick={() => setIsPostItemOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'vi' ? 'Đăng món đồ đầu tiên' : 'Post First Item'}</span>
            </button>
          </div>
        )}

      </main>

      {/* Modern Compact Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <BrandLogo variant="compact" size="sm" />
            <span className="hidden sm:inline text-slate-300">|</span>
            <p>© 2026 Student Flea Market. {t.home.footerDesc}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-slate-600">
            <Link href="/policies/term-of-service" className="hover:text-blue-600 transition-colors">
              {t.home.termsOfService}
            </Link>
            <Link href="/policies/privacy-policy" className="hover:text-blue-600 transition-colors">
              {t.home.privacyPolicy}
            </Link>
            <Link href="/policies/refund-dispute" className="hover:text-blue-600 transition-colors">
              {t.home.refundDispute}
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50/60" />}>
      <HomeContent />
    </Suspense>
  );
}
