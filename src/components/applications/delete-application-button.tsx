"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type DeleteApplicationButtonProps = {
  applicationId: string;
  companyName: string;
  position: string;
};

export function DeleteApplicationButton({
  applicationId,
  companyName,
  position,
}: DeleteApplicationButtonProps) {
  const router = useRouter();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    setErrorMessage("");
    setIsDeleting(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", applicationId);

    if (error) {
      setErrorMessage(error.message);
      setIsDeleting(false);
      return;
    }

    router.replace("/dashboard/applications");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded-xl border border-red-500/40 px-5 py-3 font-medium text-red-400 transition hover:bg-red-500/10"
      >
        Delete Application
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">
              Delete application?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              You are about to delete:
            </p>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-medium text-white">
                {position}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {companyName}
              </p>
            </div>

            <p className="mt-4 text-sm text-red-300">
              This action cannot be undone.
            </p>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting
                  ? "Deleting..."
                  : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}