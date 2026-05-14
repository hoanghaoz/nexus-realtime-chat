import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute – bảo vệ các route yêu cầu đăng nhập.
 * Tuân thủ pattern của Moji_RealtimeChatApp/components/auth/ProtectedRoute.tsx
 *
 * Khác biệt: Nexus không có refresh token, nên chỉ cần kiểm tra accessToken.
 */
const ProtectedRoute = () => {
  const { accessToken, loading } = useAuthStore();
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    // Cho phép zustand persist hydrate xong trước khi kiểm tra
    setStarting(false);
  }, []);

  if (starting || loading) {
    return (
      <div className="flex h-screen items-center justify-center text-foreground">
        Đang tải trang...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
