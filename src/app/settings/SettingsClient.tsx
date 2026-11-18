///////////////////////////////////////////////////////////
//                                                       //
//               SETTINGS PAGE (CLIENT VIEW)             //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Flag,
  KeyRound,
  Lock,
  Monitor,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Navbar } from '@/components/ui/layout/Navbar';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { profileApi } from '@/lib/profile-api';
import { ThemeMode, useThemeStore } from '@/lib/theme-store';
import type { PolicyOverviewItem } from '@/lib/policies';

type SettingsTab = 'security' | 'appearance' | 'reports' | 'policies';

const SPECIAL_CHAR_REGEX = /[\W_]/;

function normalizeTab(raw: string | null): SettingsTab {
  if (!raw) return 'security';
  const lower = raw.toLowerCase();
  if (lower === 'appearance' || lower === 'theme' || lower === 'display') return 'appearance';
  if (lower === 'reports' || lower === 'report') return 'reports';
  if (lower === 'policies' || lower === 'policy') return 'policies';
  return 'security';
}

function translatePasswordMessage(raw: string, language: 'vi' | 'en'): string {
  if (language === 'en') return raw;

  const lower = raw.toLowerCase();
  if (lower.includes('unable to connect to backend server')) {
    return 'Không thể kết nối máy chủ backend (kiểm tra http://localhost:5033).';
  }
  if (lower.includes('current password is incorrect') || lower.includes('invalid_current_password')) {
    return 'Mật khẩu hiện tại không chính xác.';
  }
  if (lower.includes('password confirmation does not match')) {
    return 'Mật khẩu xác nhận không khớp.';
  }
  if (lower.includes('new password must')) {
    return 'Mật khẩu mới phải từ 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.';
  }
  if (lower.includes('password changed successfully')) {
    return 'Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...';
  }
  return raw;
}

interface SettingsClientProps {
  policies: PolicyOverviewItem[];
}

export function SettingsClient({ policies }: SettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTabParam = searchParams.get('tab');

  const { isAuthenticated, isInitialized, initAuth, clearSession } = useAuthStore();
  const { language } = useLanguageStore();
  const { theme, resolvedTheme, setTheme, initTheme } = useThemeStore();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => normalizeTab(rawTabParam));
  const [prevTabParam, setPrevTabParam] = useState<string | null>(rawTabParam);
  if (prevTabParam !== rawTabParam) {
    setPrevTabParam(rawTabParam);
    setActiveTab(normalizeTab(rawTabParam));
  }

  const [selectedPolicySlug, setSelectedPolicySlug] = useState<string>(
    () => policies[0]?.slug || 'term-of-service'
  );

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPw, setShowCurrentPw] = useState<boolean>(false);
  const [showNewPw, setShowNewPw] = useState<boolean>(false);
  const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleSelectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setPrevTabParam(tab);
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  };

  // Password validation rules matching BE ChangePasswordRequestDtoValidator
  const pwRules = {
    minLength: newPassword.length >= 8,
    maxLength: newPassword.length <= 100,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasDigit: /\d/.test(newPassword),
    hasSpecial: SPECIAL_CHAR_REGEX.test(newPassword),
  };

  const isNewPasswordStrong =
    pwRules.minLength &&
    pwRules.maxLength &&
    pwRules.hasUpper &&
    pwRules.hasLower &&
    pwRules.hasDigit &&
    pwRules.hasSpecial;

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError(
        isVi ? 'Vui lòng nhập mật khẩu hiện tại.' : 'Please enter your current password.'
      );
      return;
    }

    if (!isNewPasswordStrong) {
      setPasswordError(
        isVi
          ? 'Mật khẩu mới chưa đáp ứng đủ 5 điều kiện bảo mật bên dưới.'
          : 'New password does not meet all 5 strength requirements below.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        isVi ? 'Mật khẩu xác nhận không khớp.' : 'Password confirmation does not match.'
      );
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await profileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(translatePasswordMessage(res.message, language));

      // BE revokes all refresh tokens on password change
      redirectTimerRef.current = setTimeout(() => {
        clearSession();
        router.replace('/login?passwordChanged=true');
      }, 1500);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Unable to change password.';
      setPasswordError(translatePasswordMessage(raw, language));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const activePolicy = policies.find((p) => p.slug === selectedPolicySlug) || policies[0] || null;

  const navItems: Array<{
    id: SettingsTab;
    icon: React.ReactNode;
    label: string;
    subtitle: string;
    badge?: string;
  }> = [
      {
        id: 'security',
        icon: <KeyRound className="w-4 h-4" />,
        label: isVi ? 'Đổi mật khẩu' : 'Change Password',
        subtitle: isVi ? 'Bảo mật tài khoản' : 'Account security',
      },
      {
        id: 'appearance',
        icon: resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
        label: isVi ? 'Hiển thị Sáng / Tối' : 'Appearance',
        subtitle: isVi ? 'Chế độ Sáng, Tối & Hệ thống' : 'Light, Dark & System mode',
      },
      {
        id: 'reports',
        icon: <Flag className="w-4 h-4" />,
        label: isVi ? 'Báo cáo (Report)' : 'Reports',
        subtitle: isVi ? 'Khiếu nại & vi phạm' : 'Disputes & violations',
        badge: isVi ? 'Sắp tới' : 'Soon',
      },
      {
        id: 'policies',
        icon: <ShieldCheck className="w-4 h-4" />,
        label: isVi ? 'Chính sách & Điều khoản' : 'Policies & Legal',
        subtitle: isVi ? 'Điều khoản, Bảo mật, Hoàn tiền' : 'Terms, Privacy & Disputes',
      },
    ];

  const themeOptions: Array<{
    mode: ThemeMode;
    icon: React.ReactNode;
    title: string;
    desc: string;
    previewClass: string;
    previewAccentClass: string;
  }> = [
      {
        mode: 'light',
        icon: <Sun className="w-5 h-5 text-amber-500" />,
        title: isVi ? 'Giao diện Sáng' : 'Light Mode',
        desc: isVi
          ? 'Nền kem ấm, độ tương phản dịu mắt phù hợp ban ngày.'
          : 'Warm cream canvas with soft contrast for daytime browsing.',
        previewClass: 'bg-[#FAF7F2] border-[#EADBCE]',
        previewAccentClass: 'bg-white border-[#EADBCE]',
      },
      {
        mode: 'dark',
        icon: <Moon className="w-5 h-5 text-amber-400" />,
        title: isVi ? 'Giao diện Tối' : 'Dark Mode',
        desc: isVi
          ? 'Nền tối dễ chịu cho mắt khi dùng vào ban đêm.'
          : 'Comfortable low-glare dark surfaces for night usage.',
        previewClass: 'bg-stone-950 border-stone-800',
        previewAccentClass: 'bg-stone-900 border-stone-700',
      },
      {
        mode: 'system',
        icon: <Monitor className="w-5 h-5 text-[#B8652B] dark:text-[#F5A764]" />,
        title: isVi ? 'Theo hệ thống' : 'System Default',
        desc: isVi
          ? 'Tự động đổi sáng/tối khớp với cài đặt thiết bị của bạn.'
          : 'Automatically matches your OS appearance preference.',
        previewClass: 'bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2] to-stone-900 border-[#D8C5B4]',
        previewAccentClass: 'bg-white/90 border-[#EADBCE]',
      },
    ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 text-[#2A211B] dark:text-stone-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6D63] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isVi ? 'Quay lại trang chủ' : 'Back to marketplace'}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2A211B] dark:text-stone-100">
              {isVi ? 'Cài đặt tài khoản' : 'Settings'}
            </h1>
            <p className="text-sm text-[#7A6D63] dark:text-stone-400 mt-1">
              {isVi
                ? 'Quản lý mật khẩu, chế độ hiển thị Sáng/Tối, mục Báo cáo và toàn bộ Chính sách hệ thống.'
                : 'Manage password security, Light/Dark appearance, upcoming Reports, and platform Policies.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT NAVIGATION */}
          <aside className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 p-3 shadow-xs space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-left transition cursor-pointer ${isActive
                      ? 'bg-[#FAF7F2] dark:bg-stone-800 border border-[#F5A764] text-[#2A211B] dark:text-stone-100 shadow-2xs'
                      : 'border border-transparent text-[#5C5047] dark:text-stone-300 hover:bg-[#FAF7F2]/70 dark:hover:bg-stone-800/60'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${isActive
                          ? 'bg-gradient-to-tr from-[#E89650] to-[#F5A764] text-white'
                          : 'bg-[#FAF7F2] dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-700'
                        }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{item.label}</p>
                      <p className="text-[11px] text-[#7A6D63] dark:text-stone-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* RIGHT CONTENT PANEL */}
          <section className="lg:col-span-8 bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs p-6 sm:p-7">
            {/* TAB 1: CHANGE PASSWORD */}
            {activeTab === 'security' && (
              <div>
                <div className="pb-5 border-b border-[#F0E4D7] dark:border-stone-800">
                  <h2 className="text-lg font-bold text-[#2A211B] dark:text-stone-100 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[#B8652B] dark:text-[#F5A764]" />
                    {isVi ? 'Đổi mật khẩu' : 'Change Password'}
                  </h2>
                  <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-1">
                    {isVi
                      ? 'Sau khi đổi mật khẩu thành công, toàn bộ phiên đăng nhập sẽ được đăng xuất để bảo vệ tài khoản.'
                      : 'For security, changing your password revokes active sessions and asks you to log in again.'}
                  </p>
                </div>

                {!isInitialized ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-[#EADBCE] border-t-[#E89650] animate-spin" />
                  </div>
                ) : !isAuthenticated ? (
                  <div className="mt-6 rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800/60 p-6 text-center space-y-3">
                    <Lock className="w-8 h-8 mx-auto text-[#B8652B] dark:text-[#F5A764]" />
                    <p className="text-sm font-bold text-[#2A211B] dark:text-stone-100">
                      {isVi
                        ? 'Bạn cần đăng nhập để đổi mật khẩu'
                        : 'Please log in to change your password'}
                    </p>
                    <p className="text-xs text-[#7A6D63] dark:text-stone-400">
                      {isVi
                        ? 'Nếu quên mật khẩu cũ, bạn có thể khôi phục trực tiếp bằng email sinh viên.'
                        : 'If you forgot your password, you can reset it via email verification.'}
                    </p>
                    <div className="pt-2 flex flex-wrap justify-center gap-2.5">
                      <Link
                        href="/login?redirect=/settings"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E89650] to-[#F5A764] text-white text-xs font-bold shadow-xs"
                      >
                        {isVi ? 'Đăng nhập ngay' : 'Log In'}
                      </Link>
                      <Link
                        href="/forgot-password"
                        className="px-4 py-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold text-[#5C5047] dark:text-stone-200"
                      >
                        {isVi ? 'Quên mật khẩu' : 'Forgot Password'}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                    {passwordError && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                        {isVi ? 'Mật khẩu hiện tại' : 'Current Password'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw((prev) => !prev)}
                          aria-label={isVi ? 'Hiện hoặc ẩn mật khẩu hiện tại' : 'Toggle current password visibility'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8E83] hover:text-[#2A211B] dark:hover:text-stone-200 cursor-pointer"
                        >
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* New Password */}
                      <div>
                        <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                          {isVi ? 'Mật khẩu mới' : 'New Password'}{' '}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw((prev) => !prev)}
                            aria-label={isVi ? 'Hiện hoặc ẩn mật khẩu mới' : 'Toggle new password visibility'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8E83] hover:text-[#2A211B] dark:hover:text-stone-200 cursor-pointer"
                          >
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div>
                        <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                          {isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}{' '}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw((prev) => !prev)}
                            aria-label={isVi ? 'Hiện hoặc ẩn xác nhận mật khẩu' : 'Toggle confirm password visibility'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8E83] hover:text-[#2A211B] dark:hover:text-stone-200 cursor-pointer"
                          >
                            {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Checklist */}
                    <div className="rounded-2xl bg-[#FAF7F2] dark:bg-stone-800/60 border border-[#F0E4D7] dark:border-stone-700 px-4 py-3">
                      <p className="text-[11px] font-bold text-[#5C5047] dark:text-stone-300 mb-2">
                        {isVi ? 'Yêu cầu mật khẩu mạnh:' : 'Password strength requirements:'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                        {[
                          {
                            ok: pwRules.minLength && pwRules.maxLength,
                            label: isVi ? '8–100 ký tự' : '8–100 characters',
                          },
                          {
                            ok: pwRules.hasUpper,
                            label: isVi ? 'Ít nhất 1 chữ hoa (A–Z)' : 'At least 1 uppercase letter (A–Z)',
                          },
                          {
                            ok: pwRules.hasLower,
                            label: isVi ? 'Ít nhất 1 chữ thường (a–z)' : 'At least 1 lowercase letter (a–z)',
                          },
                          {
                            ok: pwRules.hasDigit,
                            label: isVi ? 'Ít nhất 1 chữ số (0–9)' : 'At least 1 digit (0–9)',
                          },
                          {
                            ok: pwRules.hasSpecial,
                            label: isVi ? 'Ít nhất 1 ký tự đặc biệt (!@#$...)' : 'At least 1 special character (!@#$...)',
                          },
                        ].map((rule) => (
                          <div
                            key={rule.label}
                            className={`flex items-center gap-1.5 font-medium ${rule.ok
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-[#7A6D63] dark:text-stone-400'
                              }`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 ${rule.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#C8B9AA] dark:text-stone-600'
                                }`}
                            />
                            <span>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isChangingPassword || Boolean(passwordSuccess)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E89650] to-[#F5A764] hover:from-[#DC833B] hover:to-[#EC954B] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <KeyRound className="w-4 h-4" />
                        {isChangingPassword
                          ? isVi
                            ? 'Đang đổi mật khẩu...'
                            : 'Updating Password...'
                          : isVi
                            ? 'Đổi mật khẩu'
                            : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: APPEARANCE (LIGHT / DARK / SYSTEM) */}
            {activeTab === 'appearance' && (
              <div>
                <div className="pb-5 border-b border-[#F0E4D7] dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#2A211B] dark:text-stone-100 flex items-center gap-2">
                      {resolvedTheme === 'dark' ? (
                        <Moon className="w-5 h-5 text-[#F5A764]" />
                      ) : (
                        <Sun className="w-5 h-5 text-[#B8652B]" />
                      )}
                      {isVi ? 'Hiển thị Sáng / Tối' : 'Display Appearance'}
                    </h2>
                    <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-1">
                      {isVi
                        ? 'Lựa chọn chế độ màu yêu thích và tự động lưu trên trình duyệt của bạn.'
                        : 'Choose your preferred color mode. Saved automatically in your browser.'}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 text-[#2A211B] dark:text-stone-200">
                    {resolvedTheme === 'dark' ? (
                      <>
                        <Moon className="w-3.5 h-3.5 text-amber-400" />
                        {isVi ? 'Đang bật: Chế độ Tối' : 'Active: Dark'}
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        {isVi ? 'Đang bật: Chế độ Sáng' : 'Active: Light'}
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {themeOptions.map((opt) => {
                    const selected = theme === opt.mode;
                    return (
                      <button
                        key={opt.mode}
                        type="button"
                        onClick={() => setTheme(opt.mode)}
                        className={`group rounded-2xl border p-4 text-left transition cursor-pointer flex flex-col justify-between ${selected
                            ? 'border-[#E89650] bg-[#FAF7F2] dark:bg-stone-800 ring-2 ring-[#F5A764]/40'
                            : 'border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-[#F5A764]/70'
                          }`}
                      >
                        <div>
                          {/* Mini Theme Preview Box */}
                          <div
                            className={`w-full h-20 rounded-xl border p-2.5 mb-3 flex flex-col justify-between ${opt.previewClass}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#F5A764]" />
                              <span className="w-10 h-1.5 rounded-full bg-[#D8C5B4]/80" />
                            </div>
                            <div className={`w-full h-8 rounded-lg border p-1.5 flex items-center gap-2 ${opt.previewAccentClass}`}>
                              <span className="w-4 h-4 rounded-md bg-[#E89650]/80 shrink-0" />
                              <div className="space-y-1 flex-1">
                                <div className="w-3/4 h-1.5 rounded-full bg-[#9B8E83]/60" />
                                <div className="w-1/2 h-1.5 rounded-full bg-[#9B8E83]/40" />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-[#2A211B] dark:text-stone-100 flex items-center gap-2">
                              {opt.icon}
                              {opt.title}
                            </span>
                            {selected && (
                              <CheckCircle2 className="w-4 h-4 text-[#E89650] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-1.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: REPORTS (PLACEHOLDER FOR UPCOMING FEATURES) */}
            {activeTab === 'reports' && (
              <div>
                <div className="pb-5 border-b border-[#F0E4D7] dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#2A211B] dark:text-stone-100 flex items-center gap-2">
                      <Flag className="w-5 h-5 text-[#B8652B] dark:text-[#F5A764]" />
                      {isVi ? 'Báo cáo & Khiếu nại (Report)' : 'Reports & Disputes'}
                    </h2>
                    <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-1">
                      {isVi
                        ? 'Khu vực quản lý các báo cáo vi phạm, khiếu nại giao dịch và phản hồi từ đội ngũ Kiểm duyệt.'
                        : 'Track violation reports, transaction disputes, and Moderator responses.'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isVi ? 'Dành cho tính năng sau' : 'Upcoming Feature'}
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-[#D8C5B4] dark:border-stone-700 bg-[#FAF7F2]/80 dark:bg-stone-800/40 p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-[#B8652B] dark:text-[#F5A764] flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#2A211B] dark:text-stone-100">
                        {isVi
                          ? 'Hệ thống Báo cáo & Hòa giải đang được hoàn thiện ở chặng tiếp theo'
                          : 'Reporting & Mediation Hub will launch in an upcoming sprint'}
                      </h3>
                      <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-1 leading-relaxed">
                        {isVi
                          ? 'Sau khi hoàn thiện luồng Chi tiết sản phẩm và Trao đổi/Mua bán, bạn sẽ có thể gửi báo cáo bài đăng/người dùng và theo dõi trạng thái xử lý ngay tại đây.'
                          : 'Once Item Detail and Trading/Dispute flows are wired up, you will be able to submit and track moderation reports right here.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {[
                      {
                        title: isVi ? 'Báo cáo bài đăng' : 'Listing Reports',
                        desc: isVi
                          ? 'Gắn cờ hàng cấm, lừa đảo hoặc sai mô tả.'
                          : 'Flag prohibited, counterfeit, or misleading items.',
                      },
                      {
                        title: isVi ? 'Khiếu nại giao dịch' : 'Order Disputes',
                        desc: isVi
                          ? 'Gửi video/ảnh mở hộp trong vòng 48 giờ.'
                          : 'Submit unboxing evidence within 48h.',
                      },
                      {
                        title: isVi ? 'Lịch sử xử lý' : 'Resolution Log',
                        desc: isVi
                          ? 'Xem phản hồi trực tiếp từ Moderator/Admin.'
                          : 'Follow Moderator and Admin review outcomes.',
                      },
                    ].map((card) => (
                      <div
                        key={card.title}
                        className="rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 p-3.5"
                      >
                        <p className="text-xs font-bold text-[#2A211B] dark:text-stone-100">
                          {card.title}
                        </p>
                        <p className="text-[11px] text-[#7A6D63] dark:text-stone-400 mt-1 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: POLICIES */}
            {activeTab === 'policies' && (
              <div>
                <div className="pb-5 border-b border-[#F0E4D7] dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#2A211B] dark:text-stone-100 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      {isVi ? 'Chính sách & Điều khoản' : 'Platform Policies & Terms'}
                    </h2>
                    <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-1">
                      {isVi
                        ? 'Toàn bộ điều khoản sử dụng, quyền riêng tư và quy trình giải quyết tranh chấp của sàn.'
                        : 'Read full Terms of Service, Privacy Policy, and Return & Dispute guidelines.'}
                    </p>
                  </div>
                  {activePolicy && (
                    <Link
                      href={`/policies/${activePolicy.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B8652B] dark:text-[#F5A764] hover:underline"
                    >
                      <span>{isVi ? 'Mở trang toàn màn hình' : 'Open full page'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Policy Document Selector Cards */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {policies.map((pol) => {
                    const isSelected = activePolicy?.slug === pol.slug;
                    return (
                      <button
                        key={pol.slug}
                        type="button"
                        onClick={() => setSelectedPolicySlug(pol.slug)}
                        className={`rounded-2xl border p-3.5 text-left transition cursor-pointer ${isSelected
                            ? 'border-[#E89650] bg-[#FAF7F2] dark:bg-stone-800 ring-2 ring-[#F5A764]/35'
                            : 'border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-[#F5A764]/70'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${isSelected
                                ? 'text-[#B8652B] dark:text-[#F5A764]'
                                : 'text-[#7A6D63] dark:text-stone-400'
                              }`}
                          />
                          <span className="text-xs font-bold text-[#2A211B] dark:text-stone-100 line-clamp-1">
                            {isVi ? pol.titleVi : pol.titleEn}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A6D63] dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {isVi ? pol.summaryVi : pol.summaryEn}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Rendered Full Policy Markdown Content */}
                {activePolicy && (
                  <article className="mt-5 rounded-2xl border border-[#EADBCE] dark:border-stone-800 bg-[#FAF7F2]/60 dark:bg-stone-950/70 p-5 sm:p-7 max-h-[540px] overflow-y-auto">
                    <ReactMarkdown
                      components={{
                        h1: ({ ...props }) => (
                          <h1
                            className="text-xl sm:text-2xl font-extrabold text-[#2A211B] dark:text-stone-100 mb-4 pb-3 border-b border-[#EADBCE] dark:border-stone-800"
                            {...props}
                          />
                        ),
                        h2: ({ ...props }) => (
                          <h2
                            className="text-base sm:text-lg font-bold text-[#2A211B] dark:text-stone-100 mt-6 mb-2.5"
                            {...props}
                          />
                        ),
                        h3: ({ ...props }) => (
                          <h3
                            className="text-sm sm:text-base font-semibold text-[#2A211B] dark:text-stone-200 mt-4 mb-2"
                            {...props}
                          />
                        ),
                        p: ({ ...props }) => (
                          <p
                            className="text-[#4A3F37] dark:text-stone-300 leading-relaxed mb-3 text-xs sm:text-sm"
                            {...props}
                          />
                        ),
                        ul: ({ ...props }) => (
                          <ul
                            className="list-disc list-inside space-y-1.5 mb-4 text-[#4A3F37] dark:text-stone-300 pl-2 text-xs sm:text-sm"
                            {...props}
                          />
                        ),
                        ol: ({ ...props }) => (
                          <ol
                            className="list-decimal list-inside space-y-1.5 mb-4 text-[#4A3F37] dark:text-stone-300 pl-2 text-xs sm:text-sm"
                            {...props}
                          />
                        ),
                        li: ({ ...props }) => (
                          <li className="leading-relaxed" {...props} />
                        ),
                        strong: ({ ...props }) => (
                          <strong
                            className="font-semibold text-[#2A211B] dark:text-stone-100"
                            {...props}
                          />
                        ),
                        code: ({ ...props }) => (
                          <code
                            className="bg-white dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] px-1.5 py-0.5 rounded text-xs font-mono border border-[#EADBCE] dark:border-stone-700"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {isVi ? activePolicy.contentVi : activePolicy.contentEn}
                    </ReactMarkdown>
                  </article>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
