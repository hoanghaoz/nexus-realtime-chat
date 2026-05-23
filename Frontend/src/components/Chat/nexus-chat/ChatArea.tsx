// Frontend/src/components/Chat/nexus-chat/ChatArea.tsx
import { useState, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import GroupInfoPanel from "./GroupInfoPanel";
import { SearchSidebar } from "./SearchSidebar";
import ThreadDrawer from "./ThreadDrawer";
import { useChatStore } from "@/stores/useChatStore";
import { useChatHub } from "@/hooks/useChatHub";

export default function ChatArea() {
  const { conversations, activeConversationId, messages } = useChatStore();

  // useChatHub là single source of truth cho toàn bộ SignalR + reactions + thread
  const {
    typingUsers,
    botTyping,
    sendReaction,
    deleteMessage,
    recallMessage,
    copyMessage,
    openThread,
    closeThread,
    activeThreadMessageId,
    threadData,
    threadLoading,
  } = useChatHub();

  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const activeConversation =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  // Đóng các panel khi đổi conversation
  useEffect(() => {
    setShowInfo(false);
    setShowSearch(false);
  }, [activeConversationId]);

  return (
    <main className="flex-1 flex min-w-0 relative z-0 bg-background text-foreground overflow-hidden">
      {/* Chat column */}
      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          onInfoClick={() => {
            setShowInfo((v) => !v);
            setShowSearch(false);
          }}
          infoOpen={showInfo}
          onSearchClick={() => {
            setShowSearch((v) => !v);
            setShowInfo(false);
          }}
          searchOpen={showSearch}
        />

        <MessageList
          conversation={activeConversation}
          typingUsers={typingUsers}
          botTyping={botTyping}
          onReact={sendReaction}
          onDelete={deleteMessage}
          onRecall={recallMessage}
          onCopy={copyMessage}
          onOpenThread={openThread}
        />
        <ChatInput />
      </div>

      {/* Search Sidebar Panel */}
      {showSearch && (
        <SearchSidebar
          messages={
            activeConversationId
              ? messages[activeConversationId]?.items || []
              : []
          }
          onClose={() => setShowSearch(false)}
          onJumpToMessage={(messageId) => {
            const element = document.getElementById(`message-${messageId}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              element.classList.add(
                "bg-yellow-100",
                "dark:bg-yellow-900/40",
                "transition-colors",
                "duration-500",
                "rounded-2xl",
              );
              setTimeout(() => {
                element.classList.remove("bg-yellow-100", "dark:bg-yellow-900/40");
              }, 1500);
            }
          }}
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

      {/* Thread Drawer */}
      <ThreadDrawer
        open={activeThreadMessageId !== null}
        onClose={closeThread}
        threadData={threadData}
        threadLoading={threadLoading}
      />
    </main>
  );
}
