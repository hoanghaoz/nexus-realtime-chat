import { create } from "zustand";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { createChatConnection, createPresenceConnection } from "@/services/signalr";
import { useChatStore } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";
import type { Message, Conversation } from "@/types/chat";
import { toast } from "sonner";

interface SignalRState {
  chatConnection: HubConnection | null;
  presenceConnection: HubConnection | null;
  onlineUsers: string[];
  isConnected: boolean;

  connectChat: () => Promise<void>;
  disconnectChat: () => Promise<void>;
  connectPresence: () => Promise<void>;
  disconnectPresence: () => Promise<void>;
  /** Gửi tin nhắn qua SignalR ChatHub.SendMessage */
  sendMessage: (dto: {
    conversationId: string;
    content: string;
    mentionedUsersId?: string[];
    replyToMessageId?: string;
  }) => Promise<void>;
  /** Tham gia SignalR group (conversation room) */
  joinConversation: (conversationId: string) => Promise<void>;
  /** Rời SignalR group */
  leaveConversation: (conversationId: string) => Promise<void>;
  /** Gửi typing indicator */
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => Promise<void>;
  /** Xác nhận pending message sau khi upload file (hybrid flow) */
  completePendingMessage: (messageId: string) => Promise<void>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Module-level helper functions – extracted to avoid deep nesting (SonarCloud)
// ──────────────────────────────────────────────────────────────────────────────

/** Parse tên conversation để hiện trong toast notification */
function resolveConvoName(
  convo: Conversation | undefined,
  currentUserId: string | undefined
): string {
  if (!convo) return "Ai đó";
  if (convo.type === "group") return convo.group?.name ?? "Nhóm";
  const other = convo.participants?.find((p) => p._id !== currentUserId);
  return other?.displayName ?? "Ai đó";
}

/** Tạo preview text cho toast notification (tối đa 40 ký tự) */
function buildMessagePreview(content: string | null): string {
  if (!content) return "📷 Đã gửi một hình ảnh";
  if (content.length > 40) return `${content.slice(0, 40)}...`;
  return content;
}

/** Hiện toast khi nhận message từ conversation không active */
function showMessageToast(
  message: Message,
  conversations: Conversation[],
  currentUserId: string | undefined
): void {
  const convo = conversations.find((c) => c._id === message.conversationId);
  const convoName = resolveConvoName(convo, currentUserId);
  const preview = buildMessagePreview(message.content);

  toast(`💬 ${convoName}`, {
    description: preview,
    duration: 4000,
    action: {
      label: "Xem",
      onClick: () => useChatStore.getState().setActiveConversation(message.conversationId),
    },
  });
}

/** Parse raw SignalR payload thành Message object */
function parseRawMessage(rawMessage: Record<string, unknown>): Message {
  const attachments = Array.isArray(rawMessage.attachments) ? rawMessage.attachments : [];
  const firstAttachment = attachments[0] as {
    url?: unknown;
    contentType?: unknown;
    originalName?: unknown;
    fileSize?: unknown;
    fileName?: unknown;
  } | undefined;

  const content = typeof rawMessage.content === "string" ? rawMessage.content : null;
  const updatedAt = typeof rawMessage.editedAt === "string" ? rawMessage.editedAt : null;
  const createdAt = typeof rawMessage.createdAt === "string"
    ? rawMessage.createdAt
    : new Date().toISOString();

  // Phân biệt ảnh vs file dựa vào contentType từ backend
  let imgUrl: string | null = null;
  let fileAttachment: Message["fileAttachment"] = undefined;

  if (firstAttachment && typeof firstAttachment.url === "string") {
    const contentType = typeof firstAttachment.contentType === "string" ? firstAttachment.contentType : "";
    const url = firstAttachment.url;

    if (contentType.startsWith("image/")) {
      // Backend xác nhận là ảnh
      imgUrl = url;
    } else if (contentType !== "" && !contentType.startsWith("image/")) {
      // Backend xác nhận là file (PDF, ZIP, DOCX…) – không phải ảnh
      const name = typeof firstAttachment.originalName === "string"
        ? firstAttachment.originalName
        : typeof firstAttachment.fileName === "string"
          ? firstAttachment.fileName
          : url.split("/").pop()?.split("?")[0] ?? "file";
      const size = typeof firstAttachment.fileSize === "number" ? firstAttachment.fileSize : 0;
      fileAttachment = { url, name, size, type: contentType };
    } else {
      // contentType rỗng → fallback bằng extension trong URL
      const looksLikeImage = /\.(jpe?g|png|gif|webp|heic|bmp|svg)(\?.*)?$/i.test(url);
      const looksLikeFile = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz|mp4|mp3|txt|csv)(\?.*)?$/i.test(url);
      if (looksLikeImage) {
        imgUrl = url;
      } else if (looksLikeFile) {
        const name = url.split("/").pop()?.split("?")[0] ?? "file";
        fileAttachment = { url, name, size: 0, type: "" };
      }
      // Nếu là URL thuần (web link) → không set imgUrl/fileAttachment
      // → LinkPreview sẽ handle qua UpdateLinkPreview SignalR
    }
  }

  return {
    _id: String(rawMessage.messageId || rawMessage._id || ""),
    conversationId: String(rawMessage.conversationId || ""),
    senderId: String(rawMessage.userId || rawMessage.senderId || ""),
    content,
    imgUrl,
    fileAttachment,
    updatedAt,
    createdAt,
  };
}

/** Handler: ReceiveMessage – thêm vào store + toast nếu không active */
function handleReceiveMessage(rawMessage: Record<string, unknown>): void {
  const message = parseRawMessage(rawMessage);
  const currentUserId = useAuthStore?.getState?.()?.user?._id;
  const isFromMe = message.senderId === currentUserId;

  if (isFromMe && message.conversationId) {
    useChatStore.getState().removePendingMessage(message.conversationId);
  }

  const { activeConversationId, conversations } = useChatStore.getState();
  const isActiveConversation = message.conversationId === activeConversationId;

  useChatStore.getState().addMessage(message);

  if (!isActiveConversation && !isFromMe) {
    showMessageToast(message, conversations, currentUserId);
  }
}

/** Handler: ReceiveAddedToGroupNotification – thêm conversation mới vào store */
function handleAddedToGroup(
  rawPayload: Record<string, unknown>,
  connection: HubConnection
): void {
  const id =
    (typeof rawPayload.id === "string" && rawPayload.id) ||
    (typeof rawPayload._id === "string" && rawPayload._id) ||
    "";
  if (!id) return;

  const name = typeof rawPayload.name === "string" ? rawPayload.name : "Nhóm mới";
  const createdBy = typeof rawPayload.createdBy === "string" ? rawPayload.createdBy : "";
  const createdAt = typeof rawPayload.createdAt === "string"
    ? rawPayload.createdAt
    : new Date().toISOString();
  const participants = Array.isArray(rawPayload.participants) ? rawPayload.participants : [];
  const roomType = rawPayload.roomType;
  const isDirect = roomType === 1 || roomType === "Direct" || roomType === "direct";

  const conversation: Conversation = {
    _id: id,
    type: isDirect ? "direct" : "group",
    group: { name, createdBy },
    participants: participants as Conversation["participants"],
    lastMessageAt: createdAt,
    seenBy: [],
    lastMessage: null,
    unreadCounts: {},
    createdAt,
    updatedAt: createdAt,
  };

  useChatStore.getState().addConversation(conversation);
  useChatStore.getState().fetchConversations().catch(console.error);

  if (connection.state === HubConnectionState.Connected) {
    connection.invoke("JoinGroup", conversation._id).catch(console.error);
  }

  toast.success(`Bạn đã được thêm vào nhóm "${name}"`, { duration: 4000 });
}

/** Handler: ReceiveFriendRequest – toast + auto-refresh pending requests */
function handleReceiveFriendRequest(request: Record<string, unknown>): void {
  const fromName = typeof request.fromName === "string" ? request.fromName : "Ai đó";

  const refreshPending = (): void => {
    import("@/stores/useFriendStore").then(({ useFriendStore }) => {
      useFriendStore.getState().getPendingRequests();
    });
  };

  toast(`👤 ${fromName} đã gửi lời mời kết bạn!`, {
    duration: 6000,
    action: { label: "Xem", onClick: refreshPending },
  });
  refreshPending();
}

/** Handler: ReceiveAcceptFriendNotification – toast + refresh friends */
function handleAcceptFriendNotification(dto: Record<string, unknown>): void {
  const acceptorName = typeof dto.acceptorName === "string" ? dto.acceptorName : "Ai đó";
  toast.success(`🎉 ${acceptorName} đã chấp nhận lời mời kết bạn của bạn!`, { duration: 5000 });
  import("@/stores/useFriendStore").then(({ useFriendStore }) => {
    useFriendStore.getState().getFriends();
  });
}

/** Handler: MessageReactNotify – bỏ qua reaction của chính mình */
function handleMessageReact(
  conversationId: string,
  messageId: string,
  emoji: string,
  fromUserId: string
): void {
  const currentUserId = useAuthStore?.getState?.()?.user?._id;
  if (currentUserId && fromUserId === currentUserId) return;
  console.log("[SignalR] MessageReactNotify (other user):", { conversationId, messageId, emoji, fromUserId });
  useChatStore.getState().updateMessageReactions(messageId, emoji, fromUserId);
}

/** Handler: ReceiveToastNotification – react notification */
function handleToastNotification(fromUserId: string, _messageId: string, emoji: string): void {
  const currentUserId = useAuthStore?.getState?.()?.user?._id;
  if (fromUserId === currentUserId) return;
  toast(`${emoji} Ai đó đã react tin nhắn của bạn`, { duration: 3000 });
}

/** Rejoin tất cả conversations sau khi reconnect */
function rejoinAllGroups(connection: HubConnection): void {
  const conversations = useChatStore.getState().conversations;
  for (const conv of conversations) {
    connection.invoke("JoinGroup", conv._id).catch(console.error);
  }
  console.log("[SignalR] Rejoined all groups after reconnect");
}

// ──────────────────────────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────────────────────────

/**
 * useSignalRStore – quản lý kết nối SignalR với ChatHub và PresenceHub.
 *
 * Nexus dùng SignalR với 2 hub:
 *   /hubs/chat     → ChatHub (tin nhắn, typing)
 *   /hubs/presence → PresenceHub (online status)
 */
export const useSignalRStore = create<SignalRState>((set, get) => ({
  chatConnection: null,
  presenceConnection: null,
  onlineUsers: [],
  isConnected: false,

  // ──────────────────────────────────────────────────────────────────
  // CHAT HUB
  // ──────────────────────────────────────────────────────────────────
  connectChat: async () => {
    const { chatConnection } = get();
    if (chatConnection && chatConnection.state !== HubConnectionState.Disconnected) {
      return;
    }

    try {
      const connection = await createChatConnection();

      // ──── Đăng ký event handlers ────
      connection.on("ReceiveMessage", handleReceiveMessage);
      connection.on("ReceiveAddedToGroupNotification", (payload: Record<string, unknown>) =>
        handleAddedToGroup(payload, connection)
      );
      connection.on("ReceiveFriendRequest", handleReceiveFriendRequest);
      connection.on("ReceiveAcceptFriendNotification", handleAcceptFriendNotification);
      connection.on("NotifyUserJoined", (userId: string, groupName: string) => {
        console.log(`[SignalR] User ${userId} joined group ${groupName}`);
      });
      connection.on("NotifyUserLeft", (userId: string, groupName: string) => {
        console.log(`[SignalR] User ${userId} left group ${groupName}`);
      });
      connection.on("ReceiveErrorMessage", (error: string) => {
        console.error("[SignalR] Server error:", error);
      });
      connection.on("ReceiveToastNotification", handleToastNotification);
      connection.on("MessageUpdateNotify", (conversationId: string, messageId: string, newContent: string) => {
        useChatStore.getState().updateMessageContent(conversationId, messageId, newContent);
      });
      connection.on("MessageDeleteNotify", (conversationId: string, messageId: string) => {
        useChatStore.getState().removeMessage(conversationId, messageId);
      });
      connection.on("MessageReactNotify", handleMessageReact);
      // Feature 2: Link Preview – backend gửi 1 object { MessageId, Attachment: { previewLinkUrl, title, description, imageUrl, siteName } }
      connection.on(
        "UpdateLinkPreview",
        (payload: Record<string, unknown>) => {
          try {
            console.log("[SignalR] UpdateLinkPreview payload:", payload);
            const messageId = String(payload.messageId || payload.MessageId || "");
            const att = (payload.attachment || payload.Attachment || {}) as Record<string, unknown>;
            const url = String(att.previewLinkUrl || att.PreviewLinkUrl || att.url || "");
            if (!messageId || !url) return;
            useChatStore.getState().updateMessageLinkPreview(messageId, {
              url,
              title: typeof att.title === "string" ? att.title : (typeof att.Title === "string" ? att.Title : null),
              description: typeof att.description === "string" ? att.description : (typeof att.Description === "string" ? att.Description : null),
              imageUrl: typeof att.imageUrl === "string" ? att.imageUrl : (typeof att.ImageUrl === "string" ? att.ImageUrl : null),
              siteName: typeof att.siteName === "string" ? att.siteName : (typeof att.SiteName === "string" ? att.SiteName : null),
            });
          } catch (err) {
            console.error("[SignalR] UpdateLinkPreview parse error:", err);
          }
        }
      );
      // Bot reply – backend push ReceiveBotReply với payload BotResponseDto
      connection.on("ReceiveBotReply", (rawMessage: Record<string, unknown>) => {
        try {
          console.log("[SignalR] ReceiveBotReply payload:", rawMessage);
          const BOT_ID = "15c5232d-1bd9-4bbd-98e0-1ea7308e80bb";
          const botMessage: Message = {
            _id: String(rawMessage.messageId || rawMessage.MessageId || `bot-reply-${Date.now()}`),
            conversationId: String(rawMessage.conversationId || rawMessage.ConversationId || ""),
            senderId: BOT_ID,
            content: typeof rawMessage.content === "string" ? rawMessage.content : (typeof rawMessage.Content === "string" ? rawMessage.Content : ""),
            createdAt: typeof rawMessage.replyAt === "string" ? rawMessage.replyAt : (typeof rawMessage.ReplyAt === "string" ? rawMessage.ReplyAt : new Date().toISOString()),
            replyToMessageId: typeof rawMessage.parentMessageId === "string" ? rawMessage.parentMessageId : (typeof rawMessage.ParentMessageId === "string" ? rawMessage.ParentMessageId : null),
            reactions: []
          };
          console.log("[SignalR] Parsed Bot Message:", botMessage);
          if (botMessage.conversationId && botMessage._id) {
            useChatStore.getState().addMessage(botMessage);
          } else {
            console.warn("[SignalR] Invalid bot message payload (missing id or convoId)");
          }
        } catch (err) {
          console.error("[SignalR] ReceiveBotReply parse error:", err);
        }
      });


      // ──── Reconnect handlers ────
      connection.onreconnected(() => {
        console.log("[SignalR] ChatHub reconnected – rejoining all groups...");
        set({ isConnected: true });
        rejoinAllGroups(connection);
      });
      connection.onreconnecting(() => {
        console.warn("[SignalR] ChatHub reconnecting...");
        set({ isConnected: false });
      });
      connection.onclose(() => {
        console.warn("[SignalR] ChatHub connection closed");
        set({ isConnected: false });
      });

      await connection.start();
      set({ chatConnection: connection, isConnected: true });
      console.log("[SignalR] ChatHub connected");

      // Join tất cả conversations hiện có
      const conversations = useChatStore.getState().conversations;
      for (const conv of conversations) {
        connection.invoke("JoinGroup", conv._id).catch(console.error);
      }
    } catch (error) {
      console.error("[SignalR] Connection error:", error);
      set({ isConnected: false });
    }
  },

  disconnectChat: async () => {
    const { chatConnection } = get();
    if (chatConnection) {
      await chatConnection.stop();
      set({ chatConnection: null, isConnected: false });
      console.log("[SignalR] ChatHub disconnected");
    }
  },

  // ──────────────────────────────────────────────────────────────────
  // PRESENCE HUB
  // ──────────────────────────────────────────────────────────────────
  connectPresence: async () => {
    const { presenceConnection } = get();
    if (presenceConnection && presenceConnection.state !== HubConnectionState.Disconnected) {
      return;
    }

    try {
      const connection = await createPresenceConnection();

      connection.on("UserOnline", (userId: string) => {
        console.log("[SignalR Presence] UserOnline:", userId);
        set((state) => ({
          onlineUsers: state.onlineUsers.includes(userId)
            ? state.onlineUsers
            : [...state.onlineUsers, userId],
        }));
      });

      connection.on("UserOffline", (userId: string) => {
        console.log("[SignalR Presence] UserOffline:", userId);
        set((state) => ({
          onlineUsers: state.onlineUsers.filter((id) => id !== userId),
        }));
      });

      connection.onreconnected(async () => {
        console.log("[SignalR Presence] Reconnected – refreshing online users...");
        try {
          const onlineUsers: string[] = await connection.invoke("GetOnlineUsers");
          set({ onlineUsers });
        } catch (err) {
          console.warn("[SignalR Presence] GetOnlineUsers after reconnect failed:", err);
        }
      });

      connection.onreconnecting(() => {
        console.warn("[SignalR Presence] Reconnecting...");
      });

      connection.onclose(() => {
        console.warn("[SignalR Presence] Connection closed");
        set({ onlineUsers: [] });
      });

      await connection.start();
      set({ presenceConnection: connection });
      console.log("[SignalR] PresenceHub connected");

      try {
        const onlineUsers: string[] = await connection.invoke("GetOnlineUsers");
        set({ onlineUsers });
        console.log("[SignalR Presence] Initial online users:", onlineUsers.length);
      } catch (err) {
        console.warn("[SignalR Presence] GetOnlineUsers failed:", err);
      }
    } catch (error) {
      console.error("[SignalR Presence] Connection error:", error);
    }
  },

  disconnectPresence: async () => {
    const { presenceConnection } = get();
    if (presenceConnection) {
      await presenceConnection.stop();
      set({ presenceConnection: null, onlineUsers: [] });
      console.log("[SignalR] PresenceHub disconnected");
    }
  },

  // ──────────────────────────────────────────────────────────────────
  // CHAT ACTIONS
  // ──────────────────────────────────────────────────────────────────
  sendMessage: async (dto) => {
    const { chatConnection } = get();
    if (!chatConnection || chatConnection.state !== HubConnectionState.Connected) {
      console.warn("[SignalR] Not connected, cannot send message");
      return;
    }

    // Optimistic update: hiện tin nhắn ngay cho người gửi
    const currentUser = useAuthStore.getState().user;
    const optimisticId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (currentUser?._id && dto.conversationId) {
      useChatStore.getState().addMessage({
        _id: optimisticId,
        conversationId: dto.conversationId,
        senderId: currentUser._id,
        content: dto.content ?? null,
        imgUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        reactions: [],
      });
    }

    try {
      await chatConnection.invoke("SendMessage", dto);
    } catch (err) {
      console.error("[SignalR] SendMessage failed:", err);
      if (dto.conversationId) {
        useChatStore.getState().removeMessage(dto.conversationId, optimisticId);
      }
      throw err;
    }
  },

  joinConversation: async (conversationId) => {
    const { chatConnection } = get();
    if (!chatConnection || chatConnection.state !== HubConnectionState.Connected) return;
    await chatConnection.invoke("JoinGroup", conversationId);
  },

  leaveConversation: async (conversationId) => {
    const { chatConnection } = get();
    if (!chatConnection || chatConnection.state !== HubConnectionState.Connected) return;
    await chatConnection.invoke("LeaveGroup", conversationId);
  },

  sendTypingIndicator: async (conversationId, isTyping) => {
    const { chatConnection } = get();
    if (!chatConnection || chatConnection.state !== HubConnectionState.Connected) return;
    await chatConnection.invoke("SendTypingIndicator", conversationId, isTyping);
  },

  completePendingMessage: async (messageId) => {
    const { chatConnection } = get();
    if (!chatConnection || chatConnection.state !== HubConnectionState.Connected) {
      console.warn("[SignalR] Not connected, cannot complete pending message");
      return;
    }
    await chatConnection.invoke("CompletePendingMessage", messageId);
  },
}));
