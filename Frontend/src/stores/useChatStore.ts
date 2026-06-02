import { create } from "zustand";
import { conversationService } from "@/services/conversationService";
import type { ChatState } from "@/types/store";
import type { Conversation, Message } from "@/types/chat";
import type { FriendResponseDto } from "@/services/friendService";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore";


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
          // Reset unread count khi user mở conversation
          get().markConversationRead(id);
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

      /** Reset unread count khi mở conversation */
      markConversationRead: (conversationId: string) => {
        const userId = (useAuthStore as any)?.getState?.()?.user?._id;
        if (!userId) return;
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversationId
              ? { ...c, unreadCounts: { ...c.unreadCounts, [userId]: 0 } }
              : c
          ),
        }));
      },

      /** Lấy chi tiết conversation để load danh sách member và lastMessage */
      fetchConversationDetail: async (conversationId: string): Promise<void> => {
        try {
          const res = await conversationService.fetchConversationDetail(conversationId);
          // Merge vào store: giữ nguyên type từ list (không bị ghi đè)
          // chỉ cập nhật participants, lastMessage, group name
          set((state) => ({
            conversations: state.conversations.map((c) => {
              if (c._id !== conversationId) return c;
              return {
                ...c,
                type: res.type, // Update type in case it's a fallback direct chat
                directUserId: res.directUserId || c.directUserId,
                participants: res.participants.length > 0 ? res.participants : c.participants,
                lastMessage: res.lastMessage ?? c.lastMessage,
                lastMessageAt: res.lastMessageAt || c.lastMessageAt,
                group: {
                  ...c.group,
                  name: res.group?.name || c.group?.name || "",
                },
              };
            }),
          }));
        } catch (error) {
          console.error("Lỗi khi fetchConversationDetail:", error);
        }
      },

      /** Lấy danh sách conversations */
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const newConversations = await conversationService.fetchConversations();
          
          set((state) => {
            const oldMap = new Map(state.conversations.map(c => [c._id, c]));
            const merged = newConversations.map(c => {
               const old = oldMap.get(c._id);
               // Preserve "direct" type, directUserId, and participants from previous fetchConversationDetail
               if (old && old.type === "direct") {
                 return { 
                   ...c, 
                   type: "direct" as "direct", 
                   directUserId: old.directUserId, 
                   participants: old.participants.length > 0 ? old.participants : c.participants
                 };
               }
               // Keep old participants if the new one doesn't have them
               if (old && c.participants.length === 0 && old.participants.length > 0) {
                 return { ...c, participants: old.participants };
               }
               return c;
            });
            return { conversations: merged };
          });

          // Fetch detail cho những conversation chưa có thông tin participants (mới e.g. từ SignalR)
          const { conversations, fetchConversationDetail } = get();
          for (const conv of conversations) {
            if (conv.type === "group" && (!conv.participants || conv.participants.length === 0)) {
              fetchConversationDetail(conv._id).catch(console.error);
            }
          }
        } catch (error) {
          console.error("Lỗi khi fetchConversations:", error);
        } finally {
          set({ convoLoading: false });
        }
      },

      /** Mở hoặc tạo hội thoại riêng với bạn bè (không tạo trùng) */
      startDirectChat: async (friend: FriendResponseDto) => {
        // Kiểm tra bằng directUserId (chính xác nhất)
        const existingConvo = get().conversations.find(
          (c) =>
            (c.type === "direct" || (c.type === "group" && c.participants.length === 2)) &&
            (
              c.directUserId === friend.id ||
              c.participants.some((p) => p._id === friend.id)
            )
        );

        if (existingConvo) {
          set({ activeConversationId: existingConvo._id });
          return;
        }

        try {
          set({ convoLoading: true });
          const conversation = await conversationService.createDirectConversation(friend);

          // Backend có thể trả về conversation đã tồn tại (idempotent)
          // Nếu đã có trong store rồi thì chỉ cần active lên, không thêm mới
          const alreadyInStore = get().conversations.find((c) => c._id === conversation._id);
          if (alreadyInStore) {
            set({ activeConversationId: conversation._id });
          } else {
            get().addConversation(conversation);
          }
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

          // Backend hardcode Take(20) nên lần đầu mở conversation ta tự load thêm 2 trang nữa
          // để có ít nhất ~60 tin nhắn, đảm bảo trải nghiệm không bị cụt
          const isFirstLoad = !current; // current === undefined nghĩa là chưa load lần nào
          if (isFirstLoad && cursor) {
            // Load trang 2
            const page2 = await conversationService.fetchMessages(convoId, cursor);
            set((state) => {
              const existing = state.messages[convoId]?.items ?? [];
              const combined = [...page2.messages, ...existing];
              const merged = combined
                .filter((m, idx, arr) => arr.findIndex((x) => x._id === m._id) === idx)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              return {
                messages: {
                  ...state.messages,
                  [convoId]: {
                    items: merged,
                    hasMore: !!page2.nextCursor,
                    nextCursor: page2.nextCursor ?? null,
                  },
                },
              };
            });

            // Load trang 3 nếu vẫn còn
            if (page2.nextCursor) {
              const page3 = await conversationService.fetchMessages(convoId, page2.nextCursor);
              set((state) => {
                const existing = state.messages[convoId]?.items ?? [];
                const combined = [...page3.messages, ...existing];
                const merged = combined
                  .filter((m, idx, arr) => arr.findIndex((x) => x._id === m._id) === idx)
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                return {
                  messages: {
                    ...state.messages,
                    [convoId]: {
                      items: merged,
                      hasMore: !!page3.nextCursor,
                      nextCursor: page3.nextCursor ?? null,
                    },
                  },
                };
              });
            }
          }
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
        // Cập nhật lastMessage và tăng unread count nếu không phải active conversation
        set((state) => {
          const isActive = state.activeConversationId === convoId;
          const currentUserId = (useAuthStore as any)?.getState?.()?.user?._id;
          const isFromMe = message.senderId === currentUserId;

          return {
            conversations: state.conversations.map((c) => {
              if (c._id !== convoId) return c;
              const updatedUnread =
                !isActive && !isFromMe && currentUserId
                  ? { ...c.unreadCounts, [currentUserId]: (c.unreadCounts?.[currentUserId] ?? 0) + 1 }
                  : c.unreadCounts;
              return {
                ...c,
                lastMessageAt: message.createdAt,
                lastMessage: {
                  _id: message._id,
                  content: message.content ?? "",
                  createdAt: message.createdAt,
                  sender: { _id: message.senderId, displayName: "" },
                },
                unreadCounts: updatedUnread,
              };
            }),
          };
        });
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
                      // Bảo vệ type: "direct" nếu nó đã là direct chat, tránh bị fallback đè lên
                      type: existing.type === "direct" ? "direct" : conversation.type,
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

