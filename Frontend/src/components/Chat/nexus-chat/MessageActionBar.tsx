// Frontend/src/components/Chat/nexus-chat/MessageActionBar.tsx
import { Forward, Copy, Trash, Undo2, MessageSquare } from "lucide-react";

const REACTIONS = [
  { type: "like",  src: "/reactions/like.png"  },
  { type: "heart", src: "/reactions/heart.png" },
  { type: "haha",  src: "/reactions/haha.png"  },
  { type: "sad",   src: "/reactions/sad.png"   },
  { type: "wow",   src: "/reactions/wow.png"   },
  { type: "angry", src: "/reactions/angry.png" },
] as const;

interface ActionBarProps {
  messageId: string;
  isOwnMessage: boolean;
  messageContent?: string | null;
  conversationId?: string;
  onReact?: (messageId: string, type: string) => void;
  onDelete?: (messageId: string, conversationId: string) => void;
  onRecall?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onOpenThread?: (messageId: string) => void;
  onForward?: () => void;
}

export const MessageActionBar = ({
  messageId,
  isOwnMessage,
  messageContent,
  conversationId,
  onReact,
  onDelete,
  onRecall,
  onCopy,
  onOpenThread,
  onForward,
}: ActionBarProps) => {
  return (
    <div
      className={`absolute -top-10 ${isOwnMessage ? "right-0" : "left-0"}
                  bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md px-2 py-1
                  flex items-center gap-1.5
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20`}
    >
      {/* ── CỤM CẢM XÚC ── */}
      <div className="flex items-center gap-1 border-r pr-2 border-gray-200 dark:border-gray-600">
        {REACTIONS.map(({ type, src }) => (
          <button
            key={type}
            className="flex items-center justify-center w-7 h-7 hover:scale-125 transition-transform origin-bottom hover:-translate-y-1"
            title={type}
            onClick={() => onReact?.(messageId, type)}
            type="button"
          >
            <img src={src} alt={type} className="w-5 h-5 object-contain drop-shadow-sm" />
          </button>
        ))}
      </div>

      {/* ── CỤM HÀNH ĐỘNG ── */}
      <div className="flex items-center gap-1 pl-1 text-gray-500 dark:text-gray-300">
        {/* Xem Thread */}
        <button
          className="hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-1 rounded-full"
          title="Xem thread"
          onClick={() => onOpenThread?.(messageId)}
          type="button"
        >
          <MessageSquare size={15} />
        </button>

        {/* Chuyển tiếp */}
        <button
          className="hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full"
          title="Chuyển tiếp"
          type="button"
          onClick={onForward}
        >
          <Forward size={15} />
        </button>

        {/* Sao chép */}
        {messageContent && (
          <button
            className="hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full"
            title="Sao chép"
            onClick={() => onCopy?.(messageContent)}
            type="button"
          >
            <Copy size={15} />
          </button>
        )}

        {/* Xóa phía mình (chỉ tin nhắn của chính mình) */}
        {isOwnMessage && conversationId && (
          <button
            className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-full"
            title="Xóa tin nhắn"
            onClick={() => onDelete?.(messageId, conversationId)}
            type="button"
          >
            <Trash size={15} />
          </button>
        )}

        {/* Thu hồi – xóa với tất cả mọi người (chỉ tin nhắn của chính mình) */}
        {isOwnMessage && (
          <button
            className="hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-1 rounded-full"
            title="Thu hồi tin nhắn"
            onClick={() => onRecall?.(messageId)}
            type="button"
          >
            <Undo2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
