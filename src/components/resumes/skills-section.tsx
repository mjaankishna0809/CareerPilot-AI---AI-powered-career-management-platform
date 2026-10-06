"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Skill = {
  id: string;
  skill_name: string;
  category: string | null;
  proficiency: string | null;
};

type SkillsSectionProps = {
  resumeId: string;
  skills: Skill[];
};

export function SkillsSection({
  resumeId,
  skills,
}: SkillsSectionProps) {
  const supabase = createClient();
  const router = useRouter();

  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState("");
  const [proficiency, setProficiency] = useState("Intermediate");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function addSkill() {
    setMessage("");

    if (!skillName.trim()) {
      setMessage("Skill name is required.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("resume_skills")
      .insert({
        resume_id: resumeId,
        skill_name: skillName.trim(),
        category: category.trim() || null,
        proficiency: proficiency || null,
        sort_order: skills.length,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
       router.refresh();
      return;
    }

    setMessage("Skill added successfully.");
    setSkillName("");
    setCategory("");
    setProficiency("Intermediate");
    setLoading(false);
  }

  async function deleteSkill(skillId: string) {
    const { error } = await supabase
      .from("resume_skills")
      .delete()
      .eq("id", skillId)
      .eq("resume_id", resumeId);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold text-white">
          Add Skill
        </h2>

        <div className="mt-6 space-y-5">
          <input
            placeholder="Skill name (e.g. React)"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          />

          <input
            placeholder="Category (e.g. Frontend)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          />

          <select
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>

          {message && (
            <p className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-300">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={addSkill}
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Skill"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          Skills
        </h2>

        <div className="mt-5 space-y-3">
          {skills.length === 0 ? (
            <p className="text-slate-400">
              No skills added yet.
            </p>
          ) : (
            skills.map((skill) => (
              <article
                key={skill.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-5"
              >
                <div>
                  <h3 className="font-semibold text-white">
                    {skill.skill_name}
                  </h3>

                  <div className="mt-1 flex gap-3 text-sm text-slate-400">
                    {skill.category && (
                      <span>{skill.category}</span>
                    )}

                    {skill.proficiency && (
                      <span>• {skill.proficiency}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteSkill(skill.id)}
                  className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:bg-red-950"
                >
                  Delete
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}