'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  PackageCheck,
  AlertTriangle,
  Settings,
  LogOut,
  Store,
  Menu,
  X,
  Bell,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Overview & Analytics',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    badge: '1,428',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Listing Moderation',
    href: '/admin/listings',
    icon: PackageCheck,
    badge: '18 pending',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    name: 'Reports & Violations',
    href: '/admin/reports',
    icon: AlertTriangle,
    badge: '3 new',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, initAuth, logout } = useAuthStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isInitialized) return;

    // Check if user is authenticated and has Admin role
    const isAdmin = user?.roleName === 'Admin' || user?.role === 1;

    if (!isAuthenticated || !isAdmin) {
      router.replace('/login?redirect=/admin&error=unauthorized_admin');
    } else {
      setIsAuthorizing(false);
    }
  }, [isAuthenticated, user, isInitialized, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isAuthorizing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans p-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-semibold tracking-wide">Verifying Administrator Access...</h2>
        <p className="text-xs text-slate-400 mt-1">Checking role-based access control (Role: Admin)</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

      {/* ========================================================= */}
      {/* SIDEBAR (Desktop)                                         */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-72 flex-col bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base tracking-tight leading-none">
              SFM Portal
            </span>
            <span className="text-[11px] text-amber-400 font-medium tracking-wide uppercase mt-1">
              Admin Control Center
            </span>
          </div>
        </div>

        {/* Quick Portal Switch Link */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-700/60 transition group"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>View Marketplace</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-3 flex-1 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Administration
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${isActive
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'} transition-colors`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isActive ? 'bg-slate-950/15 text-slate-950' : item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Admin User Footer Profile Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 font-bold text-sm">
                  A
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  Admin
                </div>
                <div className="text-[11px] text-emerald-400 truncate flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">Online</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">Administrator</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE DRAWER SIDEBAR                                     */}
      {/* ========================================================= */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-slate-900 text-slate-200 flex flex-col z-10 border-r border-slate-800">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
                <span className="font-bold text-white text-base">Administrator Portal</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium ${isActive ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-white truncate font-medium">
                {user?.fullName || 'Administrator'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-rose-400 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN CONTENT STAGE                                        */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>System Admin</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-slate-800">
                  {NAV_ITEMS.find((n) => n.href === pathname)?.name || 'Dashboard'}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                {NAV_ITEMS.find((n) => n.href === pathname)?.name || 'Dashboard & Analytics'}
              </h1>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Storefront button */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Marketplace</span>
            </Link>

            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
              </button>
            </div>

            {/* Admin Avatar Pill with Online Status */}
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-xs">
                  A
                </div>
                {/* Online Status Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    Administrator
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  {user?.email || 'admin@gmail.com'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

    </div>
  );
}
