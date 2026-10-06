"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

type EditApplicationFormProps = {
  applicationId: string;

  initialApplication: {
    companyName: string;
    position: string;
    status: ApplicationStatus;
    location: string;
    workMode: string;
    appliedAt: string;
    deadline: string;
  };
};

const STATUS_OPTIONS: {
  value: ApplicationStatus;
  label: string;
}[] = [
  {
    value: "wishlist",
    label: "Wishlist",
  },
  {
    value: "applied",
    label: "Applied",
  },
  {
    value: "screening",
    label: "Screening",
  },
  {
    value: "interview",
    label: "Interview",
  },
  {
    value: "offer",
    label: "Offer",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
  },
];

export function EditApplicationForm({
  applicationId,
  initialApplication,
}: EditApplicationFormProps) {
  const router = useRouter();

  const [companyName, setCompanyName] =
    useState(initialApplication.companyName);

  const [position, setPosition] =
    useState(initialApplication.position);

  const [status, setStatus] =
    useState<ApplicationStatus>(
      initialApplication.status
    );

  const [location, setLocation] =
    useState(initialApplication.location);

  const [workMode, setWorkMode] =
    useState(initialApplication.workMode);

  const [appliedAt, setAppliedAt] =
    useState(initialApplication.appliedAt);

  const [deadline, setDeadline] =
    useState(initialApplication.deadline);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (!companyName.trim()) {
      setErrorMessage(
        "Company name is required."
      );
      return;
    }

    if (!position.trim()) {
      setErrorMessage(
        "Position is required."
      );
      return;
    }

    if (
      appliedAt &&
      deadline &&
      new Date(deadline) <
        new Date(appliedAt)
    ) {
      setErrorMessage(
        "Application deadline cannot be earlier than the applied date."
      );
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    try {
      // ------------------------------------------------------
      // 1. Verify current application
      // ------------------------------------------------------

      const {
        data: currentApplication,
        error: currentError,
      } = await supabase
        .from("job_applications")
        .select("status")
        .eq("id", applicationId)
        .single();

      if (currentError) {
        setErrorMessage(
          currentError.message
        );
        return;
      }

      const previousStatus =
        currentApplication.status as ApplicationStatus;

      // ------------------------------------------------------
      // 2. Update application
      // ------------------------------------------------------

      const { error: updateError } =
        await supabase
          .from("job_applications")
          .update({
            company_name:
              companyName.trim(),

            position:
              position.trim(),

            status,

            location:
              location.trim() || null,

            work_mode:
              workMode || null,

            applied_at:
              appliedAt || null,

            deadline:
              deadline || null,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", applicationId);

      if (updateError) {
        setErrorMessage(
          updateError.message
        );
        return;
      }

      // ------------------------------------------------------
      // 3. Record status change
      // ------------------------------------------------------

      if (previousStatus !== status) {
        const {
          error: historyError,
        } = await supabase
          .from(
            "application_status_history"
          )
          .insert({
            application_id:
              applicationId,

            from_status:
              previousStatus,

            to_status:
              status,

            changed_at:
              new Date().toISOString(),
          });

        if (historyError) {
          console.error(
            "Unable to save status history:",
            historyError.message
          );

          // Application itself was updated successfully.
          // Do not undo it because the history insert failed.
        }
      }

      // ------------------------------------------------------
      // 4. Redirect
      // ------------------------------------------------------

      router.push(
        `/dashboard/applications/${applicationId}`
      );

      router.refresh();

    } catch (error) {
      console.error(
        "Unable to update application:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update application."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      {/* ====================================================
          Company
      ==================================================== */}

      <div>

        <label
          htmlFor="companyName"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Company name
        </label>

        <input
          id="companyName"
          type="text"
          required
          value={companyName}
          onChange={(event) =>
            setCompanyName(
              event.target.value
            )
          }
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />

      </div>

      {/* ====================================================
          Position
      ==================================================== */}

      <div>

        <label
          htmlFor="position"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Position
        </label>

        <input
          id="position"
          type="text"
          required
          value={position}
          onChange={(event) =>
            setPosition(
              event.target.value
            )
          }
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />

      </div>

      {/* ====================================================
          Status
      ==================================================== */}

      <div>

        <label
          htmlFor="status"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Application status
        </label>

        <select
          id="status"
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value as ApplicationStatus
            )
          }
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >

          {STATUS_OPTIONS.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}

        </select>

      </div>

      {/* ====================================================
          Location
      ==================================================== */}

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
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />

      </div>

      {/* ====================================================
          Work Mode
      ==================================================== */}

      <div>

        <label
          htmlFor="workMode"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Work mode
        </label>

        <select
          id="workMode"
          value={workMode}
          onChange={(event) =>
            setWorkMode(
              event.target.value
            )
          }
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >

          <option value="">
            Select work mode
          </option>

          <option value="onsite">
            On-site
          </option>

          <option value="hybrid">
            Hybrid
          </option>

          <option value="remote">
            Remote
          </option>

        </select>

      </div>

      {/* ====================================================
          Dates
      ==================================================== */}

      <div className="grid gap-6 sm:grid-cols-2">

        <div>

          <label
            htmlFor="appliedAt"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Applied date
          </label>

          <input
            id="appliedAt"
            type="date"
            value={appliedAt}
            onChange={(event) =>
              setAppliedAt(
                event.target.value
              )
            }
            disabled={isSaving}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />

        </div>

        <div>

          <label
            htmlFor="deadline"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Application deadline
          </label>

          <input
            id="deadline"
            type="date"
            value={deadline}
            min={appliedAt || undefined}
            onChange={(event) =>
              setDeadline(
                event.target.value
              )
            }
            disabled={isSaving}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />

        </div>

      </div>

      {/* ====================================================
          Error
      ==================================================== */}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      )}

      {/* ====================================================
          Success
      ==================================================== */}

      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {successMessage}
        </div>
      )}

      {/* ====================================================
          Actions
      ==================================================== */}

      <div className="flex flex-wrap gap-3">

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "Saving changes..."
            : "Save changes"}
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() =>
            router.push(
              `/dashboard/applications/${applicationId}`
            )
          }
          className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-slate-200 transition hover:bg-slate-800"
        >
          Cancel
        </button>

      </div>

    </form>
  );
}