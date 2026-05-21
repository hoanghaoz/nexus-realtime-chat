import api from "./api";
import type { Conversation, Message } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import type { FriendResponseDto } from "./friendService";
import { groupService } from "./groupService";

const PAGE_LIMIT = 50;
const GROUP_PARTICIPANTS_CACHE_KEY = "group-participants-cache";

export interface FetchMessagesResponse {
  messages: Message[];
  nextCursor?: string | null;
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
  mentionedUsersId?: string[];
}

function readString(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
  }
  return "";
}

function unwrapPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const source = data as Record<string, unknown>;
  return source.data ?? source.result ?? source.value ?? data;
}

function readParticipantsCache(): Record<string, Conversation["participants"]> {
  try {
    const stored = localStorage.getItem(GROUP_PARTICIPANTS_CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function cacheConversationParticipants(
  conversationId: string,
  participants: Conversation["participants"]
) {
  if (!conversationId) return;
  try {
    const cache = readParticipantsCache();
    cache[conversationId] = participants;
    localStorage.setItem(GROUP_PARTICIPANTS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

export function getCachedConversationParticipants(conversationId: string) {
  return readParticipantsCache()[conversationId] ?? [];
}

function normalizeParticipants(item: any, currentUserId: string): Conversation["participants"] {
  const friendsById = new Map<string, FriendResponseDto>();
  const rawFriends = (() => {
    try {
      const stored = localStorage.getItem("friend-cache");
      return stored ? JSON.parse(stored) as FriendResponseDto[] : [];
    } catch {
      return [];
    }
  })();
  for (const friend of rawFriends) {
    friendsById.set(friend.id, friend);
  }

  const rawParticipants =
    item.participants ??
    item.members ??
    item.users ??
    item.participantIds ??
    item.memberIds ??
    [];

  if (!Array.isArray(rawParticipants)) return [];

  return rawParticipants.reduce<Conversation["participants"]>((result, participant: any) => {
      const id =
        typeof participant === "string"
          ? participant
          : readString(
              participant,
              "_id",
              "id",
              "userId",
              "memberId",
              "participantId",
              "UserId"
            );
      if (!id) return result;

      const friend = friendsById.get(id);
      const isCurrentUser = id === currentUserId;
      const displayName =
        typeof participant === "string"
          ? friend?.displayName || (isCurrentUser ? "Bạn" : id)
          : readString(
              participant,
              "displayName",
              "userName",
              "username",
              "name",
              "fullName",
              "DisplayName",
              "UserName"
            ) || friend?.displayName || (isCurrentUser ? "Bạn" : id);

      const avatarUrl =
        typeof participant === "string"
          ? friend?.avatarUrl ?? null
          : readString(participant, "avatarUrl", "avatar", "displayAvatar", "AvatarUrl") ||
            friend?.avatarUrl ||
            null;

      result.push({
        _id: id,
        displayName,
        avatarUrl,
        joinedAt:
          typeof participant === "string"
            ? ""
            : readString(participant, "joinedAt", "createdAt", "JoinedAt"),
      });
      return result;
    }, []);
}

function normalizeConversation(item: any, currentUserId: string): Conversation {
  const isGroup =
    item.typeRoom === "Group" ||
    item.typeRoom === "group" ||
    item.typeRoom === "GROUP" ||
    item.roomType === 2 ||
    item.typeRoom === 2;
  const isAdmin = item.role === "admin";
  const conversationId =
    item.conversationId || item.id || item._id || item.conversationID || "";
  const directUserId = isGroup
    ? undefined
    : readString(
        item,
        "userId",
        "friendId",
        "otherUserId",
        "targetUserId",
        "participantId",
        "receiverId"
      );
  const displayName = item.displayName || item.name || "Unknown";
  const displayAvatar = item.displayAvatar || item.avatarUrl || item.avatar || null;
  const apiParticipants = normalizeParticipants(item, currentUserId);
  const cachedParticipants = getCachedConversationParticipants(conversationId);
  const participants =
    apiParticipants.length > 0 ? apiParticipants : cachedParticipants;

  if (isGroup && apiParticipants.length > 0) {
    cacheConversationParticipants(conversationId, apiParticipants);
  }

  const rawLastMsg = item.lastMessage ?? item.LastMessage ?? null;
  return {
    _id: conversationId,
    type: isGroup ? "group" : "direct",
    directUserId,
    group: {
      name: displayName || "Nhóm",
      createdBy: isAdmin ? currentUserId : "__non_admin__",
    },
    participants: isGroup
      ? participants
      : [
          {
            _id: currentUserId || "self",
            displayName: "Bạn",
            avatarUrl: null,
            joinedAt: "",
          },
          {
            _id: directUserId || "other-" + conversationId,
            displayName,
            avatarUrl: displayAvatar,
            joinedAt: "",
          },
        ],
    lastMessageAt:
      rawLastMsg?.createdAt ||
      rawLastMsg?.CreatedAt ||
      item.lastMessageAt ||
      item.updatedAt ||
      new Date().toISOString(),
    seenBy: [],
    lastMessage: rawLastMsg
      ? {
          _id:
            rawLastMsg.messageId ||
            rawLastMsg.MessageId ||
            rawLastMsg._id ||
            "preview-" + conversationId,
          content:
            rawLastMsg.content ??
            rawLastMsg.Content ??
            rawLastMsg.text ??
            "",
          createdAt:
            rawLastMsg.createdAt ||
            rawLastMsg.CreatedAt ||
            "",
          sender: {
            _id:
              rawLastMsg.userId ||
              rawLastMsg.UserId ||
              rawLastMsg.senderId ||
              "",
            displayName:
              rawLastMsg.senderName ||
              rawLastMsg.displayName ||
              "",
          },
        }
      : null,
    unreadCounts: {},
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
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
    const payload = unwrapPayload(res.data);
    const rawList: any[] = Array.isArray(payload) ? payload : [];
    const currentUserId = useAuthStore.getState().user?._id || "";

    return rawList.map((item: any) => normalizeConversation(item, currentUserId));
  },

  /**
   * Lấy chi tiết conversation theo ID (gọi API mới thêm)
   */
  fetchConversationDetail: async (conversationId: string): Promise<Conversation> => {
    const res = await api.get(`/conversation/${conversationId}`);
    const { user } = useAuthStore.getState();
    const currentUserId = user?._id || "";
    const conversation = normalizeConversation(res.data?.data || res.data, currentUserId);
    
    // Lưu cache participants để group chat không bị mất avatar
    if (conversation.participants && conversation.participants.length > 0) {
      cacheConversationParticipants(conversation._id, conversation.participants);
    }
    
    return conversation;
  },

  /** Tìm kiếm hội thoại theo keyword */
  searchConversations: async (keyword: string): Promise<Conversation[]> => {
    const res = await api.get("/conversation/search", {
      params: { keyword },
    });
    // Apply same mapping
    const payload = unwrapPayload(res.data);
    if (Array.isArray(payload)) {
      const rawList: any[] = payload;
      const currentUserId = useAuthStore.getState().user?._id || "";
      return rawList.map((item: any) => normalizeConversation(item, currentUserId));
    }
    return [];
  },

  /** Tạo hoặc lấy hội thoại riêng với một user */
  createDirectConversation: async (friend: FriendResponseDto): Promise<Conversation> => {
    const currentUserId = useAuthStore.getState().user?._id || "";
    const requests = [
      () => api.post("/conversation/direct", { receiverId: friend.id }),
      () => api.post("/conversation/direct", { targetUserId: friend.id }),
      () => api.post("/conversation/create-direct", { receiverId: friend.id }),
      () => api.post("/conversation/create", { typeRoom: "Direct", participantIds: [friend.id] }),
      () => api.post("/conversation/create", { roomType: 1, participantIds: [friend.id] }),
    ];

    for (const request of requests) {
      try {
        const res = await request();
        const payload = unwrapPayload(res.data);
        const raw = Array.isArray(payload) ? payload[0] : payload;
        const conversation = normalizeConversation(raw, currentUserId);
        if (conversation._id) {
          conversation.directUserId = friend.id;
          conversation.participants = [
            {
              _id: currentUserId || "self",
              displayName: "Bạn",
              avatarUrl: null,
              joinedAt: conversation.createdAt,
            },
            {
              _id: friend.id,
              displayName: friend.displayName || friend.username,
              avatarUrl: friend.avatarUrl ?? null,
              joinedAt: conversation.createdAt,
            },
          ];
          return conversation;
        }
      } catch {
        // Try the next known direct-chat endpoint shape.
      }
    }

    const fallbackGroup = await groupService.createGroup({
      name: friend.displayName || friend.username,
      participantIds: [friend.id],
    });
    const createdAt = fallbackGroup.createdAt || new Date().toISOString();
    return {
      _id: fallbackGroup.id,
      type: "direct",
      directUserId: friend.id,
      group: {
        name: friend.displayName || friend.username,
        createdBy: fallbackGroup.createdBy || currentUserId,
      },
      participants: [
        {
          _id: currentUserId || "self",
          displayName: "Bạn",
          avatarUrl: null,
          joinedAt: createdAt,
        },
        {
          _id: friend.id,
          displayName: friend.displayName || friend.username,
          avatarUrl: friend.avatarUrl ?? null,
          joinedAt: createdAt,
        },
      ],
      lastMessageAt: createdAt,
      seenBy: [],
      lastMessage: null,
      unreadCounts: {},
      createdAt,
      updatedAt: createdAt,
    };
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

    const mapMessage = (item: any): Message => {
      const firstAttachment = item.attachments?.[0];
      const isImageAttachment = firstAttachment?.type?.startsWith("image") ||
        /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(firstAttachment?.fileName ?? firstAttachment?.name ?? "");
      return {
        _id: item.messageId || item._id,
        conversationId: item.conversationId,
        senderId: item.userId || item.senderId,
        content: item.isDeleted ? null : (item.content ?? null),
        isDeleted: item.isDeleted ?? false,
        deletedText: item.isDeleted ? "Tin nhắn đã bị xóa" : undefined,
        imgUrl: firstAttachment
          ? isImageAttachment
            ? (firstAttachment.url || firstAttachment.fileUrl)
            : null
          : null,
        // Lưu thêm thông tin file không phải ảnh
        ...(firstAttachment && !isImageAttachment ? {
          fileAttachment: {
            url: firstAttachment.url || firstAttachment.fileUrl || "",
            name: firstAttachment.fileName || firstAttachment.name || "file",
            size: firstAttachment.fileSize || firstAttachment.size || 0,
            type: firstAttachment.type || firstAttachment.mediaType || "file",
          }
        } : {}),
        updatedAt: item.editedAt ?? null,
        createdAt: item.createdAt,
        replyToMessageId: item.replyToMessageId ?? null,
        reactions: Array.isArray(item.reactions)
          ? item.reactions.map((r: any) => ({
              userId: r.fromUserId || r.userId || "",
              type: r.emoji || r.type || "",
            }))
          : [],
      };
    };

    let rawMessages: any[];
    let nextCursor: string | null = null;

    if (Array.isArray(res.data)) {
      rawMessages = res.data;
    } else {
      const payload = unwrapPayload(res.data);
      if (Array.isArray(payload)) {
        rawMessages = payload;
      } else {
        const source = payload as Record<string, any>;
        rawMessages = source.messages ?? source.items ?? source.data ?? [];
        nextCursor = source.nextCursor ?? source.cursor ?? null;
      }
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
