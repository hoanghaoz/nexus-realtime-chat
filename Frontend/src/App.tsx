import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { Toaster } from "sonner";
import ChatApp from "./pages/ChatApp";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";

function App() {
  const { isDark, setTheme } = useThemeStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  return (
    <TooltipProvider>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/" element={<ChatApp />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
