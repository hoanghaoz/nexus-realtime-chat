import api from "./api";

function extractAccessToken(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";

  const response = data as Record<string, unknown>;
  const token =
    response.accessToken ??
    response.token ??
    response.jwt ??
    response.jwtToken ??
    response.access_token;

  return typeof token === "string" ? token : "";
}

/**
 * authService – tầng gọi API thuần, không chứa state.
 * Tuân thủ cấu trúc của Moji_RealtimeChatApp/services/authService.ts
 */
export const authService = {
  /** Đăng nhập: POST /api/auth/login → { accessToken } */
  signIn: async (username: string, password: string) => {
    const res = await api.post("/auth/login", { username, password });
    return { accessToken: extractAccessToken(res.data) };
  },

  /** Đăng ký: POST /api/auth/register → { accessToken } */
  signUp: async (username: string, password: string) => {
    const res = await api.post("/auth/register", { username, password });
    return { accessToken: extractAccessToken(res.data) };
  },
};
