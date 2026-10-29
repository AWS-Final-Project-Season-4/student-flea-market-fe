'use client';

import React, { useState } from 'react';
import { Users, Search, Filter, ShieldCheck, Mail, Lock, Unlock } from 'lucide-react';

interface MockUser {
  id: string;
  fullName: string;
  email: string;
  studentCode: string;
  schoolName: string;
  roleName: 'User' | 'Admin';
  status: 'Active' | 'Locked';
  joinedDate: string;
  listingsCount: number;
}

const MOCK_USERS: MockUser[] = [
  {
    id: 'USR-001',
    fullName: 'Administrator',
    email: 'admin@gmail.com',
    studentCode: 'ADMIN-01',
    schoolName: 'SFM System Operations',
    roleName: 'Admin',
    status: 'Active',
    joinedDate: '10/01/2026',
    listingsCount: 0,
  },
  {
    id: 'USR-002',
    fullName: 'Alex Nguyen',
    email: 'an.nguyen@bk.edu.vn',
    studentCode: 'BK20220412',
    schoolName: 'University of Technology (HCMUT)',
    roleName: 'User',
    status: 'Active',
    joinedDate: '10/12/2026',
    listingsCount: 8,
  },
  {
    id: 'USR-003',
    fullName: 'Hannah Tran',
    email: 'ha.tran@ueh.edu.vn',
    studentCode: 'UEH20231189',
    schoolName: 'University of Economics (UEH)',
    roleName: 'User',
    status: 'Active',
    joinedDate: '10/15/2026',
    listingsCount: 5,
  },
  {
    id: 'USR-004',
    fullName: 'Kevin Le',
    email: 'minh.lh@uit.edu.vn',
    studentCode: 'IT20210088',
    schoolName: 'University of Information Tech (UIT)',
    roleName: 'User',
    status: 'Active',
    joinedDate: '10/18/2026',
    listingsCount: 12,
  },
  {
    id: 'USR-005',
    fullName: 'Thomas Tran',
    email: 'trong.td@hcmus.edu.vn',
    studentCode: 'US20240912',
    schoolName: 'University of Science (HCMUS)',
    roleName: 'User',
    status: 'Locked',
    joinedDate: '10/22/2026',
    listingsCount: 2,
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'User' | 'Admin'>('ALL');

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            status: u.status === 'Active' ? 'Locked' : 'Active',
          };
        }
        return u;
      })
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.schoolName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = roleFilter === 'ALL' || u.roleName === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            User & Student Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of registered students, administrative staff, and university verification status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            Total: {users.length} accounts
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, student ID, university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Accounts
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('User')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              roleFilter === 'User'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Students (Users)
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('Admin')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              roleFilter === 'Admin'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Administrators
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 sm:px-6">Student / Account</th>
                <th className="py-3 px-4">University / Student ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Listings</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {u.fullName.charAt(0)}
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

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{u.schoolName}</div>
                      <div className="text-[11px] text-slate-400">ID: {u.studentCode}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.roleName === 'Admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                          Student
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800">
                      {u.listingsCount} items
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                      {u.roleName !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => toggleStatus(u.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            u.status === 'Active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'Active' ? (
                            <>
                              <Lock className="w-3 h-3" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              Reactivate
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
