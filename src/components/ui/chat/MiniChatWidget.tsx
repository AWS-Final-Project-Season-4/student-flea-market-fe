'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Loader2,
  MessageCircle,
  MessageSquare,
  Search,
} from 'lucide-react';
import { ChatConversationPane } from '@/components/ui/chat/ChatConversationPane';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { chatApi } from '@/lib/chat-api';
import { formatShortTime } from '@/lib/chat-formatters';
import { subscribeChatHub } from '@/lib/chat-hub';
import { useChatStore } from '@/lib/chat-store';
import { ConversationDto, MessageDto } from '@/types/chat';

type FilterMode = 'all' | 'unread';

export const MiniChatWidget: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { language } = useLanguageStore();
  const {
    totalUnread,
    isMiniChatOpen,
    miniChatConvId,
    closeMiniChat,
    openMiniChat,
    setTotalUnread,
  } = useChatStore();

  const isVi = language === 'vi';

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [prevWasOpen, setPrevWasOpen] = useState<boolean>(isMiniChatOpen);

  if (prevWasOpen !== isMiniChatOpen) {
    setPrevWasOpen(isMiniChatOpen);
    if (isMiniChatOpen) {
      setIsLoadingList(true);
    }
  }

  const refreshConversations = useCallback(async () => {
    try {
      const res = await chatApi.listConversations(1, 50);
      setConversations(res.items);
      setTotalUnread(res.totalUnread);
    } catch {
      // Preserve current state if background sync fails
    } finally {
      setIsLoadingList(false);
    }
  }, [setTotalUnread]);

  useEffect(() => {
    if (!isMiniChatOpen || !isAuthenticated) return;
    let active = true;

    void chatApi
      .listConversations(1, 50)
      .then((res) => {
        if (!active) return;
        setConversations(res.items);
        setTotalUnread(res.totalUnread);
      })
      .catch(() => {
        // Preserve current state if background sync fails
      })
      .finally(() => {
        if (active) setIsLoadingList(false);
      });

    return () => {
      active = false;
    };
  }, [isMiniChatOpen, isAuthenticated, setTotalUnread]);

  useEffect(() => {
    if (!isMiniChatOpen || !isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMiniChat();
    };
    window.addEventListener('keydown', handleKeyDown);

    const unsubscribe = subscribeChatHub({
      onReceiveMessage: (incoming: MessageDto) => {
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === incoming.conversationId);
          if (!exists) {
            void refreshConversations();
            return prev;
          }
          const updated = prev.map((c) => {
            if (c.id !== incoming.conversationId) return c;
            const isViewing = miniChatConvId === incoming.conversationId;
            const fromOther = incoming.senderId !== user?.id;
            return {
              ...c,
              lastMessage: incoming.content || c.lastMessage,
              lastMessageAt: incoming.sentAt,
              unreadCount: isViewing ? 0 : fromOther ? c.unreadCount + 1 : c.unreadCount,
            };
          });
          const target = updated.find((c) => c.id === incoming.conversationId);
          const others = updated.filter((c) => c.id !== incoming.conversationId);
          return target ? [target, ...others] : updated;
        });
      },
      onConversationUpdated: (evt) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === evt.id
              ? {
                  ...c,
                  lastMessage: evt.lastMessage ?? c.lastMessage,
                  lastMessageAt: evt.lastMessageAt ?? c.lastMessageAt,
                }
              : c
          )
        );
      },
      onNotifyUnreadCount: () => {
        void refreshConversations();
      },
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, [
    isMiniChatOpen,
    isAuthenticated,
    miniChatConvId,
    user?.id,
    closeMiniChat,
    refreshConversations,
  ]);

  if (!isMiniChatOpen || !isAuthenticated) return null;

  const activeConversation = conversations.find((c) => c.id === miniChatConvId) ?? null;

  const filteredConversations = conversations.filter((c) => {
    if (filterMode === 'unread' && c.unreadCount <= 0) return false;
    const q = searchFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      c.otherParty.fullName.toLowerCase().includes(q) ||
      (c.otherParty.username || '').toLowerCase().includes(q) ||
      c.item.title.toLowerCase().includes(q)
    );
  });

  const handleOpenInSfmChat = () => {
    closeMiniChat();
    router.push(miniChatConvId ? `/chat?c=${encodeURIComponent(miniChatConvId)}` : '/chat');
  };

  return (
    <div
      role="dialog"
      aria-label={isVi ? 'Khung chat nhanh SFM' : 'SFM Quick Chat'}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[min(94vw,670px)] h-[min(80dvh,510px)] rounded-2xl border border-[#EADBCE] dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_18px_50px_rgba(42,33,27,0.22)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Top Header Bar (Shopee Chat style) */}
      <div className="px-4 py-2.5 border-b border-[#EFE8DD] dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-extrabold text-[#C46A28] dark:text-[#F5A764]">
            Chat
          </span>
          {totalUnread > 0 && (
            <span className="text-xs font-bold text-[#A65A24] dark:text-[#F5A764] tabular-nums">
              ({totalUnread})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Open in full SFM Chat */}
          <button
            type="button"
            onClick={handleOpenInSfmChat}
            title={isVi ? 'Mở trong SFM Chat' : 'Open in SFM Chat'}
            aria-label={isVi ? 'Mở trong SFM Chat' : 'Open in SFM Chat'}
            className="px-2.5 py-1.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 hover:bg-[#F3EADF] dark:hover:bg-stone-700 text-[#A65A24] dark:text-[#F5A764] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isVi ? 'Mở trong SFM Chat' : 'SFM Chat'}
            </span>
          </button>

          {/* Close / Minimize Mini Chat */}
          <button
            type="button"
            onClick={closeMiniChat}
            title={isVi ? 'Thu gọn khung chat' : 'Minimize chat'}
            aria-label={isVi ? 'Đóng khung chat nhanh' : 'Close quick chat'}
            className="p-1.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 text-[#6D5D52] dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 hover:text-[#2A211B] dark:hover:text-stone-100 transition cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: 2-column split */}
      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-12 sm:grid-rows-[minmax(0,1fr)] overflow-hidden">
        {/* Left Pane: Conversation List */}
        <aside
          className={`sm:col-span-5 border-r border-[#EFE8DD] dark:border-stone-800 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-stone-900 ${
            activeConversation ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Search + Filter */}
          <div className="p-2.5 border-b border-[#EFE8DD] dark:border-stone-800 flex items-center gap-1.5 shrink-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-[#9B8E83] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                aria-label={isVi ? 'Tìm cuộc trò chuyện' : 'Search conversations'}
                placeholder={isVi ? 'Tìm tên...' : 'Search name'}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-1 focus:ring-[#F5A764]"
              />
            </div>

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              aria-label={isVi ? 'Lọc tin nhắn' : 'Filter messages'}
              className="py-1.5 px-2 rounded-lg border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 text-[11px] font-semibold text-[#5C5047] dark:text-stone-200 focus:outline-none cursor-pointer"
            >
              <option value="all">{isVi ? 'Tất cả' : 'All'}</option>
              <option value="unread">{isVi ? 'Chưa đọc' : 'Unread'}</option>
            </select>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#F7EFE6] dark:divide-stone-800/80">
            {isLoadingList ? (
              <div className="py-14 flex flex-col items-center justify-center gap-2 text-xs text-[#7A6D63] dark:text-stone-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#E89650]" />
                <span>{isVi ? 'Đang tải...' : 'Loading...'}</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-[#7A6D63] dark:text-stone-400">
                {filterMode === 'unread'
                  ? isVi
                    ? 'Không có tin nhắn chưa đọc.'
                    : 'No unread conversations.'
                  : isVi
                    ? 'Chưa có cuộc trò chuyện nào.'
                    : 'No conversations yet.'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === miniChatConvId;
                const initial = conv.otherParty.fullName?.charAt(0)?.toUpperCase() || 'U';
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => openMiniChat(conv.id)}
                    className={`w-full px-3 py-2.5 text-left transition flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF7F2] dark:bg-stone-800 border-l-3 border-l-[#C46A28] dark:border-l-[#F5A764]'
                        : 'hover:bg-[#FAF7F2]/70 dark:hover:bg-stone-800/50 border-l-3 border-l-transparent'
                    }`}
                  >
                    {conv.otherParty.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conv.otherParty.avatarUrl}
                        alt={conv.otherParty.fullName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#EADBCE] dark:border-stone-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E89650] to-[#F5A764] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-[#2A211B] dark:text-stone-100 truncate">
                          {conv.otherParty.fullName}
                        </span>
                        <span className="text-[10px] text-[#9B8E83] dark:text-stone-400 shrink-0 tabular-nums">
                          {formatShortTime(conv.lastMessageAt || conv.createdAt, isVi)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 mt-0.5">
                        <p className="text-[11px] text-[#7A6D63] dark:text-stone-400 truncate">
                          {conv.lastMessage || conv.item.title}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#C46A28] dark:bg-[#F5A764] text-white dark:text-stone-950 text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Welcome Screen or Active Thread */}
        <section
          className={`sm:col-span-7 flex flex-col min-h-0 overflow-hidden bg-[#FAF7F2]/40 dark:bg-stone-950/50 ${
            activeConversation ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-white dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 shadow-sm flex items-center justify-center text-[#C46A28] dark:text-[#F5A764]">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#2A211B] dark:text-stone-100">
                  {isVi ? 'Chào mừng đến với SFM Chat' : 'Welcome to SFM Chat'}
                </h3>
                <p className="text-xs text-[#6D5D52] dark:text-stone-400 max-w-[260px]">
                  {isVi
                    ? 'Chọn một cuộc trò chuyện bên trái để nhắn tin nhanh với người mua / người bán!'
                    : 'Select a conversation on the left to start chatting with buyers or sellers!'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenInSfmChat}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 hover:bg-[#FAF7F2] dark:hover:bg-stone-700 text-xs font-semibold text-[#A65A24] dark:text-[#F5A764] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isVi ? 'Mở trong SFM Chat' : 'Open in SFM Chat'}</span>
              </button>
            </div>
          ) : (
            <ChatConversationPane
              conversation={activeConversation}
              currentUserId={user?.id}
              isVi={isVi}
              compact
              onBack={() => openMiniChat(null)}
              onOpenFullChat={handleOpenInSfmChat}
              onConversationPreviewUpdate={(id, lastMessage, lastMessageAt) => {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === id
                      ? {
                          ...c,
                          lastMessage: lastMessage ?? c.lastMessage,
                          lastMessageAt: lastMessageAt ?? c.lastMessageAt,
                        }
                      : c
                  )
                );
              }}
              onConversationUnreadCleared={(id) => {
                setConversations((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
                );
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
};
