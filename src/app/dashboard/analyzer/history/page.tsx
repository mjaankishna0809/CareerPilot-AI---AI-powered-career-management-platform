import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type ResumeRelation =
  | {
      title: string | null;
    }
  | {
      title: string | null;
    }[]
  | null;

type Analysis = {
  id: string;
  resume_id: string;
  job_title: string | null;
  ats_score: number | null;
  keyword_match_score: number | null;
  experience_relevance_score: number | null;
  skills_match_score: number | null;
  summary: string | null;
  created_at: string;
  resumes: ResumeRelation;
};

export default async function AnalysisHistoryPage() {
  const supabase = await createClient();

  // ============================================================
  // Authentication
  // ============================================================

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  // ============================================================
  // Load Analysis History
  // ============================================================

  const {
    data,
    error,
  } = await supabase
    .from("resume_analyses")
    .select(`
      id,
      resume_id,
      job_title,
      ats_score,
      keyword_match_score,
      experience_relevance_score,
      skills_match_score,
      summary,
      created_at,
      resumes (
        title
      )
    `)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load analysis history:",
      error.message
    );
  }

  const analyses = (data ?? []) as Analysis[];

  // ============================================================
  // Page
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-sm font-medium text-indigo-400">
              CareerPilot AI
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Analysis History
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              View your previous resume analyses,
              ATS scores, and recommendations.
            </p>
          </div>

          <Link
            href="/dashboard/analyzer"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            + New Analysis
          </Link>

        </div>

        {/* History */}
        <section className="mt-10">

          {analyses.length === 0 ? (

            <EmptyState />

          ) : (

            <div className="space-y-5">

              {analyses.map((analysis) => {

                const resumeData = Array.isArray(
                  analysis.resumes
                )
                  ? analysis.resumes[0]
                  : analysis.resumes;

                const atsScore =
                  analysis.ats_score ?? 0;

                return (
                  <article
                    key={analysis.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700"
                  >

                    {/* Top */}
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                      <div className="min-w-0">

                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Job Analysis
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-white">
                          {analysis.job_title ||
                            "Resume Analysis"}
                        </h2>

                        <p className="mt-1 text-sm text-indigo-400">
                          Resume:{" "}
                          {resumeData?.title ||
                            "Resume"}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          {formatDate(
                            analysis.created_at
                          )}
                        </p>

                      </div>

                      {/* ATS Score */}
                      <div className="shrink-0 rounded-2xl border border-slate-700 bg-slate-950 px-8 py-5 text-center">

                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          ATS Score
                        </p>

                        <p
                          className={`mt-1 text-4xl font-bold ${getScoreColor(
                            atsScore
                          )}`}
                        >
                          {atsScore}
                        </p>

                        <p className="text-xs text-slate-500">
                          / 100
                        </p>

                      </div>

                    </div>

                    {/* Score Breakdown */}
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">

                      <ScoreCard
                        title="Keyword Match"
                        score={
                          analysis.keyword_match_score
                        }
                      />

                      <ScoreCard
                        title="Experience Relevance"
                        score={
                          analysis.experience_relevance_score
                        }
                      />

                      <ScoreCard
                        title="Skills Match"
                        score={
                          analysis.skills_match_score
                        }
                      />

                    </div>

                    {/* Summary */}
                    {analysis.summary && (
                      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">

                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          AI Summary
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {analysis.summary}
                        </p>

                      </div>
                    )}

                    {/* Action */}
                    <div className="mt-6 flex justify-end">

                      <Link
                        href={`/dashboard/analyzer/history/${analysis.id}`}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-indigo-400 transition hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-300"
                      >
                        View Full Analysis →
                      </Link>

                    </div>

                  </article>
                );
              })}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl">
        📊
      </div>

      <h2 className="mt-5 text-xl font-semibold text-white">
        No analyses yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Analyze your resume against a job description
        to see your ATS score, matching skills,
        missing keywords, and recommendations here.
      </p>

      <Link
        href="/dashboard/analyzer"
        className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        Analyze Resume
      </Link>

    </div>
  );
}

// ============================================================
// Score Card
// ============================================================

function ScoreCard({
  title,
  score,
}: {
  title: string;
  score: number | null;
}) {
  const value = Math.max(
    0,
    Math.min(100, score ?? 0)
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-slate-400">
          {title}
        </p>

        <p className="text-lg font-bold text-white">
          {value}
          <span className="ml-1 text-xs font-normal text-slate-500">
            /100
          </span>
        </p>

      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function getScoreColor(score: number) {
  if (score >= 80) {
    return "text-emerald-400";
  }

  if (score >= 60) {
    return "text-yellow-400";
  }

  if (score >= 40) {
    return "text-orange-400";
  }

  return "text-red-400";
}