'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Flag,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Package,
  Pencil,
  Pin,
  PinOff,
  RotateCcw,
  Send,
  Smile,
  X,
} from 'lucide-react';
import { EmojiPickerPopover } from '@/components/ui/chat/EmojiPickerPopover';
import { ReportMessageModal } from '@/components/ui/chat/ReportMessageModal';
import { chatApi } from '@/lib/chat-api';
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
import { useChatStore } from '@/lib/chat-store';
import {
  formatMessageTime,
  renderMessageContent,
  translateItemStatus,
} from '@/lib/chat-formatters';
import { formatItemCodeDisplay } from '@/data/mock-items';
import { ConversationDto, MessageDto } from '@/types/chat';

const QUICK_REACTIONS = ['❤️', '😆', '😮', '😢', '😠', '👍'] as const;

interface ChatConversationPaneProps {
  conversation: ConversationDto;
  currentUserId?: string | null;
  isVi: boolean;
  compact?: boolean;
  onBack?: () => void;
  onOpenFullChat?: () => void;
  onConversationPreviewUpdate?: (
    convId: string,
    lastMessage: string | null | undefined,
    lastMessageAt: string | null | undefined
  ) => void;
  onConversationUnreadCleared?: (convId: string) => void;
}

export const ChatConversationPane: React.FC<ChatConversationPaneProps> = ({
  conversation,
  currentUserId,
  isVi,
  compact = false,
  onBack,
  onOpenFullChat,
  onConversationPreviewUpdate,
  onConversationUnreadCleared,
}) => {
  const { setTotalUnread } = useChatStore();
  const convId = conversation.id;

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [msgPage, setMsgPage] = useState<number>(1);
  const [hasOlderMessages, setHasOlderMessages] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(true);
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

  const activeConvIdRef = useRef<string>(convId);
  const currentUserIdRef = useRef<string | null | undefined>(currentUserId);
  const onUnreadClearedRef = useRef(onConversationUnreadCleared);
  const onPreviewUpdateRef = useRef(onConversationPreviewUpdate);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    activeConvIdRef.current = convId;
  }, [convId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    onUnreadClearedRef.current = onConversationUnreadCleared;
    onPreviewUpdateRef.current = onConversationPreviewUpdate;
  }, [onConversationUnreadCleared, onConversationPreviewUpdate]);

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

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 40);
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

  // Reset UI state & fetch messages whenever conversation changes
  const [prevConvId, setPrevConvId] = useState<string>(convId);
  if (prevConvId !== convId) {
    setPrevConvId(convId);
    setIsLoadingMessages(true);
    setMessages([]);
    setPinnedMessages([]);
    setShowAllPinned(false);
    setReplyTarget(null);
    setEditingTarget(null);
    setReportTarget(null);
    setOpenMenuMsgId(null);
    setOpenReactMsgId(null);
    setShowEmojiPicker(false);
    setChatError(null);
    setActionNotice(null);
    setIsOtherTyping(false);
  }

  useEffect(() => {
    let active = true;

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
        setMessages([...res.items].reverse());
        setPinnedMessages(pinned);
        setMsgPage(1);
        setHasOlderMessages(res.hasNext);
        setChatError(null);
        scrollToBottom();

        if (isChatHubConnected()) {
          void markAsReadViaHub(convId);
        } else {
          void chatApi.markAsRead(convId).then((r) => {
            if (active) setTotalUnread(r.totalUnread);
          });
        }
        onUnreadClearedRef.current?.(convId);
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
  }, [convId, scrollToBottom, setTotalUnread]);

  useEffect(() => {
    const unsubscribe = subscribeChatHub({
      onReceiveMessage: (incoming: MessageDto) => {
        if (incoming.conversationId !== activeConvIdRef.current) return;
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
        if (!evt.conversationId || evt.conversationId === activeConvIdRef.current) {
          if (evt.message) setChatError(evt.message);
        }
      },

      onReconnected: () => {
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
  }, [scrollToBottom, applyMessageUpdate]);

  const handleLoadOlderMessages = async () => {
    if (isLoadingOlder || !hasOlderMessages) return;
    setIsLoadingOlder(true);
    try {
      const nextPage = msgPage + 1;
      const res = await chatApi.listMessages(convId, nextPage, 50);
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
    if (!val.trim()) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      void sendTypingViaHub(convId);
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
    setOpenReactMsgId(null);
    setEditingTarget(null);
    setReplyTarget(msg);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleStartEdit = (msg: MessageDto) => {
    setOpenMenuMsgId(null);
    setOpenReactMsgId(null);
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
    if (busyMessageId) return;
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
    if (busyMessageId) return;
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
    if (msg.isDeleted || busyMessageId) return;
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
    await chatApi.reportMessage({
      conversationId: convId,
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
    const text = draftText.trim();
    if (!text || isSending) return;

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
        onPreviewUpdateRef.current?.(convId, createdMsg.content, createdMsg.sentAt);
        scrollToBottom();
      }
    } catch (err: unknown) {
      try {
        const createdMsg = await chatApi.sendMessageRest(convId, text, activeReplyId);
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMsg.id)) return prev;
          return [...prev, createdMsg];
        });
        onPreviewUpdateRef.current?.(convId, createdMsg.content, createdMsg.sentAt);
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

  const lastOwnMsgId =
    [...messages].reverse().find((m) => m.senderId === currentUserId)?.id || null;

  return (
    <>
      {/* Conversation Header */}
      <div
        className={`border-b border-[#F0E4D7] dark:border-stone-800 flex items-center justify-between gap-2 bg-[#FAF7F2]/60 dark:bg-stone-900 shrink-0 ${
          compact ? 'px-3 py-2' : 'p-3.5 sm:px-5 flex-col sm:flex-row sm:items-center gap-3'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`${
                compact ? 'sm:hidden' : 'md:hidden'
              } p-1.5 rounded-lg border border-[#EADBCE] dark:border-stone-700 text-[#5C5047] dark:text-stone-300 cursor-pointer shrink-0`}
              aria-label={isVi ? 'Quay lại danh sách' : 'Back to conversations'}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {conversation.otherParty.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conversation.otherParty.avatarUrl}
              alt={conversation.otherParty.fullName}
              referrerPolicy="no-referrer"
              className={`${
                compact ? 'w-8 h-8' : 'w-10 h-10'
              } rounded-full object-cover shrink-0 border border-[#EADBCE] dark:border-stone-700`}
            />
          ) : (
            <div
              className={`${
                compact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
              } rounded-full bg-gradient-to-tr from-[#E89650] to-[#F5A764] text-white font-bold flex items-center justify-center shrink-0`}
            >
              {conversation.otherParty.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}

          <div className="min-w-0">
            <h2
              className={`${
                compact ? 'text-xs' : 'text-sm'
              } font-bold text-[#2A211B] dark:text-stone-100 truncate`}
            >
              {conversation.otherParty.fullName}
            </h2>
            <p className="text-[10px] text-[#7A6D63] dark:text-stone-400 truncate">
              {conversation.viewerIsBuyer
                ? isVi
                  ? 'Người bán'
                  : 'Seller'
                : isVi
                  ? 'Người mua'
                  : 'Buyer'}
              {!compact && conversation.otherParty.username
                ? ` • @${conversation.otherParty.username}`
                : compact
                  ? ` • ${conversation.item.title}`
                  : ''}
            </p>
          </div>
        </div>

        {/* Item Pin / Pop-out action */}
        {compact ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-[#C46A28] dark:text-[#F5A764] bg-white dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 px-2 py-0.5 rounded-full tabular-nums">
              {conversation.item.price === 0
                ? isVi
                  ? 'Miễn phí'
                  : 'Free'
                : `${conversation.item.price.toLocaleString('vi-VN')}đ`}
            </span>
            {onOpenFullChat && (
              <button
                type="button"
                onClick={onOpenFullChat}
                title={isVi ? 'Mở trong SFM Chat' : 'Open in SFM Chat'}
                aria-label={isVi ? 'Mở trong SFM Chat' : 'Open in SFM Chat'}
                className="p-1.5 rounded-lg border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#A65A24] dark:text-[#F5A764] hover:bg-[#FAF7F2] dark:hover:bg-stone-700 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 max-w-xs">
            {conversation.item.primaryImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conversation.item.primaryImageUrl}
                alt={conversation.item.title}
                className="w-9 h-9 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] dark:bg-stone-700 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-[#B8652B]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#2A211B] dark:text-stone-100 truncate">
                {conversation.item.title}
              </p>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="font-bold text-[#C46A28] dark:text-[#F5A764]">
                  {conversation.item.price === 0
                    ? isVi
                      ? '0đ (Miễn phí)'
                      : 'Free'
                    : `${conversation.item.price.toLocaleString('vi-VN')}đ`}
                </span>
                <span className="font-mono text-[#7A6D63] dark:text-stone-400">
                  • {formatItemCodeDisplay(conversation.item.itemCode)}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded font-semibold ${
                    conversation.item.status === 1
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {translateItemStatus(
                    conversation.item.status,
                    conversation.item.statusName,
                    isVi
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unavailable Item Warning */}
      {conversation.isItemUnavailable && (
        <div
          className={`${
            compact ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-[11px]'
          } bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 flex items-center gap-2 shrink-0`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="truncate">
            {isVi
              ? 'Món đồ này hiện đã bán hoặc không còn mở bán. Bạn vẫn có thể tiếp tục nhắn tin.'
              : 'This item is no longer available for new orders. You can still message here.'}
          </span>
        </div>
      )}

      {/* Pinned Messages Banner + Expandable List */}
      {pinnedMessages.length > 0 && (
        <div className="border-b border-[#EFE8DD] dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-900/90 shrink-0">
          <div className={`${compact ? 'px-3 py-1.5' : 'px-4 py-2'} flex items-center justify-between gap-2`}>
            <button
              type="button"
              onClick={() => scrollToMessage(pinnedMessages[0].id)}
              className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer group"
            >
              <Pin className="w-3.5 h-3.5 text-[#C46A28] dark:text-[#F5A764] shrink-0" />
              <div className="min-w-0 flex-1 flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#A65A24] dark:text-[#F5A764] shrink-0">
                  {isVi ? 'Đã ghim:' : 'Pinned:'}
                </span>
                <span className="text-xs text-[#2A211B] dark:text-stone-200 truncate group-hover:underline">
                  {pinnedMessages[0].content}
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowAllPinned((prev) => !prev)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-[#6D5D52] dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 flex items-center gap-0.5 cursor-pointer transition"
                aria-expanded={showAllPinned}
              >
                <span>{pinnedMessages.length}</span>
                {showAllPinned ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleTogglePinMessage(pinnedMessages[0])}
                title={isVi ? 'Bỏ ghim tin này' : 'Unpin message'}
                aria-label={isVi ? 'Bỏ ghim tin này' : 'Unpin message'}
                className="p-1 rounded-lg text-[#75675C] dark:text-stone-400 hover:text-rose-600 hover:bg-white dark:hover:bg-stone-800 cursor-pointer transition"
              >
                <PinOff className="w-3 h-3" />
              </button>
            </div>
          </div>

          {showAllPinned && (
            <div className="px-3 pb-2 space-y-1 max-h-32 overflow-y-auto border-t border-[#EFE8DD]/70 dark:border-stone-800 pt-1.5">
              {pinnedMessages.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700"
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
          className="mx-3 mt-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 shrink-0"
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
          className="mx-3 mt-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-2 shrink-0"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{chatError}</span>
        </div>
      )}

      {/* Messages Stream */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 min-h-0 overflow-y-auto space-y-3 bg-[#FAF7F2]/35 dark:bg-stone-950/60 ${
          compact ? 'p-3' : 'p-4 sm:p-5'
        }`}
      >
        {hasOlderMessages && (
          <div className="text-center pb-1">
            <button
              type="button"
              disabled={isLoadingOlder}
              onClick={() => void handleLoadOlderMessages()}
              className="px-3 py-1 rounded-full border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 text-[11px] font-semibold text-[#5C5047] dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer disabled:opacity-50"
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
          <div className="h-full flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-[#E89650]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#7A6D63] dark:text-stone-400">
            {isVi
              ? 'Chưa có tin nhắn nào. Hãy gửi lời chào để bắt đầu trao đổi!'
              : 'No messages yet. Say hello to start the conversation!'}
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === currentUserId;
            const showReadReceipt = isMine && msg.id === lastOwnMsgId;
            const menuOpen = openMenuMsgId === msg.id;
            const reactOpen = openReactMsgId === msg.id;
            const isHighlighted = highlightedMsgId === msg.id;
            const openMenuDownward = idx < 2;
            const myReactionEmoji =
              msg.reactions?.find((r) => r.userId === currentUserId)?.emoji ?? null;
            const groupedReactions = (msg.reactions ?? []).reduce<
              Array<{ emoji: string; count: number; names: string[]; includesMe: boolean }>
            >((acc, r) => {
              const existing = acc.find((item) => item.emoji === r.emoji);
              const label = r.userId === currentUserId ? (isVi ? 'Bạn' : 'You') : r.userName;
              if (existing) {
                existing.count += 1;
                if (label) existing.names.push(label);
                if (r.userId === currentUserId) existing.includesMe = true;
              } else {
                acc.push({
                  emoji: r.emoji,
                  count: 1,
                  names: label ? [label] : [],
                  includesMe: r.userId === currentUserId,
                });
              }
              return acc;
            }, []);

            const replyLabel =
              msg.replyTo && !msg.isDeleted
                ? isMine
                  ? msg.replyTo.senderId === currentUserId
                    ? isVi
                      ? 'Bạn đã trả lời chính mình'
                      : 'You replied to yourself'
                    : isVi
                      ? `Bạn đã trả lời ${msg.replyTo.senderName}`
                      : `You replied to ${msg.replyTo.senderName}`
                  : msg.replyTo.senderId === currentUserId
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
                      className={`${
                        compact ? 'max-w-[85%]' : 'max-w-[78%] sm:max-w-[68%]'
                      } text-left rounded-2xl px-3 pt-1.5 pb-4 -mb-2.5 text-xs leading-snug transition cursor-pointer bg-[#F2EAE0] hover:bg-[#EAE0D3] text-[#6D5D52] border border-[#EADBCE]/80 dark:bg-stone-800/80 dark:hover:bg-stone-800 dark:text-stone-300 dark:border-stone-700/80`}
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
                    className={`${
                      compact
                        ? 'max-w-[84%] px-3 py-2 text-xs'
                        : 'max-w-[78%] sm:max-w-[68%] px-3.5 py-2.5 text-xs sm:text-sm'
                    } min-w-0 rounded-2xl leading-relaxed whitespace-pre-wrap break-words shadow-2xs transition-all ${
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
                        className={`p-1 rounded-full text-[#75675C] dark:text-stone-400 hover:bg-[#EFE8DD] dark:hover:bg-stone-800 hover:text-[#C46A28] dark:hover:text-[#F5A764] transition cursor-pointer ${
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
                          className={`absolute z-30 flex items-center gap-1 px-2 py-1 rounded-full border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
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
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-sm sm:text-base transition hover:scale-125 active:scale-95 cursor-pointer ${
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
                        className={`p-1 rounded-full text-[#75675C] dark:text-stone-400 hover:bg-[#EFE8DD] dark:hover:bg-stone-800 hover:text-[#2A211B] dark:hover:text-stone-100 transition cursor-pointer ${
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
                        className={`p-1 rounded-full text-[#75675C] dark:text-stone-400 hover:bg-[#EFE8DD] dark:hover:bg-stone-800 hover:text-[#2A211B] dark:hover:text-stone-100 transition cursor-pointer ${
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
                          className={`absolute z-30 w-40 sm:w-44 rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl py-1.5 text-xs font-medium text-[#2A211B] dark:text-stone-100 animate-in fade-in zoom-in-95 duration-100 ${
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

                {/* Reaction Badges */}
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
                    <span className="italic">• {isVi ? 'Đã chỉnh sửa' : 'Edited'}</span>
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
              {conversation.otherParty.fullName}{' '}
              {isVi ? 'đang nhập...' : 'is typing...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply / Edit Context Bar */}
      {(replyTarget || editingTarget) && (
        <div className="px-3.5 py-2 border-t border-[#F0E4D7] dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-800/80 flex items-center justify-between gap-2 shrink-0">
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
              <p className="text-xs text-[#6D5D52] dark:text-stone-300 truncate max-w-xs sm:max-w-md">
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
        className={`${
          compact ? 'p-2.5 gap-2' : 'p-3 sm:p-4 gap-2.5'
        } border-t border-[#F0E4D7] dark:border-stone-800 bg-white dark:bg-stone-900 flex items-end shrink-0`}
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
            className={`block w-full rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 text-[#2A211B] dark:text-stone-100 placeholder:text-[#9B8E83] focus:outline-none focus:ring-2 focus:ring-[#F5A764] resize-none max-h-24 ${
              compact
                ? 'min-h-[38px] px-3 py-2 pr-10 text-xs leading-5'
                : 'min-h-[44px] px-3.5 py-[11px] pr-12 text-sm leading-5'
            }`}
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            aria-label={isVi ? 'Chèn biểu tượng cảm xúc' : 'Insert emoji'}
            aria-expanded={showEmojiPicker}
            className={`absolute right-1.5 bottom-1 p-1.5 rounded-xl transition cursor-pointer ${
              showEmojiPicker
                ? 'bg-[#EFE8DD] dark:bg-stone-700 text-[#C46A28] dark:text-[#F5A764]'
                : 'text-[#75675C] dark:text-stone-400 hover:text-[#C46A28] dark:hover:text-[#F5A764] hover:bg-[#EFE8DD]/60 dark:hover:bg-stone-700/60'
            }`}
          >
            <Smile className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          </button>

          {showEmojiPicker && (
            <EmojiPickerPopover
              isVi={isVi}
              onSelect={handleInsertEmoji}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}

          {draftText.length > 700 && (
            <span className="text-[10px] text-[#9B8E83] absolute right-10 bottom-2 pointer-events-none">
              {draftText.length}/1000
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSending || !draftText.trim()}
          className={`${
            compact ? 'h-[38px] px-3 text-xs' : 'h-[44px] px-4 text-xs sm:text-sm'
          } rounded-2xl bg-gradient-to-r from-[#E89650] to-[#F5A764] hover:from-[#DC833B] hover:to-[#EC954B] text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : editingTarget ? (
            <Check className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className={compact ? 'sr-only' : 'hidden sm:inline'}>
            {editingTarget ? (isVi ? 'Lưu' : 'Save') : isVi ? 'Gửi' : 'Send'}
          </span>
        </button>
      </form>

      <ReportMessageModal
        message={reportTarget}
        otherPartyName={conversation.otherParty.fullName}
        isVi={isVi}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReportMessage}
      />
    </>
  );
};
