import Link from "next/link";

import { NewResumeForm } from "@/components/resumes/new-resume-form";


export default function NewResumePage(){

  return (

    <main className="min-h-screen bg-slate-950 text-white">


      <div className="mx-auto max-w-3xl px-6 py-10">


        <Link
          href="/dashboard/resumes"
          className="text-slate-400 hover:text-white"
        >
          ← Back to Resumes
        </Link>



        <h1 className="mt-8 text-3xl font-bold">
          Create Resume
        </h1>


        <p className="mt-2 text-slate-400">
          Create a resume profile for your career applications.
        </p>




        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">


          <NewResumeForm />


        </section>



      </div>


    </main>

  );

}