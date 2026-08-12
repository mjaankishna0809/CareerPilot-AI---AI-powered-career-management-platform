import Link from "next/link";
import { redirect } from "next/navigation";

import { NewInterviewForm } from "@/components/interviews/new-interview-form";
import { createClient } from "@/lib/supabase/server";

type JobApplicationOption = {
  id: string;
  company_name: string;
  position: string;
};

export default async function NewInterviewPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  // Load only this user's applications
  const { data: applications, error } = await supabase
    .from("job_applications")
    .select(`
      id,
      company_name,
      position
    `)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load applications:",
      error.message
    );
  }

  const applicationOptions =
    (applications as JobApplicationOption[] | null) ?? [];

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
            Interview manager
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Schedule interview
          </h1>

          <p className="mt-2 text-slate-400">
            Add an upcoming interview for one of your job applications.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          {applicationOptions.length === 0 ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">
                No job applications found
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Add a job application before scheduling an interview.
              </p>

              <Link
                href="/dashboard/applications/new"
                className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
              >
                + Add Application
              </Link>
            </div>
          ) : (
            <NewInterviewForm
              userId={userId}
              applications={applicationOptions}
            />
          )}
        </section>
      </div>
    </main>
  );
}