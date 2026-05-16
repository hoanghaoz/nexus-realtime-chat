import api from "./api";
import type { Conversation, Message } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";

const PAGE_LIMIT = 50;

export interface FetchMessagesResponse {
  messages: Message[];
  nextCursor?: string | null;
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
  mentionedUsersId?: string[];
}

/**
 * conversationService – tầng gọi HTTP REST API cho Conversation & Message.
 *
 * Backend ConversationResponse schema:
 *   conversationId, typeRoom (1=Direct, 2=Group), displayName, displayAvatar,
 *   lastMessage { content, createdAt }, isOnline, role ("admin" | "member")
 *
 * Backend MessageResponseDto schema:
 *   messageId, userId, content, conversationId, createdAt, attachments[], reactions[],
 *   mentionUser[], isDeleted, isEdited, isPending, deletedAt, editedAt
 */
export const conversationService = {
  /** Lấy danh sách cuộc hội thoại của user đang đăng nhập */
  fetchConversations: async (): Promise<Conversation[]> => {
    const res = await api.get("/conversation/list");
    const rawList: any[] = res.data.data || [];
    const currentUserId = useAuthStore.getState().user?._id || "";

    return rawList.map((item: any) => {
      // Backend dùng JsonStringEnumConverter → typeRoom là "Group"/"Direct" (string)
      // Fallback: nếu là số thì Group=2, Direct=1
      const isGroup =
        item.typeRoom === "Group" ||
        item.typeRoom === "group" ||
        item.typeRoom === 2;
      const isAdmin = item.role === "admin";

      return {
        _id: item.conversationId,
        type: isGroup ? "group" : "direct",
        group: {
          name: item.displayName || "Nhóm",
          // If current user is admin → their ID is createdBy
          createdBy: isAdmin ? currentUserId : "__non_admin__",
        },
        // For Direct chat: create a synthetic participant for the "other" person.
        // We need a real displayName so ChatHeader and GroupItem can show it.
        // We use a fixed sentinel ID so participants.find(p => p._id !== userId) works.
        participants: isGroup
          ? []
          : [
              {
                _id: currentUserId || "self",
                displayName: "Bạn",
                avatarUrl: null,
                joinedAt: "",
              },
              {
                _id: "other-" + item.conversationId, // unique sentinel per conversation
                displayName: item.displayName || "Unknown",
                avatarUrl: item.displayAvatar || null,
                joinedAt: "",
              },
            ],
        lastMessageAt: item.lastMessage?.createdAt || new Date().toISOString(),
        seenBy: [],
        lastMessage: item.lastMessage
          ? {
              _id: "preview-" + item.conversationId,
              content: item.lastMessage.content || "",
              createdAt: item.lastMessage.createdAt || "",
              sender: { _id: "", displayName: "" },
            }
          : null,
        unreadCounts: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  },

  /** Tìm kiếm hội thoại theo keyword */
  searchConversations: async (keyword: string): Promise<Conversation[]> => {
    const res = await api.get("/conversation/search", {
      params: { keyword },
    });
    // Apply same mapping
    if (Array.isArray(res.data.data)) {
      const rawList: any[] = res.data.data;
      const currentUserId = useAuthStore.getState().user?._id || "";
      return rawList.map((item: any) => {
        const isGroup =
            item.typeRoom === "Group" ||
            item.typeRoom === "group" ||
            item.typeRoom === 2;
        const isAdmin = item.role === "admin";
        return {
          _id: item.conversationId,
          type: isGroup ? "group" : "direct",
          group: {
            name: item.displayName || "Nhóm",
            createdBy: isAdmin ? currentUserId : "__non_admin__",
          },
          participants: isGroup
            ? []
            : [
                {
                  _id: currentUserId || "self",
                  displayName: "Bạn",
                  avatarUrl: null,
                  joinedAt: "",
                },
                {
                  _id: "other-" + item.conversationId,
                  displayName: item.displayName || "Unknown",
                  avatarUrl: item.displayAvatar || null,
                  joinedAt: "",
                },
              ],
          lastMessageAt: item.lastMessage?.createdAt || new Date().toISOString(),
          seenBy: [],
          lastMessage: item.lastMessage
            ? {
                _id: "preview-" + item.conversationId,
                content: item.lastMessage.content || "",
                createdAt: item.lastMessage.createdAt || "",
                sender: { _id: "", displayName: "" },
              }
            : null,
          unreadCounts: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
    }
    return [];
  },

  /** Lấy tin nhắn theo conversationId (cursor-based pagination) */
  fetchMessages: async (
    conversationId: string,
    cursor?: string | null
  ): Promise<FetchMessagesResponse> => {
    const params: Record<string, string> = {
      conversationId,
      limit: String(PAGE_LIMIT),
    };
    if (cursor) params.cursor = cursor;

    const res = await api.get("/message/conversation-messages", { params });

    const mapMessage = (item: any): Message => ({
      _id: item.messageId || item._id,
      conversationId: item.conversationId,
      senderId: item.userId || item.senderId,
      content: item.isDeleted ? null : (item.content ?? null),
      imgUrl: item.attachments?.length > 0 ? item.attachments[0].url : null,
      updatedAt: item.editedAt ?? null,
      createdAt: item.createdAt,
    });

    let rawMessages: any[];
    let nextCursor: string | null = null;

    if (Array.isArray(res.data)) {
      rawMessages = res.data;
    } else {
      rawMessages = res.data.messages ?? res.data.items ?? res.data ?? [];
      nextCursor = res.data.nextCursor ?? null;
    }

    if (!Array.isArray(rawMessages)) rawMessages = [];

    // Backend trả về DESC (mới nhất trước) → sort ASC (cũ nhất trước) để hiển thị đúng
    const messages = rawMessages
      .map(mapMessage)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return { messages, nextCursor };
  },
};
