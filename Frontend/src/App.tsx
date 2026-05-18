import { BrowserRouter, Route, Routes } from "react-router-dom";
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
  // Tuân thủ pattern của Moji App.tsx (connectSocket / disconnectSocket)
  useEffect(() => {
    if (accessToken) {
      connectChat().then(() => {
        // Fetch conversations sau khi kết nối thành công
        fetchConversations().then(() => {
          const { conversations } = useChatStore.getState();
          const { chatConnection } = useSignalRStore.getState();
          if (chatConnection) {
            for (const conv of conversations) {
              chatConnection.invoke("JoinGroup", conv._id).catch(console.error);
            }
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
          <Route path="/" element={<ChatApp />} />
          {/* Protected routes – yêu cầu đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatApp />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
