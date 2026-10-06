import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ResumeAnalyzer } from "@/components/analyzer/resume-analyzer";

export default async function AnalyzerPage() {
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
  // Load resumes
  // =========================================================

  const {
    data: resumes,
    error: resumeError,
  } = await supabase
    .from("resumes")
    .select(`
      id,
      title,
      target_role,
      professional_summary
    `)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (resumeError) {
    console.error(
      "Unable to load resumes:",
      resumeError.message
    );
  }

  const resumeIds =
    resumes?.map((resume) => resume.id) ?? [];

  // =========================================================
  // Load experiences
  // =========================================================

  const {
    data: experiences,
    error: experienceError,
  } =
    resumeIds.length > 0
      ? await supabase
          .from("resume_experiences")
          .select(`
            id,
            resume_id,
            company_name,
            job_title,
            employment_type,
            start_date,
            end_date,
            description
          `)
          .in("resume_id", resumeIds)
          .order("start_date", {
            ascending: false,
          })
      : {
          data: [],
          error: null,
        };

  if (experienceError) {
    console.error(
      "Unable to load experiences:",
      experienceError.message
    );
  }

  // =========================================================
  // Load education
  // =========================================================

  const {
    data: education,
    error: educationError,
  } =
    resumeIds.length > 0
      ? await supabase
          .from("resume_education")
          .select(`
            id,
            resume_id,
            institution_name,
            degree,
            field_of_study,
            location,
            start_date,
            end_date,
            is_current,
            grade,
            description
          `)
          .in("resume_id", resumeIds)
          .order("sort_order", {
            ascending: true,
          })
      : {
          data: [],
          error: null,
        };

  if (educationError) {
    console.error(
      "Unable to load education:",
      educationError.message
    );
  }

  // =========================================================
  // Load projects
  // =========================================================

  const {
    data: projects,
    error: projectError,
  } =
    resumeIds.length > 0
      ? await supabase
          .from("resume_projects")
          .select(`
            id,
            resume_id,
            project_name,
            role,
            project_url,
            start_date,
            end_date,
            description,
            technologies
          `)
          .in("resume_id", resumeIds)
          .order("sort_order", {
            ascending: true,
          })
      : {
          data: [],
          error: null,
        };

  if (projectError) {
    console.error(
      "Unable to load projects:",
      projectError.message
    );
  }

  // =========================================================
  // Load skills
  // =========================================================

  const {
    data: skills,
    error: skillsError,
  } =
    resumeIds.length > 0
      ? await supabase
          .from("resume_skills")
          .select(`
            id,
            resume_id,
            skill_name,
            category,
            proficiency
          `)
          .in("resume_id", resumeIds)
          .order("sort_order", {
            ascending: true,
          })
      : {
          data: [],
          error: null,
        };

  if (skillsError) {
    console.error(
      "Unable to load skills:",
      skillsError.message
    );
  }

  // =========================================================
  // Build complete resume objects
  // =========================================================

  const completeResumes = (resumes ?? []).map(
    (resume) => ({
      ...resume,

      experiences:
        (experiences ?? []).filter(
          (item) =>
            item.resume_id === resume.id
        ),

      education:
        (education ?? []).filter(
          (item) =>
            item.resume_id === resume.id
        ),

      projects:
        (projects ?? []).filter(
          (item) =>
            item.resume_id === resume.id
        ),

      skills:
        (skills ?? []).filter(
          (item) =>
            item.resume_id === resume.id
        ),
    })
  );

  // =========================================================
  // Page
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Header */}

        <div className="mb-10">

          <p className="text-sm font-medium text-indigo-400">
            CareerPilot AI
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            AI Resume Analyzer
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Compare your complete resume against a job
            description and identify your strengths,
            weaknesses, missing skills, and ATS
            compatibility.
          </p>

        </div>

        {/* Analyzer */}

        <ResumeAnalyzer
          resumes={completeResumes}
        />

      </div>

    </main>
  );
}