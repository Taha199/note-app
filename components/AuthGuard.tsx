"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-md rounded-lg bg-white/90 p-8 shadow-soft ring-1 ring-stone-200">
          <LoadingSpinner label="Checking your session" />
        </div>
      </main>
    );
  }

  return children;
}
