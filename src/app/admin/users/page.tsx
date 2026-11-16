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
import { useLanguageStore } from '@/lib/language-store';
import { AdminUserDto, STANDARD_BAN_REASONS } from '@/types/admin';

type StatusFilter = 'ALL' | 1 | 2 | 3;

export default function AdminUsersPage() {
  const { user: currentStaff } = useAuthStore();
  const { language } = useLanguageStore();
  const isVi = language === 'vi';
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A211B]">
            {isVi ? 'Quản lý Người dùng & Phân quyền' : 'User & Role Management'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6A5D] mt-1">
            {isVi
              ? 'Danh sách tài khoản đã đăng ký, quyền bán hàng, khóa tài khoản và phân quyền Moderator.'
              : 'Live directory of registered accounts, seller status, ban controls, and Moderator role management.'}
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#EFE4D5] text-[#5E452F] border border-[#DECCB5] self-start sm:self-auto">
          {isVi ? `Tổng trong hệ thống: ${totalCount} tài khoản` : `Total in DB: ${totalCount} accounts`}
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
      <div className="bg-white p-4 rounded-2xl border border-[#E7DAC9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8B796B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              isVi
                ? 'Tìm tên, email, username, SĐT...'
                : 'Search name, email, username, phone...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DFCEBA] bg-[#FCF9F4] text-xs text-[#2A211B] focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(
            [
              { id: 'ALL', label: isVi ? 'Tất cả' : 'All Accounts' },
              { id: 1, label: isVi ? 'Hoạt động' : 'Active' },
              { id: 2, label: isVi ? 'Tạm ngưng' : 'Inactive' },
              { id: 3, label: isVi ? 'Đã khóa' : 'Banned' },
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
                  ? 'bg-[#DFCBB2] text-[#2A211B] border border-[#CBB192] shadow-2xs'
                  : 'bg-[#F5EFE7] text-[#5E4E42] hover:bg-[#EAE0D2]'
              }`}
            >
              {pill.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void reloadUsers()}
            title={isVi ? 'Làm mới' : 'Refresh'}
            className="p-2 rounded-xl border border-[#DFCEBA] text-[#4E3F33] hover:bg-[#FAF6F0] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#E7DAC9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3B2E24]">
            <thead className="bg-[#FAF6F0] text-[11px] font-semibold text-[#6E5E52] uppercase tracking-wider border-b border-[#EDE2D4]">
              <tr>
                <th className="py-3 px-4 sm:px-6">{isVi ? 'Tài khoản' : 'Account'}</th>
                <th className="py-3 px-4">{isVi ? 'Liên hệ / Trường' : 'Contact / School'}</th>
                <th className="py-3 px-4">{isVi ? 'Vai trò & Bán hàng' : 'Role & Seller'}</th>
                <th className="py-3 px-4">{isVi ? 'Tin đăng' : 'Listings'}</th>
                <th className="py-3 px-4">{isVi ? 'Trạng thái' : 'Status'}</th>
                <th className="py-3 px-4 sm:px-6 text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E9DD]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8B796B]">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-[#B5916B]" />
                    {isVi ? 'Đang tải danh sách người dùng...' : 'Loading users...'}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8B796B]">
                    {isVi ? 'Không tìm thấy tài khoản phù hợp.' : 'No matching user accounts found.'}
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
                    <tr key={u.id} className="hover:bg-[#FCF9F4] transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EFE4D5] border border-[#DECCB5] text-[#5E452F] font-bold flex items-center justify-center text-xs shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[#2A211B]">{u.fullName}</div>
                            <div className="text-[11px] text-[#8B796B] flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#3B2E24]">
                          {u.phoneNumber || (
                            <span className="text-[#A39284]">
                              {isVi ? 'Chưa có SĐT' : 'No phone'}
                            </span>
                          )}
                        </div>
                        {(u.schoolName || u.studentCode) && (
                          <div className="text-[11px] text-[#8B796B]">
                            {[u.schoolName, u.studentCode].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div>
                          {isAdminRow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFE2D0] text-[#5E412B] border border-[#DAC3A6] font-semibold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </span>
                          ) : isModRow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF3F6] text-[#35637D] border border-[#CBDCE5] font-semibold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              Moderator
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F5EFE7] text-[#5E4E42] font-medium text-[11px]">
                              {u.roleName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#7A6A5D]">
                          {isVi ? 'Bán hàng:' : 'Seller:'}{' '}
                          {u.canSell
                            ? isVi
                              ? 'Đã duyệt'
                              : 'Approved'
                            : u.sellerStatusName || (isVi ? 'Chưa đăng ký' : 'None')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#3B2E24]">
                        {u.itemCount} {isVi ? 'món' : 'items'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {u.isBanned ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {isVi ? 'Đã khóa' : 'Banned'}
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
                            {isVi ? 'Hoạt động' : 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
                            {isVi ? 'Tạm ngưng' : 'Inactive'}
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#DECCB5] bg-[#F5ECE0] hover:bg-[#EADBC8] text-[#5E412B] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              {isModRow ? (
                                <>
                                  <UserMinus className="w-3 h-3" />
                                  <span>{isVi ? 'Gỡ Mod' : 'Revoke Mod'}</span>
                                </>
                              ) : (
                                <>
                                  <ShieldPlus className="w-3 h-3" />
                                  <span>{isVi ? 'Cấp Mod' : 'Make Mod'}</span>
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
                                <span>{isVi ? 'Mở khóa' : 'Unban'}</span>
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
                                <span>{isVi ? 'Khóa' : 'Ban'}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A211B]/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-[#E4D6C4] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2A211B]">
                {isVi ? 'Khóa tài khoản người dùng' : 'Ban User Account'}
              </h3>
              <button
                type="button"
                onClick={() => setBanTarget(null)}
                className="text-[#8B796B] hover:text-[#3B2E24] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6E5E52]">
              {isVi ? 'Tài khoản:' : 'Account:'} <strong>{banTarget.fullName}</strong> (
              {banTarget.email}).{' '}
              {isVi
                ? 'Khóa tài khoản sẽ thu hồi phiên đăng nhập và quyền bán ngay lập tức.'
                : 'Banning revokes login sessions and seller access immediately.'}
            </p>
            <form onSubmit={handleConfirmBan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B2E24] mb-1">
                  {isVi ? 'Mẫu lý do vi phạm có sẵn' : 'Standard Violation Preset'}
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) setBanReason(e.target.value);
                  }}
                  defaultValue={STANDARD_BAN_REASONS[0].value}
                  className="w-full px-3 py-2 rounded-xl border border-[#DFCEBA] text-xs text-[#2A211B] bg-[#FCF9F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40"
                >
                  {STANDARD_BAN_REASONS.map((preset) => (
                    <option key={preset.label} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B2E24] mb-1">
                  {isVi ? 'Lý do khóa (10–500 ký tự) *' : 'Ban Reason (10–500 characters) *'}
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  maxLength={500}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DFCEBA] bg-[#FCF9F4] text-xs text-[#2A211B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBanTarget(null)}
                  className="px-4 py-2 rounded-xl border border-[#DFCEBA] text-xs font-semibold text-[#4E3F33] hover:bg-[#FAF6F0] cursor-pointer"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={busyUserId === banTarget.id}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isVi ? 'Xác nhận khóa' : 'Confirm Ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
