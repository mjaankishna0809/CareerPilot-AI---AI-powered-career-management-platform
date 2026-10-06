"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";


type Experience = {
  id: string;
  company_name: string;
  job_title: string;
  employment_type: string | null;
  start_date: string;
  end_date: string | null;
  description: string | null;
};


type ExperienceSectionProps = {
  resumeId: string;
  experiences: Experience[];
};



export function ExperienceSection({
  resumeId,
  experiences,
}: ExperienceSectionProps) {


  const supabase = createClient();
  const router = useRouter();


  const [companyName, setCompanyName] =
    useState("");

  const [jobTitle, setJobTitle] =
    useState("");

  const [employmentType, setEmploymentType] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [description, setDescription] =
    useState("");


  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);



  async function addExperience() {


    setLoading(true);
    setMessage("");



    if (!companyName.trim()) {

      setMessage(
        "Company name is required."
      );

     setLoading(false);
     router.refresh();
      return;

    }



    if (!jobTitle.trim()) {

      setMessage(
        "Job title is required."
      );

      setLoading(false);
      return;

    }




    const {
      error,
    } = await supabase
      .from("resume_experiences")
      .insert({

        resume_id: resumeId,

        company_name:
          companyName.trim(),

        job_title:
          jobTitle.trim(),

        employment_type:
          employmentType.trim() || null,

        start_date:
          startDate,

        end_date:
          endDate || null,

        description:
          description.trim() || null,

      });




    if (error) {

      setMessage(
        error.message
      );

      setLoading(false);

      return;

    }




    setMessage(
      "Experience added successfully."
    );


    setCompanyName("");
    setJobTitle("");
    setEmploymentType("");
    setStartDate("");
    setEndDate("");
    setDescription("");


    setLoading(false);

  }




  return (

    <div className="space-y-8">



      {/* Add Experience */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">


        <h2 className="text-xl font-semibold text-white">
          Add Experience
        </h2>



        <div className="mt-6 space-y-5">



          <input

            placeholder="Company name"

            value={companyName}

            onChange={(e)=>
              setCompanyName(
                e.target.value
              )
            }

            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"

          />





          <input

            placeholder="Job title"

            value={jobTitle}

            onChange={(e)=>
              setJobTitle(
                e.target.value
              )
            }

            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"

          />





          <input

            placeholder="Employment type (Internship, Full-time)"

            value={employmentType}

            onChange={(e)=>
              setEmploymentType(
                e.target.value
              )
            }

            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"

          />





          <div className="grid gap-5 sm:grid-cols-2">


            <div>

              <label className="mb-2 block text-sm text-slate-400">
                Start Date
              </label>


              <input

                type="date"

                value={startDate}

                onChange={(e)=>
                  setStartDate(
                    e.target.value
                  )
                }

                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"

              />


            </div>




            <div>


              <label className="mb-2 block text-sm text-slate-400">
                End Date
              </label>


              <input

                type="date"

                value={endDate}

                onChange={(e)=>
                  setEndDate(
                    e.target.value
                  )
                }

                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"

              />


            </div>


          </div>





          <textarea

            rows={5}

            placeholder="Describe your responsibilities and achievements"

            value={description}

            onChange={(e)=>
              setDescription(
                e.target.value
              )
            }

            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"

          />





          {
            message && (

              <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-300">

                {message}

              </div>

            )
          }





          <button

            onClick={addExperience}

            disabled={loading}

            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"

          >

            {
              loading
              ? "Adding..."
              : "Add Experience"
            }


          </button>



        </div>


      </section>






      {/* Experience History */}


      <section>


        <h2 className="text-xl font-semibold text-white">
          Experience History
        </h2>




        <div className="mt-5 space-y-4">



          {
            experiences.length === 0 ? (

              <p className="text-slate-400">
                No experience added yet.
              </p>


            ) : (


              experiences.map(
                (item)=>(

                  <article

                    key={item.id}

                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"

                  >


                    <h3 className="font-semibold text-white">

                      {item.job_title}

                    </h3>



                    <p className="text-slate-400">

                      {item.company_name}

                    </p>




                    {
                      item.employment_type && (

                        <p className="mt-1 text-sm text-slate-500">

                          {item.employment_type}

                        </p>

                      )
                    }





                    <p className="mt-3 text-sm text-slate-400">

                      {item.description}

                    </p>



                  </article>


                )
              )


            )
          }


        </div>


      </section>


    </div>

  );

}