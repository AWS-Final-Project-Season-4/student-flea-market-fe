///////////////////////////////////////////////////////////
//                                                       //
//                  SELLER API SERVICE                   //
//                                                       //
///////////////////////////////////////////////////////////

import axios from 'axios';
import { SellerRequestDto, SellerStatusDto, UserDto } from '@/types/auth';
import { apiClient } from './api-client';

export function extractSellerErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ERR_NETWORK') {
      return 'Unable to connect to backend server (verify http://localhost:5033).';
    }

    const data = err.response?.data as
      | {
          message?: string;
          Message?: string;
          errors?: Array<string | { message?: string }> | Record<string, string[]>;
        }
      | undefined;

    const serverErrors = data?.errors;
    if (Array.isArray(serverErrors) && serverErrors.length > 0) {
      const joined = serverErrors
        .map((item) => (typeof item === 'string' ? item : item?.message))
        .filter(Boolean)
        .join('. ');
      if (joined) return joined;
    } else if (serverErrors && typeof serverErrors === 'object') {
      const joined = Object.values(serverErrors).flat().filter(Boolean).join('. ');
      if (joined) return joined;
    }

    return data?.message || data?.Message || fallback;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

export function canUserSell(user: UserDto | null | undefined): boolean {
  if (!user) return false;
  return Boolean(
    user.canSell ||
      user.isAdmin ||
      user.isModerator ||
      user.isStaff ||
      user.role === 1 ||
      user.role === 3 ||
      user.roleName === 'Admin' ||
      user.roleName === 'Moderator' ||
      user.sellerStatus === 2
  );
}

export const sellerApi = {
  async getStatus(): Promise<SellerStatusDto> {
    try {
      const response = await apiClient.get<SellerStatusDto>('/Seller/status');
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractSellerErrorMessage(err, 'Unable to load seller status.'));
    }
  },

  async requestSeller(payload: SellerRequestDto): Promise<SellerStatusDto> {
    try {
      const response = await apiClient.post<SellerStatusDto>('/Seller/request', payload);
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractSellerErrorMessage(err, 'Unable to submit seller request.'));
    }
  },

  async cancelRequest(): Promise<SellerStatusDto> {
    try {
      const response = await apiClient.post<SellerStatusDto>('/Seller/request/cancel');
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractSellerErrorMessage(err, 'Unable to cancel seller request.'));
    }
  },
};
