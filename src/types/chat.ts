///////////////////////////////////////////////////////////
//                                                       //
//                      CHAT TYPES                       //
//                                                       //
///////////////////////////////////////////////////////////

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  content?: string | null;
  isDeleted: boolean;
  isRead: boolean;
  sentAt: string;
  readAt?: string | null;
}

export interface ChatPartyDto {
  id: string;
  fullName: string;
  username?: string | null;
  avatarUrl?: string | null;
}

export interface ChatItemDto {
  id: string;
  title: string;
  itemCode: string;
  slug: string;
  price: number;
  primaryImageUrl?: string | null;
  status: number; // 1 = Available, 2 = Removed, 3 = Reserved, 4 = Sold
  statusName: string;
}

export interface ConversationDto {
  id: string;
  itemId: string;
  item: ChatItemDto;
  sellerId: string;
  buyerId: string;
  otherParty: ChatPartyDto;
  viewerIsBuyer: boolean;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  isItemUnavailable: boolean;
  createdAt: string;
}

export interface ConversationListDto {
  items: ConversationDto[];
  totalUnread: number;
}

export interface MessageListDto {
  items: MessageDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface MarkReadResultDto {
  conversationId: string;
  markedCount: number;
  totalUnread: number;
}

export interface MessageReadEvent {
  conversationId: string;
  byUserId: string;
  readAt: string;
}

export interface ConversationUpdatedEvent {
  id: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
}

export interface UnreadCountEvent {
  totalUnread: number;
}

export interface UserTypingEvent {
  conversationId: string;
  userId: string;
}

export interface ChatErrorEvent {
  conversationId?: string;
  code?: string;
  message?: string;
}
