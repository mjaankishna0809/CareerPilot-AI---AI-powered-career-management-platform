import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";


export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;
  const email =
    typeof claimsData.claims.email === "string"
      ? claimsData.claims.email
      : "No email available";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, headline")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to load profile:", profileError.message);
  }

  const displayName = profile?.full_name || "CareerPilot user";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
     <header className="border-b border-slate-800 bg-slate-950/90">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    <div>
      <p className="text-lg font-bold text-white">CareerPilot AI</p>
      <p className="text-xs text-slate-500">
        Resume and job application workspace
      </p>
    </div>
    <div className="mt-6 flex gap-3">
  <Link
    href="/dashboard/applications/new"
    className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500"
  >
    + Add Application
  </Link>

  <Link
  href="/dashboard/applications"
  className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-200 transition hover:bg-slate-800"
>
  View Applications
</Link>

 
</div>

    <div className="flex items-center gap-3">
      <Link
        href="/dashboard/profile"
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
      >
        Settings
      </Link>

      <LogoutButton />
    </div>
  </div>
</header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section>
          <p className="text-sm font-medium text-indigo-400">
            Career dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Welcome, {displayName}
          </h1>

          <p className="mt-2 text-slate-400">{email}</p>
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard label="Applications" value="0" />
          <DashboardCard label="Interviews" value="0" />
          <DashboardCard label="Offers" value="0" />
          <DashboardCard label="Active resumes" value="0" />
        </section>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-xl font-semibold text-white">
            Your workspace is ready
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            The authentication foundation is working. The next module will
            allow you to complete and update your professional profile.
          </p>
        </section>
      </div>
    </main>
  );
}

type DashboardCardProps = {
  label: string;
  value: string;
};

function DashboardCard({ label, value }: DashboardCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </article>
  );
}