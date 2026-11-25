///////////////////////////////////////////////////////////
//                                                       //
//             REPORTS & MODERATION RESOLUTION           //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Flag,
  Loader2,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { useLanguageStore } from '@/lib/language-store';
import { ModerationReportDto } from '@/types/admin';

type ReportStatusFilter = 'ALL' | 1 | 2 | 3 | 4;

const RESOLVE_ACTIONS: Array<{
  id: string;
  labelEn: string;
  labelVi: string;
  descEn: string;
  descVi: string;
  exclusive?: boolean;
}> = [
  {
    id: 'hide_item',
    labelEn: 'Hide Listing',
    labelVi: 'Ẩn tin đăng',
    descEn: 'Remove the reported listing from public search.',
    descVi: 'Gỡ tin đăng bị báo cáo khỏi danh sách tìm kiếm công khai.',
  },
  {
    id: 'revoke_seller',
    labelEn: 'Revoke Seller Access',
    labelVi: 'Thu hồi quyền bán hàng',
    descEn: 'Remove seller permission of reported user.',
    descVi: 'Thu hồi quyền đăng bán của người dùng bị báo cáo.',
  },
  {
    id: 'ban_user',
    labelEn: 'Ban Reported User',
    labelVi: 'Khóa tài khoản vi phạm',
    descEn: 'Ban account and terminate active sessions.',
    descVi: 'Khóa vĩnh viễn tài khoản và hủy toàn bộ phiên đăng nhập.',
  },
  {
    id: 'void_review',
    labelEn: 'Void Review',
    labelVi: 'Hủy đánh giá không hợp lệ',
    descEn: 'Invalidate biased review from this transaction.',
    descVi: 'Vô hiệu hóa đánh giá sai lệch liên quan giao dịch này.',
  },
  {
    id: 'none',
    labelEn: 'Confirm Violation Only',
    labelVi: 'Xác nhận vi phạm (không phạt thêm)',
    descEn: 'Mark valid without extra penalty.',
    descVi: 'Ghi nhận báo cáo hợp lệ mà không áp thêm hình phạt.',
  },
  {
    id: 'reject',
    labelEn: 'Reject Report (Dismiss)',
    labelVi: 'Bác bỏ báo cáo',
    descEn: 'No violation found — cannot combine with others.',
    descVi: 'Không phát hiện vi phạm — không thể chọn kèm hành động khác.',
    exclusive: true,
  },
];

export default function AdminReportsPage() {
  const { language } = useLanguageStore();
  const isVi = language === 'vi';
  const [reports, setReports] = useState<ModerationReportDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Resolve modal state
  const [resolveTarget, setResolveTarget] = useState<ModerationReportDto | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>(['none']);
  const [adminNote, setAdminNote] = useState<string>('');

  useEffect(() => {
    let active = true;
    const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;

    adminApi
      .listReports({ status: statusParam, page: 1, pageSize: 50 })
      .then((res) => {
        if (!active) return;
        setReports(res.items);
        setTotalCount(res.totalCount);
        setErrorMsg(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load reports.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [statusFilter]);

  const reloadReports = async (filter: ReportStatusFilter = statusFilter) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminApi.listReports({
        status: filter === 'ALL' ? undefined : filter,
        page: 1,
        pageSize: 50,
      });
      setReports(res.items);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to refresh reports.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkReviewing = async (rpt: ModerationReportDto) => {
    setBusyId(rpt.id);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.markReportReviewing(rpt.id);
      setNoticeMsg('Report marked as Reviewing.');
      await reloadReports();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to mark report as reviewing.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleAction = (actionId: string) => {
    if (actionId === 'reject') {
      setSelectedActions(['reject']);
      return;
    }

    setSelectedActions((prev) => {
      const withoutReject = prev.filter((a) => a !== 'reject');
      if (withoutReject.includes(actionId)) {
        return withoutReject.filter((a) => a !== actionId);
      }
      return [...withoutReject, actionId];
    });
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTarget) return;

    if (selectedActions.length === 0) {
      setErrorMsg('Please choose at least one moderation action.');
      return;
    }

    setBusyId(resolveTarget.id);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await adminApi.resolveReport(resolveTarget.id, {
        actions: selectedActions,
        adminNote: adminNote.trim() || undefined,
      });
      setNoticeMsg('Report resolved successfully.');
      setResolveTarget(null);
      setAdminNote('');
      setSelectedActions(['none']);
      await reloadReports();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to resolve report.');
    } finally {
      setBusyId(null);
    }
  };

  const getStatusBadge = (rpt: ModerationReportDto) => {
    if (rpt.status === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70">
          <Clock aria-hidden="true" className="w-3 h-3" />
          {isVi ? 'Chờ xử lý' : 'Pending'}
        </span>
      );
    }
    if (rpt.status === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/70">
          <Eye aria-hidden="true" className="w-3 h-3" />
          {isVi ? 'Đang xem xét' : 'Reviewing'}
        </span>
      );
    }
    if (rpt.status === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
          <CheckCircle aria-hidden="true" className="w-3 h-3" />
          {isVi ? 'Đã xử lý' : 'Resolved'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F5EFE7] dark:bg-stone-800 text-[#6D5D52] dark:text-stone-300">
        {isVi ? 'Đã bác bỏ' : 'Dismissed'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A211B] dark:text-stone-100">
            {isVi ? 'Báo cáo & Xử lý vi phạm' : 'Reports & Moderation Violations'}
          </h2>
          <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-400 mt-1">
            {isVi
              ? 'Xem xét báo cáo vi phạm từ người dùng, kiểm tra bằng chứng và áp dụng biện pháp xử lý.'
              : 'Review real user violation reports, investigate evidence, and apply moderation actions.'}
          </p>
        </div>

        <span className="text-xs font-semibold tabular-nums px-3 py-1.5 rounded-xl bg-[#EFE4D5] dark:bg-stone-800 text-[#5E452F] dark:text-[#F5A764] border border-[#DECCB5] dark:border-stone-700 self-start sm:self-auto">
          {isVi ? `Tổng cộng: ${totalCount} báo cáo` : `Total: ${totalCount} reports`}
        </span>
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

      {/* Filter Pills */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'ALL', label: isVi ? 'Tất cả' : 'All' },
              { id: 1, label: isVi ? 'Chờ xử lý' : 'Pending' },
              { id: 2, label: isVi ? 'Đang xem xét' : 'Reviewing' },
              { id: 3, label: isVi ? 'Đã xử lý' : 'Resolved' },
              { id: 4, label: isVi ? 'Đã bác bỏ' : 'Dismissed' },
            ] as const
          ).map((pill) => (
            <button
              key={String(pill.id)}
              type="button"
              aria-pressed={statusFilter === pill.id}
              onClick={() => {
                setIsLoading(true);
                setStatusFilter(pill.id);
              }}
              className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-[#DFCBB2] dark:bg-[#F5A764] text-[#2A211B] dark:text-stone-950 border border-[#CBB192] dark:border-[#F5A764] shadow-2xs'
                  : 'bg-[#F5EFE7] dark:bg-stone-800 text-[#5E4E42] dark:text-stone-300 hover:bg-[#EAE0D2] dark:hover:bg-stone-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void reloadReports()}
          className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 text-xs font-semibold text-[#4E3F33] dark:text-stone-200 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
        </button>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 border border-[#E7DAC9] dark:border-stone-800 text-center text-xs text-[#6D5D52] dark:text-stone-400">
          <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin inline mr-2 text-[#B5916B] dark:text-[#F5A764]" />
          {isVi ? 'Đang tải danh sách báo cáo...' : 'Loading moderation reports...'}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 border border-dashed border-[#DFCEBA] dark:border-stone-700 text-center space-y-2">
          <Flag aria-hidden="true" className="w-8 h-8 text-[#C9B7A2] dark:text-stone-500 mx-auto" />
          <p className="text-sm font-semibold text-[#3B2E24] dark:text-stone-200">
            {isVi ? 'Chưa có báo cáo vi phạm nào' : 'No moderation reports found'}
          </p>
          <p className="text-xs text-[#6D5D52] dark:text-stone-400">
            {isVi
              ? 'Các báo cáo do người dùng gửi về món đồ hoặc tài khoản vi phạm sẽ tự động xuất hiện tại đây.'
              : 'Submitted user reports will appear here automatically once users report a listing, user, or transaction.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((rpt) => {
            const isBusy = busyId === rpt.id;
            const isOpen = rpt.status === 1 || rpt.status === 2;
            return (
              <div
                key={rpt.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-[#E7DAC9] dark:border-stone-800 shadow-xs dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                      {rpt.reasonName}
                    </span>
                    {getStatusBadge(rpt)}
                    <span className="text-xs text-[#6D5D52] dark:text-stone-400 tabular-nums">
                      • {new Date(rpt.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-[#2A211B] dark:text-stone-100 text-sm">
                    {rpt.itemTitle
                      ? `${isVi ? 'Món đồ:' : 'Item:'} ${rpt.itemTitle}${rpt.itemCode ? ` (${rpt.itemCode})` : ''}`
                      : rpt.reportedUserName
                        ? `${isVi ? 'Người dùng:' : 'User:'} ${rpt.reportedUserName}`
                        : `${isVi ? 'Báo cáo' : 'Report'} #${rpt.id.slice(0, 8)}`}
                  </h4>

                  <p className="text-xs text-[#4E3F33] dark:text-stone-200 bg-[#FAF6F0] dark:bg-stone-800 p-2.5 rounded-xl border border-[#EDE2D4] dark:border-stone-700">
                    <strong className="text-[#2A211B] dark:text-stone-100">{isVi ? 'Chi tiết:' : 'Details:'}</strong>{' '}
                    {rpt.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-[11px] text-[#6D5D52] dark:text-stone-400">
                    <span>
                      {isVi ? 'Người báo cáo:' : 'Reporter:'}{' '}
                      <strong className="text-[#3B2E24] dark:text-stone-200">{rpt.reporterName}</strong>
                    </span>
                    {rpt.reportedUserName && (
                      <span>
                        {isVi ? 'Người bị báo cáo:' : 'Reported User:'}{' '}
                        <strong className="text-[#3B2E24] dark:text-stone-200">{rpt.reportedUserName}</strong>
                      </span>
                    )}
                    {rpt.resolvedByName && (
                      <span>
                        {isVi ? 'Người xử lý:' : 'Handled by:'}{' '}
                        <strong className="text-[#3B2E24] dark:text-stone-200">{rpt.resolvedByName}</strong>
                      </span>
                    )}
                  </div>

                  {rpt.adminNote && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/70">
                      <strong>{isVi ? 'Ghi chú xử lý:' : 'Staff Note:'}</strong> {rpt.adminNote}
                    </p>
                  )}
                </div>

                {isOpen && (
                  <div className="flex items-center gap-2 shrink-0">
                    {rpt.status === 1 && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleMarkReviewing(rpt)}
                        className="px-3 py-2 min-h-[38px] rounded-xl border border-blue-200 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {isVi ? 'Đang xem xét' : 'Mark Reviewing'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setResolveTarget(rpt);
                        setSelectedActions(['none']);
                        setAdminNote('');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-xl bg-[#DFCBB2] dark:bg-[#F5A764] hover:bg-[#D2BA9B] dark:hover:bg-[#E89650] text-[#2A211B] dark:text-stone-950 border border-[#C9AE8B] dark:border-[#F5A764] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      <ShieldAlert aria-hidden="true" className="w-3.5 h-3.5 text-[#4A3525] dark:text-stone-950" />
                      <span>{isVi ? 'Xử lý' : 'Resolve'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Report Modal */}
      {resolveTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolve-report-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A211B]/40 dark:bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-[#E4D6C4] dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="resolve-report-modal-title" className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                {isVi ? 'Xử lý báo cáo vi phạm' : 'Resolve Moderation Report'}
              </h3>
              <button
                type="button"
                onClick={() => setResolveTarget(null)}
                aria-label={isVi ? 'Đóng hộp thoại' : 'Close dialog'}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#6D5D52] dark:text-stone-400 hover:text-[#3B2E24] dark:hover:text-stone-100 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div className="space-y-2">
                <div className="block text-xs font-semibold text-[#3B2E24] dark:text-stone-200">
                  {isVi ? 'Chọn biện pháp xử lý' : 'Select Action(s)'}
                </div>
                {RESOLVE_ACTIONS.map((act) => {
                  const checked = selectedActions.includes(act.id);
                  return (
                    <label
                      key={act.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        checked
                          ? 'border-[#C5A27D] dark:border-[#F5A764] bg-[#FAF4EB] dark:bg-stone-800'
                          : 'border-[#DFCEBA] dark:border-stone-700 hover:bg-[#FCF9F4] dark:hover:bg-stone-800/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAction(act.id)}
                        className="mt-0.5 rounded accent-[#A8825D] dark:accent-[#F5A764]"
                      />
                      <div>
                        <div className="font-semibold text-[#2A211B] dark:text-stone-100">
                          {isVi ? act.labelVi : act.labelEn}
                        </div>
                        <div className="text-[11px] text-[#6D5D52] dark:text-stone-400">
                          {isVi ? act.descVi : act.descEn}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div>
                <label htmlFor="report-admin-note" className="block text-xs font-semibold text-[#3B2E24] dark:text-stone-200 mb-1">
                  {isVi ? 'Ghi chú của Admin (tùy chọn)' : 'Admin Note (optional)'}
                </label>
                <textarea
                  id="report-admin-note"
                  rows={2}
                  maxLength={1000}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={
                    isVi
                      ? 'Ghi chú tóm tắt hiển thị cho người báo cáo...'
                      : 'Summary note shown to reporter...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#DFCEBA] dark:border-stone-700 bg-[#FCF9F4] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 focus:bg-white dark:focus:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#C5A27D]/40 dark:focus:ring-[#F5A764]/40"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolveTarget(null)}
                  className="px-4 py-2 min-h-[40px] rounded-xl border border-[#DFCEBA] dark:border-stone-700 text-xs font-semibold text-[#4E3F33] dark:text-stone-200 hover:bg-[#FAF6F0] dark:hover:bg-stone-800 cursor-pointer"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={busyId === resolveTarget.id}
                  className="px-4 py-2 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isVi ? 'Xác nhận xử lý' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
