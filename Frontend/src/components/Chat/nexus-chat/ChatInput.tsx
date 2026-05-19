import { useRef, useState, useCallback } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useSignalRStore } from "@/stores/useSignalRStore";
import EmojiPickerPanel from "@/components/Chat/nexus-chat/EmojiPickerPanel";

export default function ChatInput() {
  const { activeConversationId } = useChatStore();
  const { sendMessage, sendTypingIndicator } = useSignalRStore();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const disabled = !activeConversationId;

  // Gửi tin nhắn
  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || !activeConversationId || sending) return;

    setSending(true);
    setText("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      await sendMessage({ conversationId: activeConversationId, content });
    } finally {
      setSending(false);
    }
  }, [text, activeConversationId, sending, sendMessage]);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;

    // Typing indicator
    if (!isTyping.current && activeConversationId) {
      isTyping.current = true;
      sendTypingIndicator(activeConversationId, true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      if (activeConversationId)
        sendTypingIndicator(activeConversationId, false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    // Nối emoji vào text hiện tại
    setText((prev) => prev + emoji.native);

    // Trỏ con trỏ về cuối ô input sau khi chọn emoji
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  return (
    <div className="p-4 pb-6">
      <div className="border rounded-xl flex items-end p-2 gap-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all shadow-lg bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <button
          aria-label="Add attachment"
          disabled={disabled}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center shrink-0 disabled:opacity-40"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">
            attach_file
          </span>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-11 py-2.5 px-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 text-slate-800 dark:text-slate-100 disabled:cursor-not-allowed"
          placeholder={
            disabled
              ? "Chọn hội thoại để nhắn tin..."
              : "Nhập tin nhắn... (Enter để gửi)"
          }
          rows={1}
        />
        {/* Bọc relative ở đây để làm điểm tựa cho Picker nổi lên */}
        <div className="relative flex items-center justify-center shrink-0">
          <button
            aria-label="Insert emoji"
            disabled={disabled}
            onClick={() => setShowEmoji((prev) => !prev)} // Thêm sự kiện onClick này
            // Giữ nguyên toàn bộ class cũ của đại ca...
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center disabled:opacity-40"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">mood</span>
          </button>

          {/* Render component Emoji tại đây */}
          {showEmoji && (
            <EmojiPickerPanel
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        <button
          id="send-message-btn"
          aria-label="Send message"
          disabled={disabled || !text.trim() || sending}
          onClick={handleSend}
          className="p-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white rounded-lg transition-all flex items-center justify-center shrink-0 ml-1 shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
        >
          {sending ? (
            <span className="material-symbols-outlined text-[20px] animate-spin">
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-[20px] icon-fill">
              send
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
