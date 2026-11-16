///////////////////////////////////////////////////////////
//                                                       //
//                   CHAT API SERVICE                    //
//                                                       //
///////////////////////////////////////////////////////////

import axios from 'axios';
import { apiClient } from './api-client';
import {
  ConversationDto,
  ConversationListDto,
  MarkReadResultDto,
  MessageDto,
  MessageListDto,
} from '@/types/chat';

export function extractChatErrorMessage(err: unknown, fallback: string): string {
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

export const chatApi = {
  async getOrCreateConversation(itemId: string): Promise<ConversationDto> {
    try {
      const response = await apiClient.post<ConversationDto>('/Chat/conversations', {
        itemId,
      });
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractChatErrorMessage(err, 'Unable to open chat conversation.'));
    }
  },

  async listConversations(page = 1, pageSize = 30): Promise<ConversationListDto> {
    try {
      const response = await apiClient.get<ConversationListDto>('/Chat/conversations', {
        params: { page, pageSize },
      });
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractChatErrorMessage(err, 'Unable to load conversations.'));
    }
  },

  async getConversation(conversationId: string): Promise<ConversationDto> {
    try {
      const response = await apiClient.get<ConversationDto>(
        `/Chat/conversations/${conversationId}`
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractChatErrorMessage(err, 'Unable to load conversation details.'));
    }
  },

  async listMessages(
    conversationId: string,
    page = 1,
    pageSize = 50
  ): Promise<MessageListDto> {
    try {
      const response = await apiClient.get<MessageListDto>(
        `/Chat/conversations/${conversationId}/messages`,
        { params: { page, pageSize } }
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractChatErrorMessage(err, 'Unable to load chat messages.'));
    }
  },

  async sendMessageRest(conversationId: string, content: string): Promise<MessageDto> {
    try {
      const response = await apiClient.post<MessageDto>(
        `/Chat/conversations/${conversationId}/messages`,
        { content }
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractChatErrorMessage(err, 'Unable to send message.'));
    }
  },

  async markAsRead(conversationId: string): Promise<MarkReadResultDto> {
    try {
      const response = await apiClient.post<MarkReadResultDto>(
        `/Chat/conversations/${conversationId}/read`
      );
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractChatErrorMessage(err, 'Unable to mark conversation as read.'));
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ totalUnread?: number }>('/Chat/unread-count');
      return response.data?.totalUnread ?? 0;
    } catch {
      return 0;
    }
  },
};
