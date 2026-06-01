import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { Toaster } from "sonner";
import ChatApp from "./pages/ChatApp";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { useAuthStore } from "./stores/useAuthStore";
import { useSignalRStore } from "./stores/useSignalRStore";
import { useChatStore } from "./stores/useChatStore";

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { connectChat, disconnectChat } = useSignalRStore();
  const { fetchConversations } = useChatStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  // Kết nối SignalR ChatHub khi user đăng nhập, ngắt khi đăng xuất
  useEffect(() => {
    if (accessToken) {
      useAuthStore.getState().fetchProfile().catch(console.error);

      connectChat().then(() => {
        // Fetch conversations sau khi kết nối thành công
        fetchConversations().then(() => {
          const { conversations, fetchConversationDetail } = useChatStore.getState();
          const { chatConnection } = useSignalRStore.getState();
          // Join SignalR groups + fetch chi tiết (members, lastMessage) cho mọi conversation
          for (const conv of conversations) {
            chatConnection?.invoke("JoinGroup", conv._id).catch(console.error);
            fetchConversationDetail(conv._id).catch(console.error);
          }
        });
      });
    }

    return () => {
      disconnectChat();
    };
  }, [accessToken]);

  return (
    <TooltipProvider>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          {/* Protected routes – yêu cầu đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatApp />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
