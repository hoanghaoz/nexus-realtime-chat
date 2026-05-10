import type { User } from "./user";
import type { Conversation, Message } from "./chat";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  /** Đăng ký – Nexus chỉ cần username + password */
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
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
  fetchMessages: (conversationId?: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateConversation: (conversation: Partial<Conversation> & { _id: string }) => void;
  addConversation: (conversation: Conversation) => void;
}
