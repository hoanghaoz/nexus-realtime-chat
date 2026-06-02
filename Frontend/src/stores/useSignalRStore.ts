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

/**
 * useSignalRStore – quản lý kết nối SignalR với ChatHub và PresenceHub.
 *
 * Nexus dùng SignalR với 2 hub:
 *   /hubs/chat     → ChatHub (tin nhắn, typing)
 *   /hubs/presence → PresenceHub (online status)
 *
 * Client nhận các sự kiện từ server:
 *   ReceiveMessage(MessageResponseDto)           → thêm message vào store
 *   ReceiveAddedToGroupNotification(GroupDto)    → thêm conversation vào store
 *   NotifyUserJoined(userId, groupName)          → log
 *   NotifyUserLeft(userId, groupName)            → log
 *   UserTypingNotify(userId, conversationId, isTyping) → typing indicator
 *   MessageUpdateNotify(conversationId, messageId, newContent) → edit
 *   MessageDeleteNotify(conversationId, messageId)             → delete
 *   ReceiveErrorMessage(error)                  → log error
 *   ReceiveToastNotification(fromUserId, messageId, emoji) → toast
 *   UserOnline(userId)  → online status
 *   UserOffline(userId) → offline status
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
    if (
      chatConnection &&
      chatConnection.state !== HubConnectionState.Disconnected
    ) {
      return; // Đã kết nối rồi
    }

    try {
      const connection = await createChatConnection();

      // ──── Helper: rejoin tất cả conversations ────
      const rejoinAllGroups = () => {
        const conversations = useChatStore.getState().conversations;
        for (const conv of conversations) {
          connection.invoke("JoinGroup", conv._id).catch(console.error);
        }
        console.log("[SignalR] Rejoined all groups after reconnect");
      };

      // ──── Lắng nghe sự kiện từ server ────

      /** Nhận tin nhắn mới */
      connection.on("ReceiveMessage", (rawMessage: Record<string, unknown>) => {
        const attachments = Array.isArray(rawMessage.attachments) ? rawMessage.attachments : [];
        const firstAttachment = attachments[0] as { url?: unknown } | undefined;
        const message: Message = {
          _id: String(rawMessage.messageId || rawMessage._id || ""),
          conversationId: String(rawMessage.conversationId || ""),
          senderId: String(rawMessage.userId || rawMessage.senderId || ""),
          content: typeof rawMessage.content === "string" ? rawMessage.content : null,
          imgUrl: typeof firstAttachment?.url === "string" ? firstAttachment.url : null,
          updatedAt: typeof rawMessage.editedAt === "string" ? rawMessage.editedAt : null,
          createdAt: typeof rawMessage.createdAt === "string" ? rawMessage.createdAt : new Date().toISOString(),
        };

        const currentUserId = useAuthStore?.getState?.()?.user?._id;
        const isFromMe = message.senderId === currentUserId;

        // Nếu là tin của chính mình → xóa optimistic message pending trước khi thêm bản thật
        if (isFromMe && message.conversationId) {
          useChatStore.getState().removePendingMessage(message.conversationId);
        }

        const { activeConversationId, conversations } = useChatStore.getState();
        const isActiveConversation = message.conversationId === activeConversationId;

        // Thêm vào store (dedup được xử lý bên trong addMessage)
        useChatStore.getState().addMessage(message);


        // Nếu message đến ở conversation KHÔNG đang active và KHÔNG phải từ mình
        // → hiển thị toast notification
        if (!isActiveConversation && !isFromMe) {
          const convo = conversations.find((c) => c._id === message.conversationId);
          const convoName = convo
            ? convo.type === "group"
              ? (convo.group?.name ?? "Nhóm")
              : (convo.participants?.find((p) => p._id !== currentUserId)?.displayName ?? "Ai đó")
            : "Ai đó";

          const preview = message.content
            ? message.content.length > 40
              ? message.content.slice(0, 40) + "..."
              : message.content
            : "📷 Đã gửi một hình ảnh";

          toast(`💬 ${convoName}`, {
            description: preview,
            duration: 4000,
            action: {
              label: "Xem",
              onClick: () => useChatStore.getState().setActiveConversation(message.conversationId),
            },
          });
        }
      });

      /** Được thêm vào nhóm mới */
      connection.on("ReceiveAddedToGroupNotification", (rawPayload: Record<string, unknown>) => {
        const id =
          (typeof rawPayload._id === "string" && rawPayload._id) ||
          (typeof rawPayload.id === "string" && rawPayload.id) ||
          (typeof rawPayload.Id === "string" && rawPayload.Id) ||
          "";
        const name =
          (typeof rawPayload.name === "string" && rawPayload.name) ||
          (typeof rawPayload.Name === "string" && rawPayload.Name) ||
          "Nhóm mới";
        const createdBy =
          (typeof rawPayload.createdBy === "string" && rawPayload.createdBy) ||
          (typeof rawPayload.CreatedBy === "string" && rawPayload.CreatedBy) ||
          "";
        const createdAt =
          (typeof rawPayload.createdAt === "string" && rawPayload.createdAt) ||
          (typeof rawPayload.CreatedAt === "string" && rawPayload.CreatedAt) ||
          new Date().toISOString();
        const participants = Array.isArray(rawPayload.participants)
          ? rawPayload.participants
          : Array.isArray(rawPayload.Participants)
            ? rawPayload.Participants
            : [];

        if (!id) return;

        const roomType = rawPayload.roomType || rawPayload.RoomType;
        const isDirect = roomType === 1 || roomType === "Direct" || roomType === "direct";

        const conversation: Conversation = {
          _id: id,
          type: isDirect ? "direct" : "group",
          group: {
            name,
            createdBy,
          },
          participants: participants as Conversation["participants"],
          lastMessageAt: createdAt,
          seenBy: [],
          lastMessage: null,
          unreadCounts: {},
          createdAt,
          updatedAt: createdAt,
        };

        useChatStore.getState().addConversation(conversation);
        // Re-fetch conversations để lấy danh sách thành viên đầy đủ từ server
        useChatStore.getState().fetchConversations().catch(console.error);
        // Tự động join SignalR group để nhận tin nhắn
        if (connection.state === HubConnectionState.Connected) {
          connection.invoke("JoinGroup", conversation._id).catch(console.error);
        }

        // Toast thông báo được thêm vào group
        toast.success(`Bạn đã được thêm vào nhóm "${name}"`, { duration: 4000 });
      });

      /** Thông báo user khác tham gia/rời conversation */
      connection.on("NotifyUserJoined", (userId: string, groupName: string) => {
        console.log(`[SignalR] User ${userId} joined group ${groupName}`);
      });

      connection.on("NotifyUserLeft", (userId: string, groupName: string) => {
        console.log(`[SignalR] User ${userId} left group ${groupName}`);
      });

      /** Lỗi từ server */
      connection.on("ReceiveErrorMessage", (error: string) => {
        console.error("[SignalR] Server error:", error);
      });

      /** Toast notification (react, tag, v.v.) từ server */
      connection.on("ReceiveToastNotification", (fromUserId: string, _messageId: string, emoji: string) => {
        // Không hiện toast nếu là chính mình
        const currentUserId = useAuthStore?.getState?.()?.user?._id;
        if (fromUserId === currentUserId) return;
        toast(`${emoji} Ai đó đã react tin nhắn của bạn`, { duration: 3000 });
      });

      /** Cập nhật nội dung message khi được chỉnh sửa */
      connection.on(
        "MessageUpdateNotify",
        (conversationId: string, messageId: string, newContent: string) => {
          useChatStore.getState().updateMessageContent(conversationId, messageId, newContent);
        }
      );

      /** Xóa message khỏi store khi bị xóa */
      connection.on(
        "MessageDeleteNotify",
        (conversationId: string, messageId: string) => {
          useChatStore.getState().removeMessage(conversationId, messageId);
        }
      );

      /** Cập nhật reaction realtime */
      connection.on(
        "MessageReactNotify",
        (conversationId: string, messageId: string, emoji: string, fromUserId: string) => {
          // BỎ QUA nếu là chính mình react – useChatHub đã optimistic update rồi
          const currentUserId = useAuthStore?.getState?.()?.user?._id;
          if (currentUserId && fromUserId === currentUserId) return;

          console.log("[SignalR] MessageReactNotify (other user):", { conversationId, messageId, emoji, fromUserId });
          useChatStore.getState().updateMessageReactions(messageId, emoji, fromUserId);
        }
      );

      // ──── Reconnect handler: rejoin tất cả groups ────
      connection.onreconnected(() => {
        console.log("[SignalR] ChatHub reconnected – rejoining all groups...");
        set({ isConnected: true });
        rejoinAllGroups();
      });

      connection.onreconnecting(() => {
        console.warn("[SignalR] ChatHub reconnecting...");
        set({ isConnected: false });
      });

      connection.onclose(() => {
        console.warn("[SignalR] ChatHub connection closed");
        set({ isConnected: false });
      });

      // Kết nối
      await connection.start();
      set({ chatConnection: connection, isConnected: true });
      console.log("[SignalR] ChatHub connected");

      // Tự động join tất cả conversations hiện có
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
    if (
      presenceConnection &&
      presenceConnection.state !== HubConnectionState.Disconnected
    ) {
      return; // Đã kết nối rồi
    }

    try {
      const connection = await createPresenceConnection();

      /** Khi user khác online */
      connection.on("UserOnline", (userId: string) => {
        console.log("[SignalR Presence] UserOnline:", userId);
        set((state) => ({
          onlineUsers: state.onlineUsers.includes(userId)
            ? state.onlineUsers
            : [...state.onlineUsers, userId],
        }));
      });

      /** Khi user khác offline */
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

      // Lấy danh sách online users ngay sau khi kết nối
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

    // Optimistic update: hiện tin nhắn ngay cho người gửi trước khi server phản hồi
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
      // Rollback optimistic message nếu gửi thất bại
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
