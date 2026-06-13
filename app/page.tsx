import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md text-center">
        <div className="mb-8 inline-flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-zinc-950 text-sm font-bold text-white shadow-sm">
            N
          </span>
          <span className="text-2xl font-semibold tracking-tight text-zinc-950">
            Hospital Notes
          </span>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white/95 p-7 shadow-[0_24px_80px_rgba(24,24,27,0.10)]">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Private notes, simply managed.
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Securely sign in and manage your notes from one clean workspace.
          </p>

          <div className="mt-7 grid gap-3">
            <Link
              href="/auth"
              className="rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Login
            </Link>
            <Link
              href="/auth?mode=register"
              className="rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
