export default function NewMessageButton() {
  return (
    <div className="px-4 py-2">
      <button className="w-full bg-white dark:bg-slate-800/80 rounded-[20px] p-3.5 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all active:scale-[0.98]">
        <div className="w-10.5 h-10.5 rounded-full bg-[#ef476f] flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-white text-[22px] icon-fill">
            chat_bubble
          </span>
        </div>
        <span className="font-bold text-slate-700 dark:text-slate-100 text-[15px]">
          Gửi Tin Nhắn Mới
        </span>
      </button>
    </div>
  );
}
