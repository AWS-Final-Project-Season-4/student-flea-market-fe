'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  Sparkles,
  Search,
  BookOpen,
  Laptop,
  Home,
  Shirt,
  Check,
  X,
  ShoppingBag
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface PendingListing {
  id: string;
  title: string;
  sellerName: string;
  sellerSchool: string;
  category: string;
  price: number;
  condition: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const INITIAL_PENDING_LISTINGS: PendingListing[] = [
  {
    id: 'LIST-101',
    title: 'Calculus 1 & 2 Textbooks (Hardcover) - 95% New',
    sellerName: 'Alex Nguyen',
    sellerSchool: 'University of Technology (HCMUT)',
    category: 'Books & Textbooks',
    price: 65000,
    condition: 'Like New',
    submittedAt: '10 mins ago',
    status: 'PENDING',
  },
  {
    id: 'LIST-102',
    title: 'Compact Rice Cooker Sharp 1L for Dorm Room',
    sellerName: 'Hannah Tran',
    sellerSchool: 'University of Economics (UEH)',
    category: 'Dorm & Home Essentials',
    price: 180000,
    condition: 'Used (6 months)',
    submittedAt: '35 mins ago',
    status: 'PENDING',
  },
  {
    id: 'LIST-103',
    title: 'DareU EK87 Mechanical Keyboard (Brown Switch)',
    sellerName: 'Kevin Le',
    sellerSchool: 'University of Information Tech (UIT)',
    category: 'Electronics & IT',
    price: 320000,
    condition: 'Good',
    submittedAt: '1 hour ago',
    status: 'PENDING',
  },
  {
    id: 'LIST-104',
    title: 'Scientific Calculator Casio FX-580VN X',
    sellerName: 'Brian Pham',
    sellerSchool: 'Technical Education University (HCMUTE)',
    category: 'Study Tools',
    price: 350000,
    condition: 'Under Warranty',
    submittedAt: '2 hours ago',
    status: 'PENDING',
  },
  {
    id: 'LIST-105',
    title: 'Commuter Bicycle Asama Martin 107',
    sellerName: 'Thomas Dang',
    sellerSchool: 'University of Science (HCMUS)',
    category: 'Transportation',
    price: 600000,
    condition: 'Good Working Condition',
    submittedAt: '3 hours ago',
    status: 'PENDING',
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<PendingListing[]>(INITIAL_PENDING_LISTINGS);
  const [filterText, setFilterText] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleApprove = (id: string, title: string) => {
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
    );
    setActionNotice(`Approved listing: "${title}"`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = (id: string, title: string) => {
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item))
    );
    setActionNotice(`Rejected listing: "${title}"`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredListings = listings.filter(
    (item) =>
      item.title.toLowerCase().includes(filterText.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(filterText.toLowerCase()) ||
      item.sellerSchool.toLowerCase().includes(filterText.toLowerCase())
  );

  const pendingCount = listings.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-6">

      {/* ========================================================= */}
      {/* 1. TOP WELCOME BANNER                                     */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Control Center v1.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, Administrator! 👋
            </h2>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
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

      {/* ========================================================= */}
      {/* 2. STATISTIC CARDS (KPIs)                                 */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

        {/* KPI 1: Total Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Students
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              1,428
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +18.2%
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified university & student emails</p>
        </div>

        {/* KPI 2: Active Listings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Listings
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              892
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +5.4%
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Live on the student marketplace</p>
        </div>

        {/* KPI 3: Pending Approvals */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-950">
              {pendingCount}
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              Needs review
            </span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">New listings submitted today</p>
        </div>

        {/* KPI 4: Total Value / Exchanges */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Transaction Volume
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              45.6M <span className="text-sm font-semibold text-slate-500">VND</span>
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +24%
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">340 completed item exchanges</p>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. CHARTS & CATEGORY DISTRIBUTION                         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Weekly Listings & Activity Trend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily volume of pre-owned items submitted by students</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              Last 7 days
            </span>
          </div>

          {/* Clean Responsive CSS/SVG Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2 px-2">
            {[
              { day: 'Mon', count: 34, height: '45%' },
              { day: 'Tue', count: 48, height: '62%' },
              { day: 'Wed', count: 65, height: '85%' },
              { day: 'Thu', count: 52, height: '68%' },
              { day: 'Fri', count: 78, height: '100%' },
              { day: 'Sat', count: 70, height: '90%' },
              { day: 'Sun', count: 42, height: '55%' },
            ].map((col) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {col.count} items
                </span>
                <div className="w-full max-w-[42px] bg-slate-100 group-hover:bg-amber-100 rounded-xl relative overflow-hidden transition-all flex items-end" style={{ height: '80%' }}>
                  <div
                    className="w-full bg-gradient-to-t from-amber-500 to-orange-400 group-hover:from-amber-600 group-hover:to-orange-500 rounded-xl transition-all duration-300"
                    style={{ height: col.height }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600">{col.day}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Highest activity observed on Friday and Saturday
            </span>
            <span className="font-semibold text-slate-700">Total: 389 listings/week</span>
          </div>
        </div>

        {/* Category Share Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Category Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Share of items by student demand & category</p>

            <div className="mt-6 space-y-4">
              {[
                { name: 'Books & Textbooks', percent: 42, icon: BookOpen, color: 'bg-blue-600', text: 'text-blue-600' },
                { name: 'Electronics & IT Accessories', percent: 28, icon: Laptop, color: 'bg-amber-500', text: 'text-amber-600' },
                { name: 'Dorm & Household Essentials', percent: 18, icon: Home, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { name: 'Fashion & Other Gear', percent: 12, icon: Shirt, color: 'bg-purple-500', text: 'text-purple-600' },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Icon className={`w-3.5 h-3.5 ${cat.text}`} />
                        <span>{cat.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{cat.percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Semester textbooks and dorm gear exchange the fastest (often within 48 hours).
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. MODERATION TABLE: PENDING LISTINGS                     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Pending Listings Queue
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                {pendingCount} pending
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Review and moderate listings before they appear publicly on the student marketplace
            </p>
          </div>

          {/* Search Box inside Table */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search listings, sellers..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 sm:px-6">Item / Listing</th>
                <th className="py-3 px-4">Seller / University</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching listings found.
                  </td>
                </tr>
              ) : (
                filteredListings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Title */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs sm:max-w-md">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{item.id}</span>
                        <span>•</span>
                        <span>{item.condition}</span>
                        <span>•</span>
                        <span>{item.submittedAt}</span>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{item.sellerName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.sellerSchool}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-amber-600">
                        {item.price.toLocaleString('en-US')} VND
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                          <Check className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]">
                          <X className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                      {item.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(item.id, item.title)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(item.id, item.title)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-medium text-xs transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredListings.length} listings</span>
          <Link
            href="/admin/listings"
            className="font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>View all marketplace listings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}
