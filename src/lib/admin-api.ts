///////////////////////////////////////////////////////////
//                                                       //
//                  ADMIN API SERVICE                    //
//                                                       //
///////////////////////////////////////////////////////////

import axios from 'axios';
import { apiClient } from './api-client';
import {
  AdminCategoryDto,
  AdminSellerRequestDto,
  AdminUserDto,
  CreateCategoryRequestDto,
  ModerationDashboardDto,
  ModerationReportDto,
  ModeratorDto,
  PagedResult,
  ResolveReportRequestDto,
  UpdateCategoryRequestDto,
} from '@/types/admin';

export function extractAdminErrorMessage(err: unknown, fallback: string): string {
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

export const adminApi = {
  // ===== Seller Requests =====
  async listSellerRequests(params?: {
    status?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<AdminSellerRequestDto>> {
    try {
      const response = await apiClient.get<PagedResult<AdminSellerRequestDto>>(
        '/Admin/seller-requests',
        { params }
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to load seller requests.'));
    }
  },

  async approveSellerRequest(userId: string): Promise<AdminSellerRequestDto> {
    try {
      const response = await apiClient.post<AdminSellerRequestDto>(
        `/Admin/seller-requests/${userId}/approve`
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to approve seller request.'));
    }
  },

  async rejectSellerRequest(userId: string, reason?: string): Promise<AdminSellerRequestDto> {
    try {
      const response = await apiClient.post<AdminSellerRequestDto>(
        `/Admin/seller-requests/${userId}/reject`,
        reason ? { reason } : {}
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to reject seller request.'));
    }
  },

  async revokeSellerAccess(userId: string): Promise<AdminSellerRequestDto> {
    try {
      const response = await apiClient.post<AdminSellerRequestDto>(
        `/Admin/seller-requests/${userId}/revoke`
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to revoke seller access.'));
    }
  },

  // ===== User Management =====
  async listUsers(params?: {
    status?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<AdminUserDto>> {
    try {
      const response = await apiClient.get<PagedResult<AdminUserDto>>('/Admin/users', {
        params,
      });
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to load users.'));
    }
  },

  async banUser(userId: string, reason: string): Promise<AdminUserDto> {
    try {
      const response = await apiClient.post<AdminUserDto>(`/Admin/users/${userId}/ban`, {
        reason,
      });
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to ban user.'));
    }
  },

  async unbanUser(userId: string): Promise<AdminUserDto> {
    try {
      const response = await apiClient.post<AdminUserDto>(`/Admin/users/${userId}/unban`);
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to unban user.'));
    }
  },

  // ===== Moderator Role Management (Admin-only) =====
  async listModerators(page = 1, pageSize = 20): Promise<PagedResult<ModeratorDto>> {
    try {
      const response = await apiClient.get<PagedResult<ModeratorDto>>('/Admin/moderators', {
        params: { page, pageSize },
      });
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to load moderators.'));
    }
  },

  async assignModerator(userId: string, note?: string): Promise<ModeratorDto> {
    try {
      const response = await apiClient.post<ModeratorDto>(
        `/Admin/moderators/${userId}`,
        note ? { note } : {}
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to assign moderator role.'));
    }
  },

  async revokeModerator(userId: string): Promise<ModeratorDto> {
    try {
      const response = await apiClient.delete<ModeratorDto>(`/Admin/moderators/${userId}`);
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to revoke moderator role.'));
    }
  },

  // ===== Moderation Dashboard & Reports =====
  async getDashboard(): Promise<ModerationDashboardDto> {
    try {
      const response = await apiClient.get<ModerationDashboardDto>(
        '/Admin/moderation/dashboard'
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to load moderation dashboard.'));
    }
  },

  async listReports(params?: {
    status?: number;
    reason?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<ModerationReportDto>> {
    try {
      const response = await apiClient.get<PagedResult<ModerationReportDto>>(
        '/Admin/moderation/reports',
        { params }
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to load reports.'));
    }
  },

  async markReportReviewing(id: string): Promise<ModerationReportDto> {
    try {
      const response = await apiClient.post<ModerationReportDto>(
        `/Admin/moderation/reports/${id}/reviewing`
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to update report status.'));
    }
  },

  async resolveReport(
    id: string,
    payload: ResolveReportRequestDto
  ): Promise<ModerationReportDto> {
    try {
      const response = await apiClient.post<ModerationReportDto>(
        `/Admin/moderation/reports/${id}/resolve`,
        payload
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to resolve report.'));
    }
  },

  // ===== Category Management =====
  async listCategories(): Promise<AdminCategoryDto[]> {
    try {
      const response = await apiClient.get<AdminCategoryDto[]>('/Admin/categories');
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to load categories.'));
    }
  },

  async createCategory(payload: CreateCategoryRequestDto): Promise<AdminCategoryDto> {
    try {
      const response = await apiClient.post<AdminCategoryDto>('/Admin/categories', payload);
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to create category.'));
    }
  },

  async updateCategory(id: number, payload: UpdateCategoryRequestDto): Promise<AdminCategoryDto> {
    try {
      const response = await apiClient.put<AdminCategoryDto>(`/Admin/categories/${id}`, payload);
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to update category.'));
    }
  },

  async toggleCategory(id: number, isActive: boolean): Promise<AdminCategoryDto> {
    try {
      const response = await apiClient.patch<AdminCategoryDto>(
        `/Admin/categories/${id}/status`,
        { isActive }
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to toggle category status.'));
    }
  },

  async deleteCategory(id: number): Promise<void> {
    try {
      await apiClient.delete(`/Admin/categories/${id}`);
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to delete category.'));
    }
  },

  async reorderCategories(categoryIds: number[]): Promise<AdminCategoryDto[]> {
    try {
      const response = await apiClient.put<AdminCategoryDto[]>('/Admin/categories/reorder', {
        categoryIds,
      });
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractAdminErrorMessage(err, 'Unable to reorder categories.'));
    }
  },
};
