import { useState, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import GroupInfoPanel from "./GroupInfoPanel";
import { useChatStore } from "@/stores/useChatStore";
import { useSignalRStore } from "@/stores/useSignalRStore";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ChatArea() {
  const { conversations, activeConversationId } = useChatStore();
  const { chatConnection } = useSignalRStore();
  const { user } = useAuthStore();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  const activeConversation =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  // Đóng panel khi đổi conversation
  useEffect(() => {
    setShowInfo(false);
  }, [activeConversationId]);

  // Lắng nghe UserTypingNotify từ SignalR
  useEffect(() => {
    if (!chatConnection) return;

    const handler = (userId: string, _convoId: string, isTyping: boolean) => {
      if (userId === user?._id) return;
      setTypingUsers((prev) =>
        isTyping ? [...new Set([...prev, userId])] : prev.filter((id) => id !== userId)
      );
    };

    chatConnection.on("UserTypingNotify", handler);
    return () => chatConnection.off("UserTypingNotify", handler);
  }, [chatConnection, user?._id]);

  // Reset typing khi đổi conversation
  useEffect(() => {
    setTypingUsers([]);
  }, [activeConversationId]);

  return (
    <main className="flex-1 flex min-w-0 relative z-0 bg-background text-foreground overflow-hidden">
      {/* Chat column */}
      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          onInfoClick={() => setShowInfo((v) => !v)}
          infoOpen={showInfo}
        />
        <MessageList conversation={activeConversation} typingUsers={typingUsers} />
        <ChatInput />
      </div>

      {/* Group Info Panel – rendered inline on large screens */}
      {showInfo && activeConversation && (
        <GroupInfoPanel
          open={showInfo}
          onClose={() => setShowInfo(false)}
          conversation={activeConversation}
        />
      )}
    </main>
  );
}
