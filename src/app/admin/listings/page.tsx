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
import { useLanguageStore } from '@/lib/language-store';
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A211B]">
            {isVi ? 'Duyệt Seller & Tin đang mở bán' : 'Seller Approvals & Live Listings'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6A5D] mt-1">
            {isVi
              ? 'Phê duyệt hoặc thu hồi quyền bán hàng, đồng thời theo dõi các món đồ thực tế đang hiển thị trên sàn.'
              : 'Approve or revoke user seller permissions, and inspect real items currently published on the marketplace.'}
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-[#F2EAE0] p-1 border border-[#DFCEBA] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('sellers')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'sellers'
                ? 'bg-white text-[#2A211B] shadow-xs'
                : 'text-[#6E5E52] hover:text-[#2A211B]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#8C6645]" />
            <span>
              {isVi ? 'Đơn mở quyền bán' : 'Seller Requests'} ({sellerTotal})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'items'
                ? 'bg-white text-[#2A211B] shadow-xs'
                : 'text-[#6E5E52] hover:text-[#2A211B]'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-[#8C6645]" />
            <span>
              {isVi ? 'Tin đang bán' : 'Live Listings'} ({itemsTotal})
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
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

      {activeTab === 'sellers' ? (
        <>
          {/* Filter & Search */}
          <div className="bg-white p-4 rounded-2xl border border-[#E7DAC9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#8B796B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  isVi
                    ? 'Tìm tên, email, username, SĐT...'
                    : 'Search by name, email, username, phone...'
                }
                value={sellerSearch}
                onChange={(e) => setSellerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DFCEBA] bg-[#FCF9F4] text-xs text-[#2A211B] focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 focus:bg-white"
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
                  onClick={() => {
                    setIsLoadingSellers(true);
                    setSellerStatusFilter(pill.id);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    sellerStatusFilter === pill.id
                      ? 'bg-[#DFCBB2] text-[#2A211B] border border-[#CBB192] shadow-2xs'
                      : 'bg-[#F5EFE7] text-[#5E4E42] hover:bg-[#EAE0D2]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void refreshSellers()}
                title={isVi ? 'Làm mới' : 'Refresh'}
                className="p-2 rounded-xl border border-[#DFCEBA] text-[#4E3F33] hover:bg-[#FAF6F0] cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingSellers ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Seller Requests Table */}
          <div className="bg-white rounded-2xl border border-[#E7DAC9] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#3B2E24]">
                <thead className="bg-[#FAF6F0] text-[11px] font-semibold text-[#6E5E52] uppercase tracking-wider border-b border-[#EDE2D4]">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">{isVi ? 'Tài khoản' : 'Account'}</th>
                    <th className="py-3 px-4">{isVi ? 'Liên hệ / Thông tin' : 'Contact / Optional Info'}</th>
                    <th className="py-3 px-4">{isVi ? 'Tin đăng' : 'Listings'}</th>
                    <th className="py-3 px-4">{isVi ? 'Mốc thời gian' : 'Timeline'}</th>
                    <th className="py-3 px-4">{isVi ? 'Trạng thái' : 'Status'}</th>
                    <th className="py-3 px-4 sm:px-6 text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2E9DD]">
                  {isLoadingSellers ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#8B796B]">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-[#B5916B]" />
                        {isVi ? 'Đang tải danh sách đơn...' : 'Loading seller applications...'}
                      </td>
                    </tr>
                  ) : filteredSellers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#8B796B]">
                        {isVi
                          ? 'Không có đơn đăng ký nào theo bộ lọc hiện tại.'
                          : 'No seller requests found for the current filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSellers.map((req) => {
                      const isBusy = busyUserId === req.userId;
                      return (
                        <tr key={req.userId} className="hover:bg-[#FCF9F4] transition">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="font-semibold text-[#2A211B]">{req.fullName}</div>
                            <div className="text-[11px] text-[#7A6A5D]">
                              {req.email}
                              {req.username ? ` • @${req.username}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#3B2E24]">
                              {req.phoneNumber || (
                                <span className="text-[#A39284]">
                                  {isVi ? 'Chưa có SĐT' : 'No phone'}
                                </span>
                              )}
                            </div>
                            {(req.schoolName || req.studentCode) && (
                              <div className="text-[11px] text-[#7A6A5D]">
                                {[req.schoolName, req.studentCode].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#3B2E24]">
                            {req.itemCount} {isVi ? 'món' : 'items'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#7A6A5D] space-y-0.5">
                            {req.requestedAt && (
                              <div>
                                {isVi ? 'Gửi:' : 'Req:'}{' '}
                                {new Date(req.requestedAt).toLocaleString()}
                              </div>
                            )}
                            {req.approvedAt && (
                              <div className="text-emerald-700">
                                {isVi ? 'Duyệt:' : 'Approved:'}{' '}
                                {new Date(req.approvedAt).toLocaleString()}
                              </div>
                            )}
                            {req.rejectionReason && (
                              <div
                                className="text-rose-600 max-w-[200px] truncate"
                                title={req.rejectionReason}
                              >
                                {isVi ? 'Lý do:' : 'Reason:'} {req.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {req.sellerStatus === 1 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
                                <Clock className="w-3 h-3" />
                                {isVi ? 'Chờ duyệt' : 'Pending'}
                              </span>
                            )}
                            {req.sellerStatus === 2 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                                <Check className="w-3 h-3" />
                                {isVi ? 'Đã duyệt' : 'Approved'}
                              </span>
                            )}
                            {req.sellerStatus === 3 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]">
                                <X className="w-3 h-3" />
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" />
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
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5" />
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
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#DFCEBA] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-[#5E4E42] font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
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
          <div className="bg-white p-4 rounded-2xl border border-[#E7DAC9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#8B796B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  isVi
                    ? 'Tìm tiêu đề, mã món, người bán, danh mục...'
                    : 'Search title, ItemCode, seller, category...'
                }
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DFCEBA] bg-[#FCF9F4] text-xs text-[#2A211B] focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() => void refreshItems(itemSearch)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DFCEBA] text-xs font-semibold text-[#4E3F33] hover:bg-[#FAF6F0] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingItems ? 'animate-spin' : ''}`} />
              <span>{isVi ? 'Làm mới tin đăng' : 'Refresh Listings'}</span>
            </button>
          </div>

          {/* Live Items Table */}
          <div className="bg-white rounded-2xl border border-[#E7DAC9] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#3B2E24]">
                <thead className="bg-[#FAF6F0] text-[11px] font-semibold text-[#6E5E52] uppercase tracking-wider border-b border-[#EDE2D4]">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">{isVi ? 'Món đồ & Mã' : 'Item & Code'}</th>
                    <th className="py-3 px-4">{isVi ? 'Người bán' : 'Seller'}</th>
                    <th className="py-3 px-4">{isVi ? 'Danh mục' : 'Category'}</th>
                    <th className="py-3 px-4">{isVi ? 'Giá' : 'Price'}</th>
                    <th className="py-3 px-4">{isVi ? 'Khu vực' : 'Location'}</th>
                    <th className="py-3 px-4">{isVi ? 'Trạng thái' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2E9DD]">
                  {isLoadingItems ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#8B796B]">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-[#B5916B]" />
                        {isVi ? 'Đang tải danh sách món đồ...' : 'Loading live items...'}
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#8B796B]">
                        {isVi ? 'Chưa có món đồ nào đang bán.' : 'No live listings found in database.'}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FCF9F4] transition">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-semibold text-[#2A211B] line-clamp-1 max-w-xs">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#7A6A5D] mt-0.5 flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#845938]">
                              {formatItemCodeDisplay(item.itemCode)}
                            </span>
                            <span>•</span>
                            <span>{item.conditionName}</span>
                            {item.isExchangeEnabled && (
                              <>
                                <span>•</span>
                                <span className="text-[#3E6A82] font-medium">
                                  {isVi ? 'Nhận trao đổi' : 'Exchangeable'}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#3B2E24]">
                          {item.sellerName}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-[#F5EFE7] text-[#5E452F] font-medium text-[11px]">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#7D5435]">
                          {item.price === 0
                            ? isVi
                              ? '0 đ (Tặng free)'
                              : '0 VND (Free)'
                            : `${item.price.toLocaleString('vi-VN')} VND`}
                        </td>
                        <td className="py-3.5 px-4 max-w-[180px] truncate text-[#7A6A5D]">
                          {item.location}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A211B]/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-[#E4D6C4] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2A211B]">
                {isVi ? 'Từ chối yêu cầu bán hàng' : 'Reject Seller Request'}
              </h3>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="text-[#8B796B] hover:text-[#3B2E24] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6E5E52]">
              {isVi ? 'Người gửi:' : 'Applicant:'} <strong>{rejectTarget.fullName}</strong> (
              {rejectTarget.email})
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B2E24] mb-1">
                  {isVi ? 'Lý do từ chối (tùy chọn)' : 'Rejection Reason (optional)'}
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={500}
                  placeholder={
                    isVi
                      ? 'VD: Vui lòng cập nhật số điện thoại liên hệ trước.'
                      : 'E.g., Please complete your contact phone number first.'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#DFCEBA] bg-[#FCF9F4] text-xs text-[#2A211B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-xl border border-[#DFCEBA] text-xs font-semibold text-[#4E3F33] hover:bg-[#FAF6F0] cursor-pointer"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={busyUserId === rejectTarget.userId}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
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
