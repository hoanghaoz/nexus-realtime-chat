import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // Trỏ  Backend
        changeOrigin: true,
        secure: false,
      },
      "/hubs": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        ws: true, // Cực kỳ quan trọng: Cho phép kết nối WebSocket thời gian thực
      },
    },
  },
});
