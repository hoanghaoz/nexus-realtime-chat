import type { MessageBubbleProps } from "@/types/nexus-chat";

export default function MessageBubble({
  message,
}: Readonly<MessageBubbleProps>) {
  if (message.type === "me") {
    return (
      <div className="flex items-end gap-3 self-end max-w-[85%] lg:max-w-[70%] group">
        <div className="flex flex-col gap-1 items-end">
          <div className="flex items-center gap-2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="font-status-label text-status-label text-on-surface-variant opacity-50">
              {message.timeText}
            </span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant opacity-50 font-bold">
              done_all
            </span>
          </div>
          <div className="chat-bubble-sent font-chat-msg text-chat-msg px-4 py-4 rounded-2xl rounded-br-sm leading-relaxed">
            {message.text}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "typing") {
    return (
      <div className="flex items-end gap-3 self-start max-w-[85%] lg:max-w-[70%] mt-2">
        <img
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover shrink-0"
          src={message.avatarSrc}
        />
        <div className="bg-slate-100 border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1 dark:bg-slate-800 dark:border-slate-700">
          <div className="w-1.5 h-1.5 rounded-full bg-outline-variant animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-outline-variant animate-pulse delay-75"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-outline-variant animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 self-start max-w-[85%] lg:max-w-[70%] group">
      <img
        alt="Avatar"
        className="w-8 h-8 rounded-full object-cover shrink-0 mb-1"
        src={message.avatarSrc}
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-status-label text-status-label text-slate-700 dark:text-slate-300">
            {message.sender}
          </span>
          <span className="font-status-label text-status-label text-on-surface-variant opacity-50">
            {message.timeText}
          </span>
        </div>
        <div className="border font-chat-msg text-chat-msg px-4 py-4 rounded-2xl rounded-bl-sm shadow-sm leading-relaxed bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
          {message.text}
        </div>
      </div>
    </div>
  );
}
