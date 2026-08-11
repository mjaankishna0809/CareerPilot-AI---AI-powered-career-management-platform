import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, headline, phone, location")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile load error:", profileError.message);
  }

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
            Account settings
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Professional profile
          </h1>

          <p className="mt-2 text-slate-400">
            Manage the information CareerPilot will use for your resumes
            and job applications.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <ProfileForm
            userId={user.id}
            email={user.email ?? ""}
            initialProfile={{
              fullName: profile?.full_name ?? "",
              headline: profile?.headline ?? "",
              phone: profile?.phone ?? "",
              location: profile?.location ?? "",
            }}
          />
        </section>
      </div>
    </main>
  );
}