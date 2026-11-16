///////////////////////////////////////////////////////////
//                                                       //
//                 AUTH STORE (ZUSTAND)                  //
//                                                       //
///////////////////////////////////////////////////////////

import { create } from 'zustand';
import axios from 'axios';
import {
  UserDto,
  AuthResultDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  RegisterResultDto,
  ResetPasswordRequestDto,
} from '@/types/auth';
import { apiClient, setStoredAuth, clearStoredAuth, getStoredAccessToken, getStoredRefreshToken } from './api-client';
import { stopChatHub } from './chat-hub';

let syncProfileInFlight: Promise<UserDto | null> | null = null;

function extractAuthErrorMessage(err: unknown, fallback: string): string {
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

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  initAuth: () => void;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<AuthResultDto>;
  loginWithGoogle: (idToken: string) => Promise<AuthResultDto>;
  register: (payload: RegisterRequestDto) => Promise<RegisterResultDto>;
  verifyEmail: (email: string, code: string) => Promise<{ message: string }>;
  resendVerificationCode: (email: string) => Promise<{ message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  verifyResetCode: (email: string, code: string) => Promise<{ message: string }>;
  resetPassword: (payload: ResetPasswordRequestDto) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  clearSession: () => void;
  setUser: (user: UserDto) => void;
  syncProfile: () => Promise<UserDto | null>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  initAuth: () => {
    if (typeof window === 'undefined') return;

    try {
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();
      const storedUser = localStorage.getItem('sfm_user');

      if (accessToken && storedUser) {
        const user: UserDto = JSON.parse(storedUser);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isInitialized: true,
        });
        return;
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
      clearStoredAuth();
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },

  login: async (identifier, password, rememberMe = true) => {
    set({ isLoading: true, error: null });

    try {
      const payload: LoginRequestDto = {
        identifier,
        password,
        rememberMe,
      };

      const response = await apiClient.post<AuthResultDto>('/Auth/login', payload);
      const authData = response.data;

      // Persist auth data in storage and cookies
      setStoredAuth(authData);

      set({
        user: authData.user,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return authData;
    } catch (err: unknown) {
      const errorMessage = extractAuthErrorMessage(
        err,
        'Authentication failed. Please check your credentials.'
      );

      set({
        isLoading: false,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post<AuthResultDto>('/Auth/google', { idToken });
      const authData = response.data;

      setStoredAuth(authData);

      set({
        user: authData.user,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return authData;
    } catch (err: unknown) {
      const errorMessage = extractAuthErrorMessage(
        err,
        'Google authentication failed. Please try again.'
      );

      set({
        isLoading: false,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },

  register: async (payload: RegisterRequestDto) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post<RegisterResultDto>('/Auth/register', payload);
      set({ isLoading: false, error: null });
      return response.data;
    } catch (err: unknown) {
      const errorMessage = extractAuthErrorMessage(
        err,
        'Registration failed. Please check your information and try again.'
      );

      set({
        isLoading: false,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },

  verifyEmail: async (email: string, code: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post<{ message?: string; data?: { message?: string } }>(
        '/Auth/verify-email',
        { email, code }
      );
      set({ isLoading: false, error: null });
      return {
        message: response.data?.message || response.data?.data?.message || 'Email verified successfully.',
      };
    } catch (err: unknown) {
      const errorMessage = extractAuthErrorMessage(
        err,
        'Verification failed. Please check your 6-digit code.'
      );

      set({
        isLoading: false,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },

  resendVerificationCode: async (email: string) => {
    try {
      const response = await apiClient.post<{ message?: string; data?: { message?: string } }>(
        '/Auth/resend-verification-code',
        { email }
      );
      return {
        message: response.data?.message || response.data?.data?.message || 'Verification code sent.',
      };
    } catch (err: unknown) {
      throw new Error(extractAuthErrorMessage(err, 'Failed to resend verification code.'));
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post<{ message?: string; data?: { message?: string } }>(
        '/Auth/forgot-password',
        { email }
      );
      set({ isLoading: false, error: null });
      return {
        message:
          response.data?.message ||
          response.data?.data?.message ||
          'If the email is registered, a 6-digit password reset code has been sent.',
      };
    } catch (err: unknown) {
      const errorMessage = extractAuthErrorMessage(
        err,
        'Unable to send password reset code. Please try again.'
      );
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  verifyResetCode: async (email: string, code: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post<{ message?: string; data?: { message?: string } }>(
        '/Auth/verify-reset-code',
        { email, code }
      );
      set({ isLoading: false, error: null });
      return {
        message: response.data?.message || response.data?.data?.message || 'Verification code is valid.',
      };
    } catch (err: unknown) {
      const errorMessage = extractAuthErrorMessage(
        err,
        'Invalid or expired verification code.'
      );
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  resetPassword: async (payload: ResetPasswordRequestDto) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post<{ message?: string; data?: { message?: string } }>(
        '/Auth/reset-password',
        payload
      );
      set({ isLoading: false, error: null });
      return {
        message:
          response.data?.message ||
          response.data?.data?.message ||
          'Password has been reset successfully.',
      };
    } catch (err: unknown) {
      const errorMessage = extractAuthErrorMessage(
        err,
        'Failed to reset password. Please check your OTP and try again.'
      );
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    const refreshToken = get().refreshToken || getStoredRefreshToken();

    try {
      if (refreshToken) {
        const payload: RefreshTokenRequestDto = { refreshToken };
        await apiClient.post('/Auth/logout', payload);
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      clearStoredAuth();
      void stopChatHub();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearSession: () => {
    clearStoredAuth();
    void stopChatHub();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  setUser: (user: UserDto) => {
    set({ user });
    if (typeof window !== 'undefined') {
      localStorage.setItem('sfm_user', JSON.stringify(user));
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `sfm_user_role=${user.roleName}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  },

  syncProfile: async () => {
    if (typeof window === 'undefined') return null;
    const token = get().accessToken || getStoredAccessToken();
    if (!token) return null;

    if (syncProfileInFlight) {
      return syncProfileInFlight;
    }

    syncProfileInFlight = apiClient
      .get<UserDto>('/Profile')
      .then((response) => {
        const profile = response.data;
        get().setUser(profile);
        return profile;
      })
      .catch(() => {
        // Silent fallback in background sync so existing cached user session stays intact
        return null;
      })
      .finally(() => {
        syncProfileInFlight = null;
      });

    return syncProfileInFlight;
  },

  clearError: () => set({ error: null }),
}));
