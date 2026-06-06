import type { FriendResponseDto } from "@/services/friendService";
import { useChatStore } from "@/stores/useChatStore";
import { useSignalRStore } from "@/stores/useSignalRStore";
import { useState } from "react";

interface Props {
  friend: FriendResponseDto;
}

export default function FriendItem({ friend }: Readonly<Props>) {
  const { startDirectChat } = useChatStore();
  const { onlineUsers } = useSignalRStore();
  const [opening, setOpening] = useState(false);

  // Ưu tiên dùng realtime onlineUsers từ PresenceHub;
  // fallback sang friend.isOnline nếu PresenceHub chưa kết nối (onlineUsers rỗng)
  const isOnline = onlineUsers.length > 0
    ? onlineUsers.includes(friend.id)
    : (friend.isOnline ?? false);

  const handleOpenChat = async () => {
    if (opening) return;
    try {
      setOpening(true);
      await startDirectChat(friend);
    } finally {
      setOpening(false);
    }
  };

  const initials = (friend.displayName || friend.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="bg-white dark:bg-slate-800/80 rounded-[20px] p-3.5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100/60 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group"
      onClick={() => void handleOpenChat()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") void handleOpenChat();
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {friend.avatarUrl ? (
            <img
              className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700"
              src={friend.avatarUrl}
              alt={friend.displayName}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:border-slate-700">
              {initials}
            </div>
          )}
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
              isOnline ? "bg-green-500" : "bg-slate-400"
            }`}
          />
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-tight">
            {friend.displayName || friend.username}
          </span>
          <span className={`text-[12px] font-medium ${isOnline ? "text-green-500" : "text-slate-400"}`}>
            {isOnline ? "Đang hoạt động" : "Offline"}
          </span>
        </div>
      </div>
      <button
        className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-700"
        disabled={opening}
        onClick={(e) => { e.stopPropagation(); void handleOpenChat(); }}
        title="Nhắn tin"
        type="button"
      >
        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[20px]">
          {opening ? "progress_activity" : "chat_bubble"}
        </span>
      </button>
    </div>
  );
}
