"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, logIn, signUp, logInWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  const heading = useMemo(
    () => (mode === "login" ? "Sign in to your account" : "Create your account"),
    [mode]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        await logIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.replace("/dashboard");
    } catch (authError) {
      setError(getFriendlyAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setSubmitting(true);

    try {
      await logInWithGoogle();
      router.replace("/dashboard");
    } catch (authError) {
      setError(getFriendlyAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return <LoadingSpinner label="Preparing your workspace" />;
  }

  return (
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
            {heading}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Access your private notes securely.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-md border border-zinc-200 bg-zinc-50 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded px-3 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded px-3 py-2 text-sm font-semibold transition ${
              mode === "register"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Register
          </button>
        </div>

        {error ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border-zinc-300 bg-white px-3 py-3 text-zinc-950 shadow-sm focus:border-zinc-900 focus:ring-zinc-900"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border-zinc-300 bg-white px-3 py-3 text-zinc-950 shadow-sm focus:border-zinc-900 focus:ring-zinc-900"
              placeholder="At least 6 characters"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            or
          </span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-950 text-[10px] font-bold text-white">
            G
          </span>
          Continue with Google
        </button>
      </div>
    </section>
  );
}

function getFriendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("auth/email-already-in-use")) {
    return "That email is already registered. Try logging in instead.";
  }

  if (
    message.includes("auth/invalid-credential") ||
    message.includes("auth/wrong-password") ||
    message.includes("auth/user-not-found")
  ) {
    return "The email or password is incorrect.";
  }

  if (message.includes("auth/popup-closed-by-user")) {
    return "Google sign-in was closed before it finished.";
  }

  return "Something went wrong. Please try again.";
}

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-soft ring-1 ring-zinc-200">
            <LoadingSpinner label="Loading sign-in" />
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </main>
  );
}
