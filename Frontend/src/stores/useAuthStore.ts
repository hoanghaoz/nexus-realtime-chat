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

      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        try {
          localStorage.removeItem("accessToken");
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
          get().setAccessToken(accessToken);
          // Backend hiện tại không trả về username trong JWT token,
          // vì vậy ta sẽ cập nhật thủ công username và displayName vào state từ form.
          set((state) => ({
            user: state.user ? { ...state.user, username, displayName: username } : null,
          }));
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

      /** Đăng xuất */
      signOut: () => {
        get().clearState();
        toast.success("Đăng xuất thành công!");
      },
    }),
    {
      name: "auth-storage",
      // Persist cả accessToken lẫn user để refresh trang vẫn có thông tin
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
);
