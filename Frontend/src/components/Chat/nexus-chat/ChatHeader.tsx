import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

// 1. Thêm 2 props cho tính năng tìm kiếm
interface Props {
  onInfoClick?: () => void;
  infoOpen?: boolean;
  onSearchClick?: () => void;
  searchOpen?: boolean;
}

export default function ChatHeader({
  onInfoClick,
  infoOpen,
  onSearchClick,
  searchOpen,
}: Props) {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuthStore();

  const conversation =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  if (!conversation) {
    return (
      <header className="w-full h-16 border-b sticky top-0 z-40 backdrop-blur-md flex items-center px-6 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700">
        <span className="text-slate-400 dark:text-slate-500 text-sm">
          Chưa chọn hội thoại
        </span>
      </header>
    );
  }

  // Direct chat – lấy thông tin người kia
  const isGroup = conversation.type === "group";
  const otherParticipant = !isGroup
    ? (conversation.participants || []).find(
        (p) => p._id !== user?._id && !p._id.startsWith("self"),
      )
    : null;

  const chatName = isGroup
    ? (conversation.group?.name ?? "Nhóm")
    : otherParticipant?.displayName || "Unknown";

  const chatAvatar = isGroup ? null : otherParticipant?.avatarUrl;
  const subtitle = isGroup
    ? `${(conversation.participants || []).length} thành viên`
    : "Đang hoạt động";

  const initials = chatName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="w-full h-16 border-b sticky top-0 z-40 backdrop-blur-md flex items-center justify-between px-6 font-manrope text-sm font-medium bg-linear-to-r from-cyan-50 via-sky-50 to-indigo-50 border-cyan-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:border-slate-700">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {chatAvatar ? (
          <img
            alt={chatName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            src={chatAvatar}
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm ${
              isGroup
                ? "bg-gradient-to-br from-violet-500 to-purple-400"
                : "bg-gradient-to-br from-blue-500 to-cyan-400"
            }`}
          >
            {isGroup ? (
              <span className="material-symbols-outlined text-[18px]">
                group
              </span>
            ) : (
              initials
            )}
          </div>
        )}

        <div className="flex flex-col leading-tight">
          <h2 className="text-base font-extrabold tracking-tight text-sky-900 dark:text-slate-100">
            {chatName}
          </h2>
          <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* 2. Nút Kính lúp (Tìm kiếm) */}
        <button
          id="search-panel-btn"
          className={`p-2 rounded-full transition-colors ${
            searchOpen
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "hover:bg-white/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}
          title="Tìm kiếm tin nhắn"
          type="button"
          onClick={onSearchClick}
        >
          <span className="material-symbols-outlined text-[20px]">
            {searchOpen ? "search_off" : "search"}
          </span>
        </button>

        {/* Nút Info */}
        <button
          id="info-panel-btn"
          className={`p-2 rounded-full transition-colors ${
            infoOpen
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "hover:bg-white/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}
          title="Thông tin hội thoại"
          type="button"
          onClick={onInfoClick}
        >
          <span className="material-symbols-outlined text-[20px]">
            {infoOpen ? "close" : "info"}
          </span>
        </button>
      </div>
    </header>
  );
}
