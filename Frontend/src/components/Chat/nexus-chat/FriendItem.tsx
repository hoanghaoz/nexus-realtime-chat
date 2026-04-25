import type { FriendItemProps } from "@/types/nexus-chat";

export default function FriendItem({ friend }: FriendItemProps) {
  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-[20px] p-3.5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100/60 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            className={friend.avatarClassName}
            src={friend.avatarSrc}
            alt={friend.name}
          />
          <div className={friend.statusDotClassName}></div>
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-tight">
            {friend.name}
          </span>
          <span className={friend.subtitleClassName}>{friend.subtitle}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 justify-between h-full py-0.5">
        <span className="text-[12px] text-slate-400 font-medium">
          {friend.timeText}
        </span>
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px] group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          more_horiz
        </span>
      </div>
    </div>
  );
}
