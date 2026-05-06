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

  return (
    <div className="mt-4 flex flex-col">
      <div className="px-5 py-2 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
          HỘI THOẠI
          {sorted.length > 0 && (
            <span className="ml-1.5 text-[11px] font-semibold text-slate-400 normal-case">
              ({sorted.length})
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

        {!convoLoading && sorted.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
            <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
            <p className="text-xs text-center">
              Chưa có hội thoại nào.
              <br />
              Nhắn tin với bạn bè để bắt đầu!
            </p>
          </div>
        )}

        {!convoLoading &&
          sorted.map((convo) => (
            <GroupItem key={convo._id} conversation={convo} />
          ))}
      </div>
    </div>
  );
}
