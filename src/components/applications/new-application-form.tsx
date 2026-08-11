"use client";

import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

type NewApplicationFormProps = {
  userId: string;
};

type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export function NewApplicationForm({
  userId,
}: NewApplicationFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");

  const [status, setStatus] =
    useState<ApplicationStatus>("applied");

  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("");

  const [appliedAt, setAppliedAt] = useState("");
  const [deadline, setDeadline] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // -----------------------------
    // Basic frontend validation
    // -----------------------------

    if (!companyName.trim()) {
      setErrorMessage("Company name is required.");
      return;
    }

    if (!position.trim()) {
      setErrorMessage("Position is required.");
      return;
    }

    // If both dates exist,
    // deadline should not be before applied date.
    if (
      appliedAt &&
      deadline &&
      new Date(deadline) < new Date(appliedAt)
    ) {
      setErrorMessage(
        "Application deadline cannot be earlier than the applied date."
      );
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();

    // -----------------------------
    // Insert application to Supabase
    // -----------------------------

    const { error } = await supabase
      .from("job_applications")
      .insert({
        user_id: userId,

        company_name: companyName.trim(),

        position: position.trim(),

        status,

        location: location.trim() || null,

        work_mode: workMode || null,

        applied_at: appliedAt || null,

        deadline: deadline || null,
      });

    // -----------------------------
    // Handle database error
    // -----------------------------

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    // -----------------------------
    // Success message
    // -----------------------------

    setSuccessMessage(
      "Job application added successfully."
    );

    // -----------------------------
    // Reset form
    // -----------------------------

    setCompanyName("");
    setPosition("");
    setStatus("applied");
    setLocation("");
    setWorkMode("");
    setAppliedAt("");
    setDeadline("");

    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Company Name */}
      <div>
        <label
          htmlFor="companyName"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Company name
        </label>

        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          value={companyName}
          onChange={(event) =>
            setCompanyName(event.target.value)
          }
          disabled={isSubmitting}
          placeholder="Example: LSEG"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Position */}
      <div>
        <label
          htmlFor="position"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Position
        </label>

        <input
          id="position"
          name="position"
          type="text"
          required
          value={position}
          onChange={(event) =>
            setPosition(event.target.value)
          }
          disabled={isSubmitting}
          placeholder="Example: Associate Software Engineer"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Application Status */}
      <div>
        <label
          htmlFor="status"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Application status
        </label>

        <select
          id="status"
          name="status"
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value as ApplicationStatus
            )
          }
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="wishlist">
            Wishlist
          </option>

          <option value="applied">
            Applied
          </option>

          <option value="screening">
            Screening
          </option>

          <option value="interview">
            Interview
          </option>

          <option value="offer">
            Offer
          </option>

          <option value="rejected">
            Rejected
          </option>

          <option value="withdrawn">
            Withdrawn
          </option>
        </select>
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
          name="location"
          type="text"
          value={location}
          onChange={(event) =>
            setLocation(event.target.value)
          }
          disabled={isSubmitting}
          placeholder="Example: Colombo, Sri Lanka"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Work Mode */}
      <div>
        <label
          htmlFor="workMode"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Work mode
        </label>

        <select
          id="workMode"
          name="workMode"
          value={workMode}
          onChange={(event) =>
            setWorkMode(event.target.value)
          }
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Dates */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Applied Date */}
        <div>
          <label
            htmlFor="appliedAt"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Applied date
          </label>

          <input
            id="appliedAt"
            name="appliedAt"
            type="date"
            value={appliedAt}
            onChange={(event) =>
              setAppliedAt(event.target.value)
            }
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Application Deadline */}
        <div>
          <label
            htmlFor="deadline"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Application deadline
          </label>

          <input
            id="deadline"
            name="deadline"
            type="date"
            value={deadline}
            min={appliedAt || undefined}
            onChange={(event) =>
              setDeadline(event.target.value)
            }
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {successMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Adding application..."
          : "Add application"}
      </button>
    </form>
  );
}