import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { ResumeEditor } from "@/components/resumes/resume-editor";


type PageProps = {
  params: Promise<{
    id: string;
  }>;
};


export default async function ResumeEditPage({
  params,
}: PageProps) {


  const { id } = await params;

  const supabase = await createClient();



  // Authentication

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();


  if (
    claimsError ||
    !claimsData?.claims
  ) {

    redirect("/auth/login");

  }



  const userId =
    claimsData.claims.sub;



  // Fetch resume

  const {
    data: resume,
    error: resumeError,
  } =
    await supabase
      .from("resumes")
      .select(
        `
        id,
        title,
        target_role,
        professional_summary,
        template_key,
        status,
        is_primary
        `
      )
      .eq(
        "id",
        id
      )
      .eq(
        "user_id",
        userId
      )
      .single();



  if (
    resumeError ||
    !resume
  ) {

    redirect(
      "/dashboard/resumes"
    );

  }




  // Fetch experiences

  const {
    data: experiences,
    error: experienceError,
  } =
    await supabase
      .from("resume_experiences")
      .select(
        `
        id,
        company_name,
        job_title,
        employment_type,
        start_date,
        end_date,
        description
        `
      )
      .eq(
        "resume_id",
        id
      )
      .order(
        "start_date",
        {
          ascending: false,
        }
      );



  if (experienceError) {

    console.error(
      "Unable to load experiences:",
      experienceError.message
    );

  }




  // Fetch education

 const {
  data: education,
  error: educationError,
} = await supabase
  .from("resume_education")
  .select(
    `
    id,
    institution_name,
    degree,
    field_of_study,
    location,
    start_date,
    end_date,
    is_current,
    grade,
    description
    `
  )
  .eq("resume_id", id)
  .order("sort_order", {
    ascending: true,
  });

  if (educationError) {

    console.error(
      "Unable to load education:",
      educationError.message
    );

  }
  const {
  data: projects,
  error: projectError,
} = await supabase
  .from("resume_projects")
  .select(
    `
    id,
    project_name,
    role,
    project_url,
    start_date,
    end_date,
    description,
    technologies
    `
  )
  .eq("resume_id", id)
  .order("sort_order", {
    ascending: true,
  });


if (projectError) {
  console.error(
    "Unable to load projects:",
    projectError.message
  );
}
const {
  data: skills,
  error: skillsError,
} = await supabase
  .from("resume_skills")
  .select(
    `
    id,
    skill_name,
    category,
    proficiency
    `
  )
  .eq("resume_id", id)
  .order("sort_order", {
    ascending: true,
  });

if (skillsError) {
  console.error(
    "Unable to load skills:",
    skillsError.message
  );
}




  return (

    <main className="min-h-screen bg-slate-950 text-slate-100">


      <div className="mx-auto max-w-7xl px-6 py-10">



        <Link
          href="/dashboard/resumes"
          className="text-sm text-slate-400 hover:text-white"
        >

          ← Back to Resumes

        </Link>





        <div className="mt-8">


          <p className="text-sm font-medium text-indigo-400">
            Resume Builder
          </p>



          <h1 className="mt-2 text-3xl font-bold">

            {resume.title}

          </h1>



          <p className="mt-2 text-slate-400">

            Build and customize your professional resume.

          </p>



        </div>






        <section className="mt-10">

<ResumeEditor
  resume={resume}
  experiences={experiences ?? []}
  education={education ?? []}
  projects={projects ?? []}
  skills={skills ?? []}
/>


        </section>





      </div>


    </main>

  );

}