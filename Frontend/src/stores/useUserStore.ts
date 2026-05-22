import { create } from "zustand";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import type { UserUpdateDto, UserProfileResponse, UserSearchResponse } from "@/services/userService";
import { useAuthStore } from "./useAuthStore";

interface UserStoreState {
  profile: UserProfileResponse | null;
  searchResults: UserSearchResponse[];
  loading: boolean;

  /** Lấy profile của bất kỳ user nào theo ID */
  fetchProfile: (userId: string) => Promise<UserProfileResponse | null>;
  /** Tìm kiếm user theo tên/username */
  searchUsers: (name: string) => Promise<void>;
  /** Cập nhật thông tin cá nhân của user đang đăng nhập */
  updateProfile: (dto: UserUpdateDto) => Promise<void>;
  /** Xoá kết quả tìm kiếm */
  clearSearch: () => void;
}

/**
 * useUserStore – quản lý state user (profile, search).
 * Tuân thủ kiến trúc của Moji_RealtimeChatApp/stores/useUserStore.ts
 *
 * Nexus không có /users/me – user info lấy từ useAuthStore.user
 * Profile xem được qua GET /api/users/{id}/profile
 */
export const useUserStore = create<UserStoreState>((set) => ({
  profile: null,
  searchResults: [],
  loading: false,

  fetchProfile: async (userId) => {
    try {
      set({ loading: true });
      const profile = await userService.getProfile(userId);
      set({ profile });
      return profile;
    } catch (error) {
      console.error("Lỗi khi fetchProfile:", error);
      toast.error("Không thể tải thông tin profile.");
      return null;
    } finally {
      set({ loading: false });
    }
  },

  searchUsers: async (name) => {
    try {
      set({ loading: true });
      const results = await userService.searchUsers(name);
      set({ searchResults: results });
    } catch (error) {
      console.error("Lỗi khi searchUsers:", error);
      set({ searchResults: [] });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (dto) => {
    try {
      set({ loading: true });
      await userService.updateProfile(dto);

      // Cập nhật lại user trong authStore nếu có thay đổi
      const { user, setUser } = useAuthStore.getState();
      if (user) {
        setUser({
          ...user,
          ...(dto.displayName ? { displayName: dto.displayName } : {}),
          ...(dto.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
        });
      }

      toast.success("Cập nhật thông tin thành công!");
    } catch (error: any) {
      console.error("Lỗi khi updateProfile:", error);
      const detail = error?.response?.data?.detail;
      if (detail) {
        toast.error(detail);
      } else {
        toast.error("Cập nhật thông tin thất bại. Vui lòng thử lại!");
      }
    } finally {
      set({ loading: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),
}));
