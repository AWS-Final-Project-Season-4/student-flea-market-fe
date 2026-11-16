///////////////////////////////////////////////////////////
//                                                       //
//             SELLER REGISTRATION & STATUS CARD         //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { canUserSell, sellerApi } from '@/lib/seller-api';
import { SellerStatusDto } from '@/types/auth';

interface SellerRequestCardProps {
  variant?: 'card' | 'modal';
  onApproved?: () => void;
  onNavigateProfile?: () => void;
}

function translateSellerMessage(raw: string, language: 'vi' | 'en'): string {
  if (language === 'en') return raw;
  const lower = raw.toLowerCase();
  if (lower.includes('unable to connect to backend server')) {
    return 'Không thể kết nối máy chủ backend (kiểm tra http://localhost:5033).';
  }
  return raw;
}

export function SellerRequestCard({
  variant = 'card',
  onApproved,
  onNavigateProfile,
}: SellerRequestCardProps) {
  const { user, isAuthenticated, setUser, syncProfile } = useAuthStore();
  const { language } = useLanguageStore();
  const isVi = language === 'vi';

  const [statusData, setStatusData] = useState<SellerStatusDto | null>(() =>
    user
      ? {
          sellerStatus: user.sellerStatus ?? 0,
          sellerStatusName: user.sellerStatusName ?? '',
          canSell: canUserSell(user),
          requestedAt: null,
          approvedAt: null,
          rejectionReason: null,
        }
      : null
  );
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(isAuthenticated);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const [note, setNote] = useState<string>('');
  const [agreedToPolicy, setAgreedToPolicy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const syncUserSellerFields = (next: SellerStatusDto) => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      setUser({
        ...currentUser,
        sellerStatus: next.sellerStatus,
        sellerStatusName: next.sellerStatusName,
        canSell: next.canSell,
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    sellerApi
      .getStatus()
      .then((res) => {
        if (!active) return;
        setStatusData(res);
        syncUserSellerFields(res);
        setErrorMsg(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const raw = err instanceof Error ? err.message : 'Unable to check seller status.';
        setErrorMsg(translateSellerMessage(raw, language));
      })
      .finally(() => {
        if (active) setIsLoadingStatus(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const effectiveCanSell = Boolean(statusData?.canSell || canUserSell(user));
  const sellerStatus = effectiveCanSell ? 2 : (statusData?.sellerStatus ?? user?.sellerStatus ?? 0);
  const isStaff = Boolean(
    user?.isAdmin ||
      user?.isModerator ||
      user?.isStaff ||
      user?.roleName === 'Admin' ||
      user?.roleName === 'Moderator'
  );

  const handleRefreshStatus = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsRefreshing(true);
    try {
      const [freshStatus] = await Promise.all([sellerApi.getStatus(), syncProfile()]);
      setStatusData(freshStatus);
      syncUserSellerFields(freshStatus);
      if (freshStatus.canSell) {
        setSuccessMsg(
          isVi
            ? 'Tài khoản của bạn đã được mở quyền bán hàng!'
            : 'Great news! Your seller permission is now active.'
        );
        onApproved?.();
      } else {
        setSuccessMsg(
          isVi ? 'Đã cập nhật trạng thái mới nhất.' : 'Seller status refreshed.'
        );
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Unable to refresh seller status.';
      setErrorMsg(translateSellerMessage(raw, language));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!agreedToPolicy) {
      setErrorMsg(
        isVi
          ? 'Vui lòng xác nhận cam kết tuân thủ Chính sách đăng bán trước khi gửi.'
          : 'Please agree to the marketplace listing policy before submitting.'
      );
      return;
    }

    const trimmedNote = note.trim();
    if (trimmedNote.length > 500) {
      setErrorMsg(
        isVi
          ? 'Ghi chú giới thiệu tối đa 500 ký tự.'
          : 'Introduction note must not exceed 500 characters.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const next = await sellerApi.requestSeller({
        note: trimmedNote || undefined,
      });
      setStatusData(next);
      syncUserSellerFields(next);
      setNote('');
      setSuccessMsg(
        isVi
          ? 'Đã gửi yêu cầu mở quyền bán hàng! Admin sẽ xem xét và duyệt sớm nhất.'
          : 'Seller request submitted! An Admin or Moderator will review it shortly.'
      );
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Unable to submit seller request.';
      setErrorMsg(translateSellerMessage(raw, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCancelling(true);
    try {
      const next = await sellerApi.cancelRequest();
      setStatusData(next);
      syncUserSellerFields(next);
      setSuccessMsg(
        isVi ? 'Đã hủy yêu cầu đăng ký bán hàng.' : 'Seller request has been cancelled.'
      );
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Unable to cancel seller request.';
      setErrorMsg(translateSellerMessage(raw, language));
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString(isVi ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBadgeMeta = () => {
    if (sellerStatus === 2) {
      return {
        label: isVi ? 'Đã kích hoạt' : 'Approved Seller',
        cls: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      };
    }
    if (sellerStatus === 1) {
      return {
        label: isVi ? 'Đang chờ duyệt' : 'Pending Review',
        cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    if (sellerStatus === 3) {
      return {
        label: isVi ? 'Bị từ chối' : 'Rejected',
        cls: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      };
    }
    return {
      label: isVi ? 'Chưa đăng ký bán' : 'Not Registered',
      cls: 'bg-[#FAF7F2] dark:bg-stone-800 text-[#7A6D63] dark:text-stone-300 border-[#EADBCE] dark:border-stone-700',
    };
  };

  const badge = getBadgeMeta();
  const hasPhone = Boolean(user?.phoneNumber && user.phoneNumber.trim().length > 0);
  const currentStep = sellerStatus === 2 ? 3 : sellerStatus === 1 ? 2 : 1;

  const wrapperClass =
    variant === 'card'
      ? 'bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs p-6 sm:p-7'
      : 'space-y-4';

  return (
    <section id="seller" className={wrapperClass}>
      {/* Header */}
      <div
        className={`flex flex-wrap items-start justify-between gap-3 ${
          variant === 'card' ? 'pb-5 border-b border-[#F0E4D7] dark:border-stone-800' : ''
        }`}
      >
        <div>
          <h2 className="text-lg font-bold text-[#2A211B] dark:text-stone-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#B8652B] dark:text-[#F5A764]" />
            {isVi ? 'Đăng ký Quyền Bán Hàng' : 'Seller Access & Registration'}
          </h2>
          <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-1">
            {isVi
              ? 'Mọi tài khoản đều có thể xin mở quyền đăng bán hoặc trao đổi đồ dùng sau khi được Admin xét duyệt.'
              : 'Any verified account can request permission to list and exchange items after quick Admin approval.'}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${badge.cls}`}
        >
          {sellerStatus === 2 ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : sellerStatus === 1 ? (
            <Clock className="w-3.5 h-3.5" />
          ) : sellerStatus === 3 ? (
            <XCircle className="w-3.5 h-3.5" />
          ) : (
            <Store className="w-3.5 h-3.5" />
          )}
          <span>{badge.label}</span>
        </span>
      </div>

      {/* 3-Step Compact Stepper */}
      <div className={`${variant === 'card' ? 'mt-5' : 'mt-3'} grid grid-cols-3 gap-2`}>
        {[
          {
            step: 1,
            label: isVi ? '1. Tài khoản sẵn sàng' : '1. Account Ready',
          },
          {
            step: 2,
            label: isVi ? '2. Chờ Admin duyệt' : '2. Admin Review',
          },
          {
            step: 3,
            label: isVi ? '3. Mở quyền đăng bán' : '3. Ready to Sell',
          },
        ].map((item) => {
          const isReached = currentStep >= item.step;
          const isCurrent = currentStep === item.step;
          return (
            <div
              key={item.step}
              className={`rounded-xl px-2.5 py-2 border text-[11px] font-semibold flex items-center gap-1.5 transition ${
                isCurrent
                  ? 'border-[#E89650] bg-[#FAF7F2] dark:bg-stone-800 text-[#2A211B] dark:text-stone-100'
                  : isReached
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-[#F0E4D7] dark:border-stone-800 bg-[#FAF7F2]/40 dark:bg-stone-900/60 text-[#9B8E83] dark:text-stone-500'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  isReached && !isCurrent
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-[#E89650] text-white'
                      : 'bg-[#EADBCE] dark:bg-stone-700 text-[#7A6D63] dark:text-stone-400'
                }`}
              >
                {item.step}
              </span>
              <span className="truncate">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoadingStatus ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#7A6D63] dark:text-stone-400">
          <Loader2 className="w-4 h-4 animate-spin text-[#E89650]" />
          <span>{isVi ? 'Đang kiểm tra trạng thái quyền bán...' : 'Checking seller status...'}</span>
        </div>
      ) : sellerStatus === 2 ? (
        /* STATE 2: APPROVED OR STAFF */
        <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                {isStaff
                  ? isVi
                    ? `Tài khoản ${user?.roleName} đã có sẵn quyền đăng bán`
                    : `${user?.roleName} accounts have full listing permissions`
                  : isVi
                    ? 'Tài khoản của bạn đã sẵn sàng đăng bán!'
                    : 'Your seller permissions are active!'}
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                {statusData?.approvedAt
                  ? isVi
                    ? `Được phê duyệt lúc: ${formatDateTime(statusData.approvedAt)}`
                    : `Approved on: ${formatDateTime(statusData.approvedAt)}`
                  : isVi
                    ? 'Bạn có thể đăng tin bán, tặng miễn phí hoặc trao đổi đồ dùng ngay.'
                    : 'You can now list items for sale, giveaway, or exchange.'}
              </p>
            </div>
          </div>

          {variant === 'card' && (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition shrink-0"
            >
              <span>{isVi ? 'Về trang chủ đăng đồ' : 'Go to Post Item'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ) : sellerStatus === 1 ? (
        /* STATE 1: PENDING */
        <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-900/80 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                {isVi
                  ? 'Yêu cầu mở quyền bán đang chờ xét duyệt'
                  : 'Your seller request is awaiting approval'}
              </h3>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                {isVi
                  ? 'Admin hoặc Moderator đang xem xét hồ sơ của bạn. Sau khi được duyệt, quyền đăng bán sẽ tự mở ngay lập tức mà không cần đăng nhập lại.'
                  : 'An Admin or Moderator will review your request shortly. Once approved, selling unlocks automatically without needing to re-login.'}
              </p>
              {statusData?.requestedAt && (
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 mt-2">
                  {isVi ? 'Đã gửi lúc: ' : 'Submitted at: '}
                  {formatDateTime(statusData.requestedAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={isRefreshing || isCancelling}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 hover:bg-amber-50 dark:hover:bg-stone-800 text-xs font-semibold text-amber-900 dark:text-amber-200 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isVi ? 'Kiểm tra lại trạng thái' : 'Check Status'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancelRequest}
              disabled={isCancelling || isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-stone-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>
                {isCancelling
                  ? isVi
                    ? 'Đang hủy...'
                    : 'Cancelling...'
                  : isVi
                    ? 'Hủy yêu cầu'
                    : 'Cancel Request'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* STATE 0 (NONE) OR STATE 3 (REJECTED): LIGHTWEIGHT MINI-FORM */
        <form onSubmit={handleSubmitRequest} className="mt-4 space-y-4">
          {sellerStatus === 3 && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 p-4 text-xs space-y-1">
              <p className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 shrink-0" />
                {isVi
                  ? 'Yêu cầu trước đó chưa được phê duyệt'
                  : 'Previous seller request was rejected'}
              </p>
              <p className="text-rose-700 dark:text-rose-300/90 pl-5">
                <span className="font-semibold">{isVi ? 'Lý do: ' : 'Reason: '}</span>
                {statusData?.rejectionReason ||
                  (isVi ? 'Chưa có ghi chú cụ thể từ Admin.' : 'No specific reason provided.')}
              </p>
              <p className="text-rose-700/80 dark:text-rose-400 pl-5">
                {isVi
                  ? 'Bạn có thể bổ sung thông tin (nếu cần) và gửi lại yêu cầu bên dưới.'
                  : 'You can update your note and resubmit your request below.'}
              </p>
            </div>
          )}

          {/* Open Verification Checklist (No MSSV / No KTX required) */}
          <div className="rounded-2xl border border-[#EADBCE] dark:border-stone-800 bg-[#FAF7F2]/70 dark:bg-stone-800/50 p-3.5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A6D63] dark:text-stone-400">
              {isVi ? 'Kiểm tra nhanh tài khoản' : 'Quick Account Check'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#2A211B] dark:text-stone-200">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    user?.isEmailVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                  }`}
                />
                <span>
                  {user?.isEmailVerified
                    ? isVi
                      ? 'Email tài khoản đã xác thực'
                      : 'Account email verified'
                    : isVi
                      ? 'Email chưa xác thực'
                      : 'Email not verified'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#2A211B] dark:text-stone-200">
                {hasPhone ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Phone className="w-4 h-4 shrink-0 text-amber-500" />
                )}
                <span className="truncate">
                  {hasPhone ? (
                    `${isVi ? 'SĐT liên hệ:' : 'Phone:'} ${user?.phoneNumber}`
                  ) : variant === 'modal' ? (
                    <Link
                      href="/profile"
                      onClick={onNavigateProfile}
                      className="text-[#B8652B] dark:text-[#F5A764] hover:underline font-medium"
                    >
                      {isVi
                        ? 'Khuyên thêm SĐT ở Hồ sơ (tùy chọn)'
                        : 'Optional: Add phone in Profile'}
                    </Link>
                  ) : (
                    <span className="text-[#7A6D63] dark:text-stone-400">
                      {isVi
                        ? 'Khuyên thêm SĐT ở trên (tùy chọn)'
                        : 'Optional: Add phone above'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-[#2A211B] dark:text-stone-200 mb-1.5">
              {isVi ? 'Lời nhắn ngắn gửi Admin (tùy chọn):' : 'Short note for Admin (optional):'}
            </label>

            <div className="relative">
              <textarea
                rows={variant === 'modal' ? 2 : 3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isVi
                    ? 'Vd: Mình muốn đăng bán lại sách cũ, đồ dùng cá nhân còn tốt...'
                    : 'E.g., Looking to sell my pre-owned electronics and personal items...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/80 text-xs sm:text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] focus:bg-white dark:focus:bg-stone-800 transition resize-none"
              />
              <span className="text-[10px] text-[#9B8E83] absolute right-3 bottom-2">
                {note.length}/500
              </span>
            </div>
          </div>

          {/* Policy Agreement Checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-[#5C5047] dark:text-stone-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToPolicy}
              onChange={(e) => {
                setAgreedToPolicy(e.target.checked);
                if (errorMsg) setErrorMsg(null);
              }}
              className="mt-0.5 w-4 h-4 rounded-sm border-[#D8C5B4] text-[#E89650] focus:ring-[#F5A764] cursor-pointer"
            />
            <span className="leading-relaxed">
              {isVi ? (
                <>
                  Tôi cam kết đăng thông tin sản phẩm trung thực và tuân thủ{' '}
                  <Link
                    href="/settings?tab=policies"
                    target="_blank"
                    className="font-semibold text-[#B8652B] dark:text-[#F5A764] hover:underline"
                  >
                    Chính sách & Điều khoản
                  </Link>{' '}
                  của sàn.
                </>
              ) : (
                <>
                  I agree to provide truthful product information and follow the platform{' '}
                  <Link
                    href="/settings?tab=policies"
                    target="_blank"
                    className="font-semibold text-[#B8652B] dark:text-[#F5A764] hover:underline"
                  >
                    Policies & Terms
                  </Link>
                  .
                </>
              )}
            </span>
          </label>

          {/* Submit */}
          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E89650] to-[#F5A764] hover:from-[#DC833B] hover:to-[#EC954B] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isVi ? 'Đang gửi...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {sellerStatus === 3
                      ? isVi
                        ? 'Gửi lại yêu cầu mở quyền bán'
                        : 'Resubmit Seller Request'
                      : isVi
                        ? 'Gửi yêu cầu mở quyền bán'
                        : 'Request Seller Access'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
