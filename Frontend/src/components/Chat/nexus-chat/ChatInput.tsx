export default function ChatInput() {
  return (
    <div className="p-gutter sm:p-margin_page pt-0 pb-6 px-4">
      <div className="border rounded-xl flex items-end p-2 gap-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-lg bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <button
          aria-label="Add attachment"
          className="p-2 text-outline hover:text-on-surface hover:bg-white/5 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center shrink-0"
        >
          <span className="material-symbols-outlined text-[22px]">
            attach_file
          </span>
        </button>
        <textarea
          className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-11 py-2.5 px-2 text-chat-msg font-chat-msg placeholder:text-outline dark:placeholder:text-slate-500 focus:ring-0 text-slate-800 dark:text-slate-100"
          placeholder="Type a message..."
          rows={1}
        ></textarea>
        <button
          aria-label="Insert emoji"
          className="p-2 text-outline hover:text-on-surface hover:bg-white/5 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center shrink-0"
        >
          <span className="material-symbols-outlined text-[22px]">mood</span>
        </button>
        <button
          aria-label="Send message"
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center shrink-0 ml-1 shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px] icon-fill">
            send
          </span>
        </button>
      </div>
    </div>
  );
}
