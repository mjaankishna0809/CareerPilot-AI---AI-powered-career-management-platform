import Link from "next/link";
import { redirect } from "next/navigation";

import {
  KanbanBoard,
  type KanbanApplication,
} from "@/components/applications/kanban-board";
import { createClient } from "@/lib/supabase/server";

export default async function KanbanPage() {
  const supabase = await createClient();

  // --------------------------------
  // Authentication
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
  // Load applications
  // --------------------------------

  const {
    data: applications,
    error,
  } = await supabase
    .from("job_applications")
    .select(
      `
        id,
        company_name,
        position,
        status,
        location,
        work_mode,
        applied_at
      `
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load applications:",
      error.message
    );
  }

  const applicationList =
    (applications as
      | KanbanApplication[]
      | null) ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1600px] px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/applications"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to applications
            </Link>

            <p className="mt-8 text-sm font-medium text-indigo-400">
              Job tracker
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Application board
            </h1>

            <p className="mt-2 text-slate-400">
              Drag applications between
              recruitment stages.
            </p>
          </div>

          <Link
            href="/dashboard/applications/new"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            + Add Application
          </Link>
        </div>

        {/* Board */}
        <div className="mt-10">
          <KanbanBoard
            initialApplications={
              applicationList
            }
          />
        </div>
      </div>
    </main>
  );
}