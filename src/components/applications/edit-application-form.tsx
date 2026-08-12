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

export function EditApplicationForm({
  applicationId,
  initialApplication,
}: EditApplicationFormProps) {
  const router = useRouter();

  const [companyName, setCompanyName] = useState(
    initialApplication.companyName
  );

  const [position, setPosition] = useState(
    initialApplication.position
  );

  const [status, setStatus] =
    useState<ApplicationStatus>(
      initialApplication.status
    );

  const [location, setLocation] = useState(
    initialApplication.location
  );

  const [workMode, setWorkMode] = useState(
    initialApplication.workMode
  );

  const [appliedAt, setAppliedAt] = useState(
    initialApplication.appliedAt
  );

  const [deadline, setDeadline] = useState(
    initialApplication.deadline
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!companyName.trim()) {
      setErrorMessage("Company name is required.");
      return;
    }

    if (!position.trim()) {
      setErrorMessage("Position is required.");
      return;
    }

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

    setIsSaving(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("job_applications")
      .update({
        company_name: companyName.trim(),
        position: position.trim(),
        status,
        location: location.trim() || null,
        work_mode: workMode || null,
        applied_at: appliedAt || null,
        deadline: deadline || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    router.push(
      `/dashboard/applications/${applicationId}`
    );

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
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
            setCompanyName(event.target.value)
          }
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

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
            setPosition(event.target.value)
          }
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

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
          <option value="wishlist">Wishlist</option>
          <option value="applied">Applied</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

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
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

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
            setWorkMode(event.target.value)
          }
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Select work mode</option>
          <option value="onsite">On-site</option>
          <option value="hybrid">Hybrid</option>
          <option value="remote">Remote</option>
        </select>
      </div>

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
              setAppliedAt(event.target.value)
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
              setDeadline(event.target.value)
            }
            disabled={isSaving}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      )}

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