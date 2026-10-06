import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AnalysisDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

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

  // =========================================================
  // Load analysis
  // =========================================================

  const {
    data: analysis,
    error,
  } = await supabase
    .from("resume_analyses")
    .select(`
      id,
      resume_id,
      job_title,
      job_description,
      ats_score,
      keyword_match_score,
      experience_relevance_score,
      skills_match_score,
      matched_skills,
      missing_skills,
      matched_keywords,
      missing_keywords,
      strengths,
      weaknesses,
      recommendations,
      summary,
      created_at,
      resumes (
        title
      )
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !analysis) {
    notFound();
  }

  const resumeData = Array.isArray(analysis.resumes)
    ? analysis.resumes[0]
    : analysis.resumes;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* =================================================
            Header
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <Link
              href="/dashboard/analyzer/history"
              className="text-sm text-slate-400 hover:text-white"
            >
              ← Back to Analysis History
            </Link>

            <p className="mt-6 text-sm font-medium text-indigo-400">
              CareerPilot AI
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              {analysis.job_title || "Resume Analysis"}
            </h1>

            <p className="mt-2 text-slate-400">
              Resume:{" "}
              {resumeData?.title || "Resume"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Analyzed{" "}
              {new Date(
                analysis.created_at
              ).toLocaleString()}
            </p>

          </div>

          <Link
            href="/dashboard/analyzer"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500"
          >
            New Analysis
          </Link>

        </div>


        {/* =================================================
            Overall Score
        ================================================= */}

        <section className="mt-10">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">

            <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-center">

              {/* ATS Score */}

              <div className="text-center">

                <p className="text-sm uppercase tracking-wide text-slate-500">
                  ATS Compatibility
                </p>

                <p className="mt-2 text-6xl font-bold text-indigo-400">
                  {analysis.ats_score ?? 0}
                </p>

                <p className="text-slate-500">
                  out of 100
                </p>

              </div>


              {/* Other scores */}

              <div className="grid gap-4 sm:grid-cols-3">

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

            </div>

          </div>

        </section>


        {/* =================================================
            Summary
        ================================================= */}

        <section className="mt-8">

          <Section title="Overall Summary">

            <p className="leading-7 text-slate-300">
              {analysis.summary ||
                "No summary available."}
            </p>

          </Section>

        </section>


        {/* =================================================
            Skills
        ================================================= */}

        <section className="mt-8 grid gap-8 lg:grid-cols-2">

          <TagSection
            title="Matched Skills"
            items={
              analysis.matched_skills || []
            }
            emptyText="No matched skills found."
          />

          <TagSection
            title="Missing Skills"
            items={
              analysis.missing_skills || []
            }
            emptyText="No missing skills identified."
          />

        </section>


        {/* =================================================
            Keywords
        ================================================= */}

        <section className="mt-8 grid gap-8 lg:grid-cols-2">

          <TagSection
            title="Matched Keywords"
            items={
              analysis.matched_keywords || []
            }
            emptyText="No matched keywords found."
          />

          <TagSection
            title="Missing Keywords"
            items={
              analysis.missing_keywords || []
            }
            emptyText="No missing keywords identified."
          />

        </section>


        {/* =================================================
            Strengths / Weaknesses
        ================================================= */}

        <section className="mt-8 grid gap-8 lg:grid-cols-2">

          <ListSection
            title="Resume Strengths"
            items={
              analysis.strengths || []
            }
            emptyText="No strengths available."
          />

          <ListSection
            title="Areas to Improve"
            items={
              analysis.weaknesses || []
            }
            emptyText="No weaknesses identified."
          />

        </section>


        {/* =================================================
            Recommendations
        ================================================= */}

        <section className="mt-8">

          <ListSection
            title="Recommendations"
            items={
              analysis.recommendations || []
            }
            emptyText="No recommendations available."
          />

        </section>


        {/* =================================================
            Job Description
        ================================================= */}

        <section className="mt-8">

          <Section title="Analyzed Job Description">

            <div className="max-h-96 overflow-y-auto rounded-xl bg-slate-950 p-5">

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                {analysis.job_description}
              </p>

            </div>

          </Section>

        </section>


        {/* =================================================
            Bottom Navigation
        ================================================= */}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">

          <Link
            href="/dashboard/analyzer/history"
            className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            ← Analysis History
          </Link>

          <Link
            href="/dashboard/analyzer"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Analyze Another Job
          </Link>

        </div>

      </div>

    </main>
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
  const value = score ?? 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
        <span className="ml-1 text-sm font-normal text-slate-500">
          / 100
        </span>
      </p>

    </div>
  );
}


// ============================================================
// Generic Section
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>

      <div className="mt-4">
        {children}
      </div>

    </div>
  );
}


// ============================================================
// Tag Section
// ============================================================

function TagSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>

      {items.length === 0 ? (

        <p className="mt-4 text-sm text-slate-500">
          {emptyText}
        </p>

      ) : (

        <div className="mt-5 flex flex-wrap gap-2">

          {items.map(
            (item, index) => (
              <span
                key={`${item}-${index}`}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300"
              >
                {item}
              </span>
            )
          )}

        </div>

      )}

    </section>
  );
}


// ============================================================
// List Section
// ============================================================

function ListSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>

      {items.length === 0 ? (

        <p className="mt-4 text-sm text-slate-500">
          {emptyText}
        </p>

      ) : (

        <ul className="mt-5 space-y-3">

          {items.map(
            (item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex gap-3 text-sm leading-6 text-slate-300"
              >

                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />

                <span>
                  {item}
                </span>

              </li>
            )
          )}

        </ul>

      )}

    </section>
  );
}