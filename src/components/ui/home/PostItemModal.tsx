'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  DollarSign,
  MapPin,
  Tag,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Repeat,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';
import { useAuthStore } from '@/lib/auth-store';
import { itemsApi } from '@/lib/items-api';
import { CategoryDto, CreateItemRequestDto, ItemDetailDto } from '@/types/item';
import { detectCategoryFromTitle, getCategoryPrefix, CategoryDetectorResult } from '@/lib/category-detector';
import { formatItemCodeDisplay } from '@/data/mock-items';

interface PostItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated?: (item: ItemDetailDto) => void;
}

// Preset campus photos for quick testing when user doesn't have an image URL
const PRESET_IMAGES = [
  { label: 'Casio / Máy tính', url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80' },
  { label: 'Giáo trình / Sách', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80' },
  { label: 'Quạt mini KTX', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80' },
  { label: 'Tai nghe Bluetooth', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80' },
  { label: 'Balo sinh viên', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80' },
  { label: 'Ấm siêu tốc', url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&auto=format&fit=crop&q=80' },
];

export const PostItemModal: React.FC<PostItemModalProps> = ({
  isOpen,
  onClose,
  onItemCreated,
}) => {
  const { language } = useLanguageStore();
  const t = DICTIONARY[language];
  const { isAuthenticated, user } = useAuthStore();

  // Form states
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [autoDetected, setAutoDetected] = useState<CategoryDetectorResult | null>(null);
  const [isUserOverridden, setIsUserOverridden] = useState(false);

  const [price, setPrice] = useState('50000');
  const [isFree, setIsFree] = useState(false);
  const [condition, setCondition] = useState<number>(2); // 2: LikeNew
  const [isExchangeEnabled, setIsExchangeEnabled] = useState(true);
  const [location, setLocation] = useState('KTX Khu A - Sảnh chính');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);

  // Submission & validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<ItemDetailDto | null>(null);

  // Load categories from backend when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    itemsApi
      .getCategories()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setCategories(data);
          setSelectedCategoryId(data[0].id);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch backend categories, using defaults:', err);
        // Fallback default categories if backend is booting
        setCategories([
          { id: 1, name: 'Sách & Giáo trình', slug: 'books', order: 1, itemCount: 0 },
          { id: 2, name: 'Dụng cụ học tập', slug: 'stationery-study', order: 2, itemCount: 0 },
          { id: 3, name: 'Thời trang', slug: 'fashion', order: 3, itemCount: 0 },
          { id: 4, name: 'Đồ KTX & Đời sống', slug: 'dorm-living', order: 4, itemCount: 0 },
          { id: 5, name: 'Đồ điện tử', slug: 'electronics', order: 5, itemCount: 0 },
          { id: 6, name: 'Sức khỏe & Sắc đẹp', slug: 'beauty-health', order: 6, itemCount: 0 },
          { id: 9, name: 'Khác / Ăn uống', slug: 'food-drinks', order: 9, itemCount: 0 },
        ]);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setTitle('');
    setAutoDetected(null);
    setIsUserOverridden(false);
    setPrice('50000');
    setIsFree(false);
    setCondition(2);
    setIsExchangeEnabled(true);
    setLocation('KTX Khu A - Sảnh chính');
    setDescription('');
    setImageUrl(PRESET_IMAGES[0].url);
    setErrorMessage(null);
    setCreatedItem(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setErrorMessage(null);

    if (!isUserOverridden) {
      const detected = detectCategoryFromTitle(val);
      if (detected) {
        setAutoDetected(detected);
        // Map detected slug to available category ID
        const matched = categories.find(
          (c) =>
            c.slug.toLowerCase() === detected.categoryId.toLowerCase() ||
            (detected.categoryId === 'books' && c.slug.includes('sach')) ||
            (detected.categoryId === 'stationery-study' && (c.slug.includes('giao-duc') || c.slug.includes('tai-lieu'))) ||
            (detected.categoryId === 'electronics' && c.slug.includes('dien-tu')) ||
            (detected.categoryId === 'dorm-living' && c.slug.includes('gia-dung')) ||
            (detected.categoryId === 'fashion' && c.slug.includes('thoi-trang'))
        );
        if (matched) {
          setSelectedCategoryId(matched.id);
        }
      } else {
        setAutoDetected(null);
      }
    }
  };

  const handleCategorySelect = (id: number) => {
    setSelectedCategoryId(id);
    setIsUserOverridden(true);
    setAutoDetected(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic frontend checks matching backend validation rules
    if (title.trim().length < 5) {
      setErrorMessage(
        language === 'vi'
          ? 'Tiêu đề phải có ít nhất 5 ký tự.'
          : 'Title must be at least 5 characters long.'
      );
      return;
    }

    if (location.trim().length < 6) {
      setErrorMessage(
        language === 'vi'
          ? 'Địa điểm gặp mặt phải có ít nhất 6 ký tự (vd: KTX Khu A).'
          : 'Meeting location must be at least 6 characters (e.g. Dorm Area A).'
      );
      return;
    }

    const numericPrice = isFree ? 0 : parseFloat(price.replace(/[^0-9]/g, '')) || 0;

    const payload: CreateItemRequestDto = {
      title: title.trim(),
      categoryId: selectedCategoryId,
      description: description.trim() || undefined,
      price: numericPrice,
      condition,
      isExchangeEnabled,
      location: location.trim(),
      imageUrls: imageUrl.trim() ? [imageUrl.trim()] : undefined,
    };

    setIsSubmitting(true);

    try {
      const newItem = await itemsApi.createItem(payload);
      setCreatedItem(newItem);
      setIsSubmitting(false);

      if (onItemCreated) {
        onItemCreated(newItem);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      console.warn('Create item failed:', err);

      const status = err.response?.status;
      const data = err.response?.data;
      const code = data?.code || data?.error?.code;
      const backendMsg = data?.message || data?.error?.message;

      if (status === 401) {
        setErrorMessage(
          language === 'vi'
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đăng tin.'
            : 'Your session has expired. Please sign in again.'
        );
      } else if (status === 403) {
        setErrorMessage(
          language === 'vi'
            ? 'Tài khoản của bạn chưa được cấp quyền Người Bán (Seller). Để test ngay, hãy đăng nhập bằng tài khoản sinh viên đã duyệt sẵn: minh / Pass1234! (hoặc admin / admin123).'
            : 'Your account is not approved for selling yet. To test now, please sign in with an approved student account: minh / Pass1234! (or admin / admin123).'
        );
      } else {
        setErrorMessage(
          backendMsg ||
          (language === 'vi'
            ? 'Không thể đăng tin. Vui lòng kiểm tra lại thông tin kết nối.'
            : 'Failed to post item. Please verify your connection.')
        );
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* State 1: Guest not logged in */}
        {!isAuthenticated ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {language === 'vi' ? 'Đăng nhập để đăng bán đồ cũ' : 'Sign In Required'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
              {language === 'vi'
                ? 'Để đảm bảo an toàn và chống lừa đảo trong khuôn viên trường, chỉ sinh viên đã xác thực mới được đăng tin bán hoặc trao đổi đồ.'
                : 'To ensure student safety and campus trust, only verified student accounts can list items for sale or exchange.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
              <Link
                href="/login?redirect=/"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition"
                onClick={handleResetAndClose}
              >
                <span>{language === 'vi' ? 'Đăng nhập ngay' : 'Sign In Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
              >
                {language === 'vi' ? 'Đóng lại' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : createdItem ? (
          /* State 2: Success state with generated Smart ItemCode */
          <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-xs animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
              {language === 'vi' ? 'Đăng tin thành công!' : 'Item Listed Successfully!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mb-4">
              {language === 'vi'
                ? 'Món đồ của bạn đã được đưa lên sàn và sẵn sàng để các bạn sinh viên khác trao đổi.'
                : 'Your listing is now live on Student Flea Market with a unique Smart ItemCode.'}
            </p>

            {/* Smart ItemCode Card */}
            <div className="w-full max-w-sm p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-white border border-amber-200 mb-6 shadow-xs">
              <p className="text-xs font-semibold text-amber-900 mb-1">
                {language === 'vi' ? 'Mã đối soát & bàn giao (Smart ItemCode)' : 'Verification ItemCode'}
              </p>
              <div className="text-2xl font-mono font-bold text-[#C46A28] tracking-wider my-1">
                {formatItemCodeDisplay(createdItem.itemCode)}
              </div>
              <p className="text-[11px] text-amber-800">
                {language === 'vi'
                  ? 'Mã này sẽ dùng để đối soát tại chỗ khi gặp mặt bàn giao để chống tráo hàng.'
                  : 'Use this code to verify handover and prevent counterfeit swapping.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="py-2.5 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition"
            >
              {language === 'vi' ? 'Xem tin vừa đăng' : 'View Listings'}
            </button>
          </div>
        ) : (
          /* State 3: Active Post Item Form */
          <>
            {/* Header */}
            <div className="mb-5">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-2">
                <span>{language === 'vi' ? 'Đăng bán miễn phí cho SV' : 'Free Student Listing'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t.postItemModal.title}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {t.postItemModal.subtitle}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
                {errorMessage.includes('minh') && (
                  <div className="pl-6 pt-1 flex items-center gap-2">
                    <Link
                      href="/login"
                      onClick={handleResetAndClose}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition shadow-xs"
                    >
                      {language === 'vi' ? 'Đến trang Đăng nhập ngay' : 'Go to Login Now'}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Title with Real-time Category Auto-detection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.postItemModal.itemName} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={
                    language === 'vi'
                      ? 'Vd: Máy tính Casio fx-580vn x, Quạt mini KTX...'
                      : 'E.g. Casio fx-580vn calculator, mini dorm fan...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
                />

                {/* AI Suggestion Chip */}
                {autoDetected && (
                  <div className="mt-2 p-2 px-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                      <Sparkles className="w-4 h-4 text-[#C46A28] shrink-0 animate-pulse" />
                      <span>
                        {language === 'vi' ? 'AI Gợi ý danh mục:' : 'AI Suggested Category:'}{' '}
                        <strong className="text-[#C46A28] font-bold">
                          {language === 'vi' ? autoDetected.labelVi : autoDetected.labelEn}
                        </strong>
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                      {autoDetected.prefix}-XXXXXX
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.postItemModal.category} *
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategorySelect(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Price & Free Giveaway Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.postItemModal.price} *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      disabled={isFree}
                      value={isFree ? 0 : price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition disabled:opacity-60 disabled:bg-slate-100"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      VND
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {language === 'vi' ? '🎁 Tặng miễn phí (0 VND)' : '🎁 Free giveaway (0 VND)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* 4. Condition & Exchange Enable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.postItemModal.condition} *
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value={1}>{language === 'vi' ? 'Mới 100% (Brand New)' : 'Brand New (100%)'}</option>
                    <option value={2}>{language === 'vi' ? 'Như mới 99% (Like New)' : 'Like New (99%)'}</option>
                    <option value={3}>{language === 'vi' ? 'Còn dùng tốt (Good)' : 'Good Condition'}</option>
                    <option value={4}>{language === 'vi' ? 'Cũ / Dùng được (Fair)' : 'Fair / Usable'}</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={isExchangeEnabled}
                      onChange={(e) => setIsExchangeEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{language === 'vi' ? 'Bật cho phép đổi đồ' : 'Allow Item Exchange'}</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* 5. Meeting Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.postItemModal.location} *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={
                      language === 'vi'
                        ? 'Vd: KTX Khu A, Thư viện trường, Cổng trường...'
                        : 'E.g.: Dorm Area A, Campus Library...'
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* 6. Image Selection (Preset or custom URL) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{language === 'vi' ? 'Hình ảnh sản phẩm' : 'Product Photo'}</span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'vi' ? 'Chọn ảnh mẫu hoặc nhập URL' : 'Choose preset or enter URL'}
                  </span>
                </label>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                  />
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  )}
                </div>

                {/* Preset Image Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${imageUrl === preset.url
                          ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.postItemModal.description}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    language === 'vi'
                      ? 'Mô tả thêm tình trạng món đồ, phụ kiện kèm theo, giờ có thể gặp...'
                      : 'Describe item details, accessories, meetup time...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'vi' ? 'Đang đăng tin lên sàn...' : 'Posting Item...'}</span>
                    </>
                  ) : (
                    <span>{t.postItemModal.submitBtn}</span>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
