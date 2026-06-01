// Frontend/src/components/Chat/nexus-chat/MessageList.tsx
import { useEffect, useRef, useCallback, useState } from "react";
import MessageBubble from "./MessageBubble";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFriendStore } from "@/stores/useFriendStore";
import type { Conversation } from "@/types/chat";

interface Props {
  conversation: Conversation | null;
  typingUsers?: string[]; // userIds đang gõ
  botTyping?: boolean;
  onReact?: (messageId: string, type: string) => void;
  onDelete?: (messageId: string, conversationId: string) => void;
  onRecall?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onOpenThread?: (messageId: string) => void;
}

type MessageWithSenderName = {
  senderName?: string;
};

type ConversationWithDisplayFallbacks = Conversation & {
  receiver?: {
    name?: string;
    avatarUrl?: string | null;
  };
  group?: Conversation["group"] & {
    avatarUrl?: string | null;
  };
};

/** Hiện timestamp phân cách nếu 2 tin nhắn liên tiếp cách nhau > 5 phút */
const TIMESTAMP_GAP_MS = 5 * 60 * 1000;

export default function MessageList({
  conversation,
  typingUsers = [],
  botTyping = false,
  onReact,
  onDelete,
  onRecall,
  onCopy,
  onOpenThread,
}: Readonly<Props>) {
  const { messages, fetchMessages, messageLoading } = useChatStore();
  const { user } = useAuthStore();
  const { friends } = useFriendStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);

  const convoId = conversation?._id;
  const convoMessages = convoId ? (messages[convoId]?.items ?? []) : [];
  const hasMore = convoId ? (messages[convoId]?.hasMore ?? false) : false;

  // Auto-scroll hoặc giữ scroll position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (prevScrollHeight > 0 && convoMessages.length > prevLengthRef.current) {
      // Khi load thêm tin nhắn cũ (prepend), phục hồi vị trí scroll
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = el.scrollTop + (newScrollHeight - prevScrollHeight);
      setPrevScrollHeight(0);
    } else {
      // Khi có tin nhắn mới (append), cuộn xuống cuối
      const isNewMessage = convoMessages.length > prevLengthRef.current;
      if (isNewMessage) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevLengthRef.current = convoMessages.length;
  }, [convoMessages.length, prevScrollHeight]);

  // Scroll xuống cuối ngay khi đổi conversation
  useEffect(() => {
    prevLengthRef.current = 0;
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }, 50);
  }, [convoId]);

  // Load messages lần đầu khi chọn conversation
  useEffect(() => {
    if (!convoId) return;
    if (!messages[convoId]) {
      fetchMessages(convoId);
    }
  }, [convoId]);

  // Infinite scroll – load thêm khi cuộn lên trên cùng
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || messageLoading) return;
    if (el.scrollTop < 80) {
      setPrevScrollHeight(el.scrollHeight);
      fetchMessages(convoId ?? undefined);
    }
  }, [hasMore, messageLoading, convoId]);

  useEffect(() => {
    const el = containerRef.current;
    el?.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Build participant map: senderId → { name, avatar }
  const participantMap = new Map(
    (conversation?.participants || []).map((p) => [
      p._id,
      { name: p.displayName, avatar: p.avatarUrl },
    ])
  );

  // Màn hình chào khi chưa chọn conversation
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-slate-500">
        <span className="material-symbols-outlined text-6xl">chat_bubble_outline</span>
        <div className="text-center">
          <p className="font-semibold text-lg">Chọn một hội thoại</p>
          <p className="text-sm mt-1">hoặc bắt đầu nhắn tin với bạn bè</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 px-4 overflow-y-auto flex flex-col gap-1 scroll-smooth pb-4 pt-4 beautiful-scrollbar"
    >
      {/* Load more indicator */}
      {messageLoading && (
        <div className="flex justify-center py-2">
          <span className="material-symbols-outlined animate-spin text-slate-400 text-xl">
            progress_activity
          </span>
        </div>
      )}

      {/* Empty state */}
      {!messageLoading && convoMessages.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
          <span className="material-symbols-outlined text-4xl">waving_hand</span>
          <p className="text-sm">Hãy gửi tin nhắn đầu tiên!</p>
        </div>
      )}

      {/* Messages với grouping logic */}
      {convoMessages.map((msg, index) => {
        const sender = participantMap.get(msg.senderId);

        const prev = index > 0 ? convoMessages[index - 1] : null;
        const next = index < convoMessages.length - 1 ? convoMessages[index + 1] : null;

        // Kiểm tra xem có cách > 5 phút so với tin nhắn TRƯỚC không
        const showTimestamp =
          !prev ||
          new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > TIMESTAMP_GAP_MS;

        // Có hiện avatar không? = Tin đầu tiên của cụm
        const isFirstInCluster =
          showTimestamp ||
          !prev ||
          prev.senderId !== msg.senderId;

        // Tin nhắn cuối cùng trong store = tin mới nhất (để animate)
        const isNew = index === convoMessages.length - 1;

        // Tên người gửi: chỉ hiện trong group chat
        const isGroup = conversation.type === "group";
        
        const messageWithSender = msg as MessageWithSenderName;
        const conversationWithFallbacks = conversation as ConversationWithDisplayFallbacks;
        let finalSenderName = sender?.name || messageWithSender.senderName;
        let finalSenderAvatar = sender?.avatar;
        
        const isOwnMessage = msg.senderId === user?._id;
        
        // Universal fallback for missing participant avatars
        if (!finalSenderAvatar && !isOwnMessage) {
          const friendMatch = friends.find(f => f.id === msg.senderId);
          if (friendMatch) {
            finalSenderAvatar = friendMatch.avatarUrl;
            finalSenderName = finalSenderName || friendMatch.displayName || friendMatch.username;
          }
        }

        if (!isGroup && !isOwnMessage) {
          finalSenderName = finalSenderName || conversationWithFallbacks.receiver?.name || conversation.group?.name;
          finalSenderAvatar = finalSenderAvatar || conversationWithFallbacks.receiver?.avatarUrl || conversationWithFallbacks.group?.avatarUrl;
        }

        return (
          <MessageBubble
            key={msg._id || index}
            message={msg}
            senderName={finalSenderName} // Pass finalSenderName so initials can be generated correctly even if not displayed
            senderAvatar={finalSenderAvatar}
            showAvatar={isFirstInCluster}
            showTimestamp={showTimestamp}
            isNew={isNew && !next}
            isGroup={isGroup}
            conversationId={convoId}
            onReact={onReact}
            onDelete={onDelete}
            onRecall={onRecall}
            onCopy={onCopy}
            onOpenThread={onOpenThread}
          />
        );
      })}

      {/* Typing indicator – người dùng */}
      {typingUsers.length > 0 && (
        <div className="flex items-end gap-2.5 self-start message-bounce">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-300 flex items-center justify-center text-white text-xs shrink-0">
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {/* Bot typing indicator */}
      {botTyping && (
        <div className="flex items-end gap-2.5 self-start message-bounce">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-white text-xs shrink-0">
            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 border border-violet-200 dark:border-violet-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
