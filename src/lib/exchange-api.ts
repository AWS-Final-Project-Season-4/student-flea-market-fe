///////////////////////////////////////////////////////////
//                                                       //
//               EXCHANGE REQUESTS API                   //
//                                                       //
///////////////////////////////////////////////////////////

import { apiClient } from './api-client';
import { TradingPartyDto, TradingItemDto } from './transactions-api';

export interface ExchangeRequestDto {
  id: string;
  status: number; // 1 = Pending, 2 = Accepted, 3 = Rejected, 4 = Cancelled
  statusName: string;
  sender: TradingPartyDto;
  receiver: TradingPartyDto;
  requestedItem: TradingItemDto;
  offeredItem: TradingItemDto;
  additionalAmount: number; // Tiền bù chênh lệch (nếu có)
  note?: string | null;
  responseNote?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  canRespond: boolean;
  canCancel: boolean;
}

export interface CreateExchangeRequestDto {
  requestedItemCode: string;
  offeredItemCode: string;
  additionalAmount?: number;
  note?: string;
}

export interface RespondExchangeRequestDto {
  note?: string;
}

export interface ExchangeRequestQueryDto {
  status?: number;
  direction?: 'incoming' | 'outgoing';
  page?: number;
  pageSize?: number;
}

export interface ExchangeRequestListResponse {
  items: ExchangeRequestDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const exchangeApi = {
  create: (dto: CreateExchangeRequestDto) =>
    apiClient.post<ExchangeRequestDto>('/api/ExchangeRequests', dto),

  list: (query?: ExchangeRequestQueryDto) => {
    const params = new URLSearchParams();
    if (query?.status !== undefined) params.append('status', String(query.status));
    if (query?.direction) params.append('direction', query.direction);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));
    const qs = params.toString();
    return apiClient.get<ExchangeRequestListResponse | ExchangeRequestDto[]>(
      `/api/ExchangeRequests${qs ? `?${qs}` : ''}`
    );
  },

  getById: (id: string) =>
    apiClient.get<ExchangeRequestDto>(`/api/ExchangeRequests/${id}`),

  accept: (id: string, note?: string) =>
    apiClient.post<ExchangeRequestDto>(`/api/ExchangeRequests/${id}/accept`, { note }),

  reject: (id: string, note?: string) =>
    apiClient.post<ExchangeRequestDto>(`/api/ExchangeRequests/${id}/reject`, { note }),

  cancel: (id: string) =>
    apiClient.post<ExchangeRequestDto>(`/api/ExchangeRequests/${id}/cancel`),
};
