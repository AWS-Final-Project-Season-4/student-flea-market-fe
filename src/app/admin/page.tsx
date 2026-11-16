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
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { adminApi } from '@/lib/admin-api';
import { itemsApi } from '@/lib/items-api';
import {
  AdminCategoryDto,
  AdminSellerRequestDto,
  ModerationDashboardDto,
} from '@/types/admin';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

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
      {/* 1. TOP WELCOME BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live PostgreSQL Data • {user?.roleName || 'Admin'} Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.fullName || 'Administrator'}!
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Review pending seller applications, manage marketplace categories, monitor user accounts,
              and resolve moderation reports directly from live backend records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void loadDashboardData();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
            <Link
              href="/admin/listings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              <span>All Seller Requests</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. LIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Users
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalUsers.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              {dashboard?.bannedUserCount ?? 0} banned
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total accounts stored in database</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Live Listings
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalLiveItems.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {dashboard?.hiddenItemCount ?? 0} hidden
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Published items visible on marketplace</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pending Sellers
            </span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-950">
              {pendingSellers.length}
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {pendingSellers.length > 0 ? 'Needs approval' : 'All caught up'}
            </span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Accounts waiting for selling permission</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Moderation Reports
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {(dashboard?.pendingReportCount ?? 0) + (dashboard?.reviewingReportCount ?? 0)}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {dashboard?.resolvedReportCount ?? 0} resolved
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {dashboard?.pendingReportCount ?? 0} pending • {dashboard?.reviewingReportCount ?? 0} reviewing
          </p>
        </div>
      </div>

      {/* 3. PENDING SELLER REQUESTS QUEUE + CATEGORY SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Pending Seller Requests Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Pending Seller Applications
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                  {pendingSellers.length} pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Approve users so they can list items immediately on the marketplace
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-full sm:w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Applicant</th>
                  <th className="py-3 px-4">Contact / Profile</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-amber-500" />
                      Loading seller applications...
                    </td>
                  </tr>
                ) : filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">
                      {pendingSellers.length === 0
                        ? 'No pending seller requests right now.'
                        : 'No applications match your filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((req) => {
                    const isBusy = busyUserId === req.userId;
                    return (
                      <tr key={req.userId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-semibold text-slate-900">{req.fullName}</div>
                          <div className="text-[11px] text-slate-500">
                            {req.email}
                            {req.username ? ` • @${req.username}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-slate-800">
                            {req.phoneNumber || <span className="text-slate-400">No phone</span>}
                          </div>
                          {(req.schoolName || req.studentCode) && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {[req.schoolName, req.studentCode].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500">
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setRejectTarget(req);
                                setRejectReason('');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-medium text-xs transition cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
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

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredSellers.length} pending requests</span>
            <Link
              href="/admin/listings"
              className="font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Manage all sellers & items</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Categories Snapshot (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Categories Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {dashboard?.activeCategoryCount ?? categories.filter((c) => c.isActive).length}/
                {dashboard?.totalCategoryCount ?? categories.length} categories open
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Manage
            </Link>
          </div>

          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No categories found.</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => {
                const widthPct = Math.round((cat.itemCount / maxCatCount) * 100);
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-800 truncate">{cat.name}</span>
                        {!cat.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            Closed
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {cat.itemCount} items
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat.isActive ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(widthPct, cat.itemCount > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Voided invalid reviews: {dashboard?.voidedReviewCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reject Seller Request</h3>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Applicant: <strong>{rejectTarget.fullName}</strong> ({rejectTarget.email})
            </p>
            <form onSubmit={handleConfirmRejectSeller} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason (optional — shown to the applicant)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={500}
                  placeholder="E.g., Please add a contact phone number in your Profile first."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyUserId === rejectTarget.userId}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
