"use client";

type ResumePreviewProps = {
  resume: {
    title: string;
    target_role: string | null;
    professional_summary: string | null;
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


export function ResumePreview({
  resume,
  experiences,
  education,
  projects,
  skills,
}: ResumePreviewProps) {
  return (
    <div className="mx-auto w-full max-w-4xl bg-white text-slate-900 shadow-2xl">

      {/* Header */}

      <header className="border-b-2 border-slate-900 px-10 py-8">

        <h1 className="text-4xl font-bold tracking-tight">
          {resume.title}
        </h1>

        <p className="mt-2 text-lg font-medium text-slate-600">
          {resume.target_role || "Professional"}
        </p>

      </header>


      <div className="px-10 py-8">


        {/* Summary */}

        {resume.professional_summary && (
          <section className="mb-8">

            <SectionTitle title="Professional Summary" />

            <p className="mt-3 leading-7 text-slate-700">
              {resume.professional_summary}
            </p>

          </section>
        )}



        {/* Experience */}

        <section className="mb-8">

          <SectionTitle title="Experience" />

          <div className="mt-5 space-y-6">

            {experiences.length === 0 ? (

              <p className="text-sm text-slate-500">
                No experience added.
              </p>

            ) : (

              experiences.map((item) => (

                <article key={item.id}>

                  <div className="flex flex-col justify-between gap-1 sm:flex-row">

                    <div>

                      <h3 className="text-lg font-bold">
                        {item.job_title}
                      </h3>

                      <p className="font-medium text-slate-600">
                        {item.company_name}
                      </p>

                    </div>

                    <div className="text-sm text-slate-500 sm:text-right">

                      <p>
                        {formatDate(item.start_date)}
                        {" - "}
                        {item.end_date
                          ? formatDate(item.end_date)
                          : "Present"}
                      </p>

                      {item.employment_type && (
                        <p>
                          {item.employment_type}
                        </p>
                      )}

                    </div>

                  </div>

                  {item.description && (
                    <p className="mt-3 whitespace-pre-line leading-6 text-slate-700">
                      {item.description}
                    </p>
                  )}

                </article>

              ))

            )}

          </div>

        </section>



        {/* Education */}

        <section className="mb-8">

          <SectionTitle title="Education" />

          <div className="mt-5 space-y-5">

            {education.length === 0 ? (

              <p className="text-sm text-slate-500">
                No education added.
              </p>

            ) : (

              education.map((item) => (

                <article key={item.id}>

                  <div className="flex flex-col justify-between gap-1 sm:flex-row">

                    <div>

                      <h3 className="text-lg font-bold">
                        {item.degree}
                      </h3>

                      <p className="font-medium text-slate-600">
                        {item.institution_name}
                      </p>

                      {item.field_of_study && (
                        <p className="text-sm text-slate-500">
                          {item.field_of_study}
                        </p>
                      )}

                    </div>

                    <div className="text-sm text-slate-500 sm:text-right">

                      <p>
                        {formatDate(item.start_date)}
                        {" - "}
                        {item.end_date
                          ? formatDate(item.end_date)
                          : "Present"}
                      </p>

                      {item.location && (
                        <p>{item.location}</p>
                      )}

                      {item.grade && (
                        <p>Grade: {item.grade}</p>
                      )}

                    </div>

                  </div>

                  {item.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.description}
                    </p>
                  )}

                </article>

              ))

            )}

          </div>

        </section>



        {/* Projects */}

        <section className="mb-8">

          <SectionTitle title="Projects" />

          <div className="mt-5 space-y-5">

            {projects.length === 0 ? (

              <p className="text-sm text-slate-500">
                No projects added.
              </p>

            ) : (

              projects.map((item) => (

                <article key={item.id}>

                  <div className="flex flex-col justify-between gap-1 sm:flex-row">

                    <div>

                      <h3 className="text-lg font-bold">
                        {item.project_name}
                      </h3>

                      <p className="font-medium text-slate-600">
                        {item.role}
                      </p>

                    </div>

                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        Project Link
                      </a>
                    )}

                  </div>

                  {item.technologies.length > 0 && (
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {item.technologies.join(" • ")}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                      {item.description}
                    </p>
                  )}

                </article>

              ))

            )}

          </div>

        </section>



        {/* Skills */}

        <section>

          <SectionTitle title="Skills" />

          <div className="mt-4 flex flex-wrap gap-2">

            {skills.length === 0 ? (

              <p className="text-sm text-slate-500">
                No skills added.
              </p>

            ) : (

              skills.map((skill) => (

                <span
                  key={skill.id}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-sm"
                >
                  {skill.skill_name}
                </span>

              ))

            )}

          </div>

        </section>


      </div>

    </div>
  );
}



function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <h2 className="border-b border-slate-300 pb-2 text-sm font-bold uppercase tracking-widest">
      {title}
    </h2>
  );
}



function formatDate(
  value: string
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric",
    }
  );
}