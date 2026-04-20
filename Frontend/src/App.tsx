import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <AuthProvider>
        <Toaster richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/" element={<SignIn />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;
