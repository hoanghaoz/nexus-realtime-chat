import MessageBubble from "./MessageBubble";
import { MOCK_MESSAGES } from "./data/mockData";

export default function MessageList() {
  return (
    <div className="flex-1 px-4 overflow-y-auto p-gutter sm:p-margin_page flex flex-col gap-stack_lg scroll-smooth pb-4">
      <div className="flex justify-center my-2">
        <span className="font-status-label text-status-label text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          Today, 10:30 AM
        </span>
      </div>
      {MOCK_MESSAGES.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
