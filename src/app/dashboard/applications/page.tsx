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
  deadline: string | null;
  created_at: string;
};

export default async function ApplicationsPage() {
  const supabase = await createClient();

  // -----------------------------
  // Check authentication
  // -----------------------------

  const { data, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !data?.claims) {
    redirect("/auth/login");
  }

  const userId = data.claims.sub;

  // -----------------------------
  // Read applications from Supabase
  // -----------------------------

  const {
    data: applications,
    error: applicationsError,
  } = await supabase
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
        deadline,
        created_at
      `
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (applicationsError) {
    console.error(
      "Unable to load applications:",
      applicationsError.message
    );
  }

  const applicationList =
    (applications as JobApplication[] | null) ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-8 text-sm font-medium text-indigo-400">
              Job tracker
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Applications
            </h1>

            <p className="mt-2 text-slate-400">
              Track your job applications and recruitment progress.
            </p>
          </div>


          <Link
  href="/dashboard/applications/kanban"
  className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
>
  Kanban View
</Link>

          <Link
            href="/dashboard/applications/new"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            + Add Application
          </Link>

          
        </div>

        {/* Application count */}
        <div className="mt-8">
          <p className="text-sm text-slate-400">
            Total applications
          </p>

          <p className="mt-1 text-2xl font-bold text-white">
            {applicationList.length}
          </p>
        </div>

        {/* Empty state */}
        {applicationList.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-white">
              No applications yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
              Start tracking your job search by adding your first
              application.
            </p>

            <Link
              href="/dashboard/applications/new"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Add your first application
            </Link>
          </section>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900">
                  <tr>
                    <TableHeader>Company</TableHeader>
                    <TableHeader>Position</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Work mode</TableHeader>
                    <TableHeader>Applied date</TableHeader>
                    <TableHeader>Deadline</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800 bg-slate-950">
                  {applicationList.map((application) => (
                    <tr
                      key={application.id}
                      className="transition hover:bg-slate-900/60"
                    >
                      <TableCell>
                        <span className="font-medium text-white">
                          {application.company_name}
                        </span>
                      </TableCell>

                      <TableCell>
                        {application.position}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={application.status}
                        />
                      </TableCell>

                      <TableCell>
                        {application.location || "—"}
                      </TableCell>

                      <TableCell>
                        {formatWorkMode(
                          application.work_mode
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          application.applied_at
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          application.deadline
                        )}
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${application.id}`}
                          className="font-medium text-indigo-400 transition hover:text-indigo-300"
                        >
                          View
                        </Link>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
      {children}
    </td>
  );
}

function StatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const labels: Record<ApplicationStatus, string> = {
    wishlist: "Wishlist",
    applied: "Applied",
    screening: "Screening",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  return (
    <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200">
      {labels[status]}
    </span>
  );
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatWorkMode(
  workMode: string | null
) {
  if (!workMode) {
    return "—";
  }

  const labels: Record<string, string> = {
    onsite: "On-site",
    hybrid: "Hybrid",
    remote: "Remote",
  };

  return labels[workMode] ?? workMode;
}