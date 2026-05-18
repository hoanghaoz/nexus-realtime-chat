import { useState, useMemo } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import type { Message } from "@/types/chat";

interface SearchSidebarProps {
  messages: Message[];
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
}

export function SearchSidebar({
  messages,
  onClose,
  onJumpToMessage,
}: SearchSidebarProps) {
  const [keyword, setKeyword] = useState("");

  // Loc tin nhan khop voi tu khoa (khong phan biet hoa thuong)
  const results = useMemo(() => {
    if (!keyword.trim()) return [];
    return messages.filter((m) =>
      m.content?.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [messages, keyword]);

  // Format thoi gian cho ket qua
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col h-full shrink-0 animate-in slide-in-from-right-8 duration-300">
      {/* 1. Header Sidebar */}
      <div className="h-[60px] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 bg-white dark:bg-slate-800 shrink-0">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
          Tìm kiếm
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. O nhap tu khoa */}
      <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Nhập từ khóa..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm rounded-full pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            autoFocus
          />
        </div>
      </div>

      {/* 3. Danh sach ket qua */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {keyword.trim() && results.length === 0 && (
          <div className="text-center text-sm text-slate-500 mt-10">
            Không tìm thấy kết quả nào.
          </div>
        )}

        {results.map((msg) => (
          <div
            key={msg._id}
            onClick={() => onJumpToMessage(msg._id)}
            className="p-3 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-medium text-slate-500">
                {formatTime(msg.createdAt)}
              </span>
              <ChevronRight
                size={14}
                className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
              {msg.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
