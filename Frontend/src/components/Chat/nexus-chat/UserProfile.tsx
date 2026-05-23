import { useAuthStore } from "@/stores/useAuthStore";
import { useSignalRStore } from "@/stores/useSignalRStore";
import { useChatStore } from "@/stores/useChatStore";
import { useState } from "react";
import EditProfileDialog from "./EditProfileDialog";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const { user, signOut } = useAuthStore();
  const { disconnectChat } = useSignalRStore();
  const { reset } = useChatStore();
  const [showEdit, setShowEdit] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    disconnectChat();
    reset();
    signOut();
    navigate("/sign-in", { replace: true });
  };

  const initials = (user?.displayName || user?.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/85 backdrop-blur-sm p-4 sticky bottom-0">
        <div className="flex items-center justify-between group">
          {/* Avatar + info */}
          <button
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity text-left"
            onClick={() => setShowEdit(true)}
            title="Chỉnh sửa thông tin"
            type="button"
          >
            <div className="relative shrink-0">
              {user?.avatarUrl ? (
                <img
                  alt="User avatar"
                  className="w-11 h-11 rounded-full object-cover shadow-sm border-2 border-white dark:border-slate-700"
                  src={user.avatarUrl}
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white dark:border-slate-700">
                  {initials}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-700 bg-green-500" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-tight truncate">
                {user?.displayName || user?.username || "Người dùng"}
              </span>
              <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                @{user?.username || "..."}
              </span>
            </div>
          </button>

          {/* Logout button */}
          <button
            id="logout-btn"
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors text-slate-400 dark:text-slate-500 hover:text-red-500 shrink-0"
            onClick={handleSignOut}
            title="Đăng xuất"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>

      <EditProfileDialog open={showEdit} onClose={() => setShowEdit(false)} />
    </>
  );
}
