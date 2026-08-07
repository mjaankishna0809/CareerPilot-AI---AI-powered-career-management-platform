import Link from "next/link";

export default function ConfirmedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-slate-900 p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-2xl text-emerald-400">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-white">
          Email confirmed
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Your CareerPilot AI account has been verified successfully.
        </p>

        <Link
          href="/auth/login"
          className="mt-7 inline-flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
        >
          Continue to login
        </Link>
      </section>
    </main>
  );
}