///////////////////////////////////////////////////////////
//                                                       //
//                  USER & ROLE MANAGEMENT               //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldPlus,
  Unlock,
  UserMinus,
  X,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { useAuthStore } from '@/lib/auth-store';
import { AdminUserDto, STANDARD_BAN_REASONS } from '@/types/admin';

type StatusFilter = 'ALL' | 1 | 2 | 3;

export default function AdminUsersPage() {
  const { user: currentStaff } = useAuthStore();
  const isCurrentAdmin = Boolean(
    currentStaff?.isAdmin || currentStaff?.roleName === 'Admin' || currentStaff?.role === 1
  );

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Ban Modal
  const [banTarget, setBanTarget] = useState<AdminUserDto | null>(null);
  const [banReason, setBanReason] = useState<string>(STANDARD_BAN_REASONS[0].value);

  useEffect(() => {
    let active = true;
    const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;

    adminApi
      .listUsers({ status: statusParam, page: 1, pageSize: 50 })
      .then((res) => {
        if (!active) return;
        setUsers(res.items);
        setTotalCount(res.totalCount);
        setErrorMsg(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load users.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [statusFilter]);

  const reloadUsers = async (filter: StatusFilter = statusFilter, keyword: string = searchTerm) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminApi.listUsers({
        status: filter === 'ALL' ? undefined : filter,
        keyword: keyword.trim() || undefined,
        page: 1,
        pageSize: 50,
      });
      setUsers(res.items);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reload users.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banTarget) return;

    const trimmed = banReason.trim();
    if (trimmed.length < 10) {
      setErrorMsg('Ban reason must be at least 10 characters.');
      return;
    }

    setBusyUserId(banTarget.id);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.banUser(banTarget.id, trimmed);
      setNoticeMsg(`Banned account "${banTarget.fullName}".`);
      setBanTarget(null);
      await reloadUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to ban user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleUnban = async (u: AdminUserDto) => {
    setBusyUserId(u.id);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.unbanUser(u.id);
      setNoticeMsg(`Unbanned account "${u.fullName}".`);
      await reloadUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to unban user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleModerator = async (u: AdminUserDto) => {
    const isMod = u.roleName === 'Moderator' || u.role === 3;
    const confirmed = window.confirm(
      isMod
        ? `Revoke Moderator role from "${u.fullName}"?`
        : `Assign Moderator role to "${u.fullName}"?`
    );
    if (!confirmed) return;

    setBusyUserId(u.id);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      if (isMod) {
        await adminApi.revokeModerator(u.id);
        setNoticeMsg(`Revoked Moderator role from "${u.fullName}".`);
      } else {
        await adminApi.assignModerator(u.id);
        setNoticeMsg(`Assigned Moderator role to "${u.fullName}".`);
      }
      await reloadUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update Moderator role.');
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.phoneNumber || '').toLowerCase().includes(q) ||
      (u.schoolName || '').toLowerCase().includes(q) ||
      (u.studentCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            User & Role Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live directory of registered accounts, seller status, ban controls, and Moderator role management.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 self-start sm:self-auto">
          Total in DB: {totalCount} accounts
        </span>
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, username, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(
            [
              { id: 'ALL', label: 'All Accounts' },
              { id: 1, label: 'Active' },
              { id: 2, label: 'Inactive' },
              { id: 3, label: 'Banned' },
            ] as const
          ).map((pill) => (
            <button
              key={String(pill.id)}
              type="button"
              onClick={() => {
                setIsLoading(true);
                setStatusFilter(pill.id);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void reloadUsers()}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 sm:px-6">Account</th>
                <th className="py-3 px-4">Contact / School</th>
                <th className="py-3 px-4">Role & Seller</th>
                <th className="py-3 px-4">Listings</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-amber-500" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isBusy = busyUserId === u.id;
                  const isAdminRow = u.roleName === 'Admin' || u.role === 1;
                  const isModRow = u.roleName === 'Moderator' || u.role === 3;
                  const isAiRow = u.roleName === 'AiService' || u.role === 2;
                  const canManageBan = !isAdminRow && !isAiRow && (!isModRow || isCurrentAdmin);
                  const canManageModRole = isCurrentAdmin && !isAdminRow && !isAiRow && !u.isBanned;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{u.fullName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {u.phoneNumber || <span className="text-slate-400">No phone</span>}
                        </div>
                        {(u.schoolName || u.studentCode) && (
                          <div className="text-[11px] text-slate-400">
                            {[u.schoolName, u.studentCode].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div>
                          {isAdminRow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </span>
                          ) : isModRow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              Moderator
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                              {u.roleName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Seller: {u.canSell ? 'Approved' : u.sellerStatusName || 'None'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800">
                        {u.itemCount} items
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {u.isBanned ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Banned
                            </span>
                            {u.banReason && (
                              <p
                                className="text-[10px] text-rose-600 max-w-[160px] truncate mt-1"
                                title={u.banReason}
                              >
                                {u.banReason}
                              </p>
                            )}
                          </div>
                        ) : u.status === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {canManageModRole && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleToggleModerator(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              {isModRow ? (
                                <>
                                  <UserMinus className="w-3 h-3" />
                                  <span>Revoke Mod</span>
                                </>
                              ) : (
                                <>
                                  <ShieldPlus className="w-3 h-3" />
                                  <span>Make Mod</span>
                                </>
                              )}
                            </button>
                          )}
                          {canManageBan &&
                            (u.isBanned ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleUnban(u)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Unban</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setBanTarget(u);
                                  setBanReason(STANDARD_BAN_REASONS[0].value);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Ban</span>
                              </button>
                            ))}
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

      {/* Ban Account Modal */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Ban User Account</h3>
              <button
                type="button"
                onClick={() => setBanTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Account: <strong>{banTarget.fullName}</strong> ({banTarget.email}). Banning revokes
              login sessions and seller access immediately.
            </p>
            <form onSubmit={handleConfirmBan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standard Violation Preset
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) setBanReason(e.target.value);
                  }}
                  defaultValue={STANDARD_BAN_REASONS[0].value}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50"
                >
                  {STANDARD_BAN_REASONS.map((preset) => (
                    <option key={preset.label} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ban Reason (10–500 characters) *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  maxLength={500}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBanTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyUserId === banTarget.id}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Confirm Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
