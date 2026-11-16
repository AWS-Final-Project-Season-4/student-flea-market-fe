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
import { ModerationReportDto } from '@/types/admin';

type ReportStatusFilter = 'ALL' | 1 | 2 | 3 | 4;

const RESOLVE_ACTIONS: Array<{ id: string; label: string; desc: string; exclusive?: boolean }> = [
  { id: 'hide_item', label: 'Hide Listing', desc: 'Remove the reported listing from public search.' },
  { id: 'revoke_seller', label: 'Revoke Seller Access', desc: 'Remove seller permission of reported user.' },
  { id: 'ban_user', label: 'Ban Reported User', desc: 'Ban account and terminate active sessions.' },
  { id: 'void_review', label: 'Void Review', desc: 'Invalidate biased review from this transaction.' },
  { id: 'none', label: 'Confirm Violation Only', desc: 'Mark valid without extra penalty.' },
  { id: 'reject', label: 'Reject Report (Dismiss)', desc: 'No violation found — cannot combine with others.', exclusive: true },
];

export default function AdminReportsPage() {
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (rpt.status === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Eye className="w-3 h-3" />
          Reviewing
        </span>
      );
    }
    if (rpt.status === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3" />
          Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
        Dismissed
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Reports & Moderation Violations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review real user violation reports, investigate evidence, and apply moderation actions.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
          Total: {totalCount} reports
        </span>
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

      {/* Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 1, label: 'Pending' },
              { id: 2, label: 'Reviewing' },
              { id: 3, label: 'Resolved' },
              { id: 4, label: 'Dismissed' },
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
        </div>

        <button
          type="button"
          onClick={() => void reloadReports()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-xs text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-amber-500" />
          Loading moderation reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-200 text-center space-y-2">
          <Flag className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No moderation reports found</p>
          <p className="text-xs text-slate-500">
            Submitted user reports will appear here automatically once users report a listing, user, or transaction.
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
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {rpt.reasonName}
                    </span>
                    {getStatusBadge(rpt)}
                    <span className="text-xs text-slate-400">
                      • {new Date(rpt.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">
                    {rpt.itemTitle
                      ? `Item: ${rpt.itemTitle}${rpt.itemCode ? ` (${rpt.itemCode})` : ''}`
                      : rpt.reportedUserName
                        ? `User: ${rpt.reportedUserName}`
                        : `Report #${rpt.id.slice(0, 8)}`}
                  </h4>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong className="text-slate-800">Details:</strong> {rpt.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                    <span>
                      Reporter: <strong className="text-slate-700">{rpt.reporterName}</strong>
                    </span>
                    {rpt.reportedUserName && (
                      <span>
                        Reported User:{' '}
                        <strong className="text-slate-700">{rpt.reportedUserName}</strong>
                      </span>
                    )}
                    {rpt.resolvedByName && (
                      <span>
                        Handled by:{' '}
                        <strong className="text-slate-700">{rpt.resolvedByName}</strong>
                      </span>
                    )}
                  </div>

                  {rpt.adminNote && (
                    <p className="text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <strong>Staff Note:</strong> {rpt.adminNote}
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
                        className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        Mark Reviewing
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Resolve</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Resolve Moderation Report</h3>
              <button
                type="button"
                onClick={() => setResolveTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Action(s)
                </label>
                {RESOLVE_ACTIONS.map((act) => {
                  const checked = selectedActions.includes(act.id);
                  return (
                    <label
                      key={act.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        checked
                          ? 'border-amber-500 bg-amber-50/40'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAction(act.id)}
                        className="mt-0.5 rounded accent-amber-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{act.label}</div>
                        <div className="text-[11px] text-slate-500">{act.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Note (optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Summary note shown to reporter..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolveTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === resolveTarget.id}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
