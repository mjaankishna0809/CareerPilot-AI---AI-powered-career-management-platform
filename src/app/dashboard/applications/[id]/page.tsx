import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeleteApplicationButton } from "@/components/applications/delete-application-button";
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
  job_url: string | null;
  location: string | null;
  work_mode: string | null;
  employment_type: string | null;
  source: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  job_description: string | null;
  notes: string | null;
  applied_at: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

type StatusHistory = {
  id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_at: string;
};

type ApplicationDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApplicationDetailsPage({
  params,
}: ApplicationDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // --------------------------------
  // 1. Check authentication
  // --------------------------------

  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  // --------------------------------
  // 2. Get the application
  // --------------------------------

  const {
    data: application,
    error: applicationError,
  } = await supabase
    .from("job_applications")
    .select(
      `
        id,
        company_name,
        position,
        status,
        job_url,
        location,
        work_mode,
        employment_type,
        source,
        salary_min,
        salary_max,
        currency,
        job_description,
        notes,
        applied_at,
        deadline,
        created_at,
        updated_at
      `
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (applicationError) {
    console.error(
      "Unable to load application:",
      applicationError.message
    );
  }

  if (!application) {
    notFound();
  }

  const job = application as JobApplication;

  // --------------------------------
  // 3. Get status history
  // --------------------------------

  const {
    data: history,
    error: historyError,
  } = await supabase
    .from("application_status_history")
    .select(
      `
        id,
        from_status,
        to_status,
        changed_at
      `
    )
    .eq("application_id", id)
    .order("changed_at", {
      ascending: true,
    });

  if (historyError) {
    console.error(
      "Unable to load status history:",
      historyError.message
    );
  }

  const statusHistory =
    (history as StatusHistory[] | null) ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Back */}
        <Link
          href="/dashboard/applications"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to applications
        </Link>

        {/* Header */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-400">
              Job application
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              {job.position}
            </h1>

            <p className="mt-2 text-lg text-slate-400">
              {job.company_name}
            </p>
          </div>

          <StatusBadge status={job.status} />
        </div>

        {/* Basic Information */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard
            label="Location"
            value={job.location || "Not specified"}
          />

          <InfoCard
            label="Work mode"
            value={formatWorkMode(job.work_mode)}
          />

          <InfoCard
            label="Employment type"
            value={job.employment_type || "Not specified"}
          />

          <InfoCard
            label="Applied date"
            value={formatDate(job.applied_at)}
          />

          <InfoCard
            label="Deadline"
            value={formatDate(job.deadline)}
          />

          <InfoCard
            label="Source"
            value={job.source || "Not specified"}
          />
        </section>

        {/* Status History Timeline */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">
            Application progress
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            History of this application&apos;s recruitment stages.
          </p>

          {statusHistory.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No status history available.
            </p>
          ) : (
            <div className="mt-8">
              {statusHistory.map((item, index) => {
                const isLast =
                  index === statusHistory.length - 1;

                return (
                  <div
                    key={item.id}
                    className="relative flex gap-4"
                  >
                    {/* Timeline marker */}
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-indigo-500" />

                      {!isLast && (
                        <div className="h-full min-h-16 w-px bg-slate-700" />
                      )}
                    </div>

                    {/* Timeline content */}
                    <div
                      className={
                        isLast ? "pb-0" : "pb-8"
                      }
                    >
                      <p className="font-medium text-slate-100">
                        {item.from_status
                          ? `${formatStatus(
                              item.from_status
                            )} → ${formatStatus(
                              item.to_status
                            )}`
                          : formatStatus(
                              item.to_status
                            )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(
                          item.changed_at
                        )}
                      </p>

                      {!item.from_status && (
                        <p className="mt-1 text-xs text-slate-500">
                          Initial application status
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Salary */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">
            Salary
          </h2>

          <p className="mt-3 text-slate-300">
            {formatSalary(
              job.salary_min,
              job.salary_max,
              job.currency
            )}
          </p>
        </section>

        {/* Job URL */}
        {job.job_url && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">
              Job posting
            </h2>

            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block break-all text-indigo-400 hover:text-indigo-300"
            >
              {job.job_url}
            </a>
          </section>
        )}

        {/* Job Description */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">
            Job description
          </h2>

          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-400">
            {job.job_description ||
              "No job description added yet."}
          </p>
        </section>

        {/* Notes */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">
            Notes
          </h2>

          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-400">
            {job.notes || "No notes added yet."}
          </p>
        </section>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/applications/${job.id}/edit`}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500"
          >
            Edit Application
          </Link>

          <DeleteApplicationButton
            applicationId={job.id}
            companyName={job.company_name}
            position={job.position}
          />
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-medium text-slate-200">
        {value}
      </p>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <span className="inline-flex w-fit rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300">
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(
  status: ApplicationStatus
) {
  const labels: Record<ApplicationStatus, string> = {
    wishlist: "Wishlist",
    applied: "Applied",
    screening: "Screening",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  return labels[status];
}

function formatWorkMode(
  workMode: string | null
) {
  if (!workMode) {
    return "Not specified";
  }

  const labels: Record<string, string> = {
    onsite: "On-site",
    hybrid: "Hybrid",
    remote: "Remote",
  };

  return labels[workMode] ?? workMode;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  currency: string | null
) {
  if (
    salaryMin === null &&
    salaryMax === null
  ) {
    return "Not specified";
  }

  const selectedCurrency =
    currency || "LKR";

  if (
    salaryMin !== null &&
    salaryMax !== null
  ) {
    return `${selectedCurrency} ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}`;
  }

  if (salaryMin !== null) {
    return `From ${selectedCurrency} ${salaryMin.toLocaleString()}`;
  }

  return `Up to ${selectedCurrency} ${salaryMax?.toLocaleString()}`;
}