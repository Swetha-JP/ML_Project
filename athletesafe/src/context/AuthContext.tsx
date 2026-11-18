// ============================================================
// AthleteSafe – Auth Context
// NOTE: Keep only React components + hooks in this file for Vite Fast Refresh
// ============================================================
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi, setToken, clearToken } from '../services/api';

// ── Types (kept internal — import from types/auth.ts for external use) ────────
export interface AuthUser {
  id:           string;
  name:         string;
  email:        string;
  role:         string;
  organisation: string;
  joinedAt:     string;
}

export interface RegisterData {
  name:         string;
  email:        string;
  password:     string;
  role:         string;
  organisation: string;
}

interface AuthContextType {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register:        (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout:          () => void;
  forgotPassword:  (email: string) => Promise<{ success: boolean; error?: string }>;
}

const STORAGE_KEY = 'athletesafe_user';

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toAuthUser = (u: any): AuthUser => ({
  id:           u.id,
  name:         u.name,
  email:        u.email,
  role:         u.role,
  organisation: u.organisation,
  joinedAt:     u.created_at ?? new Date().toISOString(),
});

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const saveUser = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setToken(res.access_token);
      saveUser(toAuthUser(res.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Login failed.' };
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      setToken(res.access_token);
      saveUser(toAuthUser(res.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Registration failed.' };
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await new Promise((r) => setTimeout(r, 800));
    if (email.includes('@')) return { success: true };
    return { success: false, error: 'Please enter a valid email.' };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, forgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
