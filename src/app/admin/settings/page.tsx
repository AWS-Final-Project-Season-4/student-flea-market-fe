'use client';

import React, { useState } from 'react';
import { Check, Infinity as InfinityIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  const [autoApprove, setAutoApprove] = useState(false);
  const [emailDomainRestriction, setEmailDomainRestriction] = useState(true);
  const [autoCloseOnSold, setAutoCloseOnSold] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Platform & System Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure moderation workflows, listing lifecycle policies, and university verification
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>System configuration saved successfully!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Section 1: Moderation rules */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
            Listing Moderation Rules
          </h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900">
                Auto-approve listings from verified university email accounts (.edu.vn)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Bypass manual review queue if the seller has already verified their student email.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="h-5 w-5 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900">
                Prioritize verified campus accounts with a Verified Student Badge
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Display trust verification badges on listings posted with official student accounts.
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailDomainRestriction}
              onChange={(e) => setEmailDomainRestriction(e.target.checked)}
              className="h-5 w-5 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Section 2: Listing Lifecycle (Permanent until Sold) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
            Listing Lifecycle & Expiration Policy
          </h3>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <InfinityIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-amber-950">
                Display Duration: Permanent (No expiration date)
              </div>
              <div className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Listings remain active on the marketplace indefinitely until marked as sold or voluntarily closed by the seller. The system will never automatically expire items by day count.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900">
                Automatically transition to "Sold (Closed)" once exchange is completed
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                When either party confirms the transaction is completed, archive the listing from public search.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoCloseOnSold}
              onChange={(e) => setAutoCloseOnSold(e.target.checked)}
              className="h-5 w-5 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
