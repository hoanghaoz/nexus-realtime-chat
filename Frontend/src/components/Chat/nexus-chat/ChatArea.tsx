import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";

export default function ChatArea() {
  return (
    <main className="flex-1 flex flex-col min-w-0 relative z-0 bg-background text-foreground">
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </main>
  );
}
