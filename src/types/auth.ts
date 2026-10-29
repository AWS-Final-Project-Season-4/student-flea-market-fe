export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  username?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  schoolName?: string | null;
  studentCode?: string | null;
  commonArea?: string | null;
  dormitory?: string | null;
  role: number;
  roleName: 'User' | 'Admin' | 'AiService' | string;
  status: number;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AuthResultDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: UserDto;
}

export interface LoginRequestDto {
  identifier: string; // Accepts email or username
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  code?: string;
  errors?: string[];
}

