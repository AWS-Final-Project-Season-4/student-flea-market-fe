///////////////////////////////////////////////////////////
//                                                       //
//             ADMIN CATEGORY & SYSTEM CONTROL           //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Edit3,
  Infinity as InfinityIcon,
  Loader2,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { DICTIONARY, useLanguageStore } from '@/lib/language-store';
import { AdminCategoryDto } from '@/types/admin';

export default function AdminSettingsPage() {
  const { language } = useLanguageStore();
  const isVi = language === 'vi';
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Create/Edit Modal
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryDto | null>(null);
  const [catName, setCatName] = useState<string>('');
  const [catDescription, setCatDescription] = useState<string>('');
  const [catOrder, setCatOrder] = useState<string>('');
  const [catIsActive, setCatIsActive] = useState<boolean>(true);
  const [isSavingModal, setIsSavingModal] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    adminApi
      .listCategories()
      .then((data) => {
        if (!active) return;
        setCategories(data);
        setErrorMsg(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load categories.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const reloadCategories = async () => {
    setErrorMsg(null);
    const data = await adminApi.listCategories();
    setCategories(data);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setCatOrder('');
    setCatIsActive(true);
  };

  const openEditModal = (cat: AdminCategoryDto) => {
    setModalMode('edit');
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setCatOrder(String(cat.order));
    setCatIsActive(cat.isActive);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);

    const trimmedName = catName.trim();
    if (trimmedName.length < 2) {
      setErrorMsg('Category name must be at least 2 characters.');
      return;
    }

    const parsedOrder = catOrder.trim() ? parseInt(catOrder, 10) : undefined;
    setIsSavingModal(true);

    try {
      if (modalMode === 'create') {
        await adminApi.createCategory({
          name: trimmedName,
          description: catDescription.trim() || undefined,
          order: parsedOrder,
          isActive: catIsActive,
        });
        setNoticeMsg(`Created category "${trimmedName}".`);
      } else if (modalMode === 'edit' && editingCategory) {
        await adminApi.updateCategory(editingCategory.id, {
          name: trimmedName,
          description: catDescription.trim() || undefined,
          order: parsedOrder,
        });
        setNoticeMsg(`Updated category "${trimmedName}".`);
      }
      setModalMode(null);
      await reloadCategories();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleToggleStatus = async (cat: AdminCategoryDto) => {
    setBusyId(cat.id);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.toggleCategory(cat.id, !cat.isActive);
      setNoticeMsg(
        `${!cat.isActive ? 'Opened' : 'Closed'} category "${cat.name}".`
      );
      await reloadCategories();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to toggle category status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (cat: AdminCategoryDto) => {
    const confirmed = window.confirm(`Delete category "${cat.name}"?`);
    if (!confirmed) return;

    setBusyId(cat.id);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.deleteCategory(cat.id);
      setNoticeMsg(`Deleted category "${cat.name}".`);
      await reloadCategories();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const nextList = [...categories];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIndex, 0, moved);

    setErrorMsg(null);
    try {
      const updated = await adminApi.reorderCategories(nextList.map((c) => c.id));
      setCategories(updated);
      setNoticeMsg('Updated category display order.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reorder categories.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A211B] dark:text-stone-100">
            {isVi ? 'Quản lý Danh mục & Quy tắc sàn' : 'Category Management & Platform Rules'}
          </h2>
          <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-400 mt-1">
            {isVi
              ? 'Mở, đóng, sắp xếp thứ tự hoặc tạo danh mục sản phẩm đồng bộ trực tiếp với hệ thống.'
              : 'Open, close, reorder, or create product categories synced directly with the backend database.'}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#DFCBB2] dark:bg-[#F5A764] hover:bg-[#D2BA9B] dark:hover:bg-[#E89650] text-[#2A211B] dark:text-stone-950 border border-[#C9AE8B] dark:border-[#F5A764] text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus aria-hidden="true" className="w-4 h-4 text-[#4A3525] dark:text-stone-950" />
          <span>{isVi ? 'Thêm danh mục' : 'New Category'}</span>
        </button>
      </div>

      {/* Feedback */}
      {errorMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-medium flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            aria-label={isVi ? 'Đóng thông báo lỗi' : 'Dismiss error'}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      )}

      {noticeMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-medium flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{noticeMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setNoticeMsg(null)}
            aria-label={isVi ? 'Đóng thông báo' : 'Dismiss notification'}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3B2E24] dark:text-stone-200">
            <thead className="bg-[#FAF6F0] dark:bg-stone-800/80 text-[11px] font-semibold text-[#6D5D52] dark:text-stone-300 uppercase tracking-wider border-b border-[#EDE2D4] dark:border-stone-800">
              <tr>
                <th className="py-3 px-4">{isVi ? 'Thứ tự' : 'Order'}</th>
                <th className="py-3 px-4">{isVi ? 'Danh mục & Slug' : 'Category & Slug'}</th>
                <th className="py-3 px-4">{isVi ? 'Món đang mở / đã ẩn' : 'Active / Hidden Items'}</th>
                <th className="py-3 px-4">{isVi ? 'Trạng thái' : 'Status'}</th>
                <th className="py-3 px-4 sm:px-6 text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E9DD] dark:divide-stone-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#6D5D52] dark:text-stone-400">
                    <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin inline mr-2 text-[#B5916B] dark:text-[#F5A764]" />
                    {isVi ? 'Đang tải danh mục...' : 'Loading categories...'}
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#6D5D52] dark:text-stone-400">
                    {isVi ? 'Chưa có danh mục nào.' : 'No categories configured yet.'}
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => {
                  const isBusy = busyId === cat.id;
                  return (
                    <tr key={cat.id} className="hover:bg-[#FCF9F4] dark:hover:bg-stone-800/50 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span className="font-mono font-bold tabular-nums text-[#6D5D52] dark:text-stone-300 w-5">
                            #{cat.order}
                          </span>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => void handleMove(idx, -1)}
                            aria-label={isVi ? `Đưa danh mục ${cat.name} lên` : `Move ${cat.name} up`}
                            className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg hover:bg-[#F3ECE2] dark:hover:bg-stone-800 text-[#6D5D52] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100 disabled:opacity-30 cursor-pointer"
                            title={isVi ? 'Đưa lên' : 'Move up'}
                          >
                            <ArrowUp aria-hidden="true" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === categories.length - 1}
                            onClick={() => void handleMove(idx, 1)}
                            aria-label={isVi ? `Đưa danh mục ${cat.name} xuống` : `Move ${cat.name} down`}
                            className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg hover:bg-[#F3ECE2] dark:hover:bg-stone-800 text-[#6D5D52] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100 disabled:opacity-30 cursor-pointer"
                            title={isVi ? 'Đưa xuống' : 'Move down'}
                          >
                            <ArrowDown aria-hidden="true" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2A211B] dark:text-stone-100">
                          {DICTIONARY[language].categories[cat.slug as keyof typeof DICTIONARY.vi.categories] || cat.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#6D5D52] dark:text-stone-400">{cat.slug}</div>
                        {cat.description && (
                          <div className="text-[11px] text-[#6D5D52] dark:text-stone-400 mt-0.5 max-w-md truncate">
                            {cat.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                        <span className="font-semibold text-[#2A211B] dark:text-stone-100">
                          {cat.itemCount} {isVi ? 'đang bán' : 'live'}
                        </span>
                        {cat.hiddenItemCount > 0 && (
                          <span className="text-[#6D5D52] dark:text-stone-400">
                            {' '}
                            • {cat.hiddenItemCount} {isVi ? 'đã ẩn' : 'hidden'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {cat.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 font-semibold text-[11px]">
                            {isVi ? 'Đang mở' : 'Open'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F5EFE7] dark:bg-stone-800 text-[#6D5D52] dark:text-stone-400 font-semibold text-[11px]">
                            {isVi ? 'Đã đóng' : 'Closed'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openEditModal(cat)}
                            aria-label={isVi ? `Sửa danh mục ${cat.name}` : `Edit ${cat.name}`}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border border-[#DFCEBA] dark:border-stone-700 text-[#4E3F33] dark:text-stone-200 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
                            title={isVi ? 'Sửa danh mục' : 'Edit category'}
                          >
                            <Edit3 aria-hidden="true" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleToggleStatus(cat)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition cursor-pointer disabled:opacity-50 ${
                              cat.isActive
                                ? 'border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                                : 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                            }`}
                          >
                            <Power aria-hidden="true" className="w-3 h-3" />
                            <span>
                              {cat.isActive ? (isVi ? 'Đóng' : 'Close') : isVi ? 'Mở' : 'Open'}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || cat.itemCount > 0 || cat.hiddenItemCount > 0}
                            onClick={() => void handleDelete(cat)}
                            aria-label={isVi ? `Xóa danh mục ${cat.name}` : `Delete ${cat.name}`}
                            title={
                              cat.itemCount > 0 || cat.hiddenItemCount > 0
                                ? isVi
                                  ? 'Chỉ có thể xóa danh mục chưa có sản phẩm'
                                  : 'Only empty categories can be deleted'
                                : isVi
                                  ? 'Xóa danh mục'
                                  : 'Delete category'
                            }
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-800/70 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Rules Info Card */}
      <div className="p-5 rounded-2xl bg-[#FAF6F0] dark:bg-stone-900 border border-[#E5D6C3] dark:border-stone-800 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#EFE4D5] dark:bg-stone-800 text-[#845938] dark:text-[#F5A764] shrink-0 mt-0.5">
          <InfinityIcon aria-hidden="true" className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-bold text-[#2A211B] dark:text-stone-100">
            {isVi
              ? 'Quy tắc vòng đời: Đóng vs Xóa danh mục'
              : 'Marketplace Lifecycle Rule: Closing vs Deleting Categories'}
          </div>
          <p className="text-xs text-[#5E4E42] dark:text-stone-300 mt-1 leading-relaxed">
            {isVi
              ? 'Đóng danh mục sẽ chặn đăng bài mới trong danh mục đó nhưng vẫn giữ các món đang bán hiện tại. Chỉ được phép xóa khi danh mục không còn sản phẩm nào.'
              : 'Closing a category prevents users from creating new listings under it while keeping existing public items visible. Deleting is permitted only when a category has zero items.'}
          </p>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A211B]/40 dark:bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-[#E4D6C4] dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="category-modal-title" className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                {modalMode === 'create'
                  ? isVi
                    ? 'Tạo danh mục mới'
                    : 'Create New Category'
                  : isVi
                    ? 'Chỉnh sửa danh mục'
                    : 'Edit Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                aria-label={isVi ? 'Đóng hộp thoại' : 'Close dialog'}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#6D5D52] dark:text-stone-400 hover:text-[#3B2E24] dark:hover:text-stone-100 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label htmlFor="cat-name-input" className="block text-xs font-semibold text-[#3B2E24] dark:text-stone-200 mb-1">
                  {isVi ? 'Tên danh mục *' : 'Category Name *'}
                </label>
                <input
                  id="cat-name-input"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 bg-[#FCF9F4] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 dark:focus:ring-[#F5A764]/40"
                />
              </div>
              <div>
                <label htmlFor="cat-desc-input" className="block text-xs font-semibold text-[#3B2E24] dark:text-stone-200 mb-1">
                  {isVi ? 'Mô tả (tùy chọn)' : 'Description (optional)'}
                </label>
                <textarea
                  id="cat-desc-input"
                  rows={2}
                  maxLength={500}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DFCEBA] dark:border-stone-700 bg-[#FCF9F4] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 dark:focus:ring-[#F5A764]/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label htmlFor="cat-order-input" className="block text-xs font-semibold text-[#3B2E24] dark:text-stone-200 mb-1">
                    {isVi ? 'Thứ tự hiển thị (tùy chọn)' : 'Display Order (optional)'}
                  </label>
                  <input
                    id="cat-order-input"
                    type="number"
                    min={0}
                    value={catOrder}
                    onChange={(e) => setCatOrder(e.target.value)}
                    className="w-full px-3 py-2 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 bg-[#FCF9F4] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 dark:focus:ring-[#F5A764]/40"
                  />
                </div>
                {modalMode === 'create' && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#3B2E24] dark:text-stone-200 pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="rounded accent-[#B5916B] dark:accent-[#F5A764]"
                    />
                    <span>{isVi ? 'Mở ngay sau khi tạo' : 'Open immediately'}</span>
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 text-xs font-semibold text-[#4E3F33] dark:text-stone-200 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingModal}
                  className="px-4 py-2 min-h-[40px] rounded-xl bg-[#DFCBB2] dark:bg-[#F5A764] hover:bg-[#D2BA9B] dark:hover:bg-[#E89650] text-[#2A211B] dark:text-stone-950 border border-[#C9AE8B] dark:border-[#F5A764] text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingModal
                    ? isVi
                      ? 'Đang lưu...'
                      : 'Saving...'
                    : isVi
                      ? 'Lưu danh mục'
                      : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
