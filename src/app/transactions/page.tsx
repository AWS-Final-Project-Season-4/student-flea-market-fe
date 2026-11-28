'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRightLeft,
  Camera,
  CheckCircle2,
  Clock,
  Handshake,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { useLanguageStore } from '@/lib/language-store';
import { chatApi } from '@/lib/chat-api';
import {
  TransactionDto,
  transactionsApi,
  getVietQrImageUrl,
  ConfirmHandoverDto,
} from '@/lib/transactions-api';
import {
  ExchangeRequestDto,
  exchangeApi,
} from '@/lib/exchange-api';
import { searchPhotonAddresses } from '@/lib/location-search';

async function compressBillImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // BE rejects ProofImageUrl longer than 350_000 chars; keep a safety margin.
        const maxLength = 340_000;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể xử lý ảnh.'));
          return;
        }
        let maxDim = 800;
        let quality = 0.75;
        for (let attempt = 0; attempt < 8; attempt++) {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          ctx.fillStyle = '#ffffff'; // transparent PNG -> white, not black, in JPEG
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length <= maxLength) {
            resolve(dataUrl);
            return;
          }
          if (quality > 0.5) quality -= 0.1;
          else maxDim = Math.round(maxDim * 0.8);
        }
        reject(new Error('Ảnh bill quá lớn, vui lòng chọn ảnh khác.'));
      };
      img.onerror = () => reject(new Error('File ảnh không hợp lệ.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const { language } = useLanguageStore();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'orders' | 'exchanges'>('orders');

  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<'incoming' | 'outgoing' | undefined>(
    undefined
  );

  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequestDto[]>([]);
  const [loadingExchanges, setLoadingExchanges] = useState<boolean>(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const [activeModalTx, setActiveModalTx] = useState<TransactionDto | null>(null);
  const [modalType, setModalType] = useState<
    'vietqr' | 'handover' | 'accept' | 'deliver' | 'cancel' | null
  >(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Seller Accept / Deliver form (Photon autocomplete, no map)
  const [modalDeliveryMethod, setModalDeliveryMethod] = useState<1 | 2>(1);
  const [modalLocation, setModalLocation] = useState<string>('');
  const [modalLocationQuery, setModalLocationQuery] = useState<string>('');
  const [modalLocationSuggestions, setModalLocationSuggestions] = useState<string[]>([]);
  const [isSearchingModalLocation, setIsSearchingModalLocation] = useState<boolean>(false);
  const [modalCarrier, setModalCarrier] = useState<string>('');
  const [modalTrackingCode, setModalTrackingCode] = useState<string>('');

  // VietQR & Bill Transfer Proof
  const [qrBankId, setQrBankId] = useState<string>('MB');
  const [qrAccountNo, setQrAccountNo] = useState<string>('0901234567');
  const [billProofUrl, setBillProofUrl] = useState<string | null>(null);
  const [notifyChatOnBill, setNotifyChatOnBill] = useState<boolean>(true);
  const [previewBillUrl, setPreviewBillUrl] = useState<string | null>(null);

  // Handover & COD Inspection form
  const [handoverMode, setHandoverMode] = useState<'ok' | 'reject'>('ok');
  const [handoverCode, setHandoverCode] = useState<string>('');
  const [handoverNote, setHandoverNote] = useState<string>('');
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const [handoverSuccess, setHandoverSuccess] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingTransactions(true);
    setTransactionError(null);
    try {
      const res = await transactionsApi.list({ direction: directionFilter });
      const list = Array.isArray(res) ? res : res.items || [];
      setTransactions(list);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const removeFromCart = useCartStore.getState().removeFromCart;
        for (const tx of list) {
          if (tx.status === 5 && (tx.initiator.id || tx.initiator.userId) === currentUser.id) {
            removeFromCart(currentUser.id, tx.item.id);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách giao dịch.';
      setTransactionError(msg);
    } finally {
      setLoadingTransactions(false);
    }
  }, [isAuthenticated, directionFilter]);

  const fetchExchanges = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingExchanges(true);
    setExchangeError(null);
    try {
      const res = await exchangeApi.list();
      const list = Array.isArray(res) ? res : res.items || [];
      setExchangeRequests(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải yêu cầu đổi đồ.';
      setExchangeError(msg);
    } finally {
      setLoadingExchanges(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    if (activeTab === 'orders') {
      transactionsApi
        .list({ direction: directionFilter })
        .then((res) => {
          if (!active) return;
          const list = Array.isArray(res) ? res : res.items || [];
          setTransactions(list);
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            const removeFromCart = useCartStore.getState().removeFromCart;
            for (const tx of list) {
              if (tx.status === 5 && (tx.initiator.id || tx.initiator.userId) === currentUser.id) {
                removeFromCart(currentUser.id, tx.item.id);
              }
            }
          }
          setTransactionError(null);
        })
        .catch((err: unknown) => {
          if (!active) return;
          const msg = err instanceof Error ? err.message : 'Không thể tải danh sách giao dịch.';
          setTransactionError(msg);
        })
        .finally(() => {
          if (active) setLoadingTransactions(false);
        });
    } else {
      exchangeApi
        .list()
        .then((res) => {
          if (!active) return;
          const list = Array.isArray(res) ? res : res.items || [];
          setExchangeRequests(list);
          setExchangeError(null);
        })
        .catch((err: unknown) => {
          if (!active) return;
          const msg = err instanceof Error ? err.message : 'Không thể tải yêu cầu đổi đồ.';
          setExchangeError(msg);
        })
        .finally(() => {
          if (active) setLoadingExchanges(false);
        });
    }

    return () => {
      active = false;
    };
  }, [isAuthenticated, activeTab, directionFilter]);

  useEffect(() => {
    const trimmed = modalLocationQuery.trim();
    if ((modalType !== 'accept' && modalType !== 'deliver') || trimmed.length < 3) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchingModalLocation(true);
      try {
        const labels = await searchPhotonAddresses(trimmed, controller.signal);
        if (!controller.signal.aborted) setModalLocationSuggestions(labels);
      } catch {
        if (!controller.signal.aborted) setModalLocationSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsSearchingModalLocation(false);
      }
    }, 550);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [modalType, modalLocationQuery]);

  const closeModal = () => {
    setActiveModalTx(null);
    setModalType(null);
    setActionError(null);
    setHandoverError(null);
    setHandoverSuccess(null);
    setModalLocationQuery('');
    setModalLocationSuggestions([]);
    setIsSearchingModalLocation(false);
  };

  const openSellerActionModal = (tx: TransactionDto, type: 'accept' | 'deliver') => {
    setActiveModalTx(tx);
    setModalType(type);
    setActionError(null);
    setModalDeliveryMethod(tx.deliveryMethod === 2 ? 2 : 1);
    setModalLocation(tx.meetingLocation || tx.item.location || '');
    setModalLocationQuery('');
    setModalLocationSuggestions([]);
    setIsSearchingModalLocation(false);
    setModalCarrier(tx.deliveryCarrier || '');
    setModalTrackingCode(tx.trackingCode || '');
  };

  const openHandoverModal = (tx: TransactionDto) => {
    setActiveModalTx(tx);
    setModalType('handover');
    setHandoverMode('ok');
    setHandoverCode('');
    setHandoverNote('');
    setHandoverError(null);
    setHandoverSuccess(null);
  };

  const handleSellerAcceptOrDeliver = async () => {
    if (!activeModalTx || isSubmittingAction) return;
    setActionError(null);
    setIsSubmittingAction(true);

    try {
      if (modalType === 'accept') {
        await transactionsApi.accept(activeModalTx.id, {
          deliveryMethod: modalDeliveryMethod,
          meetingLocation: modalLocation.trim() || undefined,
          deliveryCarrier: modalCarrier.trim() || undefined,
          trackingCode: modalTrackingCode.trim() || undefined,
        });
      } else if (modalType === 'deliver') {
        await transactionsApi.startDelivery(activeModalTx.id, {
          meetingLocation: modalLocation.trim() || undefined,
          deliveryCarrier: modalCarrier.trim() || undefined,
          trackingCode: modalTrackingCode.trim() || undefined,
        });
      }
      closeModal();
      await fetchTransactions();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(
        apiErr?.response?.data?.message ||
          apiErr?.message ||
          (isVi ? 'Không thể cập nhật đơn hàng.' : 'Failed to update order.')
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCompleteOrder = async (txId: string) => {
    if (
      !confirm(
        isVi
          ? 'Xác nhận đơn hàng đã hoàn tất thành công?'
          : 'Confirm this order is completed?'
      )
    ) {
      return;
    }
    try {
      await transactionsApi.complete(txId);
      await fetchTransactions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Có lỗi khi hoàn thành đơn.');
    }
  };

  const handleCancelOrder = async () => {
    if (!activeModalTx) return;
    setIsSubmittingAction(true);
    try {
      await transactionsApi.cancel(activeModalTx.id, cancelReason);
      setCancelReason('');
      closeModal();
      await fetchTransactions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể hủy đơn.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmPayment = async (tx: TransactionDto) => {
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      await transactionsApi.confirmPayment(tx.id, {
        transactionRef: `SFM ${tx.id.substring(0, 8).toUpperCase()}`,
        proofImageUrl: billProofUrl || undefined,
      });

      if (notifyChatOnBill) {
        try {
          const conv = await chatApi.getOrCreateConversation(tx.item.id);
          await chatApi.sendMessageRest(
            conv.id,
            billProofUrl
              ? `Mình đã chuyển khoản VietQR đơn SFM #${tx.id.substring(0, 8).toUpperCase()} và đính kèm ảnh bill trên trang Giao dịch.`
              : `Mình đã chuyển khoản VietQR đơn SFM #${tx.id.substring(0, 8).toUpperCase()}, bạn kiểm tra giúp mình nhé.`
          );
        } catch {
          // Chat notice is best-effort; payment update already succeeded.
        }
      }

      setBillProofUrl(null);
      closeModal();
      await fetchTransactions();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(
        apiErr?.response?.data?.message ||
          apiErr?.message ||
          (isVi ? 'Không thể gửi xác nhận chuyển khoản.' : 'Failed to confirm transfer.')
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleOpenBillChat = async (tx: TransactionDto) => {
    try {
      const conv = await chatApi.getOrCreateConversation(tx.item.id);
      closeModal();
      router.push(`/chat?c=${encodeURIComponent(conv.id)}`);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Không thể mở khung chat với người bán.'
      );
    }
  };

  const handleBillFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setActionError(null);
    try {
      const compressed = await compressBillImage(file);
      setBillProofUrl(compressed);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Không thể đọc ảnh bill.');
    }
  };

  const handleConfirmHandover = async () => {
    if (!activeModalTx) return;
    setHandoverError(null);
    setHandoverSuccess(null);

    if (handoverMode === 'reject' && !handoverNote.trim()) {
      setHandoverError(
        isVi
          ? 'Vui lòng nhập lý do từ chối khi đồng kiểm.'
          : 'Please provide a reason when rejecting upon inspection.'
      );
      return;
    }

    if (activeModalTx.type === 2 && !handoverCode.trim()) {
      setHandoverError(
        isVi
          ? 'Đơn đổi đồ yêu cầu nhập mã hàng 8 ký tự để đối chiếu.'
          : 'Exchange orders require the 8-character item code.'
      );
      return;
    }

    setIsSubmittingAction(true);
    try {
      const payload: ConfirmHandoverDto = {
        itemReceivedOk: handoverMode === 'ok',
        itemCodeVerified: handoverCode.trim() || undefined,
        note: handoverNote.trim() || undefined,
      };
      const res = await transactionsApi.confirmHandover(activeModalTx.id, payload);
      if (handoverMode === 'reject') {
        setHandoverSuccess(
          isVi
            ? 'Đã ghi nhận từ chối nhận hàng khi đồng kiểm.'
            : 'Recorded inspection rejection.'
        );
      } else {
        setHandoverSuccess(
          isVi
            ? `Đã xác nhận đồng kiểm & bàn giao! (${res.confirmedCount}/${res.requiredCount} bên đã xác nhận).`
            : `Inspection & handover confirmed! (${res.confirmedCount}/${res.requiredCount} parties confirmed).`
        );
      }
      setTimeout(() => {
        closeModal();
        setHandoverCode('');
        setHandoverNote('');
        void fetchTransactions();
      }, 1400);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setHandoverError(
        apiErr?.response?.data?.message ||
          apiErr?.message ||
          (isVi ? 'Mã hàng không khớp hoặc có lỗi xảy ra.' : 'Verification failed.')
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAcceptExchange = async (id: string) => {
    if (!confirm(isVi ? 'Bạn đồng ý chấp nhận đổi món đồ này?' : 'Accept this exchange proposal?'))
      return;
    try {
      await exchangeApi.accept(id);
      await fetchExchanges();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể chấp nhận yêu cầu.');
    }
  };

  const handleRejectExchange = async (id: string) => {
    const note = prompt(isVi ? 'Lý do từ chối (không bắt buộc):' : 'Rejection note (optional):');
    try {
      await exchangeApi.reject(id, note || undefined);
      await fetchExchanges();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể từ chối yêu cầu.');
    }
  };

  const handleCancelExchange = async (id: string) => {
    if (!confirm(isVi ? 'Hủy yêu cầu đổi đồ này?' : 'Cancel this exchange proposal?')) return;
    try {
      await exchangeApi.cancel(id);
      await fetchExchanges();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể hủy yêu cầu.');
    }
  };

  const formatPrice = (val: number) => {
    if (val === 0) return isVi ? 'Miễn phí (Tặng)' : 'Free';
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  const getStatusBadge = (status: number, statusName: string) => {
    switch (status) {
      case 1: // Pending
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            {isVi ? 'Chờ xác nhận' : statusName}
          </span>
        );
      case 2: // Accepted
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3 h-3" />
            {isVi ? 'Đã duyệt / Chuẩn bị giao' : statusName}
          </span>
        );
      case 7: // Delivering
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Truck className="w-3 h-3" />
            {isVi ? 'Đang giao hàng' : statusName}
          </span>
        );
      case 6: // AwaitingConfirmation
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-[#C46A28] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-700">
            <ShieldCheck className="w-3 h-3" />
            {isVi ? 'Chờ xác nhận đồng kiểm' : statusName}
          </span>
        );
      case 3: // Rejected
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="w-3 h-3" />
            {isVi ? 'Từ chối đồng kiểm' : statusName}
          </span>
        );
      case 4: // Cancelled
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            {isVi ? 'Đã hủy' : statusName}
          </span>
        );
      case 5: // Completed
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            {isVi ? 'Hoàn thành' : statusName}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF7F2] dark:bg-stone-800 text-[#7A6D63] dark:text-stone-300 border border-[#EADBCE] dark:border-stone-700">
            {statusName}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 text-[#2A211B] dark:text-stone-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#6D5D52] dark:text-stone-300 hover:text-[#C46A28] dark:hover:text-[#F5A764] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isVi ? 'Quay lại trang chủ' : 'Back to Storefront'}</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCE] dark:border-stone-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2A211B] dark:text-stone-100 flex items-center gap-2.5">
              <Handshake className="w-7 h-7 text-[#B8652B] dark:text-[#F5A764]" />
              {isVi ? 'Quản lý Giao dịch & Trao đổi' : 'Trading & Transactions'}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6D63] dark:text-stone-400 mt-1">
              {isVi
                ? 'Hỗ trợ gặp trực tiếp (Seller chốt điểm hẹn) & Ship ngoài kèm Đồng kiểm COD an toàn.'
                : 'Supports direct meetup (seller-confirmed location) & external shipping with COD inspection.'}
            </p>
          </div>

          <div className="flex p-1 bg-white dark:bg-stone-900 rounded-2xl border border-[#EADBCE] dark:border-stone-800 shadow-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#C46A28] text-white dark:bg-[#F5A764] dark:text-stone-950 shadow-xs'
                  : 'text-[#7A6D63] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{isVi ? 'Đơn mua & Bán' : 'Orders & Sales'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exchanges')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'exchanges'
                  ? 'bg-[#C46A28] text-white dark:bg-[#F5A764] dark:text-stone-950 shadow-xs'
                  : 'text-[#7A6D63] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{isVi ? 'Yêu cầu Đổi đồ' : 'Exchange Proposals'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ORDERS & TRANSACTIONS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-stone-900 rounded-2xl border border-[#EADBCE] dark:border-stone-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#7A6D63] dark:text-stone-400">
                  {isVi ? 'Lọc vai trò:' : 'Role:'}
                </span>
                {(
                  [
                    { key: undefined, label: isVi ? 'Tất cả' : 'All' },
                    { key: 'outgoing', label: isVi ? 'Tôi mua' : 'Purchases' },
                    { key: 'incoming', label: isVi ? 'Tôi bán' : 'Sales' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key ?? 'all'}
                    type="button"
                    onClick={() => setDirectionFilter(item.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      directionFilter === item.key
                        ? 'bg-[#FAF7F2] dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-700'
                        : 'text-[#7A6D63] dark:text-stone-400 hover:bg-[#FAF7F2]/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={fetchTransactions}
                disabled={loadingTransactions}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7A6D63] dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTransactions ? 'animate-spin' : ''}`} />
                <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
              </button>
            </div>

            {transactionError && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transactionError}</span>
              </div>
            )}

            {loadingTransactions && (
              <div className="py-16 text-center text-[#7A6D63] dark:text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E89650] mb-2" />
                <p className="text-xs">{isVi ? 'Đang tải danh sách đơn...' : 'Loading orders...'}</p>
              </div>
            )}

            {!loadingTransactions && transactions.length === 0 && (
              <div className="py-16 text-center bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 p-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF7F2] dark:bg-stone-800 flex items-center justify-center text-[#B8652B] dark:text-[#F5A764]">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                  {isVi ? 'Chưa có đơn giao dịch nào' : 'No transactions yet'}
                </h3>
                <p className="text-xs text-[#7A6D63] dark:text-stone-400 max-w-md mx-auto">
                  {isVi
                    ? 'Khám phá sản phẩm trên Trang chủ, chọn Mua ngay hoặc trao đổi với người bán.'
                    : 'Browse campus listings, buy directly or exchange with sellers.'}
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C46A28] hover:bg-[#A65A24] text-white dark:bg-[#F5A764] dark:text-stone-950 text-xs font-bold transition"
                >
                  {isVi ? 'Khám phá sản phẩm' : 'Browse Marketplace'}
                </Link>
              </div>
            )}

            {!loadingTransactions && transactions.length > 0 && (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const isBuyer = (tx.initiator.id || tx.initiator.userId) === user?.id;
                  const isSeller = !isBuyer;
                  const partner = isBuyer ? tx.counterparty : tx.initiator;
                  const isFinished = tx.status === 3 || tx.status === 4 || tx.status === 5;
                  const isExternalShip = tx.deliveryMethod === 2;
                  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    tx.meetingLatitude != null && tx.meetingLongitude != null
                      ? `${tx.meetingLatitude},${tx.meetingLongitude}`
                      : tx.meetingLocation
                  )}`;

                  return (
                    <div
                      key={tx.id}
                      className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs p-5 sm:p-6 space-y-4 transition hover:border-[#D8C5B4] dark:hover:border-stone-700"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#FAF7F2] dark:border-stone-800/80">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#B8652B] dark:text-[#F5A764] bg-[#FAF7F2] dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-[#EADBCE] dark:border-stone-700">
                            SFM #{tx.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs font-medium text-[#7A6D63] dark:text-stone-400">
                            • {new Date(tx.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-stone-800 text-[#7A6D63] dark:text-stone-300">
                            {isBuyer
                              ? isVi
                                ? 'Bạn là Người mua'
                                : 'You are Buyer'
                              : isVi
                                ? 'Bạn là Người bán'
                                : 'You are Seller'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[#2A211B] dark:text-stone-200">
                            <Truck className="w-3 h-3 text-[#C46A28] dark:text-[#F5A764]" />
                            {tx.deliveryMethodName}
                          </span>
                        </div>
                        <div>{getStatusBadge(tx.status, tx.statusName)}</div>
                      </div>

                      {/* Item & Partner Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <div className="md:col-span-2 flex items-start gap-3.5">
                          <Link href={`/items/${tx.item.id}`} className="shrink-0">
                            {tx.item.primaryImageUrl || tx.item.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={tx.item.primaryImageUrl || tx.item.thumbnailUrl || ''}
                                alt={tx.item.title}
                                className="w-20 h-20 rounded-2xl object-cover border border-[#EADBCE] dark:border-stone-800"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-800 flex items-center justify-center text-[#B8652B] font-bold">
                                SFM
                              </div>
                            )}
                          </Link>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                MÃ: {tx.item.itemCode}
                              </span>
                              {(tx.quantity ?? 1) > 1 && (
                                <span className="text-[11px] font-semibold text-[#6D5D52] dark:text-stone-300">
                                  SL: x{tx.quantity}
                                </span>
                              )}
                            </div>

                            <Link href={`/items/${tx.item.id}`} className="hover:underline block">
                              <h3 className="text-sm sm:text-base font-bold text-[#2A211B] dark:text-stone-100 truncate">
                                {tx.item.title}
                              </h3>
                            </Link>

                            <p className="text-sm font-extrabold text-[#B8652B] dark:text-[#F5A764]">
                              {formatPrice(tx.amount)}
                            </p>

                            <div className="flex items-start gap-1.5 text-xs text-[#6D5D52] dark:text-stone-300 pt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764] shrink-0 mt-0.5" />
                              <a
                                href={mapHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2 break-words hover:text-[#C46A28]"
                              >
                                {isExternalShip
                                  ? `${isVi ? 'Giao tới:' : 'Deliver to:'} ${tx.meetingLocation}`
                                  : `${isVi ? 'Điểm hẹn:' : 'Meetup:'} ${tx.meetingLocation}`}
                              </a>
                            </div>

                            {(tx.deliveryCarrier || tx.trackingCode) && (
                              <p className="text-xs text-sky-700 dark:text-sky-300 font-medium">
                                {isVi ? 'Vận chuyển ngoài:' : 'Courier:'}{' '}
                                {[tx.deliveryCarrier, tx.trackingCode].filter(Boolean).join(' • ')}
                              </p>
                            )}

                            {tx.inspectionNote && (
                              <p className="text-xs text-[#6D5D52] dark:text-stone-300 italic">
                                {isVi ? 'Ghi chú đồng kiểm:' : 'Inspection note:'} {tx.inspectionNote}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Counterparty Card */}
                        <div className="p-3 bg-[#FAF7F2]/80 dark:bg-stone-800/60 rounded-2xl border border-[#EADBCE] dark:border-stone-700/80 space-y-1.5 text-xs">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-[#7A6D63] dark:text-stone-400">
                            {isBuyer
                              ? isVi
                                ? 'Người bán (Seller)'
                                : 'Seller'
                              : isVi
                                ? 'Người mua (Buyer)'
                                : 'Buyer'}
                          </p>
                          <p className="font-bold text-[#2A211B] dark:text-stone-100 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#B8652B]" />
                            {partner.fullName}
                          </p>
                          {partner.phoneNumber && (
                            <p className="text-[#7A6D63] dark:text-stone-300 flex items-center gap-1.5">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                SĐT / Zalo:
                              </span>{' '}
                              {partner.phoneNumber}
                            </p>
                          )}
                          {isExternalShip && (
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 pt-1 border-t border-[#EADBCE] dark:border-stone-700">
                              {isVi
                                ? 'Cước ship bên ngoài do 2 bên tự thanh toán, sàn không thu hộ.'
                                : 'External shipping fee is settled directly outside platform.'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#FAF7F2] dark:border-stone-800">
                        <div className="text-xs text-[#7A6D63] dark:text-stone-400 space-y-1">
                          {tx.payment ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span>
                                {isVi ? 'Thanh toán: ' : 'Payment: '}
                                <strong className="text-[#2A211B] dark:text-stone-200">
                                  {tx.payment.methodName} ({tx.payment.statusName})
                                </strong>
                              </span>
                              {tx.payment.proofImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewBillUrl(tx.payment!.proofImageUrl!)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 text-[#C46A28] dark:text-[#F5A764] font-semibold hover:underline cursor-pointer"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>{isVi ? 'Xem ảnh bill CK' : 'View Transfer Receipt'}</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span>{isVi ? 'Giao dịch trao đổi / 0 đ' : 'Exchange / Free'}</span>
                          )}
                          {tx.autoCompleteAt && (tx.status === 6 || tx.status === 7) && (
                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                              ⏳{' '}
                              {isVi
                                ? `Tự động hoàn thành lúc ${new Date(tx.autoCompleteAt).toLocaleString('vi-VN')} nếu không có phản hồi.`
                                : `Auto-completes at ${new Date(tx.autoCompleteAt).toLocaleString('en-US')} if no response.`}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Seller: Accept & Set Meetup / Delivery */}
                          {isSeller && tx.status === 1 && (
                            <button
                              type="button"
                              onClick={() => openSellerActionModal(tx, 'accept')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C46A28] hover:bg-[#A65A24] text-white dark:bg-[#F5A764] dark:text-stone-950 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                {isVi ? 'Duyệt & Chọn giao nhận' : 'Accept & Set Delivery'}
                              </span>
                            </button>
                          )}

                          {/* Seller: Mark Delivering */}
                          {isSeller && (tx.status === 1 || tx.status === 2) && (
                            <button
                              type="button"
                              onClick={() => openSellerActionModal(tx, 'deliver')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition cursor-pointer"
                            >
                              <Truck className="w-4 h-4" />
                              <span>
                                {isVi
                                  ? isExternalShip
                                    ? 'Giao cho Shipper'
                                    : 'Đang đi giao / Gặp mặt'
                                  : 'Start Delivery'}
                              </span>
                            </button>
                          )}

                          {/* VietQR button */}
                          {tx.amount > 0 && !isFinished && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModalTx(tx);
                                setBillProofUrl(tx.payment?.proofImageUrl ?? null);
                                setActionError(null);
                                setModalType('vietqr');
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF7F2] dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-700 hover:bg-[#F0E4D7] transition cursor-pointer"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>{isVi ? 'Mã VietQR' : 'VietQR Code'}</span>
                            </button>
                          )}

                          {/* COD / Handover Verification (both parties) */}
                          {!isFinished && (
                            tx.hasUserConfirmed ? (
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>
                                  {isVi
                                    ? 'Bạn đã xác nhận — Chờ đối tác'
                                    : 'Confirmed — Waiting for partner'}
                                </span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openHandoverModal(tx)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>
                                  {isVi
                                    ? tx.status === 6
                                      ? isSeller
                                        ? 'Đối tác đã đồng kiểm — Xác nhận nhận tiền'
                                        : 'Đối tác đã xác nhận — Đồng kiểm ngay'
                                      : isBuyer
                                        ? 'Đồng kiểm & Nhận hàng'
                                        : 'Xác nhận đã giao & Thu tiền'
                                    : 'Inspect & Confirm'}
                                </span>
                              </button>
                            )
                          )}

                          {/* Quick Complete (for Exchange step 1 or simple order) */}
                          {tx.canManage && (tx.status === 1 || tx.status === 2) && (
                            <button
                              type="button"
                              onClick={() => void handleCompleteOrder(tx.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            >
                              <span>{isVi ? 'Hoàn tất nhanh' : 'Quick Complete'}</span>
                            </button>
                          )}

                          {/* Cancel */}
                          {tx.canManage && (tx.status === 1 || tx.status === 2 || tx.status === 7) && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModalTx(tx);
                                setModalType('cancel');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{isVi ? 'Hủy' : 'Cancel'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXCHANGE REQUESTS */}
        {activeTab === 'exchanges' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-2xl border border-[#EADBCE] dark:border-stone-800">
              <span className="text-xs font-semibold text-[#7A6D63] dark:text-stone-400">
                {isVi ? 'Các đề xuất trao đổi đồ đang mở:' : 'Active exchange proposals:'}
              </span>
              <button
                type="button"
                onClick={fetchExchanges}
                disabled={loadingExchanges}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7A6D63] dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingExchanges ? 'animate-spin' : ''}`} />
                <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
              </button>
            </div>

            {exchangeError && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{exchangeError}</span>
              </div>
            )}

            {loadingExchanges && (
              <div className="py-16 text-center text-[#7A6D63] dark:text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E89650] mb-2" />
                <p className="text-xs">
                  {isVi ? 'Đang tải yêu cầu đổi đồ...' : 'Loading exchange proposals...'}
                </p>
              </div>
            )}

            {!loadingExchanges && exchangeRequests.length === 0 && (
              <div className="py-16 text-center bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 p-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF7F2] dark:bg-stone-800 flex items-center justify-center text-[#B8652B] dark:text-[#F5A764]">
                  <ArrowRightLeft className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                  {isVi ? 'Chưa có yêu cầu đổi đồ nào' : 'No exchange proposals yet'}
                </h3>
              </div>
            )}

            {!loadingExchanges && exchangeRequests.length > 0 && (
              <div className="space-y-4">
                {exchangeRequests.map((ex) => {
                  const isSender = ex.requesterId === user?.id;

                  return (
                    <div
                      key={ex.id}
                      className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#FAF7F2] dark:border-stone-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#B8652B] dark:text-[#F5A764] bg-[#FAF7F2] dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-[#EADBCE] dark:border-stone-700">
                            EX #{ex.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs font-medium text-[#7A6D63] dark:text-stone-400">
                            • {new Date(ex.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-stone-800 text-[#7A6D63] dark:text-stone-300">
                            {isSender
                              ? isVi
                                ? 'Bạn gửi đề nghị'
                                : 'You proposed'
                              : isVi
                                ? 'Đề nghị gửi tới bạn'
                                : 'Received proposal'}
                          </span>
                        </div>
                        <div>{getStatusBadge(ex.status, ex.statusName)}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="p-3.5 bg-[#FAF7F2]/60 dark:bg-stone-800/50 rounded-2xl border border-[#EADBCE] dark:border-stone-800 space-y-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                            {isVi ? 'Món nhận về:' : 'Item to receive:'}
                          </span>
                          <h4 className="text-sm font-bold truncate">{ex.requestedItem.title}</h4>
                          <p className="text-xs font-mono text-[#7A6D63]">
                            MÃ: {ex.requestedItem.itemCode}
                          </p>
                          <p className="text-xs font-bold text-[#B8652B]">
                            {formatPrice(ex.requestedItem.price)}
                          </p>
                        </div>

                        <div className="p-3.5 bg-[#FAF7F2]/60 dark:bg-stone-800/50 rounded-2xl border border-[#EADBCE] dark:border-stone-800 space-y-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">
                            {isVi ? 'Món đem đổi:' : 'Item offered:'}
                          </span>
                          <h4 className="text-sm font-bold truncate">{ex.offeredItem.title}</h4>
                          <p className="text-xs font-mono text-[#7A6D63]">
                            MÃ: {ex.offeredItem.itemCode}
                          </p>
                          <p className="text-xs font-bold text-[#B8652B]">
                            {formatPrice(ex.offeredItem.price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          {ex.additionalAmount !== 0 && (
                            <p>
                              <span className="text-[#7A6D63]">
                                {isVi ? 'Tiền bù chênh lệch: ' : 'Cash offset: '}
                              </span>
                              <strong className="text-[#B8652B] font-bold">
                                {formatPrice(ex.additionalAmount)}
                              </strong>
                            </p>
                          )}
                          {ex.note && (
                            <p className="text-[#7A6D63] dark:text-stone-400 italic">
                              &ldquo;{ex.note}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="text-[#7A6D63] dark:text-stone-400">
                          <span>
                            {isVi ? 'Người gửi:' : 'Requester:'} {ex.requesterName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#FAF7F2] dark:border-stone-800">
                        {ex.canRespond && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleAcceptExchange(ex.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isVi ? 'Đồng ý đổi' : 'Accept'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRejectExchange(ex.id)}
                              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>{isVi ? 'Từ chối' : 'Reject'}</span>
                            </button>
                          </>
                        )}
                        {ex.canCancel && (
                          <button
                            type="button"
                            onClick={() => void handleCancelExchange(ex.id)}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>{isVi ? 'Hủy yêu cầu' : 'Cancel Proposal'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: SELLER ACCEPT / START DELIVERY (with Seller Location Picker) */}
      {(modalType === 'accept' || modalType === 'deliver') && activeModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2] dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#C46A28] dark:text-[#F5A764]" />
                <h3 className="text-base font-bold">
                  {modalType === 'accept'
                    ? isVi
                      ? 'Duyệt đơn & Chốt giao nhận'
                      : 'Accept & Confirm Delivery'
                    : isVi
                      ? 'Cập nhật Đang giao hàng'
                      : 'Start Delivery'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label={isVi ? 'Đóng' : 'Close'}
                className="p-1 rounded-lg text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {modalType === 'accept' && (
                <div className="space-y-1.5">
                  <label className="block font-bold">
                    {isVi ? 'Hình thức giao nhận' : 'Delivery Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalDeliveryMethod(1)}
                      className={`p-2.5 rounded-xl border text-left font-semibold cursor-pointer ${
                        modalDeliveryMethod === 1
                          ? 'border-[#C46A28] bg-[#FAF7F2] dark:border-[#F5A764] dark:bg-stone-800'
                          : 'border-[#EADBCE] dark:border-stone-700'
                      }`}
                    >
                      {isVi ? 'Gặp trực tiếp / Tự giao' : 'Direct Meetup'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalDeliveryMethod(2)}
                      className={`p-2.5 rounded-xl border text-left font-semibold cursor-pointer ${
                        modalDeliveryMethod === 2
                          ? 'border-[#C46A28] bg-[#FAF7F2] dark:border-[#F5A764] dark:bg-stone-800'
                          : 'border-[#EADBCE] dark:border-stone-700'
                      }`}
                    >
                      {isVi ? 'Đặt ship bên ngoài' : 'External Shipper'}
                    </button>
                  </div>
                </div>
              )}

              {/* Seller Location chốt sau khi 2 bên thống nhất (autocomplete, no map) */}
              <div className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-stone-800/70 border border-[#EADBCE] dark:border-stone-700 space-y-2">
                <label htmlFor="seller-meetup-location" className="block font-bold">
                  {(modalType === 'accept' ? modalDeliveryMethod : activeModalTx.deliveryMethod) === 2
                    ? isVi
                      ? 'Địa chỉ nhận hàng (sau khi 2 bên chốt)'
                      : 'Delivery Address (Seller confirmed)'
                    : isVi
                      ? 'Location gặp giao dịch (Seller chốt)'
                      : 'Final Meetup Location (Seller)'}
                </label>
                <div className="relative">
                  <input
                    id="seller-meetup-location"
                    type="text"
                    maxLength={255}
                    value={modalLocation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModalLocation(val);
                      setModalLocationQuery(val);
                      if (val.trim().length < 3) {
                        setModalLocationSuggestions([]);
                        setIsSearchingModalLocation(false);
                      }
                    }}
                    placeholder={
                      (modalType === 'accept' ? modalDeliveryMethod : activeModalTx.deliveryMethod) === 2
                        ? isVi
                          ? 'Vd: KTX Khu B tòa B4, Thủ Đức...'
                          : 'Delivery address...'
                        : isVi
                          ? 'Vd: KTX Khu A - Cổng chính...'
                          : 'Meetup spot...'
                    }
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900"
                  />
                  {isSearchingModalLocation && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-[#C46A28]" />
                  )}
                </div>

                {modalLocationSuggestions.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 divide-y divide-[#FAF7F2] dark:divide-stone-800">
                    {modalLocationSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setModalLocation(s);
                          setModalLocationQuery('');
                          setModalLocationSuggestions([]);
                        }}
                        className="w-full px-2.5 py-1.5 text-left text-[11px] hover:bg-amber-50 dark:hover:bg-stone-800 cursor-pointer flex items-start gap-1.5"
                      >
                        <MapPin className="w-3 h-3 text-[#C46A28] shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}

                {(modalType === 'accept' ? modalDeliveryMethod : activeModalTx.deliveryMethod) === 2 && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                    {isVi
                      ? 'Phí ship bên ngoài do 2 bên tự thoả thuận và thanh toán trực tiếp với shipper. Sàn không thu hộ hay chịu trách nhiệm cước vận chuyển.'
                      : 'External shipping fees are paid directly between buyer, seller, and the courier. Platform does not handle shipping fees.'}
                  </div>
                )}
              </div>

              {(modalType === 'deliver' ||
                modalDeliveryMethod === 2 ||
                activeModalTx.deliveryMethod === 2) && (
                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="carrier-input" className="block font-bold mb-1">
                      {isVi
                        ? 'Đơn vị giao hàng / Người giao (tuỳ chọn)'
                        : 'Carrier / Courier (optional)'}
                    </label>
                    <input
                      id="carrier-input"
                      type="text"
                      value={modalCarrier}
                      onChange={(e) => setModalCarrier(e.target.value)}
                      placeholder={isVi ? 'Vd: GrabExpress, Ahamove, Tự giao...' : 'GrabExpress...'}
                      className="w-full px-3 py-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="tracking-input" className="block font-bold mb-1">
                      {isVi
                        ? 'Mã vận đơn / SĐT tài xế (tuỳ chọn)'
                        : 'Tracking Code / Driver Phone (optional)'}
                    </label>
                    <input
                      id="tracking-input"
                      type="text"
                      value={modalTrackingCode}
                      onChange={(e) => setModalTrackingCode(e.target.value)}
                      placeholder={isVi ? 'Vd: GRAB-8421 hoặc 090xxxxxxx' : 'Tracking / phone...'}
                      className="w-full px-3 py-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800"
                    />
                  </div>
                </div>
              )}

              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                  {actionError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF7F2] dark:border-stone-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => void handleSellerAcceptOrDeliver()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#C46A28] hover:bg-[#A65A24] text-white dark:bg-[#F5A764] dark:text-stone-950 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {modalType === 'accept'
                    ? isVi
                      ? 'Xác nhận duyệt đơn'
                      : 'Accept Order'
                    : isVi
                      ? 'Xác nhận Đang giao'
                      : 'Mark Delivering'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DYNAMIC VIETQR PAYMENT & BILL UPLOAD */}
      {modalType === 'vietqr' && activeModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2] dark:border-stone-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#B8652B] dark:text-[#F5A764]" />
                <h3 className="text-base font-bold">
                  {isVi ? 'VietQR & Gửi ảnh bill chuyển khoản' : 'VietQR & Upload Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label htmlFor="vietqr-bank" className="block font-semibold mb-1">
                  {isVi ? 'Ngân hàng' : 'Bank'}
                </label>
                <select
                  id="vietqr-bank"
                  value={qrBankId}
                  onChange={(e) => setQrBankId(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800"
                >
                  <option value="MB">MB Bank</option>
                  <option value="VCB">Vietcombank</option>
                  <option value="TCB">Techcombank</option>
                  <option value="ICB">VietinBank</option>
                  <option value="ACB">ACB</option>
                  <option value="BIDV">BIDV</option>
                  <option value="VPB">VPBank</option>
                  <option value="TPB">TPBank</option>
                </select>
              </div>
              <div className="col-span-2">
                <label htmlFor="vietqr-account" className="block font-semibold mb-1">
                  {isVi ? 'Số tài khoản người bán' : 'Seller Account No.'}
                </label>
                <input
                  id="vietqr-account"
                  type="text"
                  value={qrAccountNo}
                  onChange={(e) => setQrAccountNo(e.target.value)}
                  placeholder="0901234567"
                  className="w-full px-3 py-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800 font-mono"
                />
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-block p-3 bg-white rounded-2xl border-2 border-[#EADBCE] shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getVietQrImageUrl({
                    bankId: qrBankId,
                    accountNo: qrAccountNo.trim() || '0901234567',
                    amount: activeModalTx.amount,
                    memo: `SFM ${activeModalTx.id.substring(0, 8).toUpperCase()}`,
                    accountName: activeModalTx.counterparty.fullName,
                  })}
                  alt="VietQR Code"
                  className="w-48 h-48 mx-auto object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-base text-[#B8652B] dark:text-[#F5A764]">
                  {formatPrice(activeModalTx.amount)}
                </p>
                <p className="text-[#7A6D63] dark:text-stone-400">
                  {isVi ? 'Nội dung CK: ' : 'Transfer memo: '}
                  <strong className="font-mono text-[#2A211B] dark:text-stone-100 bg-[#FAF7F2] dark:bg-stone-800 px-2 py-0.5 rounded border border-[#EADBCE] dark:border-stone-700">
                    SFM {activeModalTx.id.substring(0, 8).toUpperCase()}
                  </strong>
                </p>
                <p className="text-[#7A6D63] dark:text-stone-400">
                  {isVi ? 'Người nhận: ' : 'Receiver: '}
                  <strong>{activeModalTx.counterparty.fullName}</strong>
                </p>
              </div>
            </div>

            {(activeModalTx.initiator.id || activeModalTx.initiator.userId) === user?.id && (
              <div className="space-y-2.5 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-stone-800/70 border border-[#EADBCE] dark:border-stone-700 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">
                    {isVi ? 'Chụp / Tải ảnh bill chuyển khoản' : 'Upload Transfer Bill'}
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 text-[#C46A28] dark:text-[#F5A764] font-semibold cursor-pointer hover:bg-amber-50/50">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{billProofUrl ? (isVi ? 'Đổi ảnh' : 'Change') : (isVi ? 'Chọn ảnh' : 'Upload')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => void handleBillFilePicked(e)}
                    />
                  </label>
                </div>

                {billProofUrl && (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={billProofUrl}
                      alt="Bill Preview"
                      className="max-h-40 rounded-xl border border-[#EADBCE] dark:border-stone-700 object-contain"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 text-[11px] text-[#6D5D52] dark:text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyChatOnBill}
                    onChange={(e) => setNotifyChatOnBill(e.target.checked)}
                    className="accent-[#C46A28]"
                  />
                  <span>
                    {isVi
                      ? 'Đồng thời gửi tin nhắn báo đã chuyển khoản cho người bán trong Chat'
                      : 'Also notify seller via Chat'}
                  </span>
                </label>
              </div>
            )}

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                {actionError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#FAF7F2] dark:border-stone-800">
              <button
                type="button"
                onClick={() => void handleOpenBillChat(activeModalTx)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#EADBCE] dark:border-stone-700 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764]" />
                <span>{isVi ? 'Mở Chat' : 'Open Chat'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
                >
                  {isVi ? 'Đóng' : 'Close'}
                </button>
                {(activeModalTx.initiator.id || activeModalTx.initiator.userId) === user?.id && (
                  <button
                    type="button"
                    disabled={isSubmittingAction}
                    onClick={() => void handleConfirmPayment(activeModalTx)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#C46A28] hover:bg-[#A65A24] text-white dark:bg-[#F5A764] dark:text-stone-950 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {billProofUrl
                        ? isVi
                          ? 'Gửi ảnh bill & Báo đã CK'
                          : 'Send Bill & Confirm'
                        : isVi
                          ? 'Báo đã chuyển khoản'
                          : 'I have transferred'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BILL PROOF LIGHTBOX */}
      {previewBillUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewBillUrl(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl p-4 max-w-lg w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {isVi ? 'Ảnh bill chuyển khoản' : 'Transfer Receipt'}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewBillUrl(null)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewBillUrl}
              alt="Payment Proof"
              className="w-full max-h-[75vh] object-contain rounded-2xl border border-[#EADBCE] dark:border-stone-700"
            />
          </div>
        </div>
      )}

      {/* MODAL 2: HANDOVER & COD INSPECTION */}
      {modalType === 'handover' && activeModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2] dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold">
                  {isVi ? 'Đồng kiểm & Xác nhận bàn giao' : 'COD Inspection & Handover'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF7F2] dark:bg-stone-800 rounded-2xl border border-[#EADBCE] dark:border-stone-700 space-y-1">
                <p className="font-bold">
                  {isVi ? 'Kiểm tra hàng trước khi thanh toán COD:' : 'Inspect before paying COD:'}
                </p>
                <p className="text-[#7A6D63] dark:text-stone-400 leading-relaxed">
                  {isVi
                    ? 'Khi nhận hàng trực tiếp hoặc từ shipper, hãy kiểm tra đúng sản phẩm rồi xác nhận. Nếu là COD, cả 2 bên xác nhận sẽ tự động đánh dấu Đã thanh toán & Hoàn thành.'
                    : 'Inspect the item before paying cash. Dual confirmation marks COD as paid and completes the order.'}
                </p>
                <p className="font-mono font-bold text-[#B8652B] dark:text-[#F5A764]">
                  MÃ HÀNG: {activeModalTx.item.itemCode}
                </p>
              </div>

              {(activeModalTx.initiator.id || activeModalTx.initiator.userId) === user?.id &&
                activeModalTx.type !== 2 && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHandoverMode('ok')}
                      className={`p-2.5 rounded-xl border text-left font-semibold cursor-pointer ${
                        handoverMode === 'ok'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                          : 'border-[#EADBCE] dark:border-stone-700'
                      }`}
                    >
                      {isVi ? 'Đồng kiểm OK & Nhận' : 'Inspect OK & Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHandoverMode('reject')}
                      className={`p-2.5 rounded-xl border text-left font-semibold cursor-pointer ${
                        handoverMode === 'reject'
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                          : 'border-[#EADBCE] dark:border-stone-700'
                      }`}
                    >
                      {isVi ? 'Từ chối nhận hàng' : 'Reject on Inspection'}
                    </button>
                  </div>
                )}

              {handoverError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{handoverError}</span>
                </div>
              )}

              {handoverSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{handoverSuccess}</span>
                </div>
              )}

              {handoverMode === 'ok' && (
                <div>
                  <label className="block font-bold mb-1">
                    {activeModalTx.type === 2
                      ? isVi
                        ? 'Mã hàng 8 ký tự trên món đồ *'
                        : '8-char Item Code *'
                      : isVi
                        ? 'Mã hàng 8 ký tự (tuỳ chọn đối chiếu)'
                        : '8-char Item Code (optional)'}
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={handoverCode}
                    onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
                    placeholder={activeModalTx.item.itemCode}
                    className="w-full font-mono uppercase tracking-widest text-center text-base py-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#F5A764]"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">
                  {handoverMode === 'reject'
                    ? isVi
                      ? 'Lý do từ chối khi đồng kiểm *'
                      : 'Rejection reason *'
                    : isVi
                      ? 'Ghi chú bàn giao (tuỳ chọn)'
                      : 'Handover note (optional)'}
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder={
                    handoverMode === 'reject'
                      ? isVi
                        ? 'Vd: Hàng móp méo / sai màu...'
                        : 'Damaged / wrong item...'
                      : isVi
                        ? 'Đã kiểm tra hàng OK và thanh toán COD'
                        : 'Checked OK and paid COD'
                  }
                  className="w-full py-2 px-3 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#F5A764]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF7F2] dark:border-stone-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmHandover()}
                disabled={isSubmittingAction}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50 ${
                  handoverMode === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {handoverMode === 'reject'
                    ? isVi
                      ? 'Xác nhận từ chối nhận'
                      : 'Confirm Rejection'
                    : isVi
                      ? 'Xác nhận hoàn tất'
                      : 'Confirm Handover'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL TRANSACTION */}
      {modalType === 'cancel' && activeModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2] dark:border-stone-800">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {isVi ? 'Hủy giao dịch' : 'Cancel Transaction'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-[#7A6D63] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#7A6D63] dark:text-stone-300">
                {isVi
                  ? 'Khi hủy đơn, số lượng sản phẩm sẽ được mở lại để người khác đặt mua.'
                  : 'When cancelled, item availability will be restored.'}
              </p>
              <div>
                <label className="block font-bold mb-1">
                  {isVi ? 'Lý do hủy (không bắt buộc):' : 'Reason for cancellation (optional):'}
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={
                    isVi ? 'Vd: Không liên lạc được, bận đột xuất...' : 'e.g., Schedule conflict...'
                  }
                  className="w-full p-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#F5A764] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF7F2] dark:border-stone-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A6D63] hover:bg-[#FAF7F2] cursor-pointer"
              >
                {isVi ? 'Quay lại' : 'Back'}
              </button>
              <button
                type="button"
                onClick={() => void handleCancelOrder()}
                disabled={isSubmittingAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isVi ? 'Xác nhận hủy đơn' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
