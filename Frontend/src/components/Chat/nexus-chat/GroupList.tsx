import GroupItem from "./GroupItem";
import { useChatStore } from "@/stores/useChatStore";
import CreateGroupDialog from "./CreateGroupDialog";

export default function GroupList() {
  const { conversations, convoLoading } = useChatStore();

  // Sắp xếp theo tin nhắn mới nhất
  const sorted = [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? b.updatedAt).getTime() -
      new Date(a.lastMessageAt ?? a.updatedAt).getTime()
  );

  const directConvos = sorted.filter((c) => c.type === "direct");
  const groupConvos = sorted.filter((c) => c.type === "group");

  return (
    <div className="mt-4 flex flex-col gap-1">
      {/* ── Hội thoại nhóm ─────────────────────────────── */}
      <div className="px-5 py-2 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
          Hội thoại nhóm
          {groupConvos.length > 0 && (
            <span className="ml-1.5 text-[11px] font-semibold text-slate-400 normal-case">
              ({groupConvos.length})
            </span>
          )}
        </h3>
        <CreateGroupDialog />
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-2">
        {convoLoading && (
          <div className="flex justify-center py-4">
            <span className="material-symbols-outlined text-slate-400 animate-spin text-xl">
              progress_activity
            </span>
          </div>
        )}

        {!convoLoading && groupConvos.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-4 text-slate-400">
            <span className="material-symbols-outlined text-2xl">group</span>
            <p className="text-xs text-center">Chưa có nhóm nào.</p>
          </div>
        )}

        {!convoLoading &&
          groupConvos.map((convo) => (
            <GroupItem key={convo._id} conversation={convo} />
          ))}
      </div>

      {/* ── Hội thoại riêng ────────────────────────────── */}
      <div className="px-5 py-2 flex items-center justify-between mt-2">
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
          Hội thoại riêng
          {directConvos.length > 0 && (
            <span className="ml-1.5 text-[11px] font-semibold text-slate-400 normal-case">
              ({directConvos.length})
            </span>
          )}
        </h3>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-4">
        {!convoLoading && directConvos.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-4 text-slate-400">
            <span className="material-symbols-outlined text-2xl">chat_bubble_outline</span>
            <p className="text-xs text-center">
              Chưa có hội thoại riêng.
              <br />
              Nhắn tin với bạn bè để bắt đầu!
            </p>
          </div>
        )}

        {!convoLoading &&
          directConvos.map((convo) => (
            <GroupItem key={convo._id} conversation={convo} />
          ))}
      </div>
    </div>
  );
}
