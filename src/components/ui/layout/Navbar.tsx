'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    ChevronDown,
    PlusCircle,
    ShoppingCart,
    Menu,
    X,
    Shield,
    LogOut,
    TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';
import { BrandLogo } from '@/components/ui/BrandLogo';

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
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get('q') || '';

    const { language, setLanguage } = useLanguageStore();
    const t = DICTIONARY[language];

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(currentQuery);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);

    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const languageDropdownRef = useRef<HTMLDivElement | null>(null);
    const { user, isAuthenticated, initAuth, logout } = useAuthStore();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Keep searchQuery in sync with url if it changes
    useEffect(() => {
        setSearchQuery(currentQuery);
    }, [currentQuery]);

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

    // Keyboard shortcuts: ESC to close search, Ctrl+K / Cmd+K to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

    // Close language dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                languageDropdownRef.current &&
                !languageDropdownRef.current.contains(e.target as Node)
            ) {
                setIsLanguageOpen(false);
            }
        };
        if (isLanguageOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isLanguageOpen]);

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

    const isAdmin = user?.roleName === 'Admin' || user?.role === 1;

    return (
        <>
            <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 gap-4">

                        {/* Brand Logo & Slogan */}
                        <div className="shrink-0"><BrandLogo variant="full" /></div>

                        {/* Right Action Cluster: Search Icon, Flag Language Button, Post Ad, Auth, Cart */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

                            {/* 1. SEARCH TRIGGER */}
                            {/* Mobile Icon Button */}
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                aria-label={t.navbar.searchAria}
                                title={t.navbar.searchAria}
                                className="sm:hidden p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 active:scale-95 rounded-full transition-all cursor-pointer flex items-center justify-center group"
                            >
                                <Search className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                            </button>

                            {/* Desktop Search Bar with Dim Placeholder */}
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                aria-label={t.navbar.searchAria}
                                title={t.navbar.searchAria}
                                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 text-slate-400 hover:text-slate-600 transition-all cursor-pointer w-36 md:w-48 lg:w-60 xl:w-72 group shadow-2xs"
                            >
                                <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
                                <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-500 truncate">
                                    {t.navbar.searchPlaceholder}
                                </span>
                            </button>

                            {/* 2. LANGUAGE SWITCHER WITH FLAG ICONS (Nút Language có cờ sinh động) */}
                            <div ref={languageDropdownRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                                    title={t.navbar.langToggle}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition cursor-pointer"
                                >
                                    {language === 'vi' ? <VietnamFlag /> : <UKFlag />}
                                    <span>{language === 'vi' ? 'VIE' : 'ENG'}</span>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                </button>

                                {isLanguageOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLanguage('vi');
                                                setIsLanguageOpen(false);
                                            }}
                                            className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${language === 'vi' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <VietnamFlag />
                                                <span>Tiếng Việt</span>
                                            </span>
                                            {language === 'vi' && <span className="text-blue-600 text-xs font-bold">✓</span>}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLanguage('en');
                                                setIsLanguageOpen(false);
                                            }}
                                            className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${language === 'en' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <UKFlag />
                                                <span>English</span>
                                            </span>
                                            {language === 'en' && <span className="text-blue-600 text-xs font-bold">✓</span>}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Divider for desktop */}
                            <div className="hidden md:block w-px h-6 bg-slate-200 mx-0.5" />

                            {/* 3. DESKTOP ACTIONS: Admin, Post Ad, Auth, Cart */}
                            <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
                                {/* If Admin: Direct Shortcut to Admin Portal */}
                                {isAdmin && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold shadow-xs transition"
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>{t.navbar.adminPortal}</span>
                                    </Link>
                                )}

                                {/* Post Ad Button */}
                                {onPostAdClick ? (
                                    <button
                                        type="button"
                                        onClick={onPostAdClick}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        <span>{t.navbar.postAd}</span>
                                    </button>
                                ) : (
                                    <Link
                                        href="/post-item"
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all"
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        <span>{t.navbar.postAd}</span>
                                    </Link>
                                )}

                                {/* Auth State Conditional Rendering */}
                                {isAuthenticated && user ? (
                                    <div className="flex items-center gap-2 pl-1">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE]">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#E89650] to-[#F5A764] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                                                {user.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-xs font-semibold text-[#2A211B] max-w-[120px] truncate">
                                                {user.fullName || user.username || 'Student'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => logout()}
                                            title={t.navbar.logout}
                                            className="p-2 rounded-xl border border-[#EADBCE] text-[#7A6D63] hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Login Button */}
                                        <Link
                                            href="/login"
                                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 text-sm font-semibold transition-colors"
                                        >
                                            {t.navbar.login}
                                        </Link>

                                        {/* Register Button */}
                                        <Link
                                            href="/register"
                                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-colors"
                                        >
                                            {t.navbar.register}
                                        </Link>
                                    </>
                                )}

                                {/* Cart & Shopee-style Empty Cart Popover */}
                                <div className="relative group/cart">
                                    <Link
                                        href="/cart"
                                        aria-label={t.navbar.cartAria}
                                        className="relative p-2.5 text-slate-700 hover:text-[#C46A28] hover:bg-[#FAF7F2] rounded-full transition-colors ml-0.5 flex items-center justify-center cursor-pointer"
                                    >
                                        <ShoppingCart className="w-5 h-5 text-slate-700 group-hover/cart:text-[#C46A28] transition-colors" />
                                        <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-xs">
                                            0
                                        </span>
                                    </Link>

                                    {/* Shopee-style Floating Popover on Hover */}
                                    <div className="absolute right-0 top-full pt-2.5 z-50 invisible opacity-0 translate-y-1 group-hover/cart:visible group-hover/cart:opacity-100 group-hover/cart:translate-y-0 transition-all duration-200 pointer-events-none group-hover/cart:pointer-events-auto">
                                        <div className="w-[300px] sm:w-[320px] bg-white rounded-2xl shadow-[0_12px_36px_rgba(42,33,27,0.14)] border border-[#EADBCE] p-6 text-center relative overflow-hidden">
                                            {/* Caret / Tooltip Arrow */}
                                            <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-t border-l border-[#EADBCE] rotate-45" />

                                            {/* Cute Kawaii Illustration (Shopee style) */}
                                            <div className="flex justify-center mb-3">
                                                <CuteEmptyCartIllustration className="w-24 h-24 drop-shadow-xs" />
                                            </div>

                                            {/* No Products Yet Header */}
                                            <p className="text-sm font-bold text-[#2A211B] mb-1">
                                                {language === 'vi' ? 'Chưa Có Sản Phẩm' : 'No Products Yet'}
                                            </p>
                                            <p className="text-xs text-[#7A6D63] mb-4 leading-relaxed">
                                                {language === 'vi'
                                                    ? 'Giỏ hàng của bạn đang trống. Hãy bắt đầu mua sắm nào!'
                                                    : 'Your shopping cart is empty. Shopping Now!'}
                                            </p>

                                            {/* Action Button */}
                                            <Link
                                                href="/#products"
                                                onClick={() => {
                                                    const productSection = document.querySelector('.grid');
                                                    productSection?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#F5A764] hover:bg-[#E89650] shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
                                            >
                                                {language === 'vi' ? 'Mua sắm ngay' : 'Shop Now'}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. MOBILE CONTROLS (Cart + Hamburger Menu Toggle) */}
                            <div className="flex md:hidden items-center gap-1">
                                <Link
                                    href="/cart"
                                    className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-full"
                                    aria-label={t.navbar.cartAria}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                                        0
                                    </span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                    aria-label="Toggle menu"
                                >
                                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>

                        </div>

                    </div>

                    {/* Mobile Dropdown Navigation Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-slate-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 text-center font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <Shield className="w-4 h-4" />
                                    <span>{t.navbar.adminPortal}</span>
                                </Link>
                            )}
                            {onPostAdClick ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        onPostAdClick();
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    <span>{t.navbar.postAd}</span>
                                </button>
                            ) : (
                                <Link
                                    href="/post-item"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center font-semibold text-sm flex items-center justify-center gap-2"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    <span>{t.navbar.postListingMobile}</span>
                                </Link>
                            )}
                            {isAuthenticated && user ? (
                                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                                    <div className="text-xs font-semibold text-slate-700 px-1">
                                        {t.navbar.signedInAs} {user.fullName || user.email}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full py-2 px-4 rounded-xl border border-rose-200 text-rose-600 text-center font-semibold text-xs cursor-pointer"
                                    >
                                        {t.navbar.logout}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-800 text-center font-medium text-sm"
                                    >
                                        {t.navbar.login}
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-center font-medium text-sm"
                                    >
                                        {t.navbar.register}
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* ========================================================= */}
            {/* TOPZONE-STYLE EXPANDABLE SEARCH OVERLAY (NỀN TRẮNG ĐỒNG BỘ) */}
            {/* ========================================================= */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 flex flex-col animate-in fade-in duration-200">

                    {/* 1. White Top Search Bar Header (Đồng bộ nền trắng sáng với website) */}
                    <div ref={searchContainerRef} className="w-full bg-white border-b border-slate-200 shadow-xl relative z-20">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">

                            {/* Search Form */}
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex-1 flex items-center gap-3 bg-transparent"
                            >
                                {/* Magnifying Glass Icon (Slate Outline) */}
                                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 shrink-0" />

                                {/* Input Field */}
                                <input
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
                                    className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-base md:text-lg outline-none font-normal caret-blue-600"
                                />

                                {/* Clear Input button if query is not empty */}
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                                        title="Clear text"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Popular / Trending Suggestions Tray */}
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4 pt-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                                {t.navbar.suggestions}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {t.navbar.popularSearches.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleSelectTag(tag)}
                                        className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/90 hover:border-blue-200 font-medium transition cursor-pointer shrink-0"
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
        </>
    );
};
