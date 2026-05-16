import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Conversation } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGroupStore } from "@/stores/useGroupStore";
import { useFriendStore } from "@/stores/useFriendStore";
import type { UserSearchResponse } from "@/services/userService";
import { useChatStore } from "@/stores/useChatStore";

interface Props {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
}

/**
 * GroupInfoPanel – Sheet slide-in hiển thị chi tiết nhóm.
 * Dành cho cả group và direct chat.
 *
 * Chức năng Group (type==="group"):
 *   – Đổi tên nhóm  → PUT /api/groups/{id}/edit name group
 *   – Thêm thành viên → POST /api/groups/{id}/AddMember
 *   – Xóa thành viên  → DELETE /api/groups/{id}/IdMemberRemove
 *   – Xóa nhóm        → DELETE /api/groups/{id}/delete group
 *
 * Chức năng Direct chat (type==="direct"):
 *   – Chỉ hiển thị thông tin người kia
 */
export default function GroupInfoPanel({ open, onClose, conversation }: Props) {
  const { user } = useAuthStore();
  const { updateGroup, deleteGroup, addMembers, removeMember, loading } = useGroupStore();
  const { friends } = useFriendStore();
  const { updateConversation } = useChatStore();

  const isGroup = conversation.type === "group";
  // Admin check (dùng cho đổi tên nhóm và xóa thành viên)
  const isCreator = isGroup && conversation.group?.createdBy === user?._id;
  // Nút xóa nhóm hiện cho tất cả thành viên

  // ────── State: Rename group ──────
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(conversation.group?.name ?? "");

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === conversation.group?.name) {
      setEditingName(false);
      return;
    }
    await updateGroup(conversation._id, { name: newName.trim() });
    setEditingName(false);
  };

  // ────── State: Add members ──────
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<UserSearchResponse[]>([]);

  const participantIds = new Set((conversation.participants || []).map((p) => p._id));

  // Lọc bạn bè chưa có trong nhóm
  const friendsNotInGroup = friends
    .filter((f) => !participantIds.has(f.id))
    .filter(
      (f) =>
        !selectedToAdd.some((s) => s.id === f.id) &&
        (f.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
          f.username.toLowerCase().includes(memberSearch.toLowerCase()))
    )
    .map<UserSearchResponse>((f) => ({
      id: f.id,
      username: f.username,
      displayName: f.displayName,
      avatarUrl: f.avatarUrl,
    }));

  const toggleAddSelect = (u: UserSearchResponse) => {
    setSelectedToAdd((prev) =>
      prev.some((s) => s.id === u.id)
        ? prev.filter((s) => s.id !== u.id)
        : [...prev, u]
    );
  };

  const handleAddMembers = async () => {
    if (!selectedToAdd.length) return;
    await addMembers(conversation._id, { participantIds: selectedToAdd.map((u) => u.id) });
    updateConversation({
      _id: conversation._id,
      participants: [
        ...conversation.participants,
        ...selectedToAdd.map((u) => ({
          _id: u.id,
          displayName: u.displayName || u.username,
          avatarUrl: u.avatarUrl ?? null,
          joinedAt: new Date().toISOString(),
        })),
      ],
    });
    setSelectedToAdd([]);
    setShowAddMember(false);
    setMemberSearch("");
  };

  // ────── State: Delete group confirm ──────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Conversation["participants"][number] | null>(null);

  const handleDeleteGroup = async () => {
    await deleteGroup(conversation._id);
    onClose();
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    const removed = await removeMember(conversation._id, memberToRemove._id);
    if (removed) setMemberToRemove(null);
  };

  // ────── Avatar helpers ──────
  const getInitials = (n: string) =>
    (n || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const otherParticipant = !isGroup
    ? (conversation.participants || []).find(
        (p) => p._id !== user?._id && !p._id.startsWith("self")
      )
    : null;

  const panelTitle = isGroup
    ? (conversation.group?.name ?? "Nhóm")
    : (otherParticipant?.displayName ?? "Thông tin");

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-80 sm:max-w-xs flex flex-col p-0 overflow-y-auto bg-white dark:bg-slate-900"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md ${
                isGroup
                  ? "bg-gradient-to-br from-violet-500 to-purple-400"
                  : "bg-gradient-to-br from-blue-500 to-cyan-400"
              }`}
            >
              {isGroup ? (
                <span className="material-symbols-outlined text-2xl">group</span>
              ) : otherParticipant?.avatarUrl ? (
                <img
                  src={otherParticipant.avatarUrl}
                  alt={otherParticipant.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(otherParticipant?.displayName ?? "?")
              )}
            </div>

            {/* Group name – editable for group creator */}
            {isGroup && editingName ? (
              <div className="flex items-center gap-1.5 w-full">
                <Input
                  id="group-name-edit"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl text-center font-bold text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleRename}
                  disabled={loading}
                  className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingName(false); setNewName(conversation.group?.name ?? ""); }}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 text-slate-500"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <SheetTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {panelTitle}
                </SheetTitle>
                {isGroup && isCreator && (
                  <button
                    type="button"
                    onClick={() => { setEditingName(true); setNewName(conversation.group?.name ?? ""); }}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Đổi tên nhóm"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                  </button>
                )}
              </div>
            )}

            {isGroup && (
              <p className="text-xs text-slate-400">
                {(conversation.participants || []).length} thành viên
              </p>
            )}
          </div>
        </SheetHeader>

        {/* ── Members section ── */}
        <div className="flex flex-col flex-1 px-4 py-3 gap-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {isGroup ? "Thành viên" : "Thông tin"}
            </h3>
            {isGroup && (
              <button
                type="button"
                onClick={() => setShowAddMember((v) => !v)}
                className="text-blue-500 hover:text-blue-600 transition-colors"
                title="Thêm thành viên"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              </button>
            )}
          </div>

          {/* Add member panel */}
          {isGroup && showAddMember && (
            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-slate-500">Thêm từ bạn bè</p>
              <Input
                placeholder="Tìm bạn bè..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="rounded-xl text-sm h-8"
              />
              {/* Selected chips */}
              {selectedToAdd.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedToAdd.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAddSelect(u)}
                      className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 text-xs font-medium"
                    >
                      {u.displayName}
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Friend list to pick */}
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
                {friendsNotInGroup.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">
                    {friends.filter((f) => !participantIds.has(f.id)).length === 0
                      ? "Tất cả bạn bè đã trong nhóm."
                      : "Không tìm thấy."}
                  </p>
                )}
                {friendsNotInGroup.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAddSelect(u)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left transition-colors ${
                      selectedToAdd.some((s) => s.id === u.id)
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.displayName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
                        {getInitials(u.displayName)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{u.displayName}</span>
                    {selectedToAdd.some((s) => s.id === u.id) && (
                      <span className="ml-auto material-symbols-outlined text-blue-500 text-[16px]">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-xl text-xs h-7"
                  onClick={() => { setShowAddMember(false); setSelectedToAdd([]); setMemberSearch(""); }}
                >
                  Huỷ
                </Button>
                <Button
                  id="confirm-add-members-btn"
                  size="sm"
                  className="flex-1 rounded-xl text-xs h-7 bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 hover:opacity-90"
                  disabled={!selectedToAdd.length || loading}
                  onClick={handleAddMembers}
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                  ) : (
                    `Thêm (${selectedToAdd.length})`
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="flex flex-col gap-1">
            {(conversation.participants || []).map((p) => {
              const isCurrentUser = p._id === user?._id;
              const canRemove = isGroup && isCreator && !isCurrentUser;
              const isConfirmingRemove = memberToRemove?._id === p._id;

              return (
                <div
                  key={p._id}
                  className="rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 group transition-colors"
                >
                  <div className="flex items-center gap-2.5 px-2 py-2">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {getInitials(p.displayName)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {p.displayName}
                        {isCurrentUser && (
                          <span className="ml-1.5 text-[10px] text-blue-500 font-normal">(Bạn)</span>
                        )}
                      </span>
                      {isGroup && p._id === conversation.group?.createdBy && (
                        <span className="text-[10px] text-amber-500 font-medium">Quản trị viên</span>
                      )}
                    </div>
                    {canRemove && (
                      <button
                        id={`remove-member-${p._id}`}
                        type="button"
                        onClick={() => setMemberToRemove(p)}
                        disabled={loading}
                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-all"
                        title={`Xóa ${p.displayName} khỏi nhóm`}
                      >
                        <span className="material-symbols-outlined text-[16px]">person_remove</span>
                      </button>
                    )}
                  </div>

                  {isConfirmingRemove && (
                    <div className="mx-2 mb-2 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 px-2.5 py-2">
                      <p className="text-xs font-medium text-red-600 dark:text-red-300">
                        Xóa {p.displayName} khỏi nhóm?
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 flex-1 rounded-lg text-xs"
                          onClick={() => setMemberToRemove(null)}
                          disabled={loading}
                        >
                          Huỷ
                        </Button>
                        <Button
                          id={`confirm-remove-member-${p._id}`}
                          type="button"
                          size="sm"
                          className="h-7 flex-1 rounded-lg bg-red-500 text-xs text-white hover:bg-red-600"
                          onClick={handleRemoveMember}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                          ) : "Xóa"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Danger zone ── */}
        {isGroup && (
          <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
            {!confirmDelete ? (
              <Button
                id="delete-group-btn"
                variant="outline"
                className="w-full rounded-xl text-red-500 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
              >
                <span className="material-symbols-outlined text-[16px] mr-1.5">delete</span>
                Xóa nhóm
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-red-500 font-medium text-center">
                  Xác nhận xóa nhóm &quot;{conversation.group?.name}&quot;?
                  <br />
                  <span className="text-slate-400 font-normal">Hành động này không thể hoàn tác.</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => setConfirmDelete(false)}
                    disabled={loading}
                  >
                    Huỷ
                  </Button>
                  <Button
                    id="confirm-delete-group-btn"
                    size="sm"
                    className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
                    onClick={handleDeleteGroup}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                    ) : "Xóa nhóm"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
