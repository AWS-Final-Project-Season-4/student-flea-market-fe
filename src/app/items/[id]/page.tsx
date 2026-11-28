'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  Minus,
  Palette,
  Plus,
  Repeat,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  X,
} from 'lucide-react';
import { Navbar } from '@/components/ui/layout/Navbar';
import { AuthRequiredModal, AuthRequiredReason } from '@/components/ui/auth/AuthRequiredModal';
import { SellerContactModal } from '@/components/ui/home/SellerContactModal';
import { itemsApi } from '@/lib/items-api';
import { favoritesApi } from '@/lib/favorites-api';
import { transactionsApi } from '@/lib/transactions-api';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { useLanguageStore } from '@/lib/language-store';
import { useItemInteractionStore } from '@/lib/item-interaction-store';
import { formatItemCodeDisplay, ProductItem } from '@/data/mock-items';
import type { ItemDetailDto } from '@/types/item';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80';

function mapDetailToProduct(item: ItemDetailDto): ProductItem {
  return {
    id: item.id,
    itemCode: item.itemCode,
    title: item.title,
    price: item.price === 0 ? '0 VND (Free)' : `${item.price.toLocaleString('vi-VN')} VND`,
    condition: item.conditionName || (item.condition <= 2 ? 'Like New' : 'Good'),
    conditionVariant: item.condition <= 2 ? 'emerald' : 'orange',
    location: item.location,
    imageUrl: item.images?.[0]?.imageUrl || FALLBACK_IMAGE,
    category: item.category?.slug || 'other',
    color: item.color,
    quantity: item.quantity,
    favoriteCount: item.favoriteCount,
    isFavorited: item.isFavorited,
  };
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const itemId = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();

  const { language } = useLanguageStore();
  const isVi = language === 'vi';
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const addToCart = useCartStore((s) => s.addToCart);

  const favEntry = useItemInteractionStore((s) => (itemId ? s.favorites[itemId] : undefined));
  const setFavorite = useItemInteractionStore((s) => s.setFavorite);

  const [item, setItem] = useState<ItemDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [authReason, setAuthReason] = useState<AuthRequiredReason>('contact');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<1 | 2>(1);
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;

    itemsApi
      .getItemById(itemId)
      .then((data) => {
        if (cancelled) return;
        setItem(data);
        setSelectedImageIdx(0);
        setQuantity(1);
        setFetchError(null);
        useItemInteractionStore.getState().setFavorite(data.id, {
          isFavorited: data.isFavorited,
          favoriteCount: data.favoriteCount,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchError(
          err instanceof Error
            ? err.message
            : isVi
              ? 'Không thể tải thông tin sản phẩm.'
              : 'Failed to load product details.'
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, isVi]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const images = useMemo(() => {
    if (!item?.images || item.images.length === 0) {
      return [{ id: 'fallback', imageUrl: FALLBACK_IMAGE, isPrimary: true, order: 0 }];
    }
    return [...item.images].sort(
      (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order
    );
  }, [item]);

  const activeImage = images[selectedImageIdx] ?? images[0];
  const maxStock = Math.max(0, item?.quantity ?? 1);
  const isSoldOrUnavailable = !item || item.status !== 1 || maxStock <= 0;
  const isOwner = Boolean(user && item && user.id === item.seller.id);

  const isLiked = favEntry ? favEntry.isFavorited : Boolean(item?.isFavorited);
  const favCount = favEntry ? favEntry.favoriteCount : (item?.favoriteCount ?? 0);

  const fixedLocation = item?.location || '';
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fixedLocation)}`;

  const productForModals = useMemo(() => (item ? mapDetailToProduct(item) : null), [item]);

  const showNotice = (msg: string) => {
    setToastMessage(msg);
  };

  const requireAuth = (reason: AuthRequiredReason): boolean => {
    if (isAuthenticated && user) return true;
    setAuthReason(reason);
    setIsAuthRequiredOpen(true);
    return false;
  };

  const handleToggleFavorite = async () => {
    if (!item) return;
    if (!requireAuth('contact')) return;
    if (isTogglingFav) return;

    const optimisticLiked = !isLiked;
    const optimisticCount = Math.max(0, favCount + (optimisticLiked ? 1 : -1));
    setFavorite(item.id, { isFavorited: optimisticLiked, favoriteCount: optimisticCount });
    setIsTogglingFav(true);

    try {
      const res = await favoritesApi.toggle(item.id);
      setFavorite(item.id, {
        isFavorited: res.isFavorited,
        favoriteCount: res.favoriteCount,
      });
      showNotice(
        res.isFavorited
          ? isVi
            ? 'Đã thêm vào danh sách yêu thích'
            : 'Added to favorites'
          : isVi
            ? 'Đã bỏ khỏi danh sách yêu thích'
            : 'Removed from favorites'
      );
    } catch {
      setFavorite(item.id, { isFavorited: isLiked, favoriteCount: favCount });
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleShare = async () => {
    if (!item) return;
    const url = `${window.location.origin}/items/${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedShare(true);
    showNotice(isVi ? 'Đã sao chép liên kết sản phẩm!' : 'Product link copied to clipboard!');
    window.setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleAddToCart = () => {
    if (!item || !productForModals) return;
    if (!requireAuth('cart')) return;
    if (!user) return;
    if (isOwner) {
      showNotice(isVi ? 'Bạn không thể tự mua sản phẩm của mình.' : 'You cannot buy your own item.');
      return;
    }
    if (isSoldOrUnavailable) {
      showNotice(isVi ? 'Sản phẩm hiện đã hết hàng.' : 'This item is no longer available.');
      return;
    }

    addToCart(user.id, {
      ...productForModals,
      selectedQuantity: quantity,
    });
    showNotice(
      isVi
        ? `Đã thêm ${quantity} sản phẩm vào giỏ hàng!`
        : `Added ${quantity} item(s) to cart!`
    );
  };

  const handleOpenBuyNow = () => {
    if (!item) return;
    if (!requireAuth('cart')) return;
    if (isOwner) {
      showNotice(isVi ? 'Bạn không thể tự mua sản phẩm của mình.' : 'You cannot buy your own item.');
      return;
    }
    if (isSoldOrUnavailable) {
      showNotice(isVi ? 'Sản phẩm hiện đã hết hàng.' : 'This item is no longer available.');
      return;
    }
    setBuyError(null);
    setIsBuyNowOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!item || isSubmittingBuy) return;
    setBuyError(null);
    setIsSubmittingBuy(true);

    try {
      await transactionsApi.createPurchaseDirect({
        itemCode: item.itemCode,
        quantity,
        meetingLocation: item.location,
        paymentMethod,
      });
      setIsBuyNowOpen(false);
      router.push('/transactions');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setBuyError(
        apiErr?.response?.data?.message ||
          apiErr?.message ||
          (isVi ? 'Không thể tạo đơn hàng. Vui lòng thử lại.' : 'Failed to create order.')
      );
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  const ratingAvg = item?.seller?.ratingAverage ?? null;
  const ratingCount = item?.seller?.ratingCount ?? 0;
  const displayStars = Math.round(ratingAvg ?? 0);
  const totalOrderPrice = (item?.price ?? 0) * quantity;

  return (
    <div className="min-h-screen bg-[#FCF9F4] dark:bg-stone-950 text-[#2A211B] dark:text-stone-100 flex flex-col transition-colors duration-200">
      <Suspense
        fallback={
          <div className="h-16 bg-white dark:bg-stone-950 border-b border-[#EADBCE] dark:border-stone-800" />
        }
      >
        <Navbar />
      </Suspense>

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-[#2A211B] dark:bg-stone-100 text-white dark:text-stone-950 px-4 py-3 text-xs sm:text-sm font-semibold shadow-xl animate-in fade-in slide-in-from-bottom-3"
        >
          <Check className="w-4 h-4 text-[#F5A764] dark:text-[#C46A28]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <AuthRequiredModal
        isOpen={isAuthRequiredOpen}
        onClose={() => setIsAuthRequiredOpen(false)}
        product={productForModals}
        reason={authReason}
      />

      <SellerContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        product={productForModals}
      />

      {/* Buy Now Confirmation Modal */}
      {isBuyNowOpen && item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsBuyNowOpen(false)}
              aria-label={isVi ? 'Đóng' : 'Close'}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="font-serif text-xl font-bold mb-1">
              {isVi ? 'Xác nhận đặt mua' : 'Confirm Order'}
            </h2>
            <p className="text-xs text-[#6D5D52] dark:text-stone-400 mb-4">
              {isVi
                ? 'Đơn giao dịch sẽ được gửi tới người bán và theo dõi tại trang Giao dịch.'
                : 'Your order will be sent to the seller and tracked in Transactions.'}
            </p>

            <div className="rounded-2xl bg-[#FAF7F2] dark:bg-stone-800/70 border border-[#EADBCE] dark:border-stone-700 p-3.5 space-y-2 mb-4 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-[#6D5D52] dark:text-stone-400">
                  {isVi ? 'Sản phẩm:' : 'Item:'}
                </span>
                <span className="font-semibold text-right line-clamp-1">{item.title}</span>
              </div>
              {item.color && (
                <div className="flex justify-between gap-2">
                  <span className="text-[#6D5D52] dark:text-stone-400">
                    {isVi ? 'Màu sắc:' : 'Color:'}
                  </span>
                  <span className="font-medium">{item.color}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-[#6D5D52] dark:text-stone-400">
                  {isVi ? 'Số lượng:' : 'Quantity:'}
                </span>
                <span className="font-semibold tabular-nums">x{quantity}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6D5D52] dark:text-stone-400">
                  Location:
                </span>
                <span className="font-medium text-right max-w-[65%] break-words">
                  {fixedLocation}
                </span>
              </div>
              <div className="pt-2 border-t border-[#EADBCE] dark:border-stone-700 flex justify-between items-center">
                <span className="font-semibold">{isVi ? 'Tổng tiền hàng:' : 'Item Subtotal:'}</span>
                <span className="text-base font-extrabold text-[#C46A28] dark:text-[#F5A764] tabular-nums">
                  {totalOrderPrice === 0
                    ? '0 VND (Miễn phí)'
                    : `${totalOrderPrice.toLocaleString('vi-VN')} ₫`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#6D5D52] dark:text-stone-400 mb-4 leading-relaxed">
              {isVi
                ? 'Hình thức giao nhận (gặp trực tiếp hay đặt ship ngoài) và điểm hẹn cuối cùng sẽ do người bán chọn & cập nhật trên đơn sau khi hai bên chốt qua chat.'
                : 'Delivery method (direct meetup or external shipper) and final location will be confirmed on the order by the seller after chatting.'}
            </p>

            {item.price > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-[#6D5D52] dark:text-stone-300">
                  {isVi ? 'Phương thức thanh toán' : 'Payment Method'}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                      paymentMethod === 1
                        ? 'border-[#C46A28] bg-[#FAF7F2] dark:border-[#F5A764] dark:bg-stone-800'
                        : 'border-[#EADBCE] dark:border-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 1}
                      onChange={() => setPaymentMethod(1)}
                      className="accent-[#C46A28]"
                    />
                    <span>
                      {isVi
                        ? 'Tiền mặt khi đồng kiểm & nhận hàng (COD)'
                        : 'Cash on Inspection & Delivery (COD)'}
                    </span>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                      paymentMethod === 2
                        ? 'border-[#C46A28] bg-[#FAF7F2] dark:border-[#F5A764] dark:bg-stone-800'
                        : 'border-[#EADBCE] dark:border-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 2}
                      onChange={() => setPaymentMethod(2)}
                      className="accent-[#C46A28]"
                    />
                    <span>
                      {isVi
                        ? 'Chuyển khoản QR ngân hàng'
                        : 'Bank Transfer (VietQR)'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {buyError && (
              <div className="mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
                {buyError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsBuyNowOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSubmittingBuy}
                onClick={() => void handleConfirmPurchase()}
                className="flex-1 py-2.5 rounded-xl bg-[#C46A28] hover:bg-[#A65A24] text-white dark:bg-[#F5A764] dark:hover:bg-[#E89650] dark:text-stone-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmittingBuy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isVi ? 'Xác nhận mua ngay' : 'Place Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#6D5D52] dark:text-stone-300 hover:text-[#C46A28] dark:hover:text-[#F5A764] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isVi ? 'Quay lại trang chủ' : 'Back to Storefront'}</span>
          </Link>

          {item?.category && (
            <span className="text-xs px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-800 text-[#6D5D52] dark:text-stone-300">
              {item.category.name}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-5 aspect-square rounded-2xl bg-stone-200 dark:bg-stone-800" />
            <div className="lg:col-span-7 space-y-4">
              <div className="h-7 w-3/4 rounded-lg bg-stone-200 dark:bg-stone-800" />
              <div className="h-5 w-1/3 rounded-lg bg-stone-200 dark:bg-stone-800" />
              <div className="h-20 rounded-2xl bg-stone-200 dark:bg-stone-800" />
              <div className="h-12 w-full rounded-xl bg-stone-200 dark:bg-stone-800" />
            </div>
          </div>
        ) : fetchError || !item ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 p-12 text-center">
            <p className="text-base font-bold mb-2">
              {fetchError || (isVi ? 'Không tìm thấy sản phẩm' : 'Product not found')}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl bg-[#C46A28] text-white dark:bg-[#F5A764] dark:text-stone-950 text-xs font-bold"
            >
              {isVi ? 'Về trang chủ' : 'Go Home'}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Product Card */}
            <section className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 p-4 sm:p-7 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-7">
              {/* Left: Image Gallery */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImage.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />

                  <span
                    className={`absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-xs ${
                      item.condition <= 2 ? 'bg-emerald-700/95' : 'bg-[#855A3C]'
                    }`}
                  >
                    {item.conditionName}
                  </span>

                  <span className="absolute top-3 right-3 font-mono text-xs font-bold text-[#7D5435] dark:text-[#E5C9A8] bg-white/95 dark:bg-stone-900/95 border border-[#EADBCE] dark:border-stone-700 px-2.5 py-1 rounded-lg">
                    {formatItemCodeDisplay(item.itemCode)}
                  </span>

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageIdx((prev) => (prev - 1 + images.length) % images.length)
                        }
                        aria-label={isVi ? 'Ảnh trước' : 'Previous photo'}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 text-[#2A211B] dark:text-stone-100 shadow-md flex items-center justify-center hover:bg-white cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedImageIdx((prev) => (prev + 1) % images.length)}
                        aria-label={isVi ? 'Ảnh tiếp theo' : 'Next photo'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 text-[#2A211B] dark:text-stone-100 shadow-md flex items-center justify-center hover:bg-white cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImageIdx(idx)}
                        aria-label={`${isVi ? 'Chọn ảnh' : 'Select photo'} ${idx + 1}`}
                        className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                          idx === selectedImageIdx
                            ? 'border-[#C46A28] dark:border-[#F5A764]'
                            : 'border-[#EADBCE] dark:border-stone-700 opacity-75 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.imageUrl}
                          alt={`${item.title} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details + Actions */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                {/* Title + Rating */}
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2A211B] dark:text-stone-100 leading-snug">
                    {item.title}
                  </h1>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= displayStars
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300 dark:text-stone-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-[#2A211B] dark:text-stone-100 tabular-nums">
                        {ratingAvg !== null ? ratingAvg.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-[#6D5D52] dark:text-stone-400">
                        ({ratingCount} {isVi ? 'đánh giá' : 'reviews'})
                      </span>
                    </div>

                    <span className="text-stone-300 dark:text-stone-700">|</span>

                    <div className="flex items-center gap-1.5 text-[#6D5D52] dark:text-stone-300">
                      <Store className="w-4 h-4 text-[#C46A28] dark:text-[#F5A764]" />
                      <span className="font-semibold">{item.seller.fullName}</span>
                      {item.seller.schoolName && (
                        <span className="text-xs text-[#6D5D52] dark:text-stone-400">
                          • {item.seller.schoolName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Single Original Price (NO discount) */}
                <div className="rounded-2xl bg-[#FAF7F2] dark:bg-stone-800/70 border border-[#EADBCE] dark:border-stone-700 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#6D5D52] dark:text-stone-400 mb-0.5">
                      {isVi ? 'Giá sản phẩm' : 'Price'}
                    </p>
                    <p className="text-3xl sm:text-4xl font-extrabold text-[#C46A28] dark:text-[#F5A764] tabular-nums">
                      {item.price === 0
                        ? isVi
                          ? 'Miễn phí (0 ₫)'
                          : 'Free (0 VND)'
                        : `${item.price.toLocaleString('vi-VN')} ₫`}
                    </p>
                  </div>

                  {item.isExchangeEnabled && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 text-xs font-semibold text-[#2A211B] dark:text-stone-200">
                      <Repeat className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764]" />
                      {isVi ? 'Hỗ trợ trao đổi đồ' : 'Exchange Available'}
                    </span>
                  )}
                </div>

                {/* Structured Attributes Grid (Lazada-inspired) */}
                <div className="space-y-4 text-sm">
                  {/* Fixed Location provided by Seller */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <span className="sm:col-span-3 text-xs font-semibold text-[#6D5D52] dark:text-stone-400">
                      Location:
                    </span>
                    <div className="sm:col-span-9 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#C46A28] dark:text-[#F5A764] shrink-0" />
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium underline underline-offset-2 text-[#A65A24] hover:text-[#844519] dark:text-[#F5A764] dark:hover:text-[#FBD6B0] break-words"
                      >
                        {fixedLocation}
                      </a>
                    </div>
                  </div>

                  {/* Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <span className="sm:col-span-3 text-xs font-semibold text-[#6D5D52] dark:text-stone-400">
                      {isVi ? 'Màu sắc:' : 'Color:'}
                    </span>
                    <div className="sm:col-span-9 flex items-center gap-2">
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#C46A28] dark:border-[#F5A764] bg-[#FAF7F2] dark:bg-stone-800 text-xs font-semibold text-[#2A211B] dark:text-stone-100">
                        <Palette className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764]" />
                        {item.color?.trim() || (isVi ? 'Tiêu chuẩn / Ngẫu nhiên' : 'Standard')}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper + Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <span className="sm:col-span-3 text-xs font-semibold text-[#6D5D52] dark:text-stone-400">
                      {isVi ? 'Số lượng:' : 'Quantity:'}
                    </span>
                    <div className="sm:col-span-9 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden">
                        <button
                          type="button"
                          disabled={quantity <= 1 || isSoldOrUnavailable}
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          aria-label={isVi ? 'Giảm số lượng' : 'Decrease quantity'}
                          className="w-9 h-9 flex items-center justify-center hover:bg-[#FAF7F2] dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, maxStock)}
                          disabled={isSoldOrUnavailable}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (Number.isNaN(val)) return;
                            setQuantity(Math.max(1, Math.min(Math.max(1, maxStock), val)));
                          }}
                          aria-label={isVi ? 'Số lượng đặt mua' : 'Purchase quantity'}
                          className="w-12 h-9 text-center text-sm font-bold tabular-nums bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={quantity >= maxStock || isSoldOrUnavailable}
                          onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                          aria-label={isVi ? 'Tăng số lượng' : 'Increase quantity'}
                          className="w-9 h-9 flex items-center justify-center hover:bg-[#FAF7F2] dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-xs text-[#6D5D52] dark:text-stone-400">
                        {isSoldOrUnavailable
                          ? isVi
                            ? 'Đã hết hàng / Ngừng bán'
                            : 'Out of stock / Unavailable'
                          : isVi
                            ? `${maxStock} sản phẩm có sẵn`
                            : `${maxStock} available`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Row: Buy Now + Add to Cart + Share + Synced Favorite */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSoldOrUnavailable}
                    onClick={handleOpenBuyNow}
                    className="flex-1 min-w-[140px] min-h-[46px] px-4 py-3 rounded-xl border-2 border-[#C46A28] text-[#C46A28] hover:bg-[#FAF7F2] dark:border-[#F5A764] dark:text-[#F5A764] dark:hover:bg-stone-800 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isVi ? 'Mua ngay' : 'Buy Now'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSoldOrUnavailable}
                    onClick={handleAddToCart}
                    className="flex-1 min-w-[165px] min-h-[46px] px-4 py-3 rounded-xl bg-[#C46A28] hover:bg-[#A65A24] text-white dark:bg-[#F5A764] dark:hover:bg-[#E89650] dark:text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isVi ? 'Thêm vào giỏ hàng' : 'Add to Cart'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    aria-label={isVi ? 'Chia sẻ sản phẩm' : 'Share product'}
                    className="min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 text-xs font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition"
                  >
                    {copiedShare ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4 text-[#6D5D52] dark:text-stone-300" />
                    )}
                    <span className="text-[11px]">{isVi ? 'Chia sẻ' : 'Share'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isTogglingFav}
                    onClick={() => void handleToggleFavorite()}
                    aria-pressed={isLiked}
                    aria-label={
                      isVi
                        ? isLiked
                          ? 'Bỏ yêu thích'
                          : 'Yêu thích sản phẩm'
                        : isLiked
                          ? 'Remove favorite'
                          : 'Favorite product'
                    }
                    className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition disabled:opacity-60 ${
                      isLiked
                        ? 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'border-[#EADBCE] dark:border-stone-700 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 text-[#6D5D52] dark:text-stone-300'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isLiked ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span className="text-[11px] tabular-nums">
                      {isVi ? 'Thích' : 'Like'} ({favCount})
                    </span>
                  </button>
                </div>

                {/* Contact / Exchange Modal trigger */}
                <button
                  type="button"
                  onClick={() => {
                    if (!requireAuth('contact')) return;
                    setIsContactModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#F3E8DA] hover:bg-[#E7D6C0] dark:bg-stone-800 dark:hover:bg-stone-700 border border-[#DEC9B0] dark:border-stone-700 text-[#3D2B1F] dark:text-stone-100 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {isVi
                      ? 'Liên hệ / Trao đổi trực tiếp với người bán'
                      : 'Contact / Exchange with Seller'}
                  </span>
                </button>
              </div>
            </section>

            {/* Bottom Description & Guarantees */}
            <section className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 p-5 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EADBCE] dark:border-stone-800 pb-3">
                <h2 className="font-serif text-lg sm:text-xl font-bold">
                  {isVi ? 'Mô tả chi tiết sản phẩm' : 'Product Description'}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isVi
                      ? 'Giao dịch sinh viên trực tiếp tại trường'
                      : 'Direct campus student trading'}
                  </span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[#2A211B] dark:text-stone-200 whitespace-pre-wrap">
                {item.description?.trim() ||
                  (isVi
                    ? 'Người bán chưa bổ sung mô tả chi tiết cho sản phẩm này.'
                    : 'No detailed description provided by the seller.')}
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
