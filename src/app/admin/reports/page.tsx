'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Search, Flag } from 'lucide-react';

interface ReportItem {
  id: string;
  targetType: 'Listing' | 'User';
  targetTitle: string;
  reporter: string;
  reason: string;
  reportedAt: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'RPT-001',
    targetType: 'Listing',
    targetTitle: 'Sony WH-CH520 Headphones listed at 100k',
    reporter: 'Marcus Vo (UIT)',
    reason: 'Suspected counterfeit product; blurry photos not matching authentic specifications.',
    reportedAt: '1 hour ago',
    status: 'PENDING',
  },
  {
    id: 'RPT-002',
    targetType: 'User',
    targetTitle: 'Account: StudentThriftKing',
    reporter: 'Emily Nguyen (HCMUT)',
    reason: 'Demanded advance deposit outside the platform and blocked messages.',
    reportedAt: '3 hours ago',
    status: 'PENDING',
  },
  {
    id: 'RPT-003',
    targetType: 'Listing',
    targetTitle: 'Unauthorized Photocopy TOEIC Test Prep 2026',
    reporter: 'David Le (HCMUE)',
    reason: 'Copyright violation; unauthorized distribution of scanned textbooks.',
    reportedAt: 'Yesterday',
    status: 'RESOLVED',
  },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);

  const resolveReport = (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Reports & Community Violations
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review student reports regarding counterfeit items, deposit fraud, or policy violations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((rpt) => (
          <div
            key={rpt.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  rpt.targetType === 'Listing' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {rpt.targetType === 'Listing' ? 'Marketplace Listing' : 'User Account'}
                </span>
                <span className="text-xs text-slate-400">• {rpt.id} • {rpt.reportedAt}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{rpt.targetTitle}</h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <strong className="text-slate-800">Reason:</strong> {rpt.reason}
              </p>
              <div className="text-[11px] text-slate-500">
                Reported by: <span className="font-medium text-slate-700">{rpt.reporter}</span>
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
              {rpt.status === 'PENDING' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resolveReport(rpt.id, 'RESOLVED')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Take Action
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveReport(rpt.id, 'DISMISSED')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  rpt.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {rpt.status === 'RESOLVED' ? 'Action Taken' : 'Dismissed'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
