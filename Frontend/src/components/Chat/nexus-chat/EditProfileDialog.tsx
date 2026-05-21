// Frontend/src/components/Chat/nexus-chat/EditProfileDialog.tsx
import { useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";

const editSchema = z.object({
  displayName: z.string().min(2, "Tên hiển thị phải có ít nhất 2 ký tự.").max(50, "Tối đa 50 ký tự."),
});
type EditForm = z.infer<typeof editSchema>;

interface Props { open: boolean; onClose: () => void; }

export default function EditProfileDialog({ open, onClose }: Readonly<Props>) {
  const { user, setUser } = useAuthStore();
  const { updateProfile, loading } = useUserStore();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { displayName: user?.displayName ?? "" },
  });

  useEffect(() => {
    reset({ displayName: user?.displayName ?? "" });
    setAvatarPreview(null);
    setAvatarFile(null);
  }, [user, open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate: chỉ ảnh, max 5MB
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh phải nhỏ hơn 5MB.");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatarToCloudinary = async (file: File): Promise<string | null> => {
    // Frontend hiện chưa có API upload avatar riêng, tạm thời chuyển thành base64
    // để gán vào UserUpdateDto.avatarUrl
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (values: EditForm) => {
    let newAvatarUrl: string | undefined = undefined;

    if (avatarFile) {
      setUploadingAvatar(true);
      try {
        // Upload avatar: thử media endpoint, fallback về base64
        const uploadedUrl = await uploadAvatarToCloudinary(avatarFile);
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        }
      } finally {
        setUploadingAvatar(false);
      }
    }

    await updateProfile({
      displayName: values.displayName,
      ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
    });

    // Cập nhật preview ngay lập tức trong authStore
    if (user && newAvatarUrl) {
      setUser({ ...user, avatarUrl: newAvatarUrl, displayName: values.displayName });
    }

    onClose();
  };

  const initials = (user?.displayName || user?.username || "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const currentAvatar = avatarPreview || user?.avatarUrl;
  const isBusy = loading || uploadingAvatar;
  const canSave = (isDirty || avatarFile !== null) && !isBusy;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Chỉnh sửa thông tin</DialogTitle>
        </DialogHeader>

        {/* Avatar với nút chỉnh sửa */}
        <div className="flex justify-center mt-1">
          <button
            aria-label="Chọn ảnh đại diện"
            className="relative group"
            onClick={() => avatarInputRef.current?.click()}
            type="button"
          >
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-2xl border-4 border-white dark:border-slate-700 shadow-md group-hover:opacity-80 transition-opacity">
                {initials}
              </div>
            )}

            {/* Overlay camera icon */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
            </div>

            {/* Uploading spinner */}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <span className="material-symbols-outlined text-white animate-spin text-[24px]">progress_activity</span>
              </div>
            )}

            {/* Preview indicator */}
            {avatarFile && !uploadingAvatar && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[12px]">check</span>
              </div>
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400 -mt-1">
          Click vào ảnh để thay đổi (JPG, PNG, GIF, WebP • tối đa 5MB)
        </p>

        {/* Hidden file input */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          {/* Username readonly */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-username" className="text-sm font-medium">Username</Label>
            <Input
              id="ep-username"
              value={`@${user?.username ?? ""}`}
              readOnly
              className="rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-displayname" className="text-sm font-medium">Tên hiển thị</Label>
            <Input
              id="ep-displayname"
              placeholder="Nguyễn Văn A"
              className="rounded-xl"
              {...register("displayName")}
            />
            {errors.displayName && <p className="text-xs text-red-500">{errors.displayName.message}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={isBusy}>
              Huỷ
            </Button>
            <Button
              id="save-profile-btn"
              type="submit"
              disabled={!canSave}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 hover:opacity-90"
            >
              {isBusy ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : "Lưu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
