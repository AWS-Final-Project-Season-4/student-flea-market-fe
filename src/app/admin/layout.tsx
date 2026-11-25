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
import { useThemeStore } from '@/lib/theme-store';
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
  const { initTheme } = useThemeStore();
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
    initTheme();
  }, [initAuth, initTheme]);

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
      <div className="min-h-[100dvh] bg-[#FAF7F2] dark:bg-stone-950 flex flex-col items-center justify-center text-[#2A211B] dark:text-stone-100 font-sans p-4 transition-colors">
        <div className="w-12 h-12 border-4 border-[#C5A27D] dark:border-[#F5A764] border-t-transparent rounded-full animate-spin mb-4" />
        <h1 className="text-lg font-semibold tracking-wide">
          {isVi ? 'Đang xác thực quyền Quản trị...' : 'Verifying Staff Access...'}
        </h1>
        <p className="text-xs text-[#6D5D52] dark:text-stone-400 mt-1">
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
      badgeColor: 'bg-[#EDE3D5] dark:bg-stone-800 text-[#5E452F] dark:text-stone-300',
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
      badgeColor: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300',
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
      badgeColor: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300',
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
    <div className="min-h-[100dvh] bg-[#FAF7F2] dark:bg-stone-950 flex font-sans text-[#2A211B] dark:text-stone-100 transition-colors">
      {/* SIDEBAR (Desktop) - Soft Warm Beige / Dark Stone Theme */}
      <aside className="hidden lg:flex w-72 flex-col bg-[#F2EAE0] dark:bg-stone-900 text-[#3B2E24] dark:text-stone-200 border-r border-[#E4D6C4] dark:border-stone-800 shrink-0 select-none transition-colors">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#E4D6C4] dark:border-stone-800 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E89650] via-[#F5A764] to-[#FBD6B0] flex items-center justify-center shadow-md shadow-[#E89650]/25 text-white font-bold">
            <ShieldCheck aria-hidden="true" className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#2A211B] dark:text-stone-100 text-base tracking-tight leading-none">
              SFM Portal
            </span>
            <span className="text-[11px] text-[#9A5828] dark:text-[#F5A764] font-semibold tracking-wide uppercase mt-1">
              {isVi ? `Điều hành ${staffRoleLabel}` : `${staffRoleLabel} Control`}
            </span>
          </div>
        </div>

        {/* Quick Portal Switch Link */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white/80 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 text-xs text-[#3B2E24] dark:text-stone-100 hover:text-[#2A211B] border border-[#E0D0BC] dark:border-stone-700 shadow-2xs transition group"
          >
            <div className="flex items-center gap-2">
              <Store aria-hidden="true" className="w-4 h-4 text-[#8C6645] dark:text-[#F5A764] group-hover:scale-110 transition-transform" />
              <span className="font-semibold">
                {isVi ? 'Về trang bán hàng' : 'View Marketplace'}
              </span>
            </div>
            <ExternalLink aria-hidden="true" className="w-3.5 h-3.5 text-[#6D5D52] dark:text-stone-400" />
          </Link>
        </div>

        {/* Navigation Section */}
        <nav aria-label={isVi ? 'Điều hướng quản trị' : 'Admin navigation'} className="px-4 py-3 flex-1 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-[#6D5D52] dark:text-stone-400 uppercase tracking-wider">
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
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#DFCBB2] dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 font-semibold border border-[#CCB395] dark:border-stone-700 shadow-2xs'
                    : 'text-[#4E3F33] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 hover:bg-[#E7DDD0] dark:hover:bg-stone-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-[#4A3525] dark:text-[#F5A764]'
                        : 'text-[#6D5D52] dark:text-stone-400 group-hover:text-[#6B482C] dark:group-hover:text-stone-200'
                    } transition-colors`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                      isActive
                        ? 'bg-white/65 dark:bg-stone-700 text-[#2A211B] dark:text-stone-100'
                        : item.badgeColor || 'bg-[#E5D7C6] dark:bg-stone-800 text-[#4E3F33] dark:text-stone-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Staff Footer Profile Card */}
        <div className="p-4 border-t border-[#E4D6C4] dark:border-stone-800 bg-[#EAE0D3]/80 dark:bg-stone-900/90">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#DFCBB2] dark:bg-stone-800 border border-[#C9AF91] dark:border-stone-700 text-[#3B2A1E] dark:text-stone-100 flex items-center justify-center shrink-0 font-bold text-sm">
                  {staffInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#F2EAE0] dark:ring-stone-900" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#2A211B] dark:text-stone-100 truncate">
                  {staffDisplayName}
                </div>
                <div className="text-[11px] text-[#6D5D52] dark:text-stone-400 truncate flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    {isVi ? 'Trực tuyến' : 'Online'}
                  </span>
                  <span className="text-[#8C7A6B] dark:text-stone-500">•</span>
                  <span className="text-[#6D5D52] dark:text-stone-300">{staffRoleLabel}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title={isVi ? 'Đăng xuất' : 'Sign out'}
              aria-label={isVi ? 'Đăng xuất' : 'Sign out'}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6D5D52] dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
            >
              <LogOut aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      {isMobileSidebarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isVi ? 'Menu quản trị' : 'Admin navigation menu'}
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          <div
            className="fixed inset-0 bg-[#2A211B]/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-[#F2EAE0] dark:bg-stone-900 text-[#3B2E24] dark:text-stone-200 flex flex-col z-10 border-r border-[#E4D6C4] dark:border-stone-800">
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#E4D6C4] dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E89650] via-[#F5A764] to-[#FBD6B0] flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck aria-hidden="true" className="w-5 h-5" />
                </div>
                <span className="font-bold text-[#2A211B] dark:text-stone-100 text-base">SFM Portal</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label={isVi ? 'Đóng menu điều hướng' : 'Close navigation menu'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 hover:bg-[#E7DDD0] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pt-3 pb-1">
              <Link
                href="/"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white/80 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 text-xs text-[#3B2E24] dark:text-stone-100 border border-[#E0D0BC] dark:border-stone-700"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Store aria-hidden="true" className="w-4 h-4 text-[#8C6645] dark:text-[#F5A764]" />
                  {isVi ? 'Về trang bán hàng' : 'View Marketplace'}
                </span>
                <ExternalLink aria-hidden="true" className="w-3.5 h-3.5 text-[#6D5D52] dark:text-stone-400" />
              </Link>
            </div>

            <nav aria-label={isVi ? 'Điều hướng di động' : 'Mobile navigation'} className="p-4 flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-medium ${
                      isActive
                        ? 'bg-[#DFCBB2] dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 font-semibold border border-[#CCB395] dark:border-stone-700'
                        : 'text-[#4E3F33] dark:text-stone-300 hover:bg-[#E7DDD0] dark:hover:bg-stone-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon aria-hidden="true" className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                          isActive
                            ? 'bg-white/65 dark:bg-stone-700 text-[#2A211B] dark:text-stone-100'
                            : item.badgeColor || 'bg-[#E5D7C6] dark:bg-stone-800 text-[#4E3F33] dark:text-stone-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#E4D6C4] dark:border-stone-800 bg-[#EAE0D3]/80 dark:bg-stone-900/90 flex items-center justify-between gap-2">
              <div className="text-xs text-[#2A211B] dark:text-stone-100 truncate font-medium">{staffDisplayName}</div>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[40px] px-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <LogOut aria-hidden="true" className="w-3.5 h-3.5" />
                {isVi ? 'Đăng xuất' : 'Sign out'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT STAGE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 h-16 sm:h-20 surface-translucent bg-white/85 dark:bg-stone-950/90 backdrop-blur-md border-b border-[#E7DAC9] dark:border-stone-800 px-4 sm:px-8 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label={isVi ? 'Mở menu quản trị' : 'Open admin navigation menu'}
              aria-expanded={isMobileSidebarOpen}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#3B2E24] dark:text-stone-200 hover:bg-[#F3ECE2] dark:hover:bg-stone-800 cursor-pointer"
            >
              <Menu aria-hidden="true" className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#6D5D52] dark:text-stone-400">
                <span>{isVi ? 'Quản trị Hệ thống' : `System ${staffRoleLabel}`}</span>
                <ChevronRight aria-hidden="true" className="w-3 h-3 text-[#8C7A6B] dark:text-stone-500" />
                <span className="font-semibold text-[#4A3525] dark:text-stone-200">
                  {activeNav?.name || (isVi ? 'Tổng quan' : 'Dashboard')}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-[#2A211B] dark:text-stone-100 tracking-tight">
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
                aria-expanded={isLanguageOpen}
                aria-haspopup="menu"
                title={isVi ? 'Đổi ngôn ngữ' : 'Switch language'}
                className="flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-full border border-[#DFCEBA] dark:border-stone-700 hover:border-[#C9AE8B] dark:hover:border-stone-600 bg-[#FAF6F0] dark:bg-stone-900 hover:bg-[#F3ECE2] dark:hover:bg-stone-800 text-[#3B2E24] dark:text-stone-100 text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {language === 'vi' ? <VietnamFlag /> : <UKFlag />}
                <span className="tracking-wider font-semibold">
                  {language === 'vi' ? 'VIE' : 'ENG'}
                </span>
                <ChevronDown aria-hidden="true" className="w-3 h-3 text-[#6D5D52] dark:text-stone-400" />
              </button>

              {isLanguageOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-40 bg-white dark:bg-stone-900 rounded-2xl shadow-xl dark:shadow-black/50 border border-[#E7DAC9] dark:border-stone-800 py-1.5 z-50"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setLanguage('vi');
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 min-h-[40px] text-left text-xs flex items-center justify-between hover:bg-[#FAF6F0] dark:hover:bg-stone-800 transition cursor-pointer ${
                      language === 'vi'
                        ? 'font-bold text-[#7D5435] dark:text-[#F5A764] bg-[#F5ECE0] dark:bg-stone-800'
                        : 'text-[#3B2E24] dark:text-stone-200'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <VietnamFlag />
                      <span>Tiếng Việt</span>
                    </span>
                    {language === 'vi' && <span className="text-[#7D5435] dark:text-[#F5A764] font-bold">✓</span>}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setLanguage('en');
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 min-h-[40px] text-left text-xs flex items-center justify-between hover:bg-[#FAF6F0] dark:hover:bg-stone-800 transition cursor-pointer ${
                      language === 'en'
                        ? 'font-bold text-[#7D5435] dark:text-[#F5A764] bg-[#F5ECE0] dark:bg-stone-800'
                        : 'text-[#3B2E24] dark:text-stone-200'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <UKFlag />
                      <span>English</span>
                    </span>
                    {language === 'en' && <span className="text-[#7D5435] dark:text-[#F5A764] font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-[#E7DAC9] dark:border-stone-800">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#DFCBB2] dark:bg-stone-800 border border-[#CCB395] dark:border-stone-700 text-[#2A211B] dark:text-stone-100 font-bold flex items-center justify-center text-xs shadow-2xs">
                  {staffInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-950" />
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#2A211B] dark:text-stone-100 leading-tight">
                    {staffDisplayName}
                  </span>
                </div>
                <div className="text-[11px] text-[#6D5D52] dark:text-stone-400 leading-tight mt-0.5">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
