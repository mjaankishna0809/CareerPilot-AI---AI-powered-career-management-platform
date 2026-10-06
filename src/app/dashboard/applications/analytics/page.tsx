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

type Application = {
  id: string;
  company_name: string;
  position: string;
  status: ApplicationStatus;
  created_at: string;
  applied_at: string | null;
};

const statuses: ApplicationStatus[] = [
  "wishlist",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

const statusLabels: Record<ApplicationStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default async function ApplicationAnalyticsPage() {
  const supabase = await createClient();

  // ============================================================
  // Authentication
  // ============================================================

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  // ============================================================
  // Load current user's applications
  // ============================================================

  const {
    data,
    error,
  } = await supabase
    .from("job_applications")
    .select(`
      id,
      company_name,
      position,
      status,
      created_at,
      applied_at
    `)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load application analytics:",
      error.message
    );
  }

  const applications =
    (data as Application[] | null) ?? [];

  // ============================================================
  // Basic statistics
  // ============================================================

  const total = applications.length;

  const active = applications.filter(
    (application) =>
      !["rejected", "withdrawn"].includes(
        application.status
      )
  ).length;

  const wishlist = applications.filter(
    (application) =>
      application.status === "wishlist"
  ).length;

  const applied = applications.filter(
    (application) =>
      application.status === "applied"
  ).length;

  const screening = applications.filter(
    (application) =>
      application.status === "screening"
  ).length;

  const interviews = applications.filter(
    (application) =>
      application.status === "interview"
  ).length;

  const offers = applications.filter(
    (application) =>
      application.status === "offer"
  ).length;

  const rejected = applications.filter(
    (application) =>
      application.status === "rejected"
  ).length;

  const withdrawn = applications.filter(
    (application) =>
      application.status === "withdrawn"
  ).length;

  // ============================================================
  // Response Rate
  //
  // A response means the application moved beyond:
  // Wishlist / Applied
  //
  // Response stages:
  // Screening
  // Interview
  // Offer
  // Rejected
  // ============================================================

  const responded = applications.filter(
    (application) =>
      [
        "screening",
        "interview",
        "offer",
        "rejected",
      ].includes(application.status)
  ).length;

  const responseRate =
    total > 0
      ? Math.round((responded / total) * 100)
      : 0;

  // ============================================================
  // Interview Rate
  //
  // Applications that reached interview stage.
  // ============================================================

  const interviewRate =
    total > 0
      ? Math.round((interviews / total) * 100)
      : 0;

  // ============================================================
  // Offer Rate
  //
  // Applications that resulted in an offer.
  // ============================================================

  const offerRate =
    total > 0
      ? Math.round((offers / total) * 100)
      : 0;

  // ============================================================
  // Rejection Rate
  // ============================================================

  const rejectionRate =
    total > 0
      ? Math.round((rejected / total) * 100)
      : 0;

  // ============================================================
  // Render
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
              href="/dashboard/applications"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to applications
            </Link>

            <p className="mt-8 text-sm font-medium text-indigo-400">
              CareerPilot AI
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Application Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              Understand your job search pipeline,
              application activity, interviews, and offers.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href="/dashboard/applications/kanban"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Kanban
            </Link>

            <Link
              href="/dashboard/applications/new"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              + Add Application
            </Link>

          </div>

        </div>

        {/* ======================================================
            Main Statistics
        ====================================================== */}

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Applications"
            value={total}
            description="All tracked applications"
          />

          <StatCard
            title="Active Applications"
            value={active}
            description="Currently in progress"
          />

          <StatCard
            title="Interviews"
            value={interviews}
            description="Applications reaching interview"
          />

          <StatCard
            title="Offers"
            value={offers}
            description="Offers received"
          />

        </section>

        {/* ======================================================
            Performance Metrics
        ====================================================== */}

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <MetricCard
            title="Response Rate"
            value={`${responseRate}%`}
            description="Applications that received a response"
          />

          <MetricCard
            title="Interview Rate"
            value={`${interviewRate}%`}
            description="Applications reaching interviews"
          />

          <MetricCard
            title="Offer Rate"
            value={`${offerRate}%`}
            description="Applications resulting in offers"
          />

          <MetricCard
            title="Rejection Rate"
            value={`${rejectionRate}%`}
            description="Applications ending in rejection"
          />

        </section>

        {/* ======================================================
            Recruitment Pipeline
        ====================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div>

            <h2 className="text-xl font-semibold text-white">
              Recruitment Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Distribution of your applications across
              recruitment stages.
            </p>

          </div>

          <div className="mt-8 space-y-5">

            {statuses.map((status) => {

              const count =
                applications.filter(
                  (application) =>
                    application.status === status
                ).length;

              const percentage =
                total > 0
                  ? Math.round(
                      (count / total) * 100
                    )
                  : 0;

              return (
                <PipelineRow
                  key={status}
                  label={statusLabels[status]}
                  count={count}
                  percentage={percentage}
                />
              );
            })}

          </div>

        </section>

        {/* ======================================================
            Summary Cards
        ====================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-3">

          <SummaryCard
            title="Application Stages"
            items={[
              ["Wishlist", wishlist],
              ["Applied", applied],
              ["Screening", screening],
            ]}
          />

          <SummaryCard
            title="Recruitment Progress"
            items={[
              ["Interviews", interviews],
              ["Offers", offers],
              ["Rejected", rejected],
            ]}
          />

          <SummaryCard
            title="Closed Applications"
            items={[
              ["Offers", offers],
              ["Rejected", rejected],
              ["Withdrawn", withdrawn],
            ]}
          />

        </section>

        {/* ======================================================
            Recent Applications
        ====================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-xl font-semibold text-white">
                Recent Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest tracked applications.
              </p>

            </div>

            <Link
              href="/dashboard/applications"
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              View all →
            </Link>

          </div>

          {applications.length === 0 ? (

            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">

              <p className="text-slate-400">
                No applications available yet.
              </p>

              <Link
                href="/dashboard/applications/new"
                className="mt-4 inline-block text-sm font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Add your first application →
              </Link>

            </div>

          ) : (

            <div className="mt-6 space-y-3">

              {applications
                .slice(0, 5)
                .map((application) => (

                  <Link
                    key={application.id}
                    href={`/dashboard/applications/${application.id}`}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="font-semibold text-white">
                        {application.position}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {application.company_name}
                      </p>

                    </div>

                    <StatusBadge
                      status={application.status}
                    />

                  </Link>

                ))}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}


// ============================================================
// Stat Card
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
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </article>
  );
}


// ============================================================
// Metric Card
// ============================================================

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-indigo-400">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </article>
  );
}


// ============================================================
// Pipeline Row
// ============================================================

function PipelineRow({
  label,
  count,
  percentage,
}: {
  label: string;
  count: number;
  percentage: number;
}) {
  return (
    <div>

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-slate-300">
          {label}
        </p>

        <p className="text-sm text-slate-400">
          {count}{" "}
          <span className="text-slate-600">
            ({percentage}%)
          </span>
        </p>

      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}


// ============================================================
// Summary Card
// ============================================================

function SummaryCard({
  title,
  items,
}: {
  title: string;
  items: [string, number][];
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <h3 className="font-semibold text-white">
        {title}
      </h3>

      <div className="mt-5 space-y-4">

        {items.map(([label, value]) => (

          <div
            key={label}
            className="flex items-center justify-between"
          >

            <span className="text-sm text-slate-400">
              {label}
            </span>

            <span className="font-semibold text-white">
              {value}
            </span>

          </div>

        ))}

      </div>

    </article>
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
  const styles: Record<
    ApplicationStatus,
    string
  > = {
    wishlist:
      "bg-slate-800 text-slate-300",

    applied:
      "bg-blue-500/10 text-blue-400",

    screening:
      "bg-yellow-500/10 text-yellow-400",

    interview:
      "bg-purple-500/10 text-purple-400",

    offer:
      "bg-emerald-500/10 text-emerald-400",

    rejected:
      "bg-red-500/10 text-red-400",

    withdrawn:
      "bg-orange-500/10 text-orange-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}