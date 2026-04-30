import type { Conversation, Message } from "./chat";

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  message: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite scroll
      nextCursor?: string; // for pagination
    }
  >;
  activeConversationId: string | null;
  loading: boolean;
  reset: () => void;
  setActiveConversation: (id: string | null) => void;
}
