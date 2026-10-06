"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
} from "react";

import type { EditableInterview } from "@/app/dashboard/interviews/[id]/edit/page";
import { createClient } from "@/lib/supabase/client";

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

type EditInterviewFormProps = {
  userId: string;
  interview: EditableInterview;
  isRescheduling?: boolean;
};

export function EditInterviewForm({
  userId,
  interview,
  isRescheduling = false,
}: EditInterviewFormProps) {
  const router = useRouter();

  // =====================================================
  // Existing interview values
  // =====================================================

  const initialDate =
    getLocalDateValue(
      interview.scheduled_at
    );

  const initialTime =
    getLocalTimeValue(
      interview.scheduled_at
    );

  const [stage, setStage] =
    useState<InterviewStage>(
      interview.stage
    );

  const [mode, setMode] =
    useState<InterviewMode>(
      interview.mode
    );

  const [
    interviewDate,
    setInterviewDate,
  ] = useState(initialDate);

  const [
    interviewTime,
    setInterviewTime,
  ] = useState(initialTime);

  const [
    durationMinutes,
    setDurationMinutes,
  ] = useState(
    String(
      interview.duration_minutes ?? 60
    )
  );

  const [location, setLocation] =
    useState(
      interview.location ?? ""
    );

  const [
    meetingUrl,
    setMeetingUrl,
  ] = useState(
    interview.meeting_url ?? ""
  );

  const [
    interviewerName,
    setInterviewerName,
  ] = useState(
    interview.interviewer_name ?? ""
  );

  const [
    interviewerEmail,
    setInterviewerEmail,
  ] = useState(
    interview.interviewer_email ?? ""
  );

  const [notes, setNotes] =
    useState(
      interview.notes ?? ""
    );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  // =====================================================
  // Submit Update
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    // -----------------------------------------------------
    // Date and time
    // -----------------------------------------------------

    if (
      !interviewDate ||
      !interviewTime
    ) {
      setErrorMessage(
        "Please select the interview date and time."
      );

      return;
    }

    const scheduledDate =
      new Date(
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

    // -----------------------------------------------------
    // Prevent scheduling in the past
    // -----------------------------------------------------

    if (
      scheduledDate.getTime() <=
      Date.now()
    ) {
      setErrorMessage(
        "Interview date and time must be in the future."
      );

      return;
    }

    // -----------------------------------------------------
    // Duration
    // -----------------------------------------------------

    const duration =
      Number(durationMinutes);

    if (
      Number.isNaN(duration) ||
      duration <= 0
    ) {
      setErrorMessage(
        "Duration must be greater than 0."
      );

      return;
    }

    if (duration > 1440) {
      setErrorMessage(
        "Interview duration cannot exceed 24 hours."
      );

      return;
    }

    // -----------------------------------------------------
    // Meeting URL
    // -----------------------------------------------------

    const trimmedMeetingUrl =
      meetingUrl.trim();

    if (
      mode === "video" &&
      trimmedMeetingUrl
    ) {
      try {
        new URL(trimmedMeetingUrl);
      } catch {
        setErrorMessage(
          "Please enter a valid meeting URL."
        );

        return;
      }
    }

    // -----------------------------------------------------
    // Interviewer email
    // -----------------------------------------------------

    const trimmedEmail =
      interviewerEmail.trim();

    if (trimmedEmail) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          trimmedEmail
        )
      ) {
        setErrorMessage(
          "Please enter a valid interviewer email."
        );

        return;
      }
    }

    // -----------------------------------------------------
    // Submit
    // -----------------------------------------------------

    setIsSubmitting(true);

    const supabase = createClient();

    try {
      const { error } =
        await supabase
          .from("interviews")
          .update({
            stage,

            mode,

            status: isRescheduling
              ? "rescheduled"
              : interview.status,

            scheduled_at:
              scheduledDate.toISOString(),

            duration_minutes:
              duration,

            location:
              location.trim() || null,

            meeting_url:
              trimmedMeetingUrl ||
              null,

            interviewer_name:
              interviewerName.trim() ||
              null,

            interviewer_email:
              trimmedEmail || null,

            notes:
              notes.trim() || null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            interview.id
          )
          .eq(
            "user_id",
            userId
          );

      if (error) {
        console.error(
          "Unable to update interview:",
          error.message
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      // ---------------------------------------------------
      // Success
      // ---------------------------------------------------

      router.push(
        `/dashboard/interviews/${interview.id}`
      );

      router.refresh();

    } catch (error) {
      console.error(
        "Interview update error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update interview."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      {/* ===================================================
          STAGE
      =================================================== */}

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

      {/* ===================================================
          MODE
      =================================================== */}

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

      {/* ===================================================
          DATE + TIME
      =================================================== */}

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
            min={
              new Date()
                .toISOString()
                .split("T")[0]
            }
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

      {/* ===================================================
          DURATION
      =================================================== */}

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
            max="1440"
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

      {/* ===================================================
          LOCATION
      =================================================== */}

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
            setLocation(
              event.target.value
            )
          }
          disabled={isSubmitting}
          placeholder="Example: Colombo Office"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
        />

      </div>

      {/* ===================================================
          MEETING LINK
      =================================================== */}

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

        {mode === "video" && (
          <p className="mt-2 text-xs text-slate-500">
            Add the Google Meet, Microsoft Teams,
            Zoom, or another online meeting link.
          </p>
        )}

      </div>

      {/* ===================================================
          INTERVIEWER
      =================================================== */}

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
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
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

      {/* ===================================================
          NOTES
      =================================================== */}

      <div>

        <label
          htmlFor="notes"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Preparation notes
        </label>

        <textarea
          id="notes"
          rows={6}
          value={notes}
          onChange={(event) =>
            setNotes(
              event.target.value
            )
          }
          disabled={isSubmitting}
          placeholder="Interview preparation notes..."
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
        />

      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      )}

      {/* ===================================================
          ACTIONS
      =================================================== */}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/dashboard/interviews/${interview.id}`
            )
          }
          disabled={isSubmitting}
          className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving changes..."
            : isRescheduling
              ? "Reschedule Interview"
              : "Save Changes"}
        </button>

      </div>

    </form>
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalDateValue(
  dateString: string
) {
  const date =
    new Date(dateString);

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalTimeValue(
  dateString: string
) {
  const date =
    new Date(dateString);

  const hours =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getMinutes()
    ).padStart(2, "0");

  return `${hours}:${minutes}`;
}