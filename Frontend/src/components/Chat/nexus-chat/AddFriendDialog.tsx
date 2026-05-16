import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/useUserStore";
import { useFriendStore } from "@/stores/useFriendStore";
import type { UserSearchResponse } from "@/services/userService";

/**
 * AddFriendDialog – Modal tìm kiếm user và gửi lời mời kết bạn.
 * Tái sử dụng phong cách của Nexus (rounded-[20px], gradient, material-symbols).
 * Pattern: Moji AddFriendModal/SearchForm + SendFriendRequestForm.
 */
export default function AddFriendDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { searchResults, searchUsers, loading, clearSearch } = useUserStore();
  const { sendFriendRequest, loading: friendLoading } = useFriendStore();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await searchUsers(query.trim());
  };

  const handleSendRequest = async (user: UserSearchResponse) => {
    await sendFriendRequest(user.id);
    setSentIds((prev) => new Set(prev).add(user.id));
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    clearSearch();
    setSentIds(new Set());
  };

  const getInitials = (name: string) =>
    (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <button
          id="add-friend-btn"
          className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Thêm bạn bè"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Tìm kiếm bạn bè</DialogTitle>
        </DialogHeader>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <Input
            id="search-user-input"
            placeholder="Nhập tên hoặc username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-xl"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-xl shrink-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 hover:opacity-90"
          >
            {loading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">search</span>
            )}
          </Button>
        </form>

        {/* Results */}
        <div className="mt-3 flex flex-col gap-2 max-h-72 overflow-y-auto light-scrollbar">
          {searchResults.length === 0 && !loading && query && (
            <p className="text-sm text-slate-400 text-center py-4">
              Không tìm thấy kết quả cho &quot;{query}&quot;
            </p>
          )}

          {searchResults.map((user) => {
            const sent = sentIds.has(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                      {getInitials(user.displayName || user.username)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-slate-400">@{user.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={sent || friendLoading}
                  onClick={() => handleSendRequest(user)}
                  className={`rounded-lg text-xs ${
                    sent
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-default"
                      : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 hover:opacity-90"
                  }`}
                >
                  {sent ? (
                    <>
                      <span className="material-symbols-outlined text-[14px] mr-1">check</span>
                      Đã gửi
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px] mr-1">person_add</span>
                      Kết bạn
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
