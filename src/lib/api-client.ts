import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResultDto, RefreshTokenRequestDto } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5033/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Helper functions for auth storage (localStorage + cookies)
export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sfm_access_token');
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sfm_refresh_token');
};

export const setStoredAuth = (authData: AuthResultDto) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sfm_access_token', authData.accessToken);
  localStorage.setItem('sfm_refresh_token', authData.refreshToken);
  localStorage.setItem('sfm_user', JSON.stringify(authData.user));

  // Set cookie for Next.js Middleware or SSR reading
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  document.cookie = `sfm_access_token=${authData.accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `sfm_user_role=${authData.user.roleName}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sfm_access_token');
  localStorage.removeItem('sfm_refresh_token');
  localStorage.removeItem('sfm_user');

  document.cookie = 'sfm_access_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'sfm_user_role=; path=/; max-age=0; SameSite=Lax';
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Rotation (Refresh)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Ignore 401 on login or refresh endpoint itself
    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/Auth/login') &&
      !originalRequest.url?.includes('/Auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        clearStoredAuth();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const payload: RefreshTokenRequestDto = { refreshToken };
        const refreshResponse = await axios.post<AuthResultDto>(
          `${API_BASE_URL}/Auth/refresh`,
          payload
        );

        const newAuth = refreshResponse.data;
        setStoredAuth(newAuth);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAuth.accessToken}`;
        }

        processQueue(null, newAuth.accessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearStoredAuth();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

