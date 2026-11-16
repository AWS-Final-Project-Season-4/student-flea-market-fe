///////////////////////////////////////////////////////////
//                                                       //
//                   AUTH TYPES & DTOS                   //
//                                                       //
///////////////////////////////////////////////////////////

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
  roleName: 'User' | 'Admin' | 'AiService' | 'Moderator' | string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isStaff?: boolean;
  status: number;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string | null;
  sellerStatus?: number;
  sellerStatusName?: string;
  canSell?: boolean;
  banReason?: string | null;
  isBanned?: boolean;
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

export interface RegisterRequestDto {
  fullName: string;
  username: string; // Required
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  schoolName?: string; // Optional
  studentCode?: string; // Optional
}

export interface RegisterResultDto {
  message: string;
  user: UserDto;
  verificationEmail: string;
}

export interface VerifyEmailRequestDto {
  email: string;
  code: string;
}

export interface SendVerificationCodeRequestDto {
  email: string;
}

export interface ResendVerificationCodeRequestDto {
  email: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface VerifyResetCodeRequestDto {
  email: string;
  code: string;
}

export interface ResetPasswordRequestDto {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface GoogleLoginRequestDto {
  idToken: string;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  code?: string;
  errors?: Array<string | { field?: string; message?: string }>;
}

export interface UpdateProfileRequestDto {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  schoolName?: string;
  studentCode?: string;
  commonArea?: string;
  dormitory?: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SellerStatusDto {
  sellerStatus: number; // 0 = None, 1 = Pending, 2 = Approved, 3 = Rejected
  sellerStatusName: string;
  canSell: boolean;
  requestedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

export interface SellerRequestDto {
  note?: string;
}
