// Frontend/src/components/Chat/nexus-chat/ChatInput.tsx
import { useRef, useState, useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useSignalRStore } from "@/stores/useSignalRStore";
import { useChatHub } from "@/hooks/useChatHub";
import { useAuthStore } from "@/stores/useAuthStore";
import EmojiPickerPanel from "@/components/Chat/nexus-chat/EmojiPickerPanel";
import api from "@/services/api";
import { toast } from "sonner";

// ─── Loại file được chấp nhận ───────────────────────────────────────────────
const ACCEPT_IMAGE = "image/jpeg,image/png,image/gif,image/webp,image/heic";
const ACCEPT_FILE = "*/*";
const MAX_FILE_SIZE_MB = 55;

// ─── Upload state cho 1 file đang upload ────────────────────────────────────
interface UploadItem {
  id: string;
  fileName: string;
  progress: number; // 0-100
  status: "uploading" | "done" | "error";
}

type UploadQueueSetter = Dispatch<SetStateAction<UploadItem[]>>;

function updateUploadItem(
  setUploadQueue: UploadQueueSetter,
  uploadId: string,
  updates: Partial<Pick<UploadItem, "progress" | "status">>
) {
  setUploadQueue((prev) => prev.map((u) => (u.id === uploadId ? { ...u, ...updates } : u)));
}

function removeUploadItem(setUploadQueue: UploadQueueSetter, uploadId: string) {
  setUploadQueue((prev) => prev.filter((u) => u.id !== uploadId));
}

function getUploadStatusClass(status: UploadItem["status"]) {
  if (status === "error") return "text-red-400";
  if (status === "done") return "text-green-400";
  return "text-blue-400 animate-spin";
}

function getUploadStatusIcon(status: UploadItem["status"]) {
  if (status === "error") return "error";
  if (status === "done") return "check_circle";
  return "progress_activity";
}

export default function ChatInput() {
  const { activeConversationId, conversations } = useChatStore();
  const { sendMessage, completePendingMessage } = useSignalRStore();
  const { handleTypingInput, notifyBotMentioned } = useChatHub();
  const { user } = useAuthStore();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // --- @Mention state ---
  const BOT_ID_MENTION = "15c5232d-1bd9-4bbd-98e0-1ea7308e80bb";
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedUsersId, setMentionedUsersId] = useState<string[]>([]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeConversationId),
    [conversations, activeConversationId]
  );
  const mentionCandidates = useMemo(() => {
    const bot = { id: BOT_ID_MENTION, displayName: "Bot AI", isBot: true };
    const all = { id: "ALL", displayName: "Mọi người", isBot: false };
    const participants = (activeConversation?.participants ?? [])
      .filter((p) => p._id !== user?._id)
      .map((p) => ({ id: p._id, displayName: p.displayName, isBot: false }));
    return [bot, all, ...participants];
  }, [activeConversation, user?._id]);
  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return mentionCandidates.filter((c) => c.displayName.toLowerCase().includes(q));
  }, [mentionQuery, mentionCandidates]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const disabled = !activeConversationId;

  // ─── Gửi tin nhắn text ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || !activeConversationId || sending) return;
    setSending(true);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMentionedUsersId([]);
    // Neu co mention @Bot: set botTyping = true truoc khi gui
    const hasBotMention = mentionedUsersId.includes("15c5232d-1bd9-4bbd-98e0-1ea7308e80bb") || /\@bot/i.test(content);
    if (hasBotMention) notifyBotMentioned();
    try {
      await sendMessage({
        conversationId: activeConversationId,
        content,
        mentionedUsersId: mentionedUsersId.length > 0 ? mentionedUsersId : undefined,
      });
    } finally {
      setSending(false);
    }
  }, [text, activeConversationId, sending, sendMessage, mentionedUsersId]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
    handleTypingInput();
    // Detect @mention trigger khi nguoi dung go @ (ho tro tieng Viet)
    const pos = el.selectionStart ?? val.length;
    const before = val.slice(0, pos);
    const atMatch = /@([\p{L}\p{N}_ ]*)$/u.exec(before);
    if (atMatch !== null) { setMentionQuery(atMatch[1]); } else { setMentionQuery(null); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape: dong mention dropdown
    if (e.key === "Escape" && mentionQuery !== null) {
      e.preventDefault();
      setMentionQuery(null);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setText((prev) => prev + emoji.native);
    textareaRef.current?.focus();
    setShowEmoji(false);
  };

  // ─── Hybrid Media Upload Flow ────────────────────────────────────────────
  /**
   * Upload một file theo hybrid flow:
   * 1. POST /api/media/conversation/{id}/upload → { messageId, fileUrl, isPending=true }
   * 2. addMessage vào store ngay (render optimistically)
   * 3. Invoke SignalR CompletePendingMessage(messageId) → BE broadcast đến group
   */
  const uploadFile = useCallback(
    async (file: File) => {
      if (!activeConversationId) return;

      // Validate size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File "${file.name}" vượt quá ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      const uploadId = crypto.randomUUID();
      setUploadQueue((prev) => [
        ...prev,
        { id: uploadId, fileName: file.name, progress: 0, status: "uploading" },
      ]);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post(
          `/media/conversation/${activeConversationId}/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (event) => {
              const pct = event.total ? Math.round((event.loaded * 100) / event.total) : 0;
              updateUploadItem(setUploadQueue, uploadId, { progress: pct });
            },
          }
        );

        const { messageId, fileUrl } = res.data?.data ?? res.data ?? {};
        if (!messageId) throw new Error("Backend không trả về messageId");

        // Phan biet anh vs file de render optimistic message dung
        const isImage = file.type.startsWith("image/");
        useChatStore.getState().addMessage({
          _id: messageId,
          conversationId: activeConversationId,
          senderId: user?._id ?? "",
          content: null,
          imgUrl: isImage ? fileUrl : null,
          fileAttachment: !isImage ? { url: fileUrl ?? "", name: file.name, size: file.size, type: file.type } : undefined,
          createdAt: new Date().toISOString(),
          reactions: [],
        });

        // Xác nhận với backend để broadcast cho group
        await completePendingMessage(messageId);

        updateUploadItem(setUploadQueue, uploadId, { progress: 100, status: "done" });

        // Dọn sạch sau 2s
        setTimeout(() => removeUploadItem(setUploadQueue, uploadId), 2000);
      } catch (err: any) {
        console.error("[ChatInput] uploadFile error:", err);
        updateUploadItem(setUploadQueue, uploadId, { status: "error" });
        const msg =
          err?.response?.status === 400
            ? `File "${file.name}" không được hỗ trợ hoặc quá lớn.`
            : `Upload "${file.name}" thất bại. Vui lòng thử lại!`;
        toast.error(msg);
        setTimeout(() => removeUploadItem(setUploadQueue, uploadId), 3000);
      }
    },
    [activeConversationId, completePendingMessage, user?._id]
  );

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setShowAttachMenu(false);
    const list = Array.from(files);
    // Upload tuần tự để không overwhelm server
    for (const file of list) {
      await uploadFile(file);
    }
  };
  // Chon mention candidate
  const handleSelectMention = useCallback((candidate: { id: string; displayName: string }) => {
    const pos = textareaRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const newBefore = before.replace(/@[\p{L}\p{N}_ ]*$/u, `@${candidate.displayName} `);
    const newText = newBefore + after;
    setText(newText);
    setMentionQuery(null);
    setMentionedUsersId((prev) => {
      if (candidate.id === "ALL") {
        const allIds = (activeConversation?.participants ?? [])
          .filter(p => p._id !== user?._id)
          .map(p => p._id);
        return Array.from(new Set([...prev, ...allIds]));
      }
      return prev.includes(candidate.id) ? prev : [...prev, candidate.id];
    });
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newBefore.length;
      }
    }, 0);
  }, [text]);

  return (
    <div className="px-4 pb-6 pt-2">
      {/* @Mention Dropdown */}
      {mentionQuery !== null && filteredMentions.length > 0 && (
        <div className="mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-3 pt-2 pb-1">Nhac den</p>
          {filteredMentions.map((c) => (
            <button key={c.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelectMention(c); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${c.isBot ? "bg-gradient-to-br from-violet-600 to-purple-500" : "bg-gradient-to-br from-blue-500 to-cyan-400"}`}>
                {c.isBot ? <span className="material-symbols-outlined text-[14px]">smart_toy</span> : c.displayName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.displayName}</p>
                {c.isBot && <p className="text-[10px] text-violet-500">Bot AI</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Upload progress bar khu vực ── */}
      {uploadQueue.length > 0 && (
        <div className="mb-2 flex flex-col gap-1.5">
          {uploadQueue.map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
              <span className={`material-symbols-outlined text-[16px] shrink-0 ${getUploadStatusClass(item.status)}`}>
                {getUploadStatusIcon(item.status)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{item.fileName}</p>
                {item.status === "uploading" && (
                  <div className="mt-0.5 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === "done" && (
                  <p className="text-[10px] text-green-500">Đã tải lên thành công</p>
                )}
                {item.status === "error" && (
                  <p className="text-[10px] text-red-500">Tải lên thất bại</p>
                )}
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {item.status === "uploading" ? `${item.progress}%` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Input box ── */}
      <div className="border rounded-xl flex items-end p-2 gap-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all shadow-lg bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">

        {/* Attach button + menu */}
        <div className="relative flex items-center justify-center shrink-0">
          <button
            aria-label="Đính kèm file"
            disabled={disabled}
            onClick={() => setShowAttachMenu((v) => !v)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">attach_file</span>
          </button>

          {/* Dropdown menu */}
          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 w-52 z-50">
              {/* Gửi ảnh */}
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
                type="button"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]">image</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Gửi ảnh</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, GIF, WebP</p>
                </div>
              </button>

              {/* Gửi file */}
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                type="button"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]">description</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Gửi file</p>
                  <p className="text-[10px] text-slate-400">Mọi loại file, tối đa 55MB</p>
                </div>
              </button>

              {/* Gửi thư mục */}
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                onClick={() => { folderInputRef.current?.click(); setShowAttachMenu(false); }}
                type="button"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]">folder_open</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Gửi thư mục</p>
                  <p className="text-[10px] text-slate-400">Tất cả file trong folder</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-11 py-2.5 px-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 text-slate-800 dark:text-slate-100 disabled:cursor-not-allowed"
          placeholder={disabled ? "Chọn hội thoại để nhắn tin..." : "Nhập tin nhắn... (Enter để gửi)"}
          rows={1}
        />

        {/* Emoji */}
        <div className="relative flex items-center justify-center shrink-0">
          <button
            aria-label="Chèn emoji"
            disabled={disabled}
            onClick={() => setShowEmoji((v) => !v)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">mood</span>
          </button>
          {showEmoji && (
            <EmojiPickerPanel onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
          )}
        </div>

        {/* Send button */}
        <button
          id="send-message-btn"
          aria-label="Gửi tin nhắn"
          disabled={disabled || !text.trim() || sending}
          onClick={handleSend}
          className="p-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white rounded-lg transition-all flex items-center justify-center shrink-0 ml-1 shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
        >
          {sending ? (
            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[20px] icon-fill">send</span>
          )}
        </button>
      </div>

      {/* ── Hidden file inputs ── */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept={ACCEPT_IMAGE}
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT_FILE}
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
        {...({ webkitdirectory: "", directory: "" } as any)}
      />

      {/* Click outside để đóng attach menu */}
      {showAttachMenu && (
        <button
          aria-label="Đóng menu đính kèm"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setShowAttachMenu(false)}
          type="button"
        />
      )}
    </div>
  );
}
