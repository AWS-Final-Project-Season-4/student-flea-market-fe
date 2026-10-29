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

function RegisterForm() {
    const router = useRouter();
    const { register, verifyEmail, resendVerificationCode, isLoading } = useAuthStore();

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
    const [resendCooldown, setResendCooldown] = useState<number>(60);
    const [isResending, setIsResending] = useState<boolean>(false);
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Google Sign Up Dialog Simulation State
    const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);

    // Countdown timer for OTP resend
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'otp' && resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, resendCooldown]);

    // Handle initial form submission
    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);

        // 1. Full name validation
        if (!fullName.trim() || fullName.trim().length < 2) {
            setLocalError('Full name must be at least 2 characters long.');
            return;
        }

        // 2. Username validation (Required: 3-30 chars, alphanumeric + . + _)
        const trimmedUsername = username.trim().toLowerCase();
        const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;
        if (!trimmedUsername) {
            setLocalError('Username cannot be left blank.');
            return;
        }
        if (!usernameRegex.test(trimmedUsername)) {
            setLocalError('Username must be 3-30 characters long and contain only letters, numbers, dots, and underscores.');
            return;
        }

        // 3. Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email.trim())) {
            setLocalError('Please enter a valid email address (e.g. name@gmail.com).');
            return;
        }

        // 4. Phone validation
        const phoneClean = phoneNumber.trim().replace(/[\s-]/g, '');
        const phoneRegex = /^\+?[0-9]{9,15}$/;
        if (!phoneClean || !phoneRegex.test(phoneClean)) {
            setLocalError('Please enter a valid phone number (9 to 15 digits).');
            return;
        }

        // 5. Password validation
        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters long.');
            return;
        }

        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            setLocalError('Password must contain at least one letter and one number.');
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
        } catch (err: any) {
            setLocalError(err.message || 'Registration failed. Please check your details.');
        }
    };

    // OTP Digit Change Handler
    const handleOtpChange = (index: number, value: string) => {
        const cleanedValue = value.replace(/\D/g, '');
        const newDigits = [...otpDigits];

        if (cleanedValue.length > 1) {
            const pastedChars = cleanedValue.slice(0, 6).split('');
            pastedChars.forEach((char, i) => {
                if (index + i < 6) {
                    newDigits[index + i] = char;
                }
            });
            setOtpDigits(newDigits);
            const nextIdx = Math.min(index + pastedChars.length, 5);
            otpInputRefs.current[nextIdx]?.focus();
            return;
        }

        newDigits[index] = cleanedValue;
        setOtpDigits(newDigits);
        setOtpError(null);

        // Automatically advance focus to the next box
        if (cleanedValue && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    // OTP Keydown Handler (Backspace navigation)
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                const newDigits = [...otpDigits];
                newDigits[index - 1] = '';
                setOtpDigits(newDigits);
                otpInputRefs.current[index - 1]?.focus();
            }
        }
    };

    // OTP Paste Handler
    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;

        const newDigits = [...otpDigits];
        pastedData.split('').forEach((char, idx) => {
            if (idx < 6) newDigits[idx] = char;
        });
        setOtpDigits(newDigits);
        setOtpError(null);

        const targetFocusIndex = Math.min(pastedData.length, 5);
        otpInputRefs.current[targetFocusIndex]?.focus();
    };

    // Handle Verify Code
    const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setOtpError(null);

        const code = otpDigits.join('');
        if (code.length !== 6) {
            setOtpError('Please enter all 6 digits of the verification code.');
            return;
        }

        setIsVerifying(true);
        try {
            await verifyEmail(email.trim().toLowerCase(), code);
            setStep('success');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 1800);
        } catch (err: any) {
            setOtpError(err.message || 'Invalid or expired verification code. Please try again.');
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
        } catch (err: any) {
            setOtpError(err.message || 'Unable to resend code. Please try again shortly.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="w-full max-w-[480px] bg-white rounded-[32px] p-7 sm:p-9 shadow-[0_20px_50px_rgba(195,170,140,0.16)] border border-[#EFE8DD] relative z-10 transition-all">

            {/* ========================================================= */}
            {/* STEP 1: REGISTRATION FORM                                 */}
            {/* ========================================================= */}
            {step === 'form' && (
                <div>
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A211B] tracking-tight">
                                Create Account
                            </h2>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE8DD] text-[#7A6D63] font-medium">
                                Student Flea Market
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#7A6D63] mt-1.5 leading-relaxed">
                            Join our campus marketplace to buy, sell, and trade easily.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {localError && (
                        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div className="flex-1">{localError}</div>
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleRegisterSubmit} className="space-y-3">

                        {/* Full Name */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A39589]">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                id="fullName"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder="Full Name (e.g. Alex Johnson)"
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl text-[#2A211B] placeholder-[#A6998E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white transition"
                            />
                        </div>

                        {/* Username (REQUIRED) */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A39589]">
                                <AtSign className="w-4 h-4" />
                            </div>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder="Username (e.g. alex_johnson)"
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl text-[#2A211B] placeholder-[#A6998E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white transition"
                            />
                        </div>

                        {/* Email Address */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A39589]">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder="Email Address (e.g. alex@gmail.com)"
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl text-[#2A211B] placeholder-[#A6998E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white transition"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A39589]">
                                <Phone className="w-4 h-4" />
                            </div>
                            <input
                                id="phoneNumber"
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder="Phone Number (e.g. +84 987 654 321)"
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl text-[#2A211B] placeholder-[#A6998E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white transition"
                            />
                        </div>

                        {/* Password */}
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
                                placeholder="Password (min 6 chars, 1 letter, 1 number)"
                                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl text-[#2A211B] placeholder-[#A6998E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white transition"
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

                        {/* Confirm Password */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A39589]">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (localError) setLocalError(null);
                                }}
                                placeholder="Confirm Password"
                                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-[#FAF7F2] border border-[#EADBCE] rounded-2xl text-[#2A211B] placeholder-[#A6998E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A39589] hover:text-[#2A211B] transition cursor-pointer"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Optional Campus Details Toggle */}
                        <div className="pt-0.5">
                            <button
                                type="button"
                                onClick={() => setShowCampusDetails(!showCampusDetails)}
                                className="flex items-center justify-between w-full py-2 px-3 text-xs font-medium text-[#7A6D63] hover:text-[#2A211B] bg-[#FAF7F2] rounded-xl border border-[#EFE8DD] transition cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-[#A8744F]" />
                                    Campus details (Optional)
                                </span>
                                {showCampusDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {showCampusDetails && (
                                <div className="space-y-2.5 mt-2.5 p-3 rounded-2xl bg-[#FAF7F2]/60 border border-[#EADBCE] animate-in fade-in duration-200">
                                    {/* University / School Name */}
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A39589]">
                                            <GraduationCap className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={schoolName}
                                            onChange={(e) => setSchoolName(e.target.value)}
                                            placeholder="University / School (e.g. FPT University)"
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-[#EADBCE] rounded-xl text-[#2A211B] placeholder-[#A6998E] text-xs focus:outline-none focus:ring-1 focus:ring-[#F5A764] transition"
                                        />
                                    </div>

                                    {/* Student Code */}
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A39589]">
                                            <BadgeCheck className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={studentCode}
                                            onChange={(e) => setStudentCode(e.target.value)}
                                            placeholder="Student ID (e.g. SE123456)"
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-[#EADBCE] rounded-xl text-[#2A211B] placeholder-[#A6998E] text-xs focus:outline-none focus:ring-1 focus:ring-[#F5A764] transition"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 rounded-2xl font-medium text-white bg-[#F5A764] hover:bg-[#E89650] active:scale-[0.99] shadow-[0_8px_20px_rgba(245,167,100,0.3)] hover:shadow-[0_10px_24px_rgba(245,167,100,0.38)] transition-all cursor-pointer disabled:opacity-60 text-sm mt-3 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating account & sending OTP...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-5 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#EFE8DD]" />
                        </div>
                        <span className="relative bg-white px-3 text-[11px] text-[#A6998E] font-normal tracking-wide">
                            Or continue with
                        </span>
                    </div>

                    {/* Google Sign-Up Secondary CTA (Placed below form) */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowGoogleModal(true)}
                            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] active:scale-[0.99] text-[#2A211B] font-medium text-sm shadow-2xs hover:shadow-xs transition cursor-pointer group"
                        >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                            </svg>
                            <span className="font-semibold text-[#2A211B] group-hover:text-black">
                                Continue with Google
                            </span>
                        </button>
                        <p className="text-[11px] text-center text-[#A6998E] mt-1.5">
                            Personal @gmail.com or campus accounts accepted
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
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF6EE] border border-[#F5A764]/30 flex items-center justify-center text-[#F5A764] shadow-xs mb-3.5">
                            <Mail className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-[#2A211B] tracking-tight">
                            Verify Your Email
                        </h2>
                        <p className="text-xs sm:text-sm text-[#7A6D63] mt-2 leading-relaxed">
                            We have sent a 6-digit verification code to:
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EADBCE] text-xs font-semibold text-[#2A211B] mt-2">
                            <span>{email}</span>
                            <button
                                type="button"
                                onClick={() => setStep('form')}
                                className="text-[11px] text-[#A8744F] hover:underline ml-1 cursor-pointer"
                            >
                                (change)
                            </button>
                        </div>
                    </div>

                    {/* Resend Notice */}
                    {resendNotice && (
                        <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-medium animate-in fade-in duration-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{resendNotice}</span>
                        </div>
                    )}

                    {/* OTP Error */}
                    {otpError && (
                        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2 text-xs leading-relaxed animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div className="flex-1">{otpError}</div>
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
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                    className="w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-2xl bg-[#FAF7F2] border-2 border-[#EADBCE] text-[#2A211B] focus:border-[#F5A764] focus:bg-white focus:outline-none transition shadow-2xs"
                                />
                            ))}
                        </div>

                        {/* Submit OTP */}
                        <button
                            type="submit"
                            disabled={isVerifying || otpDigits.some((d) => !d)}
                            className="w-full py-3.5 px-4 rounded-2xl font-medium text-white bg-[#F5A764] hover:bg-[#E89650] active:scale-[0.99] shadow-[0_8px_20px_rgba(245,167,100,0.3)] hover:shadow-[0_10px_24px_rgba(245,167,100,0.38)] transition-all cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verifying code...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Verify & Activate Account</span>
                                </>
                            )}
                        </button>

                        {/* Resend Cooldown Section */}
                        <div className="text-center text-xs text-[#7A6D63] pt-1">
                            {resendCooldown > 0 ? (
                                <span>
                                    Didn't receive the code? Resend in{' '}
                                    <strong className="text-[#2A211B] font-semibold">{resendCooldown}s</strong>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={isResending}
                                    className="font-semibold text-[#B87333] hover:text-[#8B501B] hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                >
                                    <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                                    <span>Resend verification code</span>
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
                <div className="text-center py-6 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm mb-4">
                        <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#2A211B] tracking-tight">
                        Account Verified!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#7A6D63] mt-2 max-w-xs mx-auto">
                        Your Student Flea Market account has been activated. Redirecting you to sign in...
                    </p>
                    <div className="mt-6 flex justify-center">
                        <div className="w-5 h-5 border-2 border-[#F5A764]/30 border-t-[#F5A764] rounded-full animate-spin" />
                    </div>
                </div>
            )}

            {/* Footer Navigation */}
            {step === 'form' && (
                <>
                    <p className="mt-6 text-center text-xs text-[#7A6D63]">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-semibold text-[#B87333] hover:text-[#995922] hover:underline transition"
                        >
                            Sign In
                        </Link>
                    </p>

                    <p className="mt-3 text-center text-[11px] text-[#A6998E]">
                        Copyright © 2026 - Student Flea Market. All rights reserved.
                    </p>
                </>
            )}

            {/* ========================================================= */}
            {/* GOOGLE SIGN UP DIALOG MODAL                               */}
            {/* ========================================================= */}
            {showGoogleModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#EADBCE] text-left animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
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
                                <p className="text-xs text-[#7A6D63]">to continue to Student Flea Market</p>
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DD] mb-4 text-xs text-[#52453B] leading-relaxed">
                            You can sign up using any valid Google account (e.g. personal <code className="bg-white px-1.5 py-0.5 rounded border border-[#EADBCE]">@gmail.com</code> or campus account).
                        </div>

                        {/* Account selection preview */}
                        <div className="space-y-2 mb-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail('alex.student@gmail.com');
                                    setFullName('Alex Johnson');
                                    setUsername('alex_johnson');
                                    setShowGoogleModal(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#EADBCE] hover:bg-[#FAF7F2] text-left transition cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#F5A764] text-white font-bold flex items-center justify-center text-xs">
                                    A
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[#2A211B] truncate">Alex Johnson</p>
                                    <p className="text-[11px] text-[#7A6D63] truncate">alex.student@gmail.com</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowGoogleModal(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#EADBCE] hover:bg-[#FAF7F2] text-left transition cursor-pointer text-xs font-medium text-[#7A6D63]"
                            >
                                <User className="w-4 h-4 text-[#A39589] ml-2" />
                                <span>Use another Google account</span>
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowGoogleModal(false)}
                                className="py-2 px-4 rounded-xl text-xs font-medium text-[#7A6D63] hover:bg-[#FAF7F2] border border-[#EADBCE] cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail('alex.student@gmail.com');
                                    setFullName('Alex Johnson');
                                    setUsername('alex_johnson');
                                    setShowGoogleModal(false);
                                }}
                                className="py-2 px-4 rounded-xl text-xs font-medium text-white bg-[#F5A764] hover:bg-[#E89650] cursor-pointer"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default function RegisterPage() {
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
                    <p className="text-xs sm:text-sm text-[#7A6D63] mt-2 font-medium">
                        The trusted student-to-student exchange platform
                    </p>
                </div>

                <div className="relative z-10 pointer-events-none" />
            </section>

            {/* ========================================================= */}
            {/* RIGHT SECTION: Floating Card Stage                       */}
            {/* ========================================================= */}
            <section className="w-full lg:w-[44%] xl:w-[42%] min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-[#FAF7F2]">
                <Suspense
                    fallback={
                        <div className="p-8 text-center text-sm text-[#7A6D63]">
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
