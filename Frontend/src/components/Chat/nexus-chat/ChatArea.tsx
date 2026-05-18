import { useState, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import GroupInfoPanel from "./GroupInfoPanel";
// Import SearchSidebar vua tao
import { SearchSidebar } from "./SearchSidebar";
import { useChatStore } from "@/stores/useChatStore";
import { useSignalRStore } from "@/stores/useSignalRStore";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ChatArea() {
  // Lấy thêm messages từ store
  const { conversations, activeConversationId, messages } = useChatStore();
  const { chatConnection } = useSignalRStore();
  const { user } = useAuthStore();

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  // State quan ly viec an hien Sidebar tim kiem
  const [showSearch, setShowSearch] = useState(false);

  const activeConversation =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  // Dong cac panel khi doi conversation
  useEffect(() => {
    setShowInfo(false);
    setShowSearch(false);
  }, [activeConversationId]);

  // Lang nghe UserTypingNotify tu SignalR
  useEffect(() => {
    if (!chatConnection) return;

    const handler = (userId: string, _convoId: string, isTyping: boolean) => {
      if (userId === user?._id) return;
      setTypingUsers((prev) =>
        isTyping
          ? [...new Set([...prev, userId])]
          : prev.filter((id) => id !== userId),
      );
    };

    chatConnection.on("UserTypingNotify", handler);
    return () => chatConnection.off("UserTypingNotify", handler);
  }, [chatConnection, user?._id]);

  // Reset typing khi doi conversation
  useEffect(() => {
    setTypingUsers([]);
  }, [activeConversationId]);

  // Ham xu ly cuon den tin nhan va tao hieu ung nhay sang
  const handleJumpToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Them class highlight
      element.classList.add(
        "bg-yellow-100",
        "dark:bg-yellow-900/40",
        "transition-colors",
        "duration-500",
        "rounded-2xl",
      );

      // Go bo class sau 1.5 giay
      setTimeout(() => {
        element.classList.remove("bg-yellow-100", "dark:bg-yellow-900/40");
      }, 1500);
    }
  };

  return (
    <main className="flex-1 flex min-w-0 relative z-0 bg-background text-foreground overflow-hidden">
      {/* Chat column */}
      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          onInfoClick={() => {
            setShowInfo((v) => !v);
            setShowSearch(false); // Mo Info thi dong Search
          }}
          infoOpen={showInfo}
          // Truyen prop sang ChatHeader de xu ly nut Kính lúp
          onSearchClick={() => {
            setShowSearch((v) => !v);
            setShowInfo(false); // Mo Search thi dong Info
          }}
          searchOpen={showSearch}
        />

        <MessageList
          conversation={activeConversation}
          typingUsers={typingUsers}
        />
        <ChatInput />
      </div>

      {/* Search Sidebar Panel */}
      {showSearch && (
        <SearchSidebar
          // Trích xuất đúng mảng 'items' của cuộc hội thoại đang mở
          messages={
            activeConversationId
              ? messages[activeConversationId]?.items || []
              : []
          }
          onClose={() => setShowSearch(false)}
          onJumpToMessage={handleJumpToMessage}
        />
      )}

      {/* Group Info Panel */}
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
