import type { User } from "./user";
import type { Conversation, Message } from "./chat";
import type { FriendResponseDto } from "@/services/friendService";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User | null) => void;
  updateProfile: (data: any) => Promise<void>;
  fetchProfile: () => Promise<void>;
  /** Đăng ký – Nexus chỉ cần username + password */
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  clearState: () => void;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean;
      nextCursor?: string | null;
    }
  >;
  activeConversationId: string | null;
  convoLoading: boolean;
  messageLoading: boolean;
  loading: boolean;

  reset: () => void;
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchConversationDetail: (conversationId: string) => Promise<void>;
  startDirectChat: (friend: FriendResponseDto) => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateConversation: (
    conversation: Partial<Conversation> & { _id: string },
  ) => void;
  addConversation: (conversation: Conversation) => void;
  /** Cập nhật content của một message (edit realtime) */
  updateMessageContent: (conversationId: string, messageId: string, newContent: string) => void;
  /** Soft-delete một message (tombstone "đã bị xóa") */
  removeMessage: (conversationId: string, messageId: string) => void;
  /** Soft-delete một message với tombstone "đã bị thu hồi" */
  recallMessageInStore: (messageId: string) => void;
  /** Cập nhật reactions của một message (react realtime) */
  updateMessageReactions: (messageId: string, emoji: string, fromUserId: string) => void;
}
