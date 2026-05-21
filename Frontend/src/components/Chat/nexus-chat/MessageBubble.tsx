// Frontend/src/components/Chat/nexus-chat/MessageBubble.tsx
import type { Message } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { MessageActionBar } from "./MessageActionBar";

const BOT_ID = "15c5232d-1bd9-4bbd-98e0-1ea7308e80bb";

const REACTION_IMAGES: Record<string, string> = {
  like:  "/reactions/like.png",
  heart: "/reactions/heart.png",
  haha:  "/reactions/haha.png",
  sad:   "/reactions/sad.png",
  wow:   "/reactions/wow.png",
  angry: "/reactions/angry.png",
};

interface Props {
  message: Message;
  senderName?: string;
  senderAvatar?: string | null;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isNew?: boolean;
  isGroup?: boolean;
  conversationId?: string;
  onReact?: (messageId: string, type: string) => void;
  onDelete?: (messageId: string, conversationId: string) => void;
  onRecall?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onOpenThread?: (messageId: string) => void;
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
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Hôm qua, ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function SenderAvatar({
  senderId,
  senderAvatar,
  senderName,
  initials,
}: {
  senderId: string;
  senderAvatar?: string | null;
  senderName?: string;
  initials: string;
}) {
  const isBot = senderId === BOT_ID;
  if (isBot) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-sm shrink-0">
        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
      </div>
    );
  }
  if (senderAvatar) {
    return <img src={senderAvatar} alt={senderName} className="w-8 h-8 rounded-full object-cover" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
      {initials}
    </div>
  );
}

export default function MessageBubble({
  message,
  senderName,
  senderAvatar,
  showAvatar = true,
  showTimestamp = false,
  isNew = false,
  isGroup = false,
  conversationId,
  onReact,
  onDelete,
  onRecall,
  onCopy,
  onOpenThread,
}: Readonly<Props>) {
  const { user } = useAuthStore();
  const isOwn = message.senderId === user?._id;
  const isBot = message.senderId === BOT_ID;
  const isDeleted = message.isDeleted === true;

  const initials = (senderName ?? "?").split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";

  const reactions = isDeleted ? [] : (message.reactions || []);
  const hasReactions = reactions.length > 0;

  const reactionGroups = reactions.reduce<Record<string, { count: number }>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = { count: 0 };
    acc[r.type].count++;
    return acc;
  }, {});
  const topReactionTypes = Object.keys(reactionGroups).slice(0, 3);
  const totalReactionCount = reactions.length;

  return (
    <>
      {showTimestamp && (
        <div className="flex items-center gap-3 py-2 my-1">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
            {formatTimestamp(message.createdAt)}
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      <div
        id={`message-${message._id}`}
        className={`relative flex items-end gap-2.5 ${
          isOwn ? "self-end flex-row-reverse" : "self-start"
        } max-w-[85%] lg:max-w-[70%] group ${isNew ? "message-bounce" : ""}
        ${hasReactions ? "mb-4" : ""}`}
      >
        {/* ActionBar chỉ hiện khi không bị xóa/thu hồi */}
        {!isDeleted && (
          <MessageActionBar
            messageId={message._id}
            isOwnMessage={isOwn}
            messageContent={message.content}
            conversationId={conversationId}
            onReact={onReact}
            onDelete={onDelete}
            onRecall={onRecall}
            onCopy={onCopy}
            onOpenThread={onOpenThread}
          />
        )}

        {/* Avatar */}
        {!isOwn && (
          <div className="w-8 shrink-0 mb-1">
            {showAvatar ? (
              <SenderAvatar
                senderId={message.senderId}
                senderAvatar={senderAvatar}
                senderName={senderName}
                initials={initials}
              />
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        )}

        <div className={`relative flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
          {/* Sender Name */}
          {!isOwn && showAvatar && (senderName || isBot) && isGroup && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1 mb-0.5 flex items-center gap-1">
              {isBot ? (
                <span className="inline-flex items-center gap-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[10px]">smart_toy</span>
                  Bot
                </span>
              ) : senderName}
            </span>
          )}

          {/* ── Tombstone (message đã bị xóa/thu hồi) ── */}
          {isDeleted ? (
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl italic text-[13px] ${
              isOwn
                ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-br-sm"
                : "bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-bl-sm"
            }`}>
              <span className="material-symbols-outlined text-[14px]">block</span>
              <span>
                {message.deletedText && message.deletedText !== "Tin nhắn đã bị xóa" 
                  ? message.deletedText 
                  : (isOwn ? "Bạn đã thu hồi tin nhắn" : `${senderName || "Người dùng"} đã thu hồi tin nhắn`)}
              </span>
            </div>
          ) : (
            <>
              {/* Image */}
              {message.imgUrl && (
                <a href={message.imgUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={message.imgUrl}
                    alt="attachment"
                    className={`max-w-48 rounded-xl object-cover shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}
                  />
                </a>
              )}

              {/* File Attachment Card (non-image) */}
              {message.fileAttachment && (
                <a
                  href={message.fileAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={message.fileAttachment.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border shadow-sm max-w-56 hover:opacity-90 transition-opacity ${
                    isOwn
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isOwn ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">description</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold truncate">{message.fileAttachment.name}</p>
                    <p className={`text-[10px] ${isOwn ? "text-blue-200" : "text-slate-400"}`}>
                      {message.fileAttachment.size > 0
                        ? `${(message.fileAttachment.size / 1024 / 1024).toFixed(1)} MB`
                        : ""}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[16px] shrink-0">download</span>
                </a>
              )}

              {/* Text */}
              {message.content && (
                <div
                  className={`font-chat-msg text-chat-msg px-4 py-2.5 leading-relaxed relative ${
                    isOwn
                      ? "chat-bubble-sent rounded-2xl rounded-br-sm"
                      : isBot
                      ? "border rounded-2xl rounded-bl-sm shadow-sm bg-violet-50 border-violet-200 text-violet-900 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-100"
                      : "border rounded-2xl rounded-bl-sm shadow-sm bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  }`}
                >
                  {message.content}
                </div>
              )}

              {/* Thread reply badge */}
              {(message.threadReplyCount ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenThread?.(message._id)}
                  className={`flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-600 mt-0.5 transition-colors ${isOwn ? "self-end" : "self-start"}`}
                >
                  <span className="material-symbols-outlined text-[13px]">forum</span>
                  {message.threadReplyCount} phản hồi
                </button>
              )}

              {/* ── Reaction badge – fixed dưới bubble, KHÔNG đè lên tên người sau ── */}
              {hasReactions && (
                <div
                  className={`flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full px-1.5 py-[2px] mt-1`}
                >
                  <div className="flex -space-x-1">
                    {topReactionTypes.map((type, index) => (
                      <span
                        key={type}
                        className="w-[18px] h-[18px] flex items-center justify-center"
                        style={{ zIndex: 10 - index }}
                      >
                        {REACTION_IMAGES[type] && (
                          <img src={REACTION_IMAGES[type]} alt={type} className="w-full h-full object-contain" />
                        )}
                      </span>
                    ))}
                  </div>
                  {totalReactionCount > 1 && (
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px]">
                      {totalReactionCount}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Timestamp on hover */}
          {!isDeleted && (
            <div className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isOwn ? "flex-row-reverse" : ""}`}>
              <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
              {isOwn && <span className="material-symbols-outlined text-[12px] text-slate-400">done_all</span>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
