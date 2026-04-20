import React, { createContext, useEffect, useState } from "react";

import api from "@/services/api";

type Credentials = { email?: string; username?: string; password: string };

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  register: (creds: Credentials) => Promise<void>;
  login: (creds: Credentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  isAuthenticated: false,
  register: async () => {},
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("accessToken");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (token) localStorage.setItem("accessToken", token);
      else localStorage.removeItem("accessToken");
    } catch {
      // ignore storage errors
    }
  }, [token]);

  const register = async (creds: Credentials) => {
    const payload = {
      username: creds.username ?? creds.email,
      password: creds.password,
    };
    const res = await api.post("/auth/register", payload);
    const accessToken = res.data?.accessToken;
    if (!accessToken) throw new Error("No token returned");
    setToken(accessToken);
  };

  const login = async (creds: Credentials) => {
    const payload = {
      username: creds.username ?? creds.email,
      password: creds.password,
    };
    const res = await api.post("/auth/login", payload);
    const accessToken = res.data?.accessToken;
    if (!accessToken) throw new Error("No token returned");
    setToken(accessToken);
  };

  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
