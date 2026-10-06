"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Project = {
  id: string;
  project_name: string;
  role: string | null;
  project_url: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  technologies: string[] | string | null;
};

type ProjectSectionProps = {
  resumeId: string;
  projects: Project[];
};

export function ProjectSection({
  resumeId,
  projects,
}: ProjectSectionProps) {
  const supabase = createClient();
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [role, setRole] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function addProject() {
    setMessage("");
    setMessageType("");

    if (!projectName.trim()) {
      setMessage("Project name is required.");
      setMessageType("error");
      return;
    }

    if (!role.trim()) {
      setMessage("Your role is required.");
      setMessageType("error");
      return;
    }

    if (!description.trim()) {
      setMessage("Project description is required.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const technologyList = technologies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("resume_projects")
      .insert({
        resume_id: resumeId,
        project_name: projectName.trim(),
        role: role.trim(),
        project_url: projectUrl.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        description: description.trim() || null,
        technologies: technologyList,
        sort_order: projects.length,
      });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setMessage("Project added successfully.");
    setMessageType("success");

    setProjectName("");
    setRole("");
    setProjectUrl("");
    setTechnologies("");
    setStartDate("");
    setEndDate("");
    setDescription("");

    setLoading(false);

    // Refresh server data so the new project appears immediately.
    router.refresh();
  }

  async function deleteProject(projectId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(projectId);
    setMessage("");
    setMessageType("");

    const { error } = await supabase
      .from("resume_projects")
      .delete()
      .eq("id", projectId)
      .eq("resume_id", resumeId);

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setDeletingId(null);
      return;
    }

    setMessage("Project deleted successfully.");
    setMessageType("success");

    setDeletingId(null);

    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Add Project */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div>
          <p className="text-sm font-medium text-indigo-400">
            Resume Projects
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Add Project
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Add projects that demonstrate your technical skills
            and practical experience.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {/* Project Name */}
          <div>
            <label
              htmlFor="projectName"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Project Name
            </label>

            <input
              id="projectName"
              type="text"
              placeholder="CareerPilot AI"
              value={projectName}
              onChange={(event) =>
                setProjectName(event.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="projectRole"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Your Role
            </label>

            <input
              id="projectRole"
              type="text"
              placeholder="Full Stack Developer"
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />
          </div>

          {/* Technologies */}
          <div>
            <label
              htmlFor="technologies"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Technologies
            </label>

            <input
              id="technologies"
              type="text"
              placeholder="Next.js, TypeScript, Supabase, Tailwind CSS"
              value={technologies}
              onChange={(event) =>
                setTechnologies(event.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />

            <p className="mt-2 text-xs text-slate-500">
              Separate technologies with commas.
            </p>
          </div>

          {/* Project URL */}
          <div>
            <label
              htmlFor="projectUrl"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Project URL
            </label>

            <input
              id="projectUrl"
              type="url"
              placeholder="https://github.com/username/project"
              value={projectUrl}
              onChange={(event) =>
                setProjectUrl(event.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />
          </div>

          {/* Dates */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="projectStartDate"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Start Date
              </label>

              <input
                id="projectStartDate"
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="projectEndDate"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                End Date
              </label>

              <input
                id="projectEndDate"
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="projectDescription"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Description
            </label>

            <textarea
              id="projectDescription"
              rows={6}
              placeholder="Describe what you built, your responsibilities, and the main achievements..."
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              disabled={loading}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />
          </div>

          {/* Message */}
          {message && (
            <div
              role={
                messageType === "error"
                  ? "alert"
                  : "status"
              }
              className={`rounded-xl border px-4 py-3 text-sm ${
                messageType === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* Add Button */}
          <button
            type="button"
            onClick={addProject}
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Adding Project..."
              : "Add Project"}
          </button>
        </div>
      </section>

      {/* Project History */}
      <section>
        <div>
          <p className="text-sm font-medium text-indigo-400">
            Saved Projects
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Project History
          </h2>
        </div>

        <div className="mt-5 space-y-4">
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-10 text-center">
              <p className="text-slate-400">
                No projects added yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add your first project using the form above.
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {project.project_name}
                    </h3>

                    <p className="mt-1 text-slate-400">
                      {project.role ||
                        "Role not specified"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      deleteProject(project.id)
                    }
                    disabled={
                      deletingId === project.id
                    }
                    className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950 disabled:opacity-50"
                  >
                    {deletingId === project.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>

                {/* Technologies */}
                {project.technologies &&
                  (Array.isArray(
                    project.technologies
                  )
                    ? project.technologies.length > 0
                    : project.technologies.length > 0) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Array.isArray(
                        project.technologies
                      ) ? (
                        project.technologies.map(
                          (technology, index) => (
                            <span
                              key={`${project.id}-tech-${index}`}
                              className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                            >
                              {technology}
                            </span>
                          )
                        )
                      ) : (
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {project.technologies}
                        </span>
                      )}
                    </div>
                  )}

                {/* Dates */}
                {(project.start_date ||
                  project.end_date) && (
                  <p className="mt-4 text-sm text-slate-500">
                    {project.start_date
                      ? formatDate(
                          project.start_date
                        )
                      : ""}
                    {" - "}
                    {project.end_date
                      ? formatDate(
                          project.end_date
                        )
                      : "Present"}
                  </p>
                )}

                {/* Description */}
                {project.description && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-400">
                    {project.description}
                  </p>
                )}

                {/* URL */}
                {project.project_url && (
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    View Project →
                  </a>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}