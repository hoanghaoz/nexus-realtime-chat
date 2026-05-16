import api from "./api";

/**
 * authService – tầng gọi API thuần, không chứa state.
 * Tuân thủ cấu trúc của Moji_RealtimeChatApp/services/authService.ts
 */
export const authService = {
  /** Đăng nhập: POST /api/auth/login → { accessToken } */
  signIn: async (username: string, password: string) => {
    const res = await api.post("/auth/login", { username, password });
    return res.data as { accessToken: string };
  },

  /** Đăng ký: POST /api/auth/register → { accessToken } */
  signUp: async (username: string, password: string) => {
    const res = await api.post("/auth/register", { username, password });
    return res.data as { accessToken: string };
  },
};
