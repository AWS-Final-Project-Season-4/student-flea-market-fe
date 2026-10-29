///////////////////////////////////////////////////////////
//                                                       //
//                   LOGIN PAGE                          //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');
    const authErrorParam = searchParams.get('error');

    const { login, isLoading, error: storeError, clearError, initAuth } = useAuthStore();

    const [emailOrUsername, setEmailOrUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [rememberMe, setRememberMe] = useState<boolean>(true);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Handle warning if redirected from protected admin route
    useEffect(() => {
        if (authErrorParam === 'unauthorized_admin') {
            setLocalError('This area requires Administrator privileges. Please sign in with an Admin account.');
        }
    }, [authErrorParam]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);
        setSuccessMessage(null);
        clearError();

        if (!emailOrUsername.trim() || !password.trim()) {
            setLocalError('Please enter both your identifier (email or username) and password.');
            return;
        }

        try {
            const authResult = await login(emailOrUsername.trim(), password, rememberMe);
            setSuccessMessage('Signed in successfully! Redirecting...');

            // Route redirection based on role
            setTimeout(() => {
                if (authResult.user.roleName === 'Admin' || authResult.user.role === 1) {
                    router.push('/admin');
                } else if (redirectPath && !redirectPath.startsWith('/admin')) {
                    router.push(redirectPath);
                } else {
                    router.push('/');
                }
            }, 500);
        } catch (err: any) {
            setLocalError(err.message || 'Authentication failed. Please check your credentials.');
        }
    };

    const displayError = localError || storeError;

    return (
        <div className="w-full max-w-[440px] bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(195,170,140,0.16)] border border-[#EFE8DD] relative z-10">

            {/* Card Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-serif font-bold text-[#2A211B] tracking-tight">
                        Sign In
                    </h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE8DD] text-[#7A6D63] font-medium">
                        Student Flea Market
                    </span>
                </div>
                <p className="text-xs sm:text-sm text-[#7A6D63] mt-2 leading-relaxed">
                    Welcome back! Please enter your details to continue.
                </p>
            </div>

            {/* Error Banner */}
            {displayError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">{displayError}</div>
                </div>
            )}

            {/* Success Banner */}
            {successMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs font-medium animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">

                {/* Field 1: Student Email / Identifier */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A39589]">
                        <Mail className="w-4 h-4" />
                    </div>
                    <input
                        id="email"
                        type="text"
                        required
                        value={emailOrUsername}
                        onChange={(e) => {
                            setEmailOrUsername(e.target.value);
                            if (localError) setLocalError(null);
                        }}
                        placeholder="Email or Username (e.g. admin)"
                        className="w-full pl-10 pr-4 py-3.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl text-[#2A211B] placeholder-[#A6998E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white transition"
                    />
                </div>

                {/* Field 2: Password */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A39589]">
                        <Lock className="w-4 h-4" />
                    </div>
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (localError) setLocalError(null);
                        }}
                        placeholder="Password"
                        className="w-full pl-10 pr-10 py-3.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl text-[#2A211B] placeholder-[#A6998E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white transition"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A39589] hover:text-[#2A211B] transition cursor-pointer"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Auxiliary Row */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-[#D5C7B8] text-[#F5A764] focus:ring-[#F5A764] accent-[#F5A764] cursor-pointer"
                        />
                        <span className="text-[#6B5E55]">Remember me</span>
                    </label>

                    <Link
                        href="/forgot-password"
                        className="font-normal text-[#A8744F] hover:text-[#885633] hover:underline transition"
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-2xl font-medium text-white bg-[#F5A764] hover:bg-[#E89650] active:scale-[0.99] shadow-[0_8px_20px_rgba(245,167,100,0.3)] hover:shadow-[0_10px_24px_rgba(245,167,100,0.38)] transition-all cursor-pointer disabled:opacity-60 text-sm mt-2 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Authenticating with server...</span>
                        </>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EFE8DD]" />
                </div>
                <span className="relative bg-white px-3 text-[11px] text-[#A6998E] font-normal tracking-wide">
                    Or continue with
                </span>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-2.5">
                <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] transition cursor-pointer text-xs font-medium text-[#2A211B] shadow-2xs"
                >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                        <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                        <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                    </svg>
                    <span>Google</span>
                </button>

                <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] transition cursor-pointer text-xs font-medium text-[#2A211B] shadow-2xs"
                >
                    <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.06.62-2.73 1.4-.58.67-1.1 1.76-.96 2.83 1.04.08 2.1-.5 2.73-1.27z" />
                    </svg>
                    <span>Apple ID</span>
                </button>

                <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] transition cursor-pointer text-xs font-medium text-[#2A211B] shadow-2xs"
                >
                    <svg className="w-3.5 h-3.5 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                </button>
            </div>

            {/* Footer Sign-up Prompt */}
            <p className="mt-7 text-center text-xs text-[#7A6D63]">
                Don't have a student account?{' '}
                <Link
                    href="/register"
                    className="font-semibold text-[#B87333] hover:text-[#995922] hover:underline transition"
                >
                    Sign up now
                </Link>
            </p>

            {/* Copyright */}
            <p className="mt-3 text-center text-[11px] text-[#A6998E]">
                Copyright © 2026 - Student Flea Market. All rights reserved.
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen w-full bg-[#FAF7F2] flex flex-col lg:flex-row font-sans selection:bg-[#F5A764]/30 selection:text-stone-900 overflow-x-hidden">

            {/* ========================================================= */}
            {/* LEFT SECTION (Illustration & Brand Intro)                 */}
            {/* ========================================================= */}
            <section className="w-full lg:w-[56%] xl:w-[58%] min-h-[420px] lg:min-h-screen relative flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#EFE8DD]">

                <Image
                    src="/Campus%20Flea%20Market%20Day.webp"
                    alt="Campus Flea Market Day"
                    fill
                    priority
                    quality={80}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover object-center"
                />

                {/* Ambient Top Gradient */}
                <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#FAF7F2]/90 via-[#FAF7F2]/60 to-transparent pointer-events-none" />

                {/* Top Brand Identity */}
                <div className="relative z-10 text-center px-4 sm:px-6 pt-8 sm:pt-12 w-full max-w-none mx-auto">
                    <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-serif font-bold text-[#2A211B] tracking-wide leading-tight whitespace-nowrap drop-shadow-xs">
                        Student Flea Market
                    </h1>
                </div>

                <div className="relative z-10 pointer-events-none" />
            </section>

            {/* ========================================================= */}
            {/* RIGHT SECTION: Floating Card Stage                       */}
            {/* ========================================================= */}
            <section className="w-full lg:w-[44%] xl:w-[42%] min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-[#FAF7F2]">

                {/* Sparkles */}
                <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                    <span className="absolute top-16 right-[16%] text-[#CDB9A5] text-2xl">✦</span>
                    <span className="absolute bottom-20 right-[12%] text-[#CDB9A5] text-xl">✦</span>
                    <span className="absolute top-28 left-[12%] text-[#CDB9A5] text-base">✧</span>
                </div>

                <Suspense fallback={
                    <div className="p-8 text-center text-sm text-[#7A6D63]">
                        Loading interface...
                    </div>
                }>
                    <LoginForm />
                </Suspense>
            </section>

        </main>
    );
}
