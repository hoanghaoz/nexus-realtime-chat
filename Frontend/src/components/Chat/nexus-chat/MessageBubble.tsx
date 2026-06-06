// Frontend/src/components/Chat/nexus-chat/MessageBubble.tsx
import { useState, useMemo } from "react";
import type { Message } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { MessageActionBar } from "./MessageActionBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  /** Danh sách participants để resolve tên mention multi-word */
  participants?: Array<{ _id: string; displayName: string }>;
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
}: Readonly<{
  senderId: string;
  senderAvatar?: string | null;
  senderName?: string;
  initials: string;
}>) {
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

function getTombstoneText(message: Message, isOwn: boolean, senderName?: string) {
  if (message.deletedText && message.deletedText !== "Tin nhắn đã bị xóa") {
    return message.deletedText;
  }
  return isOwn ? "Bạn đã thu hồi tin nhắn" : `${senderName || "Người dùng"} đã thu hồi tin nhắn`;
}

function getTombstoneClass(isOwn: boolean) {
  if (isOwn) {
    return "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-br-sm";
  }
  return "bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-bl-sm";
}

function getTextBubbleClass(isOwn: boolean, isBot: boolean) {
  if (isOwn) return "chat-bubble-sent rounded-2xl rounded-br-sm";
  if (isBot) {
    return "border rounded-2xl rounded-bl-sm shadow-sm bg-violet-50 border-violet-200 text-violet-900 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-100";
  }
  return "border rounded-2xl rounded-bl-sm shadow-sm bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100";
}

function SenderLabel({
  isBot,
  senderName,
}: Readonly<{
  isBot: boolean;
  senderName?: string;
}>) {
  if (isBot) {
    return (
      <span className="inline-flex items-center gap-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
        <span className="material-symbols-outlined text-[10px]" aria-hidden="true">smart_toy</span>
        <span>Bot</span>
      </span>
    );
  }
  return senderName;
}

function DeletedMessage({
  message,
  isOwn,
  senderName,
}: Readonly<{
  message: Message;
  isOwn: boolean;
  senderName?: string;
}>) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl italic text-[13px] ${getTombstoneClass(isOwn)}`}>
      <span className="material-symbols-outlined text-[14px]">block</span>
      <span>{getTombstoneText(message, isOwn, senderName)}</span>
    </div>
  );
}

function FileAttachmentCard({
  message,
  isOwn,
}: Readonly<{
  message: Message;
  isOwn: boolean;
}>) {
  if (!message.fileAttachment) return null;

  return (
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
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isOwn ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`}>
        <span className="material-symbols-outlined text-[20px]">description</span>
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold truncate">{message.fileAttachment.name}</p>
        <p className={`text-[10px] ${isOwn ? "text-blue-200" : "text-slate-400"}`}>
          {message.fileAttachment.size > 0 ? `${(message.fileAttachment.size / 1024 / 1024).toFixed(1)} MB` : ""}
        </p>
      </div>
      <span className="material-symbols-outlined text-[16px] shrink-0">download</span>
    </a>
  );
}

// ─── Link Preview Card ────────────────────────────────────────────────────────
function LinkPreviewCard({
  message,
  isOwn,
}: Readonly<{
  message: Message;
  isOwn: boolean;
}>) {
  if (!message.linkPreview) return null;
  const { url, title, description, imageUrl, siteName } = message.linkPreview;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex flex-col overflow-hidden rounded-xl border shadow-sm max-w-64 hover:opacity-90 transition-opacity ${
        isOwn
          ? "bg-blue-700 border-blue-500 text-white"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      }`}
    >
      {imageUrl && (
        <img src={imageUrl} alt={title ?? "preview"} className="w-full h-32 object-cover" loading="lazy" />
      )}
      <div className="px-3 py-2.5 flex flex-col gap-0.5">
        {siteName && (
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${isOwn ? "text-blue-200" : "text-blue-500 dark:text-blue-400"}`}>
            {siteName}
          </span>
        )}
        {title && (
          <p className={`text-[12px] font-bold leading-snug line-clamp-2 ${isOwn ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
            {title}
          </p>
        )}
        {description && (
          <p className={`text-[11px] leading-snug line-clamp-2 ${isOwn ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
            {description}
          </p>
        )}
      </div>
    </a>
  );
}

// Escape special regex chars
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function MentionText({
  content,
  participants,
}: Readonly<{
  content: string;
  participants?: Array<{ _id: string; displayName: string }>;
}>) {
  // Memoize regex để tránh tạo lại mỗi lần render (tránh SonarCloud performance smell)
  const combined = useMemo(() => {
    const knownNames = Array.from(new Set([
      "Bot AI",
      "mọi người",
      ...(participants ?? []).map(p => p.displayName).filter(Boolean),
    ])).sort((a, b) => b.length - a.length);

    const knownPattern = knownNames.map(escapeRegex).join("|");
    return new RegExp(`(https?://[^\\s]+)|@(${knownPattern})|(@\\S+)`, "gi");
  }, [participants]);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = combined.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={keyIdx++}>{content.slice(lastIndex, match.index)}</span>);
    }

    if (match[1]) {
      // URL
      parts.push(
        <a key={keyIdx++} href={match[1]} target="_blank" rel="noopener noreferrer"
          className="text-blue-500 hover:underline break-all">
          {match[1]}
        </a>
      );
    } else if (match[2]) {
      // @{KnownName} – multi-word mention
      const name = match[2];
      const isBot = name.toLowerCase() === "bot ai";
      parts.push(
        <span key={keyIdx++}
          className={`font-semibold rounded px-0.5 ${
            isBot
              ? "text-violet-600 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40"
              : "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30"
          }`}>
          @{name}
        </span>
      );
    } else if (match[3]) {
      // @fallback (single-word, unknown)
      const raw = match[3]; // includes @
      const isBot = raw.toLowerCase() === "@bot";
      parts.push(
        <span key={keyIdx++}
          className={`font-semibold rounded px-0.5 ${
            isBot
              ? "text-violet-600 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40"
              : "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30"
          }`}>
          {raw}
        </span>
      );
    }

    lastIndex = combined.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={keyIdx}>{content.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

function MessageContent({
  message,
  isOwn,
  isBot,
  participants,
}: Readonly<{
  message: Message;
  isOwn: boolean;
  isBot: boolean;
  participants?: Array<{ _id: string; displayName: string }>;
}>) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      {message.imgUrl && (
        <>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className={`block max-w-48 rounded-xl overflow-hidden shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in ${
              isOwn ? "rounded-br-sm" : "rounded-bl-sm"
            }`}
          >
            <img src={message.imgUrl} alt="attachment" className="w-full object-cover" />
          </button>
          {lightboxOpen && (
            <Dialog open onOpenChange={(v) => !v && setLightboxOpen(false)}>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent shadow-none flex items-center justify-center overflow-hidden">
                <div className="relative flex items-center justify-center">
                  <img
                    src={message.imgUrl}
                    alt="attachment"
                    className="max-w-[88vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(false)}
                    aria-label="Đóng"
                    className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  <a
                    href={message.imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                    title="Tải xuống"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </a>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
      <FileAttachmentCard message={message} isOwn={isOwn} />
      <LinkPreviewCard message={message} isOwn={isOwn} />
      {message.content && (
        <div className={`font-chat-msg text-chat-msg px-4 py-2.5 leading-relaxed relative ${getTextBubbleClass(isOwn, isBot)}`}>
          <MentionText content={message.content} participants={participants} />
        </div>
      )}
    </>
  );
}

function ReactionBadge({
  topReactionTypes,
  totalReactionCount,
}: Readonly<{
  topReactionTypes: string[];
  totalReactionCount: number;
}>) {
  return (
    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full px-1.5 py-[2px] mt-1">
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
  );
}

function TimestampSeparator({ createdAt }: Readonly<{ createdAt: string }>) {
  return (
    <div className="flex items-center gap-3 py-2 my-1">
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
        {formatTimestamp(createdAt)}
      </span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

function AvatarSlot({
  message,
  senderAvatar,
  senderName,
  initials,
  showAvatar,
}: Readonly<{
  message: Message;
  senderAvatar?: string | null;
  senderName?: string;
  initials: string;
  showAvatar: boolean;
}>) {
  if (!showAvatar) {
    return <div className="w-8 h-8" />;
  }
  return (
    <SenderAvatar
      senderId={message.senderId}
      senderAvatar={senderAvatar}
      senderName={senderName}
      initials={initials}
    />
  );
}

function ThreadReplyButton({
  message,
  isOwn,
  onOpenThread,
}: Readonly<{
  message: Message;
  isOwn: boolean;
  onOpenThread?: (messageId: string) => void;
}>) {
  if ((message.threadReplyCount ?? 0) === 0) return null;
  return (
    <button
      type="button"
      onClick={() => onOpenThread?.(message._id)}
      className={`flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-600 mt-0.5 transition-colors ${isOwn ? "self-end" : "self-start"}`}
    >
      <span className="material-symbols-outlined text-[13px]">forum</span>
      {message.threadReplyCount} phản hồi
    </button>
  );
}

function HoverTimestamp({
  message,
  isOwn,
}: Readonly<{
  message: Message;
  isOwn: boolean;
}>) {
  return (
    <div className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isOwn ? "flex-row-reverse" : ""}`}>
      <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
      {isOwn && <span className="material-symbols-outlined text-[12px] text-slate-400">done_all</span>}
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
  participants = [],
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
      {showTimestamp && <TimestampSeparator createdAt={message.createdAt} />}

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
            <AvatarSlot
              message={message}
              senderAvatar={senderAvatar}
              senderName={senderName}
              initials={initials}
              showAvatar={showAvatar}
            />
          </div>
        )}

        <div className={`relative flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
          {/* Sender Name */}
          {!isOwn && showAvatar && (senderName || isBot) && isGroup && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1 mb-0.5 flex items-center gap-1">
              <SenderLabel isBot={isBot} senderName={senderName} />
            </span>
          )}

          {/* Tombstone (message đã bị xóa/thu hồi) */}
          {isDeleted ? (
            <DeletedMessage message={message} isOwn={isOwn} senderName={senderName} />
          ) : (
            <>
              <MessageContent message={message} isOwn={isOwn} isBot={isBot} participants={participants} />

              <ThreadReplyButton message={message} isOwn={isOwn} onOpenThread={onOpenThread} />

              {/* Reaction badge */}
              {hasReactions && (
                <ReactionBadge topReactionTypes={topReactionTypes} totalReactionCount={totalReactionCount} />
              )}
            </>
          )}

          {/* Timestamp on hover */}
          {!isDeleted && <HoverTimestamp message={message} isOwn={isOwn} />}
        </div>
      </div>
    </>
  );
}
