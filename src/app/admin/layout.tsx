///////////////////////////////////////////////////////////
//                                                       //
//                 ADMIN PORTAL LAYOUT                   //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  ShieldCheck,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { adminApi } from '@/lib/admin-api';
import { UKFlag, VietnamFlag } from '@/components/ui/layout/Navbar';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, initAuth, logout, syncProfile } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const isVi = language === 'vi';

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);

  const [pendingSellersCount, setPendingSellersCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [openReportsCount, setOpenReportsCount] = useState<number>(0);

  const isStaff = Boolean(
    user?.isStaff ||
      user?.isAdmin ||
      user?.isModerator ||
      user?.roleName === 'Admin' ||
      user?.roleName === 'Moderator' ||
      user?.role === 1 ||
      user?.role === 3
  );
  const isAuthorized = Boolean(isInitialized && isAuthenticated && isStaff);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || !isStaff) {
      router.replace('/login?redirect=/admin&error=unauthorized_admin');
    }
  }, [isAuthenticated, isStaff, isInitialized, router]);

  useEffect(() => {
    if (!isAuthorized) return;
    let active = true;

    void syncProfile();

    Promise.allSettled([
      adminApi.listSellerRequests({ status: 1, page: 1, pageSize: 1 }),
      adminApi.listUsers({ page: 1, pageSize: 1 }),
      adminApi.getDashboard(),
    ]).then(([sellersRes, usersRes, dashboardRes]) => {
      if (!active) return;
      if (sellersRes.status === 'fulfilled') {
        setPendingSellersCount(sellersRes.value.totalCount);
      }
      if (usersRes.status === 'fulfilled') {
        setTotalUsersCount(usersRes.value.totalCount);
      }
      if (dashboardRes.status === 'fulfilled') {
        setOpenReportsCount(
          dashboardRes.value.pendingReportCount + dashboardRes.value.reviewingReportCount
        );
      }
    });

    return () => {
      active = false;
    };
  }, [isAuthorized, pathname, syncProfile]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center text-[#2A211B] font-sans p-4">
        <div className="w-12 h-12 border-4 border-[#C5A27D] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-semibold tracking-wide">
          {isVi ? 'Đang xác thực quyền Quản trị...' : 'Verifying Staff Access...'}
        </h2>
        <p className="text-xs text-[#7A6A5D] mt-1">
          {isVi
            ? 'Đang kiểm tra phân quyền truy cập (Admin / Moderator)'
            : 'Checking role-based access control (Admin / Moderator)'}
        </p>
      </div>
    );
  }

  const navItems: NavItem[] = [
    {
      name: isVi ? 'Tổng quan & Thống kê' : 'Overview & Analytics',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: isVi ? 'Quản lý người dùng' : 'User Management',
      href: '/admin/users',
      icon: Users,
      badge: totalUsersCount > 0 ? String(totalUsersCount) : undefined,
      badgeColor: 'bg-[#EDE3D5] text-[#5E452F]',
    },
    {
      name: isVi ? 'Duyệt Seller & Tin đăng' : 'Sellers & Listings',
      href: '/admin/listings',
      icon: PackageCheck,
      badge:
        pendingSellersCount > 0
          ? isVi
            ? `${pendingSellersCount} chờ duyệt`
            : `${pendingSellersCount} pending`
          : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      name: isVi ? 'Báo cáo & Vi phạm' : 'Reports & Violations',
      href: '/admin/reports',
      icon: AlertTriangle,
      badge:
        openReportsCount > 0
          ? isVi
            ? `${openReportsCount} đang mở`
            : `${openReportsCount} open`
          : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      name: isVi ? 'Quản lý danh mục' : 'Category Management',
      href: '/admin/settings',
      icon: FolderKanban,
    },
  ];

  const activeNav = navItems.find((n) => n.href === pathname);
  const staffDisplayName = user?.fullName || user?.username || (isVi ? 'Nhân sự' : 'Staff');
  const staffInitial = staffDisplayName.charAt(0).toUpperCase();
  const isMod = user?.roleName === 'Moderator';
  const staffRoleLabel = isVi
    ? isMod
      ? 'Kiểm duyệt viên'
      : 'Quản trị viên'
    : isMod
      ? 'Moderator'
      : 'Administrator';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans text-[#2A211B]">
      {/* SIDEBAR (Desktop) - Soft Warm Beige Theme */}
      <aside className="hidden lg:flex w-72 flex-col bg-[#F2EAE0] text-[#3B2E24] border-r border-[#E4D6C4] shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#E4D6C4] gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E89650] via-[#F5A764] to-[#FBD6B0] flex items-center justify-center shadow-md shadow-[#E89650]/25 text-white font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#2A211B] text-base tracking-tight leading-none">
              SFM Portal
            </span>
            <span className="text-[11px] text-[#C46A28] font-semibold tracking-wide uppercase mt-1">
              {isVi ? `Điều hành ${staffRoleLabel}` : `${staffRoleLabel} Control`}
            </span>
          </div>
        </div>

        {/* Quick Portal Switch Link */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/80 hover:bg-white text-xs text-[#3B2E24] hover:text-[#2A211B] border border-[#E0D0BC] shadow-2xs transition group"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#8C6645] group-hover:scale-110 transition-transform" />
              <span className="font-semibold">
                {isVi ? 'Về trang bán hàng' : 'View Marketplace'}
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8B796B]" />
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-3 flex-1 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-[#8B796B] uppercase tracking-wider">
            {isVi ? 'Quản trị hệ thống' : 'Administration'}
          </div>

          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#DFCBB2] text-[#2A211B] font-semibold border border-[#CCB395] shadow-2xs'
                    : 'text-[#4E3F33] hover:text-[#2A211B] hover:bg-[#E7DDD0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#4A3525]' : 'text-[#8B796B] group-hover:text-[#6B482C]'
                    } transition-colors`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-white/65 text-[#2A211B]'
                        : item.badgeColor || 'bg-[#E5D7C6] text-[#4E3F33]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Staff Footer Profile Card */}
        <div className="p-4 border-t border-[#E4D6C4] bg-[#EAE0D3]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#DFCBB2] border border-[#C9AF91] text-[#3B2A1E] flex items-center justify-center shrink-0 font-bold text-sm">
                  {staffInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#F2EAE0]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#2A211B] truncate">
                  {staffDisplayName}
                </div>
                <div className="text-[11px] text-[#6E5E52] truncate flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-emerald-700">
                    {isVi ? 'Trực tuyến' : 'Online'}
                  </span>
                  <span className="text-[#A39284]">•</span>
                  <span className="text-[#7A6A5D]">{staffRoleLabel}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title={isVi ? 'Đăng xuất' : 'Sign out'}
              className="p-2 rounded-lg text-[#7A6A5D] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#2A211B]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-[#F2EAE0] text-[#3B2E24] flex flex-col z-10 border-r border-[#E4D6C4]">
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#E4D6C4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E89650] via-[#F5A764] to-[#FBD6B0] flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-[#2A211B] text-base">SFM Portal</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-[#7A6A5D] hover:text-[#2A211B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pt-3 pb-1">
              <Link
                href="/"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-xs text-[#3B2E24] border border-[#E0D0BC]"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Store className="w-4 h-4 text-[#8C6645]" />
                  {isVi ? 'Về trang bán hàng' : 'View Marketplace'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8B796B]" />
              </Link>
            </div>

            <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                      isActive
                        ? 'bg-[#DFCBB2] text-[#2A211B] font-semibold border border-[#CCB395]'
                        : 'text-[#4E3F33] hover:bg-[#E7DDD0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isActive ? 'bg-white/65 text-[#2A211B]' : 'bg-[#E5D7C6] text-[#4E3F33]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#E4D6C4] bg-[#EAE0D3]/80 flex items-center justify-between">
              <div className="text-xs text-[#2A211B] truncate font-medium">{staffDisplayName}</div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-rose-600 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isVi ? 'Đăng xuất' : 'Sign out'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT STAGE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/85 backdrop-blur-md border-b border-[#E7DAC9] px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#3B2E24] hover:bg-[#F3ECE2] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#7A6A5D]">
                <span>{isVi ? 'Quản trị Hệ thống' : `System ${staffRoleLabel}`}</span>
                <ChevronRight className="w-3 h-3 text-[#A39284]" />
                <span className="font-semibold text-[#4A3525]">
                  {activeNav?.name || (isVi ? 'Tổng quan' : 'Dashboard')}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-[#2A211B] tracking-tight">
                {activeNav?.name || (isVi ? 'Tổng quan & Thống kê' : 'Dashboard & Analytics')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher (VIE / ENG) */}
            <div ref={languageDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsLanguageOpen((prev) => !prev)}
                title={isVi ? 'Đổi ngôn ngữ' : 'Switch language'}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#DFCEBA] hover:border-[#C9AE8B] bg-[#FAF6F0] hover:bg-[#F3ECE2] text-[#3B2E24] text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {language === 'vi' ? <VietnamFlag /> : <UKFlag />}
                <span className="tracking-wider font-semibold">
                  {language === 'vi' ? 'VIE' : 'ENG'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#8B796B]" />
              </button>

              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-[#E7DAC9] py-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('vi');
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-[#FAF6F0] transition cursor-pointer ${
                      language === 'vi'
                        ? 'font-bold text-[#7D5435] bg-[#F5ECE0]'
                        : 'text-[#3B2E24]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <VietnamFlag />
                      <span>Tiếng Việt</span>
                    </span>
                    {language === 'vi' && <span className="text-[#7D5435] font-bold">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-[#FAF6F0] transition cursor-pointer ${
                      language === 'en'
                        ? 'font-bold text-[#7D5435] bg-[#F5ECE0]'
                        : 'text-[#3B2E24]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <UKFlag />
                      <span>English</span>
                    </span>
                    {language === 'en' && <span className="text-[#7D5435] font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-[#E7DAC9]">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#DFCBB2] border border-[#CCB395] text-[#2A211B] font-bold flex items-center justify-center text-xs shadow-2xs">
                  {staffInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#2A211B] leading-tight">
                    {staffDisplayName}
                  </span>
                </div>
                <div className="text-[11px] text-[#7A6A5D] leading-tight mt-0.5">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
