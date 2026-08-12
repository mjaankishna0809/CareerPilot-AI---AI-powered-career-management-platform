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

  // --------------------------------
  // 1. Check authentication
  // --------------------------------

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

  // --------------------------------
  // 2. Load interviews
  // --------------------------------

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

  // --------------------------------
  // 3. Separate upcoming and history
  // --------------------------------

  const now = new Date();

  const upcomingInterviews =
    interviewList.filter(
      (interview) =>
        new Date(interview.scheduled_at) >= now &&
        (
          interview.status === "scheduled" ||
          interview.status === "rescheduled"
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Header */}
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
              Manage upcoming interviews and review your interview history.
            </p>
          </div>

          <Link
            href="/dashboard/interviews/new"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            + Schedule Interview
          </Link>
        </div>

        {/* Summary */}
        <section className="mt-10 grid gap-5 sm:grid-cols-3">
          <SummaryCard
            label="Total interviews"
            value={interviewList.length}
          />

          <SummaryCard
            label="Upcoming"
            value={upcomingInterviews.length}
          />

          <SummaryCard
            label="Completed"
            value={
              interviewList.filter(
                (interview) =>
                  interview.status === "completed"
              ).length
            }
          />
        </section>

        {/* Upcoming Interviews */}
        <section className="mt-12">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Upcoming Interviews
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Your scheduled interview sessions.
            </p>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center">
              <h3 className="font-semibold text-white">
                No upcoming interviews
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Schedule an interview when you receive an interview invitation.
              </p>

              <Link
                href="/dashboard/interviews/new"
                className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Schedule Interview
              </Link>
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

        {/* Interview History */}
        <section className="mt-12">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Interview History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Completed, cancelled and past interview sessions.
            </p>
          </div>

          {interviewHistory.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No interview history yet.
            </p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
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
                        Stage
                      </TableHeader>

                      <TableHeader>
                        Date
                      </TableHeader>

                      <TableHeader>
                        Status
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800 bg-slate-950">
                    {interviewHistory.map(
                      (interview) => (
                        <tr
                          key={interview.id}
                          className="hover:bg-slate-900/50"
                        >
                          <TableCell>
                            {interview
                              .job_application
                              ?.company_name ||
                              "Unknown company"}
                          </TableCell>

                          <TableCell>
                            {interview
                              .job_application
                              ?.position ||
                              "Unknown position"}
                          </TableCell>

                          <TableCell>
                            {formatStage(
                              interview.stage
                            )}
                          </TableCell>

                          <TableCell>
                            {formatDateTime(
                              interview.scheduled_at
                            )}
                          </TableCell>

                          <TableCell>
                            <InterviewStatusBadge
                              status={
                                interview.status
                              }
                            />
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

function InterviewCard({
  interview,
}: {
  interview: Interview;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-indigo-400">
            {formatStage(interview.stage)}
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            {interview.job_application
              ?.position ||
              "Unknown position"}
          </h3>

          <p className="mt-1 text-slate-400">
            {interview.job_application
              ?.company_name ||
              "Unknown company"}
          </p>
        </div>

        <InterviewStatusBadge
          status={interview.status}
        />
      </div>

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

      {interview.meeting_url && (
        <a
          href={interview.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Join Interview
        </a>
      )}
    </article>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>
    </article>
  );
}

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

function formatStage(
  stage: InterviewStage
) {
  const labels: Record<
    InterviewStage,
    string
  > = {
    phone_screen: "Phone Screen",
    hr: "HR Interview",
    technical: "Technical Interview",
    behavioral: "Behavioral Interview",
    manager: "Manager Interview",
    final: "Final Interview",
    other: "Other Interview",
  };

  return labels[stage];
}

function formatMode(
  mode: InterviewMode
) {
  const labels: Record<
    InterviewMode,
    string
  > = {
    phone: "Phone",
    video: "Video / Online",
    onsite: "On-site",
    other: "Other",
  };

  return labels[mode];
}

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
    }
  ).format(new Date(date));
}