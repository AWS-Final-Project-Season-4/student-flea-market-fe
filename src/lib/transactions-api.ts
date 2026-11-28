///////////////////////////////////////////////////////////
//                                                       //
//               TRANSACTIONS & TRADING API              //
//                                                       //
///////////////////////////////////////////////////////////

import { apiClient } from './api-client';

export interface TradingPartyDto {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  // Backward-compatible optional aliases
  userId?: string;
  schoolName?: string | null;
  studentCode?: string | null;
}

export interface TradingItemDto {
  id: string;
  title: string;
  slug: string;
  itemCode: string;
  price: number;
  primaryImageUrl?: string | null;
  location: string;
  sellerId: string;
  sellerName: string;
  // Backward-compatible optional aliases
  itemId?: string;
  thumbnailUrl?: string | null;
  conditionName?: string;
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
  proofImageUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface TransactionDto {
  id: string;
  type: number; // 1 = Purchase, 2 = Exchange, 3 = Free
  typeName: string;
  status: number; // 1=Pending, 2=Accepted, 3=Rejected, 4=Cancelled, 5=Completed, 6=AwaitingConfirmation, 7=Delivering
  statusName: string;
  initiator: TradingPartyDto;
  counterparty: TradingPartyDto;
  item: TradingItemDto;
  offeredItem?: TradingItemDto | null;
  exchangeRequestId?: string | null;
  amount: number;
  quantity: number;
  meetingLocation: string;
  meetingLatitude?: number | null;
  meetingLongitude?: number | null;
  deliveryMethod: number; // 1 = DirectMeetup, 2 = ExternalShipper
  deliveryMethodName: string;
  deliveryCarrier?: string | null;
  trackingCode?: string | null;
  inspectionNote?: string | null;
  autoCompleteAt?: string | null;
  payment?: PaymentDto | null;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  canManage: boolean;
  hasUserConfirmed?: boolean;
  confirmedCount?: number;
}

export interface CreatePurchaseTransactionDto {
  itemCode: string;
  meetingLocation?: string;
  meetingLatitude?: number | null;
  meetingLongitude?: number | null;
  paymentMethod: number; // 1 = Cod, 2 = BankTransfer
  deliveryMethod?: 1 | 2;
  amount?: number;
  quantity?: number;
}

export interface AcceptTransactionDto {
  deliveryMethod?: 1 | 2;
  meetingLocation?: string;
  meetingLatitude?: number | null;
  meetingLongitude?: number | null;
  deliveryCarrier?: string;
  trackingCode?: string;
}

export interface StartDeliveryDto {
  meetingLocation?: string;
  meetingLatitude?: number | null;
  meetingLongitude?: number | null;
  deliveryCarrier?: string;
  trackingCode?: string;
}

export interface CreateExchangeTransactionDto {
  exchangeRequestId: string;
  meetingLocation?: string;
  meetingLatitude?: number | null;
  meetingLongitude?: number | null;
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

// VietQR Generator helper (Standard Napas 247 Dynamic QR)
export function getVietQrImageUrl(params: {
  bankId?: string;
  accountNo: string;
  accountName?: string;
  amount: number;
  memo: string;
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
  async createPurchase(dto: CreatePurchaseTransactionDto): Promise<TransactionDto> {
    const res = await apiClient.post<TransactionDto>('/Transactions/purchase', dto);
    return res.data;
  },

  async createPurchaseDirect(dto: CreatePurchaseTransactionDto): Promise<TransactionDto> {
    const res = await apiClient.post<TransactionDto>('/Transactions/purchase', dto);
    return res.data;
  },

  async createExchange(dto: CreateExchangeTransactionDto): Promise<TransactionDto> {
    const res = await apiClient.post<TransactionDto>('/Transactions/exchange', dto);
    return res.data;
  },

  async list(query?: TransactionQueryDto): Promise<TransactionListResponse | TransactionDto[]> {
    const params = new URLSearchParams();
    if (query?.status !== undefined) params.append('status', String(query.status));
    if (query?.type !== undefined) params.append('type', String(query.type));
    if (query?.direction) params.append('direction', query.direction);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));
    const qs = params.toString();
    const res = await apiClient.get<TransactionListResponse | TransactionDto[]>(
      `/Transactions${qs ? `?${qs}` : ''}`
    );
    return res.data;
  },

  async getById(id: string): Promise<TransactionDto> {
    const res = await apiClient.get<TransactionDto>(`/Transactions/${id}`);
    return res.data;
  },

  async accept(id: string, dto?: AcceptTransactionDto): Promise<TransactionDto> {
    const res = await apiClient.post<TransactionDto>(`/Transactions/${id}/accept`, dto ?? {});
    return res.data;
  },

  async startDelivery(id: string, dto?: StartDeliveryDto): Promise<TransactionDto> {
    const res = await apiClient.post<TransactionDto>(`/Transactions/${id}/deliver`, dto ?? {});
    return res.data;
  },

  async complete(id: string): Promise<TransactionDto> {
    const res = await apiClient.post<TransactionDto>(`/Transactions/${id}/complete`);
    return res.data;
  },

  async cancel(id: string, reason?: string): Promise<TransactionDto> {
    const res = await apiClient.post<TransactionDto>(`/Transactions/${id}/cancel`, { reason });
    return res.data;
  },

  async confirmPayment(
    id: string,
    payload?: { transactionRef?: string; proofImageUrl?: string }
  ): Promise<PaymentDto> {
    const res = await apiClient.post<PaymentDto>(`/Transactions/${id}/payment`, payload ?? {});
    return res.data;
  },

  async confirmHandover(id: string, dto: ConfirmHandoverDto): Promise<HandoverConfirmationDto> {
    const res = await apiClient.post<HandoverConfirmationDto>(`/Transactions/${id}/handover`, dto);
    return res.data;
  },

  async getHandoverStatus(id: string): Promise<HandoverConfirmationDto> {
    const res = await apiClient.get<HandoverConfirmationDto>(`/Transactions/${id}/handover`);
    return res.data;
  },
};
