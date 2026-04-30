export default function ChatHeader() {
  const chatName = "Elena Rostova";

  return (
    <header className="w-full h-16 border-b sticky top-0 z-40 backdrop-blur-md flex items-center px-6 font-manrope text-sm font-medium bg-linear-to-r from-cyan-100 via-sky-100 to-indigo-100 border-cyan-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <img
          alt="Current chat contact avatar"
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWqMuwTLG1uqjgIAA-3wQB4vA6jE5kCg3CzsxC2EZCGJvzFhJvLTidTR-Gg40KSKpVLuJ_71qB7OzUkdBM-YwyT4Krw9rwNp9-mhubkrJp2H9ZKr1MV8huzh8YYuE3g5yBWsVM2ejI4oJk_ByAPe5oUvptpge62ygsreWO5RYTgub18CaFpfWHGLsxwO9yIroBtKcABYjaLOJW1F4dnl31DK4KRp5zEADMQSjqDuA0FpAyed5WQRJvNQbK6fiRywB2LE2N0r4ozmnQ"
        />
        <div className="flex flex-col leading-tight">
          <h2 className="text-lg font-extrabold tracking-tight text-sky-900 dark:text-slate-100">
            {chatName}
          </h2>
        </div>
      </div>
    </header>
  );
}
