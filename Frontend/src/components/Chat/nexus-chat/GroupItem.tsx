import type { Conversation } from "@/types/chat";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
  conversation: Conversation;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ`;
  return `${Math.floor(hrs / 24)} ngày`;
}

export default function GroupItem({ conversation }: Readonly<Props>) {
  const { setActiveConversation, activeConversationId } = useChatStore();
  const { user } = useAuthStore();

  const isActive = activeConversationId === conversation._id;
  const isGroup = conversation.type === "group";
  const groupName = isGroup
    ? conversation.group?.name ?? "Nhóm"
    : (() => {
        const other = (conversation.participants || []).find(
          (p) => p._id !== user?._id && !p._id.startsWith("self")
        );
        return other?.displayName || "Unknown";
      })();

  const unread = user?._id ? (conversation.unreadCounts?.[user._id] ?? 0) : 0;
  const lastMsg = conversation.lastMessage;
  const lastMsgPreview = lastMsg
    ? lastMsg.content
      ? lastMsg.content.length > 30
        ? lastMsg.content.slice(0, 30) + "..."
        : lastMsg.content
      : "📷 Hình ảnh"
    : "Chưa có tin nhắn";

  const displayTime = conversation.lastMessageAt
    ? timeAgo(conversation.lastMessageAt)
    : "";

  // Stacked avatars – lấy tối đa 3 participants đầu
  const avatarParticipants = (conversation.participants || []).slice(0, 3);

  return (
    <div
      className={`rounded-[20px] p-3.5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-pointer transition-colors group ${
        isActive
          ? "bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-400 dark:border-blue-500"
          : "bg-white dark:bg-slate-800/80 border border-slate-100/60 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80"
      }`}
      onClick={() => setActiveConversation(conversation._id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setActiveConversation(conversation._id)}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar stack */}
        <div className="flex -space-x-2 shrink-0">
          {avatarParticipants.map((p, i) => {
            const nameToUse = p.displayName || (p as any).userName || "?";
            return p.avatarUrl ? (
              <img
                key={p._id}
                src={p.avatarUrl}
                alt={nameToUse}
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-800"
                style={{ zIndex: avatarParticipants.length - i }}
              />
            ) : (
              <div
                key={p._id}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-white font-bold text-xs border-2 border-white dark:border-slate-800"
                style={{ zIndex: avatarParticipants.length - i }}
              >
                {nameToUse.charAt(0).toUpperCase()}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center min-w-0">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-tight truncate">
            {groupName}
          </span>
          <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
            {lastMsgPreview}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
        <span className="text-[11px] text-slate-400 font-medium">{displayTime}</span>
        {unread > 0 && (
          <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
    </div>
  );
}
