import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InterviewActions } from "@/components/interviews/interview-actions";

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
  stage: InterviewStage;
  mode: InterviewMode;
  status: InterviewStatus;

  scheduled_at: string;
  duration_minutes: number | null;

  location: string | null;
  meeting_url: string | null;

  interviewer_name: string | null;
  interviewer_email: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;

  job_application: {
    id: string;
    company_name: string;
    position: string;
    status: string;
    location: string | null;
    work_mode: string | null;
  } | null;
};

type InterviewDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InterviewDetailsPage({
  params,
}: InterviewDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // =====================================================
  // Authentication
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

  const userId = claimsData.claims.sub;

  // =====================================================
  // Load Interview
  // =====================================================

  const {
    data: interview,
    error,
  } = await supabase
    .from("interviews")
    .select(`
      id,
      stage,
      mode,
      status,
      scheduled_at,
      duration_minutes,
      location,
      meeting_url,
      interviewer_name,
      interviewer_email,
      notes,
      created_at,
      updated_at,

      job_application:job_applications (
        id,
        company_name,
        position,
        status,
        location,
        work_mode
      )
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load interview:",
      error.message
    );
  }

  if (!interview) {
    notFound();
  }

  // Supabase may return related rows as arrays. Normalize
  // `job_application` to be either a single object or null
  // so it matches the `Interview` type expected by the UI.
  const rawInterview: any = interview;

  const normalizedJobApplication = rawInterview.job_application
    ? Array.isArray(rawInterview.job_application)
      ? rawInterview.job_application[0] ?? null
      : rawInterview.job_application
    : null;

  const interviewData: Interview = {
    id: rawInterview.id,
    stage: rawInterview.stage,
    mode: rawInterview.mode,
    status: rawInterview.status,
    scheduled_at: rawInterview.scheduled_at,
    duration_minutes: rawInterview.duration_minutes,
    location: rawInterview.location,
    meeting_url: rawInterview.meeting_url,
    interviewer_name: rawInterview.interviewer_name,
    interviewer_email: rawInterview.interviewer_email,
    notes: rawInterview.notes,
    created_at: rawInterview.created_at,
    updated_at: rawInterview.updated_at,
    job_application: normalizedJobApplication,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Back */}
        <Link
          href="/dashboard/interviews"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to interviews
        </Link>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="mt-8 flex flex-col gap-6 border-b border-slate-800 pb-8 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <p className="text-sm font-medium text-indigo-400">
              {formatStage(
                interviewData.stage
              )}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              {interviewData
                .job_application
                ?.position ||
                "Interview"}
            </h1>

            <p className="mt-2 text-lg text-slate-400">
              {interviewData
                .job_application
                ?.company_name ||
                "Unknown company"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">

  <StatusBadge
    status={interviewData.status}
  />

  <Link
    href={`/dashboard/interviews/${interviewData.id}/edit`}
    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
  >
    Edit Interview
  </Link>

</div>

          <StatusBadge
            status={
              interviewData.status
            }
          />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
  <p className="text-sm font-medium text-indigo-400">
    Interview actions
  </p>

  <h2 className="mt-2 text-lg font-semibold text-white">
    Manage Interview
  </h2>

  <p className="mt-2 text-sm text-slate-400">
    Update the interview status, reschedule it or remove it.
  </p>

  <div className="mt-6">
    <InterviewActions
      interviewId={interviewData.id}
      currentStatus={interviewData.status}
    />
  </div>
</section>

        {/* =====================================================
            MAIN INFORMATION
        ===================================================== */}

        <section className="mt-8 grid gap-6 md:grid-cols-2">

          <InfoCard
            label="Date & time"
            value={formatDateTime(
              interviewData.scheduled_at
            )}
          />

          <InfoCard
            label="Interview stage"
            value={formatStage(
              interviewData.stage
            )}
          />

          <InfoCard
            label="Interview mode"
            value={formatMode(
              interviewData.mode
            )}
          />

          <InfoCard
            label="Duration"
            value={
              interviewData.duration_minutes
                ? `${interviewData.duration_minutes} minutes`
                : "Not specified"
            }
          />

          <InfoCard
            label="Interviewer"
            value={
              interviewData.interviewer_name ||
              "Not specified"
            }
          />

          <InfoCard
            label="Interviewer email"
            value={
              interviewData.interviewer_email ||
              "Not specified"
            }
          />

          <InfoCard
            label="Location"
            value={
              interviewData.location ||
              "Not specified"
            }
          />

          <InfoCard
            label="Status"
            value={formatStatus(
              interviewData.status
            )}
          />
        </section>

        {/* =====================================================
            MEETING LINK
        ===================================================== */}

        {interviewData.meeting_url && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

            <p className="text-sm text-slate-500">
              Online meeting
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Meeting link
            </h2>

            <p className="mt-3 break-all text-sm text-slate-400">
              {interviewData.meeting_url}
            </p>

            <a
              href={
                interviewData.meeting_url
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Join Interview
            </a>
          </section>
        )}

        {/* =====================================================
            PREPARATION NOTES
        ===================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <p className="text-sm text-slate-500">
            Preparation
          </p>

          <h2 className="mt-2 text-lg font-semibold text-white">
            Interview Notes
          </h2>

          {interviewData.notes ? (
            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
              {interviewData.notes}
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No preparation notes have been added.
            </p>
          )}
        </section>

        {/* =====================================================
            RELATED APPLICATION
        ===================================================== */}

        {interviewData.job_application && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

            <p className="text-sm font-medium text-indigo-400">
              Related application
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              {
                interviewData
                  .job_application
                  .position
              }
            </h2>

            <p className="mt-1 text-slate-400">
              {
                interviewData
                  .job_application
                  .company_name
              }
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">

              <SmallInfo
                label="Application status"
                value={formatApplicationStatus(
                  interviewData
                    .job_application
                    .status
                )}
              />

              <SmallInfo
                label="Location"
                value={
                  interviewData
                    .job_application
                    .location ||
                  "Not specified"
                }
              />

              <SmallInfo
                label="Work mode"
                value={formatWorkMode(
                  interviewData
                    .job_application
                    .work_mode
                )}
              />
            </div>

            <Link
              href={`/dashboard/applications/${interviewData.job_application.id}`}
              className="mt-6 inline-flex text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
            >
              View application →
            </Link>
          </section>
        )}

        {/* =====================================================
            METADATA
        ===================================================== */}

        <section className="mt-8 border-t border-slate-800 pt-6">

          <div className="flex flex-wrap gap-x-10 gap-y-3 text-xs text-slate-600">

            <p>
              Created{" "}
              {formatDateTime(
                interviewData.created_at
              )}
            </p>

            <p>
              Last updated{" "}
              {formatDateTime(
                interviewData.updated_at
              )}
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-medium text-slate-200">
        {value}
      </p>
    </article>
  );
}

function SmallInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-300">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
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
    <span className="h-fit rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200">
      {labels[status]}
    </span>
  );
}

/* =========================================================
   FORMATTERS
========================================================= */

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

function formatStatus(
  status: InterviewStatus
) {
  const labels: Record<
    InterviewStatus,
    string
  > = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
  };

  return labels[status];
}

function formatWorkMode(
  mode: string | null
) {
  if (!mode) {
    return "Not specified";
  }

  const values: Record<string, string> = {
    onsite: "On-site",
    remote: "Remote",
    hybrid: "Hybrid",
  };

  return values[mode] ?? mode;
}

function formatApplicationStatus(
  status: string
) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
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
      timeZone: "Asia/Colombo",
    }
  ).format(new Date(date));
}