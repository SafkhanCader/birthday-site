import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";

type Status = "checking" | "locked" | "unlocked";

interface AuthCtx {
  status: Status;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((ok) => alive && setStatus(ok ? "unlocked" : "locked"))
      .catch(() => alive && setStatus("locked"));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (password: string) => {
    await api.login(password); // throws on a wrong password
    setStatus("unlocked");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setStatus("locked");
    }
  }, []);

  return <Ctx.Provider value={{ status, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
