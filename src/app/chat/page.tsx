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
  ChevronDown,
  ChevronUp,
  Copy,
  CornerUpLeft,
  ExternalLink,
  Flag,
  Loader2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Package,
  Pencil,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  Send,
  Smile,
  X,
} from 'lucide-react';
import { Navbar } from '@/components/ui/layout/Navbar';
import { EmojiPickerPopover } from '@/components/ui/chat/EmojiPickerPopover';
import { ReportMessageModal } from '@/components/ui/chat/ReportMessageModal';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { chatApi } from '@/lib/chat-api';
import { useChatStore } from '@/lib/chat-store';
import {
  editMessageViaHub,
  isChatHubConnected,
  joinConversationHub,
  leaveConversationHub,
  markAsReadViaHub,
  pinMessageViaHub,
  reactToMessageViaHub,
  recallMessageViaHub,
  sendMessageViaHub,
  sendTypingViaHub,
  startChatHub,
  subscribeChatHub,
} from '@/lib/chat-hub';
import { formatItemCodeDisplay } from '@/data/mock-items';
import { ConversationDto, MessageDto } from '@/types/chat';

const QUICK_REACTIONS = ['❤️', '😆', '😮', '😢', '😠', '👍'] as const;

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
const ADDRESS_ADMIN_REGEX =
  /(?:^|[\s,])(?:phường|p\.\s*[\p{L}\d]|xã|thị trấn|quận|q\.\s*[\p{L}\d]|huyện|thị xã|tx\.?|thành phố|tp\.?|tỉnh|đường|hẻm|ngõ|khu phố|kp\.?|ktx|chung cư|tòa nhà|hồ chí minh|tp\.?\s*hcm|hcm|sài gòn|hà nội|đà nẵng|thủ đức|bình thạnh|tân bình|phú nhuận|gò vấp|bình tân|tân phú|bình dương|dĩ an|biên hòa|cần thơ|ward|district|street|st\.|ave|avenue|road|rd\.|ho chi minh|hanoi)(?=$|[\s,.])/iu;

const ADDRESS_START_REGEX =
  /(?:^|(?:[:\-]\s*|(?<![\p{L}\d])(?:[Oo]k(?:ay)?|[Ởở]|[Tt]ại|[Ll]à|[Đđ]ến|[Tt]ới|[Qq]ua|[Gg]ần|[Nn]gay|[Cc]hỗ|[Ss]ang|[Vv]ề|[Aa]t|[Ii]n|[Tt]o)\s+))((?:(?:\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)*)(?:\s*,\s*|\s+(?=[\p{Lu}\d]))|(?:[Ss]ố\s+\d+[\w/]*|[Ll]ô\s+[A-Z0-9]+|[Đđ]ường\s+\p{Lu}|[Hh]ẻm\s+\d+|[Nn]gõ\s+\d+|Khu\s+(?:A|B|C|đô thị|công nghiệp)|KTX\s+[\p{L}\d]|Ký túc xá\s+[\p{L}\d]|Tòa\s+nhà\s+[\p{L}\d]|Chung cư\s+[\p{L}\d]|Cổng\s+[\p{L}\d]|Đại học\s+[\p{L}\d]|ĐH\s+[\p{L}\d]|Trường\s+[\p{L}\d]|Landmark\s*\d*|Vincom\s+[\p{L}\d]|Gigamall))[^\r\n]{4,220})/u;

const ADDRESS_TRAILING_REGEX =
  /(?:\s+(?:lúc|vào lúc|tầm|khoảng|trước|sau|hôm|ngày|nhé|nha|nhe|ạ|ha|hen|nhỉ|nhá|được không|đc ko|đc k|ko|k|ok|nè|này|vậy|nha bạn|nhé bạn)(?=$|[\s,.!?]).*|[.,!?;:\s]+)$/iu;

const STREET_CUED_REGEX =
  /(?:[:\-]\s*|(?<![\p{L}\d])(?:[Ởở]|[Tt]ại|[Đđ]ịa\s+chỉ(?:\s+là)?|[Đđ]ến|[Tt]ới|[Qq]ua|[Gg]ần|[Nn]gay|[Cc]hỗ|[Aa]t|[Tt]o)\s+)(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)*(?:\s*,\s*|\s+)\p{Lu}[\p{L}\d]+(?:\s+\p{Lu}[\p{L}\d]+){1,5})/u;

const GOOGLE_MAPS_URL_REGEX =
  /https?:\/\/(?:www\.)?(?:google\.com\/maps[^\s]*|maps\.google\.com[^\s]*|maps\.app\.goo\.gl\/[^\s]+|goo\.gl\/maps\/[^\s]+)/i;

function extractTypedAddressMatch(line: string): { start: number; end: number; text: string } | null {
  const match = ADDRESS_START_REGEX.exec(line);
  if (match) {
    const raw = match[1];
    const start = match.index + (match[0].length - raw.length);
    const cleaned = raw.replace(ADDRESS_TRAILING_REGEX, '').trim();

    if (
      cleaned.length >= 10 &&
      cleaned.length <= 240 &&
      ADDRESS_ADMIN_REGEX.test(cleaned) &&
      (cleaned.includes(',') || /\d/.test(cleaned))
    ) {
      return { start, end: start + cleaned.length, text: cleaned };
    }
  }

  const cued = STREET_CUED_REGEX.exec(line);
  if (cued) {
    const raw = cued[1];
    const start = cued.index + (cued[0].length - raw.length);
    const cleaned = raw.replace(ADDRESS_TRAILING_REGEX, '').trim();
    if (cleaned.length >= 8 && cleaned.length <= 240) {
      return { start, end: start + cleaned.length, text: cleaned };
    }
  }

  return null;
}

function renderInlineLocationLine(
  line: string,
  lineIdx: number,
  isVi: boolean,
  isMine: boolean
): React.ReactNode {
  const linkClass = isMine
    ? 'text-[#FFF8EE] hover:text-white underline decoration-[#FFF8EE] underline-offset-2 font-medium break-words transition-colors'
    : 'text-[#A65A24] hover:text-[#844519] dark:text-[#F5A764] dark:hover:text-[#FBD6B0] underline underline-offset-2 font-medium break-words transition-colors';
  const titleText = isVi ? 'Mở trên Google Maps' : 'Open in Google Maps';

  const urlMatch = GOOGLE_MAPS_URL_REGEX.exec(line);
  if (urlMatch) {
    const rawUrl = urlMatch[0].replace(/[.,!?;:)]+$/, '');
    const start = urlMatch.index;
    const end = start + rawUrl.length;
    return (
      <React.Fragment key={lineIdx}>
        {line.slice(0, start)}
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={titleText}
          className={linkClass}
        >
          {rawUrl}
        </a>
        {line.slice(end)}
      </React.Fragment>
    );
  }

  const addressMatch = extractTypedAddressMatch(line);
  if (!addressMatch) return line;

  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressMatch.text)}`;
  return (
    <React.Fragment key={lineIdx}>
      {line.slice(0, addressMatch.start)}
      <a
        href={mapSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={titleText}
        className={linkClass}
      >
        {addressMatch.text}
      </a>
      {line.slice(addressMatch.end)}
    </React.Fragment>
  );
}

function renderMessageContent(content: string, isVi: boolean, isMine: boolean) {
  const match = content.match(
    /^(?:Địa chỉ giao nhận đề xuất:|Proposed handover address:)\s*(.+)\r?\nGoogle Maps:\s*(https:\/\/[^\s]+)$/u
  );

  if (!match) {
    const lines = content.split(/\r?\n/);
    if (lines.length === 1) {
      return renderInlineLocationLine(lines[0], 0, isVi, isMine);
    }
    return lines.map((line, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && '\n'}
        {renderInlineLocationLine(line, idx, isVi, isMine)}
      </React.Fragment>
    ));
  }

  const address = match[1].trim();
  const mapUrl = match[2];

  try {
    const url = new URL(mapUrl);

    if (
      url.origin !== 'https://www.google.com' ||
      url.pathname !== '/maps/search/' ||
      !url.searchParams.get('query')
    ) {
      return content;
    }
  } catch {
    return content;
  }

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center gap-1.5 font-bold">
        <MapPin className="w-4 h-4 shrink-0" />
        <span>
          {isVi ? 'Địa chỉ giao nhận đề xuất' : 'Proposed handover address'}
        </span>
      </div>

      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-xl px-3 py-2 border underline underline-offset-2 font-medium break-words transition-colors ${
          isMine
            ? 'bg-[#FAF7F2] border-[#F3DEC7] text-[#A65A24] hover:bg-white hover:text-[#844519]'
            : 'bg-[#FAF7F2] dark:bg-stone-900 border-[#EADBCE] dark:border-stone-700 text-[#A65A24] dark:text-[#F5A764] hover:bg-[#F3EADF] dark:hover:bg-stone-800'
        }`}
      >
        {address}
      </a>

      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 font-semibold text-xs transition-colors ${
          isMine
            ? 'bg-white text-[#A65A24] hover:bg-[#FAF7F2]'
            : 'bg-[#FAF7F2] dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 text-[#A65A24] dark:text-[#F5A764] hover:bg-[#F3EADF] dark:hover:bg-stone-800'
        }`}
      >
        <span>{isVi ? 'Mở Google Maps' : 'Open Google Maps'}</span>
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      </a>
    </div>
  );
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
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);

  const [pinnedMessages, setPinnedMessages] = useState<MessageDto[]>([]);
  const [showAllPinned, setShowAllPinned] = useState<boolean>(false);
  const [replyTarget, setReplyTarget] = useState<MessageDto | null>(null);
  const [editingTarget, setEditingTarget] = useState<MessageDto | null>(null);
  const [reportTarget, setReportTarget] = useState<MessageDto | null>(null);
  const [openMenuMsgId, setOpenMenuMsgId] = useState<string | null>(null);
  const [openReactMsgId, setOpenReactMsgId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);

  const activeConvIdRef = useRef<string | null>(selectedConvId);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!openMenuMsgId && !openReactMsgId) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-msg-menu="true"]')) return;
      setOpenMenuMsgId(null);
      setOpenReactMsgId(null);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuMsgId(null);
        setOpenReactMsgId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [openMenuMsgId, openReactMsgId]);

  const showNotice = useCallback((msg: string) => {
    setActionNotice(msg);
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    const container = messagesContainerRef.current;
    const el = messageRefs.current[messageId];
    if (container && el) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetTop =
        container.scrollTop +
        (elRect.top - containerRect.top) -
        container.clientHeight / 2 +
        elRect.height / 2;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      setHighlightedMsgId(messageId);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMsgId((prev) => (prev === messageId ? null : prev));
      }, 1800);
    }
  }, []);

  const applyMessageUpdate = useCallback((updated: MessageDto) => {
    if (updated.conversationId !== activeConvIdRef.current) return;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === updated.id) return updated;
        if (m.replyTo?.id === updated.id) {
          return {
            ...m,
            replyTo: {
              ...m.replyTo,
              content: updated.isDeleted ? null : updated.content,
              isDeleted: updated.isDeleted,
            },
          };
        }
        return m;
      })
    );

    setPinnedMessages((prev) => {
      const without = prev.filter((p) => p.id !== updated.id);
      if (!updated.isPinned || updated.isDeleted) return without;
      return [updated, ...without].sort((a, b) => {
        const ta = new Date(a.pinnedAt || a.sentAt).getTime();
        const tb = new Date(b.pinnedAt || b.sentAt).getTime();
        return tb - ta;
      });
    });

    setReplyTarget((prev) => (prev?.id === updated.id && updated.isDeleted ? null : prev));
    setEditingTarget((prev) => {
      if (prev?.id === updated.id && updated.isDeleted) {
        setDraftText('');
        return null;
      }
      return prev;
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
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

    void Promise.all([
      chatApi.listMessages(convId, 1, 50),
      chatApi.listPinnedMessages(convId).catch(() => [] as MessageDto[]),
    ])
      .then(([res, pinned]) => {
        if (!active) return;
        // Backend returns newest first -> reverse to chronological order
        const ordered = [...res.items].reverse();
        setMessages(ordered);
        setPinnedMessages(pinned);
        setShowAllPinned(false);
        setReplyTarget(null);
        setEditingTarget(null);
        setOpenMenuMsgId(null);
        setShowEmojiPicker(false);
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

      onMessageUpdated: (updated: MessageDto) => {
        applyMessageUpdate(updated);
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
          void Promise.all([
            chatApi.listMessages(activeId, 1, 50),
            chatApi.listPinnedMessages(activeId).catch(() => [] as MessageDto[]),
          ]).then(([res, pinned]) => {
            setMessages([...res.items].reverse());
            setPinnedMessages(pinned);
          });
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isInitialized, isAuthenticated, refreshConversations, scrollToBottom, applyMessageUpdate]);

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

  const handleCancelComposerMode = () => {
    setReplyTarget(null);
    if (editingTarget) {
      setEditingTarget(null);
      setDraftText('');
    }
  };

  const handleStartReply = (msg: MessageDto) => {
    setOpenMenuMsgId(null);
    setEditingTarget(null);
    setReplyTarget(msg);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleStartEdit = (msg: MessageDto) => {
    setOpenMenuMsgId(null);
    setReplyTarget(null);
    setEditingTarget(msg);
    setDraftText(msg.content ?? '');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleCopyMessage = async (msg: MessageDto) => {
    setOpenMenuMsgId(null);
    const text = msg.content ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showNotice(isVi ? 'Đã sao chép tin nhắn.' : 'Message copied.');
    } catch {
      setChatError(isVi ? 'Không thể sao chép tin nhắn.' : 'Unable to copy message.');
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setDraftText((prev) => `${prev}${emoji}`);
      return;
    }
    const start = el.selectionStart ?? draftText.length;
    const end = el.selectionEnd ?? draftText.length;
    const next = `${draftText.slice(0, start)}${emoji}${draftText.slice(end)}`;
    if (next.length > 1000) return;
    setDraftText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleRecallMessage = async (msg: MessageDto) => {
    const convId = selectedConvId;
    if (!convId || busyMessageId) return;
    setOpenMenuMsgId(null);
    setBusyMessageId(msg.id);
    setChatError(null);
    try {
      if (isChatHubConnected()) {
        await recallMessageViaHub(convId, msg.id);
      } else {
        const updated = await chatApi.recallMessage(convId, msg.id);
        applyMessageUpdate(updated);
      }
      showNotice(isVi ? 'Đã thu hồi tin nhắn.' : 'Message unsent.');
    } catch (err: unknown) {
      try {
        const updated = await chatApi.recallMessage(convId, msg.id);
        applyMessageUpdate(updated);
        showNotice(isVi ? 'Đã thu hồi tin nhắn.' : 'Message unsent.');
      } catch (restErr: unknown) {
        setChatError(
          restErr instanceof Error
            ? restErr.message
            : err instanceof Error
              ? err.message
              : isVi
                ? 'Không thể thu hồi tin nhắn.'
                : 'Unable to unsend message.'
        );
      }
    } finally {
      setBusyMessageId(null);
    }
  };

  const handleTogglePinMessage = async (msg: MessageDto) => {
    const convId = selectedConvId;
    if (!convId || busyMessageId) return;
    const nextPinned = !msg.isPinned;
    setOpenMenuMsgId(null);
    setBusyMessageId(msg.id);
    setChatError(null);
    try {
      if (isChatHubConnected()) {
        await pinMessageViaHub(convId, msg.id, nextPinned);
      } else {
        const updated = nextPinned
          ? await chatApi.pinMessage(convId, msg.id)
          : await chatApi.unpinMessage(convId, msg.id);
        applyMessageUpdate(updated);
      }
      showNotice(
        nextPinned
          ? isVi
            ? 'Đã ghim tin nhắn.'
            : 'Message pinned.'
          : isVi
            ? 'Đã bỏ ghim tin nhắn.'
            : 'Message unpinned.'
      );
    } catch (err: unknown) {
      try {
        const updated = nextPinned
          ? await chatApi.pinMessage(convId, msg.id)
          : await chatApi.unpinMessage(convId, msg.id);
        applyMessageUpdate(updated);
      } catch (restErr: unknown) {
        setChatError(
          restErr instanceof Error
            ? restErr.message
            : err instanceof Error
              ? err.message
              : isVi
                ? 'Không thể cập nhật ghim tin nhắn.'
                : 'Unable to update pin.'
        );
      }
    } finally {
      setBusyMessageId(null);
    }
  };

  const handleToggleReaction = async (msg: MessageDto, emoji: string) => {
    const convId = selectedConvId;
    if (!convId || msg.isDeleted || busyMessageId) return;
    setOpenReactMsgId(null);
    setBusyMessageId(msg.id);
    setChatError(null);
    try {
      if (isChatHubConnected()) {
        await reactToMessageViaHub(convId, msg.id, emoji);
      } else {
        const updated = await chatApi.reactToMessage(convId, msg.id, emoji);
        applyMessageUpdate(updated);
      }
    } catch (err: unknown) {
      try {
        const updated = await chatApi.reactToMessage(convId, msg.id, emoji);
        applyMessageUpdate(updated);
      } catch (restErr: unknown) {
        setChatError(
          restErr instanceof Error
            ? restErr.message
            : err instanceof Error
              ? err.message
              : isVi
                ? 'Không thể thả cảm xúc cho tin nhắn.'
                : 'Unable to react to message.'
        );
      }
    } finally {
      setBusyMessageId(null);
    }
  };

  const handleSubmitReportMessage = async (payload: {
    messageId: string;
    reason: number;
    description: string;
  }) => {
    if (!selectedConvId) return;
    await chatApi.reportMessage({
      conversationId: selectedConvId,
      messageId: payload.messageId,
      reason: payload.reason,
      description: payload.description,
    });
    showNotice(
      isVi
        ? 'Đã gửi báo cáo tin nhắn vi phạm để kiểm duyệt viên xem xét.'
        : 'Message report submitted for moderator review.'
    );
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const convId = selectedConvId;
    const text = draftText.trim();
    if (!convId || !text || isSending) return;

    setChatError(null);
    setShowEmojiPicker(false);
    setIsSending(true);

    if (editingTarget) {
      const target = editingTarget;
      setDraftText('');
      setEditingTarget(null);
      try {
        if (isChatHubConnected()) {
          await editMessageViaHub(convId, target.id, text);
        } else {
          const updated = await chatApi.editMessage(convId, target.id, text);
          applyMessageUpdate(updated);
        }
      } catch (err: unknown) {
        try {
          const updated = await chatApi.editMessage(convId, target.id, text);
          applyMessageUpdate(updated);
        } catch (restErr: unknown) {
          setEditingTarget(target);
          setDraftText(text);
          setChatError(
            restErr instanceof Error
              ? restErr.message
              : err instanceof Error
                ? err.message
                : isVi
                  ? 'Không thể chỉnh sửa tin nhắn.'
                  : 'Unable to edit message.'
          );
        }
      } finally {
        setIsSending(false);
      }
      return;
    }

    const activeReplyId = replyTarget?.id ?? null;
    const previousReply = replyTarget;
    setDraftText('');
    setReplyTarget(null);

    try {
      if (isChatHubConnected()) {
        await sendMessageViaHub(convId, text, activeReplyId);
      } else {
        const createdMsg = await chatApi.sendMessageRest(convId, text, activeReplyId);
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
        const createdMsg = await chatApi.sendMessageRest(convId, text, activeReplyId);
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMsg.id)) return prev;
          return [...prev, createdMsg];
        });
        scrollToBottom();
      } catch (restErr: unknown) {
        setDraftText(text);
        setReplyTarget(previousReply);
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

      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
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
            className={`md:col-span-4 border-r border-[#F0E4D7] dark:border-stone-800 flex flex-col min-h-0 overflow-hidden ${selectedConvId ? 'hidden md:flex' : 'flex'
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
            className={`md:col-span-8 flex flex-col min-h-0 overflow-hidden ${selectedConvId ? 'flex' : 'hidden md:flex'
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

                {/* Pinned Messages Banner + Expandable List */}
                {pinnedMessages.length > 0 && (
                  <div className="border-b border-[#EFE8DD] dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-900/90">
                    <div className="px-4 py-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => scrollToMessage(pinnedMessages[0].id)}
                        className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer group"
                      >
                        <Pin className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-[#A65A24] dark:text-[#F5A764] mr-1.5">
                            {isVi ? 'Tin nhắn đã ghim:' : 'Pinned:'}
                          </span>
                          <span className="text-xs text-[#2A211B] dark:text-stone-200 truncate inline-block max-w-[72%] align-bottom group-hover:underline">
                            {pinnedMessages[0].content}
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowAllPinned((prev) => !prev)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#6D5D52] dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 flex items-center gap-1 cursor-pointer transition"
                          aria-expanded={showAllPinned}
                        >
                          <span>
                            {pinnedMessages.length}{' '}
                            {isVi ? 'ghim' : pinnedMessages.length === 1 ? 'pin' : 'pins'}
                          </span>
                          {showAllPinned ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTogglePinMessage(pinnedMessages[0])}
                          title={isVi ? 'Bỏ ghim tin này' : 'Unpin message'}
                          aria-label={isVi ? 'Bỏ ghim tin này' : 'Unpin message'}
                          className="p-1.5 rounded-lg text-[#75675C] dark:text-stone-400 hover:text-rose-600 hover:bg-white dark:hover:bg-stone-800 cursor-pointer transition"
                        >
                          <PinOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {showAllPinned && (
                      <div className="px-4 pb-2.5 space-y-1.5 max-h-40 overflow-y-auto border-t border-[#EFE8DD]/70 dark:border-stone-800 pt-2">
                        {pinnedMessages.map((pm) => (
                          <div
                            key={pm.id}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                scrollToMessage(pm.id);
                                setShowAllPinned(false);
                              }}
                              className="flex-1 min-w-0 text-left cursor-pointer"
                            >
                              <p className="text-[10px] font-semibold text-[#A65A24] dark:text-[#F5A764]">
                                {pm.senderName} • {formatMessageTime(pm.sentAt, isVi)}
                              </p>
                              <p className="text-xs text-[#2A211B] dark:text-stone-100 truncate">
                                {pm.content}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleTogglePinMessage(pm)}
                              aria-label={isVi ? 'Bỏ ghim' : 'Unpin'}
                              className="p-1 rounded-md text-[#75675C] dark:text-stone-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Notice */}
                {actionNotice && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mx-4 mt-3 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2"
                  >
                    <span>{actionNotice}</span>
                    <button
                      type="button"
                      onClick={() => setActionNotice(null)}
                      aria-label={isVi ? 'Đóng thông báo' : 'Dismiss'}
                      className="cursor-pointer opacity-75 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Chat Error */}
                {chatError && (
                  <div
                    role="alert"
                    className="mx-4 mt-3 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{chatError}</span>
                  </div>
                )}

                {/* Messages Stream */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FAF7F2]/35 dark:bg-stone-950/60"
                >
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
                    messages.map((msg, idx) => {
                      const isMine = msg.senderId === user?.id;
                      const showReadReceipt = isMine && msg.id === lastOwnMsgId;
                      const menuOpen = openMenuMsgId === msg.id;
                      const reactOpen = openReactMsgId === msg.id;
                      const isHighlighted = highlightedMsgId === msg.id;
                      const openMenuDownward = idx < 2;
                      const myReactionEmoji =
                        msg.reactions?.find((r) => r.userId === user?.id)?.emoji ?? null;
                      const groupedReactions = (msg.reactions ?? []).reduce<
                        Array<{ emoji: string; count: number; names: string[]; includesMe: boolean }>
                      >((acc, r) => {
                        const existing = acc.find((item) => item.emoji === r.emoji);
                        const label =
                          r.userId === user?.id ? (isVi ? 'Bạn' : 'You') : r.userName;
                        if (existing) {
                          existing.count += 1;
                          if (label) existing.names.push(label);
                          if (r.userId === user?.id) existing.includesMe = true;
                        } else {
                          acc.push({
                            emoji: r.emoji,
                            count: 1,
                            names: label ? [label] : [],
                            includesMe: r.userId === user?.id,
                          });
                        }
                        return acc;
                      }, []);

                      const replyLabel =
                        msg.replyTo && !msg.isDeleted
                          ? isMine
                            ? msg.replyTo.senderId === user?.id
                              ? isVi
                                ? 'Bạn đã trả lời chính mình'
                                : 'You replied to yourself'
                              : isVi
                                ? `Bạn đã trả lời ${msg.replyTo.senderName}`
                                : `You replied to ${msg.replyTo.senderName}`
                            : msg.replyTo.senderId === user?.id
                              ? isVi
                                ? `${msg.senderName} đã trả lời bạn`
                                : `${msg.senderName} replied to you`
                              : isVi
                                ? `${msg.senderName} đã trả lời chính họ`
                                : `${msg.senderName} replied to themselves`
                          : null;

                      return (
                        <div
                          key={msg.id}
                          ref={(el) => {
                            messageRefs.current[msg.id] = el;
                          }}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          {/* Messenger-style Stacked Reply Quote */}
                          {msg.replyTo && !msg.isDeleted && (
                            <div className={`flex flex-col max-w-full ${isMine ? 'items-end' : 'items-start'}`}>
                              {replyLabel && (
                                <span className="mb-1 px-1 text-[10px] font-medium text-[#75675C] dark:text-stone-400 flex items-center gap-1">
                                  <CornerUpLeft className="w-2.5 h-2.5 shrink-0" />
                                  <span>{replyLabel}</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => scrollToMessage(msg.replyTo!.id)}
                                title={isVi ? 'Xem tin nhắn gốc' : 'Jump to original message'}
                                className="max-w-[78%] sm:max-w-[68%] text-left rounded-2xl px-3.5 pt-2 pb-4 -mb-2.5 text-xs leading-snug transition cursor-pointer bg-[#F2EAE0] hover:bg-[#EAE0D3] text-[#6D5D52] border border-[#EADBCE]/80 dark:bg-stone-800/80 dark:hover:bg-stone-800 dark:text-stone-300 dark:border-stone-700/80"
                              >
                                <span
                                  className={`line-clamp-2 break-words ${
                                    msg.replyTo.isDeleted ? 'italic opacity-80' : ''
                                  }`}
                                >
                                  {msg.replyTo.isDeleted
                                    ? isVi
                                      ? 'Tin nhắn đã được thu hồi'
                                      : 'Message unsent'
                                    : msg.replyTo.content}
                                </span>
                              </button>
                            </div>
                          )}

                          <div
                            className={`group relative z-10 flex items-center gap-1 max-w-full ${
                              isMine ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <div
                              className={`max-w-[78%] sm:max-w-[68%] min-w-0 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs transition-all ${
                                isHighlighted
                                  ? 'ring-2 ring-[#C46A28] dark:ring-[#F5A764] ring-offset-2 ring-offset-[#FAF7F2] dark:ring-offset-stone-950'
                                  : ''
                              } ${
                                msg.isDeleted
                                  ? 'bg-[#F4EDE4] dark:bg-stone-900 text-[#75675C] dark:text-stone-400 border border-[#EADBCE] dark:border-stone-800'
                                  : isMine
                                    ? 'bg-gradient-to-r from-[#E89650] to-[#F5A764] text-white rounded-br-xs'
                                    : 'bg-white dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 border border-[#EADBCE] dark:border-stone-700 rounded-bl-xs'
                              }`}
                            >
                              {msg.isDeleted ? (
                                <span className="italic">
                                  {isVi ? 'Tin nhắn đã được thu hồi' : 'Message unsent'}
                                </span>
                              ) : (
                                renderMessageContent(msg.content ?? '', isVi, isMine)
                              )}
                            </div>

                            {/* Messenger-style Reaction + Quick Reply + Action Popover Trigger */}
                            {!msg.isDeleted && (
                              <div className="relative flex items-center gap-0.5 shrink-0" data-msg-menu="true">
                                <button
                                  type="button"
                                  disabled={busyMessageId === msg.id}
                                  onClick={() => {
                                    setOpenMenuMsgId(null);
                                    setOpenReactMsgId((prev) => (prev === msg.id ? null : msg.id));
                                  }}
                                  title={isVi ? 'Thả cảm xúc' : 'React'}
                                  aria-label={isVi ? 'Thả cảm xúc cho tin nhắn' : 'React to message'}
                                  aria-expanded={reactOpen}
                                  className={`p-1.5 rounded-full text-[#75675C] dark:text-stone-400 hover:bg-[#EFE8DD] dark:hover:bg-stone-800 hover:text-[#C46A28] dark:hover:text-[#F5A764] transition cursor-pointer ${
                                    reactOpen || menuOpen
                                      ? 'opacity-100 bg-[#EFE8DD] dark:bg-stone-800'
                                      : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100'
                                  }`}
                                >
                                  <Smile className="w-3.5 h-3.5" />
                                </button>

                                {reactOpen && (
                                  <div
                                    role="toolbar"
                                    aria-label={isVi ? 'Chọn cảm xúc' : 'Choose reaction'}
                                    className={`absolute z-30 flex items-center gap-1 px-2 py-1.5 rounded-full border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
                                      openMenuDownward ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                                    } ${isMine ? 'right-0' : 'left-0'}`}
                                  >
                                    {QUICK_REACTIONS.map((emoji) => {
                                      const activeEmoji = myReactionEmoji === emoji;
                                      return (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => void handleToggleReaction(msg, emoji)}
                                          aria-label={emoji}
                                          aria-pressed={activeEmoji}
                                          className={`w-7 h-7 rounded-full flex items-center justify-center text-base transition hover:scale-125 active:scale-95 cursor-pointer ${
                                            activeEmoji
                                              ? 'bg-[#FBD6B0]/70 dark:bg-[#F5A764]/25 ring-1 ring-[#C46A28] dark:ring-[#F5A764]'
                                              : 'hover:bg-[#FAF7F2] dark:hover:bg-stone-800'
                                          }`}
                                        >
                                          {emoji}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  disabled={busyMessageId === msg.id}
                                  onClick={() => handleStartReply(msg)}
                                  title={isVi ? 'Trả lời' : 'Reply'}
                                  aria-label={isVi ? 'Trả lời tin nhắn' : 'Reply to message'}
                                  className={`p-1.5 rounded-full text-[#75675C] dark:text-stone-400 hover:bg-[#EFE8DD] dark:hover:bg-stone-800 hover:text-[#2A211B] dark:hover:text-stone-100 transition cursor-pointer ${
                                    menuOpen || reactOpen
                                      ? 'opacity-100'
                                      : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100'
                                  }`}
                                >
                                  <CornerUpLeft className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={busyMessageId === msg.id}
                                  onClick={() => {
                                    setOpenReactMsgId(null);
                                    setOpenMenuMsgId((prev) => (prev === msg.id ? null : msg.id));
                                  }}
                                  aria-label={isVi ? 'Tùy chọn tin nhắn' : 'Message actions'}
                                  aria-expanded={menuOpen}
                                  className={`p-1.5 rounded-full text-[#75675C] dark:text-stone-400 hover:bg-[#EFE8DD] dark:hover:bg-stone-800 hover:text-[#2A211B] dark:hover:text-stone-100 transition cursor-pointer ${
                                    menuOpen
                                      ? 'opacity-100 bg-[#EFE8DD] dark:bg-stone-800'
                                      : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100'
                                  }`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {menuOpen && (
                                  <div
                                    role="menu"
                                    className={`absolute z-30 w-44 rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl py-1.5 text-xs font-medium text-[#2A211B] dark:text-stone-100 animate-in fade-in zoom-in-95 duration-100 ${
                                      openMenuDownward ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                                    } ${isMine ? 'right-0' : 'left-0'}`}
                                  >
                                    {isMine && (
                                      <>
                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={() => handleStartEdit(msg)}
                                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer"
                                        >
                                          <Pencil className="w-3.5 h-3.5 text-[#A65A24] dark:text-[#F5A764]" />
                                          <span>{isVi ? 'Chỉnh sửa' : 'Edit'}</span>
                                        </button>

                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={() => void handleRecallMessage(msg)}
                                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5 text-[#A65A24] dark:text-[#F5A764]" />
                                          <span>{isVi ? 'Thu hồi' : 'Unsend'}</span>
                                        </button>
                                      </>
                                    )}

                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => void handleCopyMessage(msg)}
                                      className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-[#A65A24] dark:text-[#F5A764]" />
                                      <span>{isVi ? 'Sao chép' : 'Copy'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => void handleTogglePinMessage(msg)}
                                      className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer"
                                    >
                                      {msg.isPinned ? (
                                        <>
                                          <PinOff className="w-3.5 h-3.5 text-[#A65A24] dark:text-[#F5A764]" />
                                          <span>{isVi ? 'Bỏ ghim' : 'Unpin'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <Pin className="w-3.5 h-3.5 text-[#A65A24] dark:text-[#F5A764]" />
                                          <span>{isVi ? 'Ghim' : 'Pin'}</span>
                                        </>
                                      )}
                                    </button>

                                    {!isMine && (
                                      <div className="mt-1 pt-1 border-t border-[#EFE8DD] dark:border-stone-800">
                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={() => {
                                            setOpenMenuMsgId(null);
                                            setReportTarget(msg);
                                          }}
                                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                        >
                                          <Flag className="w-3.5 h-3.5" />
                                          <span>{isVi ? 'Báo cáo' : 'Report'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Reaction Badges (Messenger style) */}
                          {!msg.isDeleted && groupedReactions.length > 0 && (
                            <div
                              className={`relative z-20 -mt-2 mb-0.5 flex flex-wrap items-center gap-1 px-1 ${
                                isMine ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {groupedReactions.map((item) => (
                                <button
                                  key={item.emoji}
                                  type="button"
                                  disabled={busyMessageId === msg.id}
                                  onClick={() => void handleToggleReaction(msg, item.emoji)}
                                  title={item.names.join(', ')}
                                  aria-label={`${item.emoji} (${item.count})`}
                                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] shadow-xs border transition cursor-pointer ${
                                    item.includesMe
                                      ? 'bg-[#FAF7F2] dark:bg-stone-800 border-[#C46A28] dark:border-[#F5A764] text-[#2A211B] dark:text-stone-100 font-semibold'
                                      : 'bg-white dark:bg-stone-900 border-[#EADBCE] dark:border-stone-700 text-[#5C5047] dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-stone-800'
                                  }`}
                                >
                                  <span>{item.emoji}</span>
                                  {item.count > 1 && (
                                    <span className="tabular-nums text-[10px]">{item.count}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#9B8E83] dark:text-stone-500 px-1">
                            <span>{formatMessageTime(msg.sentAt, isVi)}</span>
                            {msg.editedAt && !msg.isDeleted && (
                              <span className="italic">
                                • {isVi ? 'Đã chỉnh sửa' : 'Edited'}
                              </span>
                            )}
                            {msg.isPinned && !msg.isDeleted && (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-[#A65A24] dark:text-[#F5A764]">
                                <Pin className="w-2.5 h-2.5" />
                                {isVi ? 'Đã ghim' : 'Pinned'}
                              </span>
                            )}
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

                {/* Reply / Edit Context Bar */}
                {(replyTarget || editingTarget) && (
                  <div className="px-4 py-2 border-t border-[#F0E4D7] dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-800/80 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      {editingTarget ? (
                        <Pencil className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764] shrink-0" />
                      ) : (
                        <CornerUpLeft className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#A65A24] dark:text-[#F5A764]">
                          {editingTarget
                            ? isVi
                              ? 'Đang chỉnh sửa tin nhắn'
                              : 'Editing message'
                            : isVi
                              ? `Đang trả lời ${replyTarget!.senderName}`
                              : `Replying to ${replyTarget!.senderName}`}
                        </p>
                        <p className="text-xs text-[#6D5D52] dark:text-stone-300 truncate max-w-md">
                          {editingTarget ? editingTarget.content : replyTarget?.content}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelComposerMode}
                      aria-label={isVi ? 'Hủy' : 'Cancel'}
                      className="p-1.5 rounded-lg text-[#75675C] dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700 cursor-pointer transition shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-[#F0E4D7] dark:border-stone-800 bg-white dark:bg-stone-900 flex items-end gap-2.5"
                >
                  <div className="flex-1 relative flex items-center">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      maxLength={1000}
                      value={draftText}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendMessage();
                        } else if (e.key === 'Escape' && (replyTarget || editingTarget)) {
                          handleCancelComposerMode();
                        }
                      }}
                      placeholder={
                        editingTarget
                          ? isVi
                            ? 'Nhập nội dung mới...'
                            : 'Edit your message...'
                          : isVi
                            ? 'Nhập tin nhắn'
                            : 'Type a message'
                      }
                      aria-label={isVi ? 'Nhập tin nhắn' : 'Type a message'}
                      className="block w-full min-h-[44px] px-3.5 py-[11px] pr-12 rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 text-sm leading-5 text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] resize-none max-h-28"
                    />

                    {/* Messenger-style Emoji Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      aria-label={isVi ? 'Chèn biểu tượng cảm xúc' : 'Insert emoji'}
                      aria-expanded={showEmojiPicker}
                      className={`absolute right-2 bottom-1.5 p-1.5 rounded-xl transition cursor-pointer ${
                        showEmojiPicker
                          ? 'bg-[#EFE8DD] dark:bg-stone-700 text-[#C46A28] dark:text-[#F5A764]'
                          : 'text-[#75675C] dark:text-stone-400 hover:text-[#C46A28] dark:hover:text-[#F5A764] hover:bg-[#EFE8DD]/60 dark:hover:bg-stone-700/60'
                      }`}
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    {showEmojiPicker && (
                      <EmojiPickerPopover
                        isVi={isVi}
                        onSelect={handleInsertEmoji}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}

                    {draftText.length > 700 && (
                      <span className="text-[10px] text-[#9B8E83] absolute right-11 bottom-2.5 pointer-events-none">
                        {draftText.length}/1000
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !draftText.trim()}
                    className="h-[44px] px-4 rounded-2xl bg-gradient-to-r from-[#E89650] to-[#F5A764] hover:from-[#DC833B] hover:to-[#EC954B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingTarget ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {editingTarget ? (isVi ? 'Lưu' : 'Save') : isVi ? 'Gửi' : 'Send'}
                    </span>
                  </button>
                </form>

                <ReportMessageModal
                  message={reportTarget}
                  otherPartyName={activeConversation.otherParty.fullName}
                  isVi={isVi}
                  onClose={() => setReportTarget(null)}
                  onSubmit={handleSubmitReportMessage}
                />
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
