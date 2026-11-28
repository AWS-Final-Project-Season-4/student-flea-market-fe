'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { useLanguageStore } from '@/lib/language-store';
import { formatItemCodeDisplay } from '@/data/mock-items';

interface ConfirmDeleteItemModalProps {
  item: {
    id: string;
    title: string;
    itemCode?: string;
  } | null;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteItemModal: React.FC<ConfirmDeleteItemModalProps> = ({
  item,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}) => {
  const { language } = useLanguageStore();
  const isVi = language === 'vi';

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, isDeleting, onCancel]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-item-title"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          aria-label={isVi ? 'Đóng' : 'Close'}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF7F2] dark:bg-stone-800 hover:bg-[#EFE8DD] dark:hover:bg-stone-700 text-[#6D5D52] dark:text-stone-300 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3
              id="confirm-delete-item-title"
              className="font-serif text-lg font-bold text-[#2A211B] dark:text-stone-100"
            >
              {isVi ? 'Gỡ tin đăng này?' : 'Remove this listing?'}
            </h3>
            <p className="text-xs text-[#6D5D52] dark:text-stone-400 mt-1 leading-relaxed">
              {isVi
                ? 'Tin đăng sẽ bị ẩn khỏi sàn và người mua khác sẽ không thể đặt hàng nữa. Lịch sử giao dịch trước đó vẫn được giữ nguyên.'
                : 'This listing will be hidden from the marketplace so others cannot order it. Any prior transaction history will remain intact.'}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-stone-800/80 border border-[#EADBCE] dark:border-stone-700 space-y-1">
          <p className="text-sm font-bold text-[#2A211B] dark:text-stone-100 line-clamp-2">
            {item.title}
          </p>
          {item.itemCode && (
            <p className="text-[11px] font-mono font-semibold text-[#855A3C] dark:text-[#F5A764]">
              {isVi ? 'Mã đồ:' : 'Item Code:'} {formatItemCodeDisplay(item.itemCode)}
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-[#2A211B] dark:text-stone-200 transition cursor-pointer disabled:opacity-50"
          >
            {isVi ? 'Giữ lại' : 'Keep Listing'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isVi ? 'Đang gỡ tin...' : 'Removing...'}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{isVi ? 'Xác nhận gỡ tin' : 'Remove Listing'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
