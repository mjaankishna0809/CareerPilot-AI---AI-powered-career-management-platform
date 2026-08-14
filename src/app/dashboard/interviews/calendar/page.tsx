import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type InterviewStage =
  | "phone_screen"
  | "hr"
  | "technical"
  | "behavioral"
  | "manager"
  | "final"
  | "other";

type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

type CalendarInterview = {
  id: string;
  stage: InterviewStage;
  status: InterviewStatus;
  scheduled_at: string;
  duration_minutes: number | null;
  meeting_url: string | null;

  job_application: {
    company_name: string;
    position: string;
  } | null;
};

type CalendarPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

const WEEK_DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export default async function InterviewCalendarPage({
  searchParams,
}: CalendarPageProps) {
  const supabase = await createClient();

  // =====================================================
  // AUTHENTICATION
  // =====================================================

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

  // =====================================================
  // GET MONTH FROM URL
  // Example:
  // ?month=2026-08
  // =====================================================

  const query = await searchParams;

  const currentMonth =
    getCurrentColomboMonth();

  const selectedMonth =
    parseMonth(
      query.month,
      currentMonth.year,
      currentMonth.monthIndex
    );

  const year =
    selectedMonth.year;

  const monthIndex =
    selectedMonth.monthIndex;

  // =====================================================
  // MONTH RANGE FOR SUPABASE
  // =====================================================

  const start =
    createColomboMonthStart(
      year,
      monthIndex
    );

  const nextMonth =
    normalizeMonth(
      year,
      monthIndex + 1
    );

  const end =
    createColomboMonthStart(
      nextMonth.year,
      nextMonth.monthIndex
    );

  // =====================================================
  // LOAD INTERVIEWS
  // =====================================================

  const {
    data: interviews,
    error,
  } = await supabase
    .from("interviews")
    .select(`
      id,
      stage,
      status,
      scheduled_at,
      duration_minutes,
      meeting_url,

      job_application:job_applications (
        company_name,
        position
      )
    `)
    .eq("user_id", userId)
    .gte("scheduled_at", start)
    .lt("scheduled_at", end)
    .order("scheduled_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Unable to load calendar interviews:",
      error.message
    );
  }

  const interviewList =
    (interviews as
      | CalendarInterview[]
      | null) ?? [];

  // =====================================================
  // GROUP INTERVIEWS BY DATE
  // =====================================================

  const interviewsByDate =
    new Map<
      string,
      CalendarInterview[]
    >();

  for (const interview of interviewList) {
    const dateKey =
      getColomboDateKey(
        interview.scheduled_at
      );

    const existing =
      interviewsByDate.get(
        dateKey
      ) ?? [];

    existing.push(interview);

    interviewsByDate.set(
      dateKey,
      existing
    );
  }

  // =====================================================
  // CALENDAR INFORMATION
  // =====================================================

  const daysInMonth =
    getDaysInMonth(
      year,
      monthIndex
    );

  const firstDay =
    getMondayBasedFirstDay(
      year,
      monthIndex
    );

  const totalUsedCells =
    firstDay + daysInMonth;

  const totalCalendarCells =
    Math.ceil(
      totalUsedCells / 7
    ) * 7;

  const trailingCells =
    totalCalendarCells -
    totalUsedCells;

  const monthName =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }
    ).format(
      new Date(
        Date.UTC(
          year,
          monthIndex,
          1
        )
      )
    );

  const previous =
    normalizeMonth(
      year,
      monthIndex - 1
    );

  const next =
    normalizeMonth(
      year,
      monthIndex + 1
    );

  const todayKey =
    getColomboDateKey(
      new Date().toISOString()
    );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          <div>
            <Link
              href="/dashboard/interviews"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to interviews
            </Link>

            <p className="mt-8 text-sm font-medium text-indigo-400">
              Interview manager
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Interview Calendar
            </h1>

            <p className="mt-2 text-slate-400">
              View your scheduled interviews by date.
            </p>
          </div>

          <Link
            href="/dashboard/interviews/new"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            + Schedule Interview
          </Link>

        </div>

        {/* =====================================================
            CALENDAR HEADER
        ===================================================== */}

        <section className="mt-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">

          <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href={buildMonthUrl(
                previous.year,
                previous.monthIndex
              )}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              ← Previous
            </Link>

            <h2 className="text-xl font-semibold text-white">
              {monthName}
            </h2>

            <Link
              href={buildMonthUrl(
                next.year,
                next.monthIndex
              )}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Next →
            </Link>

          </div>

          {/* ===================================================
              WEEKDAY HEADER
          =================================================== */}

          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900">

            {WEEK_DAYS.map(
              (day) => (
                <div
                  key={day}
                  className="border-r border-slate-800 px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 last:border-r-0"
                >
                  {day}
                </div>
              )
            )}

          </div>

          {/* ===================================================
              CALENDAR GRID
          =================================================== */}

          <div className="grid grid-cols-7">

            {/* Empty cells before day 1 */}

            {Array.from({
              length: firstDay,
            }).map((_, index) => (
              <div
                key={`before-${index}`}
                className="min-h-36 border-b border-r border-slate-800 bg-slate-950/40"
              />
            ))}

            {/* Actual month days */}

            {Array.from({
              length: daysInMonth,
            }).map((_, index) => {
              const day =
                index + 1;

              const dateKey =
                createDateKey(
                  year,
                  monthIndex,
                  day
                );

              const dayInterviews =
                interviewsByDate.get(
                  dateKey
                ) ?? [];

              const isToday =
                dateKey ===
                todayKey;

              return (
                <div
                  key={dateKey}
                  className={`min-h-36 border-b border-r border-slate-800 p-2 transition ${
                    isToday
                      ? "bg-indigo-500/5"
                      : "bg-slate-950/20"
                  }`}
                >

                  {/* Date number */}

                  <div className="flex items-center justify-between">

                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {day}
                    </span>

                    {dayInterviews.length >
                      0 && (
                      <span className="text-xs text-slate-600">
                        {
                          dayInterviews.length
                        }
                      </span>
                    )}

                  </div>

                  {/* Interview events */}

                  <div className="mt-2 space-y-2">

                    {dayInterviews.map(
                      (interview) => (
                        <CalendarEvent
                          key={
                            interview.id
                          }
                          interview={
                            interview
                          }
                        />
                      )
                    )}

                  </div>

                </div>
              );
            })}

            {/* Empty cells after month */}

            {Array.from({
              length: trailingCells,
            }).map((_, index) => (
              <div
                key={`after-${index}`}
                className="min-h-36 border-b border-r border-slate-800 bg-slate-950/40"
              />
            ))}

          </div>

        </section>

        {/* =====================================================
            LEGEND
        ===================================================== */}

        <section className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">

          <Legend
            label="Scheduled"
            className="bg-indigo-500"
          />

          <Legend
            label="Rescheduled"
            className="bg-amber-500"
          />

          <Legend
            label="Completed"
            className="bg-emerald-500"
          />

          <Legend
            label="Cancelled"
            className="bg-red-500"
          />

        </section>

      </div>
    </main>
  );
}

/* =========================================================
   CALENDAR EVENT
========================================================= */

function CalendarEvent({
  interview,
}: {
  interview: CalendarInterview;
}) {
  return (
    <Link
      href={`/dashboard/interviews/${interview.id}`}
      className={`block rounded-lg border px-2.5 py-2 text-xs transition hover:brightness-110 ${getEventStyle(
        interview.status
      )}`}
    >

      <p className="truncate font-semibold">
        {interview
          .job_application
          ?.company_name ||
          "Unknown company"}
      </p>

      <p className="mt-1 truncate opacity-80">
        {formatStage(
          interview.stage
        )}
      </p>

      <p className="mt-1 font-medium">
        {formatTime(
          interview.scheduled_at
        )}
      </p>

    </Link>
  );
}

/* =========================================================
   LEGEND
========================================================= */

function Legend({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2">

      <span
        className={`h-2.5 w-2.5 rounded-full ${className}`}
      />

      <span>
        {label}
      </span>

    </div>
  );
}

/* =========================================================
   STATUS STYLE
========================================================= */

function getEventStyle(
  status: InterviewStatus
) {
  switch (status) {
    case "scheduled":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";

    case "rescheduled":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";

    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";

    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-200";
  }
}

/* =========================================================
   FORMAT STAGE
========================================================= */

function formatStage(
  stage: InterviewStage
) {
  const labels: Record<
    InterviewStage,
    string
  > = {
    phone_screen:
      "Phone Screen",

    hr:
      "HR Interview",

    technical:
      "Technical Interview",

    behavioral:
      "Behavioral",

    manager:
      "Manager Interview",

    final:
      "Final Interview",

    other:
      "Other",
  };

  return labels[stage];
}

/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
  date: string
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        "Asia/Colombo",
    }
  ).format(new Date(date));
}

/* =========================================================
   CURRENT COLOMBO MONTH
========================================================= */

function getCurrentColomboMonth() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year: "numeric",
        month: "2-digit",
        timeZone:
          "Asia/Colombo",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    Number(
      parts.find(
        (part) =>
          part.type === "year"
      )?.value
    );

  const month =
    Number(
      parts.find(
        (part) =>
          part.type === "month"
      )?.value
    );

  return {
    year,
    monthIndex:
      month - 1,
  };
}

/* =========================================================
   PARSE ?month=YYYY-MM
========================================================= */

function parseMonth(
  value: string | undefined,
  fallbackYear: number,
  fallbackMonthIndex: number
) {
  if (
    !value ||
    !/^\d{4}-\d{2}$/.test(
      value
    )
  ) {
    return {
      year:
        fallbackYear,
      monthIndex:
        fallbackMonthIndex,
    };
  }

  const [yearText, monthText] =
    value.split("-");

  const year =
    Number(yearText);

  const month =
    Number(monthText);

  if (
    month < 1 ||
    month > 12
  ) {
    return {
      year:
        fallbackYear,
      monthIndex:
        fallbackMonthIndex,
    };
  }

  return {
    year,
    monthIndex:
      month - 1,
  };
}

/* =========================================================
   NORMALIZE MONTH
========================================================= */

function normalizeMonth(
  year: number,
  monthIndex: number
) {
  const date =
    new Date(
      Date.UTC(
        year,
        monthIndex,
        1
      )
    );

  return {
    year:
      date.getUTCFullYear(),

    monthIndex:
      date.getUTCMonth(),
  };
}

/* =========================================================
   MONTH URL
========================================================= */

function buildMonthUrl(
  year: number,
  monthIndex: number
) {
  return `/dashboard/interviews/calendar?month=${year}-${String(
    monthIndex + 1
  ).padStart(2, "0")}`;
}

/* =========================================================
   MONTH START IN SRI LANKA TIME
========================================================= */

function createColomboMonthStart(
  year: number,
  monthIndex: number
) {
  return `${year}-${String(
    monthIndex + 1
  ).padStart(
    2,
    "0"
  )}-01T00:00:00+05:30`;
}

/* =========================================================
   DAYS IN MONTH
========================================================= */

function getDaysInMonth(
  year: number,
  monthIndex: number
) {
  return new Date(
    Date.UTC(
      year,
      monthIndex + 1,
      0
    )
  ).getUTCDate();
}

/* =========================================================
   FIRST DAY - MONDAY BASED
========================================================= */

function getMondayBasedFirstDay(
  year: number,
  monthIndex: number
) {
  const sundayBased =
    new Date(
      Date.UTC(
        year,
        monthIndex,
        1
      )
    ).getUTCDay();

  return (
    sundayBased + 6
  ) % 7;
}

/* =========================================================
   YYYY-MM-DD KEY
========================================================= */

function createDateKey(
  year: number,
  monthIndex: number,
  day: number
) {
  return `${year}-${String(
    monthIndex + 1
  ).padStart(
    2,
    "0"
  )}-${String(day).padStart(
    2,
    "0"
  )}`;
}

/* =========================================================
   TIMESTAMP → SRI LANKA DATE KEY
========================================================= */

function getColomboDateKey(
  date: string
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone:
          "Asia/Colombo",
      }
    ).formatToParts(
      new Date(date)
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value;

  return `${year}-${month}-${day}`;
}