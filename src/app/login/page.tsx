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
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { VietnamFlag, UKFlag } from '@/components/ui/layout/Navbar';
import { GoogleSignInButton } from '@/components/ui/auth/GoogleSignInButton';
import { AuthResultDto } from '@/types/auth';


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
        if (msg.includes('Password has been reset successfully')) {
            return 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.';
        }
        if (msg.includes('Password changed successfully')) {
            return 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.';
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
    const resetParam = searchParams.get('reset');
    const passwordChangedParam = searchParams.get('passwordChanged');

    const { login, isLoading, error: storeError, clearError, initAuth } = useAuthStore();
    const { language, setLanguage } = useLanguageStore();

    const [emailOrUsername, setEmailOrUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [rememberMe, setRememberMe] = useState<boolean>(true);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [localError, setLocalError] = useState<string | null>(() =>
        authErrorParam === 'unauthorized_admin'
            ? 'This area requires Administrator privileges. Please login with an Admin account.'
            : null
    );
    const [successMessage, setSuccessMessage] = useState<string | null>(() => {
        if (registeredParam === 'true') {
            return 'Account registered and verified successfully! You can now login.';
        }
        if (resetParam === 'true') {
            return 'Password has been reset successfully! You can now login.';
        }
        if (passwordChangedParam === 'true') {
            return 'Password changed successfully! Please log in again with your new password.';
        }
        return null;
    });

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    const handleAuthSuccessRedirect = (authResult: AuthResultDto) => {
        setSuccessMessage(`Welcome back, ${authResult.user.fullName || authResult.user.email}! Redirecting...`);
        const isStaffAccount = Boolean(
            authResult.user.isStaff ||
            authResult.user.isAdmin ||
            authResult.user.isModerator ||
            authResult.user.roleName === 'Admin' ||
            authResult.user.roleName === 'Moderator' ||
            authResult.user.role === 1 ||
            authResult.user.role === 3
        );
        setTimeout(() => {
            if (isStaffAccount) {
                router.push('/admin');
            } else if (redirectPath && !redirectPath.startsWith('/admin')) {
                router.push(redirectPath);
            } else {
                router.push('/');
            }
        }, 800);
    };

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
            handleAuthSuccessRedirect(authResult);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '';
            setLocalError(msg || 'Authentication failed. Please check your credentials.');
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
                                <span className="tracking-[0.2em] font-semibold">ENG</span>
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
                                <span className="tracking-[0.2em] font-semibold">VIE</span>
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

                {/* Social Login: Google Identity Services */}
                <div>
                    <GoogleSignInButton
                        buttonText="continue_with"
                        disabled={isLoading}
                        onSuccess={handleAuthSuccessRedirect}
                        onError={(msg) => setLocalError(msg)}
                    />
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
