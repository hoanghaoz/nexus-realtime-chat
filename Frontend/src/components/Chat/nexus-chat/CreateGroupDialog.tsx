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
import { Label } from "@/components/ui/label";
import { useGroupStore } from "@/stores/useGroupStore";
import type { UserSearchResponse } from "@/services/userService";
import { useFriendStore } from "@/stores/useFriendStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";

/**
 * CreateGroupDialog – Tạo nhóm mới.
 * Flow: Đặt tên nhóm → Chọn thành viên từ danh sách bạn bè → POST /api/groups/create
 * Backend tự gửi SignalR ReceiveAddedToGroupNotification → useChatStore.addConversation()
 */
export default function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<UserSearchResponse[]>([]);
  const [search, setSearch] = useState("");
  const { createGroup, loading } = useGroupStore();
  const { friends } = useFriendStore();
  const { user } = useAuthStore();
  const { addConversation } = useChatStore();

  // Convert friends to UserSearchResponse shape for display
  const friendsAsUsers: UserSearchResponse[] = friends.map((f) => ({
    id: f.id,
    username: f.username,
    displayName: f.displayName,
    avatarUrl: f.avatarUrl,
  }));

  const filtered = friendsAsUsers.filter(
    (u) =>
      !selected.some((s) => s.id === u.id) &&
      (u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (u: UserSearchResponse) => {
    setSelected((prev) =>
      prev.some((s) => s.id === u.id)
        ? prev.filter((s) => s.id !== u.id)
        : [...prev, u]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length < 2) return;
    const result = await createGroup({
      name: name.trim(),
      participantIds: selected.map((u) => u.id),
    });
    if (result) {
      const createdAt = result.createdAt || new Date().toISOString();
      const conversation: Conversation = {
        _id: result.id,
        type: "group",
        group: {
          name: result.name,
          createdBy: result.createdBy || user?._id || "",
        },
        participants: [
          ...(user
            ? [
                {
                  _id: user._id,
                  displayName: user.displayName || user.username || "Bạn",
                  avatarUrl: user.avatarUrl ?? null,
                  joinedAt: createdAt,
                },
              ]
            : []),
          ...selected.map((u) => ({
            _id: u.id,
            displayName: u.displayName || u.username,
            avatarUrl: u.avatarUrl ?? null,
            joinedAt: createdAt,
          })),
        ],
        lastMessageAt: createdAt,
        seenBy: [],
        lastMessage: null,
        unreadCounts: {},
        createdAt,
        updatedAt: createdAt,
      };

      addConversation(conversation);
      setOpen(false);
      setName("");
      setSelected([]);
      setSearch("");
    }
  };

  const getInitials = (n: string) =>
    (n || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          id="create-group-btn"
          className="text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          title="Tạo nhóm"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">group_add</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Tạo nhóm mới</DialogTitle>
        </DialogHeader>

        {/* Group name */}
        <div className="space-y-1.5">
          <Label htmlFor="group-name" className="text-sm font-medium">Tên nhóm</Label>
          <Input
            id="group-name"
            placeholder="VD: Team React, Nhóm học tập..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Selected members preview */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {selected.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleSelect(u)}
                className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-2.5 py-1 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                {u.displayName}
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            ))}
          </div>
        )}

        {/* Search friends */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Thêm thành viên từ bạn bè</Label>
          <Input
            placeholder="Tìm bạn bè..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Friend list */}
        <div className="max-h-52 overflow-y-auto flex flex-col gap-1.5 light-scrollbar">
          {filtered.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-3">
              {friends.length === 0 ? "Chưa có bạn bè nào." : "Không tìm thấy."}
            </p>
          )}
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggleSelect(u)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.displayName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
                  {getInitials(u.displayName)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{u.displayName}</p>
                <p className="text-xs text-slate-400">@{u.username}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Validation hint */}
        {selected.length > 0 && selected.length < 2 && (
          <p className="text-xs text-amber-500">Cần ít nhất 2 thành viên để tạo nhóm.</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)} disabled={loading}>
            Huỷ
          </Button>
          <Button
            id="confirm-create-group-btn"
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white border-0 hover:opacity-90"
            disabled={!name.trim() || selected.length < 2 || loading}
            onClick={handleCreate}
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px] mr-1">group_add</span>
                Tạo nhóm
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
