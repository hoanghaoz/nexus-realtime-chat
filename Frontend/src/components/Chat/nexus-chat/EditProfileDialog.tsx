import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStore";

const editSchema = z.object({
  displayName: z
    .string()
    .min(2, "Tên hiển thị phải có ít nhất 2 ký tự.")
    .max(50, "Tên hiển thị tối đa 50 ký tự."),
});

type EditForm = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * EditProfileDialog – Modal chỉnh sửa tên hiển thị.
 * Nexus API: PUT /api/users/update → { message }
 * Cập nhật lại user trong useAuthStore sau khi thành công.
 */
export default function EditProfileDialog({ open, onClose }: Props) {
  const { user } = useAuthStore();
  const { updateProfile, loading } = useUserStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { displayName: user?.displayName ?? "" },
  });

  // Sync form khi user thay đổi
  useEffect(() => {
    reset({ displayName: user?.displayName ?? "" });
  }, [user, open]);

  const onSubmit = async (values: EditForm) => {
    await updateProfile({ displayName: values.displayName });
    onClose();
  };

  const initials = (user?.displayName || user?.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Chỉnh sửa thông tin
          </DialogTitle>
        </DialogHeader>

        {/* Avatar preview */}
        <div className="flex justify-center mt-1">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-2xl border-4 border-white dark:border-slate-700 shadow-md">
              {initials}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          {/* Username (readonly) */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-username" className="text-sm font-medium">
              Username
            </Label>
            <Input
              id="ep-username"
              value={`@${user?.username ?? ""}`}
              readOnly
              className="rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-displayname" className="text-sm font-medium">
              Tên hiển thị
            </Label>
            <Input
              id="ep-displayname"
              placeholder="Nguyễn Văn A"
              className="rounded-xl"
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className="text-xs text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={loading}
            >
              Huỷ
            </Button>
            <Button
              id="save-profile-btn"
              type="submit"
              disabled={loading || !isDirty}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 hover:opacity-90"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              ) : (
                "Lưu"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
