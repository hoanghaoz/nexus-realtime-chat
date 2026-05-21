import type { Message } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { MessageActionBar } from "./MessageActionBar";

// Khai báo trực tiếp từ điển tại đây để không phụ thuộc file khác
const REACTION_IMAGES: Record<string, string> = {
  like: "/reactions/like.png",
  heart: "/reactions/heart.png",
  haha: "/reactions/haha.png",
  sad: "/reactions/sad.png",
  wow: "/reactions/wow.png",
  angry: "/reactions/angry.png",
};

interface Props {
  message: Message;
  senderName?: string;
  senderAvatar?: string | null;
  showAvatar?: boolean;
  showTimestamp?: boolean;
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
  if (isToday)
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Hôm qua, ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  const initials =
    (senderName ?? "?")
      .split(" ")
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const reactions = message.reactions || [];
  const hasReactions = reactions.length > 0;
  const uniqueReactionTypes = Array.from(
    new Set(reactions.map((r: any) => r.type)),
  ).slice(0, 3);

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
        /* Them id vao day de tao diem neo cuon trang */
        id={`message-${message._id}`}
        className={`relative flex items-end gap-2.5 ${isOwn ? "self-end flex-row-reverse" : "self-start"} max-w-[85%] lg:max-w-[70%] group ${isNew ? "message-bounce" : ""}`}
      >
        <MessageActionBar isOwnMessage={isOwn} />

        {/* Avatar */}
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
              <div className="w-8 h-8" />
            )}
          </div>
        )}

        <div
          className={`relative flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
        >
          {/* Sender Name */}
          {!isOwn && showAvatar && senderName && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1 mb-0.5">
              {senderName}
            </span>
          )}

          {/* Image Content */}
          {message.imgUrl && (
            <img
              src={message.imgUrl}
              alt="attachment"
              className={`max-w-48 rounded-xl object-cover shadow-sm ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}
            />
          )}

          {/* Text Content */}
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

          {/* UI Hien thi cam xuc (Goc duoi tin nhan) */}
          {hasReactions && (
            <div
              className={`absolute -bottom-3.5 ${
                isOwn ? "right-2" : "left-2"
              } flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full px-1.5 py-[2px] z-10 cursor-pointer hover:scale-105 transition-transform`}
            >
              <div className="flex -space-x-1">
                {uniqueReactionTypes.map((type, index) => (
                  <span
                    key={type}
                    className="relative bg-white dark:bg-slate-800 rounded-full border border-white dark:border-slate-800 w-[18px] h-[18px] flex items-center justify-center overflow-hidden"
                    style={{ zIndex: 10 - index }}
                  >
                    {REACTION_IMAGES[type] ? (
                      <img
                        src={REACTION_IMAGES[type]}
                        alt={type}
                        className="w-full h-full object-contain"
                      />
                    ) : null}
                  </span>
                ))}
              </div>

              {reactions.length > 1 && (
                <span className="font-semibold text-slate-600 dark:text-slate-300 ml-0.5 text-[11px]">
                  {reactions.length}
                </span>
              )}
            </div>
          )}

          {/* Hover Timestamp */}
          <div
            className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isOwn ? "flex-row-reverse" : ""}`}
          >
            <span className="text-[10px] text-slate-400">
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className="material-symbols-outlined text-[12px] text-slate-400">
                done_all
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
