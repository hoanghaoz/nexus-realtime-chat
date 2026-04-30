import { ChatArea, Sidebar } from "./nexus-chat";

export default function NexusChat() {
  return (
    <div className="bg-background text-on-background font-body-md flex h-screen overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar />
      <ChatArea />
    </div>
  );
}
