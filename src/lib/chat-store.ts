///////////////////////////////////////////////////////////
//                                                       //
//                  CHAT STORE (ZUSTAND)                 //
//                                                       //
///////////////////////////////////////////////////////////

import { create } from 'zustand';
import { chatApi } from './chat-api';

export type HubConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface ChatState {
  totalUnread: number;
  hubStatus: HubConnectionStatus;
  setTotalUnread: (count: number) => void;
  setHubStatus: (status: HubConnectionStatus) => void;
  refreshUnreadCount: () => Promise<void>;
  resetChatState: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  totalUnread: 0,
  hubStatus: 'disconnected',

  setTotalUnread: (count: number) => set({ totalUnread: Math.max(0, count) }),

  setHubStatus: (status: HubConnectionStatus) => set({ hubStatus: status }),

  refreshUnreadCount: async () => {
    const count = await chatApi.getUnreadCount();
    set({ totalUnread: Math.max(0, count) });
  },

  resetChatState: () => set({ totalUnread: 0, hubStatus: 'disconnected' }),
}));
