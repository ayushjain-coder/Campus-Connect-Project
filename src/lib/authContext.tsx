"use client";

/**
 * CampusConnect Auth Context
 * Provides authentication state throughout the app via React Context.
 * Session token stored in localStorage (never the password).
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "STUDENT" | "STAFF" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  studentId?: string;
  year?: string;
  staffId?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "cc_auth_token";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      validateToken(storedToken);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateToken(tok: string) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/session", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setToken(tok);
      } else {
        // Token invalid/expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = useCallback(
    async (
      email: string,
      password: string,
      remember = true
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!data.success) {
          return { success: false, error: data.error || "Sign in failed." };
        }
        setUser(data.user);
        setToken(data.token);
        if (remember) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        return { success: true };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Best effort
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (token) await validateToken(token);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
