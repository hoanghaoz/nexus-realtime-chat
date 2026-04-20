import axios from "axios";

const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${base}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // token expired or unauthorized -> clear and redirect to sign-in
      localStorage.removeItem("accessToken");
      window.location.href = "/sign-in";
    }
    return Promise.reject(err);
  }
);

export default api;