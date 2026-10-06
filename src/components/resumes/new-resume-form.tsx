"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function NewResumeForm() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [summary, setSummary] = useState("");
  const [templateKey, setTemplateKey] = useState("modern");
  const [isPrimary, setIsPrimary] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Resume title is required.");
      return;
    }

    if (!targetRole.trim()) {
      setErrorMessage("Target role is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get currently logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // Create resume
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title: title.trim(),
          target_role: targetRole.trim(),
          professional_summary: summary.trim() || null,
          template_key: templateKey,
          status: "draft",
          is_primary: isPrimary,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("Resume was not created.");
      }

      // Open the newly created resume
      router.push(
        `/dashboard/resumes/${data.id}/edit`
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create resume."
      );

      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Resume Title
        </label>

        <input
          id="title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Software Engineer Resume"
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="targetRole"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Target Role
        </label>

        <input
          id="targetRole"
          type="text"
          value={targetRole}
          onChange={(event) =>
            setTargetRole(event.target.value)
          }
          placeholder="Full Stack Developer"
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="summary"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Professional Summary
        </label>

        <textarea
          id="summary"
          rows={6}
          value={summary}
          onChange={(event) =>
            setSummary(event.target.value)
          }
          placeholder="Write a short professional summary..."
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="template"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Template
        </label>

        <select
          id="template"
          value={templateKey}
          onChange={(event) =>
            setTemplateKey(event.target.value)
          }
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
        >
          <option value="modern">
            Modern
          </option>

          <option value="classic">
            Classic
          </option>

          <option value="minimal">
            Minimal
          </option>
        </select>
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(event) =>
            setIsPrimary(event.target.checked)
          }
          disabled={isSubmitting}
          className="h-4 w-4"
        />

        Make this my primary resume
      </label>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Creating Resume..."
          : "Create Resume"}
      </button>
    </form>
  );
}