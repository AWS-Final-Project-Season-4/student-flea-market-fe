import { apiClient } from './api-client';
import { ItemSummaryDto, PagedResult } from '@/types/item';

export interface FavoriteActionDto {
  itemId: string;
  isFavorited: boolean;
  favoriteCount: number;
}

export const favoritesApi = {
  async toggle(itemId: string): Promise<FavoriteActionDto> {
    const res = await apiClient.post<FavoriteActionDto>(`/Favorites/${itemId}/toggle`);
    return res.data;
  },

  async list(page = 1, pageSize = 50): Promise<PagedResult<ItemSummaryDto>> {
    const res = await apiClient.get<PagedResult<ItemSummaryDto>>(
      `/Favorites?page=${page}&pageSize=${pageSize}`
    );
    return res.data;
  },
};
