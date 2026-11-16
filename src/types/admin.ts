///////////////////////////////////////////////////////////
//                                                       //
//                  ADMIN & MODERATION TYPES             //
//                                                       //
///////////////////////////////////////////////////////////

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface AdminSellerRequestDto {
  userId: string;
  fullName: string;
  email: string;
  username?: string | null;
  schoolName?: string | null;
  studentCode?: string | null;
  phoneNumber?: string | null;
  sellerStatus: number; // 0 = None, 1 = Pending, 2 = Approved, 3 = Rejected
  sellerStatusName: string;
  requestedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  itemCount: number;
}

export interface AdminUserDto {
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
  status: number; // 1 = Active, 2 = Inactive, 3 = Banned
  statusName: string;
  isBanned: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
  unbannedAt?: string | null;
  sellerStatus: number;
  sellerStatusName: string;
  canSell: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string | null;
  itemCount: number;
  role: number; // 0 = User, 1 = Admin, 2 = AiService, 3 = Moderator
  roleName: string;
  isAdmin: boolean;
  isModerator: boolean;
  isStaff: boolean;
}

export interface ModeratorDto {
  userId: string;
  fullName: string;
  email: string;
  username?: string | null;
  grantedAt?: string | null;
  grantedByUserId?: string | null;
  grantedByFullName?: string | null;
}

export interface ModerationDashboardDto {
  pendingReportCount: number;
  reviewingReportCount: number;
  resolvedReportCount: number;
  rejectedReportCount: number;
  hiddenItemCount: number;
  bannedUserCount: number;
  activeCategoryCount: number;
  totalCategoryCount: number;
  voidedReviewCount: number;
}

export interface ModerationReportDto {
  id: string;
  reason: number;
  reasonName: string;
  status: number; // 1 = Pending, 2 = Reviewing, 3 = Resolved, 4 = Rejected
  statusName: string;
  description: string;
  reporterId: string;
  reporterName: string;
  reportedUserId?: string | null;
  reportedUserName?: string | null;
  itemId?: string | null;
  itemTitle?: string | null;
  itemCode?: string | null;
  transactionId?: string | null;
  conversationId?: string | null;
  transactionCompleted?: boolean | null;
  adminNote?: string | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface ResolveReportRequestDto {
  actions: string[];
  adminNote?: string;
}

export interface AdminCategoryDto {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  itemCount: number;
  hiddenItemCount: number;
}

export interface CreateCategoryRequestDto {
  name: string;
  description?: string;
  order?: number;
  isActive: boolean;
}

export interface UpdateCategoryRequestDto {
  name?: string;
  description?: string;
  order?: number;
}

export const STANDARD_BAN_REASONS: Array<{ label: string; value: string }> = [
  {
    label: 'Fraud / Deposit Scam',
    value:
      'Engaging in fraud, deception or the misapprociation of deposit money belonging to other students',
  },
  {
    label: 'Counterfeit / False Product Info',
    value: 'Listing counterfeit or imitation goods, or providing false product information.',
  },
  {
    label: 'Prohibited / Restricted Goods',
    value:
      'Trading in restricted goods (weapons, prohibited substances, wildlife, non-prescription pharmaceuticals, etc.).',
  },
  {
    label: 'Harassment / Abusive Behavior',
    value: 'Engaging in behavior that harasses, threatens, offends or insults other users.',
  },
  {
    label: 'Spam / Junk Posts',
    value: 'Constant spamming of junk posts',
  },
  {
    label: 'Impersonation / Fake Identity',
    value: 'Forging student ID cards, impersonating students from other universities.',
  },
  {
    label: 'Serious Policy Violation',
    value: "Serious violation of the platform's operational regulations and terms of service.",
  },
];
