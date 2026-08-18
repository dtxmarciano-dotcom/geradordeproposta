"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PublicUser } from "./api";

const STORAGE_KEY = "vantta.auth";

interface StoredAuth {
  token: string;
  user: PublicUser;
}

interface AuthContextValue {
  token: string | null;
  user: PublicUser | null;
  isLoading: boolean;
  login: (auth: StoredAuth) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Decisão de MVP: o token JWT é guardado em localStorage e o React Context
// só espelha esse valor em memória. Isso é vulnerável a roubo de token via
// XSS (um cookie httpOnly + refresh token seria mais seguro), mas evita a
// complexidade de um backend Next.js intermediário só para setar cookies.
// Reavaliar antes de produção real.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstraps auth state from localStorage once, on mount (client only —
  // SSR has no window). This is the one legitimate case for setState inside
  // an effect: synchronizing React state with an external store at startup.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredAuth;
        setToken(parsed.token);
        setUser(parsed.user);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback((auth: StoredAuth) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    setToken(auth.token);
    setUser(auth.user);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, isLoading, login, logout }),
    [token, user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
