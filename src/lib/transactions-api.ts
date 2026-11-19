///////////////////////////////////////////////////////////
//                                                       //
//               TRANSACTIONS & TRADING API              //
//                                                       //
///////////////////////////////////////////////////////////

import { apiClient } from './api-client';

export interface TradingPartyDto {
  userId: string;
  fullName: string;
  username?: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  schoolName?: string | null;
  studentCode?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
}

export interface TradingItemDto {
  itemId: string;
  itemCode: string;
  title: string;
  price: number;
  thumbnailUrl?: string | null;
  conditionName?: string;
  canExchange: boolean;
  statusName?: string;
}

export interface PaymentDto {
  id: string;
  method: number; // 1 = Cod, 2 = BankTransfer
  methodName: string;
  status: number; // 1 = Pending, 2 = Paid, 3 = Failed, 4 = Refunded
  statusName: string;
  amount: number;
  transactionRef: string;
  payerId: string;
  payerName: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface TransactionDto {
  id: string;
  type: number; // 1 = Purchase, 2 = Exchange, 3 = Free
  typeName: string;
  status: number; // 1 = Pending, 2 = Accepted, 3 = Rejected, 4 = Cancelled, 5 = Completed
  statusName: string;
  initiator: TradingPartyDto;
  counterparty: TradingPartyDto;
  item: TradingItemDto;
  offeredItem?: TradingItemDto | null;
  exchangeRequestId?: string | null;
  amount: number;
  meetingLocation: string;
  payment?: PaymentDto | null;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  canManage: boolean;
}

export interface CreatePurchaseTransactionDto {
  itemCode: string;
  meetingLocation?: string;
  paymentMethod: number; // 1 = Cod, 2 = BankTransfer
  amount?: number;
}

export interface CreateExchangeTransactionDto {
  exchangeRequestId: string;
  meetingLocation?: string;
  paymentMethod?: number;
  amount?: number;
}

export interface TransactionQueryDto {
  status?: number;
  type?: number;
  direction?: 'incoming' | 'outgoing';
  page?: number;
  pageSize?: number;
}

export interface TransactionListResponse {
  items: TransactionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ConfirmHandoverDto {
  itemReceivedOk: boolean;
  itemCodeVerified?: string;
  note?: string;
}

export interface HandoverConfirmationDto {
  transactionId: string;
  status: number;
  statusName: string;
  confirmedCount: number;
  requiredCount: number;
  isCompleted: boolean;
  itemCodeMatched?: boolean | null;
  expectedItemCode?: string | null;
  suggestion?: string | null;
}

export interface HandoverStatusDto {
  transactionId: string;
  status: number;
  statusName: string;
  confirmedCount: number;
  requiredCount: number;
  isCompleted: boolean;
  hasInitiatorConfirmed: boolean;
  hasCounterpartyConfirmed: boolean;
}

// VietQR Generator helper (Standard Napas 247 Dynamic QR)
export function getVietQrImageUrl(params: {
  bankId?: string; // e.g. "MB", "ICB", "VCB"
  accountNo: string;
  accountName?: string;
  amount: number;
  memo: string; // e.g. "SFM AB12CD34"
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}): string {
  const bank = params.bankId || 'MB';
  const tmpl = params.template || 'compact2';
  const encodedMemo = encodeURIComponent(params.memo);
  const encodedName = params.accountName ? encodeURIComponent(params.accountName) : '';
  return `https://img.vietqr.io/image/${bank}-${params.accountNo}-${tmpl}.png?amount=${Math.round(
    params.amount
  )}&addInfo=${encodedMemo}${encodedName ? `&accountName=${encodedName}` : ''}`;
}

export const transactionsApi = {
  createPurchase: (dto: CreatePurchaseTransactionDto) =>
    apiClient.post<TransactionDto>('/api/Transactions/purchase', dto),

  createExchange: (dto: CreateExchangeTransactionDto) =>
    apiClient.post<TransactionDto>('/api/Transactions/exchange', dto),

  list: (query?: TransactionQueryDto) => {
    const params = new URLSearchParams();
    if (query?.status !== undefined) params.append('status', String(query.status));
    if (query?.type !== undefined) params.append('type', String(query.type));
    if (query?.direction) params.append('direction', query.direction);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));
    const qs = params.toString();
    return apiClient.get<TransactionListResponse | TransactionDto[]>(`/api/Transactions${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => apiClient.get<TransactionDto>(`/api/Transactions/${id}`),

  complete: (id: string) => apiClient.post<TransactionDto>(`/api/Transactions/${id}/complete`),

  cancel: (id: string, reason?: string) =>
    apiClient.post<TransactionDto>(`/api/Transactions/${id}/cancel`, { reason }),

  confirmPayment: (id: string, transactionRef?: string) =>
    apiClient.post<TransactionDto>(`/api/Transactions/${id}/payment`, { transactionRef }),

  confirmHandover: (id: string, dto: ConfirmHandoverDto) =>
    apiClient.post<HandoverConfirmationDto>(`/api/Transactions/${id}/handover`, dto),

  getHandoverStatus: (id: string) =>
    apiClient.get<HandoverStatusDto>(`/api/Transactions/${id}/handover`),
};
