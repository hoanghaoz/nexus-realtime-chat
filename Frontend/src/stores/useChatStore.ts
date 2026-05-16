import { create } from "zustand";
import { conversationService } from "@/services/conversationService";
import type { ChatState } from "@/types/store";
import type { Conversation, Message } from "@/types/chat";

/**
 * useChatStore – quản lý state conversations và messages.
 * Tuân thủ kiến trúc của Moji_RealtimeChatApp/stores/useChatStore.ts
 *
 * Khác biệt Nexus vs Moji:
 * - REST: GET /api/conversation/list (không phải /conversations)
 * - REST: GET /api/message/conversation-messages?conversationId=&cursor=
 * - Gửi tin nhắn thực hiện qua SignalR ChatHub.SendMessage (xem useSignalRStore)
 * - Không có markAsSeen REST endpoint (Nexus dùng SignalR)
 */
export const useChatStore = create<ChatState>()(
  (set, get) => ({
    conversations: [],
    messages: {},
    activeConversationId: null,
    convoLoading: false,
    messageLoading: false,
    loading: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),

      reset: () =>
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
          loading: false,
        }),

      /** Lấy danh sách conversations */
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const conversations = await conversationService.fetchConversations();
          set({ conversations }); // Overwrite with fresh data from API
        } catch (error) {
          console.error("Lỗi khi fetchConversations:", error);
        } finally {
          set({ convoLoading: false });
        }
      },

      /** Lấy messages theo conversationId với cursor-based pagination */
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const convoId = conversationId ?? activeConversationId;
        if (!convoId) return;

        const current = messages[convoId];
        const nextCursor = current?.nextCursor === undefined ? "" : current.nextCursor;
        if (nextCursor === null) return; // Đã load hết

        set({ messageLoading: true });
        try {
          const { messages: fetched, nextCursor: cursor } =
            await conversationService.fetchMessages(convoId, nextCursor || undefined);

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            // Merge (older pages prepended), then sort ASC by createdAt
            const combined = prev.length > 0 ? [...fetched, ...prev] : fetched;
            const merged = combined
              .filter((m, idx, arr) => arr.findIndex((x) => x._id === m._id) === idx) // deduplicate
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi khi fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },

      /** Thêm message mới vào store (gọi từ SignalR handler) */
      addMessage: (message: Message) => {
        const convoId = message.conversationId;
        set((state) => {
          const convoMessages = state.messages[convoId];
          const currentItems = convoMessages?.items ?? [];
          // Tránh duplicate
          if (currentItems.some((m) => m._id === message._id)) return state;
          return {
            messages: {
              ...state.messages,
              [convoId]: {
                items: [...currentItems, message],
                hasMore: convoMessages?.hasMore ?? false,
                nextCursor: convoMessages?.nextCursor ?? null,
              },
            },
          };
        });
        // Cập nhật lastMessage trong conversations
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === convoId
              ? { ...c, lastMessage: null, lastMessageAt: message.createdAt }
              : c
          ),
        }));
      },

      /** Cập nhật conversation (gọi từ SignalR handler) */
      updateConversation: (conversation: Partial<Conversation> & { _id: string }) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },

      /** Thêm conversation mới vào đầu list (gọi khi tạo group mới qua SignalR) */
      addConversation: (conversation: Conversation) => {
        set((state) => {
          const existing = state.conversations.find((c) => c._id === conversation._id);
          if (existing) {
            const shouldKeepExistingParticipants =
              existing.participants.length > 0 && conversation.participants.length === 0;

            return {
              conversations: state.conversations.map((c) =>
                c._id === conversation._id
                  ? {
                      ...c,
                      ...conversation,
                      participants: shouldKeepExistingParticipants
                        ? existing.participants
                        : conversation.participants,
                    }
                  : c
              ),
              activeConversationId: conversation._id,
            };
          }

          return {
            conversations: [conversation, ...state.conversations],
            activeConversationId: conversation._id,
          };
        });
      },
  })
);
