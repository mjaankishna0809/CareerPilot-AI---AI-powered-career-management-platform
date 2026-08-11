import Link from "next/link";
import { redirect } from "next/navigation";

import { NewApplicationForm } from "@/components/applications/new-application-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewApplicationPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const userId = data.claims.sub;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-indigo-400">
            Job tracker
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Add job application
          </h1>

          <p className="mt-2 text-slate-400">
            Record a job opportunity and track its progress.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <NewApplicationForm userId={userId} />
        </section>
      </div>
    </main>
  );
}