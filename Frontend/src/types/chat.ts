export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  joinedAt: string;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
  avatarUrl?: string | null;
}

export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  directUserId?: string;
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Reaction {
  /** type/emoji string: "like" | "heart" | "haha" | "sad" | "wow" | "angry" */
  type: string;
  userId: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imgUrl?: string | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
  /** Soft-delete flag: message bị xóa hoặc thu hồi */
  isDeleted?: boolean;
  /** Nội dung tombstone: "Tin nhắn đã bị xóa" | "Tin nhắn đã bị thu hồi" */
  deletedText?: string;
  reactions?: Reaction[];
  /** ID của message gốc mà message này đang reply */
  replyToMessageId?: string | null;
  /** Số lượng reply trong thread của message này */
  threadReplyCount?: number;
  /** File đính kèm không phải ảnh (PDF, DOC, ZIP...) */
  fileAttachment?: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
}

export interface MessageThread {
  originalMessage: Message;
  replies: Message[];
}
