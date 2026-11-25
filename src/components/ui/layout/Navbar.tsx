'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    ChevronDown,
    ShoppingCart,
    Menu,
    X,
    Shield,
    LogOut,
    TrendingUp,
    User,
    Settings,
    MessageCircle,
    Handshake,
    Bell,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';
import { useThemeStore } from '@/lib/theme-store';
import { useChatStore } from '@/lib/chat-store';
import { startChatHub, stopChatHub } from '@/lib/chat-hub';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { AuthRequiredModal, AuthRequiredReason } from '@/components/ui/auth/AuthRequiredModal';

// Crisp SVG Flag for Vietnam
export function VietnamFlag({ className = 'w-5 h-3.5' }: { className?: string }) {
    return (
        <svg className={`${className} rounded-xs shadow-2xs shrink-0`} viewBox="0 0 30 20" fill="none">
            <rect width="30" height="20" fill="#DA251D" />
            <polygon
                points="15,4 16.5,8.8 21.5,8.8 17.5,11.8 19,16.5 15,13.5 11,16.5 12.5,11.8 8.5,8.8 13.5,8.8"
                fill="#FFFF00"
            />
        </svg>
    );
}

// Crisp SVG Flag for UK / English
export function UKFlag({ className = 'w-5 h-3.5' }: { className?: string }) {
    return (
        <svg className={`${className} rounded-xs shadow-2xs shrink-0`} viewBox="0 0 60 30" fill="none">
            <clipPath id="ukClip"><rect width="60" height="30" rx="1.5" /></clipPath>
            <g clipPath="url(#ukClip)">
                <rect width="60" height="30" fill="#012169" />
                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6" />
                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
                <path d="M30,0 v30 M0,15 h60" stroke="#FFF" strokeWidth="10" />
                <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
            </g>
        </svg>
    );
}

// Cute Smiling Empty Cart Illustration
export function CuteEmptyCartIllustration({ className = 'w-24 h-24' }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Soft Ambient Background Circle */}
            <circle cx="60" cy="62" r="44" fill="#FAF5EE" />

            {/* Sparkles / Confetti Dots */}
            <circle cx="36" cy="32" r="3" fill="#F5A764" />
            <circle cx="84" cy="34" r="2.5" fill="#FCD34D" />
            <circle cx="28" cy="64" r="2" fill="#E89650" />
            <circle cx="94" cy="60" r="3" fill="#FDBA74" />
            <path d="M48 18L50 22L54 24L50 26L48 30L46 26L42 24L46 22L48 18Z" fill="#F5A764" opacity="0.75" />

            {/* Shopping Bag Handles */}
            <path
                d="M49 46C49 39 53.5 34 60 34C66.5 34 71 39 71 46"
                stroke="#B87B4E"
                strokeWidth="3.5"
                strokeLinecap="round"
            />

            {/* Main Kraft Bag Body */}
            <path
                d="M38 46H82L78 86C77.7 89 75 91 72 91H48C45 91 42.3 89 42 86L38 46Z"
                fill="#F3D5A5"
            />
            {/* Bag Fold Top */}
            <path
                d="M38 46H82L80 52H40L38 46Z"
                fill="#E8BE88"
            />

            {/* Cute Kawaii Face */}
            {/* Eyes */}
            <ellipse cx="52" cy="63" rx="2.5" ry="3" fill="#2A211B" />
            <circle cx="51.2" cy="61.8" r="0.9" fill="white" />

            <ellipse cx="68" cy="63" rx="2.5" ry="3" fill="#2A211B" />
            <circle cx="67.2" cy="61.8" r="0.9" fill="white" />

            {/* Blushing Cheeks */}
            <ellipse cx="46.5" cy="67" rx="3.5" ry="2" fill="#FB7185" opacity="0.45" />
            <ellipse cx="73.5" cy="67" rx="3.5" ry="2" fill="#FB7185" opacity="0.45" />

            {/* Sweet Smiling Mouth */}
            <path
                d="M55.5 68C57.5 72.5 62.5 72.5 64.5 68"
                stroke="#2A211B"
                strokeWidth="2.2"
                strokeLinecap="round"
            />

            {/* Hanging Price Tag */}
            <path
                d="M74 72L84 76C85 76.5 86 78 85.5 79L82.5 87C82 88 80.5 88.5 79.5 88L70 84"
                fill="#D1FAE5"
                stroke="#6EE7B7"
                strokeWidth="1.2"
            />
            <circle cx="73" cy="75" r="1.5" fill="#10B981" />
            <path d="M78 80L80 84" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );
}

interface NavbarProps {
    onPostAdClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onPostAdClick }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get('q') || '';

    const { language, setLanguage } = useLanguageStore();
    const t = DICTIONARY[language];

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(currentQuery);
    const [prevUrlQuery, setPrevUrlQuery] = useState(currentQuery);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
    const [authRequiredReason, setAuthRequiredReason] = useState<AuthRequiredReason>('cart');
    const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    if (prevUrlQuery !== currentQuery) {
        setPrevUrlQuery(currentQuery);
        setSearchQuery(currentQuery);
    }

    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const languageDropdownRef = useRef<HTMLDivElement | null>(null);
    const profileDropdownRef = useRef<HTMLDivElement | null>(null);
    const desktopNotificationRef = useRef<HTMLDivElement | null>(null);
    const mobileNotificationRef = useRef<HTMLDivElement | null>(null);
    const mobileNotificationPanelRef = useRef<HTMLDivElement | null>(null);
    const { user, isAuthenticated, isInitialized, initAuth, logout, syncProfile } = useAuthStore();
    const { initTheme } = useThemeStore();
    const { totalUnread, refreshUnreadCount } = useChatStore();

    useEffect(() => {
        initAuth();
        initTheme();
    }, [initAuth, initTheme]);

    // Collapse header into a floating pill when scrolled down; expand at page top.
    // Hysteresis thresholds (40px / 16px) avoid state flicker near the boundary.
    useEffect(() => {
        let rafId: number | null = null;

        const updateScrollState = () => {
            rafId = null;
            const y = window.scrollY;
            setIsScrolled((prev) => {
                if (!prev && y > 40) return true;
                if (prev && y < 16) return false;
                return prev;
            });
        };

        const handleScroll = () => {
            if (rafId === null) {
                rafId = window.requestAnimationFrame(updateScrollState);
            }
        };

        updateScrollState();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, []);

    useEffect(() => {
        if (!isInitialized) return;
        let cancelled = false;

        if (isAuthenticated) {
            void (async () => {
                // Ensure Axios has refreshed any expired JWT before SignalR starts negotiating
                await Promise.allSettled([syncProfile(), refreshUnreadCount()]);
                if (!cancelled && useAuthStore.getState().isAuthenticated) {
                    await startChatHub();
                }
            })();
        } else {
            void stopChatHub();
        }

        return () => {
            cancelled = true;
        };
    }, [isInitialized, isAuthenticated, syncProfile, refreshUnreadCount]);

    // Focus input and lock body scroll when search overlay opens
    useEffect(() => {
        if (isSearchOpen) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 60);
            document.body.style.overflow = 'hidden';
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = 'unset';
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isSearchOpen]);

    // Keyboard shortcuts: ESC to close search/menus, Ctrl+K / Cmd+K to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isSearchOpen) setIsSearchOpen(false);
                if (isProfileMenuOpen) setIsProfileMenuOpen(false);
                if (isLanguageOpen) setIsLanguageOpen(false);
                if (isNotificationsOpen) setIsNotificationsOpen(false);
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, isProfileMenuOpen, isLanguageOpen, isNotificationsOpen]);

    // Close dropdown menus on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                languageDropdownRef.current &&
                !languageDropdownRef.current.contains(target)
            ) {
                setIsLanguageOpen(false);
            }
            if (
                profileDropdownRef.current &&
                !profileDropdownRef.current.contains(target)
            ) {
                setIsProfileMenuOpen(false);
            }
            const isInsideNotification =
                desktopNotificationRef.current?.contains(target) ||
                mobileNotificationRef.current?.contains(target) ||
                mobileNotificationPanelRef.current?.contains(target);
            if (!isInsideNotification) {
                setIsNotificationsOpen(false);
            }
        };
        if (isLanguageOpen || isProfileMenuOpen || isNotificationsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isLanguageOpen, isProfileMenuOpen, isNotificationsOpen]);

    // Close search overlay on click/tap outside search container
    useEffect(() => {
        if (!isSearchOpen) return;

        const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target as Node)
            ) {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, [isSearchOpen]);

    const handleClearSearch = () => {
        setSearchQuery('');
        searchInputRef.current?.focus();
        if (searchParams.get('q')) {
            router.push('/');
        }
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = searchQuery.trim();
        setIsSearchOpen(false);
        if (trimmed) {
            router.push(`/?q=${encodeURIComponent(trimmed)}`);
        } else {
            router.push('/');
        }
    };

    const handleSelectTag = (tag: string) => {
        setSearchQuery(tag);
        setIsSearchOpen(false);
        router.push(`/?q=${encodeURIComponent(tag)}`);
    };

    const isAdmin = Boolean(
        user?.isStaff ||
        user?.isAdmin ||
        user?.isModerator ||
        user?.roleName === 'Admin' ||
        user?.roleName === 'Moderator' ||
        user?.role === 1 ||
        user?.role === 3
    );

    const mobileMenuContent = isMobileMenuOpen ? (
        <div className="md:hidden py-4 flex flex-col gap-3">
            {isAdmin && (
                <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FAF5EE] hover:bg-[#EFE3D3] dark:bg-stone-800 dark:hover:bg-stone-700 text-[#3B2A1E] dark:text-stone-100 border border-[#DBC6AE] dark:border-stone-600 text-center font-bold text-sm flex items-center justify-center gap-2"
                >
                    <Shield className="w-4 h-4 text-[#855A3C] dark:text-[#E5C9A8]" />
                    <span>{t.navbar.adminPortal}</span>
                </Link>
            )}
            {/* Mobile: Post Ad (Đẩy tin bán gấp - Tính phí) */}
            {onPostAdClick ? (
                <button
                    type="button"
                    onClick={() => {
                        setIsMobileMenuOpen(false);
                        onPostAdClick();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E4D1B8] hover:bg-[#D7C0A2] dark:bg-[#C4A17D] dark:hover:bg-[#B48F69] text-[#2A211B] dark:text-stone-950 border border-[#CEB495] dark:border-[#B48F69] text-center font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                    <TrendingUp className="w-4 h-4 text-[#6B482C] dark:text-stone-950" />
                    <span>{t.navbar.postAd}</span>
                </button>
            ) : (
                <Link
                    href="/post-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E4D1B8] hover:bg-[#D7C0A2] dark:bg-[#C4A17D] dark:hover:bg-[#B48F69] text-[#2A211B] dark:text-stone-950 border border-[#CEB495] dark:border-[#B48F69] text-center font-semibold text-sm flex items-center justify-center gap-2"
                >
                    <TrendingUp className="w-4 h-4 text-[#6B482C] dark:text-stone-950" />
                    <span>{t.navbar.postListingMobile}</span>
                </Link>
            )}
            {isAuthenticated && user ? (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-stone-800">
                    <div className="text-xs font-semibold text-slate-700 dark:text-stone-300 px-1">
                        {t.navbar.signedInAs} {user.fullName || user.email}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <Link
                            href="/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full py-2 px-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-900 text-[#2A211B] dark:text-stone-100 text-center font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#F3E7DA] dark:hover:bg-stone-800 transition"
                        >
                            <User className="w-3.5 h-3.5 text-[#B8652B] dark:text-[#F5A764]" />
                            <span>{language === 'vi' ? 'Hồ sơ' : 'Profile'}</span>
                        </Link>
                        <Link
                            href="/transactions"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full py-2 px-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-900 text-[#2A211B] dark:text-stone-100 text-center font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#F3E7DA] dark:hover:bg-stone-800 transition"
                        >
                            <Handshake className="w-3.5 h-3.5 text-[#B8652B] dark:text-[#F5A764]" />
                            <span>{language === 'vi' ? 'Đơn hàng' : 'Orders'}</span>
                        </Link>
                        <Link
                            href="/settings"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full py-2 px-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-900 text-[#2A211B] dark:text-stone-100 text-center font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#F3E7DA] dark:hover:bg-stone-800 transition"
                        >
                            <Settings className="w-3.5 h-3.5 text-[#B8652B] dark:text-[#F5A764]" />
                            <span>{language === 'vi' ? 'Cài đặt' : 'Settings'}</span>
                        </Link>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-2 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-center font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.navbar.logout}</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-800 dark:text-stone-200 text-center font-medium text-sm"
                    >
                        {t.navbar.login}
                    </Link>
                    <Link
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-[#F5A764] text-white dark:text-stone-950 text-center font-medium text-sm"
                    >
                        {t.navbar.register}
                    </Link>
                </div>
            )}
        </div>
    ) : null;

    const toggleNotifications = () => {
        setIsNotificationsOpen((prev) => {
            const next = !prev;
            if (next) {
                setIsLanguageOpen(false);
                setIsProfileMenuOpen(false);
                setIsMobileMenuOpen(false);
            }
            return next;
        });
    };

    const renderNotificationPanel = (showCaret: boolean) => (
        <div
            role="dialog"
            aria-label={t.navbar.notificationsTitle}
            className="bg-white dark:bg-stone-900 rounded-2xl shadow-[0_14px_38px_rgba(42,33,27,0.16)] dark:shadow-black/50 border border-[#EADBCE] dark:border-stone-700 overflow-hidden relative"
        >
            {showCaret && (
                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white dark:bg-stone-900 border-t border-l border-[#EADBCE] dark:border-stone-700 rotate-45" />
            )}

            <div className="px-4 py-3 border-b border-[#F0E4D7] dark:border-stone-800 flex items-center justify-between bg-[#FAF7F2]/80 dark:bg-stone-900">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#C46A28] dark:text-[#F5A764]" aria-hidden="true" />
                    <span className="text-xs font-bold text-[#2A211B] dark:text-stone-100">
                        {t.navbar.notificationsTitle}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    aria-label={language === 'vi' ? 'Đóng thông báo' : 'Close notifications'}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#75675C] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100 hover:bg-[#EFE8DD] dark:hover:bg-stone-800 transition cursor-pointer"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="px-5 py-7 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <Bell className="w-5 h-5 text-[#C46A28] dark:text-[#F5A764]" aria-hidden="true" />
                </div>
                <p className="font-serif text-sm font-bold text-[#2A211B] dark:text-stone-100 mb-1">
                    {t.navbar.notificationsEmptyTitle}
                </p>
                <p className="text-xs text-[#6D5D52] dark:text-stone-400 leading-relaxed max-w-[260px] mx-auto">
                    {t.navbar.notificationsEmptyDesc}
                </p>
            </div>

            <div className="px-3 py-2.5 border-t border-[#F0E4D7] dark:border-stone-800 bg-[#FBF8F3] dark:bg-stone-950/50 grid grid-cols-2 gap-2">
                <Link
                    href="/transactions"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-[#2A211B] dark:text-stone-200 bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 hover:border-[#E89650] dark:hover:border-[#F5A764] transition"
                >
                    <Handshake className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764] shrink-0" />
                    <span className="truncate">{t.navbar.notificationsOrdersLink}</span>
                </Link>
                <Link
                    href="/settings"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-[#2A211B] dark:text-stone-200 bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 hover:border-[#E89650] dark:hover:border-[#F5A764] transition"
                >
                    <Settings className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764] shrink-0" />
                    <span className="truncate">{t.navbar.notificationsSettingsLink}</span>
                </Link>
            </div>
        </div>
    );

    const isChatPage = pathname === '/chat';

    return (
        <>
            {/* Constant-height flow spacer prevents scroll jitter when header morphs to a floating pill */}
            <div className="h-20 w-full shrink-0" aria-hidden="true" />

            <div
                className={`fixed top-0 inset-x-0 z-40 flex flex-col items-center pointer-events-none transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isScrolled ? 'pt-2.5 sm:pt-3 px-3 sm:px-6' : 'pt-0 px-0'
                }`}
            >
                <header
                    className={`pointer-events-auto relative surface-translucent transition-[min-width,border-radius,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isScrolled
                            ? 'w-fit min-w-[0%] max-w-full rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-[#EADBCE]/90 dark:border-stone-700/80 shadow-[0_12px_36px_rgba(42,33,27,0.14),0_2px_8px_rgba(195,170,140,0.2)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/70 dark:ring-white/10'
                            : 'w-fit min-w-full rounded-none bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-gray-100 dark:border-stone-800 shadow-xs'
                    }`}
                >
                    <div
                        className={`transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            isScrolled
                                ? 'px-2.5 sm:px-3.5'
                                : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
                        }`}
                    >
                        <div
                            className={`flex items-center justify-between transition-[height,gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                isScrolled ? 'h-14 sm:h-15 gap-1.5 sm:gap-2.5' : 'h-20 gap-4'
                            }`}
                        >

                            {/* Brand Logo & Slogan */}
                            <div className="shrink-0">
                                <BrandLogo variant="full" collapsed={isScrolled} />
                            </div>

                            {/* Right Action Cluster: Search Icon, Flag Language Button, Post Ad, Auth, Cart */}
                            <div className={`flex items-center shrink-0 transition-[gap] duration-300 ${isScrolled ? 'gap-1 sm:gap-1.5' : 'gap-2 sm:gap-3'}`}>

                                {/* 1. SEARCH TRIGGER */}
                                {/* Mobile Icon Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(true)}
                                    aria-label={t.navbar.searchAria}
                                    title={t.navbar.searchAria}
                                    className={`sm:hidden text-slate-700 dark:text-stone-300 hover:text-[#C46A28] dark:hover:text-amber-400 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 active:scale-95 rounded-full transition-all cursor-pointer flex items-center justify-center group ${
                                        isScrolled ? 'w-10 h-10' : 'min-w-[44px] min-h-[44px]'
                                    }`}
                                >
                                    <Search aria-hidden="true" className="w-5 h-5 text-slate-600 dark:text-stone-300 group-hover:text-[#C46A28] dark:group-hover:text-amber-400 transition-colors" />
                                </button>

                                {/* Desktop Search Bar -> collapses into a circular icon button on scroll */}
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(true)}
                                    aria-label={t.navbar.searchAria}
                                    title={t.navbar.searchAria}
                                    className={`hidden sm:flex items-center rounded-full bg-slate-100/90 dark:bg-stone-900 hover:bg-slate-100 dark:hover:bg-stone-800 border border-slate-200/80 dark:border-stone-700 text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer group shadow-2xs ${
                                        isScrolled
                                            ? 'w-10 h-10 p-0 justify-center'
                                            : 'gap-2 px-3.5 py-2 min-h-[40px] w-40 md:w-48 lg:w-60 xl:w-72'
                                    }`}
                                >
                                    <Search aria-hidden="true" className="w-4 h-4 text-[#6D5D52] dark:text-stone-400 group-hover:text-[#2A211B] dark:group-hover:text-stone-100 shrink-0 transition-colors" />
                                    <span
                                        className={`text-xs sm:text-sm text-[#6D5D52] dark:text-stone-300 group-hover:text-[#2A211B] dark:group-hover:text-stone-100 truncate transition-all duration-300 ${
                                            isScrolled ? 'max-w-0 opacity-0 hidden' : 'max-w-full opacity-100 flex-1 text-left'
                                        }`}
                                    >
                                        {t.navbar.searchPlaceholder}
                                    </span>
                                </button>

                                {/* 2. LANGUAGE SWITCHER WITH FLAG ICONS */}
                                <div ref={languageDropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsNotificationsOpen(false);
                                            setIsProfileMenuOpen(false);
                                            setIsLanguageOpen(!isLanguageOpen);
                                        }}
                                        aria-expanded={isLanguageOpen}
                                        aria-haspopup="menu"
                                        aria-label={t.navbar.langToggle}
                                        title={t.navbar.langToggle}
                                        className={`flex items-center rounded-full border border-slate-200 dark:border-stone-700 hover:border-slate-300 dark:hover:border-stone-600 bg-white dark:bg-stone-900 hover:bg-slate-50 dark:hover:bg-stone-800 text-slate-800 dark:text-stone-200 text-xs font-semibold shadow-2xs transition-all duration-300 cursor-pointer ${
                                            isScrolled ? 'w-10 h-10 justify-center p-0' : 'gap-2 px-3 py-1.5 min-h-[40px]'
                                        }`}
                                    >
                                        {language === 'vi' ? <VietnamFlag /> : <UKFlag />}
                                        {!isScrolled && (
                                            <>
                                                <span className="tracking-wider font-semibold">{language === 'vi' ? 'VIE' : 'ENG'}</span>
                                                <ChevronDown aria-hidden="true" className="w-3 h-3 text-[#6D5D52] dark:text-stone-400" />
                                            </>
                                        )}
                                    </button>

                                    {isLanguageOpen && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-slate-100 dark:border-stone-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLanguage('vi');
                                                    setIsLanguageOpen(false);
                                                }}
                                                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-stone-800 transition cursor-pointer ${language === 'vi' ? 'font-bold text-blue-600 dark:text-amber-400 bg-blue-50/50 dark:bg-stone-800/70' : 'text-slate-700 dark:text-stone-200'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    <VietnamFlag />
                                                    <span>Tiếng Việt</span>
                                                </span>
                                                {language === 'vi' && <span className="text-blue-600 dark:text-amber-400 text-xs font-bold">✓</span>}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLanguage('en');
                                                    setIsLanguageOpen(false);
                                                }}
                                                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-stone-800 transition cursor-pointer ${language === 'en' ? 'font-bold text-blue-600 dark:text-amber-400 bg-blue-50/50 dark:bg-stone-800/70' : 'text-slate-700 dark:text-stone-200'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    <UKFlag />
                                                    <span>English</span>
                                                </span>
                                                {language === 'en' && <span className="text-blue-600 dark:text-amber-400 text-xs font-bold">✓</span>}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Divider for desktop */}
                                <div className={`hidden md:block w-px h-6 bg-slate-200 dark:bg-stone-700 ${isScrolled ? 'mx-0' : 'mx-0.5'}`} />

                                {/* 3. DESKTOP ACTIONS: Admin, Post Ad, Auth, Cart */}
                                <div className={`hidden md:flex items-center ${isScrolled ? 'gap-1 sm:gap-1.5' : 'gap-2 sm:gap-2.5'}`}>
                                    {/* If Admin: Direct Shortcut to Admin Portal */}
                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            aria-label={t.navbar.adminPortal}
                                            title={t.navbar.adminPortal}
                                            className={`flex items-center bg-[#FAF5EE] hover:bg-[#EFE3D3] dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 text-[#3B2A1E] dark:text-stone-100 border border-[#DBC6AE] dark:border-stone-600 text-xs font-bold shadow-2xs transition-all duration-300 ${
                                                isScrolled
                                                    ? 'w-10 h-10 justify-center rounded-full p-0'
                                                    : 'gap-1.5 px-3.5 py-2 rounded-xl'
                                            }`}
                                        >
                                            <Shield className="w-4 h-4 text-[#855A3C] dark:text-[#E5C9A8] shrink-0" />
                                            {!isScrolled && <span className="whitespace-nowrap">{t.navbar.adminPortal}</span>}
                                        </Link>
                                    )}

                                    {/* Post Ad Button (TÍNH PHÍ - ĐẨY TIN BÁN GẤP) */}
                                    {onPostAdClick ? (
                                        <button
                                            type="button"
                                            onClick={onPostAdClick}
                                            aria-label={t.navbar.postAd}
                                            title={t.navbar.postAd}
                                            className={`flex items-center bg-[#E4D1B8] hover:bg-[#D7C0A2] dark:bg-[#C4A17D] dark:hover:bg-[#B48F69] active:scale-95 text-[#2A211B] dark:text-stone-950 border border-[#CEB495] dark:border-[#B48F69] text-xs sm:text-sm font-semibold shadow-2xs transition-all duration-300 cursor-pointer ${
                                                isScrolled
                                                    ? 'w-10 h-10 justify-center rounded-full p-0'
                                                    : 'gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl'
                                            }`}
                                        >
                                            <TrendingUp className="w-4 h-4 text-[#6B482C] dark:text-stone-950 shrink-0" />
                                            {!isScrolled && <span className="whitespace-nowrap">{t.navbar.postAd}</span>}
                                        </button>
                                    ) : (
                                        <Link
                                            href="/post-item"
                                            aria-label={t.navbar.postAd}
                                            title={t.navbar.postAd}
                                            className={`flex items-center bg-[#E4D1B8] hover:bg-[#D7C0A2] dark:bg-[#C4A17D] dark:hover:bg-[#B48F69] active:scale-95 text-[#2A211B] dark:text-stone-950 border border-[#CEB495] dark:border-[#B48F69] text-sm font-semibold shadow-2xs transition-all duration-300 ${
                                                isScrolled
                                                    ? 'w-10 h-10 justify-center rounded-full p-0'
                                                    : 'gap-1.5 px-4 py-2.5 rounded-xl'
                                            }`}
                                        >
                                            <TrendingUp className="w-4 h-4 text-[#6B482C] dark:text-stone-950 shrink-0" />
                                            {!isScrolled && <span className="whitespace-nowrap">{t.navbar.postAd}</span>}
                                        </Link>
                                    )}

                                    {/* Auth State Conditional Rendering */}
                                    {isAuthenticated && user ? (
                                        <div ref={profileDropdownRef} className={`relative ${isScrolled ? 'pl-0' : 'pl-1'}`}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsNotificationsOpen(false);
                                                    setIsLanguageOpen(false);
                                                    setIsProfileMenuOpen((prev) => !prev);
                                                }}
                                                aria-expanded={isProfileMenuOpen}
                                                aria-haspopup="menu"
                                                aria-label={user.fullName || user.username || (language === 'vi' ? 'Tài khoản & Cài đặt' : 'Account & Settings')}
                                                title={language === 'vi' ? 'Tài khoản & Cài đặt' : 'Account & Settings'}
                                                className={`flex items-center bg-[#FAF7F2] dark:bg-stone-900 hover:bg-[#F3E7DA] dark:hover:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 hover:border-[#E89650] dark:hover:border-[#E89650] transition-all duration-300 cursor-pointer ${
                                                    isScrolled
                                                        ? 'p-1 rounded-full'
                                                        : 'gap-2 px-3 py-1.5 rounded-xl'
                                                }`}
                                            >
                                                {user.avatarUrl && failedAvatarUrl !== user.avatarUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt={user.fullName || user.username || 'User'}
                                                        referrerPolicy="no-referrer"
                                                        onError={() => setFailedAvatarUrl(user.avatarUrl ?? null)}
                                                        className={`rounded-full object-cover shadow-2xs shrink-0 transition-all duration-300 ${
                                                            isScrolled ? 'w-8 h-8' : 'w-7 h-7'
                                                        }`}
                                                    />
                                                ) : (
                                                    <div
                                                        className={`rounded-full bg-gradient-to-tr from-[#E89650] to-[#F5A764] text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 transition-all duration-300 ${
                                                            isScrolled ? 'w-8 h-8' : 'w-7 h-7'
                                                        }`}
                                                    >
                                                        {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                                {!isScrolled && (
                                                    <>
                                                        <span className="text-xs font-semibold text-[#2A211B] dark:text-stone-100 max-w-[130px] truncate">
                                                            {user.fullName || user.username || 'Student'}
                                                        </span>
                                                        <ChevronDown
                                                            className={`w-3.5 h-3.5 text-[#7A6D63] dark:text-stone-400 transition-transform duration-150 ${
                                                                isProfileMenuOpen ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </>
                                                )}
                                            </button>

                                            {isProfileMenuOpen && (
                                                <div
                                                    role="menu"
                                                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 shadow-[0_14px_38px_rgba(42,33,27,0.16)] dark:shadow-black/50 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                                                >
                                                    {/* Account Summary Header */}
                                                    <div className="px-4 py-2.5 border-b border-[#F0E4D7] dark:border-stone-800">
                                                        <p className="text-xs font-bold text-[#2A211B] dark:text-stone-100 truncate">
                                                            {user.fullName || user.username || 'Student'}
                                                        </p>
                                                        <p className="text-[11px] text-[#7A6D63] dark:text-stone-400 truncate mt-0.5">
                                                            {user.email}
                                                        </p>
                                                    </div>

                                                    {/* Profile */}
                                                    <div className="py-1">
                                                        <Link
                                                            href="/profile"
                                                            role="menuitem"
                                                            onClick={() => setIsProfileMenuOpen(false)}
                                                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#2A211B] dark:text-stone-200 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition"
                                                        >
                                                            <User className="w-4 h-4 text-[#B8652B] dark:text-[#F5A764]" />
                                                            <span>{language === 'vi' ? 'Hồ sơ cá nhân' : 'Profile'}</span>
                                                        </Link>

                                                        {/* Transactions & Orders */}
                                                        <Link
                                                            href="/transactions"
                                                            role="menuitem"
                                                            onClick={() => setIsProfileMenuOpen(false)}
                                                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#2A211B] dark:text-stone-200 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition"
                                                        >
                                                            <Handshake className="w-4 h-4 text-[#B8652B] dark:text-[#F5A764]" />
                                                            <span>{language === 'vi' ? 'Đơn hàng & Đổi đồ' : 'Orders & Trades'}</span>
                                                        </Link>

                                                        {/* Settings */}
                                                        <Link
                                                            href="/settings"
                                                            role="menuitem"
                                                            onClick={() => setIsProfileMenuOpen(false)}
                                                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#2A211B] dark:text-stone-200 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition"
                                                        >
                                                            <Settings className="w-4 h-4 text-[#B8652B] dark:text-[#F5A764]" />
                                                            <span>{language === 'vi' ? 'Cài đặt' : 'Settings'}</span>
                                                        </Link>
                                                    </div>

                                                    {/* Logout inside Dropdown */}
                                                    <div className="pt-1 border-t border-[#F0E4D7] dark:border-stone-800">
                                                        <button
                                                            type="button"
                                                            role="menuitem"
                                                            onClick={() => {
                                                                setIsProfileMenuOpen(false);
                                                                logout();
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            <span>{t.navbar.logout}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Login Button */}
                                            <Link
                                                href="/login"
                                                className={`border border-slate-200 dark:border-stone-700 text-slate-800 dark:text-stone-200 hover:border-slate-300 dark:hover:border-stone-600 hover:bg-slate-50 dark:hover:bg-stone-800 font-semibold transition-all whitespace-nowrap ${
                                                    isScrolled
                                                        ? 'px-3 py-1.5 rounded-full text-xs'
                                                        : 'px-4 py-2.5 rounded-xl text-sm'
                                                }`}
                                            >
                                                {t.navbar.login}
                                            </Link>

                                            {/* Register Button */}
                                            <Link
                                                href="/register"
                                                className={`bg-slate-900 dark:bg-[#F5A764] hover:bg-slate-800 dark:hover:bg-[#E89650] text-white dark:text-stone-950 font-semibold shadow-xs transition-all whitespace-nowrap ${
                                                    isScrolled
                                                        ? 'px-3 py-1.5 rounded-full text-xs'
                                                        : 'px-4 py-2.5 rounded-xl text-sm'
                                                }`}
                                            >
                                                {t.navbar.register}
                                            </Link>
                                        </>
                                    )}

                                    {/* Notification Bell with Popover (Desktop) */}
                                    {isAuthenticated && (
                                        <div ref={desktopNotificationRef} className="relative">
                                            <button
                                                type="button"
                                                onClick={toggleNotifications}
                                                aria-expanded={isNotificationsOpen}
                                                aria-haspopup="dialog"
                                                title={t.navbar.notificationsTitle}
                                                aria-label={t.navbar.notificationsAria}
                                                className={`relative text-slate-700 dark:text-stone-200 hover:text-[#7D563A] dark:hover:text-[#E5C9A8] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                                                    isScrolled ? 'w-10 h-10 p-0' : 'p-2.5'
                                                }`}
                                            >
                                                <Bell className="w-5 h-5" />
                                            </button>

                                            {isNotificationsOpen && (
                                                <div className="absolute right-0 top-full mt-2.5 w-[340px] z-50 animate-in fade-in zoom-in-95 duration-150">
                                                    {renderNotificationPanel(true)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Cart & Shopee-style Empty Cart Popover */}
                                    <div className="relative group/cart">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isAuthenticated) {
                                                    setAuthRequiredReason('cart');
                                                    setIsAuthRequiredOpen(true);
                                                } else {
                                                    router.push('/cart');
                                                }
                                            }}
                                            aria-label={t.navbar.cartAria}
                                            className={`relative text-slate-700 dark:text-stone-200 hover:text-[#7D563A] dark:hover:text-[#E5C9A8] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                                                isScrolled ? 'w-10 h-10 p-0 ml-0' : 'p-2.5 ml-0.5'
                                            }`}
                                        >
                                            <ShoppingCart className="w-5 h-5 text-slate-700 dark:text-stone-200 group-hover/cart:text-[#7D563A] dark:group-hover/cart:text-[#E5C9A8] transition-colors" />
                                            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-xs">
                                                0
                                            </span>
                                        </button>

                                        {/* Shopee-style Floating Popover on Hover */}
                                        <div className="absolute right-0 top-full pt-2.5 z-50 invisible opacity-0 translate-y-1 group-hover/cart:visible group-hover/cart:opacity-100 group-hover/cart:translate-y-0 transition-all duration-200 pointer-events-none group-hover/cart:pointer-events-auto">
                                            <div className="w-[300px] sm:w-[320px] bg-white dark:bg-stone-900 rounded-2xl shadow-[0_12px_36px_rgba(42,33,27,0.14)] border border-[#EADBCE] dark:border-stone-700 p-6 text-center relative overflow-hidden">
                                                {/* Caret / Tooltip Arrow */}
                                                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white dark:bg-stone-900 border-t border-l border-[#EADBCE] dark:border-stone-700 rotate-45" />

                                                {/* Cute Kawaii Illustration (Shopee style) */}
                                                <div className="flex justify-center mb-3">
                                                    <CuteEmptyCartIllustration className="w-24 h-24 drop-shadow-xs" />
                                                </div>

                                                {/* No Products Yet Header */}
                                                <p className="font-serif text-base font-bold text-[#2A211B] dark:text-stone-100 mb-1">
                                                    {language === 'vi' ? 'Chưa Có Sản Phẩm' : 'No Products Yet'}
                                                </p>
                                                <p className="text-xs text-[#7A6D63] dark:text-stone-400 mb-4 leading-relaxed">
                                                    {language === 'vi'
                                                        ? 'Giỏ hàng của bạn đang trống. Hãy bắt đầu mua sắm nào!'
                                                        : 'Your shopping cart is empty. Shopping Now!'}
                                                </p>

                                                {/* Action Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!isAuthenticated) {
                                                            setAuthRequiredReason('cart');
                                                            setIsAuthRequiredOpen(true);
                                                        } else {
                                                            const productSection = document.querySelector('.grid');
                                                            productSection?.scrollIntoView({ behavior: 'smooth' });
                                                        }
                                                    }}
                                                    className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-xs font-semibold text-[#2A211B] bg-[#DFC9AE] hover:bg-[#D2B796] border border-[#CEB290] shadow-2xs transition-all active:scale-98 cursor-pointer"
                                                >
                                                    {language === 'vi' ? 'Mua sắm ngay' : 'Shop Now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. MOBILE CONTROLS (Notification Bell + Cart + Hamburger Menu Toggle) */}
                                <div className="flex md:hidden items-center gap-0.5 sm:gap-1">
                                    {isAuthenticated && (
                                        <div ref={mobileNotificationRef} className="relative">
                                            <button
                                                type="button"
                                                onClick={toggleNotifications}
                                                aria-expanded={isNotificationsOpen}
                                                aria-haspopup="dialog"
                                                title={t.navbar.notificationsTitle}
                                                aria-label={t.navbar.notificationsAria}
                                                className={`relative flex items-center justify-center text-slate-700 dark:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-full cursor-pointer ${
                                                    isScrolled ? 'w-10 h-10' : 'min-w-[44px] min-h-[44px]'
                                                }`}
                                            >
                                                <Bell aria-hidden="true" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                setAuthRequiredReason('cart');
                                                setIsAuthRequiredOpen(true);
                                            } else {
                                                router.push('/cart');
                                            }
                                        }}
                                        className={`relative flex items-center justify-center text-slate-700 dark:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-full cursor-pointer ${
                                            isScrolled ? 'w-10 h-10' : 'min-w-[44px] min-h-[44px]'
                                        }`}
                                        aria-label={t.navbar.cartAria}
                                    >
                                        <ShoppingCart aria-hidden="true" className="w-5 h-5" />
                                        <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold tabular-nums text-white bg-rose-600 rounded-full">
                                            0
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsNotificationsOpen(false);
                                            setIsMobileMenuOpen(!isMobileMenuOpen);
                                        }}
                                        aria-expanded={isMobileMenuOpen}
                                        className={`flex items-center justify-center text-slate-700 dark:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-800 cursor-pointer ${
                                            isScrolled ? 'w-10 h-10 rounded-full' : 'min-w-[44px] min-h-[44px] rounded-lg'
                                        }`}
                                        aria-label={language === 'vi' ? (isMobileMenuOpen ? 'Đóng menu' : 'Mở menu') : (isMobileMenuOpen ? 'Close menu' : 'Open menu')}
                                    >
                                        {isMobileMenuOpen ? <X aria-hidden="true" className="w-5 h-5" /> : <Menu aria-hidden="true" className="w-6 h-6" />}
                                    </button>
                                </div>

                            </div>

                        </div>

                        {/* Mobile Dropdown Navigation Menu when expanded */}
                        {!isScrolled && isMobileMenuOpen && (
                            <div className="md:hidden border-t border-slate-100 dark:border-stone-800 animate-in fade-in slide-in-from-top-2 duration-150">
                                {mobileMenuContent}
                            </div>
                        )}
                    </div>
                </header>

                {/* Mobile Notification Panel anchored cleanly inside viewport */}
                {isAuthenticated && isNotificationsOpen && (
                    <div
                        ref={mobileNotificationPanelRef}
                        className="md:hidden pointer-events-auto mt-2 w-full max-w-md px-3 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                        {renderNotificationPanel(false)}
                    </div>
                )}

                {/* Detached Floating Mobile Menu Card when header is collapsed as a pill */}
                {isScrolled && isMobileMenuOpen && (
                    <div className="md:hidden pointer-events-auto mt-2 w-full max-w-md px-4 rounded-2xl surface-translucent bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-[#EADBCE] dark:border-stone-700 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                        {mobileMenuContent}
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* TOPZONE-STYLE EXPANDABLE SEARCH OVERLAY (NỀN TRẮNG ĐỒNG BỘ) */}
            {/* ========================================================= */}
            {isSearchOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={language === 'vi' ? 'Tìm kiếm sản phẩm' : 'Search marketplace'}
                    className="fixed inset-0 z-50 flex flex-col animate-in fade-in duration-200"
                >

                    {/* 1. White Top Search Bar Header (Đồng bộ nền trắng sáng với website) */}
                    <div ref={searchContainerRef} className="w-full bg-white dark:bg-stone-950 border-b border-slate-200 dark:border-stone-800 shadow-xl relative z-20">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">

                            {/* Search Form */}
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex-1 flex items-center gap-3 bg-transparent"
                            >
                                <label htmlFor="navbar-global-search" className="sr-only">
                                    {t.navbar.searchPlaceholder}
                                </label>
                                {/* Magnifying Glass Icon (Slate Outline) */}
                                <Search aria-hidden="true" className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-stone-400 shrink-0" />

                                {/* Input Field */}
                                <input
                                    id="navbar-global-search"
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchQuery(val);
                                        if (val === '' && searchParams.get('q')) {
                                            router.push('/');
                                        }
                                    }}
                                    placeholder={t.navbar.searchPlaceholder}
                                    className="w-full bg-transparent text-slate-900 dark:text-stone-100 placeholder-[#6D5D52] dark:placeholder-stone-400 text-sm sm:text-base md:text-lg outline-none font-normal caret-[#C46A28] dark:caret-[#F5A764]"
                                />

                                {/* Clear Input button if query is not empty */}
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        aria-label={language === 'vi' ? 'Xóa từ khóa tìm kiếm' : 'Clear search text'}
                                        className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-stone-100 rounded-full hover:bg-slate-100 dark:hover:bg-stone-800 transition cursor-pointer"
                                        title={language === 'vi' ? 'Xóa nội dung' : 'Clear text'}
                                    >
                                        <X aria-hidden="true" className="w-4 h-4" />
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Popular / Trending Suggestions Tray */}
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4 pt-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-[#F5A764]" />
                                {t.navbar.suggestions}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {t.navbar.popularSearches.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleSelectTag(tag)}
                                        className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-stone-900 hover:bg-blue-50 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-200 hover:text-blue-700 dark:hover:text-[#F5A764] border border-slate-200/90 dark:border-stone-700 hover:border-blue-200 dark:hover:border-stone-600 font-medium transition cursor-pointer shrink-0"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Soft Dimmed Backdrop covering the entire page beneath */}
                    <div
                        onClick={() => setIsSearchOpen(false)}
                        className="flex-1 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
                    />
                </div>
            )}
            {/* Pinned Floating Message Button at bottom-right corner (hidden on /chat) */}
            {!isChatPage && (
                <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group/chat">
                    {isAuthenticated ? (
                        <Link
                            href="/chat"
                            aria-label={
                                totalUnread > 0
                                    ? `${t.navbar.messagesLabel} (${totalUnread})`
                                    : t.navbar.messagesLabel
                            }
                            title={t.navbar.messagesLabel}
                            className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#C46A28] hover:bg-[#B55E20] dark:bg-[#F5A764] dark:hover:bg-[#E89650] text-white dark:text-stone-950 ring-4 ring-[#FAF7F2]/85 dark:ring-stone-950/85 shadow-[0_12px_30px_rgba(196,106,40,0.34)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)] active:scale-95 transition-all duration-200"
                        >
                            <MessageCircle aria-hidden="true" className="w-6 h-6 transition-transform duration-200 group-hover/chat:scale-110" />
                            {totalUnread > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-[11px] font-bold tabular-nums text-white bg-rose-600 rounded-full border-2 border-[#FAF7F2] dark:border-stone-950 shadow-sm">
                                    {totalUnread > 99 ? '99+' : totalUnread}
                                </span>
                            )}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setAuthRequiredReason('chat');
                                setIsAuthRequiredOpen(true);
                            }}
                            aria-label={t.navbar.messagesLabel}
                            title={t.navbar.messagesLabel}
                            className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#C46A28] hover:bg-[#B55E20] dark:bg-[#F5A764] dark:hover:bg-[#E89650] text-white dark:text-stone-950 ring-4 ring-[#FAF7F2]/85 dark:ring-stone-950/85 shadow-[0_12px_30px_rgba(196,106,40,0.34)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)] active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <MessageCircle aria-hidden="true" className="w-6 h-6 transition-transform duration-200 group-hover/chat:scale-110" />
                        </button>
                    )}

                    {/* Hover label tooltip on desktop */}
                    <span
                        aria-hidden="true"
                        className="hidden sm:flex items-center px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-[#2A211B] dark:bg-stone-800 text-white dark:text-stone-100 border border-[#3B2E26] dark:border-stone-700 shadow-lg absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 translate-x-2 pointer-events-none group-hover/chat:opacity-100 group-hover/chat:translate-x-0 transition-all duration-200"
                    >
                        {t.navbar.messagesLabel}
                    </span>
                </div>
            )}

            {/* Auth Required Modal triggered by Cart / Chat / Shop Now for guests */}
            <AuthRequiredModal
                isOpen={isAuthRequiredOpen}
                onClose={() => setIsAuthRequiredOpen(false)}
                reason={authRequiredReason}
            />
        </>
    );
};
