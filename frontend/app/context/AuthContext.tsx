"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Font, useFont } from "@/components/font-provider";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_onboarded: boolean;
  is_staff: boolean;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const { setFont } = useFont();

  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/current-user/`,
        { 
          credentials: "include",
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
        // If on a protected route, redirect client-side
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    } catch (err) {
      console.error("Auth fetch error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    
    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(refreshUser, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      const storedFont = localStorage.getItem("app-font") as Font | null;
      if (storedFont) setFont(storedFont);
      
      // Client-side protection for onboarded users
      if (user.is_onboarded && window.location.pathname === "/onboarding") {
        window.location.href = "/";
      }
    }
  }, [user, setFont]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
