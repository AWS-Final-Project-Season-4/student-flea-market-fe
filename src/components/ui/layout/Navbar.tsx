'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, PlusCircle, ShoppingCart, Menu, X, Shield, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export const Navbar: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const { user, isAuthenticated, initAuth, logout } = useAuthStore();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    const isAdmin = user?.roleName === 'Admin' || user?.role === 1;

    return (
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 gap-4">

                    {/* Brand Logo & Slogan */}
                    <Link href="/" className="flex items-center gap-3 shrink-0 group">
                        <div className="relative w-11 h-11 flex items-center justify-center">
                            {/* Decorative 3D Book Icon */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-amber-400 to-orange-500 p-0.5 shadow-sm transform group-hover:scale-105 transition-transform duration-200">
                                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                                    <div className="space-y-1">
                                        <span className="block w-5 h-1 bg-sky-500 rounded-full" />
                                        <span className="block w-6 h-1 bg-amber-500 rounded-full" />
                                        <span className="block w-4 h-1 bg-orange-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                                Student <span className="text-blue-600">Flea Market</span>
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 hidden sm:block">
                                Buying & Selling • Exchanging • Connecting Students
                            </span>
                        </div>
                    </Link>

                    {/* Centered Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-2">
                        <div className="w-full flex items-center border border-slate-200 rounded-full pl-4 pr-1.5 py-1 bg-slate-50/70 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-xs">

                            {/* Category Dropdown Picker */}
                            <button
                                type="button"
                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 whitespace-nowrap pr-3 shrink-0"
                            >
                                <span>{selectedCategory}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {/* Vertical Divider */}
                            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

                            {/* Search Text Input */}
                            <input
                                type="text"
                                placeholder="Find textbooks, dorm essentials, electronics, student gear..."
                                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none px-2"
                            />

                            {/* Blue Search Action Button */}
                            <button
                                type="button"
                                aria-label="Search"
                                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white p-2.5 rounded-full transition-all shrink-0 shadow-sm cursor-pointer"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="hidden lg:flex items-center gap-2.5 shrink-0">

                        {/* If Admin: Direct Shortcut to Admin Portal */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold shadow-xs transition"
                            >
                                <Shield className="w-3.5 h-3.5" />
                                <span>Admin Portal</span>
                            </Link>
                        )}

                        {/* Post Ad Button */}
                        <Link
                            href="/post-item"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Post Ad</span>
                        </Link>

                        {/* Auth State Conditional Rendering */}
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-2 pl-1">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80">
                                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                                        {user.fullName?.charAt(0) || 'U'}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                                        {user.fullName || user.username || 'Student'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => logout()}
                                    title="Sign out"
                                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
                                    Sign In
                                </Link>

                                {/* Register Button */}
                                <Link
                                    href="/register"
                                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}

                        {/* Cart & Notification Icon */}
                        <Link
                            href="/cart"
                            aria-label="Cart and notifications"
                            className="relative p-2.5 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors ml-0.5"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-xs">
                                0
                            </span>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <div className="flex md:hidden items-center gap-2">
                        <Link
                            href="/cart"
                            className="relative p-2 text-slate-700"
                            aria-label="Cart"
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

                {/* Mobile Search Bar Expansion */}
                <div className="pb-3 md:hidden">
                    <div className="flex items-center border border-slate-200 rounded-full px-3 py-1.5 bg-slate-50">
                        <input
                            type="text"
                            placeholder="Search student items..."
                            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
                        />
                        <button
                            type="button"
                            className="bg-blue-600 text-white p-1.5 rounded-full"
                        >
                            <Search className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-slate-100 flex flex-col gap-3">
                        {isAdmin && (
                            <Link
                                href="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 text-center font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <Shield className="w-4 h-4" />
                                <span>Go to Admin Portal</span>
                            </Link>
                        )}
                        <Link
                            href="/post-item"
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center font-semibold text-sm"
                        >
                            + Post New Listing
                        </Link>
                        {isAuthenticated && user ? (
                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                                <div className="text-xs font-semibold text-slate-700 px-1">
                                    Signed in as: {user.fullName || user.email}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        logout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full py-2 px-4 rounded-xl border border-rose-200 text-rose-600 text-center font-semibold text-xs"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/login"
                                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-800 text-center font-medium text-sm"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-center font-medium text-sm"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};
