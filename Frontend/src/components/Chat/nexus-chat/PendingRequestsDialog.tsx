import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFriendStore } from "@/stores/useFriendStore";

/**
 * PendingRequestsDialog – Hiển thị danh sách lời mời kết bạn đang chờ.
 * Pattern: Moji friendRequest/ReceivedRequests + FriendRequestItem.
 * Nexus API: GET /api/friend-requests/pending → PendingRequestDto[]
 *            PUT /api/friend-requests/{id}/accept|decline
 */
export default function PendingRequestsDialog() {
  const [open, setOpen] = useState(false);
  const { pendingRequests, getPendingRequests, acceptRequest, declineRequest, loading } =
    useFriendStore();

  useEffect(() => {
    if (open) {
      getPendingRequests();
    }
  }, [open]);

  const getInitials = (name: string) =>
    (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const hasRequests = pendingRequests.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          id="pending-requests-btn"
          className="relative text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          title="Lời mời kết bạn"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">
            notifications
          </span>
          {hasRequests && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {pendingRequests.length > 9 ? "9+" : pendingRequests.length}
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Lời mời kết bạn
            {hasRequests && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({pendingRequests.length})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2.5 max-h-96 overflow-y-auto light-scrollbar">
          {loading && (
            <div className="flex justify-center py-6">
              <span className="material-symbols-outlined text-slate-400 animate-spin text-2xl">
                progress_activity
              </span>
            </div>
          )}

          {!loading && !hasRequests && (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <span className="material-symbols-outlined text-4xl">
                person_check
              </span>
              <p className="text-sm">Không có lời mời kết bạn nào.</p>
            </div>
          )}

          {!loading &&
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3.5 py-3"
              >
                <div className="flex items-center gap-3">
                  {req.avatarUrl ? (
                    <img
                      src={req.avatarUrl}
                      alt={req.displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:border-slate-700">
                      {getInitials(req.displayName || req.username)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                      {req.displayName}
                    </p>
                    <p className="text-xs text-slate-400">@{req.username}</p>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <Button
                    id={`accept-request-${req.id}`}
                    size="sm"
                    disabled={loading}
                    onClick={() => acceptRequest(req.id)}
                    className="rounded-lg text-xs bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 hover:opacity-90 px-3"
                  >
                    <span className="material-symbols-outlined text-[14px] mr-0.5">
                      check
                    </span>
                    Chấp nhận
                  </Button>
                  <Button
                    id={`decline-request-${req.id}`}
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => declineRequest(req.id)}
                    className="rounded-lg text-xs text-red-500 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 px-2"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      close
                    </span>
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
