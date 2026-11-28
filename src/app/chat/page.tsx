///////////////////////////////////////////////////////////
//                                                       //
//                  REAL-TIME CHAT PAGE                  //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, MessageCircle, Search } from 'lucide-react';
import { Navbar } from '@/components/ui/layout/Navbar';
import { ChatConversationPane } from '@/components/ui/chat/ChatConversationPane';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { chatApi } from '@/lib/chat-api';
import { formatShortTime } from '@/lib/chat-formatters';
import { subscribeChatHub } from '@/lib/chat-hub';
import { useChatStore } from '@/lib/chat-store';
import { ConversationDto, MessageDto } from '@/types/chat';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryConvId = searchParams.get('c');
  const queryItemId = searchParams.get('itemId');

  const { user, isAuthenticated, isInitialized, initAuth } = useAuthStore();
  const { language } = useLanguageStore();
  const { setTotalUnread, closeMiniChat } = useChatStore();
  const isVi = language === 'vi';

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(queryConvId);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  const activeConvIdRef = useRef<string | null>(selectedConvId);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    activeConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    initAuth();
    closeMiniChat();
  }, [initAuth, closeMiniChat]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login?redirect=/chat');
    }
  }, [isInitialized, isAuthenticated, router]);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await chatApi.listConversations(1, 50);
      setConversations(res.items);
      setTotalUnread(res.totalUnread);
    } catch {
      // Preserve existing list on background refresh errors
    }
  }, [setTotalUnread]);

  // Initial conversations bootstrap (+ optional ?itemId=... creation)
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    let active = true;

    const initChatData = async () => {
      try {
        let targetConvId = queryConvId;
        if (queryItemId && !queryConvId) {
          const created = await chatApi.getOrCreateConversation(queryItemId);
          targetConvId = created.id;
        }

        const listRes = await chatApi.listConversations(1, 50);
        if (!active) return;

        setConversations(listRes.items);
        setTotalUnread(listRes.totalUnread);
        setListError(null);

        if (targetConvId) {
          setSelectedConvId(targetConvId);
        } else if (
          listRes.items.length > 0 &&
          typeof window !== 'undefined' &&
          window.innerWidth >= 768
        ) {
          setSelectedConvId(listRes.items[0].id);
        }
      } catch (err: unknown) {
        if (!active) return;
        setListError(
          err instanceof Error ? err.message : 'Unable to load chat conversations.'
        );
      } finally {
        if (active) setIsLoadingList(false);
      }
    };

    void initChatData();

    return () => {
      active = false;
    };
  }, [isInitialized, isAuthenticated, queryConvId, queryItemId, setTotalUnread]);

  // Keep left sidebar conversation previews & unread badges synced via SignalR
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

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
            const isViewingNow = activeConvIdRef.current === incoming.conversationId;
            const fromOther = incoming.senderId !== currentUserIdRef.current;
            return {
              ...c,
              lastMessage: incoming.content || c.lastMessage,
              lastMessageAt: incoming.sentAt,
              unreadCount: isViewingNow ? 0 : fromOther ? c.unreadCount + 1 : c.unreadCount,
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

      onReconnected: () => {
        void refreshConversations();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isInitialized, isAuthenticated, refreshConversations]);

  const handleSelectConversation = (convId: string) => {
    if (convId === selectedConvId) return;
    setSelectedConvId(convId);
    router.replace(`/chat?c=${encodeURIComponent(convId)}`, { scroll: false });
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#EADBCE] border-t-[#E89650] animate-spin" />
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find((c) => c.id === selectedConvId) || null;
  const filteredConversations = conversations.filter((c) => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      c.otherParty.fullName.toLowerCase().includes(q) ||
      (c.otherParty.username || '').toLowerCase().includes(q) ||
      c.item.title.toLowerCase().includes(q) ||
      c.item.itemCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 text-[#2A211B] dark:text-stone-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main
        id="main-content"
        className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col"
      >
        {/* Top Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6D63] dark:text-stone-400 hover:text-[#2A211B] dark:hover:text-stone-100 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isVi ? 'Trang chủ' : 'Marketplace'}</span>
            </Link>
            <span className="text-[#D8C5B4] dark:text-stone-700">/</span>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#2A211B] dark:text-stone-100 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#B8652B] dark:text-[#F5A764]" />
              <span>{isVi ? 'Tin nhắn' : 'Messages'}</span>
            </h1>
          </div>
        </div>

        {/* 2-PANE CHAT WORKSPACE */}
        <div className="h-[calc(100dvh-185px)] min-h-[540px] bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 md:grid-rows-[minmax(0,1fr)]">
          {/* LEFT PANE: CONVERSATIONS LIST */}
          <aside
            className={`md:col-span-4 border-r border-[#F0E4D7] dark:border-stone-800 flex flex-col min-h-0 overflow-hidden ${
              selectedConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Box */}
            <div className="p-3.5 border-b border-[#F0E4D7] dark:border-stone-800 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-[#9B8E83] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={
                    isVi ? 'Tìm tên người chat, món đồ, mã...' : 'Search user, item, code...'
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 text-xs text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764]"
                />
              </div>
            </div>

            {listError && (
              <div className="m-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{listError}</span>
              </div>
            )}

            {/* List */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#F7EFE6] dark:divide-stone-800/80">
              {isLoadingList ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-[#7A6D63] dark:text-stone-400">
                  <Loader2 className="w-5 h-5 animate-spin text-[#E89650]" />
                  <span>{isVi ? 'Đang tải hội thoại...' : 'Loading conversations...'}</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-16 px-6 text-center space-y-2">
                  <MessageCircle className="w-8 h-8 mx-auto text-[#D8C5B4] dark:text-stone-600" />
                  <p className="text-xs font-semibold text-[#5C5047] dark:text-stone-300">
                    {conversations.length === 0
                      ? isVi
                        ? 'Bạn chưa có cuộc trò chuyện nào'
                        : 'No conversations yet'
                      : isVi
                        ? 'Không tìm thấy cuộc trò chuyện phù hợp'
                        : 'No matching conversations'}
                  </p>
                  {conversations.length === 0 && (
                    <p className="text-[11px] text-[#7A6D63] dark:text-stone-400">
                      {isVi
                        ? 'Bấm "Liên hệ / Trao đổi" trên bất kỳ món đồ nào ở Trang chủ để bắt đầu nhắn tin với người bán.'
                        : 'Click "Contact / Exchange" on any listing to start chatting with the seller.'}
                    </p>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === selectedConvId;
                  const initial = conv.otherParty.fullName?.charAt(0)?.toUpperCase() || 'U';
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full p-3.5 text-left transition flex items-start gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-[#FAF7F2] dark:bg-stone-800 border-l-4 border-l-[#E89650]'
                          : 'hover:bg-[#FAF7F2]/60 dark:hover:bg-stone-800/50 border-l-4 border-l-transparent'
                      }`}
                    >
                      {conv.otherParty.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conv.otherParty.avatarUrl}
                          alt={conv.otherParty.fullName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-[#EADBCE] dark:border-stone-700"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E89650] to-[#F5A764] text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#2A211B] dark:text-stone-100 truncate">
                            {conv.otherParty.fullName}
                          </span>
                          <span className="text-[10px] text-[#9B8E83] dark:text-stone-400 shrink-0">
                            {formatShortTime(conv.lastMessageAt || conv.createdAt, isVi)}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-[#B8652B] dark:text-[#F5A764] truncate mt-0.5">
                          {conv.item.title}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-[11px] text-[#7A6D63] dark:text-stone-400 truncate">
                            {conv.lastMessage ||
                              (isVi ? 'Bắt đầu cuộc trò chuyện...' : 'Start chatting...')}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
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

          {/* RIGHT PANE: ACTIVE CHAT ROOM */}
          <section
            className={`md:col-span-8 flex flex-col min-h-0 overflow-hidden ${
              selectedConvId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {!activeConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 flex items-center justify-center text-[#B8652B] dark:text-[#F5A764]">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h2 className="text-base font-bold text-[#2A211B] dark:text-stone-100">
                  {isVi ? 'Chọn một cuộc trò chuyện' : 'Select a conversation'}
                </h2>
                <p className="text-xs text-[#7A6D63] dark:text-stone-400 max-w-xs">
                  {isVi
                    ? 'Nhắn tin trực tiếp với người mua hoặc người bán theo từng món đồ với cập nhật real-time.'
                    : 'Chat directly with buyers or sellers about specific listings with instant real-time updates.'}
                </p>
              </div>
            ) : (
              <ChatConversationPane
                conversation={activeConversation}
                currentUserId={user?.id}
                isVi={isVi}
                onBack={() => setSelectedConvId(null)}
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
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#EADBCE] border-t-[#E89650] animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
