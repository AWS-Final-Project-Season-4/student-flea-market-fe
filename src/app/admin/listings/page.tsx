///////////////////////////////////////////////////////////
//                                                       //
//             SELLER APPROVALS & LIVE LISTINGS          //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShieldOff,
  UserCheck,
  X,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { itemsApi } from '@/lib/items-api';
import { DICTIONARY, useLanguageStore } from '@/lib/language-store';
import { AdminSellerRequestDto } from '@/types/admin';
import { ItemSummaryDto } from '@/types/item';
import { formatItemCodeDisplay } from '@/data/mock-items';

type ActiveTab = 'sellers' | 'items';
type SellerStatusFilter = 'ALL' | 1 | 2 | 3;

export default function AdminListingsPage() {
  const { language } = useLanguageStore();
  const isVi = language === 'vi';
  const [activeTab, setActiveTab] = useState<ActiveTab>('sellers');

  // Seller requests state
  const [sellerStatusFilter, setSellerStatusFilter] = useState<SellerStatusFilter>('ALL');
  const [sellerSearch, setSellerSearch] = useState<string>('');
  const [sellers, setSellers] = useState<AdminSellerRequestDto[]>([]);
  const [sellerTotal, setSellerTotal] = useState<number>(0);
  const [isLoadingSellers, setIsLoadingSellers] = useState<boolean>(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<AdminSellerRequestDto | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Live items state
  const [itemSearch, setItemSearch] = useState<string>('');
  const [items, setItems] = useState<ItemSummaryDto[]>([]);
  const [itemsTotal, setItemsTotal] = useState<number>(0);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const statusParam = sellerStatusFilter === 'ALL' ? undefined : sellerStatusFilter;

    adminApi
      .listSellerRequests({ status: statusParam, page: 1, pageSize: 50 })
      .then((res) => {
        if (!active) return;
        setSellers(res.items);
        setSellerTotal(res.totalCount);
        setErrorMsg(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load seller requests.');
      })
      .finally(() => {
        if (active) setIsLoadingSellers(false);
      });

    return () => {
      active = false;
    };
  }, [sellerStatusFilter]);

  useEffect(() => {
    let active = true;
    itemsApi
      .searchItems({ page: 1, pageSize: 50 })
      .then((res) => {
        if (!active) return;
        setItems(res.items || []);
        setItemsTotal(res.totalCount || 0);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load marketplace items.');
      })
      .finally(() => {
        if (active) setIsLoadingItems(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshSellers = async (filter: SellerStatusFilter = sellerStatusFilter) => {
    setIsLoadingSellers(true);
    setErrorMsg(null);
    try {
      const res = await adminApi.listSellerRequests({
        status: filter === 'ALL' ? undefined : filter,
        page: 1,
        pageSize: 50,
      });
      setSellers(res.items);
      setSellerTotal(res.totalCount);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to refresh seller requests.');
    } finally {
      setIsLoadingSellers(false);
    }
  };

  const refreshItems = async (keyword?: string) => {
    setIsLoadingItems(true);
    setErrorMsg(null);
    try {
      const res = await itemsApi.searchItems({
        keyword: keyword?.trim() || undefined,
        page: 1,
        pageSize: 50,
      });
      setItems(res.items || []);
      setItemsTotal(res.totalCount || 0);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to refresh marketplace items.');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleApprove = async (req: AdminSellerRequestDto) => {
    setBusyUserId(req.userId);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.approveSellerRequest(req.userId);
      setNoticeMsg(`Approved selling permission for "${req.fullName}".`);
      await refreshSellers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to approve seller request.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;

    setBusyUserId(rejectTarget.userId);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.rejectSellerRequest(
        rejectTarget.userId,
        rejectReason.trim() || undefined
      );
      setNoticeMsg(`Rejected seller application for "${rejectTarget.fullName}".`);
      setRejectTarget(null);
      setRejectReason('');
      await refreshSellers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reject seller request.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRevoke = async (req: AdminSellerRequestDto) => {
    const confirmed = window.confirm(
      `Revoke seller permission for "${req.fullName}"?\nNote: All active public listings by this user will be removed.`
    );
    if (!confirmed) return;

    setBusyUserId(req.userId);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.revokeSellerAccess(req.userId);
      setNoticeMsg(`Revoked seller access for "${req.fullName}".`);
      await Promise.all([refreshSellers(), refreshItems(itemSearch)]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to revoke seller access.');
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredSellers = sellers.filter((s) => {
    const q = sellerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.username || '').toLowerCase().includes(q) ||
      (s.phoneNumber || '').toLowerCase().includes(q) ||
      (s.schoolName || '').toLowerCase().includes(q) ||
      (s.studentCode || '').toLowerCase().includes(q)
    );
  });

  const filteredItems = items.filter((item) => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.itemCode.toLowerCase().includes(q) ||
      item.sellerName.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A211B] dark:text-stone-100">
            {isVi ? 'Duyệt Seller & Tin đang mở bán' : 'Seller Approvals & Live Listings'}
          </h2>
          <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-400 mt-1">
            {isVi
              ? 'Phê duyệt hoặc thu hồi quyền bán hàng, đồng thời theo dõi các món đồ thực tế đang hiển thị trên sàn.'
              : 'Approve or revoke user seller permissions, and inspect real items currently published on the marketplace.'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={isVi ? 'Chế độ xem quản trị' : 'Admin listing views'}
          className="inline-flex rounded-xl bg-[#F2EAE0] dark:bg-stone-900 p-1 border border-[#DFCEBA] dark:border-stone-800 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sellers'}
            onClick={() => setActiveTab('sellers')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'sellers'
                ? 'bg-white dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 shadow-xs'
                : 'text-[#6D5D52] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100'
            }`}
          >
            <UserCheck aria-hidden="true" className="w-3.5 h-3.5 text-[#8C6645] dark:text-[#F5A764]" />
            <span className="tabular-nums">
              {isVi ? 'Đơn mở quyền bán' : 'Seller Requests'} ({sellerTotal})
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'items'}
            onClick={() => setActiveTab('items')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'items'
                ? 'bg-white dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 shadow-xs'
                : 'text-[#6D5D52] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100'
            }`}
          >
            <Package aria-hidden="true" className="w-3.5 h-3.5 text-[#8C6645] dark:text-[#F5A764]" />
            <span className="tabular-nums">
              {isVi ? 'Tin đang bán' : 'Live Listings'} ({itemsTotal})
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
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

      {activeTab === 'sellers' ? (
        <>
          {/* Filter & Search */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <label htmlFor="admin-seller-search" className="sr-only">
                {isVi ? 'Tìm đơn đăng ký bán hàng' : 'Search seller applications'}
              </label>
              <Search aria-hidden="true" className="w-4 h-4 text-[#6D5D52] dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-seller-search"
                type="text"
                placeholder={
                  isVi
                    ? 'Tìm tên, email, username, SĐT...'
                    : 'Search by name, email, username, phone...'
                }
                value={sellerSearch}
                onChange={(e) => setSellerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 bg-[#FCF9F4] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 dark:focus:ring-[#F5A764]/40 focus:bg-white dark:focus:bg-stone-800"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {(
                [
                  { id: 'ALL', label: isVi ? 'Tất cả' : 'All' },
                  { id: 1, label: isVi ? 'Chờ duyệt' : 'Pending' },
                  { id: 2, label: isVi ? 'Đã duyệt' : 'Approved' },
                  { id: 3, label: isVi ? 'Từ chối' : 'Rejected' },
                ] as const
              ).map((pill) => (
                <button
                  key={String(pill.id)}
                  type="button"
                  aria-pressed={sellerStatusFilter === pill.id}
                  onClick={() => {
                    setIsLoadingSellers(true);
                    setSellerStatusFilter(pill.id);
                  }}
                  className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    sellerStatusFilter === pill.id
                      ? 'bg-[#DFCBB2] dark:bg-[#F5A764] text-[#2A211B] dark:text-stone-950 border border-[#CBB192] dark:border-[#F5A764] shadow-2xs'
                      : 'bg-[#F5EFE7] dark:bg-stone-800 text-[#5E4E42] dark:text-stone-300 hover:bg-[#EAE0D2] dark:hover:bg-stone-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void refreshSellers()}
                title={isVi ? 'Làm mới' : 'Refresh'}
                aria-label={isVi ? 'Làm mới đơn đăng ký' : 'Refresh seller applications'}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-[#DFCEBA] dark:border-stone-700 text-[#4E3F33] dark:text-stone-200 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
              >
                <RefreshCw aria-hidden="true" className={`w-4 h-4 ${isLoadingSellers ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Seller Requests Table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#3B2E24] dark:text-stone-200">
                <thead className="bg-[#FAF6F0] dark:bg-stone-800/80 text-[11px] font-semibold text-[#6D5D52] dark:text-stone-300 uppercase tracking-wider border-b border-[#EDE2D4] dark:border-stone-800">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">{isVi ? 'Tài khoản' : 'Account'}</th>
                    <th className="py-3 px-4">{isVi ? 'Liên hệ / Thông tin' : 'Contact / Optional Info'}</th>
                    <th className="py-3 px-4">{isVi ? 'Tin đăng' : 'Listings'}</th>
                    <th className="py-3 px-4">{isVi ? 'Mốc thời gian' : 'Timeline'}</th>
                    <th className="py-3 px-4">{isVi ? 'Trạng thái' : 'Status'}</th>
                    <th className="py-3 px-4 sm:px-6 text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2E9DD] dark:divide-stone-800">
                  {isLoadingSellers ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#6D5D52] dark:text-stone-400">
                        <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin inline mr-2 text-[#B5916B] dark:text-[#F5A764]" />
                        {isVi ? 'Đang tải danh sách đơn...' : 'Loading seller applications...'}
                      </td>
                    </tr>
                  ) : filteredSellers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#6D5D52] dark:text-stone-400">
                        {isVi
                          ? 'Không có đơn đăng ký nào theo bộ lọc hiện tại.'
                          : 'No seller requests found for the current filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSellers.map((req) => {
                      const isBusy = busyUserId === req.userId;
                      return (
                        <tr key={req.userId} className="hover:bg-[#FCF9F4] dark:hover:bg-stone-800/50 transition">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="font-semibold text-[#2A211B] dark:text-stone-100">{req.fullName}</div>
                            <div className="text-[11px] text-[#6D5D52] dark:text-stone-400">
                              {req.email}
                              {req.username ? ` • @${req.username}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#3B2E24] dark:text-stone-200 tabular-nums">
                              {req.phoneNumber || (
                                <span className="text-[#75675C] dark:text-stone-400">
                                  {isVi ? 'Chưa có SĐT' : 'No phone'}
                                </span>
                              )}
                            </div>
                            {(req.schoolName || req.studentCode) && (
                              <div className="text-[11px] text-[#6D5D52] dark:text-stone-400">
                                {[req.schoolName, req.studentCode].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#3B2E24] dark:text-stone-200 tabular-nums">
                            {req.itemCount} {isVi ? 'món' : 'items'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#6D5D52] dark:text-stone-400 space-y-0.5 tabular-nums">
                            {req.requestedAt && (
                              <div>
                                {isVi ? 'Gửi:' : 'Req:'}{' '}
                                {new Date(req.requestedAt).toLocaleString()}
                              </div>
                            )}
                            {req.approvedAt && (
                              <div className="text-emerald-700 dark:text-emerald-400">
                                {isVi ? 'Duyệt:' : 'Approved:'}{' '}
                                {new Date(req.approvedAt).toLocaleString()}
                              </div>
                            )}
                            {req.rejectionReason && (
                              <div
                                className="text-rose-600 dark:text-rose-400 max-w-[200px] truncate"
                                title={req.rejectionReason}
                              >
                                {isVi ? 'Lý do:' : 'Reason:'} {req.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {req.sellerStatus === 1 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 font-medium text-[11px]">
                                <Clock aria-hidden="true" className="w-3 h-3" />
                                {isVi ? 'Chờ duyệt' : 'Pending'}
                              </span>
                            )}
                            {req.sellerStatus === 2 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 font-medium text-[11px]">
                                <Check aria-hidden="true" className="w-3 h-3" />
                                {isVi ? 'Đã duyệt' : 'Approved'}
                              </span>
                            )}
                            {req.sellerStatus === 3 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 font-medium text-[11px]">
                                <X aria-hidden="true" className="w-3 h-3" />
                                {isVi ? 'Từ chối' : 'Rejected'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                            {(req.sellerStatus === 1 || req.sellerStatus === 3) && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleApprove(req)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                                >
                                  <Check aria-hidden="true" className="w-3.5 h-3.5" />
                                  <span>{isVi ? 'Duyệt' : 'Approve'}</span>
                                </button>
                                {req.sellerStatus === 1 && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      setRejectTarget(req);
                                      setRejectReason('');
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-rose-200 dark:border-rose-800/70 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                                  >
                                    <X aria-hidden="true" className="w-3.5 h-3.5" />
                                    <span>{isVi ? 'Từ chối' : 'Reject'}</span>
                                  </button>
                                )}
                              </div>
                            )}
                            {req.sellerStatus === 2 && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleRevoke(req)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-[#DFCEBA] dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800 text-[#5E4E42] dark:text-stone-200 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                              >
                                <ShieldOff aria-hidden="true" className="w-3.5 h-3.5" />
                                <span>{isVi ? 'Thu hồi' : 'Revoke'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Live Items Search */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <label htmlFor="admin-live-items-search" className="sr-only">
                {isVi ? 'Tìm tin đăng đang bán' : 'Search live listings'}
              </label>
              <Search aria-hidden="true" className="w-4 h-4 text-[#6D5D52] dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-live-items-search"
                type="text"
                placeholder={
                  isVi
                    ? 'Tìm tiêu đề, mã món, người bán, danh mục...'
                    : 'Search title, ItemCode, seller, category...'
                }
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 bg-[#FCF9F4] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 dark:focus:ring-[#F5A764]/40 focus:bg-white dark:focus:bg-stone-800"
              />
            </div>

            <button
              type="button"
              onClick={() => void refreshItems(itemSearch)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 text-xs font-semibold text-[#4E3F33] dark:text-stone-200 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
            >
              <RefreshCw aria-hidden="true" className={`w-3.5 h-3.5 ${isLoadingItems ? 'animate-spin' : ''}`} />
              <span>{isVi ? 'Làm mới tin đăng' : 'Refresh Listings'}</span>
            </button>
          </div>

          {/* Live Items Table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#3B2E24] dark:text-stone-200">
                <thead className="bg-[#FAF6F0] dark:bg-stone-800/80 text-[11px] font-semibold text-[#6D5D52] dark:text-stone-300 uppercase tracking-wider border-b border-[#EDE2D4] dark:border-stone-800">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">{isVi ? 'Món đồ & Mã' : 'Item & Code'}</th>
                    <th className="py-3 px-4">{isVi ? 'Người bán' : 'Seller'}</th>
                    <th className="py-3 px-4">{isVi ? 'Danh mục' : 'Category'}</th>
                    <th className="py-3 px-4">{isVi ? 'Giá' : 'Price'}</th>
                    <th className="py-3 px-4">{isVi ? 'Khu vực' : 'Location'}</th>
                    <th className="py-3 px-4">{isVi ? 'Trạng thái' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2E9DD] dark:divide-stone-800">
                  {isLoadingItems ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#6D5D52] dark:text-stone-400">
                        <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin inline mr-2 text-[#B5916B] dark:text-[#F5A764]" />
                        {isVi ? 'Đang tải danh sách món đồ...' : 'Loading live items...'}
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#6D5D52] dark:text-stone-400">
                        {isVi ? 'Chưa có món đồ nào đang bán.' : 'No live listings found in database.'}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FCF9F4] dark:hover:bg-stone-800/50 transition">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-semibold text-[#2A211B] dark:text-stone-100 line-clamp-1 max-w-xs">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#6D5D52] dark:text-stone-400 mt-0.5 flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#845938] dark:text-[#F5A764]">
                              {formatItemCodeDisplay(item.itemCode)}
                            </span>
                            <span>•</span>
                            <span>{item.conditionName}</span>
                            {item.isExchangeEnabled && (
                              <>
                                <span>•</span>
                                <span className="text-[#3E6A82] dark:text-sky-400 font-medium">
                                  {isVi ? 'Nhận trao đổi' : 'Exchangeable'}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#3B2E24] dark:text-stone-200">
                          {item.sellerName}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-[#F5EFE7] dark:bg-stone-800 text-[#5E452F] dark:text-[#F5A764] font-medium text-[11px]">
                            {DICTIONARY[language].categories[item.categorySlug as keyof typeof DICTIONARY.vi.categories] || item.categoryName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold tabular-nums text-[#7D5435] dark:text-[#F5A764]">
                          {item.price === 0
                            ? isVi
                              ? '0 đ (Tặng free)'
                              : '0 VND (Free)'
                            : `${item.price.toLocaleString('vi-VN')} VND`}
                        </td>
                        <td className="py-3.5 px-4 max-w-[180px] truncate text-[#6D5D52] dark:text-stone-400">
                          {item.location}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 font-medium text-[11px]">
                            {item.statusName || 'Available'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-listing-seller-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A211B]/40 dark:bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-[#E4D6C4] dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="reject-listing-seller-title" className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                {isVi ? 'Từ chối yêu cầu bán hàng' : 'Reject Seller Request'}
              </h3>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                aria-label={isVi ? 'Đóng hộp thoại' : 'Close dialog'}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#6D5D52] dark:text-stone-400 hover:text-[#3B2E24] dark:hover:text-stone-100 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6D5D52] dark:text-stone-300">
              {isVi ? 'Người gửi:' : 'Applicant:'} <strong className="text-[#2A211B] dark:text-stone-100">{rejectTarget.fullName}</strong> (
              {rejectTarget.email})
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label htmlFor="listings-reject-reason" className="block text-xs font-semibold text-[#3B2E24] dark:text-stone-200 mb-1">
                  {isVi ? 'Lý do từ chối (tùy chọn)' : 'Rejection Reason (optional)'}
                </label>
                <textarea
                  id="listings-reject-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={500}
                  placeholder={
                    isVi
                      ? 'VD: Vui lòng cập nhật số điện thoại liên hệ trước.'
                      : 'E.g., Please complete your contact phone number first.'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#DFCEBA] dark:border-stone-700 bg-[#FCF9F4] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 text-xs font-semibold text-[#4E3F33] dark:text-stone-200 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={busyUserId === rejectTarget.userId}
                  className="px-4 py-2 min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isVi ? 'Xác nhận từ chối' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
