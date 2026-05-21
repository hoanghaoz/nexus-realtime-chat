// Frontend/src/components/Chat/nexus-chat/ThreadDrawer.tsx
import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSignalRStore } from "@/stores/useSignalRStore";
import { useChatStore } from "@/stores/useChatStore";
import type { MessageThread } from "@/types/chat";

interface Props {
  open: boolean;
  onClose: () => void;
  threadData: MessageThread | null;
  threadLoading: boolean;
}

const REACTION_IMAGES: Record<string, string> = {
  like:  "/reactions/like.png",
  heart: "/reactions/heart.png",
  haha:  "/reactions/haha.png",
  sad:   "/reactions/sad.png",
  wow:   "/reactions/wow.png",
  angry: "/reactions/angry.png",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ThreadDrawer({ open, onClose, threadData, threadLoading }: Props) {
  const { user } = useAuthStore();
  const { sendMessage } = useSignalRStore();
  const { activeConversationId, conversations } = useChatStore();
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when replies come in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadData?.replies.length]);

  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  const participantMap = new Map(
    (activeConversation?.participants || []).map((p) => [
      p._id,
      { name: p.displayName, avatar: p.avatarUrl },
    ])
  );

  const handleSendReply = async () => {
    const content = replyText.trim();
    if (!content || !activeConversationId || !threadData || sending) return;

    setSending(true);
    setReplyText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      await sendMessage({
        conversationId: activeConversationId,
        content,
        replyToMessageId: threadData.originalMessage._id,
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[380px] sm:max-w-sm flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <span className="material-symbols-outlined text-[20px] text-purple-500">forum</span>
            Thread
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* ── Loading ── */}
          {threadLoading && (
            <div className="flex-1 flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">
                progress_activity
              </span>
            </div>
          )}

          {/* ── Content ── */}
          {!threadLoading && threadData && (
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 beautiful-scrollbar">
              {/* Original message */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-[10px] font-semibold text-purple-500 mb-1.5 uppercase tracking-wide">
                  Tin nhắn gốc
                </p>
                {(() => {
                  const orig = threadData.originalMessage;
                  const sender = participantMap.get(orig.senderId);
                  const isOwn = orig.senderId === user?._id;
                  return (
                    <div className="flex items-start gap-2.5">
                      {sender?.avatar ? (
                        <img src={sender.avatar} alt={sender.name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                          {getInitials(isOwn ? (user?.displayName ?? "Bạn") : (sender?.name ?? "?"))}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {isOwn ? "Bạn" : (sender?.name ?? orig.senderId)}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatTime(orig.createdAt)}</span>
                        </div>
                        {orig.content && (
                          <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed break-words">
                            {orig.content}
                          </p>
                        )}
                        {orig.imgUrl && (
                          <img src={orig.imgUrl} alt="attachment" className="mt-2 max-w-[200px] rounded-xl object-cover" />
                        )}
                        {/* Reactions on original */}
                        {(orig.reactions?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {Object.entries(
                              (orig.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
                                acc[r.type] = (acc[r.type] ?? 0) + 1;
                                return acc;
                              }, {})
                            ).map(([type, count]) => (
                              <span
                                key={type}
                                className="flex items-center gap-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                              >
                                {REACTION_IMAGES[type] && (
                                  <img src={REACTION_IMAGES[type]} alt={type} className="w-3.5 h-3.5 object-contain" />
                                )}
                                {count > 1 && count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Separator */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span>{threadData.replies.length} phản hồi</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Replies */}
              {threadData.replies.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                  <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
                  <p className="text-xs text-center">Chưa có phản hồi nào.<br />Hãy là người đầu tiên!</p>
                </div>
              )}

              {threadData.replies.map((reply) => {
                const sender = participantMap.get(reply.senderId);
                const isOwn = reply.senderId === user?._id;
                return (
                  <div key={reply._id} className="flex items-start gap-2.5">
                    {isOwn ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                        {getInitials(user?.displayName ?? "Bạn")}
                      </div>
                    ) : sender?.avatar ? (
                      <img src={sender.avatar} alt={sender.name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                        {getInitials(sender?.name ?? "?")}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {isOwn ? "Bạn" : (sender?.name ?? reply.senderId)}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatTime(reply.createdAt)}</span>
                      </div>
                      {reply.content && (
                        <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed break-words">
                          {reply.content}
                        </p>
                      )}
                      {reply.imgUrl && (
                        <img src={reply.imgUrl} alt="attachment" className="mt-2 max-w-[200px] rounded-xl object-cover" />
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}

          {/* ── Empty/Error state ── */}
          {!threadLoading && !threadData && (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl">error_outline</span>
                <p className="text-sm mt-2">Không thể tải thread</p>
              </div>
            </div>
          )}

          {/* ── Reply Input ── */}
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-4">
            <div className="border rounded-xl flex items-end p-2 gap-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
                }}
                onKeyDown={handleKeyDown}
                disabled={!threadData || sending}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none max-h-24 min-h-[36px] py-1.5 px-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 text-slate-800 dark:text-slate-100 disabled:cursor-not-allowed"
                placeholder="Trả lời thread... (Enter để gửi)"
              />
              <button
                id="send-thread-reply-btn"
                aria-label="Send thread reply"
                disabled={!threadData || !replyText.trim() || sending}
                onClick={handleSendReply}
                type="button"
                className="p-2 bg-gradient-to-r from-purple-600 to-violet-500 hover:opacity-90 text-white rounded-lg transition-all flex items-center justify-center shrink-0 shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] icon-fill">send</span>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Reply này sẽ hiển thị trong thread
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
