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

  // ============================================================
  // Authentication
  // ============================================================

  const { data, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !data?.claims) {
    redirect("/auth/login");
  }

  const userId = data.claims.sub;

  // ============================================================
  // Load applications
  // ============================================================

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

  // ============================================================
  // Statistics
  // ============================================================

  const total = applicationList.length;

  const wishlistCount = applicationList.filter(
    (item) => item.status === "wishlist"
  ).length;

  const appliedCount = applicationList.filter(
    (item) => item.status === "applied"
  ).length;

  const screeningCount = applicationList.filter(
    (item) => item.status === "screening"
  ).length;

  const interviewCount = applicationList.filter(
    (item) => item.status === "interview"
  ).length;

  const offerCount = applicationList.filter(
    (item) => item.status === "offer"
  ).length;

  const rejectedCount = applicationList.filter(
    (item) => item.status === "rejected"
  ).length;

  const activeApplications = applicationList.filter(
    (item) =>
      !["rejected", "withdrawn"].includes(item.status)
  ).length;

  // ============================================================
  // Page
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* ======================================================
            Header
        ====================================================== */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-8 text-sm font-medium text-indigo-400">
              CareerPilot AI
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Job Applications
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              Track your applications, recruitment progress,
              interviews, offers, and deadlines in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <Link
              href="/dashboard/applications/kanban"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
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
        </div>

        {/* ======================================================
            Statistics
        ====================================================== */}

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Applications"
            value={total}
            description="All tracked applications"
          />

          <StatCard
            title="Active"
            value={activeApplications}
            description="Currently in progress"
          />

          <StatCard
            title="Interviews"
            value={interviewCount}
            description="Interview stage"
          />

          <StatCard
            title="Offers"
            value={offerCount}
            description="Offers received"
          />

        </section>

        {/* ======================================================
            Pipeline
        ====================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Application Pipeline
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current distribution of your applications.
              </p>
            </div>

            <Link
              href="/dashboard/applications/kanban"
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              Open Kanban →
            </Link>

          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">

            <PipelineItem
              label="Wishlist"
              count={wishlistCount}
            />

            <PipelineItem
              label="Applied"
              count={appliedCount}
            />

            <PipelineItem
              label="Screening"
              count={screeningCount}
            />

            <PipelineItem
              label="Interview"
              count={interviewCount}
            />

            <PipelineItem
              label="Offer"
              count={offerCount}
            />

            <PipelineItem
              label="Rejected"
              count={rejectedCount}
            />

          </div>
        </section>

        {/* ======================================================
            Applications
        ====================================================== */}

        <section className="mt-8">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold text-white">
                Your Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {total === 0
                  ? "No applications tracked yet."
                  : `${total} application${total === 1 ? "" : "s"} tracked`}
              </p>
            </div>

          </div>

          {/* ====================================================
              Empty State
          ==================================================== */}

          {applicationList.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
                💼
              </div>

              <h2 className="mt-5 text-xl font-semibold text-white">
                No applications yet
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                Start tracking your job search by adding
                your first application.
              </p>

              <Link
                href="/dashboard/applications/new"
                className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
              >
                Add your first application
              </Link>

            </div>

          ) : (

            /* ==================================================
               Application Table
            ================================================== */

            <div className="overflow-hidden rounded-2xl border border-slate-800">

              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-slate-800">

                  <thead className="bg-slate-900">

                    <tr>
                      <TableHeader>
                        Company
                      </TableHeader>

                      <TableHeader>
                        Position
                      </TableHeader>

                      <TableHeader>
                        Status
                      </TableHeader>

                      <TableHeader>
                        Location
                      </TableHeader>

                      <TableHeader>
                        Work Mode
                      </TableHeader>

                      <TableHeader>
                        Applied
                      </TableHeader>

                      <TableHeader>
                        Deadline
                      </TableHeader>

                      <TableHeader>
                        Action
                      </TableHeader>
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-800 bg-slate-950">

                    {applicationList.map(
                      (application) => (
                        <tr
                          key={application.id}
                          className="transition hover:bg-slate-900/60"
                        >

                          {/* Company */}

                          <TableCell>
                            <div>
                              <p className="font-medium text-white">
                                {application.company_name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Added{" "}
                                {formatDate(
                                  application.created_at
                                )}
                              </p>
                            </div>
                          </TableCell>

                          {/* Position */}

                          <TableCell>
                            <span className="text-slate-200">
                              {application.position}
                            </span>
                          </TableCell>

                          {/* Status */}

                          <TableCell>
                            <StatusBadge
                              status={
                                application.status
                              }
                            />
                          </TableCell>

                          {/* Location */}

                          <TableCell>
                            {application.location ||
                              "—"}
                          </TableCell>

                          {/* Work mode */}

                          <TableCell>
                            {formatWorkMode(
                              application.work_mode
                            )}
                          </TableCell>

                          {/* Applied */}

                          <TableCell>
                            {formatDate(
                              application.applied_at
                            )}
                          </TableCell>

                          {/* Deadline */}

                          <TableCell>
                            <Deadline
                              deadline={
                                application.deadline
                              }
                            />
                          </TableCell>

                          {/* Action */}

                          <TableCell>
                            <Link
                              href={`/dashboard/applications/${application.id}`}
                              className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-indigo-400 transition hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-300"
                            >
                              View
                            </Link>
                          </TableCell>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

// ============================================================
// Statistics Card
// ============================================================

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

// ============================================================
// Pipeline Item
// ============================================================

function PipelineItem({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {count}
      </p>

    </div>
  );
}

// ============================================================
// Table Header
// ============================================================

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

// ============================================================
// Table Cell
// ============================================================

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-5 py-4 text-sm text-slate-300">
      {children}
    </td>
  );
}

// ============================================================
// Status Badge
// ============================================================

function StatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const config: Record<
    ApplicationStatus,
    {
      label: string;
      className: string;
    }
  > = {
    wishlist: {
      label: "Wishlist",
      className:
        "border-slate-700 bg-slate-800 text-slate-300",
    },

    applied: {
      label: "Applied",
      className:
        "border-blue-500/20 bg-blue-500/10 text-blue-400",
    },

    screening: {
      label: "Screening",
      className:
        "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    },

    interview: {
      label: "Interview",
      className:
        "border-purple-500/20 bg-purple-500/10 text-purple-400",
    },

    offer: {
      label: "Offer",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    },

    rejected: {
      label: "Rejected",
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },

    withdrawn: {
      label: "Withdrawn",
      className:
        "border-orange-500/20 bg-orange-500/10 text-orange-400",
    },
  };

  const item = config[status];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${item.className}`}
    >
      {item.label}
    </span>
  );
}

// ============================================================
// Deadline
// ============================================================

function Deadline({
  deadline,
}: {
  deadline: string | null;
}) {
  if (!deadline) {
    return (
      <span className="text-slate-500">
        —
      </span>
    );
  }

  const deadlineDate = new Date(
    `${deadline}T00:00:00Z`
  );

  const today = new Date();

  const todayUtc = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    )
  );

  const difference =
    deadlineDate.getTime() -
    todayUtc.getTime();

  const daysRemaining = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) {
    return (
      <div>
        <p className="text-red-400">
          {formatDate(deadline)}
        </p>

        <p className="mt-1 text-xs text-red-500">
          Overdue
        </p>
      </div>
    );
  }

  if (daysRemaining === 0) {
    return (
      <div>
        <p className="text-yellow-400">
          {formatDate(deadline)}
        </p>

        <p className="mt-1 text-xs text-yellow-500">
          Due today
        </p>
      </div>
    );
  }

  if (daysRemaining <= 3) {
    return (
      <div>
        <p className="text-yellow-400">
          {formatDate(deadline)}
        </p>

        <p className="mt-1 text-xs text-yellow-500">
          {daysRemaining} day
          {daysRemaining === 1 ? "" : "s"} left
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-slate-300">
        {formatDate(deadline)}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {daysRemaining} days left
      </p>
    </div>
  );
}

// ============================================================
// Date Formatter
// ============================================================

function formatDate(
  date: string | null
) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(
    date.includes("T")
      ? date
      : `${date}T00:00:00Z`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(parsedDate);
}

// ============================================================
// Work Mode Formatter
// ============================================================

function formatWorkMode(
  workMode: string | null
) {
  if (!workMode) {
    return "—";
  }

  const labels: Record<
    string,
    string
  > = {
    onsite: "On-site",
    hybrid: "Hybrid",
    remote: "Remote",
  };

  return (
    labels[workMode] ??
    workMode
  );
}