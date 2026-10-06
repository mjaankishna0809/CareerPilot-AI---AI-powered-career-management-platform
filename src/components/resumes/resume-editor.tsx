"use client";

import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { ProjectSection } from "./project-section";
import { SkillsSection } from "./skills-section";
import { ResumePreview } from "./resume-preview";

type ResumeEditorProps = {
  resume: {
    id: string;
    title: string;
    target_role: string | null;
    professional_summary: string | null;
    template_key: string;
    status: string;
    is_primary: boolean;
  };

  experiences: {
    id: string;
    company_name: string;
    job_title: string;
    employment_type: string | null;
    start_date: string;
    end_date: string | null;
    description: string | null;
  }[];

  education: {
    id: string;
    institution_name: string;
    degree: string;
    field_of_study: string | null;
    location: string | null;
    start_date: string;
    end_date: string | null;
    is_current?: boolean;
    grade?: string | null;
    description: string | null;
  }[];

  projects: {
    id: string;
    project_name: string;
    role: string;
    project_url: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    technologies: string[];
  }[];

  skills: {
    id: string;
    skill_name: string;
    category: string | null;
    proficiency: string | null;
  }[];
};

export function ResumeEditor({
  resume,
  experiences,
  education,
  projects,
  skills,
}: ResumeEditorProps) {
  return (
    <div className="space-y-8">

      {/* Builder controls */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

        <h2 className="text-lg font-semibold text-white">
          Resume Sections
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

          <SectionItem
            title="Basic Information"
            active
          />

          <SectionItem title="Experience" />

          <SectionItem title="Education" />

          <SectionItem title="Projects" />

          <SectionItem title="Skills" />

        </div>

      </section>


      {/* Resume preview */}

      <section>

        <div className="mb-5 flex items-center justify-between">

          <div>

            <p className="text-sm font-medium text-indigo-400">
              Live Preview
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              {resume.title}
            </h2>

          </div>

        </div>


        <ResumePreview
          resume={resume}
          experiences={experiences}
          education={education}
          projects={projects}
          skills={skills}
        />

      </section>


      {/* Editing sections */}

      <section className="space-y-8">

        <ExperienceSection
          resumeId={resume.id}
          experiences={experiences}
        />

        <EducationSection
          resumeId={resume.id}
          education={education}
        />

        <ProjectSection
          resumeId={resume.id}
          projects={projects}
        />

        <SkillsSection
          resumeId={resume.id}
          skills={skills}
        />

      </section>

    </div>
  );
}


function SectionItem({
  title,
  active = false,
}: {
  title: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-slate-800 text-slate-300"
      }`}
    >
      {title}
    </div>
  );
}