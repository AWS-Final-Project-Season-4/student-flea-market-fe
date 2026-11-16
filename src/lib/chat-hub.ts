///////////////////////////////////////////////////////////
//                                                       //
//             SIGNALR SINGLETON HUB MANAGER             //
//                                                       //
///////////////////////////////////////////////////////////

import * as signalR from '@microsoft/signalr';
import { getStoredAccessToken } from './api-client';
import { useChatStore } from './chat-store';
import {
  ChatErrorEvent,
  ConversationUpdatedEvent,
  MessageDto,
  MessageReadEvent,
  UnreadCountEvent,
  UserTypingEvent,
} from '@/types/chat';

function resolveChatHubUrl(): string {
  if (process.env.NEXT_PUBLIC_HUB_URL) {
    return process.env.NEXT_PUBLIC_HUB_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5033/api';
  const baseOrigin = apiUrl.replace(/\/api\/?$/i, '');
  return `${baseOrigin}/hubs/chat`;
}

export interface ChatHubHandlers {
  onReceiveMessage?: (msg: MessageDto) => void;
  onMessageRead?: (evt: MessageReadEvent) => void;
  onConversationUpdated?: (evt: ConversationUpdatedEvent) => void;
  onNotifyUnreadCount?: (evt: UnreadCountEvent) => void;
  onUserTyping?: (evt: UserTypingEvent) => void;
  onChatError?: (evt: ChatErrorEvent) => void;
  onReconnected?: () => void;
}

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<signalR.HubConnection | null> | null = null;
const activeListeners = new Set<ChatHubHandlers>();

// Custom logger avoids SignalR calling console.error (which triggers Next.js Dev Overlay on offline/reconnect)
const signalRLogger: signalR.ILogger = {
  log(logLevel: signalR.LogLevel, message: string) {
    if (logLevel >= signalR.LogLevel.Warning) {
      console.warn(`[SignalR ${signalR.LogLevel[logLevel]}] ${message}`);
    }
  },
};

function attachCoreHubBindings(conn: signalR.HubConnection) {
  conn.on('ReceiveMessage', (msg: MessageDto) => {
    activeListeners.forEach((h) => h.onReceiveMessage?.(msg));
  });

  conn.on('MessageRead', (evt: MessageReadEvent) => {
    activeListeners.forEach((h) => h.onMessageRead?.(evt));
  });

  conn.on('ConversationUpdated', (evt: ConversationUpdatedEvent) => {
    activeListeners.forEach((h) => h.onConversationUpdated?.(evt));
  });

  conn.on('NotifyUnreadCount', (evt: UnreadCountEvent) => {
    if (typeof evt?.totalUnread === 'number') {
      useChatStore.getState().setTotalUnread(evt.totalUnread);
    }
    activeListeners.forEach((h) => h.onNotifyUnreadCount?.(evt));
  });

  conn.on('UserTyping', (evt: UserTypingEvent) => {
    activeListeners.forEach((h) => h.onUserTyping?.(evt));
  });

  conn.on('ChatError', (evt: ChatErrorEvent) => {
    activeListeners.forEach((h) => h.onChatError?.(evt));
  });

  conn.onreconnecting(() => {
    useChatStore.getState().setHubStatus('reconnecting');
  });

  conn.onreconnected(() => {
    useChatStore.getState().setHubStatus('connected');
    activeListeners.forEach((h) => h.onReconnected?.());
  });

  conn.onclose(() => {
    useChatStore.getState().setHubStatus('disconnected');
  });
}

export async function startChatHub(): Promise<signalR.HubConnection | null> {
  if (typeof window === 'undefined') return null;

  const token = getStoredAccessToken();
  if (!token) return null;

  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    useChatStore.getState().setHubStatus('connected');
    return connection;
  }

  if (startPromise) {
    return startPromise;
  }

  startPromise = (async () => {
    try {
      if (!connection) {
        const nextConn = new signalR.HubConnectionBuilder()
          .withUrl(resolveChatHubUrl(), {
            accessTokenFactory: () => getStoredAccessToken() || '',
            // Backend uses Bearer JWT (?access_token=...) with AllowAnyOrigin() CORS ("*"),
            // so cross-origin negotiate fetch/EventSource must disable cookie credentials.
            withCredentials: false,
          })
          // Bounded backoff retries prevent infinite DB/server reconnect spam
          .withAutomaticReconnect([0, 2000, 10000, 30000])
          .configureLogging(signalRLogger)
          .build();

        attachCoreHubBindings(nextConn);
        connection = nextConn;
      }

      if (connection.state === signalR.HubConnectionState.Disconnected) {
        useChatStore.getState().setHubStatus('connecting');
        await connection.start();
        useChatStore.getState().setHubStatus('connected');
      }

      return connection;
    } catch (err) {
      console.warn('SignalR connection error (REST fallback remains active):', err);
      useChatStore.getState().setHubStatus('disconnected');
      if (connection && connection.state === signalR.HubConnectionState.Disconnected) {
        connection = null;
      }
      return null;
    } finally {
      startPromise = null;
    }
  })();

  return startPromise;
}

export async function stopChatHub(): Promise<void> {
  startPromise = null;
  if (connection) {
    const connToStop = connection;
    connection = null;
    try {
      await connToStop.stop();
    } catch {
      // Ignore stop errors during teardown
    }
  }
  useChatStore.getState().resetChatState();
}

export function subscribeChatHub(handlers: ChatHubHandlers): () => void {
  activeListeners.add(handlers);
  return () => {
    activeListeners.delete(handlers);
  };
}

export function isChatHubConnected(): boolean {
  return connection?.state === signalR.HubConnectionState.Connected;
}

export async function joinConversationHub(conversationId: string): Promise<void> {
  const conn = await startChatHub();
  if (conn && conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke('JoinConversation', conversationId);
  }
}

export async function leaveConversationHub(conversationId: string): Promise<void> {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    try {
      await connection.invoke('LeaveConversation', conversationId);
    } catch {
      // Ignore leave errors when switching rooms or disconnecting
    }
  }
}

export async function sendMessageViaHub(conversationId: string, content: string): Promise<void> {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('SendMessage', conversationId, content);
    return;
  }
  throw new Error('HUB_NOT_CONNECTED');
}

export async function markAsReadViaHub(conversationId: string): Promise<void> {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('MarkAsRead', conversationId);
  }
}

export async function sendTypingViaHub(conversationId: string): Promise<void> {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    try {
      await connection.invoke('Typing', conversationId);
    } catch {
      // Typing indicator is ephemeral; ignore transient send errors
    }
  }
}
