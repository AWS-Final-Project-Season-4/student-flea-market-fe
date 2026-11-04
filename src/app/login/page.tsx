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
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, User, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { VietnamFlag, UKFlag } from '@/components/ui/layout/Navbar';


function formatAuthMessage(msg: string | null, lang: 'vi' | 'en'): string | null {
    if (!msg) return null;

    if (lang === 'vi') {
        if (msg.includes('Please enter both your identifier') || msg.includes('Vui lòng nhập cả') || msg.includes('EMPTY_FIELDS')) {
            return 'Vui lòng nhập đầy đủ tài khoản (email hoặc tên đăng nhập) và mật khẩu.';
        }
        if (msg.includes('Login successfully') || msg.includes('Đăng nhập thành công')) {
            return 'Đăng nhập thành công! Đang chuyển hướng...';
        }
        if (msg.includes('requires Administrator privileges') || msg.includes('quyền Quản trị viên')) {
            return 'Khu vực này yêu cầu quyền Quản trị viên. Vui lòng đăng nhập bằng tài khoản Admin.';
        }
        if (msg.includes('registered and verified successfully') || msg.includes('xác thực tài khoản thành công')) {
            return 'Đăng ký và xác thực tài khoản thành công! Bạn có thể đăng nhập ngay.';
        }
        if (msg.includes('Authentication failed') || msg.includes('check your credentials') || msg.includes('INVALID_CREDENTIALS') || msg.includes('không đúng') || msg.includes('không chính xác')) {
            return 'Email, tên tài khoản hoặc mật khẩu không chính xác.';
        }
        if (msg.includes('Unable to connect') || msg.includes('ERR_NETWORK') || msg.includes('kết nối đến máy chủ')) {
            return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
        }
        if (msg.includes('banned') || msg.includes('ACCOUNT_BANNED') || msg.includes('bị khóa')) {
            return 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
        }
        if (msg.includes('inactive') || msg.includes('ACCOUNT_INACTIVE') || msg.includes('chưa được kích hoạt')) {
            return 'Tài khoản chưa được kích hoạt.';
        }
        if (msg.includes('not verified') || msg.includes('EMAIL_NOT_VERIFIED') || msg.includes('chưa được xác thực')) {
            return 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực mã OTP.';
        }
        if (msg.includes('Google authentication failed')) {
            return 'Đăng nhập Google thất bại. Vui lòng nhập thông tin đăng nhập thủ công.';
        }
        if (msg.includes('Authenticating with Google')) {
            return 'Đang xác thực với tài khoản Google...';
        }
        if (msg.includes('Welcome back')) {
            return msg.replace('Welcome back', 'Chào mừng quay trở lại').replace('Redirecting...', 'Đang chuyển hướng...');
        }
    } else {
        if (msg.includes('không đúng') || msg.includes('không chính xác') || msg.includes('INVALID_CREDENTIALS')) {
            return 'Invalid email, username, or password.';
        }
        if (msg.includes('bị khóa') || msg.includes('ACCOUNT_BANNED')) {
            return 'Your account has been banned. Please contact the administrator.';
        }
        if (msg.includes('chưa được kích hoạt') || msg.includes('ACCOUNT_INACTIVE')) {
            return 'Your account is currently inactive.';
        }
        if (msg.includes('chưa được xác thực') || msg.includes('EMAIL_NOT_VERIFIED')) {
            return 'Email is not verified. Please check your inbox and verify the OTP.';
        }
        if (msg.includes('Vui lòng nhập cả') || msg.includes('Vui lòng nhập đầy đủ')) {
            return 'Please enter both your identifier (email or username) and password.';
        }
        if (msg.includes('Đăng nhập thành công')) {
            return 'Login successfully! Redirecting...';
        }
        if (msg.includes('Không thể kết nối')) {
            return 'Unable to connect to backend server. Please check your network.';
        }
        if (msg.includes('yêu cầu quyền Quản trị viên')) {
            return 'This area requires Administrator privileges. Please login with an Admin account.';
        }
    }

    return msg;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');
    const authErrorParam = searchParams.get('error');
    const registeredParam = searchParams.get('registered');

    const { login, isLoading, error: storeError, clearError, initAuth } = useAuthStore();
    const { language, setLanguage } = useLanguageStore();

    const [emailOrUsername, setEmailOrUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [rememberMe, setRememberMe] = useState<boolean>(true);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Handle notice if just registered and verified
    useEffect(() => {
        if (registeredParam === 'true') {
            setSuccessMessage('Account registered and verified successfully! You can now login.');
        }
    }, [registeredParam]);

    // Handle warning if redirected from protected admin route
    useEffect(() => {
        if (authErrorParam === 'unauthorized_admin') {
            setLocalError('This area requires Administrator privileges. Please login with an Admin account.');
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
            setSuccessMessage('Login successfully! Redirecting...');

            // Route redirection based on role
            setTimeout(() => {
                if (authResult.user.roleName === 'Admin' || authResult.user.role === 1) {
                    router.push('/admin');
                } else if (redirectPath && !redirectPath.startsWith('/admin')) {
                    router.push(redirectPath);
                } else {
                    router.push('/');
                }
            }, 900);
        } catch (err: any) {
            setLocalError(err.message || 'Authentication failed. Please check your credentials.');
        }
    };

    const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);

    const handleGoogleSelect = async (accountEmail: string, accountName: string, demoPass?: string) => {
        setShowGoogleModal(false);
        setLocalError(null);

        if (demoPass) {
            setEmailOrUsername(accountEmail);
            setPassword(demoPass);
            setSuccessMessage(`Authenticating with Google account (${accountEmail})...`);
            try {
                const authResult = await login(accountEmail, demoPass, rememberMe);
                setSuccessMessage(`Welcome back, ${authResult.user.fullName || accountName}! Redirecting...`);

                setTimeout(() => {
                    if (authResult.user.roleName === 'Admin' || authResult.user.role === 1) {
                        router.push('/admin');
                    } else if (redirectPath && !redirectPath.startsWith('/admin')) {
                        router.push(redirectPath);
                    } else {
                        router.push('/');
                    }
                }, 800);
            } catch (err: any) {
                setLocalError(err.message || 'Google authentication failed. Please enter your credentials manually.');
                setSuccessMessage(null);
            }
        } else {
            setEmailOrUsername(accountEmail);
            setSuccessMessage(`Selected Google account: ${accountEmail}`);
        }
    };

    const displayError = localError || storeError;

    return (
        <>
            <div className="w-full max-w-[440px] bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(195,170,140,0.16)] border border-[#EFE8DD] relative z-10">

                {/* Card Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-serif font-bold text-[#2A211B] tracking-tight">
                            {language === 'vi' ? 'Đăng nhập' : 'Login'}
                        </h2>
                                                {/* Horizontal Language Switcher: ENG (left) | VIE (right) */}
                        <div className="flex items-center p-0.5 rounded-full bg-[#FAF7F2] border border-[#EADBCE] text-[11px] font-semibold shrink-0">
                            {/* ENG on Left */}
                            <button
                                type="button"
                                onClick={() => setLanguage('en')}
                                title="Switch to English"
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                    language === 'en'
                                        ? 'bg-white text-[#2A211B] shadow-2xs font-bold border border-[#EADBCE]'
                                        : 'text-[#8C7E74] hover:text-[#2A211B]'
                                }`}
                            >
                                <UKFlag className="w-4 h-2.5" />
                                <span>ENG</span>
                            </button>

                            {/* VIE on Right */}
                            <button
                                type="button"
                                onClick={() => setLanguage('vi')}
                                title="Chuyển sang Tiếng Việt"
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                    language === 'vi'
                                        ? 'bg-white text-[#2A211B] shadow-2xs font-bold border border-[#EADBCE]'
                                        : 'text-[#8C7E74] hover:text-[#2A211B]'
                                }`}
                            >
                                <VietnamFlag className="w-4 h-2.5" />
                                <span>VIE</span>
                            </button>
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#7A6D63] mt-2 leading-relaxed">
                        {language === 'vi' ? 'Chào mừng bạn quay lại! Vui lòng nhập thông tin để tiếp tục.' : 'Welcome back! Please enter your details to continue.'}
                    </p>
                </div>

                {/* Error Banner */}
                {displayError && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1">{formatAuthMessage(displayError, language)}</div>
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
                            placeholder={language === 'vi' ? 'Email hoặc Tên đăng nhập (vd: admin)' : 'Email or Username (e.g. admin)'}
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
                            placeholder={language === 'vi' ? 'Mật khẩu' : 'Password'}
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
                            <span className="text-[#6B5E55]">{language === 'vi' ? 'Ghi nhớ đăng nhập' : 'Remember me'}</span>
                        </label>

                        <Link
                            href="/forgot-password"
                            className="font-normal text-[#A8744F] hover:text-[#885633] hover:underline transition"
                        >
                            {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
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
                                <span>{language === 'vi' ? 'Đang xác thực với máy chủ...' : 'Authenticating with server...'}</span>
                            </>
                        ) : (
                            language === 'vi' ? 'Đăng nhập' : 'Login'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#EFE8DD]" />
                    </div>
                    <span className="relative bg-white px-3 text-[11px] text-[#A6998E] font-normal tracking-wide">
                        {language === 'vi' ? 'Hoặc tiếp tục với' : 'Or continue with'}
                    </span>
                </div>

                {/* Social Login: Single Google Button */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowGoogleModal(true)}
                        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] active:scale-[0.99] text-[#2A211B] font-medium text-sm shadow-2xs hover:shadow-xs transition cursor-pointer group"
                    >
                        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                        </svg>
                        <span className="font-semibold text-[#2A211B] group-hover:text-black">
                            {language === 'vi' ? 'Tiếp tục với Google' : 'Continue with Google'}
                        </span>
                    </button>
                    <p className="text-[11px] text-center text-[#A6998E] mt-1.5">
                        {language === 'vi' ? 'Chấp nhận tài khoản @gmail.com hoặc email trường' : 'Personal @gmail.com or campus accounts accepted'}
                    </p>
                </div>

                {/* Footer Sign-up Prompt */}
                <p className="mt-7 text-center text-xs text-[#7A6D63]">
                    {language === 'vi' ? 'Chưa có tài khoản?' : "Don't have any account?"}{' '}
                    <Link
                        href="/register"
                        className="font-semibold text-[#B87333] hover:text-[#995922] hover:underline transition"
                    >
                        {language === 'vi' ? 'Đăng ký ngay' : 'Register now'}
                    </Link>
                </p>

                {/* Copyright */}
                <p className="mt-3 text-center text-[11px] text-[#A6998E]">
                    {language === 'vi' ? 'Bản quyền © 2026 - Student Flea Market. Mọi quyền được bảo lưu.' : 'Copyright © 2026 - Student Flea Market. All rights reserved.'}
                </p>
            </div>

            {/* Bottom-Right Light Green Toast Notification Bar */}
            {successMessage && (
                <div className="fixed bottom-6 right-4 sm:right-8 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-2xl bg-[#ECFDF5] text-emerald-900 shadow-[0_12px_32px_rgba(16,185,129,0.18)] border border-emerald-200/90 max-w-sm w-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 pr-1">
                        <p className="text-xs sm:text-sm font-medium leading-snug">
                            {formatAuthMessage(successMessage, language)}
                        </p>
                    </div>
                </div>
            )}
            {/* Google Sign In Dialog Modal */}
            {showGoogleModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#EADBCE] text-left animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE] flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                                        <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                                        <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-[#2A211B]">Sign in with Google</h4>
                                    <p className="text-xs text-[#7A6D63]">Choose an account</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowGoogleModal(false)}
                                className="p-1 rounded-full text-[#A39589] hover:text-[#2A211B] hover:bg-[#FAF7F2] transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-[#7A6D63] mb-4">
                            to continue to <strong className="text-[#2A211B] font-semibold">Student Flea Market</strong>
                        </p>

                        {/* Account selection list */}
                        <div className="space-y-2 mb-5">
                            <button
                                type="button"
                                onClick={() => handleGoogleSelect('minh@sv.edu.vn', 'Nguyễn Minh', '123456')}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#EADBCE] hover:bg-[#FAF7F2] text-left transition cursor-pointer group"
                            >
                                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                    M
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[#2A211B] truncate group-hover:text-blue-700">
                                        Nguyễn Minh
                                    </p>
                                    <p className="text-[11px] text-[#7A6D63] truncate">minh@sv.edu.vn</p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">
                                    Student Demo
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleGoogleSelect('admin@gmail.com', 'Administrator', 'admin123')}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#EADBCE] hover:bg-[#FAF7F2] text-left transition cursor-pointer group"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#F5A764] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                    A
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[#2A211B] truncate group-hover:text-[#E89650]">
                                        Administrator
                                    </p>
                                    <p className="text-[11px] text-[#7A6D63] truncate">admin@gmail.com</p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-100">
                                    Admin Demo
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowGoogleModal(false);
                                    setEmailOrUsername('');
                                    setLocalError('Please enter your Google account identifier in the input above.');
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#EADBCE] hover:bg-[#FAF7F2] text-left transition cursor-pointer text-xs font-medium text-[#7A6D63]"
                            >
                                <User className="w-4 h-4 text-[#A39589] ml-2" />
                                <span>Use another Google account</span>
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowGoogleModal(false)}
                                className="py-2 px-4 rounded-xl text-xs font-medium text-[#7A6D63] hover:bg-[#FAF7F2] border border-[#EADBCE] cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
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
                    </h1>
                </div>

                <div className="relative z-10 pointer-events-none" />
            </section>

            {/* ========================================================= */}
            {/* RIGHT SECTION: Floating Card Stage                       */}
            {/* ========================================================= */}
            <section className="w-full lg:w-[44%] xl:w-[42%] min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-[#FAF7F2]">
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
