import type { GroupItemProps } from "@/types/nexus-chat";

export default function GroupItem({ group }: GroupItemProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800/80 rounded-[20px] p-3.5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group ${
        group.active
          ? "border-2 border-[#b088f9] dark:border-sky-500"
          : "border border-slate-100/60 dark:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex -space-x-3.5">
          {group.avatars.map((avatar) =>
            avatar.type === "image" ? (
              <img
                key={avatar.id}
                className={avatar.className}
                src={avatar.src}
                alt={group.name}
              />
            ) : (
              <div key={avatar.id} className={avatar.className}>
                {avatar.text}
              </div>
            ),
          )}
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-tight">
            {group.name}
          </span>
          <span className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {group.membersText}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 justify-between h-full py-0.5">
        <span className="text-[12px] text-slate-400 font-medium">
          {group.timeText}
        </span>
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px] group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          more_horiz
        </span>
      </div>
    </div>
  );
}
