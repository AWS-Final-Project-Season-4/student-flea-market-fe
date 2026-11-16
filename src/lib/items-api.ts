///////////////////////////////////////////////////////////
//                                                       //
//                    ITEMS API SERVICE                  //
//                                                       //
///////////////////////////////////////////////////////////

import { apiClient } from './api-client';
import {
  CategoryDto,
  CreateItemRequestDto,
  ItemDetailDto,
  ItemSearchQuery,
  ItemSummaryDto,
  PagedResult,
} from '@/types/item';

export const itemsApi = {
  /**
   * Search and filter items. Public endpoint.
   */
  async searchItems(query?: ItemSearchQuery): Promise<PagedResult<ItemSummaryDto>> {
    const params = new URLSearchParams();

    if (query?.keyword?.trim()) params.append('keyword', query.keyword.trim());
    if (query?.categorySlug && query.categorySlug !== 'all') params.append('categorySlug', query.categorySlug);
    if (query?.minPrice !== undefined) params.append('minPrice', query.minPrice.toString());
    if (query?.maxPrice !== undefined) params.append('maxPrice', query.maxPrice.toString());
    if (query?.exchangeOnly) params.append('exchangeOnly', 'true');
    if (query?.location?.trim()) params.append('location', query.location.trim());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.pageSize) params.append('pageSize', query.pageSize.toString());

    if (query?.categoryIds && query.categoryIds.length > 0) {
      query.categoryIds.forEach((id) => params.append('categoryIds', id.toString()));
    }

    const response = await apiClient.get<PagedResult<ItemSummaryDto>>('/Items/search', {
      params,
    });
    return response.data;
  },

  /**
   * Get public active categories with listing counts.
   */
  async getCategories(): Promise<CategoryDto[]> {
    const response = await apiClient.get<CategoryDto[]>('/Items/categories');
    return response.data;
  },

  /**
   * Get item details by unique GUID id.
   */
  async getItemById(id: string): Promise<ItemDetailDto> {
    const response = await apiClient.get<ItemDetailDto>(`/Items/${id}`);
    return response.data;
  },

  /**
   * Get item details by 8-character Crockford Base32 ItemCode.
   */
  async getItemByCode(code: string): Promise<ItemDetailDto> {
    const response = await apiClient.get<ItemDetailDto>(`/Items/code/${encodeURIComponent(code)}`);
    return response.data;
  },

  /**
   * Post a new item for sale / exchange / giveaway.
   * Requires authenticated user with approved seller privileges.
   */
  async createItem(payload: CreateItemRequestDto): Promise<ItemDetailDto> {
    const response = await apiClient.post<ItemDetailDto>('/Items/sell', payload);
    return response.data;
  },

  /**
   * Delete an item (soft delete).
   */
  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/Items/sell/${id}`);
  },
};

