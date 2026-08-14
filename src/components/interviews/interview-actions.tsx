"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

type InterviewActionsProps = {
  interviewId: string;
  currentStatus: InterviewStatus;
};

export function InterviewActions({
  interviewId,
  currentStatus,
}: InterviewActionsProps) {
  const router = useRouter();

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  async function updateStatus(
    newStatus: InterviewStatus
  ) {
    setErrorMessage("");
    setIsUpdating(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("interviews")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    if (error) {
      setErrorMessage(error.message);
      setIsUpdating(false);
      return;
    }

    setIsUpdating(false);

    router.refresh();
  }

  // =====================================================
  // DELETE INTERVIEW
  // =====================================================

  async function deleteInterview() {
    setErrorMessage("");
    setIsUpdating(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("interviews")
      .delete()
      .eq("id", interviewId);

    if (error) {
      setErrorMessage(error.message);
      setIsUpdating(false);
      return;
    }

    router.replace("/dashboard/interviews");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">

        {/* =================================================
            MARK COMPLETED
        ================================================= */}

        {currentStatus !== "completed" &&
          currentStatus !== "cancelled" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() =>
                updateStatus("completed")
              }
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating
                ? "Updating..."
                : "Mark Completed"}
            </button>
          )}

        {/* =================================================
            RESCHEDULE
        ================================================= */}

        {currentStatus !== "completed" &&
          currentStatus !== "cancelled" && (
            <Link
              href={`/dashboard/interviews/${interviewId}/edit?reschedule=true`}
              className="rounded-xl border border-indigo-500/50 px-4 py-2.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/10"
            >
              Reschedule
            </Link>
          )}

        {/* =================================================
            CANCEL
        ================================================= */}

        {currentStatus !== "cancelled" &&
          currentStatus !== "completed" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => {
                const confirmed =
                  window.confirm(
                    "Are you sure you want to cancel this interview?"
                  );

                if (confirmed) {
                  updateStatus("cancelled");
                }
              }}
              className="rounded-xl border border-amber-500/40 px-4 py-2.5 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-50"
            >
              Cancel Interview
            </button>
          )}

        {/* =================================================
            EDIT
        ================================================= */}

        <Link
          href={`/dashboard/interviews/${interviewId}/edit`}
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          Edit Interview
        </Link>

        {/* =================================================
            DELETE
        ================================================= */}

        <button
          type="button"
          disabled={isUpdating}
          onClick={() =>
            setShowDeleteConfirm(true)
          }
          className="rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

            <h2 className="text-xl font-semibold text-white">
              Delete Interview?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              This interview will be permanently deleted.
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={isUpdating}
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Keep Interview
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={deleteInterview}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {isUpdating
                  ? "Deleting..."
                  : "Delete Interview"}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}