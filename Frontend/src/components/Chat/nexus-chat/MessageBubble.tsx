import type { Message } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
  message: Message;
  /** Tên người gửi (dùng cho group chat) */
  senderName?: string;
  senderAvatar?: string | null;
  /** Có hiện avatar + tên không (false khi cùng người gửi liên tiếp) */
  showAvatar?: boolean;
  /** Có hiện timestamp phân cách không (true khi cách nhau > 5 phút) */
  showTimestamp?: boolean;
  /** Tin nhắn mới nhất (để animate) */
  isNew?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Hôm qua, ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({
  message,
  senderName,
  senderAvatar,
  showAvatar = true,
  showTimestamp = false,
  isNew = false,
}: Readonly<Props>) {
  const { user } = useAuthStore();
  const isOwn = message.senderId === user?._id;

  const initials = (senderName ?? "?")
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <>
      {/* ── Timestamp divider ── */}
      {showTimestamp && (
        <div className="flex items-center gap-3 py-2 my-1">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
            {formatTimestamp(message.createdAt)}
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      {/* ── Message bubble ── */}
      <div
        className={`flex items-end gap-2.5 ${isOwn ? "self-end flex-row-reverse" : "self-start"} max-w-[85%] lg:max-w-[70%] group ${isNew ? "message-bounce" : ""}`}
      >
        {/* Avatar (người nhận) */}
        {!isOwn && (
          <div className="w-8 shrink-0 mb-1">
            {showAvatar ? (
              senderAvatar ? (
                <img
                  src={senderAvatar}
                  alt={senderName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
                  {initials}
                </div>
              )
            ) : (
              /* Placeholder để giữ alignment khi không hiện avatar */
              <div className="w-8 h-8" />
            )}
          </div>
        )}

        <div className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
          {/* Tên người gửi (chỉ hiện lần đầu của cụm) */}
          {!isOwn && showAvatar && senderName && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1 mb-0.5">
              {senderName}
            </span>
          )}

          {/* Nội dung: ảnh */}
          {message.imgUrl && (
            <img
              src={message.imgUrl}
              alt="attachment"
              className={`max-w-48 rounded-xl object-cover shadow-sm ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}
            />
          )}

          {/* Nội dung: text */}
          {message.content && (
            <div
              className={`font-chat-msg text-chat-msg px-4 py-2.5 leading-relaxed relative ${
                isOwn
                  ? "chat-bubble-sent rounded-2xl rounded-br-sm"
                  : "border font-chat-msg text-chat-msg rounded-2xl rounded-bl-sm shadow-sm bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              }`}
            >
              {message.content}
            </div>
          )}

          {/* Timestamp (hiện khi hover) */}
          <div className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isOwn ? "flex-row-reverse" : ""}`}>
            <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
            {isOwn && (
              <span className="material-symbols-outlined text-[12px] text-slate-400">done_all</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
