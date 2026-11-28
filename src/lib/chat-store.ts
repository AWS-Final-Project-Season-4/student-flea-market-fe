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
  isMiniChatOpen: boolean;
  miniChatConvId: string | null;
  setTotalUnread: (count: number) => void;
  setHubStatus: (status: HubConnectionStatus) => void;
  openMiniChat: (convId?: string | null) => void;
  closeMiniChat: () => void;
  toggleMiniChat: () => void;
  refreshUnreadCount: () => Promise<void>;
  resetChatState: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  totalUnread: 0,
  hubStatus: 'disconnected',
  isMiniChatOpen: false,
  miniChatConvId: null,

  setTotalUnread: (count: number) => set({ totalUnread: Math.max(0, count) }),

  setHubStatus: (status: HubConnectionStatus) => set({ hubStatus: status }),

  openMiniChat: (convId?: string | null) =>
    set((state) => ({
      isMiniChatOpen: true,
      miniChatConvId: convId !== undefined ? convId : state.miniChatConvId,
    })),

  closeMiniChat: () => set({ isMiniChatOpen: false }),

  toggleMiniChat: () => set((state) => ({ isMiniChatOpen: !state.isMiniChatOpen })),

  refreshUnreadCount: async () => {
    const count = await chatApi.getUnreadCount();
    set({ totalUnread: Math.max(0, count) });
  },

  resetChatState: () =>
    set({
      totalUnread: 0,
      hubStatus: 'disconnected',
      isMiniChatOpen: false,
      miniChatConvId: null,
    }),
}));
