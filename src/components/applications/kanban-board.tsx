"use client";

import {
  DragDropProvider,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type KanbanApplication = {
  id: string;
  company_name: string;
  position: string;
  status: ApplicationStatus;
  location: string | null;
  work_mode: string | null;
  applied_at: string | null;
};

type KanbanBoardProps = {
  initialApplications: KanbanApplication[];
};

const kanbanStatuses: ApplicationStatus[] = [
  "wishlist",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

export function KanbanBoard({
  initialApplications,
}: KanbanBoardProps) {
  const router = useRouter();

  const [applications, setApplications] =
    useState<KanbanApplication[]>(
      initialApplications
    );

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus
  ) {
    const application = applications.find(
      (item) => item.id === applicationId
    );

    if (!application) {
      return;
    }

    const oldStatus = application.status;

    // Same column = nothing to do
    if (oldStatus === newStatus) {
      return;
    }

    setErrorMessage("");
    setIsUpdating(true);

    // --------------------------------------------------------
    // Optimistic UI update
    // --------------------------------------------------------

    setApplications((currentApplications) =>
      currentApplications.map((item) =>
        item.id === applicationId
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    const supabase = createClient();

    try {
      // ------------------------------------------------------
      // 1. Update main application
      // ------------------------------------------------------

      const { error: updateError } =
        await supabase
          .from("job_applications")
          .update({
            status: newStatus,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", applicationId);

      if (updateError) {
        throw new Error(
          `Unable to update application: ${updateError.message}`
        );
      }

      // ------------------------------------------------------
      // 2. Save status history
      // ------------------------------------------------------

      const {
        error: historyError,
      } = await supabase
        .from("application_status_history")
        .insert({
          application_id: applicationId,
          from_status: oldStatus,
          to_status: newStatus,
          changed_at:
            new Date().toISOString(),
        });

      if (historyError) {
        // The application status has already changed.
        // Roll it back because the history record failed.
        await supabase
          .from("job_applications")
          .update({
            status: oldStatus,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", applicationId);

        throw new Error(
          `Unable to save status history: ${historyError.message}`
        );
      }

      // ------------------------------------------------------
      // 3. Refresh server data
      // ------------------------------------------------------

      router.refresh();
    } catch (error) {
      console.error(
        "Unable to move application:",
        error
      );

      // Roll back optimistic UI
      setApplications((currentApplications) =>
        currentApplications.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: oldStatus,
              }
            : item
        )
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to move application."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      {/* Error message */}

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      )}

      {/* Updating message */}

      {isUpdating && (
        <p className="mb-4 text-sm text-slate-500">
          Updating application...
        </p>
      )}

      <DragDropProvider
        onDragEnd={async (event) => {
          const {
            operation,
            canceled,
          } = event;

          if (canceled) {
            return;
          }

          const source =
            operation.source;

          const target =
            operation.target;

          if (!source || !target) {
            return;
          }

          const applicationId =
            String(source.id);

          const targetId =
            String(target.id);

          // Only accept column drops
          if (
            !targetId.startsWith(
              "column:"
            )
          ) {
            return;
          }

          const newStatus =
            targetId.replace(
              "column:",
              ""
            ) as ApplicationStatus;

          if (
            !kanbanStatuses.includes(
              newStatus
            )
          ) {
            return;
          }

          await updateApplicationStatus(
            applicationId,
            newStatus
          );
        }}
      >
        <div className="overflow-x-auto pb-6">
          <div className="flex min-w-max gap-5">
            {kanbanStatuses.map(
              (status) => {
                const columnApplications =
                  applications.filter(
                    (application) =>
                      application.status ===
                      status
                  );

                return (
                  <KanbanColumn
                    key={status}
                    status={status}
                    applications={
                      columnApplications
                    }
                    disabled={
                      isUpdating
                    }
                  />
                );
              }
            )}
          </div>
        </div>
      </DragDropProvider>
    </>
  );
}

// ============================================================
// Kanban Column
// ============================================================

type KanbanColumnProps = {
  status: ApplicationStatus;
  applications: KanbanApplication[];
  disabled: boolean;
};

function KanbanColumn({
  status,
  applications,
  disabled,
}: KanbanColumnProps) {
  const {
    ref,
    isDropTarget,
  } = useDroppable({
    id: `column:${status}`,
    accept: "application",
    disabled,
  });

  return (
    <section className="w-72 shrink-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">
          {formatStatus(status)}
        </h2>

        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
          {applications.length}
        </span>
      </div>

      <div
        ref={ref}
        className={`min-h-40 space-y-3 rounded-2xl border p-3 transition ${
          isDropTarget
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-slate-800 bg-slate-900/30"
        }`}
      >
        {applications.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed px-4 py-8 text-center text-sm transition ${
              isDropTarget
                ? "border-indigo-500 text-indigo-300"
                : "border-slate-700 text-slate-500"
            }`}
          >
            {isDropTarget
              ? "Drop application here"
              : "No applications"}
          </div>
        ) : (
          applications.map(
            (application) => (
              <DraggableApplicationCard
                key={application.id}
                application={
                  application
                }
                disabled={disabled}
              />
            )
          )
        )}
      </div>
    </section>
  );
}

// ============================================================
// Application Card
// ============================================================

type DraggableApplicationCardProps = {
  application: KanbanApplication;
  disabled: boolean;
};

function DraggableApplicationCard({
  application,
  disabled,
}: DraggableApplicationCardProps) {
  const {
    ref,
    handleRef,
    isDragging,
  } = useDraggable({
    id: application.id,
    type: "application",
    disabled,
    data: {
      status: application.status,
    },
  });

  return (
    <article
      ref={ref}
      className={`rounded-xl border border-slate-800 bg-slate-950 p-4 transition ${
        isDragging
          ? "opacity-50"
          : "hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white">
            {application.position}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {application.company_name}
          </p>
        </div>

        <button
          ref={handleRef}
          type="button"
          disabled={disabled}
          title="Drag application"
          aria-label={`Move ${application.position}`}
          className="cursor-grab rounded-lg border border-slate-700 px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-white active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
        >
          ⋮⋮
        </button>
      </div>

      <div className="mt-4 space-y-1 text-xs text-slate-500">
        <p>
          {application.location ||
            "Location not specified"}
        </p>

        <p>
          {formatWorkMode(
            application.work_mode
          )}
        </p>

        {application.applied_at && (
          <p>
            Applied{" "}
            {formatDate(
              application.applied_at
            )}
          </p>
        )}
      </div>

      <Link
        href={`/dashboard/applications/${application.id}`}
        className="mt-4 inline-block text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
      >
        View details →
      </Link>
    </article>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatStatus(
  status: ApplicationStatus
) {
  const labels: Record<
    ApplicationStatus,
    string
  > = {
    wishlist: "Wishlist",
    applied: "Applied",
    screening: "Screening",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  return labels[status];
}

function formatWorkMode(
  workMode: string | null
) {
  if (!workMode) {
    return "Work mode not specified";
  }

  const labels: Record<
    string,
    string
  > = {
    onsite: "On-site",
    hybrid: "Hybrid",
    remote: "Remote",
  };

  return (
    labels[workMode] ??
    workMode
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(`${date}T00:00:00Z`)
  );
}