import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type InterviewStage =
  | "phone_screen"
  | "hr"
  | "technical"
  | "behavioral"
  | "manager"
  | "final"
  | "other";

type InterviewMode =
  | "phone"
  | "video"
  | "onsite"
  | "other";

type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

type Interview = {
  id: string;
  application_id: string;

  stage: InterviewStage;
  mode: InterviewMode;
  status: InterviewStatus;

  scheduled_at: string;
  duration_minutes: number | null;

  location: string | null;
  meeting_url: string | null;

  interviewer_name: string | null;
  notes: string | null;

  job_application: {
    company_name: string;
    position: string;
  } | null;
};

export default async function InterviewsPage() {
  const supabase = await createClient();

  // =====================================================
  // 1. CHECK AUTHENTICATION
  // =====================================================

  const {
    data: claimsData,
    error: authError,
  } = await supabase.auth.getClaims();

  if (
    authError ||
    !claimsData?.claims
  ) {
    redirect("/auth/login");
  }

  const userId =
    claimsData.claims.sub;

  // =====================================================
  // 2. LOAD INTERVIEWS
  // =====================================================

  const {
    data: interviews,
    error: interviewsError,
  } = await supabase
    .from("interviews")
    .select(`
      id,
      application_id,
      stage,
      mode,
      status,
      scheduled_at,
      duration_minutes,
      location,
      meeting_url,
      interviewer_name,
      notes,

      job_application:job_applications (
        company_name,
        position
      )
    `)
    .eq("user_id", userId)
    .order("scheduled_at", {
      ascending: true,
    });

  if (interviewsError) {
    console.error(
      "Unable to load interviews:",
      interviewsError.message
    );
  }

  const interviewList =
    (interviews as Interview[] | null) ?? [];

  // =====================================================
  // 3. SEPARATE UPCOMING AND HISTORY
  // =====================================================

  const now = new Date();

  const upcomingInterviews =
    interviewList.filter(
      (interview) =>
        new Date(
          interview.scheduled_at
        ) >= now &&
        (
          interview.status ===
            "scheduled" ||
          interview.status ===
            "rescheduled"
        )
    );

  const interviewHistory =
    interviewList.filter(
      (interview) =>
        !upcomingInterviews.some(
          (upcoming) =>
            upcoming.id === interview.id
        )
    );

  const completedCount =
    interviewList.filter(
      (interview) =>
        interview.status ===
        "completed"
    ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-8 text-sm font-medium text-indigo-400">
              Interview manager
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Interviews
            </h1>

            <p className="mt-2 text-slate-400">
              Manage upcoming interviews
              and review your interview
              history.
            </p>
          </div>

          <Link
            href="/dashboard/interviews/new"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            + Schedule Interview
          </Link>
        </div>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <section className="mt-10 grid gap-5 sm:grid-cols-3">

          <SummaryCard
            label="Total interviews"
            value={interviewList.length}
          />

          <SummaryCard
            label="Upcoming"
            value={
              upcomingInterviews.length
            }
          />

          <SummaryCard
            label="Completed"
            value={completedCount}
          />

        </section>

        {/* =====================================================
            UPCOMING INTERVIEWS
        ===================================================== */}

        <section className="mt-12">

          <div>
            <h2 className="text-xl font-semibold text-white">
              Upcoming Interviews
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Your scheduled interview
              sessions.
            </p>
          </div>

          {upcomingInterviews.length ===
          0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center">

              <h3 className="font-semibold text-white">
                No upcoming interviews
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Schedule an interview when
                you receive an interview
                invitation.
              </p>

              <div className="flex flex-wrap gap-3">

  <Link
    href="/dashboard/interviews/calendar"
    className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
  >
    Calendar View
  </Link>

  <Link
    href="/dashboard/interviews/new"
    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
  >
    + Schedule Interview
  </Link>

</div>

            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">

              {upcomingInterviews.map(
                (interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                  />
                )
              )}

            </div>
          )}
        </section>

        {/* =====================================================
            INTERVIEW HISTORY
        ===================================================== */}

        <section className="mt-12">

          <div>
            <h2 className="text-xl font-semibold text-white">
              Interview History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Completed, cancelled and
              past interview sessions.
            </p>
          </div>

          {interviewHistory.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-800 px-6 py-10 text-center">

              <p className="text-sm text-slate-500">
                No interview history yet.
              </p>

            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">

              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-slate-800">

                  {/* =====================
                      TABLE HEADER
                  ===================== */}

                  <thead className="bg-slate-900">

                    <tr>
                      <TableHeader>
                        Company
                      </TableHeader>

                      <TableHeader>
                        Position
                      </TableHeader>

                      <TableHeader>
                        Stage
                      </TableHeader>

                      <TableHeader>
                        Date
                      </TableHeader>

                      <TableHeader>
                        Status
                      </TableHeader>

                      <TableHeader>
                        Actions
                      </TableHeader>
                    </tr>

                  </thead>

                  {/* =====================
                      TABLE BODY
                  ===================== */}

                  <tbody className="divide-y divide-slate-800 bg-slate-950">

                    {interviewHistory.map(
                      (interview) => (
                        <tr
                          key={
                            interview.id
                          }
                          className="transition hover:bg-slate-900/50"
                        >

                          {/* Company */}
                          <TableCell>
                            {interview
                              .job_application
                              ?.company_name ||
                              "Unknown company"}
                          </TableCell>

                          {/* Position */}
                          <TableCell>
                            {interview
                              .job_application
                              ?.position ||
                              "Unknown position"}
                          </TableCell>

                          {/* Stage */}
                          <TableCell>
                            {formatStage(
                              interview.stage
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            {formatDateTime(
                              interview.scheduled_at
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <InterviewStatusBadge
                              status={
                                interview.status
                              }
                            />
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center gap-2">

                              <Link
                                href={`/dashboard/interviews/${interview.id}`}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                              >
                                View
                              </Link>

                              <Link
                                href={`/dashboard/interviews/${interview.id}/edit`}
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
                              >
                                Edit
                              </Link>

                            </div>
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

/* =========================================================
   INTERVIEW CARD
========================================================= */

function InterviewCard({
  interview,
}: {
  interview: Interview;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700">

      {/* Header */}
      <div className="flex items-start justify-between gap-5">

        <div>
          <p className="text-sm font-medium text-indigo-400">
            {formatStage(
              interview.stage
            )}
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            {interview
              .job_application
              ?.position ||
              "Unknown position"}
          </h3>

          <p className="mt-1 text-slate-400">
            {interview
              .job_application
              ?.company_name ||
              "Unknown company"}
          </p>
        </div>

        <InterviewStatusBadge
          status={interview.status}
        />

      </div>

      {/* Information */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">

        <InterviewInfo
          label="Date & time"
          value={formatDateTime(
            interview.scheduled_at
          )}
        />

        <InterviewInfo
          label="Mode"
          value={formatMode(
            interview.mode
          )}
        />

        <InterviewInfo
          label="Duration"
          value={
            interview.duration_minutes
              ? `${interview.duration_minutes} minutes`
              : "Not specified"
          }
        />

        <InterviewInfo
          label="Interviewer"
          value={
            interview.interviewer_name ||
            "Not specified"
          }
        />

      </div>

      {/* Location */}
      {interview.location && (
        <div className="mt-5">

          <p className="text-xs text-slate-500">
            Location
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {interview.location}
          </p>

        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">

        {interview.meeting_url && (
          <a
            href={
              interview.meeting_url
            }
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Join Interview
          </a>
        )}

        <Link
          href={`/dashboard/interviews/${interview.id}`}
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          View Details
        </Link>

        <Link
          href={`/dashboard/interviews/${interview.id}/edit`}
          className="rounded-xl border border-indigo-500/50 px-4 py-2.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/10 hover:text-indigo-200"
        >
          Edit Interview
        </Link>

      </div>

    </article>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700">

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>

    </article>
  );
}

/* =========================================================
   INTERVIEW INFO
========================================================= */

function InterviewInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-200">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   INTERVIEW STATUS BADGE
========================================================= */

function InterviewStatusBadge({
  status,
}: {
  status: InterviewStatus;
}) {
  const labels: Record<
    InterviewStatus,
    string
  > = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
  };

  return (
    <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200">
      {labels[status]}
    </span>
  );
}

/* =========================================================
   TABLE HEADER
========================================================= */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

/* =========================================================
   TABLE CELL
========================================================= */

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

/* =========================================================
   FORMAT INTERVIEW STAGE
========================================================= */

function formatStage(
  stage: InterviewStage
) {
  const labels: Record<
    InterviewStage,
    string
  > = {
    phone_screen:
      "Phone Screen",

    hr:
      "HR Interview",

    technical:
      "Technical Interview",

    behavioral:
      "Behavioral Interview",

    manager:
      "Manager Interview",

    final:
      "Final Interview",

    other:
      "Other Interview",
  };

  return labels[stage];
}

/* =========================================================
   FORMAT INTERVIEW MODE
========================================================= */

function formatMode(
  mode: InterviewMode
) {
  const labels: Record<
    InterviewMode,
    string
  > = {
    phone:
      "Phone",

    video:
      "Video / Online",

    onsite:
      "On-site",

    other:
      "Other",
  };

  return labels[mode];
}

/* =========================================================
   FORMAT DATE + TIME
========================================================= */

function formatDateTime(
  date: string
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Colombo",
    }
  ).format(
    new Date(date)
  );
}