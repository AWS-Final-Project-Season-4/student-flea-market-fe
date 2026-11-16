///////////////////////////////////////////////////////////
//                                                       //
//                  PROFILE API SERVICE                  //
//                                                       //
///////////////////////////////////////////////////////////

import axios from 'axios';
import {
  ChangePasswordRequestDto,
  UpdateProfileRequestDto,
  UserDto,
} from '@/types/auth';
import { apiClient } from './api-client';

interface ChangePasswordApiResponse {
  success?: boolean;
  message?: string;
  data?: {
    message?: string;
  };
}

export function extractProfileErrorMessage(err: unknown, fallback: string): string {
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

export const profileApi = {
  async getProfile(): Promise<UserDto> {
    try {
      const response = await apiClient.get<UserDto>('/Profile');
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractProfileErrorMessage(err, 'Unable to load profile information.'));
    }
  },

  async updateProfile(payload: UpdateProfileRequestDto): Promise<UserDto> {
    try {
      const response = await apiClient.put<UserDto>('/Profile', payload);
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractProfileErrorMessage(err, 'Unable to update profile information.'));
    }
  },

  async changePassword(payload: ChangePasswordRequestDto): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ChangePasswordApiResponse>(
        '/Profile/change-password',
        payload
      );
      return {
        message:
          response.data?.data?.message ||
          response.data?.message ||
          'Password changed successfully. Please log in again.',
      };
    } catch (err: unknown) {
      throw new Error(extractProfileErrorMessage(err, 'Unable to change password.'));
    }
  },
};
