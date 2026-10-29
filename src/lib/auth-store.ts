import { create } from 'zustand';
import { UserDto, AuthResultDto, LoginRequestDto, RefreshTokenRequestDto } from '@/types/auth';
import { apiClient, setStoredAuth, clearStoredAuth, getStoredAccessToken, getStoredRefreshToken } from './api-client';

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
  logout: () => Promise<void>;
  setUser: (user: UserDto) => void;
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
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.Message ||
        (err.code === 'ERR_NETWORK'
          ? 'Unable to connect to backend server (verify http://localhost:5033).'
          : 'Authentication failed. Please check your credentials.');

      set({
        isLoading: false,
        error: errorMessage,
      });

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

  setUser: (user: UserDto) => {
    set({ user });
    if (typeof window !== 'undefined') {
      localStorage.setItem('sfm_user', JSON.stringify(user));
    }
  },

  clearError: () => set({ error: null }),
}));

