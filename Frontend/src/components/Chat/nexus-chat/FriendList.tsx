import FriendItem from "./FriendItem";
import { MOCK_FRIENDS } from "./data/mockData";

export default function FriendList() {
  return (
    <div className="mt-4 flex flex-col pb-6">
      <div className="px-5 py-2 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
          BẠN BÈ
        </h3>
        <button className="text-slate-500 hover:text-slate-800 transition-colors">
          <span className="material-symbols-outlined text-[20px]">
            person_add
          </span>
        </button>
      </div>
      <div className="flex flex-col gap-2.5 px-4">
        {MOCK_FRIENDS.map((friend) => (
          <FriendItem key={friend.id} friend={friend} />
        ))}
      </div>
    </div>
  );
}
