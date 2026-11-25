///////////////////////////////////////////////////////////
//                                                       //
//               ADMIN DASHBOARD OVERVIEW                //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle,
  Clock,
  FolderKanban,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { DICTIONARY, useLanguageStore } from '@/lib/language-store';
import { adminApi } from '@/lib/admin-api';
import { itemsApi } from '@/lib/items-api';
import {
  AdminCategoryDto,
  AdminSellerRequestDto,
  ModerationDashboardDto,
} from '@/types/admin';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const isVi = language === 'vi';

  const [dashboard, setDashboard] = useState<ModerationDashboardDto | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalLiveItems, setTotalLiveItems] = useState<number>(0);
  const [pendingSellers, setPendingSellers] = useState<AdminSellerRequestDto[]>([]);
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<AdminSellerRequestDto | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const fetchDashboardSnapshot = useCallback(async () => {
    const [dash, sellersRes, usersRes, itemsRes, cats] = await Promise.all([
      adminApi.getDashboard(),
      adminApi.listSellerRequests({ status: 1, page: 1, pageSize: 50 }),
      adminApi.listUsers({ page: 1, pageSize: 1 }),
      itemsApi.searchItems({ page: 1, pageSize: 1 }),
      adminApi.listCategories(),
    ]);
    return { dash, sellersRes, usersRes, itemsRes, cats };
  }, []);

  const loadDashboardData = useCallback(async () => {
    setErrorMsg(null);
    try {
      const { dash, sellersRes, usersRes, itemsRes, cats } = await fetchDashboardSnapshot();
      setDashboard(dash);
      setPendingSellers(sellersRes.items);
      setTotalUsers(usersRes.totalCount);
      setTotalLiveItems(itemsRes.totalCount);
      setCategories(cats);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDashboardSnapshot]);

  useEffect(() => {
    let active = true;
    fetchDashboardSnapshot()
      .then(({ dash, sellersRes, usersRes, itemsRes, cats }) => {
        if (!active) return;
        setDashboard(dash);
        setPendingSellers(sellersRes.items);
        setTotalUsers(usersRes.totalCount);
        setTotalLiveItems(itemsRes.totalCount);
        setCategories(cats);
        setErrorMsg(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load dashboard data.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchDashboardSnapshot]);

  const handleApproveSeller = async (req: AdminSellerRequestDto) => {
    setBusyUserId(req.userId);
    setErrorMsg(null);
    try {
      await adminApi.approveSellerRequest(req.userId);
      setActionNotice(`Approved seller access for "${req.fullName}" (${req.email}).`);
      await loadDashboardData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to approve seller request.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleConfirmRejectSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;

    setBusyUserId(rejectTarget.userId);
    setErrorMsg(null);
    try {
      await adminApi.rejectSellerRequest(
        rejectTarget.userId,
        rejectReason.trim() || undefined
      );
      setActionNotice(`Rejected seller request for "${rejectTarget.fullName}".`);
      setRejectTarget(null);
      setRejectReason('');
      await loadDashboardData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reject seller request.');
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredSellers = pendingSellers.filter((req) => {
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    return (
      req.fullName.toLowerCase().includes(q) ||
      req.email.toLowerCase().includes(q) ||
      (req.username || '').toLowerCase().includes(q) ||
      (req.schoolName || '').toLowerCase().includes(q) ||
      (req.phoneNumber || '').toLowerCase().includes(q)
    );
  });

  const maxCatCount = Math.max(1, ...categories.map((c) => c.itemCount));

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME BANNER - Soft Warm Beige / Dark Stone */}
      <div className="bg-gradient-to-r from-[#F6EFE6] via-[#EFE4D6] to-[#E7D8C5] dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 border border-[#DECBB3] dark:border-stone-800 rounded-3xl p-6 sm:p-8 text-[#2A211B] dark:text-stone-100 shadow-sm dark:shadow-none relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-[#D8BA98]/25 dark:bg-[#F5A764]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-white/50 dark:bg-stone-700/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2A211B] dark:text-stone-100">
              {isVi
                ? `Chào mừng trở lại, ${user?.fullName || 'Quản trị viên'}!👋`
                : `Welcome back, ${user?.fullName || 'Administrator'}!👋`}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void loadDashboardData();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/85 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 text-[#3B2E24] dark:text-stone-100 border border-[#DECBB3] dark:border-stone-700 font-semibold text-xs sm:text-sm transition cursor-pointer shadow-2xs"
            >
              <RefreshCw aria-hidden="true" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isVi ? 'Làm mới dữ liệu' : 'Refresh Data'}</span>
            </button>
            <Link
              href="/admin/listings"
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#DFCBB2] dark:bg-[#F5A764] hover:bg-[#D2BA9B] dark:hover:bg-[#E89650] text-[#2A211B] dark:text-stone-950 border border-[#C9AE8B] dark:border-[#F5A764] font-bold text-xs sm:text-sm shadow-2xs transition shrink-0"
            >
              <UserCheck aria-hidden="true" className="w-4 h-4 text-[#4A3525] dark:text-stone-950" />
              <span>{isVi ? 'Tất cả đơn đăng ký bán hàng' : 'All Seller Requests'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Notifications */}
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
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionNotice && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            aria-label={isVi ? 'Đóng thông báo' : 'Dismiss notification'}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. LIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6D5D52] dark:text-stone-400 uppercase tracking-wider">
              {isVi ? 'Tài khoản đã đăng ký' : 'Registered Users'}
            </span>
            <div className="p-2.5 rounded-xl bg-[#EDF3F6] dark:bg-sky-950/60 text-[#3E6A82] dark:text-sky-300">
              <Users aria-hidden="true" className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[#2A211B] dark:text-stone-100">
              {totalUsers.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
              {dashboard?.bannedUserCount ?? 0} {isVi ? 'bị khóa' : 'banned'}
            </span>
          </div>
          <p className="text-[11px] text-[#6D5D52] dark:text-stone-400 mt-1">
            {isVi ? 'Tổng số tài khoản trong cơ sở dữ liệu' : 'Total accounts stored in database'}
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6D5D52] dark:text-stone-400 uppercase tracking-wider">
              {isVi ? 'Tin đang hiển thị' : 'Live Listings'}
            </span>
            <div className="p-2.5 rounded-xl bg-[#F4ECE1] dark:bg-stone-800 text-[#845938] dark:text-[#F5A764]">
              <Package aria-hidden="true" className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[#2A211B] dark:text-stone-100">
              {totalLiveItems.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-[#6D5D52] dark:text-stone-300 bg-[#F5EFE7] dark:bg-stone-800 px-2 py-0.5 rounded-full">
              {dashboard?.hiddenItemCount ?? 0} {isVi ? 'đã ẩn' : 'hidden'}
            </span>
          </div>
          <p className="text-[11px] text-[#6D5D52] dark:text-stone-400 mt-1">
            {isVi ? 'Món đồ đang mở bán trên sàn' : 'Published items visible on marketplace'}
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-[#E7DAC9] dark:border-stone-800 bg-gradient-to-br from-white to-[#FAF4EB] dark:from-stone-900 dark:to-stone-900 shadow-xs dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7A563A] dark:text-[#F5A764] uppercase tracking-wider">
              {isVi ? 'Seller chờ duyệt' : 'Pending Sellers'}
            </span>
            <div className="p-2.5 rounded-xl bg-[#EFE4D5] dark:bg-amber-950/60 text-[#855A3C] dark:text-amber-300">
              <Clock aria-hidden="true" className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[#2A211B] dark:text-stone-100">
              {pendingSellers.length}
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                pendingSellers.length > 0
                  ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70'
                  : 'text-[#6B482C] dark:text-stone-300 bg-[#EFE4D5] dark:bg-stone-800'
              }`}
            >
              {pendingSellers.length > 0
                ? isVi
                  ? 'Cần xét duyệt'
                  : 'Needs approval'
                : isVi
                  ? 'Đã duyệt hết'
                  : 'All caught up'}
            </span>
          </div>
          <p className="text-[11px] text-[#6D5D52] dark:text-stone-400 mt-1">
            {isVi ? 'Tài khoản đang đợi cấp quyền đăng bán' : 'Accounts waiting for selling permission'}
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6D5D52] dark:text-stone-400 uppercase tracking-wider">
              {isVi ? 'Báo cáo vi phạm' : 'Moderation Reports'}
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle aria-hidden="true" className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[#2A211B] dark:text-stone-100">
              {(dashboard?.pendingReportCount ?? 0) + (dashboard?.reviewingReportCount ?? 0)}
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              {dashboard?.resolvedReportCount ?? 0} {isVi ? 'đã xử lý' : 'resolved'}
            </span>
          </div>
          <p className="text-[11px] text-[#6D5D52] dark:text-stone-400 mt-1 tabular-nums">
            {dashboard?.pendingReportCount ?? 0} {isVi ? 'chờ xử lý' : 'pending'} •{' '}
            {dashboard?.reviewingReportCount ?? 0} {isVi ? 'đang xem xét' : 'reviewing'}
          </p>
        </div>
      </div>

      {/* 3. PENDING SELLER REQUESTS QUEUE + CATEGORY SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Pending Seller Requests Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-2xl border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#EFE5D8] dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#2A211B] dark:text-stone-100">
                  {isVi ? 'Hồ sơ xin mở quyền bán hàng' : 'Pending Seller Applications'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFE4D5] dark:bg-stone-800 text-[#6B482C] dark:text-[#F5A764] font-bold text-xs tabular-nums">
                  {pendingSellers.length} {isVi ? 'chờ duyệt' : 'pending'}
                </span>
              </div>
              <p className="text-xs text-[#6D5D52] dark:text-stone-400 mt-1">
                {isVi
                  ? 'Duyệt tài khoản để người dùng có thể đăng bán đồ ngay lập tức'
                  : 'Approve users so they can list items immediately on the marketplace'}
              </p>
            </div>

            <div className="relative">
              <label htmlFor="admin-overview-seller-search" className="sr-only">
                {isVi ? 'Tìm hồ sơ theo tên, email, SĐT' : 'Search pending seller applications'}
              </label>
              <Search aria-hidden="true" className="w-4 h-4 text-[#6D5D52] dark:text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-overview-seller-search"
                type="text"
                placeholder={isVi ? 'Tìm tên, email, SĐT...' : 'Search name, email, phone...'}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-9 pr-4 py-2 min-h-[40px] text-xs rounded-xl border border-[#DFCEBA] dark:border-stone-700 bg-[#FCF9F4] dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 dark:focus:ring-[#F5A764]/40 w-full sm:w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#3B2E24] dark:text-stone-200">
              <thead className="bg-[#FAF6F0] dark:bg-stone-800/80 text-[11px] font-semibold text-[#6D5D52] dark:text-stone-300 uppercase tracking-wider border-b border-[#EDE2D4] dark:border-stone-800">
                <tr>
                  <th className="py-3 px-4 sm:px-6">{isVi ? 'Người đăng ký' : 'Applicant'}</th>
                  <th className="py-3 px-4">{isVi ? 'Liên hệ / Hồ sơ' : 'Contact / Profile'}</th>
                  <th className="py-3 px-4">{isVi ? 'Thời gian gửi' : 'Requested At'}</th>
                  <th className="py-3 px-4 sm:px-6 text-right">{isVi ? 'Thao tác' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2E9DD] dark:divide-stone-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[#6D5D52] dark:text-stone-400">
                      <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin inline mr-2 text-[#B5916B] dark:text-[#F5A764]" />
                      {isVi ? 'Đang tải hồ sơ...' : 'Loading seller applications...'}
                    </td>
                  </tr>
                ) : filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[#6D5D52] dark:text-stone-400">
                      {pendingSellers.length === 0
                        ? isVi
                          ? 'Hiện chưa có yêu cầu mở quyền bán nào.'
                          : 'No pending seller requests right now.'
                        : isVi
                          ? 'Không tìm thấy hồ sơ khớp bộ lọc.'
                          : 'No applications match your filter.'}
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
                          <div className="text-xs text-[#3B2E24] dark:text-stone-200 tabular-nums">
                            {req.phoneNumber || (
                              <span className="text-[#75675C] dark:text-stone-400">
                                {isVi ? 'Chưa có SĐT' : 'No phone'}
                              </span>
                            )}
                          </div>
                          {(req.schoolName || req.studentCode) && (
                            <div className="text-[11px] text-[#6D5D52] dark:text-stone-400 truncate max-w-[200px]">
                              {[req.schoolName, req.studentCode].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#6D5D52] dark:text-stone-400 tabular-nums">
                          {req.requestedAt
                            ? new Date(req.requestedAt).toLocaleString()
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleApproveSeller(req)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              <Check aria-hidden="true" className="w-3.5 h-3.5" />
                              <span>{isVi ? 'Duyệt' : 'Approve'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setRejectTarget(req);
                                setRejectReason('');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg border border-[#DFCEBA] dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800 text-[#4E3F33] dark:text-stone-200 font-medium text-xs transition cursor-pointer disabled:opacity-50"
                            >
                              <X aria-hidden="true" className="w-3.5 h-3.5" />
                              <span>{isVi ? 'Từ chối' : 'Reject'}</span>
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

          <div className="p-4 bg-[#FAF6F0] dark:bg-stone-800/60 border-t border-[#EDE2D4] dark:border-stone-800 flex items-center justify-between text-xs text-[#6D5D52] dark:text-stone-400">
            <span className="tabular-nums">
              {isVi
                ? `Đang hiển thị ${filteredSellers.length} yêu cầu chờ duyệt`
                : `Showing ${filteredSellers.length} pending requests`}
            </span>
            <Link
              href="/admin/listings"
              className="font-semibold text-[#845938] hover:text-[#5F3D23] dark:text-[#F5A764] dark:hover:text-[#FBD6B0] flex items-center gap-1"
            >
              <span>{isVi ? 'Quản lý toàn bộ Seller & Tin đăng' : 'Manage all sellers & items'}</span>
              <ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Categories Snapshot (1 col) */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                {isVi ? 'Tổng quan danh mục' : 'Categories Overview'}
              </h3>
              <p className="text-xs text-[#6D5D52] dark:text-stone-400 mt-0.5 tabular-nums">
                {dashboard?.activeCategoryCount ?? categories.filter((c) => c.isActive).length}/
                {dashboard?.totalCategoryCount ?? categories.length}{' '}
                {isVi ? 'danh mục đang mở' : 'categories open'}
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="text-xs font-semibold text-[#845938] hover:text-[#5F3D23] dark:text-[#F5A764] dark:hover:text-[#FBD6B0] inline-flex items-center gap-1"
            >
              <FolderKanban aria-hidden="true" className="w-3.5 h-3.5" />
              {isVi ? 'Quản lý' : 'Manage'}
            </Link>
          </div>

          {categories.length === 0 ? (
            <p className="text-xs text-[#6D5D52] dark:text-stone-400 py-4 text-center">
              {isVi ? 'Chưa có danh mục nào.' : 'No categories found.'}
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => {
                const widthPct = Math.round((cat.itemCount / maxCatCount) * 100);
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-[#3B2E24] dark:text-stone-200 truncate">
                          {DICTIONARY[language].categories[cat.slug as keyof typeof DICTIONARY.vi.categories] || cat.name}
                        </span>
                        {!cat.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5EFE7] dark:bg-stone-800 text-[#6D5D52] dark:text-stone-400">
                            {isVi ? 'Đã đóng' : 'Closed'}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[#2A211B] dark:text-stone-100 shrink-0 tabular-nums">
                        {cat.itemCount} {isVi ? 'món' : 'items'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F3ECE2] dark:bg-stone-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat.isActive ? 'bg-[#C4A17D] dark:bg-[#F5A764]' : 'bg-[#CFC3B6] dark:bg-stone-600'
                        }`}
                        style={{ width: `${Math.max(widthPct, cat.itemCount > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-[#EFE5D8] dark:border-stone-800 text-[11px] text-[#6D5D52] dark:text-stone-400 flex items-center gap-1.5 tabular-nums">
            <ShieldCheck aria-hidden="true" className="w-4 h-4 text-[#8C6645] dark:text-[#F5A764] shrink-0" />
            <span>
              {isVi ? 'Đánh giá không hợp lệ đã hủy:' : 'Voided invalid reviews:'}{' '}
              {dashboard?.voidedReviewCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-seller-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A211B]/40 dark:bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-[#E4D6C4] dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="reject-seller-modal-title" className="text-base font-bold text-[#2A211B] dark:text-stone-100">
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
            <form onSubmit={handleConfirmRejectSeller} className="space-y-4">
              <div>
                <label htmlFor="reject-seller-reason" className="block text-xs font-semibold text-[#3B2E24] dark:text-stone-200 mb-1">
                  {isVi ? 'Lý do (tùy chọn — hiển thị cho người dùng)' : 'Reason (optional — shown to the applicant)'}
                </label>
                <textarea
                  id="reject-seller-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={500}
                  placeholder={
                    isVi
                      ? 'VD: Vui lòng cập nhật số điện thoại liên hệ trong Hồ sơ trước.'
                      : 'E.g., Please add a contact phone number in your Profile first.'
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
