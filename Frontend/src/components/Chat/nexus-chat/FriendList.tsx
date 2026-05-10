import { useEffect } from "react";
import FriendItem from "./FriendItem";
import AddFriendDialog from "./AddFriendDialog";
import PendingRequestsDialog from "./PendingRequestsDialog";
import { useFriendStore } from "@/stores/useFriendStore";

export default function FriendList() {
  const { friends, getFriends, loading } = useFriendStore();

  useEffect(() => {
    getFriends();
  }, []);

  return (
    <div className="mt-4 flex flex-col pb-6">
      <div className="px-5 py-2 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
          BẠN BÈ
          {friends.length > 0 && (
            <span className="ml-1.5 text-[11px] font-semibold text-slate-400 normal-case">
              ({friends.length})
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <PendingRequestsDialog />
          <AddFriendDialog />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4">
        {loading && (
          <div className="flex justify-center py-4">
            <span className="material-symbols-outlined text-slate-400 animate-spin text-xl">
              progress_activity
            </span>
          </div>
        )}

        {!loading && friends.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
            <span className="material-symbols-outlined text-3xl">group</span>
            <p className="text-xs text-center">
              Chưa có bạn bè nào.
              <br />
              Nhấn{" "}
              <span className="material-symbols-outlined text-[12px] align-middle">
                person_add
              </span>{" "}
              để thêm!
            </p>
          </div>
        )}

        {!loading &&
          friends.map((friend) => (
            <FriendItem key={friend.id} friend={friend} />
          ))}
      </div>
    </div>
  );
}
