'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Clock,
  Handshake,
  Loader2,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
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

export default function TransactionsPage() {
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const { language } = useLanguageStore();
  const isVi = language === 'vi';

  // Active Tab: 'orders' | 'exchanges'
  const [activeTab, setActiveTab] = useState<'orders' | 'exchanges'>('orders');

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<'incoming' | 'outgoing' | undefined>(undefined);

  // Exchange Requests State
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequestDto[]>([]);
  const [loadingExchanges, setLoadingExchanges] = useState<boolean>(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  // Selected Transaction Modal (for VietQR / Handover QR)
  const [activeModalTx, setActiveModalTx] = useState<TransactionDto | null>(null);
  const [modalType, setModalType] = useState<'vietqr' | 'handover' | 'cancel' | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Handover confirmation form
  const [handoverCode, setHandoverCode] = useState<string>('');
  const [handoverNote, setHandoverNote] = useState<string>('');
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const [handoverSuccess, setHandoverSuccess] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Load Transactions
  const fetchTransactions = async () => {
    if (!isAuthenticated) return;
    setLoadingTransactions(true);
    setTransactionError(null);
    try {
      const res = await transactionsApi.list({
        direction: directionFilter,
      });
      const list = Array.isArray(res) ? res : res.items || [];
      setTransactions(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách giao dịch.';
      setTransactionError(msg);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Load Exchange Requests
  const fetchExchanges = async () => {
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
  };

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

  // Actions
  const handleCompleteOrder = async (txId: string) => {
    if (!confirm(isVi ? 'Xác nhận đơn hàng đã hoàn tất thành công?' : 'Confirm this order is completed?')) {
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
      setActiveModalTx(null);
      setModalType(null);
      setCancelReason('');
      await fetchTransactions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể hủy đơn.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmPayment = async (txId: string) => {
    try {
      await transactionsApi.confirmPayment(txId);
      alert(isVi ? 'Đã thông báo xác nhận thanh toán thành công!' : 'Payment reported successfully!');
      setActiveModalTx(null);
      setModalType(null);
      await fetchTransactions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể gửi xác nhận.');
    }
  };

  const handleConfirmHandover = async () => {
    if (!activeModalTx) return;
    setHandoverError(null);
    setHandoverSuccess(null);
    setIsSubmittingAction(true);
    try {
      const payload: ConfirmHandoverDto = {
        itemReceivedOk: true,
        itemCodeVerified: handoverCode.trim() || undefined,
        note: handoverNote.trim() || undefined,
      };
      const res = await transactionsApi.confirmHandover(activeModalTx.id, payload);
      setHandoverSuccess(
        isVi
          ? `Đã xác nhận bàn giao! (${res.confirmedCount}/${res.requiredCount} bên đã xác nhận).`
          : `Handover confirmed! (${res.confirmedCount}/${res.requiredCount} parties confirmed).`
      );
      setTimeout(() => {
        setActiveModalTx(null);
        setModalType(null);
        setHandoverCode('');
        setHandoverNote('');
        fetchTransactions();
      }, 1500);
    } catch (err: unknown) {
      setHandoverError(err instanceof Error ? err.message : 'Mã hàng không khớp hoặc có lỗi xảy ra.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAcceptExchange = async (id: string) => {
    if (!confirm(isVi ? 'Bạn đồng ý chấp nhận đổi món đồ này?' : 'Accept this exchange proposal?')) return;
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
            {isVi ? 'Đang xử lý' : statusName}
          </span>
        );
      case 2: // Accepted / Confirmed
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3 h-3" />
            {isVi ? 'Đã duyệt / Sẵn sàng' : statusName}
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCE] dark:border-stone-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2A211B] dark:text-stone-100 flex items-center gap-2.5">
              <Handshake className="w-7 h-7 text-[#B8652B] dark:text-[#F5A764]" />
              {isVi ? 'Quản lý Giao dịch & Trao đổi' : 'Trading & Transactions'}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6D63] dark:text-stone-400 mt-1">
              {isVi
                ? 'Mạng lưới P2P độc quyền sinh viên: Thanh toán VietQR trực tiếp, quét mã bàn giao tại chỗ và bảo vệ quyền lợi.'
                : 'Campus P2P: Direct VietQR transfer, verified on-site meetup handover, and safe exchange.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-white dark:bg-stone-900 rounded-2xl border border-[#EADBCE] dark:border-stone-800 shadow-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-[#E89650] to-[#F5A764] text-white shadow-xs'
                  : 'text-[#7A6D63] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{isVi ? 'Đơn mua & Bán' : 'Orders & Sales'}</span>
            </button>
            <button
              onClick={() => setActiveTab('exchanges')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'exchanges'
                  ? 'bg-gradient-to-r from-[#E89650] to-[#F5A764] text-white shadow-xs'
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
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-stone-900 rounded-2xl border border-[#EADBCE] dark:border-stone-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#7A6D63] dark:text-stone-400">
                  {isVi ? 'Lọc vai trò:' : 'Role:'}
                </span>
                <button
                  onClick={() => setDirectionFilter(undefined)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    directionFilter === undefined
                      ? 'bg-[#FAF7F2] dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-700'
                      : 'text-[#7A6D63] dark:text-stone-400 hover:bg-[#FAF7F2]/50'
                  }`}
                >
                  {isVi ? 'Tất cả' : 'All'}
                </button>
                <button
                  onClick={() => setDirectionFilter('outgoing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    directionFilter === 'outgoing'
                      ? 'bg-[#FAF7F2] dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-700'
                      : 'text-[#7A6D63] dark:text-stone-400 hover:bg-[#FAF7F2]/50'
                  }`}
                >
                  {isVi ? 'Tôi mua' : 'Purchases'}
                </button>
                <button
                  onClick={() => setDirectionFilter('incoming')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    directionFilter === 'incoming'
                      ? 'bg-[#FAF7F2] dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-700'
                      : 'text-[#7A6D63] dark:text-stone-400 hover:bg-[#FAF7F2]/50'
                  }`}
                >
                  {isVi ? 'Tôi bán' : 'Sales'}
                </button>
              </div>

              <button
                onClick={fetchTransactions}
                disabled={loadingTransactions}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7A6D63] dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTransactions ? 'animate-spin' : ''}`} />
                <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
              </button>
            </div>

            {/* Error Message */}
            {transactionError && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transactionError}</span>
              </div>
            )}

            {/* Loading */}
            {loadingTransactions && (
              <div className="py-16 text-center text-[#7A6D63] dark:text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E89650] mb-2" />
                <p className="text-xs">{isVi ? 'Đang tải danh sách đơn...' : 'Loading orders...'}</p>
              </div>
            )}

            {/* Empty State */}
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
                    ? 'Bạn có thể tìm kiếm các món đồ ưng ý trên Trang chủ, nhắn tin trao đổi với người bán và chốt đơn nhanh chóng.'
                    : 'Browse campus listings, chat with sellers, and confirm orders to view them here.'}
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E89650] to-[#F5A764] text-white text-xs font-bold shadow-xs hover:from-[#DC833B] hover:to-[#EC954B] transition"
                >
                  {isVi ? 'Khám phá sản phẩm' : 'Browse Marketplace'}
                </Link>
              </div>
            )}

            {/* List of Orders */}
            {!loadingTransactions && transactions.length > 0 && (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const isInitiator = tx.initiator.userId === user?.id;
                  const partner = isInitiator ? tx.counterparty : tx.initiator;
                  const roleLabel = isInitiator
                    ? isVi
                      ? 'Bạn là Người mua'
                      : 'You are Buyer'
                    : isVi
                      ? 'Bạn là Người bán'
                      : 'You are Seller';

                  return (
                    <div
                      key={tx.id}
                      className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs p-5 sm:p-6 space-y-4 transition hover:border-[#D8C5B4] dark:hover:border-stone-700"
                    >
                      {/* Top Bar: Order ID, Type, Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#FAF7F2] dark:border-stone-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#B8652B] dark:text-[#F5A764] bg-[#FAF7F2] dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-[#EADBCE] dark:border-stone-700">
                            SFM #{tx.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs font-medium text-[#7A6D63] dark:text-stone-400">
                            • {new Date(tx.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-stone-800 text-[#7A6D63] dark:text-stone-300">
                            {roleLabel}
                          </span>
                        </div>
                        <div>{getStatusBadge(tx.status, tx.statusName)}</div>
                      </div>

                      {/* Main Item & Counterparty info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        {/* Item Card */}
                        <div className="md:col-span-2 flex items-start gap-3.5">
                          {tx.item.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={tx.item.thumbnailUrl}
                              alt={tx.item.title}
                              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#EADBCE] dark:border-stone-800 shrink-0"
                            />
                          ) : (
                            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-800 flex items-center justify-center text-[#B8652B] shrink-0 font-bold">
                              SFM
                            </div>
                          )}
                          <div className="space-y-1 min-w-0">
                            <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              MÃ HÀNG: {tx.item.itemCode}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-[#2A211B] dark:text-stone-100 truncate">
                              {tx.item.title}
                            </h3>
                            <p className="text-xs text-[#7A6D63] dark:text-stone-400">
                              {tx.item.conditionName || (isVi ? 'Đã qua sử dụng' : 'Pre-owned')}
                            </p>
                            <p className="text-sm font-extrabold text-[#B8652B] dark:text-[#F5A764]">
                              {formatPrice(tx.amount)}
                            </p>
                          </div>
                        </div>

                        {/* Partner Details (Student KYC verification) */}
                        <div className="p-3 bg-[#FAF7F2]/80 dark:bg-stone-800/60 rounded-2xl border border-[#EADBCE] dark:border-stone-700/80 space-y-1.5 text-xs">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-[#7A6D63] dark:text-stone-400">
                            {isInitiator
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
                          {partner.schoolName && (
                            <p className="text-[#7A6D63] dark:text-stone-300 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#9B8E83]" />
                              {partner.schoolName} {partner.studentCode ? `• MSSV: ${partner.studentCode}` : ''}
                            </p>
                          )}
                          {partner.phoneNumber && (
                            <p className="text-[#7A6D63] dark:text-stone-300 flex items-center gap-1.5">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zalo:</span>{' '}
                              {partner.phoneNumber}
                            </p>
                          )}
                          {tx.meetingLocation && (
                            <p className="text-[#7A6D63] dark:text-stone-300 flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#9B8E83] shrink-0" />
                              {tx.meetingLocation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons & QR Triggers */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#FAF7F2] dark:border-stone-800">
                        {/* Payment / Handover Status Note */}
                        <div className="text-xs text-[#7A6D63] dark:text-stone-400">
                          {tx.payment ? (
                            <span>
                              {isVi ? 'Thanh toán: ' : 'Payment: '}
                              <strong className="text-[#2A211B] dark:text-stone-200">
                                {tx.payment.methodName} ({tx.payment.statusName})
                              </strong>
                            </span>
                          ) : (
                            <span>{isVi ? 'Thanh toán khi gặp trực tiếp' : 'Pay in person'}</span>
                          )}
                        </div>

                        {/* Control Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* VietQR button (if BankTransfer & not completed) */}
                          {tx.amount > 0 && tx.status !== 4 && tx.status !== 5 && (
                            <button
                              onClick={() => {
                                setActiveModalTx(tx);
                                setModalType('vietqr');
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF7F2] dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-700 hover:bg-[#F0E4D7] transition cursor-pointer"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>{isVi ? 'Mã VietQR' : 'VietQR Code'}</span>
                            </button>
                          )}

                          {/* Handover QR button (for on-site meetup confirmation) */}
                          {tx.status !== 4 && tx.status !== 5 && (
                            <button
                              onClick={() => {
                                setActiveModalTx(tx);
                                setModalType('handover');
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF7F2] dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>{isVi ? 'Mã Bàn giao & Đồng kiểm' : 'Handover & Verify'}</span>
                            </button>
                          )}

                          {/* Complete button */}
                          {tx.canManage && tx.status !== 4 && tx.status !== 5 && (
                            <button
                              onClick={() => handleCompleteOrder(tx.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isVi ? 'Hoàn tất đơn' : 'Complete'}</span>
                            </button>
                          )}

                          {/* Cancel button */}
                          {tx.canManage && tx.status !== 4 && tx.status !== 5 && (
                            <button
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
            {/* Filter Bar */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-2xl border border-[#EADBCE] dark:border-stone-800">
              <span className="text-xs font-semibold text-[#7A6D63] dark:text-stone-400">
                {isVi ? 'Các đề xuất trao đổi đồ đang mở:' : 'Active exchange proposals:'}
              </span>
              <button
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
                <p className="text-xs">{isVi ? 'Đang tải yêu cầu đổi đồ...' : 'Loading exchange proposals...'}</p>
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
                <p className="text-xs text-[#7A6D63] dark:text-stone-400 max-w-md mx-auto">
                  {isVi
                    ? 'Khi xem chi tiết các món đồ có bật tính năng "Cho phép đổi đồ", bạn có thể chọn một món đồ của mình để gửi đề nghị trao đổi.'
                    : 'When browsing items with exchange enabled, you can offer one of your items to propose an exchange.'}
                </p>
              </div>
            )}

            {!loadingExchanges && exchangeRequests.length > 0 && (
              <div className="space-y-4">
                {exchangeRequests.map((ex) => {
                  const isSender = ex.sender.userId === user?.id;
                  const partner = isSender ? ex.receiver : ex.sender;

                  return (
                    <div
                      key={ex.id}
                      className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs p-5 sm:p-6 space-y-4"
                    >
                      {/* Top Bar */}
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

                      {/* 2 Items comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        {/* Requested Item (Món muốn nhận) */}
                        <div className="p-3.5 bg-[#FAF7F2]/60 dark:bg-stone-800/50 rounded-2xl border border-[#EADBCE] dark:border-stone-800 flex items-start gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                              {isVi ? 'Món nhận về (Requested):' : 'Item to receive:'}
                            </span>
                            <h4 className="text-sm font-bold text-[#2A211B] dark:text-stone-100 truncate">
                              {ex.requestedItem.title}
                            </h4>
                            <p className="text-xs font-mono font-semibold text-[#7A6D63]">
                              MÃ: {ex.requestedItem.itemCode}
                            </p>
                            <p className="text-xs font-bold text-[#B8652B]">
                              {formatPrice(ex.requestedItem.price)}
                            </p>
                          </div>
                        </div>

                        {/* Offered Item (Món đem đổi) */}
                        <div className="p-3.5 bg-[#FAF7F2]/60 dark:bg-stone-800/50 rounded-2xl border border-[#EADBCE] dark:border-stone-800 flex items-start gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">
                              {isVi ? 'Món đem đổi (Offered):' : 'Item offered:'}
                            </span>
                            <h4 className="text-sm font-bold text-[#2A211B] dark:text-stone-100 truncate">
                              {ex.offeredItem.title}
                            </h4>
                            <p className="text-xs font-mono font-semibold text-[#7A6D63]">
                              MÃ: {ex.offeredItem.itemCode}
                            </p>
                            <p className="text-xs font-bold text-[#B8652B]">
                              {formatPrice(ex.offeredItem.price)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Amount / Note */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          {ex.additionalAmount !== 0 && (
                            <p className="text-[#2A211B] dark:text-stone-200">
                              <span className="text-[#7A6D63]">{isVi ? 'Tiền bù chênh lệch: ' : 'Cash offset: '}</span>
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

                        {/* Partner KYC info */}
                        <div className="text-right text-[#7A6D63] dark:text-stone-400">
                          <span>{partner.fullName}</span>
                          {partner.schoolName && <span> • {partner.schoolName}</span>}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#FAF7F2] dark:border-stone-800">
                        {ex.canRespond && (
                          <>
                            <button
                              onClick={() => handleAcceptExchange(ex.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isVi ? 'Đồng ý đổi' : 'Accept'}</span>
                            </button>
                            <button
                              onClick={() => handleRejectExchange(ex.id)}
                              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>{isVi ? 'Từ chối' : 'Reject'}</span>
                            </button>
                          </>
                        )}
                        {ex.canCancel && (
                          <button
                            onClick={() => handleCancelExchange(ex.id)}
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

      {/* MODAL 1: DYNAMIC VIETQR PAYMENT */}
      {modalType === 'vietqr' && activeModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2] dark:border-stone-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#B8652B] dark:text-[#F5A764]" />
                <h3 className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                  {isVi ? 'Thanh toán qua VietQR (Napas 247)' : 'VietQR Payment'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveModalTx(null);
                  setModalType(null);
                }}
                className="p-1 rounded-lg text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-block p-3 bg-white rounded-2xl border-2 border-[#EADBCE] shadow-inner">
                {/* Dynamic VietQR Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getVietQrImageUrl({
                    accountNo: '0901234567', // STK mẫu hoặc lấy từ Seller bank
                    amount: activeModalTx.amount,
                    memo: `SFM ${activeModalTx.id.substring(0, 8).toUpperCase()}`,
                    accountName: activeModalTx.counterparty.fullName,
                  })}
                  alt="VietQR Code"
                  className="w-56 h-56 mx-auto object-contain rounded-xl"
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

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 text-left">
                {isVi
                  ? 'Sàn hoạt động P2P trực tiếp, không giữ tiền hộ. Sau khi chuyển tiền xong, bạn bấm "Báo đã chuyển khoản" để người bán kiểm tra.'
                  : 'Platform is direct P2P and holds no funds. Once transferred, click "I have paid" to notify the seller.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF7F2] dark:border-stone-800">
              <button
                onClick={() => {
                  setActiveModalTx(null);
                  setModalType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
              <button
                onClick={() => handleConfirmPayment(activeModalTx.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E89650] to-[#F5A764] text-white shadow-xs hover:from-[#DC833B] hover:to-[#EC954B] cursor-pointer"
              >
                {isVi ? 'Báo đã chuyển khoản' : 'I have transferred'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HANDOVER & AS-IS CODE VERIFICATION */}
      {modalType === 'handover' && activeModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2] dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                  {isVi ? 'Bàn giao & Đồng kiểm tại chỗ' : 'Handover & Verification'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveModalTx(null);
                  setModalType(null);
                }}
                className="p-1 rounded-lg text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF7F2] dark:bg-stone-800 rounded-2xl border border-[#EADBCE] dark:border-stone-700 space-y-1">
                <p className="font-bold text-[#2A211B] dark:text-stone-100">
                  {isVi ? 'Nguyên tắc Nguyên trạng (As-Is):' : 'As-Is Condition Rule:'}
                </p>
                <p className="text-[#7A6D63] dark:text-stone-400 leading-relaxed">
                  {isVi
                    ? 'Hai bên đồng kiểm sản phẩm trực tiếp. Nhập mã hàng 8 ký tự in trên món đồ để hệ thống đối chiếu chống tráo hàng trước khi hoàn tất.'
                    : 'Inspect the item together on campus. Enter the 8-character item code to verify authenticity and avoid item swapping.'}
                </p>
                <p className="text-xs font-mono font-bold text-[#B8652B]">
                  MÃ HÀNG MONG ĐỢI: {activeModalTx.item.itemCode}
                </p>
              </div>

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

              <div>
                <label className="block font-bold text-[#2A211B] dark:text-stone-200 mb-1">
                  {isVi ? 'Nhập mã hàng 8 ký tự trên món đồ vừa nhận:' : 'Enter 8-character Item Code on received item:'}
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={handoverCode}
                  onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
                  placeholder={activeModalTx.item.itemCode}
                  className="w-full font-mono uppercase tracking-widest text-center text-base py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#F5A764]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2A211B] dark:text-stone-200 mb-1">
                  {isVi ? 'Ghi chú bàn giao (tùy chọn):' : 'Handover note (optional):'}
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder={isVi ? 'Hàng đúng mô tả, hoạt động tốt' : 'Item in good condition'}
                  className="w-full py-2 px-3 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#F5A764]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF7F2] dark:border-stone-800">
              <button
                onClick={() => {
                  setActiveModalTx(null);
                  setModalType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A6D63] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 cursor-pointer"
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmHandover}
                disabled={isSubmittingAction || !handoverCode.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isVi ? 'Xác nhận đã nhận đúng đồ' : 'Confirm & Complete'}</span>
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
                onClick={() => {
                  setActiveModalTx(null);
                  setModalType(null);
                }}
                className="p-1 rounded-lg text-[#7A6D63] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#7A6D63] dark:text-stone-300">
                {isVi
                  ? 'Khi hủy đơn, sản phẩm sẽ được mở lại trạng thái "Đang bán" trên sàn.'
                  : 'When cancelled, the item will return to active listing status.'}
              </p>
              <div>
                <label className="block font-bold text-[#2A211B] dark:text-stone-200 mb-1">
                  {isVi ? 'Lý do hủy (không bắt buộc):' : 'Reason for cancellation (optional):'}
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={isVi ? 'Vd: Không liên lạc được, bận đột xuất...' : 'e.g., Schedule conflict...'}
                  className="w-full p-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#F5A764] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF7F2] dark:border-stone-800">
              <button
                onClick={() => {
                  setActiveModalTx(null);
                  setModalType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A6D63] hover:bg-[#FAF7F2] cursor-pointer"
              >
                {isVi ? 'Quay lại' : 'Back'}
              </button>
              <button
                onClick={handleCancelOrder}
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
