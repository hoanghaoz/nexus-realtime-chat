// Frontend/src/hooks/useChatHub.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useSignalRStore } from "@/stores/useSignalRStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/services/api";
import type { Message, MessageThread } from "@/types/chat";
import { toast } from "sonner";

function getNextTypingUsers(prev: string[], userId: string, isTyping: boolean) {
  if (!isTyping) {
    return prev.filter((id) => id !== userId);
  }

  return prev.includes(userId) ? prev : [...prev, userId];
}

/**
 * useChatHub – Custom Hook tập trung quản lý toàn bộ SignalR lifecycle và
 * tích hợp API liên quan đến chat.
 *
 * Các trách nhiệm:
 * 1. Real-time Core     – joinConversation khi activeConversationId thay đổi
 * 2. Presence & Typing  – typingUsers[], botTyping, sendTyping()
 * 3. Reaction           – sendReaction() gọi REST API + cập nhật store optimistically
 * 4. Thread Drawer      – openThread(), closeThread(), threadMessages, threadLoading
 * 5. Message Actions    – deleteMessage(), copyMessage()
 */
export function useChatHub() {
  const { chatConnection, sendTypingIndicator, joinConversation, leaveConversation } =
    useSignalRStore();
  const { activeConversationId, updateMessageReactions, removeMessage, recallMessageInStore } = useChatStore();
  const { user } = useAuthStore();

  // ─── Presence & Typing ───────────────────────────────────────────────────
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [botTyping, setBotTyping] = useState(false);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  /** Gửi typing indicator lên SignalR */
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return;
      sendTypingIndicator(activeConversationId, isTyping);
    },
    [activeConversationId, sendTypingIndicator]
  );

  /**
   * Gọi trong onChange của textarea.
   * Tự động quản lý debounce và stop-typing.
   */
  const handleTypingInput = useCallback(() => {
    if (!activeConversationId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingIndicator(activeConversationId, true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingIndicator(activeConversationId, false);
    }, 1500);
  }, [activeConversationId, sendTypingIndicator]);

  // Lắng nghe UserTypingNotify từ SignalR
  useEffect(() => {
    if (!chatConnection) return;

    const userTypingHandler = (userId: string, _convoId: string, isTyping: boolean) => {
      if (userId === user?._id) return; // Bỏ qua typing của chính mình
      setTypingUsers((prev) => getNextTypingUsers(prev, userId, isTyping));
    };

    chatConnection.on("UserTypingNotify", userTypingHandler);
    return () => chatConnection.off("UserTypingNotify", userTypingHandler);
  }, [chatConnection, user?._id]);

  // Lắng nghe ReceiveBotReply – bot đang trả lời
  useEffect(() => {
    if (!chatConnection) return;
    const botHandler = () => setBotTyping(false);
    chatConnection.on("ReceiveBotReply", botHandler);
    return () => chatConnection.off("ReceiveBotReply", botHandler);
  }, [chatConnection]);

  // Reset typing khi đổi conversation
  useEffect(() => {
    setTypingUsers([]);
    setBotTyping(false);
  }, [activeConversationId]);

  // ─── Join/Leave conversation room ────────────────────────────────────────
  const prevConvoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeConversationId) return;
    if (prevConvoIdRef.current && prevConvoIdRef.current !== activeConversationId) {
      leaveConversation(prevConvoIdRef.current).catch(console.error);
    }
    joinConversation(activeConversationId).catch(console.error);
    prevConvoIdRef.current = activeConversationId;
  }, [activeConversationId, joinConversation, leaveConversation]);

  // ─── Reactions ───────────────────────────────────────────────────────────
  /**
   * Gửi reaction lên REST API.
   * Backend sẽ phát SignalR MessageReactNotify để cập nhật store qua useSignalRStore handler.
   * Ta dùng optimistic update để UI phản hồi ngay.
   */
  const sendReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user?._id) return;
      // Optimistic update ngay lập tức
      updateMessageReactions(messageId, emoji, user._id);
      try {
        // C# record ReactMessageRequestDto dùng PascalCase: { Emoji, IsReacted }
        await api.put(`/message/react/${messageId}`, { Emoji: emoji, IsReacted: true });
      } catch (err: any) {
        // Rollback optimistic update nếu lỗi
        updateMessageReactions(messageId, emoji, user._id);
        console.error("[useChatHub] sendReaction error:", err);
        toast.error("Không thể react tin nhắn. Vui lòng thử lại!");
      }
    },
    [user?._id, updateMessageReactions]
  );

  // ─── Message Actions ─────────────────────────────────────────────────────
  /** Xóa tin nhắn (phía mình) – optimistic remove */
  const deleteMessage = useCallback(
    async (messageId: string, conversationId: string) => {
      removeMessage(conversationId, messageId);
      try {
        await api.delete(`/message/${messageId}`);
      } catch (err) {
        console.error("[useChatHub] deleteMessage error:", err);
        toast.error("Xóa tin nhắn thất bại. Vui lòng thử lại!");
      }
    },
    [removeMessage]
  );

  /**
   * Thu hồi tin nhắn – xóa cho tất cả mọi người.
   * Backend sẽ phát MessageDeleteNotify → useSignalRStore handler sẽ removeMessage cho mọi client.
   * Ta optimistic update ngay lập tức.
   */
  const recallMessage = useCallback(
    async (messageId: string) => {
      // Optimistic tombstone "đã thu hồi"
      recallMessageInStore(messageId);

      try {
        await api.delete(`/message/${messageId}`);
        toast.success("Đã thu hồi tin nhắn!");
      } catch (err: any) {
        console.error("[useChatHub] recallMessage error:", err);
        const status = err?.response?.status;
        if (status === 403) {
          toast.error("Bạn chỉ có thể thu hồi tin nhắn của chính mình.");
        } else {
          toast.error("Thu hồi tin nhắn thất bại. Vui lòng thử lại!");
        }
      }
    },
    [recallMessageInStore]
  );

  /** Sao chép nội dung message vào clipboard */
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => toast.success("Đã sao chép tin nhắn!"))
      .catch(() => toast.error("Không thể sao chép."));
  }, []);

  // ─── Thread Drawer ───────────────────────────────────────────────────────
  const [activeThreadMessageId, setActiveThreadMessageId] = useState<string | null>(null);
  const [threadData, setThreadData] = useState<MessageThread | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);

  const mapMessage = (item: any): Message => ({
    _id: item.messageId || item._id,
    conversationId: item.conversationId,
    senderId: item.userId || item.senderId,
    content: item.isDeleted ? null : (item.content ?? null),
    imgUrl: item.attachments?.length > 0 ? item.attachments[0].url : null,
    updatedAt: item.editedAt ?? null,
    createdAt: item.createdAt,
    replyToMessageId: item.replyToMessageId ?? null,
    reactions: Array.isArray(item.reactions)
      ? item.reactions.map((r: any) => ({
          userId: r.fromUserId || r.userId || "",
          type: r.emoji || r.type || "",
        }))
      : [],
  });

  const fetchThread = useCallback(async (messageId: string) => {
    setThreadLoading(true);
    setThreadData(null);
    try {
      const res = await api.get(`/message/${messageId}/thread`);
      // Backend có thể trả về trực tiếp { originalMessage, replies }
      // hoặc bọc trong { data: {...} }
      const raw = res.data?.data ?? res.data ?? res.data?.result;
      
      // Normalize: OriginalMessage (PascalCase) hoặc originalMessage (camelCase)
      const origRaw = raw?.originalMessage ?? raw?.OriginalMessage;
      const repliesRaw = raw?.replies ?? raw?.Replies ?? [];

      if (origRaw) {
        setThreadData({
          originalMessage: mapMessage(origRaw),
          replies: Array.isArray(repliesRaw) ? repliesRaw.map(mapMessage) : [],
        });
      } else {
        // API trả về nhưng không có originalMessage → set empty thread
        console.warn("[useChatHub] fetchThread: no originalMessage in response", raw);
        toast.error("Thread không có dữ liệu.");
      }
    } catch (err: any) {
      console.error("[useChatHub] fetchThread error:", err);
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("Bạn không có quyền xem thread này.");
      } else if (status === 404) {
        toast.error("Không tìm thấy tin nhắn.");
      } else {
        toast.error("Không thể tải thread. Vui lòng thử lại!");
      }
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const openThread = useCallback(
    (messageId: string) => {
      setActiveThreadMessageId(messageId);
      setThreadData(null);
      fetchThread(messageId);
    },
    [fetchThread]
  );

  const closeThread = useCallback(() => {
    setActiveThreadMessageId(null);
    setThreadData(null);
  }, []);

  // Đóng thread khi đổi conversation
  useEffect(() => {
    closeThread();
  }, [activeConversationId]);

  return {
    // Presence & Typing
    typingUsers,
    botTyping,
    sendTyping,
    handleTypingInput,

    // Reactions
    sendReaction,

    // Message Actions
    deleteMessage,
    recallMessage,
    copyMessage,

    // Thread Drawer
    activeThreadMessageId,
    openThread,
    closeThread,
    threadData,
    threadLoading,
  };
}
