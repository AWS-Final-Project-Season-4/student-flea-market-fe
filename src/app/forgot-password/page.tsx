'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { useThemeStore } from '@/lib/theme-store';
import { VietnamFlag, UKFlag } from '@/components/ui/layout/Navbar';

function formatForgotError(msg: string | null, lang: 'vi' | 'en'): string | null {
  if (!msg) return null;

  if (lang === 'vi') {
    if (msg.includes('INVALID_CODE') || msg.includes('không đúng')) {
      return 'Mã OTP không đúng. Vui lòng kiểm tra lại.';
    }
    if (msg.includes('CODE_EXPIRED') || msg.includes('hết hạn')) {
      return 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.';
    }
    if (msg.includes('CODE_ALREADY_USED') || msg.includes('đã được sử dụng')) {
      return 'Mã OTP này đã được sử dụng. Vui lòng yêu cầu mã mới.';
    }
    if (msg.includes('TOO_MANY_ATTEMPTS') || msg.includes('quá nhiều lần')) {
      return 'Bạn đã nhập sai mã quá nhiều lần. Vui lòng yêu cầu gửi lại mã mới.';
    }
    if (msg.includes('Unable to connect') || msg.includes('ERR_NETWORK')) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.';
    }
    if (msg.includes('banned') || msg.includes('ACCOUNT_BANNED') || msg.includes('bị khóa')) {
      return 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
    }
  } else {
    if (msg.includes('không đúng')) return 'Invalid verification code.';
    if (msg.includes('hết hạn')) return 'Verification code has expired. Please request a new one.';
    if (msg.includes('đã được sử dụng')) return 'Verification code has already been used.';
    if (msg.includes('quá nhiều lần')) return 'Too many wrong attempts. Please request a new code.';
    if (msg.includes('bị khóa')) return 'Your account has been banned. Please contact the administrator.';
  }

  return msg;
}

function ForgotPasswordForm() {
  const router = useRouter();
  const { forgotPassword, verifyResetCode, resetPassword, isLoading } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoNotice(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMsg(
        language === 'vi'
          ? 'Vui lòng nhập địa chỉ email hợp lệ.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    try {
      await forgotPassword(normalizedEmail);
      setEmail(normalizedEmail);
      setOtpDigits(['', '', '', '', '', '']);
      setStep('otp');
      setResendCooldown(60);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send reset code.');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const next = [...otpDigits];

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] || '';
      }
      setOtpDigits(next);
      otpInputRefs.current[Math.min(chars.length, 5)]?.focus();
      if (errorMsg) setErrorMsg(null);
      return;
    }

    next[index] = cleaned;
    setOtpDigits(next);
    if (errorMsg) setErrorMsg(null);

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setOtpDigits(next);
    otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoNotice(null);

    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg(
        language === 'vi'
          ? 'Vui lòng nhập đầy đủ 6 chữ số mã OTP.'
          : 'Please enter the full 6-digit OTP code.'
      );
      return;
    }

    try {
      await verifyResetCode(email, code);
      setStep('password');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    setInfoNotice(null);

    try {
      await forgotPassword(email);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setInfoNotice(
        language === 'vi'
          ? 'Mã OTP 6 chữ số mới đã được gửi đến email của bạn.'
          : 'A fresh 6-digit reset code has been sent to your email.'
      );
      otpInputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to resend reset code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg(
        language === 'vi'
          ? 'Mật khẩu mới phải có ít nhất 8 ký tự.'
          : 'New password must be at least 8 characters long.'
      );
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(newPassword)) {
      setErrorMsg(
        language === 'vi'
          ? 'Mật khẩu phải gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.'
          : 'Password must contain uppercase, lowercase, number, and special character.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(
        language === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Confirm password does not match.'
      );
      return;
    }

    try {
      await resetPassword({
        email,
        code: otpDigits.join(''),
        newPassword,
        confirmPassword,
      });
      setStep('success');
      setTimeout(() => {
        router.push('/login?reset=true');
      }, 1800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reset password.');
    }
  };

  return (
    <div className="w-full max-w-[460px] bg-white dark:bg-stone-900 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(195,170,140,0.16)] dark:shadow-black/40 border border-[#EFE8DD] dark:border-stone-800 relative z-10 transition-colors">
      {/* Top Language Switcher & Back Link */}
      <div className="flex items-center justify-between mb-6 gap-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-medium text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 transition"
        >
          <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Quay lại đăng nhập' : 'Back to login'}</span>
        </Link>

        <div className="flex items-center p-0.5 rounded-full bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 text-[11px] font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            aria-pressed={language === 'en'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-full transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-white dark:bg-stone-900 text-[#2A211B] dark:text-stone-100 shadow-2xs font-bold border border-[#EADBCE] dark:border-stone-700'
                : 'text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100'
            }`}
          >
            <UKFlag className="w-4 h-2.5" />
            <span className="tracking-[0.2em]">ENG</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            aria-pressed={language === 'vi'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-full transition-all cursor-pointer ${
              language === 'vi'
                ? 'bg-white dark:bg-stone-900 text-[#2A211B] dark:text-stone-100 shadow-2xs font-bold border border-[#EADBCE] dark:border-stone-700'
                : 'text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100'
            }`}
          >
            <VietnamFlag className="w-4 h-2.5" />
            <span className="tracking-[0.2em]">VIE</span>
          </button>
        </div>
      </div>

      {/* Step 1: Enter Email */}
      {step === 'email' && (
        <div>
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF6EE] dark:bg-stone-800 border border-[#F5A764]/30 dark:border-[#F5A764]/40 flex items-center justify-center text-[#B8652B] dark:text-[#F5A764] mb-4">
              <KeyRound aria-hidden="true" className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A211B] dark:text-stone-100 tracking-tight">
              {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-300 mt-2 leading-relaxed">
              {language === 'vi'
                ? 'Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP 6 chữ số để đặt lại mật khẩu.'
                : 'Enter your registered email address and we will send a 6-digit OTP to reset your password.'}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-200 flex items-start gap-2.5 text-xs leading-relaxed"
            >
              <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{formatForgotError(errorMsg, language)}</div>
            </div>
          )}

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="relative">
              <label htmlFor="forgot-email" className="sr-only">
                {language === 'vi' ? 'Địa chỉ email đã đăng ký' : 'Registered email address'}
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                <Mail aria-hidden="true" className="w-4 h-4" />
              </div>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={language === 'vi' ? 'Nhập email của bạn' : 'Enter your email address'}
                className="w-full pl-10 pr-4 py-3.5 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-semibold text-[#2A211B] dark:text-stone-950 bg-[#F5A764] hover:bg-[#E89650] active:scale-[0.99] shadow-[0_8px_20px_rgba(245,167,100,0.3)] transition-all cursor-pointer disabled:opacity-60 text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#2A211B]/25 border-t-[#2A211B] rounded-full animate-spin" />
                  <span>{language === 'vi' ? 'Đang gửi mã OTP...' : 'Sending reset code...'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'vi' ? 'Gửi mã đặt lại mật khẩu' : 'Send Reset Code'}</span>
                  <ArrowRight aria-hidden="true" className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Verify 6-Digit OTP */}
      {step === 'otp' && (
        <div className="animate-in fade-in duration-300">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF6EE] dark:bg-stone-800 border border-[#F5A764]/30 dark:border-[#F5A764]/40 flex items-center justify-center text-[#B8652B] dark:text-[#F5A764] mb-3.5">
              <Mail aria-hidden="true" className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#2A211B] dark:text-stone-100 tracking-tight">
              {language === 'vi' ? 'Nhập mã xác thực' : 'Enter Reset Code'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-300 mt-2">
              {language === 'vi'
                ? 'Nếu email tồn tại trên hệ thống, mã OTP 6 chữ số đã được gửi tới:'
                : 'If the email is registered, a 6-digit code has been sent to:'}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 text-xs font-semibold text-[#2A211B] dark:text-stone-100 mt-2">
              <span>{email}</span>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMsg(null);
                  setInfoNotice(null);
                }}
                className="text-[11px] text-[#9A5828] dark:text-[#F5A764] hover:underline ml-1 cursor-pointer"
              >
                ({language === 'vi' ? 'đổi email' : 'change'})
              </button>
            </div>
          </div>

          {infoNotice && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-medium"
            >
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{infoNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-200 flex items-start gap-2 text-xs leading-relaxed"
            >
              <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{formatForgotError(errorMsg, language)}</div>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex items-center justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
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

            <button
              type="submit"
              disabled={isLoading || otpDigits.some((d) => !d)}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-semibold text-[#2A211B] dark:text-stone-950 bg-[#F5A764] hover:bg-[#E89650] shadow-[0_8px_20px_rgba(245,167,100,0.3)] transition-all cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#2A211B]/25 border-t-[#2A211B] rounded-full animate-spin" />
                  <span>{language === 'vi' ? 'Đang kiểm tra mã...' : 'Verifying code...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck aria-hidden="true" className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Tiếp tục đặt mật khẩu mới' : 'Continue'}</span>
                </>
              )}
            </button>

            <div className="text-center text-xs text-[#6D5D52] dark:text-stone-300">
              {resendCooldown > 0 ? (
                <span>
                  {language === 'vi' ? 'Chưa nhận được mã? Gửi lại sau' : "Didn't receive it? Resend in"}{' '}
                  <strong className="text-[#2A211B] dark:text-stone-100 font-semibold tabular-nums">{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-semibold text-[#9A5828] hover:text-[#7A441D] dark:text-[#F5A764] dark:hover:text-[#FBD6B0] hover:underline inline-flex items-center gap-1.5 min-h-[36px] cursor-pointer disabled:opacity-60"
                >
                  <RotateCw aria-hidden="true" className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{language === 'vi' ? 'Gửi lại mã OTP' : 'Resend OTP code'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Set New Password */}
      {step === 'password' && (
        <div className="animate-in fade-in duration-300">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-[#2A211B] dark:text-stone-100 tracking-tight">
              {language === 'vi' ? 'Đặt mật khẩu mới' : 'Create New Password'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-300 mt-2 leading-relaxed">
              {language === 'vi'
                ? 'Mật khẩu mới cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'
                : 'Must be at least 8 characters with uppercase, lowercase, number, and special character.'}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-200 flex items-start gap-2.5 text-xs leading-relaxed"
            >
              <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{formatForgotError(errorMsg, language)}</div>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative">
              <label htmlFor="new-password" className="sr-only">
                {language === 'vi' ? 'Mật khẩu mới' : 'New password'}
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                <Lock aria-hidden="true" className="w-4 h-4" />
              </div>
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={language === 'vi' ? 'Mật khẩu mới' : 'New password'}
                className="w-full pl-10 pr-12 py-3.5 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-pressed={showNewPassword}
                aria-label={
                  language === 'vi'
                    ? (showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới')
                    : (showNewPassword ? 'Hide new password' : 'Show new password')
                }
                className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 cursor-pointer rounded-r-2xl"
              >
                {showNewPassword ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="confirm-new-password" className="sr-only">
                {language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm new password'}
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75675C] dark:text-stone-400">
                <ShieldCheck aria-hidden="true" className="w-4 h-4" />
              </div>
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm new password'}
                className="w-full pl-10 pr-12 py-3.5 bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 rounded-2xl text-[#2A211B] dark:text-stone-100 placeholder-[#75675C] dark:placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A764]/70 focus:border-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
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
                className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[#6D5D52] dark:text-stone-300 hover:text-[#2A211B] dark:hover:text-stone-100 cursor-pointer rounded-r-2xl"
              >
                {showConfirmPassword ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-semibold text-[#2A211B] dark:text-stone-950 bg-[#F5A764] hover:bg-[#E89650] shadow-[0_8px_20px_rgba(245,167,100,0.3)] transition-all cursor-pointer disabled:opacity-60 text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#2A211B]/25 border-t-[#2A211B] rounded-full animate-spin" />
                  <span>{language === 'vi' ? 'Đang cập nhật mật khẩu...' : 'Updating password...'}</span>
                </>
              ) : (
                <span>{language === 'vi' ? 'Xác nhận đổi mật khẩu' : 'Reset Password'}</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <div role="status" aria-live="polite" className="text-center py-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm mb-4">
            <CheckCircle2 aria-hidden="true" className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#2A211B] dark:text-stone-100">
            {language === 'vi' ? 'Đặt lại mật khẩu thành công!' : 'Password Reset Successful!'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6D5D52] dark:text-stone-300 mt-2 max-w-xs mx-auto">
            {language === 'vi'
              ? 'Mật khẩu mới đã được cập nhật. Đang chuyển bạn về trang đăng nhập...'
              : 'Your password has been updated. Redirecting you to login...'}
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-5 h-5 border-2 border-[#F5A764]/30 border-t-[#F5A764] rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" className="min-h-[100dvh] w-full bg-[#FAF7F2] dark:bg-stone-950 flex flex-col lg:flex-row font-sans selection:bg-[#F5A764]/30 selection:text-stone-900 dark:selection:text-stone-100 overflow-x-hidden transition-colors">
      <section className="w-full lg:w-[56%] xl:w-[58%] min-h-[340px] lg:min-h-[100dvh] relative flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#EFE8DD] dark:border-stone-800">
        <Image
          src="/Campus%20Flea%20Market%20Day.webp"
          alt="Campus Flea Market Day"
          fill
          priority
          quality={80}
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#FAF7F2]/90 via-[#FAF7F2]/60 dark:from-stone-950/90 dark:via-stone-950/60 to-transparent pointer-events-none" />
      </section>

      <section className="w-full lg:w-[44%] xl:w-[42%] min-h-[calc(100dvh-340px)] lg:min-h-[100dvh] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-[#FAF7F2] dark:bg-stone-950">
        <Suspense fallback={<div className="p-8 text-center text-sm text-[#6D5D52] dark:text-stone-300">Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
