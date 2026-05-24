import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import type { User } from "@/types/user";

/**
 * Decode JWT payload (không verify signature – chỉ lấy claim để hiển thị UI).
 * Nexus JWT claims thường chứa:
 *   sub / nameid  → userId
 *   unique_name   → username
 *   name          → displayName (nếu có)
 */
function decodeJwt(token: string): Partial<User> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as Record<string, string>;
    return {
      _id:
        claims["sub"] ??
        claims["nameid"] ??
        claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
        "",
      username:
        claims["unique_name"] ??
        claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
        claims["name"] ??
        "",
      displayName:
        claims["name"] ??
        claims["unique_name"] ??
        "",
      email: claims["email"] ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * useAuthStore – quản lý state xác thực.
 * Tuân thủ kiến trúc của Moji_RealtimeChatApp/stores/useAuthStore.ts
 *
 * Khác biệt so với Moji:
 * - Backend Nexus chỉ nhận { username, password } cho cả login lẫn register.
 * - Không có refresh token / cookie; token được lưu trong localStorage qua
 *   persist middleware và đính kèm bởi api.ts interceptor.
 * - Không có fetchMe (Nexus chưa expose /users/me ở thời điểm này).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      setAccessToken: (accessToken) => {
        set({ accessToken });
        // Đồng bộ sang localStorage để api.ts interceptor đọc được
        try {
          localStorage.setItem("accessToken", accessToken);
        } catch {
          // ignore storage errors
        }
        // Decode JWT để lấy user info ngay mà không cần gọi thêm API
        const decoded = decodeJwt(accessToken);
        if (decoded?._id) {
          set({ user: decoded as User });
        }
      },

      setUser: (user) => set({ user }),

      /** Cập nhật profile (avatar, displayName) qua API */
      updateProfile: async (data) => {
        try {
          set({ loading: true });
          const { userService } = await import("@/services/userService");
          await userService.updateProfile(data);
          // Fetch lại profile để đồng bộ state với DB
          await get().fetchProfile();
        } catch (error) {
          console.error("updateProfile error:", error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        try {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("group-participants-cache");
        } catch {
          // ignore storage errors
        }
      },

      /** Đăng ký tài khoản mới */
      signUp: async (username, password) => {
        try {
          set({ loading: true });
          await authService.signUp(username, password);
          // Không tự động đăng nhập sau khi đăng ký
          toast.success("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục 🎉");
        } catch (error: any) {
          console.error("signUp error:", error);
          const status = error?.response?.status;
          if (status === 409) {
            toast.error("Tên đăng nhập đã tồn tại. Hãy chọn tên khác!");
          } else {
            toast.error("Đăng ký không thành công. Vui lòng thử lại!");
          }
          throw error; // để form bắt được và xử lý nếu cần
        } finally {
          set({ loading: false });
        }
      },

      /** Đăng nhập */
      signIn: async (username, password) => {
        try {
          get().clearState();
          set({ loading: true });
          const { accessToken } = await authService.signIn(username, password);
          if (!accessToken) {
            throw new Error("No access token returned from login API");
          }
          get().setAccessToken(accessToken);
          // Lấy profile thật từ server để có avatarUrl thay vì chỉ set username thủ công
          const userId = get().user?._id;
          if (userId) {
            try {
              const { userService } = await import("@/services/userService");
              const profile = await userService.getProfile(userId);
              set((state) => ({
                user: state.user
                  ? {
                      ...state.user,
                      username: profile.username,
                      displayName: profile.displayName || profile.username,
                      avatarUrl: profile.avatarUrl || undefined,
                    }
                  : null,
              }));
            } catch (err) {
              console.warn("Could not fetch profile after login", err);
              // Fallback
              set((state) => ({
                user: state.user ? { ...state.user, username, displayName: username } : null,
              }));
            }
          }
          toast.success("Chào mừng bạn quay lại Nexus 🚀");
        } catch (error: any) {
          console.error("signIn error:", error);
          const status = error?.response?.status;
          if (status === 401) {
            toast.error("Tên đăng nhập hoặc mật khẩu không đúng!");
          } else {
            toast.error("Đăng nhập không thành công. Vui lòng thử lại!");
          }
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      /** Lấy profile mới nhất (khi F5 hoặc sau khi update) */
      fetchProfile: async () => {
        const userId = get().user?._id;
        if (!userId) return;
        try {
          const { userService } = await import("@/services/userService");
          const profile = await userService.getProfile(userId);
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  username: profile.username,
                  displayName: profile.displayName || profile.username,
                  avatarUrl: profile.avatarUrl || undefined,
                }
              : null,
          }));
        } catch (error) {
          console.error("fetchProfile error:", error);
        }
      },

      /** Đăng xuất */
      signOut: () => {
        get().clearState();
        toast.success("Đăng xuất thành công!");
      },
    }),
    {
      name: "auth-storage",
      // KHÔNG lưu avatarUrl vào localStorage vì dung lượng base64 lớn gây lỗi QuotaExceededError
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        user: state.user ? { ...state.user, avatarUrl: undefined } : null 
      }),
    }
  )
);
