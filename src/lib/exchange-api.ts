///////////////////////////////////////////////////////////
//                                                       //
//               EXCHANGE REQUESTS API                   //
//                                                       //
///////////////////////////////////////////////////////////

import { apiClient } from './api-client';
import { TradingPartyDto, TradingItemDto } from './transactions-api';

export interface ExchangeRequestDto {
  id: string;
  status: number; // 1 = Pending, 2 = Accepted, 3 = Rejected, 4 = Cancelled, 5 = Expired
  statusName: string;
  requesterId: string;
  requesterName: string;
  sender?: TradingPartyDto;
  receiver?: TradingPartyDto;
  requestedItem: TradingItemDto;
  offeredItem: TradingItemDto;
  additionalAmount: number;
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
  async create(dto: CreateExchangeRequestDto): Promise<ExchangeRequestDto> {
    const res = await apiClient.post<ExchangeRequestDto>('/ExchangeRequests', dto);
    return res.data;
  },

  async list(query?: ExchangeRequestQueryDto): Promise<ExchangeRequestListResponse | ExchangeRequestDto[]> {
    const params = new URLSearchParams();
    if (query?.status !== undefined) params.append('status', String(query.status));
    if (query?.direction) params.append('direction', query.direction);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));
    const qs = params.toString();
    const res = await apiClient.get<ExchangeRequestListResponse | ExchangeRequestDto[]>(
      `/ExchangeRequests${qs ? `?${qs}` : ''}`
    );
    return res.data;
  },

  async getById(id: string): Promise<ExchangeRequestDto> {
    const res = await apiClient.get<ExchangeRequestDto>(`/ExchangeRequests/${id}`);
    return res.data;
  },

  async accept(id: string, note?: string): Promise<ExchangeRequestDto> {
    const res = await apiClient.post<ExchangeRequestDto>(`/ExchangeRequests/${id}/accept`, { note });
    return res.data;
  },

  async reject(id: string, note?: string): Promise<ExchangeRequestDto> {
    const res = await apiClient.post<ExchangeRequestDto>(`/ExchangeRequests/${id}/reject`, { note });
    return res.data;
  },

  async cancel(id: string): Promise<ExchangeRequestDto> {
    const res = await apiClient.post<ExchangeRequestDto>(`/ExchangeRequests/${id}/cancel`);
    return res.data;
  },
};
