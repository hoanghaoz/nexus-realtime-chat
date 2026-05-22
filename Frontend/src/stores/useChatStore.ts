import { create } from "zustand";
import { conversationService } from "@/services/conversationService";
import type { ChatState } from "@/types/store";
import type { Conversation, Message } from "@/types/chat";
import type { FriendResponseDto } from "@/services/friendService";
import { toast } from "sonner";

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

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
        if (id) {
          get().fetchConversationDetail(id);
        }
      },

      reset: () =>
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
          loading: false,
        }),

      /** Lấy chi tiết conversation để load danh sách member (đặc biệt cho nhóm) */
      fetchConversationDetail: async (conversationId: string) => {
        try {
          const conversation = await conversationService.fetchConversationDetail(conversationId);
          get().updateConversation(conversation);
        } catch (error) {
          console.error("Lỗi khi fetchConversationDetail:", error);
        }
      },

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

      /** Mở hoặc tạo hội thoại riêng với bạn bè */
      startDirectChat: async (friend: FriendResponseDto) => {
        const existingConvo = get().conversations.find(
          (c) =>
            c.type === "direct" &&
            (c.directUserId === friend.id ||
              c.participants.some((p) => p._id === friend.id) ||
              c.participants.some(
                (p) =>
                  p.displayName === friend.displayName ||
                  p.displayName === friend.username
              ) ||
              c.group?.name === friend.displayName ||
              c.group?.name === friend.username)
        );

        if (existingConvo) {
          set({ activeConversationId: existingConvo._id });
          return;
        }

        try {
          set({ convoLoading: true });
          const conversation =
            await conversationService.createDirectConversation(friend);
          get().addConversation(conversation);
        } catch (error) {
          console.error("Lỗi khi startDirectChat:", error);
          toast.error("Không thể mở hội thoại riêng. Vui lòng thử lại!");
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
        // Cập nhật lastMessage với nội dung thực (không để null)
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === convoId
              ? {
                  ...c,
                  lastMessageAt: message.createdAt,
                  lastMessage: {
                    _id: message._id,
                    content: message.content ?? "",
                    createdAt: message.createdAt,
                    sender: { _id: message.senderId, displayName: "" },
                  },
                }
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

      /** Cập nhật content của message sau khi chỉnh sửa (từ SignalR MessageUpdateNotify) */
      updateMessageContent: (conversationId: string, messageId: string, newContent: string) => {
        set((state) => {
          const convoMessages = state.messages[conversationId];
          if (!convoMessages) return state;
          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convoMessages,
                items: convoMessages.items.map((m) =>
                  m._id === messageId
                    ? { ...m, content: newContent, updatedAt: new Date().toISOString() }
                    : m
                ),
              },
            },
          };
        });
      },

      /**
       * Soft-delete message: để lại tombstone "Tin nhắn đã bị xóa"
       * Thay vì xóa hẳn khỏi store, giữ lại message nhưng đánh dấu isDeleted
       */
      removeMessage: (conversationId: string, messageId: string) => {
        set((state) => {
          const convoMessages = state.messages[conversationId];
          if (!convoMessages) return state;
          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convoMessages,
                items: convoMessages.items.map((m) =>
                  m._id === messageId
                    ? { ...m, content: null, isDeleted: true, deletedText: "Tin nhắn đã bị xóa" }
                    : m
                ),
              },
            },
          };
        });
      },

      /**
       * Thu hồi message: tombstone "Tin nhắn đã bị thu hồi"
       */
      recallMessageInStore: (messageId: string) => {
        set((state) => {
          const updatedMessages = { ...state.messages };
          for (const [convoId, convoData] of Object.entries(updatedMessages)) {
            const idx = convoData.items.findIndex((m) => m._id === messageId);
            if (idx === -1) continue;
            updatedMessages[convoId] = {
              ...convoData,
              items: convoData.items.map((m, i) =>
                i === idx
                  ? { ...m, content: null, isDeleted: true, deletedText: "Tin nhắn đã bị thu hồi" }
                  : m
              ),
            };
            break;
          }
          return { messages: updatedMessages };
        });
      },

      /** Toggle/cập nhật reaction của một message (từ SignalR MessageReactNotify) */
      updateMessageReactions: (messageId: string, emoji: string, fromUserId: string) => {
        set((state) => {
          // Tìm conversationId chứa message này
          const updatedMessages = { ...state.messages };
          for (const [convoId, convoData] of Object.entries(updatedMessages)) {
            const idx = convoData.items.findIndex((m) => m._id === messageId);
            if (idx === -1) continue;

            const msg = convoData.items[idx];
            const existingReactions = msg.reactions ?? [];
            const userReactionIdx = existingReactions.findIndex(
              (r) => r.userId === fromUserId && r.type === emoji
            );

            let newReactions;
            if (userReactionIdx >= 0) {
              // Toggle off – xóa reaction nếu đã tồn tại
              newReactions = existingReactions.filter((_, i) => i !== userReactionIdx);
            } else {
              // Thêm reaction mới (hoặc thay thế reaction cũ của user này)
              const filteredOld = existingReactions.filter((r) => r.userId !== fromUserId);
              newReactions = [...filteredOld, { userId: fromUserId, type: emoji }];
            }

            updatedMessages[convoId] = {
              ...convoData,
              items: convoData.items.map((m, i) =>
                i === idx ? { ...m, reactions: newReactions } : m
              ),
            };
            break;
          }
          return { messages: updatedMessages };
        });
      },
  })
);

