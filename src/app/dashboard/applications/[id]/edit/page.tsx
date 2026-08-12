import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EditApplicationForm } from "@/components/applications/edit-application-form";
import { createClient } from "@/lib/supabase/server";

type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

type JobApplication = {
  id: string;
  company_name: string;
  position: string;
  status: ApplicationStatus;
  location: string | null;
  work_mode: string | null;
  applied_at: string | null;
  deadline: string | null;
};

type EditApplicationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditApplicationPage({
  params,
}: EditApplicationPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  const { data: application, error } = await supabase
    .from("job_applications")
    .select(
      `
        id,
        company_name,
        position,
        status,
        location,
        work_mode,
        applied_at,
        deadline
      `
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load application:", error.message);
  }

  if (!application) {
    notFound();
  }

  const job = application as JobApplication;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/dashboard/applications/${job.id}`}
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to application
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-indigo-400">
            Job tracker
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Edit application
          </h1>

          <p className="mt-2 text-slate-400">
            Update the job application details.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <EditApplicationForm
            applicationId={job.id}
            initialApplication={{
              companyName: job.company_name,
              position: job.position,
              status: job.status,
              location: job.location ?? "",
              workMode: job.work_mode ?? "",
              appliedAt: job.applied_at ?? "",
              deadline: job.deadline ?? "",
            }}
          />
        </section>
      </div>
    </main>
  );
}