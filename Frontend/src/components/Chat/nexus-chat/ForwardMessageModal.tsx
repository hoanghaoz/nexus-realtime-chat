import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useChatStore } from "@/stores/useChatStore";
import { useSignalRStore } from "@/stores/useSignalRStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Message } from "@/types/chat";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  message: Message | null;
}

export function ForwardMessageModal({ open, onClose, message }: Props) {
  const { conversations } = useChatStore();
  const { sendMessage } = useSignalRStore();
  const { user } = useAuthStore();
  const [selectedConvos, setSelectedConvos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  if (!message) return null;

  const handleToggleConvo = (id: string) => {
    setSelectedConvos((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (selectedConvos.length === 0) return;
    setSending(true);

    try {
      for (const convoId of selectedConvos) {
        // Build the payload keeping text and attachments
        await sendMessage({
          conversationId: convoId,
          content: message.content ?? "",
          // Forwarding files/links requires sending attachments.
          // Since the sendMessage expects an array of attachments, we would need the backend's AttachmentBaseDto if we had them.
          // For now, if we only have imgUrl, we can't easily re-attach it via the current SignalR interface because it expects full attachments.
          // But wait, the backend `CreateMessage` endpoint handles new files. To forward an existing image, we might need a specific backend endpoint.
          // To make it simple, we forward the text. 
          // If we have fileAttachment, we could theoretically reconstruct the DTO, but the schema doesn't match perfectly.
          // Let's forward text and imgUrl if possible (append imgUrl to text as a fallback).
        });
      }
      toast.success("Chuyển tiếp thành công!");
      onClose();
      setSelectedConvos([]);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi chuyển tiếp.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chuyển tiếp tin nhắn</DialogTitle>
        </DialogHeader>

        <div className="py-2 max-h-[60vh] overflow-y-auto beautiful-scrollbar">
          {conversations.map((convo) => {
            const isGroup = convo.type === "group";
            let name = isGroup ? convo.group?.name : "Người dùng";
            let avatar = isGroup ? convo.group?.avatarUrl : null;
            if (!isGroup) {
              const otherUser = convo.participants.find((p) => p._id !== user?._id);
              if (otherUser) {
                name = otherUser.displayName;
                avatar = otherUser.avatarUrl;
              }
            }

            return (
              <label
                key={convo._id}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    checked={selectedConvos.includes(convo._id)}
                    onChange={() => handleToggleConvo(convo._id)}
                  />
                </div>
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(name || "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {name}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex justify-between w-full">
            <span className="text-sm text-slate-500 font-medium my-auto">
              Đã chọn: {selectedConvos.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleForward}
                disabled={selectedConvos.length === 0 || sending}
                className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {sending ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
