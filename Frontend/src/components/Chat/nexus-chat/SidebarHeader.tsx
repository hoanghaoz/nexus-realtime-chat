import { useThemeStore } from "@/stores/useThemeStore";

export default function SidebarHeader() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="bg-linear-to-r rounded-[24px] p-4 flex items-center justify-between shadow-sm from-blue-700 to-cyan-500">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Nexus
        </h1>
        <div className="flex items-center gap-1.5">
          <span
            className={`material-symbols-outlined text-[18px] transition-colors ${
              isDark ? "text-white/60" : "text-white/90"
            }`}
          >
            light_mode
          </span>
          <button
            aria-label="Toggle theme"
            aria-pressed={isDark}
            className="w-11 h-6 bg-white/30 rounded-full relative cursor-pointer flex items-center px-1 shadow-inner"
            onClick={toggleTheme}
            type="button"
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-all duration-300 ${
                isDark ? "right-1" : "left-1"
              }`}
            ></div>
          </button>
          <span
            className={`material-symbols-outlined text-[18px] transition-colors ${
              isDark ? "text-white/90" : "text-white/60"
            }`}
          >
            dark_mode
          </span>
        </div>
      </div>
    </div>
  );
}
