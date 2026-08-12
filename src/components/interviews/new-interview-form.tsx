"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

type JobApplicationOption = {
  id: string;
  company_name: string;
  position: string;
};

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

type NewInterviewFormProps = {
  userId: string;
  applications: JobApplicationOption[];
};

export function NewInterviewForm({
  userId,
  applications,
}: NewInterviewFormProps) {
  const router = useRouter();

  const [applicationId, setApplicationId] =
    useState("");

  const [stage, setStage] =
    useState<InterviewStage>("technical");

  const [mode, setMode] =
    useState<InterviewMode>("video");

  const [interviewDate, setInterviewDate] =
    useState("");

  const [interviewTime, setInterviewTime] =
    useState("");

  const [durationMinutes, setDurationMinutes] =
    useState("60");

  const [location, setLocation] =
    useState("");

  const [meetingUrl, setMeetingUrl] =
    useState("");

  const [interviewerName, setInterviewerName] =
    useState("");

  const [interviewerEmail, setInterviewerEmail] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!applicationId) {
      setErrorMessage(
        "Please select a job application."
      );
      return;
    }

    if (!interviewDate) {
      setErrorMessage(
        "Please select the interview date."
      );
      return;
    }

    if (!interviewTime) {
      setErrorMessage(
        "Please select the interview time."
      );
      return;
    }

    const duration = Number(durationMinutes);

    if (
      Number.isNaN(duration) ||
      duration <= 0
    ) {
      setErrorMessage(
        "Duration must be greater than 0."
      );
      return;
    }

    // Combine selected date + time
    const scheduledDate = new Date(
      `${interviewDate}T${interviewTime}:00`
    );

    if (
      Number.isNaN(
        scheduledDate.getTime()
      )
    ) {
      setErrorMessage(
        "Invalid interview date or time."
      );
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("interviews")
      .insert({
        user_id: userId,
        application_id: applicationId,

        stage,
        mode,
        status: "scheduled",

        scheduled_at:
          scheduledDate.toISOString(),

        duration_minutes: duration,

        location:
          location.trim() || null,

        meeting_url:
          meetingUrl.trim() || null,

        interviewer_name:
          interviewerName.trim() || null,

        interviewer_email:
          interviewerEmail.trim() || null,

        notes:
          notes.trim() || null,
      });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard/interviews");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Application */}
      <div>
        <label
          htmlFor="application"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Job application
        </label>

        <select
          id="application"
          value={applicationId}
          onChange={(event) =>
            setApplicationId(
              event.target.value
            )
          }
          disabled={isSubmitting}
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
        >
          <option value="">
            Select application
          </option>

          {applications.map(
            (application) => (
              <option
                key={application.id}
                value={application.id}
              >
                {application.company_name} —{" "}
                {application.position}
              </option>
            )
          )}
        </select>
      </div>

      {/* Stage */}
      <div>
        <label
          htmlFor="stage"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Interview stage
        </label>

        <select
          id="stage"
          value={stage}
          onChange={(event) =>
            setStage(
              event.target
                .value as InterviewStage
            )
          }
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
        >
          <option value="phone_screen">
            Phone Screen
          </option>

          <option value="hr">
            HR Interview
          </option>

          <option value="technical">
            Technical Interview
          </option>

          <option value="behavioral">
            Behavioral Interview
          </option>

          <option value="manager">
            Manager Interview
          </option>

          <option value="final">
            Final Interview
          </option>

          <option value="other">
            Other
          </option>
        </select>
      </div>

      {/* Mode */}
      <div>
        <label
          htmlFor="mode"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Interview mode
        </label>

        <select
          id="mode"
          value={mode}
          onChange={(event) =>
            setMode(
              event.target
                .value as InterviewMode
            )
          }
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
        >
          <option value="phone">
            Phone
          </option>

          <option value="video">
            Video / Online
          </option>

          <option value="onsite">
            On-site
          </option>

          <option value="other">
            Other
          </option>
        </select>
      </div>

      {/* Date + Time */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="interviewDate"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Interview date
          </label>

          <input
            id="interviewDate"
            type="date"
            value={interviewDate}
            onChange={(event) =>
              setInterviewDate(
                event.target.value
              )
            }
            disabled={isSubmitting}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="interviewTime"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Interview time
          </label>

          <input
            id="interviewTime"
            type="time"
            value={interviewTime}
            onChange={(event) =>
              setInterviewTime(
                event.target.value
              )
            }
            disabled={isSubmitting}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label
          htmlFor="duration"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Duration
        </label>

        <div className="flex items-center gap-3">
          <input
            id="duration"
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(
                event.target.value
              )
            }
            disabled={isSubmitting}
            className="w-32 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          />

          <span className="text-sm text-slate-400">
            minutes
          </span>
        </div>
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="location"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Location
        </label>

        <input
          id="location"
          type="text"
          value={location}
          onChange={(event) =>
            setLocation(event.target.value)
          }
          disabled={isSubmitting}
          placeholder="Example: Colombo Office"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
        />
      </div>

      {/* Meeting URL */}
      <div>
        <label
          htmlFor="meetingUrl"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Meeting link
        </label>

        <input
          id="meetingUrl"
          type="url"
          value={meetingUrl}
          onChange={(event) =>
            setMeetingUrl(
              event.target.value
            )
          }
          disabled={isSubmitting}
          placeholder="https://meet.google.com/..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
        />
      </div>

      {/* Interviewer */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="interviewerName"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Interviewer name
          </label>

          <input
            id="interviewerName"
            type="text"
            value={interviewerName}
            onChange={(event) =>
              setInterviewerName(
                event.target.value
              )
            }
            disabled={isSubmitting}
            placeholder="Example: John Silva"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="interviewerEmail"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Interviewer email
          </label>

          <input
            id="interviewerEmail"
            type="email"
            value={interviewerEmail}
            onChange={(event) =>
              setInterviewerEmail(
                event.target.value
              )
            }
            disabled={isSubmitting}
            placeholder="john@company.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Preparation notes
        </label>

        <textarea
          id="notes"
          rows={5}
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          disabled={isSubmitting}
          placeholder="Example: Review React hooks, REST APIs and SQL joins..."
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
        />
      </div>

      {/* Error */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Scheduling interview..."
          : "Schedule Interview"}
      </button>
    </form>
  );
}