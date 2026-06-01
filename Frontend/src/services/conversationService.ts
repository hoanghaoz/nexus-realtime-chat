import api from "./api";
import type { Conversation, Message } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import type { FriendResponseDto } from "./friendService";


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

type AttachmentLike = {
  url?: string;
  fileUrl?: string;
};

function readString(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
  }
  return "";
}

function getParticipantDisplayName(
  participant: unknown,
  id: string,
  currentUserId: string,
  friend?: FriendResponseDto
) {
  if (typeof participant === "string") {
    return friend?.displayName || (id === currentUserId ? "Bạn" : id);
  }

  return (
    readString(
      participant as Record<string, unknown>,
      "displayName",
      "userName",
      "username",
      "name",
      "fullName",
      "DisplayName",
      "UserName"
    ) ||
    friend?.displayName ||
    (id === currentUserId ? "Bạn" : id)
  );
}

function getParticipantAvatarUrl(participant: unknown, friend?: FriendResponseDto) {
  if (typeof participant === "string") {
    return friend?.avatarUrl ?? null;
  }

  return (
    readString(participant as Record<string, unknown>, "avatarUrl", "avatar", "displayAvatar", "AvatarUrl") ||
    friend?.avatarUrl ||
    null
  );
}

function getAttachmentImageUrl(firstAttachment: AttachmentLike | undefined, isImageAttachment: boolean) {
  if (!firstAttachment || !isImageAttachment) return null;
  return firstAttachment.url || firstAttachment.fileUrl;
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
    const displayName = getParticipantDisplayName(participant, id, currentUserId, friend);
    const avatarUrl = getParticipantAvatarUrl(participant, friend);

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
  // Backend dùng JsonStringEnumConverter → typeRoom: "Direct" | "Group"
  let isGroup =
    item.typeRoom === "Group" ||
    item.typeRoom === "group" ||
    item.typeRoom === "GROUP" ||
    item.TypeRoom === "Group" ||
    item.roomType === 2 ||
    item.typeRoom === 2 ||
    item.roomType === "Group" ||
    item.RoomType === "Group" ||
    item.RoomType === 2;
  const isAdmin = item.role === "admin";
  const conversationId =
    item.conversationId || item.id || item._id || item.conversationID || "";
    
  const displayName = item.displayName || item.name || "Unknown";
  let displayAvatar = item.displayAvatar || item.avatarUrl || item.avatar || null;
  const apiParticipants = normalizeParticipants(item, currentUserId);
  const cachedParticipants = getCachedConversationParticipants(conversationId);
  const participants =
    apiParticipants.length > 0 ? apiParticipants : cachedParticipants;

  // HACK: If it's a group but has exactly 2 participants, treat it as a direct chat.
  // This is because the backend lacks a create direct chat endpoint, so we fallback to creating groups.
  if (isGroup && participants.length === 2) {
    isGroup = false;
  }

  const otherParticipant = participants.find(p => p._id !== currentUserId && p._id !== "self");

  const directUserId = isGroup
    ? undefined
    : otherParticipant?._id || readString(
        item,
        "userId",
        "friendId",
        "otherUserId",
        "targetUserId",
        "participantId",
        "receiverId"
      );

  if (!isGroup && otherParticipant) {
    // For direct chats, ensure the name and avatar are the other person's
    if (displayName === "Unknown" || displayName === "Nhóm") {
       // Only overwrite if it looks like a generic name, or let backend name take precedence?
       // Actually, fallback groups use the friend's name, so displayName is already correct.
    }
    if (!displayAvatar && otherParticipant.avatarUrl) {
       displayAvatar = otherParticipant.avatarUrl;
    }
  }

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
            displayName: otherParticipant?.displayName || displayName,
            avatarUrl: displayAvatar,
            joinedAt: "",
          },
        ],
    lastMessageAt:
      rawLastMsg?.createdAt ||
      rawLastMsg?.CreatedAt ||
      item.lastMessageAt ||
      item.updatedAt ||
      item.createdAt ||
      "",
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
   * Lấy chi tiết conversation – map đúng ConversationDetailResponse từ backend.
   * Backend (JsonStringEnumConverter): typeRoom: "Direct"|"Group"
   * Participants: [{ userId, displayName, displayAvatar, isOnline, role }]
   */
  fetchConversationDetail: async (conversationId: string): Promise<Conversation> => {
    const res = await api.get(`/conversation/${conversationId}`);
    const { user } = useAuthStore.getState();
    const currentUserId = user?._id || "";
    const raw = res.data?.data || res.data;

    const isGroup =
      raw.typeRoom === "Group" || raw.typeRoom === "GROUP" || raw.typeRoom === "group" ||
      raw.TypeRoom === "Group" ||
      raw.roomType === 2 || raw.typeRoom === 2;

    // Map participants từ ConversationDetailResponse (camelCase: userId, displayAvatar)
    const rawParticipants: any[] = Array.isArray(raw.participants) ? raw.participants : [];
    const participants: Conversation["participants"] = rawParticipants
      .map((p: any) => ({
        _id: p.userId || p._id || p.id || "",
        displayName: p.displayName || p.DisplayName || p.userName || "",
        avatarUrl: p.displayAvatar || p.avatarUrl || p.avatar || null,
        joinedAt: p.joinedAt || "",
      }))
      .filter((p) => !!p._id);

    // Map lastMessage
    const rawLast = raw.lastMessage ?? raw.LastMessage ?? null;
    const lastMessage = rawLast
      ? {
          _id: rawLast.messageId || rawLast._id || "preview-" + conversationId,
          content: rawLast.content ?? rawLast.Content ?? rawLast.text ?? "",
          createdAt: rawLast.createdAt || rawLast.CreatedAt || "",
          sender: {
            _id: rawLast.userId || rawLast.senderId || "",
            displayName: rawLast.senderName || rawLast.displayName || "",
          },
        }
      : null;

    const displayName = raw.displayName || raw.DisplayName || raw.name || "Unknown";

    const conversation: Conversation = {
      _id: raw.conversationId || raw.id || conversationId,
      type: isGroup ? "group" : "direct",
      directUserId: isGroup ? undefined : rawParticipants.find((p) => p.userId !== currentUserId)?.userId,
      group: { name: displayName, createdBy: "" },
      participants,
      lastMessageAt: rawLast?.createdAt || rawLast?.CreatedAt || raw.updatedAt || "",
      seenBy: [],
      lastMessage,
      unreadCounts: {},
      createdAt: raw.createdAt || "",
      updatedAt: raw.updatedAt || "",
    };

    if (participants.length > 0) {
      cacheConversationParticipants(conversationId, participants);
    }

    return conversation;
  },

  /** Tìm kiếm hội thoại theo keyword */
  searchConversations: async (keyword: string): Promise<Conversation[]> => {
    const res = await api.get("/conversation/search", {
      params: { keyword },
    });
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
    const res = await api.post("/conversation/direct", { targetUserId: friend.id });
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

    throw new Error("Tạo hội thoại riêng thất bại");
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
    if (cursor) params.nextCursor = cursor;

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
        imgUrl: getAttachmentImageUrl(firstAttachment, isImageAttachment),
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
