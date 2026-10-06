import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";


export default async function ResumesPage() {

  const supabase = await createClient();


  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();


  if (
    claimsError ||
    !claimsData?.claims
  ) {
    redirect("/auth/login");
  }


  const userId =
    claimsData.claims.sub;



  const {
    data: resumes,
    error,
  } =
    await supabase
      .from("resumes")
      .select(
        `
        id,
        title,
        target_role,
        status,
        is_primary,
        created_at
        `
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending:false,
        }
      );


  if(error){
    console.log(error.message);
  }



  return (

    <main className="min-h-screen bg-slate-950 text-white">


      <div className="mx-auto max-w-7xl px-6 py-10">


        <div className="flex justify-between items-center">


          <div>

            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white"
            >
              ← Back to Dashboard
            </Link>


            <h1 className="mt-6 text-3xl font-bold">
              My Resumes
            </h1>


            <p className="mt-2 text-slate-400">
              Manage your professional resumes.
            </p>

          </div>



          <Link
            href="/dashboard/resumes/new"
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
          >
            + Create Resume
          </Link>


        </div>





        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">


        {
          !resumes ||
          resumes.length === 0 ? (

            <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">


              <h2 className="text-xl font-semibold">
                No resumes found
              </h2>


              <p className="mt-3 text-slate-400">
                Create your first resume.
              </p>


            </div>


          ) : (


            resumes.map((resume)=>(


              <div
                key={resume.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >


                <div className="flex justify-between">


                  <h2 className="font-semibold">
                    {resume.title}
                  </h2>


                  {
                    resume.is_primary && (

                      <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs">
                        Primary
                      </span>

                    )
                  }


                </div>



                <p className="mt-3 text-slate-400">
                  {
                    resume.target_role ||
                    "No target role"
                  }
                </p>



                <p className="mt-3 text-sm text-slate-500">
                  Status: {resume.status}
                </p>




                <Link
                  href={`/dashboard/resumes/${resume.id}/edit`}
                  className="mt-6 block rounded-xl bg-indigo-600 px-4 py-2 text-center font-medium hover:bg-indigo-500"
                >
                  Edit Resume
                </Link>


              </div>


            ))

          )
        }


        </section>


      </div>


    </main>

  );
}