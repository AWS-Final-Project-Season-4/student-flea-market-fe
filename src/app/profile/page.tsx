///////////////////////////////////////////////////////////
//                                                       //
//                    USER PROFILE PAGE                  //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  CloudUpload,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Store,
  User as UserIcon,
} from 'lucide-react';
import { Navbar } from '@/components/ui/layout/Navbar';
import { SellerRequestCard } from '@/components/ui/seller/SellerRequestCard';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { profileApi } from '@/lib/profile-api';
import { UserDto } from '@/types/auth';

const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

function translateServerMessage(raw: string, language: 'vi' | 'en'): string {
  if (language === 'en') return raw;

  const lower = raw.toLowerCase();
  if (lower.includes('unable to connect to backend server')) {
    return 'Không thể kết nối máy chủ backend (kiểm tra http://localhost:5033).';
  }
  if (lower.includes('full name cannot be blank')) {
    return 'Họ và tên không được để trống.';
  }
  if (lower.includes('full name must be at least 2 characters')) {
    return 'Họ và tên phải có ít nhất 2 ký tự.';
  }
  if (lower.includes('full name must not exceed 150 characters')) {
    return 'Họ và tên không được vượt quá 150 ký tự.';
  }
  if (lower.includes('invalid phone number format')) {
    return 'Số điện thoại không hợp lệ (gồm 9–15 chữ số, có thể bắt đầu bằng +).';
  }
  return raw;
}

function getSellerStatusBadge(user: UserDto, language: 'vi' | 'en') {
  const status = (user.sellerStatusName || '').toLowerCase();
  const isVi = language === 'vi';

  if (user.canSell || status === 'approved') {
    return {
      label: isVi ? 'Đã kích hoạt quyền bán' : 'Approved Seller',
      className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    };
  }
  if (status === 'pending') {
    return {
      label: isVi ? 'Đang chờ duyệt bán hàng' : 'Seller Pending Review',
      className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
  }
  if (status === 'rejected') {
    return {
      label: isVi ? 'Yêu cầu bán bị từ chối' : 'Seller Request Rejected',
      className: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    };
  }
  if (status === 'suspended' || status === 'revoked') {
    return {
      label: isVi ? 'Quyền bán tạm ngưng' : 'Seller Suspended',
      className: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    };
  }
  return {
    label: isVi ? 'Tài khoản người mua' : 'Buyer Account',
    className: 'bg-[#FAF7F2] dark:bg-stone-800 text-[#7A6D63] dark:text-stone-300 border-[#EADBCE] dark:border-stone-700',
  };
}

function ProfileContent() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, initAuth, setUser } = useAuthStore();
  const { language } = useLanguageStore();
  const isVi = language === 'vi';

  const [isFetchingProfile, setIsFetchingProfile] = useState<boolean>(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  // Profile edit form state
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [studentCode, setStudentCode] = useState<string>('');
  const [dormitory, setDormitory] = useState<string>('');
  const [commonArea, setCommonArea] = useState<string>('');

  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login?redirect=/profile');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    let active = true;

    profileApi
      .getProfile()
      .then((profile) => {
        if (!active) return;
        setUser(profile);
        setFullName(profile.fullName || '');
        setPhoneNumber(profile.phoneNumber || '');
        setSchoolName(profile.schoolName || '');
        setStudentCode(profile.studentCode || '');
        setDormitory(profile.dormitory || '');
        setCommonArea(profile.commonArea || '');
        setProfileLoadError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const raw = err instanceof Error ? err.message : 'Unable to load latest profile from server.';
        setProfileLoadError(raw);
        if (user) {
          setFullName(user.fullName || '');
          setPhoneNumber(user.phoneNumber || '');
          setSchoolName(user.schoolName || '');
          setStudentCode(user.studentCode || '');
          setDormitory(user.dormitory || '');
          setCommonArea(user.commonArea || '');
        }
      })
      .finally(() => {
        if (active) setIsFetchingProfile(false);
      });

    return () => {
      active = false;
    };
    // Intentionally omit `user` so updating store after save doesn't refetch unnecessarily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAuthenticated, setUser]);

  const hasProfileChanges =
    user !== null &&
    (fullName.trim() !== (user.fullName || '').trim() ||
      phoneNumber.trim() !== (user.phoneNumber || '').trim() ||
      schoolName.trim() !== (user.schoolName || '').trim() ||
      studentCode.trim() !== (user.studentCode || '').trim() ||
      dormitory.trim() !== (user.dormitory || '').trim() ||
      commonArea.trim() !== (user.commonArea || '').trim());

  const handleResetProfileForm = () => {
    if (!user) return;
    setFullName(user.fullName || '');
    setPhoneNumber(user.phoneNumber || '');
    setSchoolName(user.schoolName || '');
    setStudentCode(user.studentCode || '');
    setDormitory(user.dormitory || '');
    setCommonArea(user.commonArea || '');
    setProfileError(null);
    setProfileSuccess(null);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedSchool = schoolName.trim();
    const trimmedStudentCode = studentCode.trim();
    const trimmedDormitory = dormitory.trim();
    const trimmedCommonArea = commonArea.trim();

    if (trimmedName.length < 2) {
      setProfileError(
        isVi
          ? 'Họ và tên phải có ít nhất 2 ký tự.'
          : 'Full name must be at least 2 characters.'
      );
      return;
    }

    if (trimmedName.length > 150) {
      setProfileError(
        isVi
          ? 'Họ và tên không được vượt quá 150 ký tự.'
          : 'Full name must not exceed 150 characters.'
      );
      return;
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      setProfileError(
        isVi
          ? 'Số điện thoại không hợp lệ (cần 9–15 chữ số, có thể bắt đầu bằng dấu +).'
          : 'Invalid phone number format (9–15 digits, optional leading +).'
      );
      return;
    }

    if (trimmedSchool.length > 200 || trimmedDormitory.length > 200 || trimmedCommonArea.length > 200) {
      setProfileError(
        isVi
          ? 'Trường, Ký túc xá và Khu vực giao dịch tối đa 200 ký tự.'
          : 'School, dormitory, and meetup area must not exceed 200 characters.'
      );
      return;
    }

    if (trimmedStudentCode.length > 50) {
      setProfileError(
        isVi
          ? 'Mã số sinh viên (MSSV) tối đa 50 ký tự.'
          : 'Student ID must not exceed 50 characters.'
      );
      return;
    }

    setIsSavingProfile(true);
    try {
      // Do NOT include avatarUrl here so existing Google/DB avatarUrl stays untouched until AWS S3 upload is added.
      const updatedUser = await profileApi.updateProfile({
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
        schoolName: trimmedSchool,
        studentCode: trimmedStudentCode,
        dormitory: trimmedDormitory,
        commonArea: trimmedCommonArea,
      });

      setUser(updatedUser);
      setFullName(updatedUser.fullName || '');
      setPhoneNumber(updatedUser.phoneNumber || '');
      setSchoolName(updatedUser.schoolName || '');
      setStudentCode(updatedUser.studentCode || '');
      setDormitory(updatedUser.dormitory || '');
      setCommonArea(updatedUser.commonArea || '');
      setProfileSuccess(
        isVi
          ? 'Cập nhật thông tin hồ sơ thành công!'
          : 'Profile information updated successfully!'
      );
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Unable to update profile.';
      setProfileError(translateServerMessage(raw, language));
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-10 h-10 rounded-full border-4 border-[#EADBCE] border-t-[#E89650] animate-spin" />
        </div>
      </div>
    );
  }

  const displayName = user?.fullName || user?.username || 'Student';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const hasVisibleAvatar = Boolean(user?.avatarUrl && failedAvatarUrl !== user.avatarUrl);
  const sellerBadge = user ? getSellerStatusBadge(user, language) : null;
  const formattedCreatedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 text-[#2A211B] dark:text-stone-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Page Header */}
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
              {isVi ? 'Hồ sơ cá nhân' : 'My Profile'}
            </h1>
            <p className="text-sm text-[#7A6D63] dark:text-stone-400 mt-1">
              {isVi
                ? 'Quản lý thông tin sinh viên, ảnh đại diện và khu vực giao dịch của bạn.'
                : 'Manage your student profile details, avatar, and campus meetup info.'}
            </p>
          </div>
        </div>

        {profileLoadError && (
          <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 px-4 py-3 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              {isVi
                ? `Không thể đồng bộ dữ liệu mới nhất từ máy chủ (${translateServerMessage(profileLoadError, language)}). Đang hiển thị thông tin đã lưu trên thiết bị.`
                : `Could not sync latest profile from server (${profileLoadError}). Showing locally cached account data.`}
            </span>
          </div>
        )}

        {isFetchingProfile && !user ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 p-10 flex flex-col items-center justify-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-full border-4 border-[#EADBCE] border-t-[#E89650] animate-spin" />
            <p className="text-sm text-[#7A6D63] dark:text-stone-400">
              {isVi ? 'Đang tải thông tin hồ sơ...' : 'Loading your profile...'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Avatar & Account Summary */}
            <aside className="lg:col-span-4 space-y-5">
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs overflow-hidden">
                {/* Decorative top accent */}
                <div className="h-20 bg-gradient-to-r from-[#F5A764] via-[#E89650] to-[#F5C08E]" />

                <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
                  {/* Avatar Circle */}
                  <div className="relative">
                    {hasVisibleAvatar && user?.avatarUrl ? (
                      // External OAuth / future S3 URL rendered with referrerPolicy for Google avatars
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        onError={() => setFailedAvatarUrl(user.avatarUrl ?? null)}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-stone-900 shadow-md bg-[#FAF7F2] dark:bg-stone-800"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white dark:border-stone-900 shadow-md bg-gradient-to-tr from-[#E89650] to-[#F5A764] text-white font-extrabold text-3xl flex items-center justify-center select-none">
                        {avatarInitial}
                      </div>
                    )}
                    <span
                      title={isVi ? 'Upload ảnh qua AWS S3 sắp ra mắt' : 'AWS S3 upload coming soon'}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 text-[#7A6D63] dark:text-stone-300 flex items-center justify-center shadow-xs"
                    >
                      <Camera className="w-4 h-4" />
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-[#2A211B] dark:text-stone-100 break-words max-w-full">
                    {displayName}
                  </h2>
                  {user?.username && (
                    <p className="text-xs font-medium text-[#7A6D63] dark:text-stone-400">
                      @{user.username}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                    {user?.roleName && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 text-[#2A211B] dark:text-stone-200">
                        <ShieldCheck className="w-3 h-3 text-[#B8652B] dark:text-[#F5A764]" />
                        {user.roleName}
                      </span>
                    )}
                    {user?.isEmailVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                        <BadgeCheck className="w-3 h-3" />
                        {isVi ? 'Đã xác thực Email' : 'Email Verified'}
                      </span>
                    )}
                  </div>

                  {sellerBadge && (
                    <div
                      className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sellerBadge.className}`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      {sellerBadge.label}
                    </div>
                  )}

                  {/* AWS S3 Avatar Placeholder Box */}
                  <div className="mt-5 w-full rounded-2xl border border-dashed border-[#D8C5B4] dark:border-stone-700 bg-[#FAF7F2]/80 dark:bg-stone-800/50 p-3.5 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-[#2A211B] dark:text-stone-100 inline-flex items-center gap-1.5">
                        <CloudUpload className="w-3.5 h-3.5 text-[#B8652B] dark:text-[#F5A764]" />
                        {isVi ? 'Ảnh đại diện' : 'Profile Avatar'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        AWS S3 • Soon
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#7A6D63] dark:text-stone-400">
                      {isVi
                        ? 'Chức năng tải lên và đổi ảnh đại diện sẽ được tích hợp với Amazon S3 sau khi triển khai hạ tầng AWS.'
                        : 'Direct avatar upload & update will be connected to Amazon S3 in the upcoming AWS integration phase.'}
                    </p>
                    <button
                      type="button"
                      disabled
                      className="mt-2.5 w-full py-2 px-3 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 text-[#9B8E83] dark:text-stone-500 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {isVi ? 'Tải ảnh mới (Chờ AWS S3)' : 'Upload Avatar (Pending AWS S3)'}
                    </button>
                  </div>

                  {/* Read-only Metadata */}
                  <div className="mt-5 w-full pt-4 border-t border-[#F0E4D7] dark:border-stone-800 space-y-2.5 text-left text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#7A6D63] dark:text-stone-400 inline-flex items-center gap-1.5 shrink-0">
                        <Mail className="w-3.5 h-3.5 text-[#B8652B] dark:text-[#F5A764]" />
                        Email
                      </span>
                      <span className="font-semibold text-[#2A211B] dark:text-stone-100 truncate" title={user?.email}>
                        {user?.email}
                      </span>
                    </div>
                    {formattedCreatedAt && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#7A6D63] dark:text-stone-400 shrink-0">
                          {isVi ? 'Tham gia từ' : 'Member since'}
                        </span>
                        <span className="font-semibold text-[#2A211B] dark:text-stone-100">
                          {formattedCreatedAt}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT COLUMN: Edit Profile + Settings Shortcuts */}
            <div className="lg:col-span-8 space-y-6">
              {/* CARD 1: Update Profile Information */}
              <section className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#F0E4D7] dark:border-stone-800">
                  <div>
                    <h2 className="text-lg font-bold text-[#2A211B] dark:text-stone-100 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-[#B8652B] dark:text-[#F5A764]" />
                      {isVi ? 'Thông tin cá nhân' : 'Personal Information'}
                    </h2>
                    <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-1">
                      {isVi
                        ? 'Các trường Trường, MSSV, KTX và Khu vực là tùy chọn — điền giúp người mua/bán dễ hẹn giao dịch hơn.'
                        : 'School, Student ID, Dormitory, and Meetup Area are optional — filling them helps coordinate campus meetups.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                  {profileError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name (Required) */}
                    <div>
                      <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                        {isVi ? 'Họ và tên' : 'Full Name'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          maxLength={150}
                          required
                          placeholder={isVi ? 'Nguyễn Văn A' : 'Full name'}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                        />
                      </div>
                    </div>

                    {/* Phone Number (Optional for updates / Google users) */}
                    <div>
                      <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                        {isVi ? 'Số điện thoại' : 'Phone Number'}{' '}
                        <span className="text-[#9B8E83] font-normal">
                          ({isVi ? 'tùy chọn' : 'optional'})
                        </span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          maxLength={16}
                          placeholder={isVi ? '0901234567 hoặc +84901234567' : '0901234567 or +84901234567'}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                        />
                      </div>
                    </div>

                    {/* School Name (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                        {isVi ? 'Trường đại học / Cao đẳng' : 'School / University'}{' '}
                        <span className="text-[#9B8E83] font-normal">
                          ({isVi ? 'tùy chọn' : 'optional'})
                        </span>
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          maxLength={200}
                          placeholder={isVi ? 'VD: ĐH Bách Khoa, ĐH FPT...' : 'e.g., FPT University, HCMUT...'}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                        />
                      </div>
                    </div>

                    {/* Student Code (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                        {isVi ? 'Mã số sinh viên (MSSV)' : 'Student ID'}{' '}
                        <span className="text-[#9B8E83] font-normal">
                          ({isVi ? 'tùy chọn' : 'optional'})
                        </span>
                      </label>
                      <div className="relative">
                        <IdCard className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={studentCode}
                          onChange={(e) => setStudentCode(e.target.value)}
                          maxLength={50}
                          placeholder={isVi ? 'VD: SE180123' : 'e.g., SE180123'}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                        />
                      </div>
                    </div>

                    {/* Dormitory / KTX (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                        {isVi ? 'Ký túc xá (KTX)' : 'Dormitory'}{' '}
                        <span className="text-[#9B8E83] font-normal">
                          ({isVi ? 'tùy chọn' : 'optional'})
                        </span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={dormitory}
                          onChange={(e) => setDormitory(e.target.value)}
                          maxLength={200}
                          placeholder={isVi ? 'VD: KTX Khu A, Khu B...' : 'e.g., Dorm Zone A, Building B2...'}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                        />
                      </div>
                    </div>

                    {/* Common Meetup Area (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
                        {isVi ? 'Khu vực hay giao dịch' : 'Preferred Meetup Area'}{' '}
                        <span className="text-[#9B8E83] font-normal">
                          ({isVi ? 'tùy chọn' : 'optional'})
                        </span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-[#9B8E83] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={commonArea}
                          onChange={(e) => setCommonArea(e.target.value)}
                          maxLength={200}
                          placeholder={isVi ? 'VD: Làng ĐH Thủ Đức, Quận 9...' : 'e.g., Main Gate, Library Plaza...'}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5">
                    {hasProfileChanges && (
                      <button
                        type="button"
                        onClick={handleResetProfileForm}
                        disabled={isSavingProfile}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 hover:bg-[#F3E7DA] dark:hover:bg-stone-700 text-xs sm:text-sm font-semibold text-[#5C5047] dark:text-stone-200 transition cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {isVi ? 'Hoàn tác' : 'Reset'}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSavingProfile || !hasProfileChanges}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E89650] to-[#F5A764] hover:from-[#DC833B] hover:to-[#EC954B] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingProfile
                        ? isVi
                          ? 'Đang lưu...'
                          : 'Saving...'
                        : isVi
                          ? 'Lưu thay đổi'
                          : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </section>

              {/* CARD 2: Seller Registration & Status */}
              <SellerRequestCard variant="card" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#EADBCE] border-t-[#E89650] animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
