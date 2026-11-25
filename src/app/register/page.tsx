///////////////////////////////////////////////////////////
//                                                       //
//                  REGISTER PAGE                        //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Phone,
    GraduationCap,
    BadgeCheck,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    RotateCw,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    AtSign,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';
import { useThemeStore } from '@/lib/theme-store';
import { VietnamFlag, UKFlag } from '@/components/ui/layout/Navbar';
import { GoogleSignInButton } from '@/components/ui/auth/GoogleSignInButton';

function formatRegisterError(msg: string | null, lang: 'vi' | 'en'): string | null {
    if (!msg) return null;

    if (lang === 'vi') {
        if (msg.includes('Please fill in all required fields') || msg.includes('required fields')) {
            return 'Vui lòng điền đầy đủ các thông tin bắt buộc.';
        }
        if (msg.includes('Username must be at least 3 characters')) {
            return 'Tên tài khoản phải có ít nhất 3 ký tự (chữ cái, chữ số, dấu gạch dưới).';
        }
        if (msg.includes('Please enter a valid email address')) {
            return 'Vui lòng nhập định dạng email hợp lệ.';
        }
        if (msg.includes('Password must be at least 8 characters')) {
            return 'Mật khẩu phải có ít nhất 8 ký tự.';
        }
        if (msg.includes('Password must contain at least one uppercase letter')) {
            return 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.';
        }
        if (msg.includes('Confirm password does not match')) {
            return 'Mật khẩu xác nhận không khớp.';
        }
        if (msg.includes('Invalid or expired verification code')) {
            return 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.';
        }
        if (msg.includes('Unable to resend code')) {
            return 'Không thể gửi lại mã OTP lúc này. Vui lòng thử lại sau.';
        }
        if (msg.includes('A fresh 6-digit code has been sent')) {
            return 'Mã xác thực 6 chữ số mới đã được gửi đến email của bạn.';
        }
        if (msg.includes('already exists') || msg.includes('ALREADY_EXISTS') || msg.includes('đã tồn tại')) {
            return 'Email hoặc tên tài khoản này đã được đăng ký trên hệ thống.';
        }
    } else {
        if (msg.includes('đã tồn tại')) {
            return 'This email or username is already registered.';
        }
    }

    return msg;
}

function RegisterForm() {
    const router = useRouter();
    const { register, verifyEmail, resendVerificationCode, isLoading } = useAuthStore();
    const { language, setLanguage } = useLanguageStore();
    const { initTheme } = useThemeStore();
    const t = DICTIONARY[language];

    useEffect(() => {
        initTheme();
    }, [initTheme]);

    // Flow Step: 'form' | 'otp' | 'success'
    const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');

    // Registration Form Inputs (Required)
    const [fullName, setFullName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    // Optional Fields (Campus details)
    const [showCampusDetails, setShowCampusDetails] = useState<boolean>(false);
    const [schoolName, setSchoolName] = useState<string>('');
    const [studentCode, setStudentCode] = useState<string>('');

    // Error & Message States
    const [localError, setLocalError] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [resendNotice, setResendNotice] = useState<string | null>(null);

    // OTP 6-digit state
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const [isResending, setIsResending] = useState<boolean>(false);
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Handle initial form submit -> Calls API /register
    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);

        // Client-side validations
        if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
            setLocalError('Please fill in all required fields.');
            return;
        }

        const trimmedUsername = username.trim().toLowerCase();
        if (trimmedUsername.length < 3 || !/^[a-z0-9_]+$/.test(trimmedUsername)) {
            setLocalError('Username must be at least 3 characters long and contain only letters, numbers, and underscores.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setLocalError('Please enter a valid email address.');
            return;
        }

        const phoneClean = phoneNumber.trim();

        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters long.');
            return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(password)) {
            setLocalError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Confirm password does not match.');
            return;
        }

        try {
            await register({
                fullName: fullName.trim(),
                username: trimmedUsername,
                email: email.trim().toLowerCase(),
                phoneNumber: phoneClean,
                password,
                confirmPassword,
                schoolName: schoolName.trim() || undefined,
                studentCode: studentCode.trim() || undefined,
            });

            // Transition to OTP verification step
            setStep('otp');
            setResendCooldown(60);
            setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 200);
        } catch (err: unknown) {
            setLocalError(err instanceof Error ? err.message : 'Registration failed. Please check your details.');
        }
    };

    // OTP Digit Change Handler
    const handleOtpChange = (index: number, value: string) => {
        const cleanedValue = value.replace(/\D/g, '');
        const newDigits = [...otpDigits];

        if (cleanedValue.length > 1) {
            const pasted = cleanedValue.slice(0, 6).split('');
            for (let i = 0; i < 6; i++) {
                newDigits[i] = pasted[i] || '';
            }
            setOtpDigits(newDigits);
            const nextIdx = Math.min(pasted.length, 5);
            otpInputRefs.current[nextIdx]?.focus();
            return;
        }

        newDigits[index] = cleanedValue;
        setOtpDigits(newDigits);
        if (otpError) setOtpError(null);

        if (cleanedValue && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace in OTP input
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    // Handle paste on OTP fields
    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;

        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pastedData[i] || '';
        }
        setOtpDigits(newDigits);
        const focusIdx = Math.min(pastedData.length, 5);
        otpInputRefs.current[focusIdx]?.focus();
    };

    // Submit OTP verification
    const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const code = otpDigits.join('');
        if (code.length !== 6) {
            setOtpError(language === 'vi' ? 'Vui lòng nhập đầy đủ 6 chữ số mã OTP.' : 'Please enter all 6 digits of the OTP code.');
            return;
        }

        setIsVerifying(true);
        setOtpError(null);

        try {
            await verifyEmail(email.trim().toLowerCase(), code);
            setStep('success');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 1800);
        } catch (err: unknown) {
            setOtpError(err instanceof Error ? err.message : 'Invalid or expired verification code. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    // Handle Resend OTP
    const handleResendCode = async () => {
        if (resendCooldown > 0 || isResending) return;
        setIsResending(true);
        setOtpError(null);
        setResendNotice(null);

        try {
            await resendVerificationCode(email.trim().toLowerCase());
            setResendNotice('A fresh 6-digit code has been sent to your email.');
            setResendCooldown(60);
            setOtpDigits(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        } catch (err: unknown) {
            setOtpError(err instanceof Error ? err.message : 'Unable to resend code. Please try again shortly.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="w-full max-w-[480px] bg-white dark:bg-stone-900 rounded-[32px] p-7 sm:p-9 shadow-[0_20px_50px_rgba(195,170,140,0.16)] dark:shadow-black/40 border border-[#EFE8DD] dark:border-stone-800 relative z-10 transition-all">

            {/* ========================================================= */}
            {/* STEP 1: REGISTRATION FORM                                 */}
            {/* ========================================================= */}
            {step === 'form' && (
                <div>
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between gap-2">
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A211B] dark:text-stone-100 tracking-tight">
                                {t.register.title}
                            </h1>
                            {/* Horizontal Language Switcher: ENG (left) | VIE (right) */}
                            <div className="flex items-center p-0.5 rounded-full bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 text-[11px] font-semibold shrink-0">
                                {/* ENG on Left */}
                                <button
                                    type="button"
                                    onClick={() => setLanguage('en')}
                                    aria-pressed={language === 'en'}
                                    title="Switch to English"
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-full transition-all cursor-pointer ${
                                        language === 'en'
                                            ? 'bg-white dark:bg-stone-900 text-[#2A211B] dark:text-stone-100 shadow-2xs font-bold border border-[#EADBCE] dark:border-stone-700'
                                            : 'text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100'
                                    }`}
                                >
                                    <UKFlag className="w-4 h-2.5" />
                                    <span className="tracking-[0.2em] font-semibold">ENG</span>
                                </button>

                                {/* VIE on Right */}
                                <button
                                    type="button"
                                    onClick={() => setLanguage('vi')}
                                    aria-pressed={language === 'vi'}
                                    title="Chuyển sang Tiếng Việt"
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-full transition-all cursor-pointer ${
                                        language === 'vi'
                                            ? 'bg-white dark:bg-stone-900 text-[#2A211B] dark:text-stone-100 shadow-2xs font-bold border border-[#EADBCE] dark:border-stone-700'
                                            : 'text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100'
                                    }`}
                                >
                                    <VietnamFlag className="w-4 h-2.5" />
                                    <span className="tracking-[0.2em] font-semibold">VIE</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-300 mt-2 leading-relaxed">
                            {t.register.subtitle}
                        </p>
                    </div>

                    {/* Error Banner */}
                    {localError && (
                        <div
                            role="alert"
                            aria-live="polite"
                            className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-200 flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in duration-200"
                        >
                            <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1">{formatRegisterError(localError, language)}</div>
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleRegisterSubmit} className="space-y-3">

                        {/* Full Name */}
                        <div className="relative">
                            <label htmlFor="fullName" className="sr-only">
                                {t.register.fullNamePlaceholder}
                            </label>
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                                <User aria-hidden="true" className="w-4 h-4" />
                            </div>
                            <input
                                id="fullName"
                                type="text"
                                autoComplete="name"
                                required
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder={t.register.fullNamePlaceholder}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                            />
                        </div>

                        {/* Username (REQUIRED) */}
                        <div className="relative">
                            <label htmlFor="username" className="sr-only">
                                {t.register.usernamePlaceholder}
                            </label>
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                                <AtSign aria-hidden="true" className="w-4 h-4" />
                            </div>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder={t.register.usernamePlaceholder}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                            />
                        </div>

                        {/* Email Address */}
                        <div className="relative">
                            <label htmlFor="email" className="sr-only">
                                {t.register.emailPlaceholder}
                            </label>
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                                <Mail aria-hidden="true" className="w-4 h-4" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder={t.register.emailPlaceholder}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="relative">
                            <label htmlFor="phoneNumber" className="sr-only">
                                {t.register.phoneNumberPlaceholder}
                            </label>
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                                <Phone aria-hidden="true" className="w-4 h-4" />
                            </div>
                            <input
                                id="phoneNumber"
                                type="tel"
                                autoComplete="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder={t.register.phoneNumberPlaceholder}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">
                                {t.register.passwordPlaceholder}
                            </label>
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                                <Lock aria-hidden="true" className="w-4 h-4" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder={t.register.passwordPlaceholder}
                                className="w-full pl-10 pr-12 py-2.5 sm:py-3 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-pressed={showPassword}
                                aria-label={
                                    language === 'vi'
                                        ? (showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')
                                        : (showPassword ? 'Hide password' : 'Show password')
                                }
                                className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 transition cursor-pointer rounded-r-2xl"
                            >
                                {showPassword ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <label htmlFor="confirmPassword" className="sr-only">
                                {t.register.confirmPasswordPlaceholder}
                            </label>
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                                <ShieldCheck aria-hidden="true" className="w-4 h-4" />
                            </div>
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder={t.register.confirmPasswordPlaceholder}
                                className="w-full pl-10 pr-12 py-2.5 sm:py-3 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-pressed={showConfirmPassword}
                                aria-label={
                                    language === 'vi'
                                        ? (showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận')
                                        : (showConfirmPassword ? 'Hide confirm password' : 'Show confirm password')
                                }
                                className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 transition cursor-pointer rounded-r-2xl"
                            >
                                {showConfirmPassword ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Optional Campus Details Toggle */}
                        <div className="pt-0.5">
                            <button
                                type="button"
                                aria-expanded={showCampusDetails}
                                onClick={() => setShowCampusDetails(!showCampusDetails)}
                                className="flex items-center justify-between w-full min-h-[40px] py-2 px-3 text-xs font-medium text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 bg-[#FAF7F2] dark:bg-stone-800 rounded-xl border border-[#EFE8DD] dark:border-stone-700 transition cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <GraduationCap aria-hidden="true" className="w-3.5 h-3.5 text-[#9A5828] dark:text-[#F5A764]" />
                                    {t.register.campusToggle}
                                </span>
                                {showCampusDetails ? <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" /> : <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />}
                            </button>

                            {showCampusDetails && (
                                <div className="space-y-2.5 mt-2.5 p-3 rounded-2xl bg-[#FAF7F2]/60 dark:bg-stone-800/70 border border-[#EADBCE] dark:border-stone-700 animate-in fade-in duration-200">
                                    {/* University / School Name */}
                                    <div className="relative">
                                        <label htmlFor="schoolName" className="sr-only">
                                            {t.register.schoolNamePlaceholder}
                                        </label>
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                                            <GraduationCap aria-hidden="true" className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            id="schoolName"
                                            type="text"
                                            value={schoolName}
                                            onChange={(e) => setSchoolName(e.target.value)}
                                            placeholder={t.register.schoolNamePlaceholder}
                                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 rounded-xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-xs focus:outline-none focus:ring-1 focus:ring-[#F5A764] transition"
                                        />
                                    </div>

                                    {/* Student Code */}
                                    <div className="relative">
                                        <label htmlFor="studentCode" className="sr-only">
                                            {t.register.studentCodePlaceholder}
                                        </label>
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                                            <BadgeCheck aria-hidden="true" className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            id="studentCode"
                                            type="text"
                                            value={studentCode}
                                            onChange={(e) => setStudentCode(e.target.value)}
                                            placeholder={t.register.studentCodePlaceholder}
                                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 rounded-xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-xs focus:outline-none focus:ring-1 focus:ring-[#F5A764] transition"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-semibold text-[#2A211B] dark:text-stone-950 bg-[#F5A764] hover:bg-[#E89650] active:scale-[0.99] shadow-[0_8px_20px_rgba(245,167,100,0.3)] hover:shadow-[0_10px_24px_rgba(245,167,100,0.38)] transition-all cursor-pointer disabled:opacity-60 text-sm mt-3 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-[#2A211B]/25 border-t-[#2A211B] rounded-full animate-spin" />
                                    <span>{language === 'vi' ? 'Đang tạo tài khoản & gửi mã OTP...' : 'Creating account & sending OTP...'}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t.register.btnSubmit}</span>
                                    <ArrowRight aria-hidden="true" className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-5 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#EFE8DD] dark:border-stone-800" />
                        </div>
                        <span className="relative bg-white dark:bg-stone-900 px-3 text-[11px] text-[#6D5D52] dark:text-stone-400 font-medium tracking-wide">
                            {language === 'vi' ? 'Hoặc tiếp tục với' : 'Or continue with'}
                        </span>
                    </div>

                    {/* Google Sign-Up Secondary CTA (Placed below form) */}
                    <div>
                        <GoogleSignInButton
                            buttonText="continue_with"
                            disabled={isLoading}
                            onSuccess={(authResult) => {
                                if (authResult.user.roleName === 'Admin' || authResult.user.role === 1) {
                                    router.push('/admin');
                                } else {
                                    router.push('/');
                                }
                            }}
                            onError={(msg) => setLocalError(msg)}
                        />
                        <p className="text-[11px] text-center text-[#6D5D52] dark:text-stone-400 mt-1.5">
                            {language === 'vi' ? 'Chấp nhận tài khoản @gmail.com hoặc email trường' : 'Personal @gmail.com or campus accounts accepted'}
                        </p>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: 6-DIGIT OTP VERIFICATION                         */}
            {/* ========================================================= */}
            {step === 'otp' && (
                <div className="animate-in fade-in duration-300">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF6EE] dark:bg-stone-800 border border-[#F5A764]/30 dark:border-[#F5A764]/40 flex items-center justify-center text-[#B8652B] dark:text-[#F5A764] shadow-xs mb-3.5">
                            <Mail aria-hidden="true" className="w-7 h-7" />
                        </div>
                        <h1 className="text-2xl font-serif font-bold text-[#2A211B] dark:text-stone-100 tracking-tight">
                            {t.register.otpTitle}
                        </h1>
                        <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-300 mt-2 leading-relaxed">
                            {t.register.otpSubtitle}
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 text-xs font-semibold text-[#2A211B] dark:text-stone-100 mt-2">
                            <span>{email}</span>
                            <button
                                type="button"
                                onClick={() => setStep('form')}
                                className="text-[11px] text-[#9A5828] dark:text-[#F5A764] hover:underline ml-1 cursor-pointer"
                            >
                                ({language === 'vi' ? 'đổi email' : 'change'})
                            </button>
                        </div>
                    </div>

                    {/* Resend Notice */}
                    {resendNotice && (
                        <div
                            role="status"
                            aria-live="polite"
                            className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-medium animate-in fade-in duration-200"
                        >
                            <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{formatRegisterError(resendNotice, language)}</span>
                        </div>
                    )}

                    {/* OTP Error */}
                    {otpError && (
                        <div
                            role="alert"
                            aria-live="polite"
                            className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-200 flex items-start gap-2 text-xs leading-relaxed animate-in fade-in duration-200"
                        >
                            <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1">{formatRegisterError(otpError, language)}</div>
                        </div>
                    )}

                    {/* OTP 6-box input form */}
                    <form onSubmit={handleVerifySubmit} className="space-y-6">
                        <div
                            className="flex items-center justify-between gap-2 sm:gap-2.5"
                            onPaste={handleOtpPaste}
                        >
                            {otpDigits.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => {
                                        otpInputRefs.current[idx] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={digit}
                                    aria-label={language === 'vi' ? `Chữ số OTP thứ ${idx + 1}` : `OTP digit ${idx + 1}`}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                    className="w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold tabular-nums rounded-2xl bg-[#FAF7F2] dark:bg-stone-800 border-2 border-[#EADBCE] dark:border-stone-700 text-[#2A211B] dark:text-stone-100 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 focus:outline-none transition shadow-2xs"
                                />
                            ))}
                        </div>

                        {/* Submit OTP */}
                        <button
                            type="submit"
                            disabled={isVerifying || otpDigits.some((d) => !d)}
                            className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-semibold text-[#2A211B] dark:text-stone-950 bg-[#F5A764] hover:bg-[#E89650] active:scale-[0.99] shadow-[0_8px_20px_rgba(245,167,100,0.3)] hover:shadow-[0_10px_24px_rgba(245,167,100,0.38)] transition-all cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-[#2A211B]/25 border-t-[#2A211B] rounded-full animate-spin" />
                                    <span>{language === 'vi' ? 'Đang xác thực mã OTP...' : 'Verifying code...'}</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck aria-hidden="true" className="w-4 h-4" />
                                    <span>{t.register.btnVerify}</span>
                                </>
                            )}
                        </button>

                        {/* Resend Cooldown Section */}
                        <div className="text-center text-xs text-[#6D5D52] dark:text-stone-300 pt-1">
                            {resendCooldown > 0 ? (
                                <span>
                                    {language === 'vi' ? 'Chưa nhận được mã? Gửi lại sau' : "Didn't receive the code? Resend in"}{' '}
                                    <strong className="text-[#2A211B] dark:text-stone-100 font-semibold tabular-nums">{resendCooldown}s</strong>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={isResending}
                                    className="font-semibold text-[#9A5828] hover:text-[#7A441D] dark:text-[#F5A764] dark:hover:text-[#FBD6B0] hover:underline inline-flex items-center gap-1.5 min-h-[36px] cursor-pointer disabled:opacity-60"
                                >
                                    <RotateCw aria-hidden="true" className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                                    <span>{t.register.resend}</span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* ========================================================= */}
            {/* STEP 3: SUCCESS STATE                                    */}
            {/* ========================================================= */}
            {step === 'success' && (
                <div role="status" aria-live="polite" className="text-center py-6 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm mb-4">
                        <CheckCircle2 aria-hidden="true" className="w-9 h-9" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-[#2A211B] dark:text-stone-100 tracking-tight">
                        {t.register.successTitle}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-300 mt-2 max-w-xs mx-auto">
                        {t.register.successSubtitle}
                    </p>
                    <div className="mt-6 flex justify-center">
                        <div className="w-5 h-5 border-2 border-[#F5A764]/30 border-t-[#F5A764] rounded-full animate-spin" />
                    </div>
                </div>
            )}

            {/* Footer Navigation */}
            {step === 'form' && (
                <>
                    <p className="mt-6 text-center text-xs text-[#6D5D52] dark:text-stone-300">
                        {t.register.haveAccount}{' '}
                        <Link
                            href="/login"
                            className="font-semibold text-[#9A5828] hover:text-[#7A441D] dark:text-[#F5A764] dark:hover:text-[#FBD6B0] hover:underline transition"
                        >
                            {t.register.loginNow}
                        </Link>
                    </p>

                    <p className="mt-3 text-center text-[11px] text-[#75675C] dark:text-stone-400">
                        {language === 'vi' ? 'Bản quyền © 2026 - Student Flea Market. Mọi quyền được bảo lưu.' : 'Copyright © 2026 - Student Flea Market. All rights reserved.'}
                    </p>
                </>
            )}

        </div>
    );
}

export default function RegisterPage() {
    return (
        <main id="main-content" className="min-h-[100dvh] w-full bg-[#FAF7F2] dark:bg-stone-950 flex flex-col lg:flex-row font-sans selection:bg-[#F5A764]/30 selection:text-stone-900 dark:selection:text-stone-100 overflow-x-hidden transition-colors">

            {/* ========================================================= */}
            {/* LEFT SECTION (Illustration & Brand Intro)                 */}
            {/* ========================================================= */}
            <section className="w-full lg:w-[56%] xl:w-[58%] min-h-[420px] lg:min-h-[100dvh] relative flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#EFE8DD] dark:border-stone-800">

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
                <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#FAF7F2]/90 via-[#FAF7F2]/60 dark:from-stone-950/90 dark:via-stone-950/60 to-transparent pointer-events-none" />

                <div className="relative z-10 pointer-events-none" />
            </section>

            {/* ========================================================= */}
            {/* RIGHT SECTION: Floating Card Stage                       */}
            {/* ========================================================= */}
            <section className="w-full lg:w-[44%] xl:w-[42%] min-h-[calc(100dvh-420px)] lg:min-h-[100dvh] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-[#FAF7F2] dark:bg-stone-950">
                <Suspense
                    fallback={
                        <div className="p-8 text-center text-sm text-[#6D5D52] dark:text-stone-300">
                            Loading interface...
                        </div>
                    }
                >
                    <RegisterForm />
                </Suspense>
            </section>

        </main>
    );
}
