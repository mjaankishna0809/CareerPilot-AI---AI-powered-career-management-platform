import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EditInterviewForm } from "@/components/interviews/edit-interview-form";
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

  job_application: {
    company_name: string;
    position: string;
  } | null;
};



export type EditableInterview = Interview;

type EditInterviewPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    reschedule?: string;
  }>;
};

export default async function EditInterviewPage({
  params,
  searchParams,
}: EditInterviewPageProps) {
  const { id } = await params;

  const query = await searchParams;

  const isRescheduling =
    query.reschedule === "true";

  const supabase = await createClient();

  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  const { data: interview, error } = await supabase
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

      job_application:job_applications (
        company_name,
        position
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

  // Normalize related rows from Supabase which may be returned as arrays
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
    job_application: normalizedJobApplication,
  };

  

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">

        <Link
          href={`/dashboard/interviews/${id}`}
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to interview
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-indigo-400">
            Interview manager
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Edit Interview
          </h1>

          <p className="mt-2 text-slate-400">
            {interviewData.job_application
              ?.company_name || "Company"}{" "}
            —{" "}
            {interviewData.job_application
              ?.position || "Position"}
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <EditInterviewForm
  userId={userId}
  interview={interviewData}
  isRescheduling={isRescheduling}
/>
        </section>
      </div>
    </main>
  );
}