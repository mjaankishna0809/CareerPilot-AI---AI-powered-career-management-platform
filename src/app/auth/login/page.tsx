import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in | CareerPilot AI",
  description: "Sign in to your CareerPilot AI account.",
};

export default async function LoginPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
            CP
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Sign in to manage your resumes and job applications.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}