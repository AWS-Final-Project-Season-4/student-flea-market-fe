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
import { AdminCategoryDto } from '@/types/admin';

export default function AdminSettingsPage() {
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Category Management & Platform Rules
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Open, close, reorder, or create product categories synced directly with the backend database.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Feedback */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {noticeMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMsg}</span>
          </div>
          <button type="button" onClick={() => setNoticeMsg(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Category & Slug</th>
                <th className="py-3 px-4">Active / Hidden Items</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-amber-500" />
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No categories configured yet.
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => {
                  const isBusy = busyId === cat.id;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-600 w-5">
                            #{cat.order}
                          </span>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => void handleMove(idx, -1)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === categories.length - 1}
                            onClick={() => void handleMove(idx, 1)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{cat.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{cat.slug}</div>
                        {cat.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 max-w-md truncate">
                            {cat.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{cat.itemCount} live</span>
                        {cat.hiddenItemCount > 0 && (
                          <span className="text-slate-400"> • {cat.hiddenItemCount} hidden</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {cat.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                            Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                            title="Edit category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleToggleStatus(cat)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer disabled:opacity-50 ${
                              cat.isActive
                                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{cat.isActive ? 'Close' : 'Open'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || cat.itemCount > 0 || cat.hiddenItemCount > 0}
                            onClick={() => void handleDelete(cat)}
                            title={
                              cat.itemCount > 0 || cat.hiddenItemCount > 0
                                ? 'Only empty categories can be deleted'
                                : 'Delete category'
                            }
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
          <InfinityIcon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-bold text-amber-950">
            Marketplace Lifecycle Rule: Closing vs Deleting Categories
          </div>
          <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
            Closing a category prevents users from creating new listings under it while keeping existing
            public items visible. Deleting is permitted only when a category has zero items.
          </p>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === 'create' ? 'Create New Category' : 'Edit Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Order (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={catOrder}
                    onChange={(e) => setCatOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                {modalMode === 'create' && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>Open immediately</span>
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingModal}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingModal ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
