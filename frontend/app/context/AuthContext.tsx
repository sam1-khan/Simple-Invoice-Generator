"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Font, useFont } from "@/components/font-provider"; // Import useFont

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
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const { setFont } = useFont(); // Use the setFont function from FontProvider

  const refreshUser = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/current-user/`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user) {
      // Re-apply the font after authentication
      const storedFont = localStorage.getItem("app-font") as Font | null;
      if (storedFont) {
        setFont(storedFont);
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