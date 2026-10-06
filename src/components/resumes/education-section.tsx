"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";


type Education = {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string | null;
  start_date: string;
  end_date: string | null;
  description: string | null;
};


type EducationSectionProps = {
  resumeId: string;
  education: Education[];
};



export function EducationSection({
  resumeId,
  education,
}: EducationSectionProps) {


  const supabase = createClient();
  const router = useRouter();


  const [institution, setInstitution] =
    useState("");

  const [degree, setDegree] =
    useState("");

  const [fieldOfStudy, setFieldOfStudy] =
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



  async function addEducation() {


    setLoading(true);
    setMessage("");



    const {
      error,
    } = await supabase
      .from("resume_education")
      .insert({

        resume_id: resumeId,

        institution_name:
          institution.trim(),

        degree:
          degree.trim(),

        field_of_study:
          fieldOfStudy.trim() || null,

        start_date:
          startDate,

        end_date:
          endDate || null,

        description:
          description.trim() || null,

      });



    if(error){

      setMessage(
        error.message
      );

      setLoading(false);

      return;
    }



    setMessage(
      "Education added successfully."
    );


    setInstitution("");
    setDegree("");
    setFieldOfStudy("");
    setStartDate("");
    setEndDate("");
    setDescription("");

    setLoading(false);
    router.refresh();

  }




  return (

    <div className="space-y-8">


      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">


        <h2 className="text-xl font-semibold text-white">
          Add Education
        </h2>



        <div className="mt-6 space-y-5">


          <input
            placeholder="Institution name"
            value={institution}
            onChange={(e)=>
              setInstitution(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          />



          <input
            placeholder="Degree"
            value={degree}
            onChange={(e)=>
              setDegree(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          />



          <input
            placeholder="Field of study"
            value={fieldOfStudy}
            onChange={(e)=>
              setFieldOfStudy(
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

            rows={4}

            placeholder="Description"

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

              <p className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-300">

                {message}

              </p>

            )
          }





          <button

            onClick={addEducation}

            disabled={loading}

            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"

          >

            {
              loading
              ? "Adding..."
              : "Add Education"
            }


          </button>



        </div>


      </section>





      <section>


        <h2 className="text-xl font-semibold text-white">
          Education History
        </h2>



        <div className="mt-5 space-y-4">


          {
            education.length === 0 ? (

              <p className="text-slate-400">
                No education added yet.
              </p>

            ) : (

              education.map((item)=>(

                <article
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
                >

                  <h3 className="font-semibold text-white">
                    {item.degree}
                  </h3>


                  <p className="text-slate-400">
                    {item.institution_name}
                  </p>


                  {
                    item.field_of_study && (

                      <p className="text-sm text-slate-500">
                        {item.field_of_study}
                      </p>

                    )
                  }



                  {
                    item.description && (

                      <p className="mt-3 text-sm text-slate-400">
                        {item.description}
                      </p>

                    )
                  }


                </article>

              ))

            )
          }


        </div>


      </section>


    </div>

  );
}