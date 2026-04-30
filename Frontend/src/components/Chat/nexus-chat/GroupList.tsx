import GroupItem from "./GroupItem";
import { MOCK_GROUPS } from "./data/mockData";

export default function GroupList() {
  return (
    <div className="mt-4 flex flex-col">
      <div className="px-5 py-2 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
          NHÓM CHAT
        </h3>
        <button className="text-slate-500 hover:text-slate-800 transition-colors">
          <span className="material-symbols-outlined text-[20px]">
            group_add
          </span>
        </button>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pb-2">
        {MOCK_GROUPS.map((group) => (
          <GroupItem key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
