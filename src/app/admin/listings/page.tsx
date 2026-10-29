'use client';

import React, { useState } from 'react';
import { Package, Search, Filter, Check, X, Clock, ShoppingBag } from 'lucide-react';

interface ListingItem {
  id: string;
  title: string;
  seller: string;
  school: string;
  category: string;
  price: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  date: string;
}

const MOCK_ALL_LISTINGS: ListingItem[] = [
  {
    id: 'LST-001',
    title: 'Calculus 1 & 2 Textbooks (Hardcover) - 95% New',
    seller: 'Alex Nguyen',
    school: 'University of Technology (HCMUT)',
    category: 'Books & Textbooks',
    price: 65000,
    status: 'PENDING',
    date: '10/29/2026',
  },
  {
    id: 'LST-002',
    title: 'Compact Rice Cooker Sharp 1L for Dorm Room',
    seller: 'Hannah Tran',
    school: 'University of Economics (UEH)',
    category: 'Dorm & Home Essentials',
    price: 180000,
    status: 'PENDING',
    date: '10/29/2026',
  },
  {
    id: 'LST-003',
    title: 'Logitech M331 Silent Wireless Mouse',
    seller: 'Kevin Le',
    school: 'University of Information Tech (UIT)',
    category: 'Electronics & IT',
    price: 150000,
    status: 'APPROVED',
    date: '10/28/2026',
  },
  {
    id: 'LST-004',
    title: 'Foldable Metal Study Desk for Students',
    seller: 'Thomas Dang',
    school: 'University of Science (HCMUS)',
    category: 'Dorm & Home Essentials',
    price: 90000,
    status: 'CLOSED',
    date: '10/27/2026',
  },
  {
    id: 'LST-005',
    title: 'Sony WH-CH520 Wireless Headphones',
    seller: 'Brian Pham',
    school: 'Technical Education University (HCMUTE)',
    category: 'Electronics & IT',
    price: 550000,
    status: 'REJECTED',
    date: '10/26/2026',
  },
];

export default function AdminListingsPage() {
  const [listings, setListings] = useState<ListingItem[]>(MOCK_ALL_LISTINGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'CLOSED' | 'REJECTED'>('ALL');

  const updateStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'CLOSED') => {
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const filtered = listings.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.school.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Marketplace Listing Moderation
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Listings remain live on the marketplace permanently until purchased (Closed) or rejected
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, seller, university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'CLOSED', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' && 'All'}
              {s === 'PENDING' && 'Pending Review'}
              {s === 'APPROVED' && 'Active (Live)'}
              {s === 'CLOSED' && 'Sold (Closed)'}
              {s === 'REJECTED' && 'Rejected'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 sm:px-6">Item / Title</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="font-semibold text-slate-900 line-clamp-1">{item.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.id} • Submitted: {item.date}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{item.seller}</div>
                    <div className="text-[11px] text-slate-500">{item.school}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-amber-600">
                    {item.price.toLocaleString('en-US')} VND
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.status === 'PENDING' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
                        Pending Review
                      </span>
                    )}
                    {item.status === 'APPROVED' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                        Active (Live)
                      </span>
                    )}
                    {item.status === 'CLOSED' && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px] flex items-center gap-1 w-fit">
                        <ShoppingBag className="w-3 h-3 text-slate-500" />
                        Sold (Closed)
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]">
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-medium text-xs transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'CLOSED')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
                        >
                          Mark Sold
                        </button>
                      )}
                      {item.status === 'CLOSED' && (
                        <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                      )}
                      {item.status === 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'APPROVED')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium text-xs transition cursor-pointer"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
