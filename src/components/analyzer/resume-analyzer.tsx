"use client";

import { useState } from "react";

type Resume = {
  id: string;
  title: string;
  target_role: string | null;
  professional_summary: string | null;

  experiences: {
    id: string;
    resume_id: string;
    company_name: string;
    job_title: string;
    employment_type: string | null;
    start_date: string;
    end_date: string | null;
    description: string | null;
  }[];

  education: {
    id: string;
    resume_id: string;
    institution_name: string;
    degree: string;
    field_of_study: string | null;
    location: string | null;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    grade: string | null;
    description: string | null;
  }[];

  projects: {
    id: string;
    resume_id: string;
    project_name: string;
    role: string | null;
    project_url: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    technologies: string[] | null;
  }[];

  skills: {
    id: string;
    resume_id: string;
    skill_name: string;
    category: string | null;
    proficiency: string | null;
  }[];
};

type ResumeAnalyzerProps = {
  resumes: Resume[];
};

type AnalysisResult = {
  atsScore: number;
  keywordMatchScore: number;
  experienceRelevanceScore: number;
  skillsMatchScore: number;

  matchedSkills: string[];
  missingSkills: string[];

  matchedKeywords: string[];
  missingKeywords: string[];

  strengths: string[];
  weaknesses: string[];

  recommendations: string[];

  summary: string;
};

export function ResumeAnalyzer({
  resumes,
}: ResumeAnalyzerProps) {
  const [resumeId, setResumeId] = useState(
    resumes[0]?.id ?? ""
  );

  const [jobDescription, setJobDescription] =
    useState("");

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function analyzeResume() {
    setError("");
    setResult(null);

    if (!resumeId) {
      setError("Please select a resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError(
        "Please paste the job description."
      );
      return;
    }

    const selectedResume = resumes.find(
      (resume) =>
        resume.id === resumeId
    );

    if (!selectedResume) {
      setError(
        "Selected resume could not be found."
      );
      return;
    }

    setLoading(true);

    try {
     const response = await fetch(
  "/api/analyze-resume",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume: selectedResume,
      jobDescription:
        jobDescription.trim(),
    }),
  }
);

const rawResponse = await response.text();

let data: {
  success?: boolean;
  analysis?: AnalysisResult;
  error?: string;
};

try {
  data = rawResponse
    ? JSON.parse(rawResponse)
    : {};
} catch {
  console.error(
    "Invalid API response:",
    rawResponse
  );

  throw new Error(
    `Server returned an invalid response (${response.status}).`
  );
}

if (!response.ok) {
  throw new Error(
    data.error ||
      `Unable to analyze resume (${response.status}).`
  );
}

if (!data.analysis) {
  throw new Error(
    "The AI did not return an analysis."
  );
}

setResult(data.analysis);

      if (!data.analysis) {
        throw new Error(
          "The AI did not return an analysis."
        );
      }

      setResult(data.analysis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze resume."
      );
    } finally {
      setLoading(false);
    }
  }

  function getScoreLabel(score: number) {
    if (score >= 80) {
      return "Strong Match";
    }

    if (score >= 60) {
      return "Good Match";
    }

    if (score >= 40) {
      return "Needs Improvement";
    }

    return "Weak Match";
  }

  return (
    <div className="space-y-8">

      {/* Analyzer Input */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

        <div>
          <p className="text-sm font-medium text-indigo-400">
            AI-Powered Analysis
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Analyze Your Resume
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Select a resume and paste the complete job
            description. CareerPilot AI will evaluate
            how well your resume matches the position.
          </p>
        </div>


        <div className="mt-6 space-y-5">

          {/* Resume */}

          <div>

            <label
              htmlFor="resume"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Select Resume
            </label>

            <select
              id="resume"
              value={resumeId}
              onChange={(event) => {
                setResumeId(
                  event.target.value
                );

                setResult(null);
                setError("");
              }}
              disabled={
                loading ||
                resumes.length === 0
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
            >

              {resumes.length === 0 ? (
                <option value="">
                  No resumes available
                </option>
              ) : (
                resumes.map((resume) => (
                  <option
                    key={resume.id}
                    value={resume.id}
                  >
                    {resume.title}
                  </option>
                ))
              )}

            </select>

          </div>


          {/* Job Description */}

          <div>

            <label
              htmlFor="jobDescription"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Job Description
            </label>

            <textarea
              id="jobDescription"
              rows={14}
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(
                  event.target.value
                )
              }
              disabled={loading}
              placeholder="Paste the complete job description here..."
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 disabled:opacity-50"
            />

            <p className="mt-2 text-xs text-slate-500">
              Include responsibilities, required
              skills, qualifications, and other
              requirements for better analysis.
            </p>

          </div>


          {/* Error */}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}


          {/* Button */}

          <button
            type="button"
            onClick={analyzeResume}
            disabled={
              loading ||
              resumes.length === 0
            }
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "AI is analyzing your resume..."
              : "Analyze Resume with AI"}
          </button>

        </div>

      </section>


      {/* Results */}

      {result && (
        <section className="space-y-6">

          {/* ATS Score */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

              <div>

                <p className="text-sm font-medium text-indigo-400">
                  AI Analysis Result
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  ATS Compatibility
                </h2>

              </div>

              <div className="text-left sm:text-right">

                <div className="flex items-end gap-2">

                  <span className="text-6xl font-bold text-white">
                    {result.atsScore}
                  </span>

                  <span className="mb-2 text-xl text-slate-500">
                    /100
                  </span>

                </div>

                <p className="text-sm text-indigo-400">
                  {getScoreLabel(
                    result.atsScore
                  )}
                </p>

              </div>

            </div>


            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">

              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      result.atsScore
                    )
                  )}%`,
                }}
              />

            </div>

          </section>


          {/* Score Breakdown */}

          <section>

            <h2 className="mb-4 text-xl font-semibold text-white">
              Score Breakdown
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">

              <ScoreCard
                title="Keyword Match"
                score={
                  result.keywordMatchScore
                }
              />

              <ScoreCard
                title="Experience Relevance"
                score={
                  result.experienceRelevanceScore
                }
              />

              <ScoreCard
                title="Skills Match"
                score={
                  result.skillsMatchScore
                }
              />

            </div>

          </section>


          {/* Summary */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

            <h2 className="text-lg font-semibold text-white">
              AI Assessment
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              {result.summary}
            </p>

          </section>


          {/* Skills */}

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Matched Skills */}

            <ResultList
              title="Matched Skills"
              items={result.matchedSkills}
              emptyMessage="No matching skills identified."
              type="success"
            />


            {/* Missing Skills */}

            <ResultList
              title="Missing Skills"
              items={result.missingSkills}
              emptyMessage="No major missing skills identified."
              type="danger"
            />

          </div>


          {/* Keywords */}

          <div className="grid gap-6 lg:grid-cols-2">

            <ResultList
              title="Matched Keywords"
              items={result.matchedKeywords}
              emptyMessage="No matching keywords identified."
              type="success"
            />

            <ResultList
              title="Missing Keywords"
              items={result.missingKeywords}
              emptyMessage="No major missing keywords identified."
              type="danger"
            />

          </div>


          {/* Strengths and Weaknesses */}

          <div className="grid gap-6 lg:grid-cols-2">

            <ResultList
              title="Resume Strengths"
              items={result.strengths}
              emptyMessage="No strengths identified."
              type="success"
            />

            <ResultList
              title="Areas to Improve"
              items={result.weaknesses}
              emptyMessage="No major weaknesses identified."
              type="danger"
            />

          </div>


          {/* Recommendations */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

            <h2 className="text-lg font-semibold text-white">
              AI Recommendations
            </h2>

            <div className="mt-5 space-y-3">

              {result.recommendations.length ===
              0 ? (

                <p className="text-sm text-slate-500">
                  No recommendations available.
                </p>

              ) : (

                result.recommendations.map(
                  (recommendation, index) => (

                    <div
                      key={index}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-4"
                    >

                      <div className="flex gap-3">

                        <span className="font-semibold text-indigo-400">
                          {index + 1}.
                        </span>

                        <p className="text-sm leading-6 text-slate-300">
                          {recommendation}
                        </p>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </section>

        </section>
      )}

    </div>
  );
}


/* Score Card */

function ScoreCard({
  title,
  score,
}: {
  title: string;
  score: number;
}) {
  const safeScore = Math.min(
    100,
    Math.max(0, score)
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <div className="mt-2 flex items-end gap-1">

        <span className="text-3xl font-bold text-white">
          {safeScore}
        </span>

        <span className="mb-1 text-sm text-slate-500">
          /100
        </span>

      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-full rounded-full bg-indigo-500"
          style={{
            width: `${safeScore}%`,
          }}
        />

      </div>

    </div>
  );
}


/* Result List */

function ResultList({
  title,
  items,
  emptyMessage,
  type,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
  type: "success" | "danger";
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <h2 className="text-lg font-semibold text-white">
        {title}
      </h2>

      {items.length === 0 ? (

        <p className="mt-4 text-sm text-slate-500">
          {emptyMessage}
        </p>

      ) : (

        <div className="mt-4 flex flex-wrap gap-2">

          {items.map((item, index) => (

            <span
              key={`${item}-${index}`}
              className={
                type === "success"
                  ? "rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300"
                  : "rounded-full bg-red-500/10 px-3 py-1.5 text-sm text-red-300"
              }
            >
              {type === "success"
                ? "✓"
                : "✕"}{" "}
              {item}
            </span>

          ))}

        </div>

      )}

    </section>
  );
}