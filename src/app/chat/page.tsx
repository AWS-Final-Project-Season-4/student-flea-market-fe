///////////////////////////////////////////////////////////
//                                                       //
//                  REAL-TIME CHAT PAGE                  //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  MessageCircle,
  Package,
  Search,
  Send,
} from 'lucide-react';
import { Navbar } from '@/components/ui/layout/Navbar';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { chatApi } from '@/lib/chat-api';
import { useChatStore } from '@/lib/chat-store';
import {
  isChatHubConnected,
  joinConversationHub,
  leaveConversationHub,
  markAsReadViaHub,
  sendMessageViaHub,
  sendTypingViaHub,
  startChatHub,
  subscribeChatHub,
} from '@/lib/chat-hub';
import { formatItemCodeDisplay } from '@/data/mock-items';
import { ConversationDto, MessageDto } from '@/types/chat';

function formatShortTime(iso?: string | null, isVi = true): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    return d.toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatMessageTime(iso: string, isVi = true): string {
  return new Date(iso).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function translateItemStatus(status: number, fallback: string, isVi: boolean): string {
  if (isVi) {
    switch (status) {
      case 1:
        return 'Đang bán';
      case 2:
        return 'Đã gỡ';
      case 3:
        return 'Đã đặt';
      case 4:
        return 'Đã bán';
      default:
        return fallback;
    }
  }
  switch (status) {
    case 1:
      return 'Available';
    case 2:
      return 'Removed';
    case 3:
      return 'Reserved';
    case 4:
      return 'Sold';
    default:
      return fallback;
  }
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryConvId = searchParams.get('c');
  const queryItemId = searchParams.get('itemId');

  const { user, isAuthenticated, isInitialized, initAuth } = useAuthStore();
  const { language } = useLanguageStore();
  const { setTotalUnread } = useChatStore();
  const isVi = language === 'vi';

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(queryConvId);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [msgPage, setMsgPage] = useState<number>(1);
  const [hasOlderMessages, setHasOlderMessages] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);

  const [draftText, setDraftText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);

  const activeConvIdRef = useRef<string | null>(selectedConvId);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login?redirect=/chat');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  }, []);

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
        setListError(err instanceof Error ? err.message : 'Unable to load chat conversations.');
      } finally {
        if (active) setIsLoadingList(false);
      }
    };

    void initChatData();

    return () => {
      active = false;
    };
  }, [isInitialized, isAuthenticated, queryConvId, queryItemId, setTotalUnread]);

  // Load messages + join SignalR group whenever active conversation changes
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !selectedConvId) return;
    let active = true;
    const convId = selectedConvId;

    void startChatHub().then(() => {
      if (active) {
        void joinConversationHub(convId);
      }
    });

    chatApi
      .listMessages(convId, 1, 50)
      .then((res) => {
        if (!active) return;
        // Backend returns newest first -> reverse to chronological order
        const ordered = [...res.items].reverse();
        setMessages(ordered);
        setMsgPage(1);
        setHasOlderMessages(res.hasNext);
        setChatError(null);
        setIsOtherTyping(false);
        scrollToBottom();

        // Mark conversation read
        if (isChatHubConnected()) {
          void markAsReadViaHub(convId);
        } else {
          void chatApi.markAsRead(convId).then((r) => {
            if (active) setTotalUnread(r.totalUnread);
          });
        }
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch((err: unknown) => {
        if (!active) return;
        setChatError(err instanceof Error ? err.message : 'Unable to load messages.');
      })
      .finally(() => {
        if (active) setIsLoadingMessages(false);
      });

    return () => {
      active = false;
      void leaveConversationHub(convId);
    };
  }, [isInitialized, isAuthenticated, selectedConvId, scrollToBottom, setTotalUnread]);

  // Subscribe to SignalR realtime events
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
          // Move updated conversation to top
          const target = updated.find((c) => c.id === incoming.conversationId);
          const others = updated.filter((c) => c.id !== incoming.conversationId);
          return target ? [target, ...others] : updated;
        });

        if (incoming.conversationId === activeConvIdRef.current) {
          setIsOtherTyping(false);
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          scrollToBottom();

          if (incoming.senderId !== currentUserIdRef.current) {
            if (isChatHubConnected()) {
              void markAsReadViaHub(incoming.conversationId);
            } else {
              void chatApi.markAsRead(incoming.conversationId);
            }
          }
        }
      },

      onMessageRead: (evt) => {
        if (
          evt.conversationId === activeConvIdRef.current &&
          evt.byUserId !== currentUserIdRef.current
        ) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === currentUserIdRef.current && !m.isRead
                ? { ...m, isRead: true, readAt: evt.readAt }
                : m
            )
          );
        }
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
        // Keep left sidebar previews synced if a message arrived in another conversation
        void refreshConversations();
      },

      onUserTyping: (evt) => {
        if (
          evt.conversationId === activeConvIdRef.current &&
          evt.userId !== currentUserIdRef.current
        ) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 3000);
        }
      },

      onChatError: (evt) => {
        if (evt.message) setChatError(evt.message);
      },

      onReconnected: () => {
        void refreshConversations();
        const activeId = activeConvIdRef.current;
        if (activeId) {
          void joinConversationHub(activeId);
          void chatApi.listMessages(activeId, 1, 50).then((res) => {
            setMessages([...res.items].reverse());
          });
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isInitialized, isAuthenticated, refreshConversations, scrollToBottom]);

  const handleSelectConversation = (convId: string) => {
    if (convId === selectedConvId) return;
    setIsLoadingMessages(true);
    setChatError(null);
    setSelectedConvId(convId);
    router.replace(`/chat?c=${encodeURIComponent(convId)}`, { scroll: false });
  };

  const handleLoadOlderMessages = async () => {
    if (!selectedConvId || isLoadingOlder || !hasOlderMessages) return;
    setIsLoadingOlder(true);
    try {
      const nextPage = msgPage + 1;
      const res = await chatApi.listMessages(selectedConvId, nextPage, 50);
      const olderOrdered = [...res.items].reverse();
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueOlder = olderOrdered.filter((m) => !existingIds.has(m.id));
        return [...uniqueOlder, ...prev];
      });
      setMsgPage(nextPage);
      setHasOlderMessages(res.hasNext);
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : 'Unable to load older messages.');
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleDraftChange = (val: string) => {
    setDraftText(val);
    if (!selectedConvId || !val.trim()) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      void sendTypingViaHub(selectedConvId);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const convId = selectedConvId;
    const text = draftText.trim();
    if (!convId || !text || isSending) return;

    setChatError(null);
    setIsSending(true);
    setDraftText('');

    try {
      if (isChatHubConnected()) {
        await sendMessageViaHub(convId, text);
      } else {
        const createdMsg = await chatApi.sendMessageRest(convId, text);
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMsg.id)) return prev;
          return [...prev, createdMsg];
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, lastMessage: createdMsg.content, lastMessageAt: createdMsg.sentAt }
              : c
          )
        );
        scrollToBottom();
      }
    } catch (err: unknown) {
      // Fallback to REST if SignalR failed mid-send
      try {
        const createdMsg = await chatApi.sendMessageRest(convId, text);
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMsg.id)) return prev;
          return [...prev, createdMsg];
        });
        scrollToBottom();
      } catch (restErr: unknown) {
        setDraftText(text);
        const msg =
          restErr instanceof Error
            ? restErr.message
            : err instanceof Error
              ? err.message
              : 'Unable to send message.';
        setChatError(msg);
      }
    } finally {
      setIsSending(false);
    }
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

  // Identify latest own message to display "Đã xem" / "Đã gửi" cleanly
  const lastOwnMsgId =
    [...messages].reverse().find((m) => m.senderId === user?.id)?.id || null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 text-[#2A211B] dark:text-stone-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
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
        <div className="flex-1 bg-white dark:bg-stone-900 rounded-3xl border border-[#EADBCE] dark:border-stone-800 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px] max-h-[calc(100vh-190px)]">
          {/* LEFT PANE: CONVERSATIONS LIST */}
          <aside
            className={`md:col-span-4 border-r border-[#F0E4D7] dark:border-stone-800 flex flex-col min-h-0 ${selectedConvId ? 'hidden md:flex' : 'flex'
              }`}
          >
            {/* Search Box */}
            <div className="p-3.5 border-b border-[#F0E4D7] dark:border-stone-800">
              <div className="relative">
                <Search className="w-4 h-4 text-[#9B8E83] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={isVi ? 'Tìm tên người chat, món đồ, mã...' : 'Search user, item, code...'}
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
            <div className="flex-1 overflow-y-auto divide-y divide-[#F7EFE6] dark:divide-stone-800/80">
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
                      className={`w-full p-3.5 text-left transition flex items-start gap-3 cursor-pointer ${isActive
                          ? 'bg-[#FAF7F2] dark:bg-stone-800 border-l-4 border-l-[#E89650]'
                          : 'hover:bg-[#FAF7F2]/60 dark:hover:bg-stone-800/50 border-l-4 border-l-transparent'
                        }`}
                    >
                      {/* Avatar */}
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
            className={`md:col-span-8 flex flex-col min-h-0 ${selectedConvId ? 'flex' : 'hidden md:flex'
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
              <>
                {/* Conversation Header + Item Pin */}
                <div className="p-3.5 sm:px-5 border-b border-[#F0E4D7] dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]/50 dark:bg-stone-900">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedConvId(null)}
                      className="md:hidden p-1.5 rounded-lg border border-[#EADBCE] dark:border-stone-700 text-[#5C5047] dark:text-stone-300 cursor-pointer"
                      aria-label={isVi ? 'Quay lại danh sách' : 'Back to conversations'}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {activeConversation.otherParty.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeConversation.otherParty.avatarUrl}
                        alt={activeConversation.otherParty.fullName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#EADBCE] dark:border-stone-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E89650] to-[#F5A764] text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {activeConversation.otherParty.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-[#2A211B] dark:text-stone-100 truncate">
                        {activeConversation.otherParty.fullName}
                      </h2>
                      <p className="text-[11px] text-[#7A6D63] dark:text-stone-400">
                        {activeConversation.viewerIsBuyer
                          ? isVi
                            ? 'Người bán'
                            : 'Seller'
                          : isVi
                            ? 'Người mua'
                            : 'Buyer'}
                        {activeConversation.otherParty.username
                          ? ` • @${activeConversation.otherParty.username}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Pinned Item Summary */}
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 max-w-xs">
                    {activeConversation.item.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeConversation.item.primaryImageUrl}
                        alt={activeConversation.item.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] dark:bg-stone-700 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-[#B8652B]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2A211B] dark:text-stone-100 truncate">
                        {activeConversation.item.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-[#C46A28] dark:text-[#F5A764]">
                          {activeConversation.item.price === 0
                            ? isVi
                              ? '0đ (Miễn phí)'
                              : 'Free'
                            : `${activeConversation.item.price.toLocaleString('vi-VN')}đ`}
                        </span>
                        <span className="font-mono text-[#7A6D63] dark:text-stone-400">
                          • {formatItemCodeDisplay(activeConversation.item.itemCode)}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold ${activeConversation.item.status === 1
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                          {translateItemStatus(
                            activeConversation.item.status,
                            activeConversation.item.statusName,
                            isVi
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unavailable Item Warning */}
                {activeConversation.isItemUnavailable && (
                  <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      {isVi
                        ? 'Món đồ này hiện đã bán hoặc không còn mở bán. Bạn vẫn có thể tiếp tục nhắn tin trao đổi tại đây.'
                        : 'This item is no longer available for new orders. You can still message here to review past arrangements.'}
                    </span>
                  </div>
                )}

                {/* Chat Error */}
                {chatError && (
                  <div className="mx-4 mt-3 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{chatError}</span>
                  </div>
                )}

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FAF7F2]/35 dark:bg-stone-950/60">
                  {hasOlderMessages && (
                    <div className="text-center pb-2">
                      <button
                        type="button"
                        disabled={isLoadingOlder}
                        onClick={() => void handleLoadOlderMessages()}
                        className="px-3.5 py-1.5 rounded-full border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 text-[11px] font-semibold text-[#5C5047] dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer disabled:opacity-50"
                      >
                        {isLoadingOlder
                          ? isVi
                            ? 'Đang tải...'
                            : 'Loading...'
                          : isVi
                            ? 'Xem tin nhắn cũ hơn'
                            : 'Load older messages'}
                      </button>
                    </div>
                  )}

                  {isLoadingMessages ? (
                    <div className="h-full flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#E89650]" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#7A6D63] dark:text-stone-400">
                      {isVi
                        ? 'Chưa có tin nhắn nào. Hãy gửi lời chào để bắt đầu trao đổi!'
                        : 'No messages yet. Say hello to start the conversation!'}
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      const showReadReceipt = isMine && msg.id === lastOwnMsgId;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[78%] sm:max-w-[68%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs ${isMine
                                ? 'bg-gradient-to-r from-[#E89650] to-[#F5A764] text-white rounded-br-xs'
                                : 'bg-white dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 border border-[#EADBCE] dark:border-stone-700 rounded-bl-xs'
                              }`}
                          >
                            {msg.isDeleted ? (
                              <span className="italic opacity-75">
                                {isVi ? 'Tin nhắn đã bị xóa' : 'Message deleted'}
                              </span>
                            ) : (
                              msg.content
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#9B8E83] dark:text-stone-500 px-1">
                            <span>{formatMessageTime(msg.sentAt, isVi)}</span>
                            {showReadReceipt && (
                              <span className="inline-flex items-center gap-0.5 font-medium">
                                {msg.isRead ? (
                                  <>
                                    <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {isVi ? 'Đã xem' : 'Seen'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>{isVi ? 'Đã gửi' : 'Sent'}</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {isOtherTyping && (
                    <div className="flex items-center gap-2 text-xs text-[#7A6D63] dark:text-stone-400 italic px-1">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E89650] animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E89650] animate-bounce delay-150" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E89650] animate-bounce delay-300" />
                      </span>
                      <span>
                        {activeConversation.otherParty.fullName}{' '}
                        {isVi ? 'đang nhập...' : 'is typing...'}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-[#F0E4D7] dark:border-stone-800 bg-white dark:bg-stone-900 flex items-end gap-2.5"
                >
                  <div className="flex-1 relative">
                    <textarea
                      rows={1}
                      maxLength={1000}
                      value={draftText}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                      placeholder={
                        isVi
                          ? 'Nhập tin nhắn... (Enter để gửi, Shift + Enter xuống dòng)'
                          : 'Type a message... (Enter to send, Shift+Enter for new line)'
                      }
                      className="w-full px-3.5 py-2.5 pr-14 rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 text-xs sm:text-sm text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] resize-none max-h-28"
                    />
                    {draftText.length > 700 && (
                      <span className="text-[10px] text-[#9B8E83] absolute right-3 bottom-2">
                        {draftText.length}/1000
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !draftText.trim()}
                    className="h-10 px-4 rounded-2xl bg-gradient-to-r from-[#E89650] to-[#F5A764] hover:from-[#DC833B] hover:to-[#EC954B] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{isVi ? 'Gửi' : 'Send'}</span>
                  </button>
                </form>
              </>
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
