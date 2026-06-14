"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type AppUser = {
  uid: string;
  email: string;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  unlockApp: (password: string) => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { unlocked?: boolean; user?: AppUser } | null) => {
        if (active) {
          setUser(data?.unlocked ? data.user ?? null : null);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      unlockApp: async (password) => {
        const response = await fetch("/api/unlock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ password })
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "Could not unlock app");
        }

        setUser({
          uid: "password-access",
          email: "Password access"
        });
      },
      logOut: async () => {
        await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
        setUser(null);
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
