"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loading, unlockApp } = useAuth();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await unlockApp(password);
      router.replace("/dashboard");
    } catch (unlockError) {
      setError(getPasswordError(unlockError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <LoadingSpinner label="Preparing your workspace" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md">
        <div className="mb-7 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-sm font-bold text-white shadow-sm">
              N
            </span>
            <span className="text-xl font-semibold tracking-tight text-zinc-950">
              Hospital Notes
            </span>
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white/95 p-6 shadow-[0_24px_80px_rgba(24,24,27,0.10)] sm:p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Enter app password
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Use the shared password to open the notes workspace.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-md border-zinc-300 bg-white px-3 py-3 text-zinc-950 shadow-sm focus:border-zinc-900 focus:ring-zinc-900"
                placeholder="Enter password"
                autoFocus
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Opening..." : "Open notes"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function getPasswordError(error: unknown) {
  if (error instanceof Error && error.message === "Invalid app password") {
    return "Wrong password. Please try again.";
  }

  return "Could not open the app. Please try again.";
}
