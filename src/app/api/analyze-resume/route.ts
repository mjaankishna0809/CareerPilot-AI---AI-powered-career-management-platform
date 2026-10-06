import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


// ============================================================
// Helpers
// ============================================================

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-/ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function unique(values: string[]): string[] {
  return [...new Set(values)];
}


function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}


// ============================================================
// Extract text from complete resume
// ============================================================

function buildResumeText(resume: any): string {
  const parts: string[] = [];

  parts.push(resume.title || "");
  parts.push(resume.target_role || "");
  parts.push(resume.professional_summary || "");

  for (const item of resume.experiences || []) {
    parts.push(item.company_name || "");
    parts.push(item.job_title || "");
    parts.push(item.employment_type || "");
    parts.push(item.description || "");
  }

  for (const item of resume.education || []) {
    parts.push(item.institution_name || "");
    parts.push(item.degree || "");
    parts.push(item.field_of_study || "");
    parts.push(item.location || "");
    parts.push(item.grade || "");
    parts.push(item.description || "");
  }

  for (const item of resume.projects || []) {
    parts.push(item.project_name || "");
    parts.push(item.role || "");
    parts.push(item.description || "");

    if (Array.isArray(item.technologies)) {
      parts.push(item.technologies.join(" "));
    } else {
      parts.push(item.technologies || "");
    }
  }

  for (const item of resume.skills || []) {
    parts.push(item.skill_name || "");
    parts.push(item.category || "");
    parts.push(item.proficiency || "");
  }

  return parts.join(" ");
}


// ============================================================
// Extract important job keywords
// ============================================================

function extractKeywords(jobDescription: string): string[] {
  const normalized = normalizeText(jobDescription);

  const knownKeywords = [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "nextjs",
    "node.js",
    "nodejs",
    "express",
    "python",
    "java",
    "c",
    "c++",
    "c#",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "firebase",
    "supabase",
    "aws",
    "azure",
    "docker",
    "kubernetes",
    "git",
    "github",
    "gitlab",
    "rest api",
    "rest",
    "graphql",
    "html",
    "css",
    "tailwind",
    "flutter",
    "dart",
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "ai",
    "ml",
    "data science",
    "data analysis",
    "pandas",
    "numpy",
    "scikit learn",
    "tensorflow",
    "pytorch",
    "power bi",
    "tableau",
    "excel",
    "linux",
    "bash",
    "spring",
    "spring boot",
    "dotnet",
    ".net",
    "api",
    "figma",
    "agile",
    "scrum",
    "testing",
    "unit testing",
    "ci cd",
    "devops",
    "communication",
    "leadership",
    "problem solving",
  ];

  return knownKeywords.filter((keyword) =>
    normalized.includes(
      normalizeText(keyword)
    )
  );
}


// ============================================================
// Local ATS analysis
// ============================================================

function analyzeLocally(
  resume: any,
  jobDescription: string
) {
  const resumeText =
    normalizeText(
      buildResumeText(resume)
    );

  const jobText =
    normalizeText(jobDescription);

  const keywords =
    extractKeywords(jobDescription);

  const matchedKeywords =
    keywords.filter((keyword) =>
      resumeText.includes(
        normalizeText(keyword)
      )
    );

  const missingKeywords =
    keywords.filter(
      (keyword) =>
        !resumeText.includes(
          normalizeText(keyword)
        )
    );

  // ----------------------------------------------------------
  // Scores
  // ----------------------------------------------------------

  const keywordMatchScore =
    keywords.length > 0
      ? (matchedKeywords.length /
          keywords.length) *
        100
      : 50;

  const skillsMatchScore =
    keywordMatchScore;

  const experienceItems =
    Array.isArray(
      resume.experiences
    )
      ? resume.experiences
      : [];

  const projectItems =
    Array.isArray(
      resume.projects
    )
      ? resume.projects
      : [];

  const experienceText =
    normalizeText(
      experienceItems
        .map(
          (item: any) =>
            `${item.job_title || ""} ${
              item.description || ""
            }`
        )
        .join(" ")
    );

  const projectText =
    normalizeText(
      projectItems
        .map(
          (item: any) =>
            `${item.role || ""} ${
              item.description || ""
            } ${
              Array.isArray(item.technologies)
                ? item.technologies.join(" ")
                : item.technologies || ""
            }`
        )
        .join(" ")
    );

  const relevantExperienceKeywords =
    keywords.filter((keyword) =>
      experienceText.includes(
        normalizeText(keyword)
      )
    );

  const relevantProjectKeywords =
    keywords.filter((keyword) =>
      projectText.includes(
        normalizeText(keyword)
      )
    );

  const experienceRelevanceScore =
    keywords.length > 0
      ? clamp(
          ((relevantExperienceKeywords.length +
            relevantProjectKeywords.length) /
            (keywords.length * 2)) *
            100
        )
      : 50;

  const atsScore =
    clamp(
      keywordMatchScore * 0.45 +
        skillsMatchScore * 0.30 +
        experienceRelevanceScore * 0.25
    );

  // ----------------------------------------------------------
  // Resume skills
  // ----------------------------------------------------------

  const resumeSkills =
    (resume.skills || [])
      .map(
        (item: any) =>
          item.skill_name
      )
      .filter(Boolean);

  const matchedSkills =
    resumeSkills.filter(
      (skill: string) =>
        jobText.includes(
          normalizeText(skill)
        )
    );

  const missingSkills =
    missingKeywords.slice(0, 10);

  // ----------------------------------------------------------
  // Strengths
  // ----------------------------------------------------------

  const strengths: string[] = [];

  if (keywordMatchScore >= 70) {
    strengths.push(
      "Strong keyword alignment with the job description."
    );
  } else if (keywordMatchScore >= 40) {
    strengths.push(
      "The resume contains several relevant job keywords."
    );
  }

  if (experienceRelevanceScore >= 60) {
    strengths.push(
      "Experience and project information contains relevant evidence."
    );
  }

  if (resumeSkills.length >= 5) {
    strengths.push(
      "The resume provides a clear technical skills section."
    );
  }

  if (
    resume.professional_summary
  ) {
    strengths.push(
      "A professional summary is included."
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "The resume provides basic information that can be evaluated against the position."
    );
  }

  // ----------------------------------------------------------
  // Weaknesses
  // ----------------------------------------------------------

  const weaknesses: string[] = [];

  if (keywordMatchScore < 50) {
    weaknesses.push(
      "Several important keywords from the job description are missing."
    );
  }

  if (experienceRelevanceScore < 50) {
    weaknesses.push(
      "The resume does not show enough directly relevant experience or project evidence."
    );
  }

  if (!resume.professional_summary) {
    weaknesses.push(
      "The resume does not contain a professional summary."
    );
  }

  if (resumeSkills.length < 5) {
    weaknesses.push(
      "The skills section could contain more relevant technical skills."
    );
  }

  if (weaknesses.length === 0) {
    weaknesses.push(
      "Some job-specific keywords can still be strengthened."
    );
  }

  // ----------------------------------------------------------
  // Recommendations
  // ----------------------------------------------------------

  const recommendations: string[] = [];

  if (missingKeywords.length > 0) {
    recommendations.push(
      `Consider adding relevant skills or keywords such as ${missingKeywords
        .slice(0, 5)
        .join(", ")} if you genuinely possess them.`
    );
  }

  if (experienceRelevanceScore < 60) {
    recommendations.push(
      "Highlight experience and projects that directly demonstrate the responsibilities required by the position."
    );
  }

  if (!resume.professional_summary) {
    recommendations.push(
      "Add a concise professional summary targeted to the position."
    );
  }

  recommendations.push(
    "Use measurable achievements and specific technologies when describing experience and projects."
  );

  recommendations.push(
    "Keep the resume focused on requirements that are directly relevant to the target position."
  );

  // ----------------------------------------------------------
  // Summary
  // ----------------------------------------------------------

  let summary =
    `The resume has an estimated ATS compatibility score of ${atsScore}/100. `;

  if (atsScore >= 75) {
    summary +=
      "The resume shows strong alignment with the provided job description.";
  } else if (atsScore >= 50) {
    summary +=
      "The resume shows moderate alignment, but several areas can be improved.";
  } else {
    summary +=
      "The resume has limited alignment with the provided job description and would benefit from targeted improvements.";
  }

  return {
    atsScore,

    keywordMatchScore:
      clamp(keywordMatchScore),

    experienceRelevanceScore,

    skillsMatchScore:
      clamp(skillsMatchScore),

    matchedSkills:
      unique(matchedSkills),

    missingSkills:
      unique(missingSkills),

    matchedKeywords:
      unique(matchedKeywords),

    missingKeywords:
      unique(missingKeywords),

    strengths:
      unique(strengths),

    weaknesses:
      unique(weaknesses),

    recommendations:
      unique(recommendations),

    summary,
  };
}


// ============================================================
// POST
// ============================================================

export async function POST(
  request: Request
) {
  try {

    // --------------------------------------------------------
    // 1. Supabase client
    // --------------------------------------------------------

    const supabase =
      await createClient();


    // --------------------------------------------------------
    // 2. Authentication
    // --------------------------------------------------------

    const {
      data: claimsData,
      error: claimsError,
    } =
      await supabase.auth.getClaims();

    if (
      claimsError ||
      !claimsData?.claims
    ) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      claimsData.claims.sub;


    // --------------------------------------------------------
    // 3. Request body
    // --------------------------------------------------------

    const body =
      await request.json();

    const resume =
      body?.resume;

    const jobDescription =
      body?.jobDescription;

    if (!resume?.id) {
      return NextResponse.json(
        {
          error:
            "Resume is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof jobDescription !==
        "string" ||
      !jobDescription.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Job description is required.",
        },
        {
          status: 400,
        }
      );
    }


    // --------------------------------------------------------
    // 4. Verify resume belongs to user
    // --------------------------------------------------------

    const {
      data: ownedResume,
      error: ownedResumeError,
    } =
      await supabase
        .from("resumes")
        .select(
          "id, title, target_role"
        )
        .eq("id", resume.id)
        .eq("user_id", userId)
        .single();

    if (
      ownedResumeError ||
      !ownedResume
    ) {
      return NextResponse.json(
        {
          error:
            "Resume not found or access denied.",
        },
        {
          status: 403,
        }
      );
    }


    // --------------------------------------------------------
    // 5. Perform local ATS analysis
    // --------------------------------------------------------

    console.log(
      "Running local ATS analysis..."
    );

    const analysis =
      analyzeLocally(
        resume,
        jobDescription
      );


    // --------------------------------------------------------
    // 6. Save analysis
    // --------------------------------------------------------

    console.log(
      "Saving analysis to Supabase..."
    );

    const {
      data: savedAnalysis,
      error: saveError,
    } =
      await supabase
        .from("resume_analyses")
        .insert({
          user_id: userId,

          resume_id: resume.id,

          job_title:
            body?.jobTitle ||
            ownedResume.target_role ||
            "Resume Analysis",

          job_description:
            jobDescription.trim(),

          ats_score:
            analysis.atsScore,

          keyword_match_score:
            analysis.keywordMatchScore,

          experience_relevance_score:
            analysis
              .experienceRelevanceScore,

          skills_match_score:
            analysis.skillsMatchScore,

          matched_skills:
            analysis.matchedSkills,

          missing_skills:
            analysis.missingSkills,

          matched_keywords:
            analysis.matchedKeywords,

          missing_keywords:
            analysis.missingKeywords,

          strengths:
            analysis.strengths,

          weaknesses:
            analysis.weaknesses,

          recommendations:
            analysis.recommendations,

          summary:
            analysis.summary,
        })
        .select("id")
        .single();


    // --------------------------------------------------------
    // 7. Handle database error
    // --------------------------------------------------------

    if (saveError) {

      console.error(
        "Analysis save error:",
        saveError.message
      );

      return NextResponse.json(
        {
          success: true,

          saved: false,

          analysis,

          saveError:
            saveError.message,
        }
      );
    }


    // --------------------------------------------------------
    // 8. Success
    // --------------------------------------------------------

    console.log(
      "Analysis saved:",
      savedAnalysis.id
    );

    return NextResponse.json({
      success: true,

      saved: true,

      analysisId:
        savedAnalysis.id,

      analysis,
    });

  } catch (error) {

    console.error(
      "Resume analysis API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}