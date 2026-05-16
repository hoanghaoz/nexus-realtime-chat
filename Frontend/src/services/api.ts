import axios from "axios";

export function trimTrailingSlashes(s: string) {
  // Avoid regular expressions to eliminate any risk of catastrophic backtracking.
  let end = s.length;
  while (end > 0 && s.charAt(end - 1) === "/") {
    end--;
  }
  return s.slice(0, end);
}

const base = trimTrailingSlashes(import.meta.env.VITE_API_URL || "");

const api = axios.create({
  baseURL: `${base}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = globalThis.localStorage?.getItem("accessToken");
  const url = (config.url ?? "").toString();
  // don't attach auth header for auth endpoints (login/register)
  const isAuthEndpoint = url.includes("/auth/") || url.endsWith("/auth");

  if (!isAuthEndpoint && token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // token expired or unauthorized -> clear and redirect to sign-in
      globalThis.localStorage?.removeItem("accessToken");
      globalThis.localStorage?.removeItem("auth-storage");
      if (globalThis.location) globalThis.location.href = "/sign-in";
    }
    return Promise.reject(err);
  }
);

export default api;