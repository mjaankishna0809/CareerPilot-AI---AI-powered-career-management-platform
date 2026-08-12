import Link from "next/link";
import { redirect } from "next/navigation";

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
};

const kanbanStatuses: ApplicationStatus[] = [
  "wishlist",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];

export default async function KanbanPage() {
  const supabase = await createClient();

  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  const { data: applications, error } = await supabase
    .from("job_applications")
    .select(
      `
        id,
        company_name,
        position,
        status,
        location,
        work_mode,
        applied_at
      `
    )
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

  const applicationList =
    (applications as JobApplication[] | null) ?? [];

  const groupedApplications = kanbanStatuses.reduce(
    (groups, status) => {
      groups[status] = applicationList.filter(
        (application) =>
          application.status === status
      );

      return groups;
    },
    {} as Record<
      ApplicationStatus,
      JobApplication[]
    >
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1600px] px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/applications"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to applications
            </Link>

            <p className="mt-8 text-sm font-medium text-indigo-400">
              Job tracker
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Application board
            </h1>

            <p className="mt-2 text-slate-400">
              View your applications by recruitment stage.
            </p>
          </div>

          <Link
            href="/dashboard/applications/new"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            + Add Application
          </Link>
        </div>

        {/* Kanban */}
        <div className="mt-10 overflow-x-auto pb-6">
          <div className="flex min-w-max gap-5">
            {kanbanStatuses.map((status) => {
              const items =
                groupedApplications[status] ?? [];

              return (
                <section
                  key={status}
                  className="w-72 shrink-0"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold text-white">
                      {formatStatus(status)}
                    </h2>

                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/30 p-3">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
                        No applications
                      </div>
                    ) : (
                      items.map((application) => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function ApplicationCard({
  application,
}: {
  application: JobApplication;
}) {
  return (
    <Link
      href={`/dashboard/applications/${application.id}`}
      className="block rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700 hover:bg-slate-900"
    >
      <p className="font-semibold text-white">
        {application.position}
      </p>

      <p className="mt-1 text-sm text-slate-400">
        {application.company_name}
      </p>

      <div className="mt-4 space-y-1 text-xs text-slate-500">
        <p>
          {application.location ||
            "Location not specified"}
        </p>

        <p>
          {formatWorkMode(
            application.work_mode
          )}
        </p>

        {application.applied_at && (
          <p>
            Applied{" "}
            {formatDate(
              application.applied_at
            )}
          </p>
        )}
      </div>
    </Link>
  );
}

function formatStatus(
  status: ApplicationStatus
) {
  const labels: Record<
    ApplicationStatus,
    string
  > = {
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
    return "Work mode not specified";
  }

  const labels: Record<string, string> = {
    onsite: "On-site",
    hybrid: "Hybrid",
    remote: "Remote",
  };

  return labels[workMode] ?? workMode;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(`${date}T00:00:00Z`)
  );
}