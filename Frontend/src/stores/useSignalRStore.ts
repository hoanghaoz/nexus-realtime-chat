import { create } from "zustand";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { createChatConnection } from "@/services/signalr";
import { useChatStore } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";
import type { Message, Conversation } from "@/types/chat";

interface SignalRState {
  chatConnection: HubConnection | null;
  presenceConnection: HubConnection | null;
  onlineUsers: string[];
  isConnected: boolean;

  connectChat: () => Promise<void>;
  disconnectChat: () => Promise<void>;
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
 * useSignalRStore – quản lý kết nối SignalR với ChatHub.
 * Thay thế useSocketStore của Moji (socket.io → SignalR).
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
 *   UserTypingNotify(userId, conversationId, isTyping) → (TODO: UI indicator)
 *   MessageUpdateNotify(conversationId, messageId, newContent) → (TODO: edit)
 *   MessageDeleteNotify(conversationId, messageId)             → (TODO: delete)
 *   ReceiveErrorMessage(error)                  → log error
 */
export const useSignalRStore = create<SignalRState>((set, get) => ({
  chatConnection: null,
  presenceConnection: null,
  onlineUsers: [],
  isConnected: false,

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
        useChatStore.getState().addMessage(message);
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

        // Backend trả về GroupResponseDto (có id, name, roomType, createdBy)
        // Cần map sang cấu trúc Conversation của Frontend
        const conversation: Conversation = {
          _id: id,
          type: isDirect ? "direct" : "group",
          group: {
            name,
            createdBy,
          },
          participants: participants as Conversation["participants"], // Mặc định rỗng nếu backend ko gửi
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
          // Nếu không bỏ qua sẽ double-toggle (on → off)
          const currentUserId = useAuthStore?.getState?.()?.user?._id;
          if (currentUserId && fromUserId === currentUserId) return;

          console.log("[SignalR] MessageReactNotify (other user):", { conversationId, messageId, emoji, fromUserId });
          useChatStore.getState().updateMessageReactions(messageId, emoji, fromUserId);
        }
      );

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

  sendMessage: async (dto) => {
    const { chatConnection } = get();
    if (!chatConnection || chatConnection.state !== HubConnectionState.Connected) {
      console.warn("[SignalR] Not connected, cannot send message");
      return;
    }
    await chatConnection.invoke("SendMessage", dto);
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
