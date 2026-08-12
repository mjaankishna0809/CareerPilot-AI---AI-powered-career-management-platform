import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // =====================================================
  // Authentication
  // =====================================================

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  const email =
    typeof claimsData.claims.email === "string"
      ? claimsData.claims.email
      : "No email available";

  // =====================================================
  // Profile
  // =====================================================

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, headline")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Unable to load profile:",
      profileError.message
    );
  }

  const displayName =
    profile?.full_name || "CareerPilot user";

  // =====================================================
  // Dashboard statistics
  // =====================================================

  const [
    applicationsResult,
    interviewsResult,
    offersResult,
  ] = await Promise.all([
    supabase
      .from("job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId),

    supabase
      .from("interviews")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId),

    supabase
      .from("job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .eq("status", "offer"),
  ]);

  const applicationCount =
    applicationsResult.count ?? 0;

  const interviewCount =
    interviewsResult.count ?? 0;

  const offerCount =
    offersResult.count ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      <div className="min-h-screen md:flex">

        {/* =====================================================
            LEFT SIDEBAR
        ===================================================== */}

        <aside className="border-b border-slate-800 bg-slate-900 md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:border-b-0 md:border-r">

          <div className="flex h-full flex-col">

            {/* Brand */}
            <div className="border-b border-slate-800 px-6 py-6">

              <Link
                href="/dashboard"
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                  CP
                </div>

                <div>
                  <h1 className="font-bold text-white">
                    CareerPilot AI
                  </h1>

                  <p className="text-xs text-slate-500">
                    Career workspace
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-6">

              {/* Main */}
              <div>
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Workspace
                </p>

                <div className="space-y-1">

                  <SidebarLink
                    href="/dashboard"
                    label="Dashboard"
                    active
                  />

                  <SidebarLink
                    href="/dashboard/applications"
                    label="Applications"
                  />

                  <SidebarLink
                    href="/dashboard/applications/kanban"
                    label="Application Board"
                  />
                </div>
              </div>

              {/* Application actions */}
              <div>
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Applications
                </p>

                <div className="space-y-1">
                  <SidebarLink
                    href="/dashboard/applications/new"
                    label="Add Application"
                  />
                </div>
              </div>

              {/* Interviews */}
              <div>
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Interviews
                </p>

                <div className="space-y-1">

                  <SidebarLink
                    href="/dashboard/interviews"
                    label="View Interviews"
                  />

                  <SidebarLink
                    href="/dashboard/interviews/new"
                    label="Schedule Interview"
                  />
                </div>
              </div>

              {/* Account */}
              <div>
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Account
                </p>

                <div className="space-y-1">
                  <SidebarLink
                    href="/dashboard/profile"
                    label="Profile & Settings"
                  />
                </div>
              </div>
            </nav>

            {/* User / Logout */}
            <div className="border-t border-slate-800 p-4">

              <div className="mb-4 rounded-xl bg-slate-950/60 p-4">

                <p className="truncate text-sm font-medium text-white">
                  {displayName}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {email}
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <section className="min-w-0 flex-1">

          {/* Top bar */}
          <header className="border-b border-slate-800 bg-slate-950/90">

            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-10">

              <div>
                <p className="text-sm text-slate-500">
                  CareerPilot AI
                </p>

                <h2 className="text-lg font-semibold text-white">
                  Career Dashboard
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">

                <Link
                  href="/dashboard/applications/new"
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  + Add Application
                </Link>

                <Link
                  href="/dashboard/interviews/new"
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  Schedule Interview
                </Link>
              </div>
            </div>
          </header>

          {/* Main Dashboard */}
          <div className="px-6 py-8 lg:px-10 lg:py-10">

            {/* Welcome section */}
            <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <p className="text-sm font-medium text-indigo-400">
                  Career dashboard
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Welcome back, {displayName}
                </h1>

                <p className="mt-3 max-w-2xl text-slate-400">
                  Track job applications, manage interviews,
                  monitor progress and organize your career journey
                  from one workspace.
                </p>

                {profile?.headline && (
                  <p className="mt-2 text-sm text-slate-500">
                    {profile.headline}
                  </p>
                )}
              </div>

              <Link
                href="/dashboard/profile"
                className="inline-flex w-fit rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Edit Profile
              </Link>
            </section>

            {/* =====================================================
                STATISTICS
            ===================================================== */}

            <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <DashboardCard
                label="Applications"
                value={applicationCount}
                description="Total applications tracked"
              />

              <DashboardCard
                label="Interviews"
                value={interviewCount}
                description="Interview sessions"
              />

              <DashboardCard
                label="Offers"
                value={offerCount}
                description="Applications with offers"
              />

              <DashboardCard
                label="Active Resumes"
                value={0}
                description="Resume builder coming next"
              />
            </section>

            {/* =====================================================
                WORKSPACE
            ===================================================== */}

            <section className="mt-10 grid gap-6 xl:grid-cols-3">

              {/* Main workspace */}
              <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-7 xl:col-span-2">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                  <div>
                    <p className="text-sm font-medium text-indigo-400">
                      Career workspace
                    </p>

                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Manage your career activity
                    </h2>

                    <p className="mt-2 max-w-xl leading-7 text-slate-400">
                      Add applications, track recruitment stages
                      and manage upcoming interviews from your
                      CareerPilot workspace.
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">

                  <QuickAction
                    href="/dashboard/applications/new"
                    title="Add Application"
                    description="Track a new job opportunity."
                  />

                  <QuickAction
                    href="/dashboard/applications"
                    title="View Applications"
                    description="Review your current job applications."
                  />

                  <QuickAction
                    href="/dashboard/interviews/new"
                    title="Schedule Interview"
                    description="Record an upcoming interview."
                  />

                  <QuickAction
                    href="/dashboard/interviews"
                    title="Interview Manager"
                    description="View upcoming and previous interviews."
                  />
                </div>
              </article>

              {/* Profile */}
              <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-7">

                <p className="text-sm font-medium text-indigo-400">
                  Profile
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Your professional profile
                </h2>

                <div className="mt-6 space-y-5">

                  <ProfileItem
                    label="Name"
                    value={displayName}
                  />

                  <ProfileItem
                    label="Email"
                    value={email}
                  />

                  <ProfileItem
                    label="Headline"
                    value={
                      profile?.headline ||
                      "Not added yet"
                    }
                  />
                </div>

                <Link
                  href="/dashboard/profile"
                  className="mt-7 inline-flex text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
                >
                  Manage profile →
                </Link>
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   SIDEBAR LINK
========================================================= */

type SidebarLinkProps = {
  href: string;
  label: string;
  active?: boolean;
};

function SidebarLink({
  href,
  label,
  active = false,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

/* =========================================================
   DASHBOARD CARD
========================================================= */

type DashboardCardProps = {
  label: string;
  value: number;
  description: string;
};

function DashboardCard({
  label,
  value,
  description,
}: DashboardCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700">

      <p className="text-sm font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </article>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

type QuickActionProps = {
  href: string;
  title: string;
  description: string;
};

function QuickAction({
  href,
  title,
  description,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-indigo-500/50 hover:bg-slate-900"
    >
      <p className="font-semibold text-white">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </Link>
  );
}

/* =========================================================
   PROFILE ITEM
========================================================= */

type ProfileItemProps = {
  label: string;
  value: string;
};

function ProfileItem({
  label,
  value,
}: ProfileItemProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-slate-300">
        {value}
      </p>
    </div>
  );
}