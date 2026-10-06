import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

type UpcomingInterview = {
  id: string;
  application_id: string;
  stage: string;
  mode: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number | null;
  location: string | null;
  meeting_url: string | null;
  interviewer_name: string | null;
};

type ApplicationInfo = {
  id: string;
  company_name: string;
  position: string;
  status: ApplicationStatus;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // =========================================================
  // Authentication
  // =========================================================

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  const email =
    typeof claimsData.claims.email === "string"
      ? claimsData.claims.email
      : "No email available";

  // =========================================================
  // Profile
  // =========================================================

  const {
    data: profile,
    error: profileError,
  } = await supabase
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

  // =========================================================
  // Current time
  // =========================================================

  const now = new Date().toISOString();

  // =========================================================
  // Dashboard data
  // =========================================================

  const [
    applicationsResult,
    interviewsResult,
    offersResult,
    resumesResult,
    activeApplicationsResult,
    upcomingInterviewsResult,
    interviewApplicationsResult,
  ] = await Promise.all([
    // -----------------------------------------
    // Total applications
    // -----------------------------------------

    supabase
      .from("job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId),

    // -----------------------------------------
    // Total interview sessions
    // -----------------------------------------

    supabase
      .from("interviews")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId),

    // -----------------------------------------
    // Offers
    // -----------------------------------------

    supabase
      .from("job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .eq("status", "offer"),

    // -----------------------------------------
    // Resumes
    // -----------------------------------------

    supabase
      .from("resumes")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId),

    // -----------------------------------------
    // Active applications
    // -----------------------------------------

    supabase
      .from("job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .not(
        "status",
        "in",
        "(rejected,withdrawn,offer)"
      ),

    // -----------------------------------------
    // Upcoming interviews
    // -----------------------------------------

    supabase
      .from("interviews")
      .select(
        `
          id,
          application_id,
          stage,
          mode,
          status,
          scheduled_at,
          duration_minutes,
          location,
          meeting_url,
          interviewer_name
        `
      )
      .eq("user_id", userId)
      .gt("scheduled_at", now)
      .not("status", "eq", "cancelled")
      .order("scheduled_at", {
        ascending: true,
      })
      .limit(5),

    // -----------------------------------------
    // Applications that have interviews
    //
    // IMPORTANT:
    // We select application_id instead of counting
    // interview rows because one application can
    // have multiple interview sessions.
    // -----------------------------------------

    supabase
      .from("interviews")
      .select("application_id")
      .eq("user_id", userId)
      .not("status", "eq", "cancelled"),
  ]);

  // =========================================================
  // Error logging
  // =========================================================

  if (applicationsResult.error) {
    console.error(
      "Unable to load application count:",
      applicationsResult.error.message
    );
  }

  if (interviewsResult.error) {
    console.error(
      "Unable to load interview count:",
      interviewsResult.error.message
    );
  }

  if (offersResult.error) {
    console.error(
      "Unable to load offer count:",
      offersResult.error.message
    );
  }

  if (resumesResult.error) {
    console.error(
      "Unable to load resume count:",
      resumesResult.error.message
    );
  }

  if (activeApplicationsResult.error) {
    console.error(
      "Unable to load active application count:",
      activeApplicationsResult.error.message
    );
  }

  if (upcomingInterviewsResult.error) {
    console.error(
      "Unable to load upcoming interviews:",
      upcomingInterviewsResult.error.message
    );
  }

  if (interviewApplicationsResult.error) {
    console.error(
      "Unable to load interview applications:",
      interviewApplicationsResult.error.message
    );
  }

  // =========================================================
  // Counts
  // =========================================================

  const applicationCount =
    applicationsResult.count ?? 0;

  // This is the actual number of interview sessions.
  //
  // Example:
  // Application A -> 3 interviews
  // Application B -> 1 interview
  //
  // interviewCount = 4
  const interviewCount =
    interviewsResult.count ?? 0;

  const offerCount =
    offersResult.count ?? 0;

  const resumeCount =
    resumesResult.count ?? 0;

  const activeApplicationCount =
    activeApplicationsResult.count ?? 0;

  const upcomingInterviews =
    (upcomingInterviewsResult.data as
      | UpcomingInterview[]
      | null) ?? [];

  // =========================================================
  // Calculate unique applications reaching interviews
  // =========================================================

  const interviewApplicationIds = new Set(
    (interviewApplicationsResult.data ?? [])
      .map(
        (interview) =>
          interview.application_id
      )
      .filter(Boolean)
  );

  const applicationsWithInterviews =
    interviewApplicationIds.size;

  // =========================================================
  // Calculate career metrics
  // =========================================================

  /*
   * A "response" means the application has moved beyond
   * wishlist/applied and has received a meaningful outcome:
   *
   * screening
   * interview
   * offer
   * rejected
   *
   * Withdrawn applications are not counted as employer responses.
   */

  const responseResult =
    await supabase
      .from("job_applications")
      .select("status")
      .eq("user_id", userId)
      .in("status", [
        "screening",
        "interview",
        "offer",
        "rejected",
      ]);

  if (responseResult.error) {
    console.error(
      "Unable to calculate response rate:",
      responseResult.error.message
    );
  }

  const respondedApplications =
    responseResult.data?.length ?? 0;

  const responseRate =
    applicationCount > 0
      ? Math.round(
          (respondedApplications /
            applicationCount) *
            100
        )
      : 0;

  // =========================================================
  // Interview Rate
  // =========================================================
  //
  // IMPORTANT:
  // Do NOT use interviewCount here.
  //
  // interviewCount = number of interview sessions.
  //
  // applicationsWithInterviews = number of unique
  // applications that reached an interview.
  //
  // Example:
  //
  // 2 applications
  // 4 interview sessions
  //
  // Application A -> 3 interviews
  // Application B -> 1 interview
  //
  // Interview Rate = 2 / 2 * 100 = 100%
  //
  // NOT:
  //
  // 4 / 2 * 100 = 200%
  // =========================================================

  const interviewRate =
    applicationCount > 0
      ? Math.min(
          100,
          Math.round(
            (applicationsWithInterviews /
              applicationCount) *
              100
          )
        )
      : 0;

  // =========================================================
  // Offer Rate
  // =========================================================

  const offerRate =
    applicationCount > 0
      ? Math.round(
          (offerCount /
            applicationCount) *
            100
        )
      : 0;

  // =========================================================
  // Load application details for upcoming interviews
  // =========================================================

  const applicationIds =
    upcomingInterviews.map(
      (interview) =>
        interview.application_id
    );

  let applicationInfo: ApplicationInfo[] =
    [];

  if (applicationIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("job_applications")
      .select(
        `
          id,
          company_name,
          position,
          status
        `
      )
      .eq("user_id", userId)
      .in("id", applicationIds);

    if (error) {
      console.error(
        "Unable to load interview applications:",
        error.message
      );
    }

    applicationInfo =
      (data as ApplicationInfo[] | null) ??
      [];
  }

  // =========================================================
  // Return
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="min-h-screen md:flex">

        {/* =====================================================
            LEFT SIDEBAR
        ===================================================== */}

        <aside className="border-b border-slate-800 bg-slate-900 md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:border-b-0 md:border-r">

          <div className="flex h-full flex-col">

            {/* BRAND */}

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

            {/* NAVIGATION */}

            <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-6">

              {/* WORKSPACE */}

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

                  <SidebarLink
                    href="/dashboard/applications/analytics"
                    label="Application Analytics"
                  />

                </div>

              </div>

              {/* APPLICATIONS */}

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

              {/* INTERVIEWS */}

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
                    href="/dashboard/interviews/calendar"
                    label="Interview Calendar"
                  />

                  <SidebarLink
                    href="/dashboard/interviews/new"
                    label="Schedule Interview"
                  />

                </div>

              </div>

              {/* RESUMES */}

              <div>

                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Resumes
                </p>

                <div className="space-y-1">

                  <SidebarLink
                    href="/dashboard/resumes"
                    label="My Resumes"
                  />

                  <SidebarLink
                    href="/dashboard/resumes/new"
                    label="Create Resume"
                  />

                </div>

              </div>

              {/* AI TOOLS */}

              <div>

                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  AI Tools
                </p>

                <div className="space-y-1">

                  <SidebarLink
                    href="/dashboard/analyzer"
                    label="AI Resume Analyzer"
                  />

                  <SidebarLink
                    href="/dashboard/analyzer/history"
                    label="Analysis History"
                  />

                </div>

              </div>

              {/* ACCOUNT */}

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

            {/* USER / LOGOUT */}

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

          {/* TOP BAR */}

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

          {/* MAIN */}

          <div className="px-6 py-8 lg:px-10 lg:py-10">

            {/* =================================================
                WELCOME
            ================================================= */}

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
                  monitor progress and organize your career
                  journey from one workspace.
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

            {/* =================================================
                MAIN STATISTICS
            ================================================= */}

            <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <DashboardCard
                label="Applications"
                value={applicationCount}
                description="Total applications tracked"
              />

              <DashboardCard
                label="Active Applications"
                value={activeApplicationCount}
                description="Applications still in progress"
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

            </section>

            {/* =================================================
                CAREER METRICS
            ================================================= */}

            <section className="mt-6 grid gap-5 sm:grid-cols-3">

              <MetricCard
                label="Response Rate"
                value={responseRate}
                description="Applications receiving a response"
              />

              <MetricCard
                label="Interview Rate"
                value={interviewRate}
                description="Applications reaching interviews"
              />

              <MetricCard
                label="Offer Rate"
                value={offerRate}
                description="Applications resulting in offers"
              />

            </section>

            {/* =================================================
                UPCOMING INTERVIEWS
            ================================================= */}

            <section className="mt-10">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="text-sm font-medium text-indigo-400">
                    Your schedule
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-white">
                    Upcoming Interviews
                  </h2>

                </div>

                <Link
                  href="/dashboard/interviews/calendar"
                  className="text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
                >
                  View calendar →
                </Link>

              </div>

              {upcomingInterviews.length === 0 ? (

                <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">

                  <p className="text-lg font-semibold text-white">
                    No upcoming interviews
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Schedule an interview to see it here.
                  </p>

                  <Link
                    href="/dashboard/interviews/new"
                    className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Schedule Interview
                  </Link>

                </div>

              ) : (

                <div className="mt-5 grid gap-4 lg:grid-cols-2">

                  {upcomingInterviews.map(
                    (interview) => {

                      const application =
                        applicationInfo.find(
                          (item) =>
                            item.id ===
                            interview.application_id
                        );

                      return (
                        <article
                          key={interview.id}
                          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700"
                        >

                          <div className="flex items-start justify-between gap-4">

                            <div className="min-w-0">

                              <p className="text-sm font-medium text-indigo-400">
                                {formatInterviewStage(
                                  interview.stage
                                )}
                              </p>

                              <h3 className="mt-1 truncate text-lg font-semibold text-white">
                                {application?.position ||
                                  "Interview"}
                              </h3>

                              <p className="mt-1 text-sm text-slate-400">
                                {application?.company_name ||
                                  "Company not available"}
                              </p>

                            </div>

                            <span className="shrink-0 rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                              {formatInterviewMode(
                                interview.mode
                              )}
                            </span>

                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">

                            <InfoItem
                              label="Date"
                              value={formatInterviewDate(
                                interview.scheduled_at
                              )}
                            />

                            <InfoItem
                              label="Time"
                              value={formatInterviewTime(
                                interview.scheduled_at
                              )}
                            />

                            <InfoItem
                              label="Interviewer"
                              value={
                                interview.interviewer_name ||
                                "Not specified"
                              }
                            />

                            <InfoItem
                              label="Location"
                              value={
                                interview.location ||
                                (interview.meeting_url
                                  ? "Online"
                                  : "Not specified")
                              }
                            />

                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">

                            <Link
                              href={`/dashboard/interviews/${interview.id}`}
                              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                            >
                              View Interview
                            </Link>

                            {interview.meeting_url && (
                              <a
                                href={
                                  interview.meeting_url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                              >
                                Join Meeting
                              </a>
                            )}

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>
              )}

            </section>

            {/* =================================================
                WORKSPACE
            ================================================= */}

            <section className="mt-10 grid gap-6 xl:grid-cols-3">

              <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-7 xl:col-span-2">

                <div>

                  <p className="text-sm font-medium text-indigo-400">
                    Career workspace
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Manage your career activity
                  </h2>

                  <p className="mt-2 max-w-xl leading-7 text-slate-400">
                    Add applications, track recruitment stages,
                    manage upcoming interviews and analyze your
                    resume from your CareerPilot workspace.
                  </p>

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
                    href="/dashboard/applications/kanban"
                    title="Application Board"
                    description="Move applications through recruitment stages."
                  />

                  <QuickAction
                    href="/dashboard/applications/analytics"
                    title="Application Analytics"
                    description="Analyze your job search pipeline and progress."
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

                  <QuickAction
                    href="/dashboard/interviews/calendar"
                    title="Interview Calendar"
                    description="View interviews by date."
                  />

                  <QuickAction
                    href="/dashboard/analyzer"
                    title="AI Resume Analyzer"
                    description="Compare your resume with a job description using AI."
                  />

                  <QuickAction
                    href="/dashboard/analyzer/history"
                    title="Analysis History"
                    description="Review your previous resume analyses."
                  />

                  <QuickAction
                    href="/dashboard/resumes"
                    title="Resume Builder"
                    description="Create and manage your resumes."
                  />

                </div>

              </article>

              {/* PROFILE */}

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

                  <ProfileItem
                    label="Resumes"
                    value={`${resumeCount} resume${
                      resumeCount === 1
                        ? ""
                        : "s"
                    }`}
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

            {/* =================================================
                QUICK NAVIGATION
            ================================================= */}

            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <NavigationCard
                href="/dashboard/applications"
                title="Applications"
                description="View and manage your job applications."
              />

              <NavigationCard
                href="/dashboard/applications/analytics"
                title="Analytics"
                description="Review job search performance."
              />

              <NavigationCard
                href="/dashboard/interviews/calendar"
                title="Interview Calendar"
                description="See your upcoming interview schedule."
              />

              <NavigationCard
                href="/dashboard/analyzer"
                title="AI Resume Analyzer"
                description="Check resume compatibility with jobs."
              />

            </section>

          </div>

        </section>

      </div>
    </main>
  );
}

// ============================================================
// Sidebar Link
// ============================================================

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

// ============================================================
// Dashboard Card
// ============================================================

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

// ============================================================
// Metric Card
// ============================================================

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
};

function MetricCard({
  label,
  value,
  description,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {value}%
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>

        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-sm font-bold text-indigo-400">
          %
        </div>

      </div>

    </article>
  );
}

// ============================================================
// Quick Action
// ============================================================

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

// ============================================================
// Profile Item
// ============================================================

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

// ============================================================
// Navigation Card
// ============================================================

type NavigationCardProps = {
  href: string;
  title: string;
  description: string;
};

function NavigationCard({
  href,
  title,
  description,
}: NavigationCardProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-indigo-500/40 hover:bg-slate-900"
    >
      <p className="font-semibold text-white">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <p className="mt-4 text-sm font-medium text-indigo-400">
        Open →
      </p>
    </Link>
  );
}

// ============================================================
// Interview Info
// ============================================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-950/70 p-3">

      <p className="text-xs uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-sm text-slate-300">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// Interview Date
// ============================================================

function formatInterviewDate(
  dateString: string
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Asia/Colombo",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(dateString));
}

// ============================================================
// Interview Time
// ============================================================

function formatInterviewTime(
  dateString: string
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  ).format(new Date(dateString));
}

// ============================================================
// Interview Stage
// ============================================================

function formatInterviewStage(
  stage: string
) {
  const labels: Record<
    string,
    string
  > = {
    phone_screen: "Phone Screen",
    hr: "HR Interview",
    technical: "Technical Interview",
    behavioral: "Behavioral Interview",
    manager: "Manager Interview",
    final: "Final Interview",
    other: "Interview",
  };

  return (
    labels[stage] ??
    stage
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  );
}

// ============================================================
// Interview Mode
// ============================================================

function formatInterviewMode(
  mode: string
) {
  const labels: Record<
    string,
    string
  > = {
    phone: "Phone",
    video: "Video",
    onsite: "On-site",
    other: "Other",
  };

  return (
    labels[mode] ??
    mode
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  );
}