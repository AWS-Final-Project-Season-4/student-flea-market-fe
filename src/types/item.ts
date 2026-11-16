///////////////////////////////////////////////////////////
//                                                       //
//                   ITEM TYPES & DTOS                   //
//                                                       //
///////////////////////////////////////////////////////////

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  order: number;
  itemCount: number;
}

export interface ItemSummaryDto {
  id: string;
  title: string;
  slug: string;
  itemCode: string;
  price: number;
  condition: number;
  conditionName: string;
  isExchangeEnabled: boolean;
  location: string;
  status: number;
  statusName: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  sellerId: string;
  sellerName: string;
  primaryImageUrl?: string | null;
  favoriteCount: number;
  isFavorited: boolean;
  createdAt: string;
}

export interface ItemDetailDto {
  id: string;
  title: string;
  slug: string;
  itemCode: string;
  description?: string | null;
  price: number;
  condition: number;
  conditionName: string;
  isExchangeEnabled: boolean;
  location: string;
  status: number;
  statusName: string;
  category: CategoryDto;
  seller: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    schoolName?: string | null;
    studentCode?: string | null;
    memberSince: string;
  };
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    order: number;
  }>;
  favoriteCount: number;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequestDto {
  title: string;
  categoryId: number;
  description?: string | null;
  price: number;
  condition: number; // 1: New, 2: LikeNew, 3: Good, 4: Fair, 5: Poor
  isExchangeEnabled: boolean;
  location: string;
  imageUrls?: string[];
}

export interface ItemSearchQuery {
  keyword?: string;
  categoryIds?: number[];
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  conditions?: number[];
  statuses?: number[];
  exchangeOnly?: boolean;
  location?: string;
  sellerId?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'most_favorited';
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

